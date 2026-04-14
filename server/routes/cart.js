const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Get cart for a user
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate("items.productId");
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add product to cart
router.post("/", async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId) return res.status(400).json({ message: "Missing userId or productId" });

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not available" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product already exists
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      // Update quantity
      const nextQuantity = cart.items[itemIndex].quantity + quantity;
      if (nextQuantity < 1) {
        return res.status(400).json({ message: "Quantity should be at least 1" });
      }
      if (nextQuantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
      }
      cart.items[itemIndex].quantity = nextQuantity;
    } else {
      if ((quantity || 1) > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
      }
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ userId }).populate("items.productId");
    res.json(populatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Remove item from cart
router.delete("/removeItem/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();

    res.json({ message: "Item removed successfully", cart });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to remove item" });
  }
});
module.exports = router;
