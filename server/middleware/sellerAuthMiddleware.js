const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sellersecret";

const sellerAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Seller authorization required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.seller = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid seller token" });
  }
};

module.exports = sellerAuthMiddleware;
