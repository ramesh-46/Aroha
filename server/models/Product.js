const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },       // Product name
  category: { type: String, required: true },               // Main category (e.g., Clothing)
  subCategory: String,                                      // Sub-category (e.g., Shirts)
  brand: String,                                            // Brand name
  sellerName: String,                                       // Seller info
  soldBy: { type: String, default: "AROHA" },              // Platform or seller
  productType: String,                                      // e.g., Cotton, Polyester, Leather
  material: String,                                         // Fabric/material
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },                  // Discount %
  finalPrice: { type: Number },                             // Calculated price after discount
  color: String,
  size: [String],                                          // e.g., ["S", "M", "L"]
  type: String,                                            // e.g., Shirt, Pants
  rating: { type: Number, default: 0 },                    // Average rating
  reviews: [                                              // Optional: store reviews
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  keywords: [String],                                     // For search
  stock: { type: Number, default: 0 },                    // Quantity available
  images: [String],                                       // Store image filenames/URLs
  sku: { type: String, unique: true },                    // Stock keeping unit
  weight: Number,                                         // Weight in grams or kg
  dimensions: {                                           // Product dimensions
    length: Number,
    width: Number,
    height: Number
  },
  tags: [String],                                         // e.g., ["new arrival", "summer"]
  isFeatured: { type: Boolean, default: false },         // Highlighted on homepage
  isActive: { type: Boolean, default: true },            // Product status
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate finalPrice
productSchema.pre("save", function(next) {
  if (this.discount) {
    this.finalPrice = this.price - (this.price * this.discount) / 100;
  } else {
    this.finalPrice = this.price;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Product", productSchema);
