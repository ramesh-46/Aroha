const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const validId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const normalizeVariant = (value) => String(value || "").trim();

async function loadCart(userId) {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart) return { userId, items: [] };
  cart.items = cart.items.filter((item) => item.productId);
  return cart;
}

router.get("/:userId", async (req, res) => {
  const requestId = require("crypto").randomUUID();
  try {
    if (!validId(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
    const cart = await loadCart(req.params.userId);
    console.info("[Cart]", requestId, "FETCH_OK", { userId: req.params.userId, itemCount: cart.items.length });
    res.set("Cache-Control", "no-store");
    return res.json(cart);
  } catch (err) {
    console.error("[Cart]", requestId, "FETCH_FAILED", err.message);
    return res.status(500).json({ success: false, message: "Unable to load cart." });
  }
});

router.post("/", async (req, res) => {
  const requestId = require("crypto").randomUUID();
  const userId = String(req.body?.userId || "");
  const productId = String(req.body?.productId || "");
  const quantity = Number(req.body?.quantity ?? 1);
  const size = normalizeVariant(req.body?.size);
  const color = normalizeVariant(req.body?.color);
  try {
    if (!validId(userId) || !validId(productId)) return res.status(400).json({ success: false, message: "A valid userId and productId are required." });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, message: "Quantity must be a positive whole number." });

    const product = await Product.findById(productId).select("_id name stock isActive size color");
    if (!product || product.isActive === false) return res.status(404).json({ success: false, message: "Product is not available." });
    if (quantity > Number(product.stock || 0)) return res.status(400).json({ success: false, message: `Only ${product.stock || 0} items are available.` });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const sameVariant = (item) =>
      String(item.productId) === productId &&
      normalizeVariant(item.size) === size &&
      normalizeVariant(item.color) === color;
    const index = cart.items.findIndex(sameVariant);
    const nextQuantity = index >= 0 ? Number(cart.items[index].quantity || 0) + quantity : quantity;
    if (nextQuantity > Number(product.stock || 0)) return res.status(400).json({ success: false, message: `Only ${product.stock || 0} items are available for this product.` });

    if (index >= 0) cart.items[index].quantity = nextQuantity;
    else cart.items.push({ productId, quantity, size, color });

    await cart.save();
    const populated = await loadCart(userId);
    console.info("[Cart]", requestId, "ADD_OK", { userId, productId, quantityAdded: quantity, finalQuantity: nextQuantity, size, color, itemCount: populated.items.length });
    return res.status(200).json({ success: true, message: "Added to cart.", ...populated.toObject?.() ? populated.toObject() : populated });
  } catch (err) {
    console.error("[Cart]", requestId, "ADD_FAILED", { userId, productId, message: err.message });
    return res.status(500).json({ success: false, message: "Unable to save cart item." });
  }
});

router.delete("/removeItem/:userId/:productId", async (req, res) => {
  const requestId = require("crypto").randomUUID();
  const { userId, productId } = req.params;
  try {
    if (!validId(userId) || !validId(productId)) return res.status(400).json({ success: false, message: "Invalid user or product ID." });
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });
    cart.items = cart.items.filter((item) => String(item.productId) !== productId);
    await cart.save();
    console.info("[Cart]", requestId, "REMOVE_OK", { userId, productId, remainingItems: cart.items.length });
    return res.json({ success: true, message: "Item removed successfully.", cart });
  } catch (err) {
    console.error("[Cart]", requestId, "REMOVE_FAILED", err.message);
    return res.status(500).json({ success: false, message: "Failed to remove item." });
  }
});

module.exports = router;
