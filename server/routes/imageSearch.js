const express = require("express");
const multer = require("multer");
const Product = require("../models/Product");

const router = express.Router();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Use a JPG, PNG, or WebP image."));
    }
    callback(null, true);
  }
});

const words = (value) => String(value || "")
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter((word) => word.length > 2);

const unique = (values) => [...new Set(
  (values || []).map((value) => String(value || "").trim().toLowerCase()).filter(Boolean)
)];

router.post("/image-search", (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (!error) return next();
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to read the uploaded image."
    });
  });
}, async (req, res) => {
  const startedAt = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a product image." });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("[image-search] OPENAI_API_KEY is not configured");
      return res.status(503).json({
        success: false,
        message: "AI image search is not configured yet. Add OPENAI_API_KEY to the Render server environment."
      });
    }

    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const providerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.IMAGE_SEARCH_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You describe retail products from photos for catalog search. Return only JSON with keys: description (short plain text), itemType (short product type), category (likely catalog category), colors (array of visible colors), keywords (array of 5-12 short visual/product terms), material (short string), pattern (short string). Do not guess a brand or SKU unless clearly visible. Use empty strings or arrays for uncertain attributes."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this product photo to find similar items only in our own ecommerce catalog. Focus on item type, color, pattern, material and visible design details."
              },
              { type: "image_url", image_url: { url: dataUrl, detail: "low" } }
            ]
          }
        ]
      })
    });

    if (!providerResponse.ok) {
      const providerError = await providerResponse.text();
      console.error("[image-search] vision provider error", {
        status: providerResponse.status,
        body: providerError.slice(0, 350)
      });
      return res.status(providerResponse.status === 429 ? 503 : 502).json({
        success: false,
        message: providerResponse.status === 429
          ? "AI image search is busy right now. Please try again shortly."
          : "The image could not be analyzed. Please try again."
      });
    }

    const providerData = await providerResponse.json();
    let attributes;
    try {
      attributes = JSON.parse(providerData.choices?.[0]?.message?.content || "{}");
    } catch (_) {
      return res.status(502).json({
        success: false,
        message: "Could not interpret the image. Please try another photo."
      });
    }

    const terms = unique([
      attributes.itemType,
      attributes.category,
      attributes.material,
      attributes.pattern,
      ...(Array.isArray(attributes.colors) ? attributes.colors : []),
      ...(Array.isArray(attributes.keywords) ? attributes.keywords : [])
    ]).slice(0, 18);

    // Only active, in-stock products are eligible for visual-search results.
    const catalog = await Product.find({ isActive: { $ne: false }, stock: { $gt: 0 } })
      .select("name category subCategory brand collection productType material color type keywords tags images sku price finalPrice discount stock rating isActive isFeatured")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(1000)
      .lean();

    const searchTokens = unique(terms.flatMap(words));
    const rankedProducts = catalog.map((product) => {
      const fields = [
        product.name, product.category, product.subCategory, product.brand,
        product.collection, product.productType, product.material, product.type,
        product.sku, ...(product.color || []), ...(product.keywords || []), ...(product.tags || [])
      ];
      const productTokens = unique(fields.flatMap(words));
      let score = 0;

      for (const term of terms) {
        const termTokens = words(term);
        if (!termTokens.length) continue;
        const matched = termTokens.filter((word) => productTokens.includes(word)).length;
        if (matched) score += (matched / termTokens.length) * (termTokens.length > 1 ? 2 : 1);
      }

      score += searchTokens.filter((token) => productTokens.includes(token)).length * 0.15;
      if (product.isFeatured) score += 0.05;
      return { product, score };
    })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map(({ product, score }, index) => ({
        ...product,
        matchScore: Math.max(1, Math.min(99, Math.round(30 + score * 8 - index * 0.4)))
      }));

    console.info("[image-search] completed", {
      durationMs: Date.now() - startedAt,
      catalogSize: catalog.length,
      resultCount: rankedProducts.length,
      detectedCategory: String(attributes.category || attributes.itemType || "unknown").slice(0, 80)
    });

    return res.json({
      success: true,
      description: String(attributes.description || "Products matched by visible colors, pattern and product type.").slice(0, 240),
      attributes: {
        itemType: String(attributes.itemType || "").slice(0, 80),
        category: String(attributes.category || "").slice(0, 80),
        colors: Array.isArray(attributes.colors) ? attributes.colors.slice(0, 6) : [],
        keywords: Array.isArray(attributes.keywords) ? attributes.keywords.slice(0, 12) : []
      },
      count: rankedProducts.length,
      products: rankedProducts
    });
  } catch (error) {
    console.error("[image-search] unexpected error", {
      message: String(error.message || error).slice(0, 300)
    });
    return res.status(500).json({ success: false, message: "Image search failed. Please try again." });
  }
});

module.exports = router;
