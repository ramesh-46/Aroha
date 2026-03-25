const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// --------------------
// Multer setup for multiple images
// --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

const parseField = (value, fallback = value) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const normalizeArray = (value) => {
  if (value === undefined || value === null || value === "") return [];

  const parsed = parseField(value, value);
  if (Array.isArray(parsed)) {
    return parsed.filter(Boolean).map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeObject = (value) => {
  const parsed = parseField(value, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return value === "true" || value === true;
};

const buildImageList = (files, productId) => {
  if (!files || files.length === 0) return [];

  return files.map((file, idx) => {
    const ext = path.extname(file.originalname);
    const newName = `${productId}-${Date.now()}-${idx + 1}${ext}`;
    const newPath = path.join(path.dirname(file.path), newName);
    fs.renameSync(file.path, newPath);
    return newName;
  });
};

const removeStoredImages = (images = []) => {
  images.forEach((img) => {
    if (!img || img.startsWith("http://") || img.startsWith("https://")) return;
    const filePath = path.join(__dirname, "../uploads", img);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

const buildProductQuery = ({ q, category, subCategory, sellerId, productId }) => {
  const query = {};

  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;
  if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
    query.sellerId = sellerId;
  }

  const exactId = productId || q;
  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    query._id = productId;
    return query;
  }

  if (q) {
    if (mongoose.Types.ObjectId.isValid(exactId)) {
      query.$or = [
        { _id: exactId },
        { name: { $regex: q, $options: "i" } }
      ];
    } else {
      query.name = { $regex: q, $options: "i" };
    }
  }

  return query;
};

const getProductPayload = (body) => {
  const payload = {};
  const stringFields = [
    "name",
    "category",
    "subCategory",
    "brand",
    "collection",
    "sellerName",
    "soldBy",
    "type",
    "material",
    "productType",
    "sku"
  ];

  stringFields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
  });

  if (body.sellerId && mongoose.Types.ObjectId.isValid(body.sellerId)) {
    payload.sellerId = body.sellerId;
  }

  ["price", "discount", "finalPrice", "stock", "weight"].forEach((field) => {
    const normalized = normalizeNumber(body[field]);
    if (normalized !== undefined) payload[field] = normalized;
  });

  ["color", "size", "images", "keywords", "tags"].forEach((field) => {
    if (body[field] !== undefined) payload[field] = normalizeArray(body[field]);
  });

  if (body.dimensions !== undefined) {
    const dimensions = normalizeObject(body.dimensions);
    payload.dimensions = {
      length: normalizeNumber(dimensions.length) || 0,
      width: normalizeNumber(dimensions.width) || 0,
      height: normalizeNumber(dimensions.height) || 0
    };
  }

  ["isFeatured", "isActive"].forEach((field) => {
    const normalized = normalizeBoolean(body[field]);
    if (normalized !== undefined) payload[field] = normalized;
  });

  return payload;
};

const roundCurrency = (value) => Math.max(0, Number(value.toFixed(2)));

// --------------------
// Add product with multiple images
// POST /products
// --------------------
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const payload = getProductPayload(req.body);
    const newProduct = new Product({
      ...payload,
      soldBy: payload.soldBy || "AROHA"
    });

    const uploadedImages = buildImageList(req.files, newProduct._id);
    if (uploadedImages.length > 0) {
      newProduct.images = [...(payload.images || []), ...uploadedImages];
    }

    await newProduct.save();

    res.json({ success: true, product: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// --------------------
// Get all products
// --------------------
router.get("/", async (req, res) => {
  try {
    const query = buildProductQuery(req.query);
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------------
// Search products
// --------------------
router.get("/search", async (req, res) => {
  try {
    const query = buildProductQuery(req.query);
    const results = await Product.find(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------------
// Get product attributes dynamically
// --------------------
router.get("/attributes", async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    const categoriesAggregation = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          subCategories: { $addToSet: "$subCategory" },
          types: { $addToSet: "$type" }
        }
      }
    ]);

    const categories = [];
    const subCategories = {};
    const categoryTypes = {};

    categoriesAggregation.forEach(cat => {
      if (cat._id) {
        categories.push(cat._id);
        subCategories[cat._id] = cat.subCategories.filter(Boolean);
        categoryTypes[cat._id] = cat.types.filter(Boolean);
      }
    });

    res.json({
      brands: brands.filter(Boolean),
      categories,
      subCategories,
      categoryTypes
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/bulk-price-update", async (req, res) => {
  const {
    sellerId,
    applyTo,
    adjustmentType,
    operation,
    value,
    productIds = [],
    categories = []
  } = req.body;

  if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: "Valid sellerId is required" });
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue < 0) {
    return res.status(400).json({ message: "Valid price change value is required" });
  }

  if (!["all", "selectedProducts", "selectedCategories"].includes(applyTo)) {
    return res.status(400).json({ message: "Invalid price update target" });
  }

  if (!["fixed", "percentage"].includes(adjustmentType)) {
    return res.status(400).json({ message: "Invalid adjustment type" });
  }

  if (!["increase", "decrease"].includes(operation)) {
    return res.status(400).json({ message: "Invalid price operation" });
  }

  try {
    const query = { sellerId };

    if (applyTo === "selectedProducts") {
      const validProductIds = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validProductIds.length === 0) {
        return res.status(400).json({ message: "Select at least one product" });
      }
      query._id = { $in: validProductIds };
    }

    if (applyTo === "selectedCategories") {
      const normalizedCategories = categories.filter(Boolean);
      if (normalizedCategories.length === 0) {
        return res.status(400).json({ message: "Select at least one category" });
      }
      query.category = { $in: normalizedCategories };
    }

    const products = await Product.find(query);
    if (products.length === 0) {
      return res.status(404).json({ message: "No matching products found for this price update" });
    }

    for (const product of products) {
      let updatedPrice = product.price;

      if (adjustmentType === "fixed") {
        updatedPrice = operation === "increase"
          ? product.price + numericValue
          : product.price - numericValue;
      } else {
        const delta = (product.price * numericValue) / 100;
        updatedPrice = operation === "increase"
          ? product.price + delta
          : product.price - delta;
      }

      product.price = roundCurrency(updatedPrice);
      await product.save();
    }

    const updatedProducts = await Product.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      updatedCount: products.length,
      products: updatedProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    const payload = getProductPayload(req.body);
    const uploadedImages = buildImageList(req.files, existingProduct._id);

    if (payload.images) {
      const imagesToRemove = existingProduct.images.filter((img) => !payload.images.includes(img));
      removeStoredImages(imagesToRemove);
    }

    if (uploadedImages.length > 0) {
      payload.images = [...(payload.images || existingProduct.images || []), ...uploadedImages];
    }

    Object.assign(existingProduct, payload);
    await existingProduct.save();

    res.json({ success: true, product: existingProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// --------------------
// Delete product
// --------------------
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    if (deleted.images && deleted.images.length > 0) {
      removeStoredImages(deleted.images);
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
