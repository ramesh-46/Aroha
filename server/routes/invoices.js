const express = require("express");
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Generate an itemized Aroha invoice/transaction statement for the signed-in customer.
router.get("/:orderId/pdf", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ orderId: req.params.orderId }, { _id: req.params.orderId }],
      userId: req.user.id
    }).populate("items.productId", "name brand category sku price finalPrice images");

    if (!order) return res.status(404).json({ success: false, message: "Order not found for this account." });

    const paid = order.status === "Payment Verified";
    const failed = order.status === "Payment Failed";
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Aroha-Invoice-${order.orderId || order._id}.pdf"`);
    doc.pipe(res);

    const ink = "#172033";
    const muted = "#64748b";
    const accent = "#6d28d9";
    const money = (value) => "INR " + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.rect(0, 0, 595, 118).fill("#f3f0ff");
    doc.fillColor(accent).fontSize(25).font("Helvetica-Bold").text("AROHA", 48, 38);
    doc.fillColor(ink).fontSize(10).font("Helvetica").text("ONLINE STORE", 49, 69);
    doc.fillColor(ink).fontSize(20).font("Helvetica-Bold").text(paid ? "PAYMENT RECEIPT" : failed ? "PAYMENT FAILED STATEMENT" : "ORDER INVOICE", 300, 42, { width: 245, align: "right" });
    doc.fillColor(failed ? "#b91c1c" : paid ? "#047857" : "#b45309").fontSize(10).font("Helvetica-Bold").text(failed ? "NOT PAID" : paid ? "PAID" : "PAYMENT PENDING", 300, 72, { width: 245, align: "right" });

    let y = 145;
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(11).text("ORDER & CUSTOMER DETAILS", 48, y);
    y += 22;
    const left = [
      ["Order ID", order.orderId || String(order._id)],
      ["Invoice date", new Date().toLocaleDateString("en-IN")],
      ["Order date", new Date(order.createdAt).toLocaleString("en-IN")],
      ["Customer", order.customerName || "Customer"],
      ["Mobile", order.customerMobile || "Not provided"],
      ["Delivery address", order.deliveryAddress || "Not provided"]
    ];
    left.forEach(([label, value]) => {
      doc.fillColor(muted).font("Helvetica").fontSize(9).text(label, 48, y, { width: 115 });
      doc.fillColor(ink).font("Helvetica").fontSize(9).text(String(value), 165, y, { width: 380 });
      y += label === "Delivery address" ? 30 : 17;
    });

    y += 8;
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(11).text("PRODUCT DETAILS", 48, y);
    y += 22;
    doc.rect(48, y, 499, 25).fill("#eef2ff");
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(8);
    doc.text("PRODUCT / SKU", 55, y + 8, { width: 220 });
    doc.text("QTY", 290, y + 8, { width: 35, align: "right" });
    doc.text("UNIT PRICE", 340, y + 8, { width: 85, align: "right" });
    doc.text("AMOUNT", 435, y + 8, { width: 105, align: "right" });
    y += 33;

    for (const item of order.items || []) {
      if (y > 690) { doc.addPage(); y = 55; }
      const product = item.productSnapshot || item.productId || {};
      const title = product.name || "Product";
      const sku = item.sku || product.sku || "";
      const quantity = Number(item.quantity || 0);
      const unit = Number(item.discountedPrice || product.finalPrice || product.price || 0);
      const line = Number(item.lineTotal || unit * quantity);
      doc.fillColor(ink).font("Helvetica-Bold").fontSize(9).text(String(title), 55, y, { width: 220 });
      doc.fillColor(muted).font("Helvetica").fontSize(7).text([product.brand, product.category, sku ? "SKU: " + sku : ""].filter(Boolean).join(" • "), 55, y + 13, { width: 220 });
      doc.fillColor(ink).fontSize(9).text(String(quantity), 290, y + 4, { width: 35, align: "right" });
      doc.text(money(unit), 340, y + 4, { width: 85, align: "right" });
      doc.text(money(line), 435, y + 4, { width: 105, align: "right" });
      y += 36;
      doc.moveTo(48, y - 4).lineTo(547, y - 4).strokeColor("#e2e8f0").stroke();
    }

    y += 12;
    const rows = [
      ["Subtotal", order.subtotalAmount || (order.items || []).reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)],
      ["Discount", -Number(order.discountAmount || 0)],
      ["Delivery charge", Number(order.deliveryCharge || 0)],
      ["TOTAL AMOUNT", Number(order.totalAmount || 0)]
    ];
    rows.forEach(([label, value], index) => {
      doc.fillColor(index === 3 ? accent : muted).font(index === 3 ? "Helvetica-Bold" : "Helvetica").fontSize(index === 3 ? 12 : 9);
      doc.text(label, 320, y, { width: 105 });
      doc.fillColor(ink).text(money(Math.abs(value)), 430, y, { width: 110, align: "right" });
      y += index === 3 ? 25 : 18;
    });

    y += 10;
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(10).text("PAYMENT INFORMATION", 48, y);
    y += 19;
    const paymentRows = [
      ["Payment method", order.paymentMethod || "Not recorded"],
      ["Payment status", order.status || "Pending"],
      ["Transaction ID", order.transactionId || order.razorpayPaymentId || "Not available"],
      ["Gateway order ID", order.razorpayOrderId || "Not available"]
    ];
    if (failed && order.paymentFailureReason) paymentRows.push(["Failure reason", order.paymentFailureReason]);
    paymentRows.forEach(([label, value]) => {
      doc.fillColor(muted).font("Helvetica").fontSize(8).text(label, 48, y, { width: 115 });
      doc.fillColor(ink).text(String(value), 165, y, { width: 380 });
      y += 15;
    });

    y += 18;
    doc.fillColor(muted).font("Helvetica").fontSize(8).text(
      paid ? "This document confirms that the payment was verified as captured." :
      failed ? "This is a payment attempt record only. No payment was received for this order." :
      "This is an order statement. Payment is not yet confirmed as captured.",
      48, y, { width: 499, align: "center" }
    );
    y += 18;
    doc.fillColor(muted).fontSize(8).text("Thank you for shopping with Aroha.", 48, y, { width: 499, align: "center" });
    doc.end();
  } catch (error) {
    console.error("Invoice generation failed:", error.message);
    if (!res.headersSent) res.status(500).json({ success: false, message: "Unable to generate invoice PDF." });
    else res.end();
  }
});

module.exports = router;
