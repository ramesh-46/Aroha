const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10; // bcrypt salt rounds
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; // use env variable in production

// 🚀 [INFO] User router initialized
console.log("[INFO] 🚀 User router module loaded");

// Signup
router.post("/signup", async (req, res) => {
  console.log("[INFO] 🚀 Signup request started", { mobile: req.body.mobile, email: req.body.email });
  
  const { name, mobile, email, password, recoveryCode, gender, address, details } = req.body;

  try {
    console.log("[DEBUG] 🔍 Checking for existing user with mobile/email", { mobile, email });
    let user = await User.findOne({ $or: [{ mobile }, { email }] });

    if (user) {
      console.log("[WARN] ⚠️ Signup failed - User already exists", { mobile, email });
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
    });
    console.log("[DEBUG] 🔍 Created new User instance");

    console.log("[INFO] 🚀 Saving new user to database", { userId: user._id });
    await user.save();
    console.log("[SUCCESS] ✅ User saved successfully", { userId: user._id, mobile: user.mobile });

    console.log("[INFO] ✅ Signup request completed successfully", { userId: user._id });
    res.json({ success: true, user });
  } catch (err) {
    console.log("[ERROR] ❌ Signup request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
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

    console.log("[DEBUG] 🔍 Generating JWT token for user", { userId: user._id, expiresIn: "1d" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
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
  console.log("[INFO] 🚀 Google Login request started", { email: req.body.email });
  
  const { email, name, photoUrl } = req.body;

  try {
    console.log("[DEBUG] 🔍 Finding user by email for Google login", { email });
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

    console.log("[INFO] ✅ Google Login completed - New user detected", { email, isNewUser: true });
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
  console.log("[INFO] 🚀 Reset Password request started", { mobile: req.body.mobile, email: req.body.email });
  
  const { mobile, email, recoveryCode, newPassword } = req.body;

  if (!mobile || !email || !recoveryCode) {
    console.log("[WARN] ⚠️ Reset Password failed - Missing required fields", { mobile, email, recoveryCode: !!recoveryCode });
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }
  console.log("[DEBUG] 🔍 All required fields present, proceeding with verification");

  try {
    console.log("[DEBUG] 🔍 Finding user by mobile + email + recoveryCode");
    const user = await User.findOne({ mobile, email, recoveryCode });
    
    if (!user) {
      console.log("[WARN] ⚠️ Reset Password failed - User verification failed", { mobile, email });
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
router.get("/users", async (req, res) => {
  console.log("[INFO] 🚀 Get Users request started", { query: req.query.q });
  
  try {
    const { q } = req.query;
    const query = {};

    if (q) {
      console.log("[DEBUG] 🔍 Search query provided, building $or conditions", { q });
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
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
    const users = await User.find(query).sort({ createdAt: -1 });
    console.log("[SUCCESS] ✅ Users fetched successfully", { count: users.length });

    console.log("[INFO] ✅ Get Users request completed successfully", { count: users.length });
    res.json({ success: true, users });
  } catch (err) {
    console.log("[ERROR] ❌ Get Users request failed", { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get User Orders
router.get("/users/:id/orders", async (req, res) => {
  console.log("[INFO] 🚀 Get User Orders request started", { userId: req.params.id });
  
  try {
    console.log("[DEBUG] 🔍 Finding user by ID", { userId: req.params.id });
    const user = await User.findById(req.params.id);
    
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
