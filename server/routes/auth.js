const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const sellerAuthMiddleware = require("../middleware/sellerAuthMiddleware");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { writeAudit } = require("../middleware/activityLogger");
const authMiddleware = require("../middleware/authMiddleware");

const saltRounds = 10; // bcrypt salt rounds
const maskEmail = (value) => String(value || "").trim().slice(0, 254); // Full email is intentionally visible only in private Render service logs.
const JWT_SECRET = process.env.JWT_SECRET;

// 🚀 [INFO] User router initialized
console.log("[INFO] 🚀 User router module loaded");

// Signup
router.post("/signup", async (req, res) => {
  console.log("[INFO] 🚀 Signup request started", { mobile: req.body.mobile, userEmail: maskEmail(req.body.email) });
  
  const { name, mobile, email, password, recoveryCode, gender, address, details, referralCode } = req.body;

  try {
    console.log("[DEBUG] 🔍 Checking for existing user with mobile/email", { mobile, userEmail: maskEmail(email) });
    let user = await User.findOne({ $or: [{ mobile }, { email }] });

    if (user) {
      console.log("[WARN] ⚠️ Signup failed - User already exists", { mobile, userEmail: maskEmail(email) });
      return res.status(400).json({ message: "User already exists with this mobile or email" });
    }
    console.log("[DEBUG] 🔍 No existing user found, proceeding with signup");

    console.log("[DEBUG] 🔍 Hashing password with saltRounds:", saltRounds);
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("[DEBUG] ✅ Password hashed successfully");

    user = new User({
      name,
      mobile,
      email,
      password: hashedPassword,
      recoveryCode,
      gender,
      address,
      details,
      referralCode: "AROHA-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
    });
    console.log("[DEBUG] 🔍 Created new User instance");

    if (referralCode) {
      const referrer = await User.findOne({ referralCode: String(referralCode).trim().toUpperCase() });
      if (!referrer || String(referrer.mobile) === String(mobile)) {
        return res.status(400).json({ success: false, message: "Referral code is invalid." });
      }
      user.referredBy = referrer._id;
    }

    console.log("[INFO] 🚀 Saving new user to database", { userId: user._id, userEmail: maskEmail(user.email) });
    await user.save();
    await writeAudit({ userId: user._id, username: user.name || "Customer", role: "user", event: "auth.signup_success", message: "User account created" });
    console.log("[SUCCESS] User saved", { userId: user._id, username: user.name || "Customer" });

    console.log("[INFO] ✅ Signup request completed successfully", { userId: user._id });
    res.json({ success: true, user });
  } catch (err) {
    console.log("[ERROR] ❌ Signup request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ success: false, message: "Authentication is not configured on this server." });
  console.log("[INFO] 🚀 Login request started", { mobile: req.body.mobile });
  
  const { mobile, password } = req.body;
  try {
    console.log("[DEBUG] 🔍 Finding user by mobile", { mobile });
    const user = await User.findOne({ mobile });
    
    if (!user) {
      console.log("[WARN] ⚠️ Login failed - User not found", { mobile });
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("[DEBUG] ✅ User found", { userId: user._id });

    console.log("[DEBUG] 🔍 Comparing password for user", { userId: user._id });
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("[WARN] ⚠️ Login failed - Password mismatch", { userId: user._id });
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("[DEBUG] ✅ Password match confirmed");

    console.log("[DEBUG] 🔍 Generating JWT token for user", { userId: user._id, userEmail: maskEmail(user.email), expiresIn: "1d" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    await writeAudit({ userId: user._id, username: user.name || "Customer", role: "user", event: "auth.login_success", message: "User signed in successfully" });
    console.log("[DEBUG] ✅ JWT token generated successfully");

    console.log("[INFO] ✅ Login request completed successfully", { userId: user._id });
    res.json({ success: true, user, token });
  } catch (err) {
    console.log("[ERROR] ❌ Login request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ message: err.message });
  }
});

// Google Login
router.post("/google-login", async (req, res) => {
  if (!JWT_SECRET) return res.status(503).json({ success: false, message: "Authentication is not configured on this server." });
  console.log("[INFO] 🚀 Google Login request started", { userEmail: maskEmail(req.body.email) });
  
  const { email, name, photoUrl } = req.body;

  try {
    console.log("[DEBUG] 🔍 Finding user by email for Google login", { userEmail: maskEmail(email) });
    let user = await User.findOne({ email });

    if (user) {
      console.log("[DEBUG] ✅ Existing user found for Google login", { userId: user._id });
      
      // ✅ ALWAYS UPDATE IMAGE
      if (photoUrl) {
        console.log("[DEBUG] 🔍 Updating photoUrl for user", { userId: user._id });
        user.photoUrl = photoUrl;
        await user.save();
        console.log("[SUCCESS] ✅ photoUrl updated successfully", { userId: user._id });
      } else {
        console.log("[DEBUG] 🔍 No photoUrl provided, skipping update", { userId: user._id });
      }

      console.log("[DEBUG] 🔍 Generating JWT token for Google login", { userId: user._id });
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
      console.log("[DEBUG] ✅ JWT token generated for Google login");

      console.log("[INFO] ✅ Google Login completed - Existing user", { userId: user._id, isNewUser: false });
      return res.json({
        success: true,
        user,
        token,
        isNewUser: false
      });
    }

    console.log("[INFO] ✅ Google Login completed - New user detected", { userEmail: maskEmail(email), isNewUser: true });
    return res.json({
      success: true,
      isNewUser: true,
      name,
      email,
      photoUrl
    });

  } catch (err) {
    console.log("[ERROR] ❌ Google Login request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ message: err.message });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  console.log("[INFO] 🚀 Reset Password request started", { mobile: req.body.mobile, userEmail: maskEmail(req.body.email) });
  
  const { mobile, email, recoveryCode, newPassword } = req.body;

  if (!mobile || !email || !recoveryCode) {
    console.log("[WARN] ⚠️ Reset Password failed - Missing required fields", { mobile, userEmail: maskEmail(email), recoveryCodeProvided: !!recoveryCode });
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }
  console.log("[DEBUG] 🔍 All required fields present, proceeding with verification");

  try {
    console.log("[DEBUG] 🔍 Finding user by mobile + email + recoveryCode");
    const user = await User.findOne({ mobile, email, recoveryCode });
    
    if (!user) {
      console.log("[WARN] ⚠️ Reset Password failed - User verification failed", { mobile, userEmail: maskEmail(email) });
      return res.status(400).json({ 
        success: false, 
        message: "Mobile, Email or Recovery Code is incorrect!" 
      });
    }
    console.log("[DEBUG] ✅ User verification successful", { userId: user._id });

    // Step 1: Verification only (no newPassword yet)
    if (!newPassword) {
      console.log("[DEBUG] 🔍 Verification step complete - awaiting new password", { userId: user._id });
      return res.json({ 
        success: true, 
        verified: true, 
        message: "Verification successful. Enter new password." 
      });
    }
    console.log("[DEBUG] 🔍 New password provided, proceeding with update", { userId: user._id });

    // Step 2: Hash new password and update
    console.log("[DEBUG] 🔍 Hashing new password", { userId: user._id });
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log("[DEBUG] ✅ New password hashed successfully");
    
    user.password = hashedPassword;
    console.log("[DEBUG] 🔍 Saving updated user with new password", { userId: user._id });
    await user.save();
    console.log("[SUCCESS] ✅ Password updated successfully", { userId: user._id });

    console.log("[INFO] ✅ Reset Password request completed successfully", { userId: user._id });
    return res.json({ 
      success: true, 
      updated: true, 
      message: "Password updated successfully!" 
    });

  } catch (err) {
    console.log("[ERROR] ❌ Reset Password request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Profile Update
router.post("/profile/update", async (req, res) => {
  console.log("[INFO] 🚀 Profile Update request started", { mobile: req.body.mobile });
  
  const { mobile, name, email, gender, address, details, password, recoveryCode } = req.body;

  try {
    console.log("[DEBUG] 🔍 Preparing update data for user", { mobile });
    const updateData = { name, email, gender, address, details, recoveryCode };
    
    if (password) {
      console.log("[DEBUG] 🔍 Password provided, hashing new password", { mobile });
      updateData.password = await bcrypt.hash(password, saltRounds);
      console.log("[DEBUG] ✅ Password hashed for profile update");
    } else {
      console.log("[DEBUG] 🔍 No password provided, skipping password update");
    }

    console.log("[DEBUG] 🔍 Finding and updating user by mobile", { mobile });
    const user = await User.findOneAndUpdate({ mobile }, updateData, { new: true });

    if (!user) {
      console.log("[WARN] ⚠️ Profile Update failed - User not found", { mobile });
      return res.status(400).json({ message: "User not found" });
    }
    console.log("[DEBUG] ✅ User found and updated", { userId: user._id });

    console.log("[INFO] ✅ Profile Update request completed successfully", { userId: user._id });
    res.json({ success: true, user });
  } catch (err) {
    console.log("[ERROR] ❌ Profile Update request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ message: err.message });
  }
});

// Get Users with Search
router.get("/users", sellerAuthMiddleware, async (req, res) => {
  console.log("[INFO] 🚀 Get Users request started", { query: req.query.q });
  
  try {
    const q = String(req.query.q || "").trim().slice(0, 80);
    const escapedQ = q.split("").map((char) => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join("");
    const query = {};

    if (q) {
      console.log("[DEBUG] 🔍 Search query provided, building $or conditions", { q });
      query.$or = [
        { name: { $regex: escapedQ, $options: "i" } },
        { mobile: { $regex: escapedQ, $options: "i" } },
        { email: { $regex: escapedQ, $options: "i" } }
      ];

      if (/^[a-f\d]{24}$/i.test(q)) {
        console.log("[DEBUG] 🔍 Query matches ObjectId format, adding _id to search", { q });
        query.$or.push({ _id: q });
      } else {
        console.log("[DEBUG] 🔍 Query does not match ObjectId format, skipping _id search");
      }
    } else {
      console.log("[DEBUG] 🔍 No search query, fetching all users");
    }

    console.log("[DEBUG] 🔍 Executing User.find with query", { query: JSON.stringify(query) });
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const page = Math.max(1, Number(req.query.page) || 1);
    const [users, total] = await Promise.all([User.find(query).select("-password -recoveryCode").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(query)]);
    console.log("[SUCCESS] ✅ Users fetched successfully", { count: users.length });

    console.log("[INFO] ✅ Get Users request completed successfully", { count: users.length });
    res.json({ success: true, users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.log("[ERROR] ❌ Get Users request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin-only complete user profile update. Passwords are always hashed and never returned.
router.put("/users/:id", sellerAuthMiddleware, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    if (!/^[a-f\\d]{24}$/i.test(req.params.id)) return res.status(400).json({ success: false, message: "Invalid user ID." });
    const allowed = ["name", "mobile", "email", "gender", "address", "details", "recoveryCode", "referralCode", "referredBy", "rewardCoins"];
    const updates = {};
    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) updates[field] = req.body[field];
    }
    if (updates.mobile !== undefined) updates.mobile = String(updates.mobile).trim();
    if (updates.email !== undefined) updates.email = String(updates.email).trim().toLowerCase() || undefined;
    if (updates.referralCode !== undefined) updates.referralCode = String(updates.referralCode).trim().toUpperCase();
    if (updates.rewardCoins !== undefined) {
      const coins = Number(updates.rewardCoins);
      if (!Number.isInteger(coins) || coins < 0) return res.status(400).json({ success: false, message: "Reward coins must be a whole number zero or greater." });
      updates.rewardCoins = coins;
    }
    if (updates.referredBy === "") updates.referredBy = null;
    if (updates.referredBy && !/^[a-f\\d]{24}$/i.test(String(updates.referredBy))) return res.status(400).json({ success: false, message: "Referred-by must be a valid user ID or left blank." });
    if (updates.referredBy && String(updates.referredBy) === String(req.params.id)) return res.status(400).json({ success: false, message: "A user cannot refer themselves." });
    if (req.body?.newRecoveryCode !== undefined && String(req.body.newRecoveryCode).trim()) updates.recoveryCode = String(req.body.newRecoveryCode).trim();
    delete updates.newRecoveryCode;
    if (req.body?.password) {
      if (String(req.body.password).length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
      updates.password = await bcrypt.hash(String(req.body.password), saltRounds);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select("-password -recoveryCode");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    console.info("[ADMIN_USERS]", requestId, "USER_UPDATED", { userId: String(user._id), fields: Object.keys(updates).filter((key) => key !== "password") });
    return res.json({ success: true, user, message: "User details updated." });
  } catch (err) {
    console.error("[ADMIN_USERS]", requestId, "UPDATE_FAILED", err.message);
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Mobile, email, or referral code is already in use." });
    return res.status(500).json({ success: false, message: "Unable to update user details." });
  }
});

// Get User Orders
router.get("/users/:id/orders", sellerAuthMiddleware, async (req, res) => {
  console.log("[INFO] 🚀 Get User Orders request started", { userId: req.params.id });
  
  try {
    console.log("[DEBUG] 🔍 Finding user by ID", { userId: req.params.id });
    const user = await User.findById(req.params.id).select("-password -recoveryCode");
    
    if (!user) {
      console.log("[WARN] ⚠️ Get User Orders failed - User not found", { userId: req.params.id });
      return res.status(404).json({ success: false, message: "User not found" });
    }
    console.log("[DEBUG] ✅ User found", { userId: user._id });

    console.log("[DEBUG] 🔍 Fetching orders for user", { userId: req.params.id });
    // Note: Order model import may be needed at top of file
    const orders = await Order.find({ userId: req.params.id })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    console.log("[SUCCESS] ✅ Orders fetched successfully", { userId: req.params.id, count: orders.length });

    console.log("[INFO] ✅ Get User Orders request completed successfully", { userId: req.params.id, orderCount: orders.length });
    res.json({ success: true, user, orders });
  } catch (err) {
    console.log("[ERROR] ❌ Get User Orders request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: err.message });
  }
});

console.log("[INFO] ✅ All routes registered with logging.🕉️ starting Lalitha Maha thripura Sundari Devi vahana 🥥🥥🌴");




module.exports = router;


// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");


// router.post("/signup", async (req, res) => {
//   const { name, mobile, email, password, recoveryCode, gender, address, details } = req.body;
//   try {
//     // Check if user already exists
//     let user = await User.findOne({ mobile });
//     if (user) return res.status(400).json({ message: "User already exists" });
//     // Create new user with recovery code
//     user = new User({
//       name,
//       mobile,
//       email,
//       password,
//       recoveryCode,
//       gender,
//       address,
//       details,
//     });

//     // Save user to database
//     await user.save();

//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Login
// router.post("/login", async (req, res) => {
//   const { mobile, password } = req.body;
//   try {
//     const user = await User.findOne({ mobile, password });
//     if (!user) return res.status(400).json({ message: "Invalid credentials" });
//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Forgot password

// // Reset Password
// router.post("/reset-password", async (req, res) => {
//   const { mobile, email, recoveryCode, newPassword } = req.body;

//   if (!mobile || !email || !recoveryCode) {
//     return res.status(400).json({ success: false, message: "All fields are required!" });
//   }

//   try {
//     const user = await User.findOne({ mobile, email, recoveryCode });

//     if (!user) {
//       return res.status(400).json({ success: false, message: "Mobile, Email or Recovery Code is incorrect!" });
//     }

//     if (!newPassword) {
//       return res.json({ success: true, verified: true, message: "Verification successful. Enter new password." });
//     }

//     // Update password
//     user.password = newPassword; // plain text as per your requirement
//     await user.save();

//     return res.json({ success: true, updated: true, message: "Password updated successfully!" });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });


// router.post("/profile/update", async (req, res) => {
//   const { mobile, name, email, gender, address, details, password, recoveryCode } = req.body;

//   try {
//     const user = await User.findOneAndUpdate(
//       { mobile },
//       { name, email, gender, address, details, password, recoveryCode },
//       { new: true }
//     );

//     if (!user) return res.status(400).json({ message: "User not found" });

//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;

 
// Customer address book: up to ten saved delivery addresses, always scoped to the verified account.
router.get("/addresses", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses address name mobile").lean();
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    let addresses = Array.isArray(user.addresses) ? user.addresses : [];
    if (!addresses.length && user.address) addresses = [{ _id: "legacy", label: "Saved address", name: user.name || "", mobile: user.mobile || "", line1: user.address, city: "", state: "", pincode: "", isDefault: true }];
    res.set("Cache-Control", "no-store");
    res.json({ success: true, addresses, limit: 10 });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to load saved addresses." }); }
});

router.post("/addresses", authMiddleware, async (req, res) => {
  try {
    const { label = "Home", name, mobile, line1, line2 = "", landmark = "", city, state, pincode, isDefault = false } = req.body || {};
    const fields = [name, mobile, line1, city, state, pincode];
    if (fields.some(value => !String(value || "").trim())) return res.status(400).json({ success: false, message: "Name, mobile, address, city, state and PIN code are required." });
    if (!/^[0-9+() -]{7,20}$/.test(String(mobile).trim())) return res.status(400).json({ success: false, message: "Enter a valid mobile number." });
    if (!/^[A-Za-z0-9 -]{4,12}$/.test(String(pincode).trim())) return res.status(400).json({ success: false, message: "Enter a valid PIN code." });
    const user = await User.findById(req.user.id).select("addresses name mobile");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    if (user.addresses.length >= 10) return res.status(409).json({ success: false, message: "You can save a maximum of 10 addresses." });
    const address = { label: String(label).trim().slice(0,30) || "Home", name: String(name).trim(), mobile: String(mobile).trim(), line1: String(line1).trim(), line2: String(line2).trim(), landmark: String(landmark).trim(), city: String(city).trim(), state: String(state).trim(), pincode: String(pincode).trim(), isDefault: Boolean(isDefault) || user.addresses.length === 0 };
    if (address.isDefault) user.addresses.forEach(item => { item.isDefault = false; });
    user.addresses.push(address);
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to save address." }); }
});

router.put("/addresses/:addressId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found." });
    const allowed = ["label","name","mobile","line1","line2","landmark","city","state","pincode"];
    for (const key of allowed) if (req.body[key] !== undefined) address[key] = String(req.body[key]).trim();
    if (["name","mobile","line1","city","state","pincode"].some(key => !String(address[key] || "").trim())) return res.status(400).json({ success: false, message: "Complete all required address fields." });
    if (req.body.isDefault === true) user.addresses.forEach(item => { item.isDefault = String(item._id) === String(address._id); });
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to update address." }); }
});

router.delete("/addresses/:addressId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: "Address not found." });
    const wasDefault = address.isDefault;
    address.deleteOne();
    if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to delete address." }); }
});
