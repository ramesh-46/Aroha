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

const app = express();

// --------------------
// CORS Setup
// --------------------
const allowedOrigins = [
  "https://aroha-three.vercel.app", // frontend deployed URL
  "http://localhost:3000"           // local dev
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (Postman, mobile apps)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
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
  useNewUrlParser: true,
  useUnifiedTopology: true
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
