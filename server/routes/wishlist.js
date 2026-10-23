
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// Get a user's wishlist
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const wishlist = await Wishlist.findOne({ userId })
      .populate("items");

    return res.json({ items: wishlist ? wishlist.items : [] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

// Add a product to the wishlist
router.post("/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid user or product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $addToSet: { items: productId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("items");

    return res.json({
      success: true,
      message: "Added to wishlist",
      items: wishlist.items
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add to wishlist" });
  }
});

// Remove a product from the wishlist
router.delete("/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { items: productId } },
      { new: true }
    ).populate("items");

    return res.json({
      success: true,
      items: wishlist ? wishlist.items : []
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove from wishlist" });
  }
});

module.exports = router;
