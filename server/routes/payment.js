const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer"); // Import multer

// Configure Multer for memory storage (to handle file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Create a Payment Session and Generate UPI QR Details ---
router.post("/create-session", async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      customerDetails,
      couponCode = "",
      discountAmount = 0,
      deliveryCharge = 0,
      totalAmount
    } = req.body;

    // 1. Validate required fields
    if (!userId || !cartItems || !customerDetails) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, cartItems, or customerDetails"
      });
    }

    // 2. Validate customerDetails
    if (!customerDetails.name || !customerDetails.mobile || !customerDetails.address) {
      return res.status(400).json({
        success: false,
        error: "Missing customer details: name, mobile, or address"
      });
    }

    // 3. Recalculate total amount from cartItems
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          error: `Product ${product?.name || item.productId} is unavailable`
        });
      }

      const unitPrice = item.discountedPrice || item.originalPrice || product.finalPrice || product.price;
      calculatedTotal += unitPrice * item.quantity;

      orderItems.push({
        productId: item.productId,
        sku: item.sku || product.sku || "",
        quantity: item.quantity,
        originalPrice: item.originalPrice || product.price,
        discountedPrice: unitPrice,
        lineTotal: unitPrice * item.quantity
      });
    }

    // 4. Apply discounts and delivery charges
    const finalAmount = Math.round(
      calculatedTotal - (discountAmount || 0) + (deliveryCharge || 0)
    );

    // 5. Validate frontend total matches backend calculation
    if (finalAmount !== totalAmount) {
      return res.status(400).json({
        success: false,
        error: `Amount mismatch: Frontend (${totalAmount}) vs Backend (${finalAmount})`
      });
    }

    // 6. Generate a unique order ID
    const orderId = `ORDER_${uuidv4().toUpperCase().slice(0, 8)}`;

    // 7. Get UPI ID from .env
    const upiId = process.env.UPI_ID;
    if (!upiId) {
      return res.status(500).json({
        success: false,
        error: "UPI_ID not configured in .env"
      });
    }

    // 8. Generate UPI QR URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=AROHA HUB&am=${finalAmount}&cu=INR`;

    // 9. Create a temporary order
    const newOrder = new Order({
      orderId,
      userId,
      items: orderItems,
      customerName: customerDetails.name,
      customerMobile: customerDetails.mobile,
      deliveryAddress: customerDetails.address,
      customerLocation: customerDetails.location || null,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || "",
      subtotalAmount: calculatedTotal,
      deliveryCharge: deliveryCharge || 0,
      totalAmount: finalAmount,
      status: "Payment Verification Pending",
      paymentMethod: "UPI QR",
      upiId,
      upiUrl
    });
    await newOrder.save();

    // 10. Return payment session details
    res.json({
      success: true,
      orderId,
      upiUrl,
      upiId,
      amount: finalAmount,
      customerDetails,
      orderItems: orderItems
    });

  } catch (err) {
    console.error("Payment session error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create payment session",
      details: err.message
    });
  }
});

// --- Verify Payment and Update Order Status ---
// NOTE: We add 'upload.single("screenshot")' here to handle the file
router.post("/verify-payment", upload.single("screenshot"), async (req, res) => {
  try {
    // Multer parses text fields into req.body and file into req.file
    const { orderId, transactionId, ocrData } = req.body;
    const screenshotFile = req.file; 

    // 1. Validate required fields
    if (!orderId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: orderId or transactionId"
      });
    }

    // 2. Fetch the order
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // 3. Validate OCR data (amount must match order amount)
    // Note: ocrData comes in as a string from FormData, so we parse it
    let parsedOcrData = {};
    try {
        parsedOcrData = typeof ocrData === 'string' ? JSON.parse(ocrData) : ocrData;
    } catch (e) {
        console.log("OCR data parsing failed, using empty object");
    }

    if (parsedOcrData && parsedOcrData.amount && parsedOcrData.amount !== order.totalAmount) {
      return res.status(400).json({
        success: false,
        error: `OCR amount (${parsedOcrData.amount}) does not match order amount (${order.totalAmount})`
      });
    }

    // 4. Check for duplicate transaction ID
    const existingOrder = await Order.findOne({ transactionId });
    if (existingOrder && existingOrder.orderId !== orderId) {
      return res.status(400).json({
        success: false,
        error: "Duplicate transaction ID used in another order"
      });
    }

    // 5. Update order with payment details
    order.transactionId = transactionId;
    order.ocrData = parsedOcrData || {};
    
    // If you want to save the actual image buffer to DB (ensure your schema supports Buffer or Base64)
    // For now, we just mark that a screenshot was uploaded
    order.screenshotUploaded = true; 
    order.status = "Payment Verification Pending";
    order.paymentVerifiedAt = null;
    order.paymentVerifiedBy = null;

    await order.save();

    res.json({
      success: true,
      message: "Payment details submitted. Awaiting verification.",
      orderId: order.orderId
    });

  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
      details: err.message
    });
  }
});

module.exports = router;