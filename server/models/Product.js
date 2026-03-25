const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subCategory: String,

  brand: { type: String, required: true },
  collection: { type: String, required: true },

  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sellerName: String,
  soldBy: { type: String, default: "AROHA" },

  productType: String,
  material: String,

  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: Number,

  color: [String],
  size: [String],
  type: String,

  rating: { type: Number, default: 0 },

  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  keywords: [String],
  stock: { type: Number, default: 0 },
  images: [String],

  sku: { type: String, unique: true, sparse: true },

  weight: Number,

  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },

  tags: [String],

  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }

}, { timestamps: true });

// price calculation
productSchema.pre("save", function(next) {
  if (this.discount !== undefined) {
    this.finalPrice = this.price - (this.price * this.discount) / 100;
  } else {
    this.finalPrice = this.price;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);