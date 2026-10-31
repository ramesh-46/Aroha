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
const rewardsRoutes = require("./routes/rewards");
const invoiceRoutes = require("./routes/invoices");
const AuditLog = require("./models/AuditLog");
const sellerAuthMiddleware = require("./middleware/sellerAuthMiddleware");
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Small bounded per-IP limiter; critical write/login routes have tighter budgets.
const requestBuckets = new Map();
let lastBucketSweep = Date.now();
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  const now = Date.now();
  if (now - lastBucketSweep > 60000) {
    for (const [key, bucket] of requestBuckets) if (bucket.resetAt <= now) requestBuckets.delete(key);
    lastBucketSweep = now;
  }
  if (requestBuckets.size > 10000) requestBuckets.clear();
  const ip = String(req.ip || req.socket?.remoteAddress || "unknown").slice(0, 80);
  const sensitive = /^\/auth\/(login|signup|google-login|reset-password)|^\/payment\/create-session/.test(req.path);
  const limit = sensitive ? 20 : 300;
  const key = (sensitive ? "s:" : "g:") + ip;
  let bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) { bucket = { count: 0, resetAt: now + 60000 }; requestBuckets.set(key, bucket); }
  bucket.count += 1;
  if (bucket.count > limit) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    return res.status(429).json({ success: false, message: "Too many requests. Please wait and try again." });
  }
  next();
});

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
app.use("/rewards", rewardsRoutes);
app.use("/invoices", invoiceRoutes);
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



// Admin-only runtime and persistent audit logs. Customer data is never exposed publicly.
app.get("/admin/logs/stream", sellerAuthMiddleware, (req, res) => {
  res.status(410).json({ success: false, message: "Live EventSource was retired; use the authenticated paginated audit endpoint." });
});

app.get("/admin/logs", sellerAuthMiddleware, async (req, res) => {
  try {
    const hours = Math.min(2160, Math.max(1, Number(req.query.hours) || 24));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const page = Math.max(1, Number(req.query.page) || 1);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filter = { createdAt: { $gte: cutoff } };
    if (["info", "warning", "error", "security"].includes(req.query.level)) filter.level = req.query.level;
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) filter.userId = req.query.userId;
    const [audit, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select("-metadata.authorization -metadata.token"),
      AuditLog.countDocuments(filter)
    ]);
    const memory = runtimeLogs.slice(-Math.min(100, limit)).map((entry) => ({ ...entry, username: "System", userId: null, role: "system", event: "runtime.console" }));
    res.set("Cache-Control", "no-store");
    res.json({ logs: [...audit.map((entry) => ({ id: String(entry._id), timestamp: entry.createdAt, level: entry.level, message: entry.message, username: entry.username, userId: entry.userId ? String(entry.userId) : "", role: entry.role, event: entry.event, path: entry.path, statusCode: entry.statusCode })), ...memory].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)), count: total + memory.length, page, limit, pages: Math.ceil(total / limit), source: "mongodb-audit-plus-current-process", note: "Persistent audit events are stored in MongoDB; runtime console events are process-local and limited." });
  } catch (error) {
    console.error("[ADMIN_AUDIT_READ_FAILED]", { message: error.message });
    res.status(500).json({ success: false, message: "Unable to load audit logs." });
  }
});

app.get("/admin/audit/users/:userId", sellerAuthMiddleware, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const logs = await AuditLog.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(limit);
    res.set("Cache-Control", "no-store");
    res.json({ success: true, logs });
  } catch (error) {
    console.error("[ADMIN_USER_AUDIT_FAILED]", { message: error.message });
    res.status(500).json({ success: false, message: "Unable to load user audit history." });
  }
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
