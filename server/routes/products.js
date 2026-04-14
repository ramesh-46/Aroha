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

const buildProductQuery = ({ q, category, subCategory, sellerId, productId, minPrice, maxPrice, minDiscount, sizes, brands }) => {
  const query = {};

  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;
  if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
    query.sellerId = sellerId;
  }
  if (minDiscount) {
    query.discount = { ...(query.discount || {}), $gte: Number(minDiscount) || 0 };
  }
  if (minPrice || maxPrice) {
    query.finalPrice = {};
    if (minPrice) query.finalPrice.$gte = Number(minPrice) || 0;
    if (maxPrice) query.finalPrice.$lte = Number(maxPrice) || 0;
  }
  if (sizes) {
    const normalizedSizes = `${sizes}`.split(",").map((item) => item.trim()).filter(Boolean);
    if (normalizedSizes.length > 0) {
      query.size = { $in: normalizedSizes };
    }
  }
  if (brands) {
    const normalizedBrands = `${brands}`.split(",").map((item) => item.trim()).filter(Boolean);
    if (normalizedBrands.length > 0) {
      query.brand = { $in: normalizedBrands };
    }
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
const sortProductsForDisplay = (products) => (
  [...products].sort((a, b) => {
    const aOut = (a.stock || 0) <= 0 ? 1 : 0;
    const bOut = (b.stock || 0) <= 0 ? 1 : 0;
    if (aOut !== bOut) return aOut - bOut;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
);

// --------------------
// Add product with multiple images
// POST /products
// --------------------
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const payload = getProductPayload(req.body);

    // Auto-generate SKU if not provided
    if (!payload.sku) {
      const categoryStr = payload.category && typeof payload.category === 'string' 
        ? payload.category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() 
        : 'GEN';
      
      // Look for the highest SKU in this category to generate a sequential number
      const lastProduct = await Product.findOne({ category: payload.category, sku: { $regex: `^${categoryStr}` } })
                                       .sort({ createdAt: -1 });
      
      let nextNumber = 1;
      if (lastProduct && lastProduct.sku) {
        const match = lastProduct.sku.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        } else {
          const count = await Product.countDocuments({ category: payload.category });
          nextNumber = count + 1;
        }
      }

      let sequentialNumber = nextNumber.toString().padStart(4, '0');
      let newSku = `${categoryStr}${sequentialNumber}`;
      
      // Ensure absolute uniqueness
      while (await Product.findOne({ sku: newSku })) {
        nextNumber++;
        sequentialNumber = nextNumber.toString().padStart(4, '0');
        newSku = `${categoryStr}${sequentialNumber}`;
      }
      
      payload.sku = newSku;
    }

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
    res.json(sortProductsForDisplay(products));
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
    const results = await Product.find(query).sort({ createdAt: -1 });
    res.json(sortProductsForDisplay(results));
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

// --------------------
// Get next sequential SKU based on category
// --------------------
router.get("/next-sku/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const categoryStr = category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    
    const lastProduct = await Product.findOne({ category: category, sku: { $regex: `^${categoryStr}` } })
                                     .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastProduct && lastProduct.sku) {
      const match = lastProduct.sku.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      } else {
        const count = await Product.countDocuments({ category: category });
        nextNumber = count + 1;
      }
    }

    let sequentialNumber = nextNumber.toString().padStart(4, '0');
    let newSku = `${categoryStr}${sequentialNumber}`;
    
    while (await Product.findOne({ sku: newSku })) {
      nextNumber++;
      sequentialNumber = nextNumber.toString().padStart(4, '0');
      newSku = `${categoryStr}${sequentialNumber}`;
    }

    res.json({ success: true, sku: newSku });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
