const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name referralCode rewardCoins rewardHistory");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    // Existing accounts created before the referral feature also receive a personal code.
    if (!user.referralCode) {
      user.referralCode = "AROHA" + require("crypto").randomBytes(4).toString("hex").toUpperCase();
      await user.save();
    }
    const referrals = await User.find({ referredBy: user._id }).select("name createdAt").sort({ createdAt: -1 }).lean();
    res.json({ success: true, referralCode: user.referralCode || "", coins: user.rewardCoins || 0, history: (user.rewardHistory || []).slice(-30).reverse(), referrals: referrals.map((person) => ({ name: person.name || "Aroha member", joinedAt: person.createdAt })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load rewards." });
  }
});

module.exports = router;
