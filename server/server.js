// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

// Route imports
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const sellerAuthe = require("./routes/sellerAuth");
// const promotion = require("./routes/promotion");
const couponRoutes = require("./routes/coupons");
const settingsRoutes = require("./routes/settings");
const supportRoutes = require("./routes/support");
const paymentRoutes = require("./routes/payment"); // Import the payment routes
const wishlistRoutes = require("./routes/wishlist");
const app = express();

// --------------------
// In-memory runtime log viewer (current server process only)
// --------------------
const runtimeLogs = [];
const originalConsole = { log: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console), info: console.info.bind(console) };
function safeLogText(value) {
  let text = typeof value === "string" ? value : (() => { try { return JSON.stringify(value); } catch (_) { return String(value); } })();
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:\+?\d[\d\s()-]{7,}\d)\b/g, "[redacted-phone]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .replace(/(RAZORPAY_KEY_SECRET|MONGO_URI|JWT_SECRET)\s*[:=]\s*[^\s,}]+/gi, "$1=[redacted]")
    .slice(0, 4000);
}
function saveRuntimeLog(level, args) {
  const message = args.map(safeLogText).join(" ");
  runtimeLogs.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), timestamp: new Date().toISOString(), level, message });
  if (runtimeLogs.length > 500) runtimeLogs.splice(0, runtimeLogs.length - 500);
}
for (const level of ["log", "info", "warn", "error"]) {
  console[level] = (...args) => { saveRuntimeLog(level, args); originalConsole[level](...args); };
}


// --------------------
// CORS Setup
// --------------------
const allowedOrigins = [
  "https://aroha-three.vercel.app",
  "http://localhost:3000"
];

// Allow only Aroha preview deployments from this Vercel project/team.
// Do not allow arbitrary *.vercel.app origins.
const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) ||
  /^https:\/\/aroha-[a-z0-9-]+-ramesh-46s-projects\.vercel\.app$/i.test(origin);

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (Postman, mobile apps)
    if(!origin) return callback(null, true);
    if(!isAllowedOrigin(origin)){
      console.warn("[CORS] Rejected request origin:", origin);
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));

// --------------------
// Body parser
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: "text/plain", limit: "10kb" }));

// --------------------
// Serve uploaded images statically
// --------------------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// --------------------
// MongoDB connection
// --------------------
mongoose.connect(process.env.MONGO_URI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// --------------------
// Routes
// --------------------
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/seller", sellerAuthe);
// app.use("/promotion", promotion);
app.use("/coupons", couponRoutes);
app.use("/settings", settingsRoutes);
app.use("/support", supportRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/payment", paymentRoutes); // Use the payment routes
console.log("✅ paymentRoutes imported");
// --------------------
// Default route
// --------------------
app.get("/", (req, res) => {
  res.send("🚀 AROHA Server Running");
});

// --------------------
// Error handling middleware
// --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Server Error", error: err.message });
});



// Public, read-only diagnostics. Only sanitized in-memory logs from this process are exposed.

// Live tail stream for the public dashboard. Streams sanitized logs from this process.
app.get("/admin/logs/stream", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no" });
  res.flushHeaders?.();
  const send = (event, data) => res.write("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n");
  send("connected", { timestamp: new Date().toISOString(), source: "current-process-memory" });
  let lastId = "";
  const sendNewLogs = () => {
    const pending = runtimeLogs.filter((entry) => entry.id > lastId);
    for (const entry of pending) {
      send("log", entry);
      lastId = entry.id;
    }
  };
  // Initial snapshot: newest entries first on screen; stream only sends newly appended entries after this point.
  for (const entry of runtimeLogs.slice(-100)) send("log", entry);
  if (runtimeLogs.length) lastId = runtimeLogs[runtimeLogs.length - 1].id;
  const timer = setInterval(() => {
    sendNewLogs();
    res.write(": keep-alive\n\n");
  }, 1000);
  req.on("close", () => clearInterval(timer));
});

app.get("/admin/logs", (req, res) => {
  const hours = Math.min(168, Math.max(1, Number(req.query.hours) || 6));
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const logs = runtimeLogs.filter((entry) => new Date(entry.timestamp).getTime() >= cutoff).slice(-limit).reverse();
  res.set("Cache-Control", "no-store");
  res.json({ logs, count: logs.length, source: "current-process-memory", note: "Shows sanitized runtime logs since this server process started; does not include historical Render deploy/build logs." });
});

app.get("/ping", (req, res) => {
  res.send("Server is alive");
});
// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));






// // server.js
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// // Route imports
// const authRoutes = require("./routes/auth");
// const productRoutes = require("./routes/products");
// const cartRoutes = require("./routes/cart");

// const app = express();

// // --------------------
// // Middleware
// // --------------------
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // --------------------
// // Serve uploaded images statically
// // --------------------
// const path = require("path");
// const fs = require("fs");
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
// app.use("/uploads", express.static(uploadDir));

// // --------------------
// // MongoDB connection
// // --------------------
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.log("❌ MongoDB Error:", err));

// // --------------------
// // Routes
// // --------------------
// app.use("/auth", authRoutes);
// app.use("/products", productRoutes); // supports POST /products with multiple images, DELETE, GET
// app.use("/cart", cartRoutes);
// const orderRoutes = require("./routes/orders");
// app.use("/orders", orderRoutes);

// // --------------------
// // Default route
// // --------------------
// app.get("/", (req, res) => {
//   res.send("🚀 AROHA Server Running");
// });

// // --------------------
// // Start server
// // --------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
