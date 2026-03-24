const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10; // bcrypt salt rounds
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; // use env variable in production

// Signup
router.post("/signup", async (req, res) => {
  const { name, mobile, email, password, recoveryCode, gender, address, details } = req.body;

  try {
    let user = await User.findOne({ $or: [{ mobile }, { email }] });

    if (user) return res.status(400).json({ message: "User already exists with this mobile or email" });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ success: true, user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google Login
router.post("/google-login", async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found"
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ success: true, user, token, isNewUser: false });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { mobile, email, recoveryCode, newPassword } = req.body;

  if (!mobile || !email || !recoveryCode) {
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }

  try {
    // Find user by mobile + email + recoveryCode
    const user = await User.findOne({ mobile, email, recoveryCode });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Mobile, Email or Recovery Code is incorrect!" 
      });
    }

    // Step 1: Verification only (no newPassword yet)
    if (!newPassword) {
      return res.json({ 
        success: true, 
        verified: true, 
        message: "Verification successful. Enter new password." 
      });
    }

    // Step 2: Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    return res.json({ 
      success: true, 
      updated: true, 
      message: "Password updated successfully!" 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Profile Update
router.post("/profile/update", async (req, res) => {
  const { mobile, name, email, gender, address, details, password, recoveryCode } = req.body;

  try {
    const updateData = { name, email, gender, address, details, recoveryCode };
    if (password) {
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const user = await User.findOneAndUpdate({ mobile }, updateData, { new: true });

    if (!user) return res.status(400).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
