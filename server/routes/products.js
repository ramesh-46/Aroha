const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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

// --------------------
// Add product with multiple images
// POST /products
// --------------------
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { name, category, subCategory, brand, price, discount, finalPrice, color, size, type } = req.body;

    // Create product without images first
    const newProduct = new Product({
      name,
      category,
      subCategory,
      brand,
      price,
      discount,
      finalPrice,
      color,
      size: size ? size.split(",") : [],
      type,
      images: [],
    });
    await newProduct.save();

    // Rename uploaded files using product _id
    const imageFilenames = req.files.map((file, idx) => {
      const ext = path.extname(file.originalname);
      const newName = `${newProduct._id}-${idx + 1}${ext}`;
      const newPath = path.join(path.dirname(file.path), newName);
      fs.renameSync(file.path, newPath);
      return newName;
    });

    newProduct.images = imageFilenames;
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
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --------------------
// Search products
// --------------------
router.get("/search", async (req, res) => {
  const { q, category, subCategory } = req.query;
  const query = {};
  if (q) query.name = { $regex: q, $options: "i" };
  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;

  try {
    const results = await Product.find(query);
    res.json(results);
  } catch (err) {
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
      deleted.images.forEach(img => {
        const filePath = path.join(__dirname, "../uploads", img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
