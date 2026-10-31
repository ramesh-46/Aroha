
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaHome,
  FaShoppingCart,
  FaUser,
  FaTrashAlt,
  FaStar,
  FaSearch,
  FaChevronDown
} from "react-icons/fa";
import axios from "axios";

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishlistError, setWishlistError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState("heart");

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Could not read saved user:", error);
      return null;
    }
  });

  const userId = user?._id;

  // --- Fetch Wishlist Items ---
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!userId) {
        setWishlistItems([]);
        return;
      }

      setWishlistLoading(true); setWishlistError("");
      try {
        const res = await axios.get(
          `https://aroha.onrender.com/wishlist/${userId}`, { timeout: 20000 }
        );

        setWishlistItems(
          Array.isArray(res.data.items) ? res.data.items : []
        );
      } catch (err) {
        console.error("[WISHLIST] LOAD_FAILED", { status: err.response?.status, message: err.response?.data?.message || err.message });
        setWishlistError("Your wishlist could not be loaded. Please retry.");
      } finally { setWishlistLoading(false); }
    };

    fetchWishlist();
  }, [userId]);

  // --- Handle Resize ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Navigation Handler ---
  const handleNavClick = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "home") {
      navigate("/maindashboard");
    } else if (tabId === "heart") {
      navigate("/wishlist");
    } else if (tabId === "cart") {
      navigate("/cart");
    } else if (tabId === "user") {
      navigate("/profile");
    }
  };

  // --- Remove from Wishlist ---
  const removeFromWishlist = async (productId) => {
    if (!userId || !productId) {
      alert("Please log in to manage your wishlist.");
      return;
    }

    try {
      await axios.delete(
        `https://aroha.onrender.com/wishlist/${userId}/${productId}`
      );

      setWishlistItems((items) =>
        items.filter((product) => product._id !== productId)
      );
    } catch (err) {
      console.error("Remove from Wishlist Error:", err);
      alert("Could not remove this item. Please try again.");
    }
  };

  // --- Add to Cart ---

  // --- Move to Product Page ---
  const addToCart = (productId) => {
    if (!userId) {
      alert("Please log in to add items to your cart.");
      return;
    }

    if (!productId) {
      alert("This product does not have a valid ID.");
      return;
    }

    // Open the selected product so the user can choose its options.
    navigate(`/maindashboard?product=${productId}`);
  };

  // Show only the products actually saved in the user's wishlist.
  const displayItems = wishlistItems;

  return (
    <div className="wishlist-page-container">
      {/* INJECT CSS STYLES */}
      <style>{`
        .wishlist-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          min-height: calc(100vh - 80px);
          padding-bottom: ${isMobile ? '80px' : '20px'};
        }

        /* Header */
        .wishlist-header {
          display: ${isMobile ? 'none' : 'flex'};
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #000;
          letter-spacing: 1px;
        }

        .header-center {
          flex: 1;
          max-width: 500px;
          margin: 0 20px;
          position: relative;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 8px 16px;
          width: 100%;
        }

        .search-bar input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          color: #666;
        }

        .search-bar .search-icon {
          color: #999;
          margin-right: 8px;
        }

        .search-bar .dropdown-icon {
          color: #999;
          margin-left: 8px;
        }

        .header-right {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .nav-item-desktop {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #666;
          font-size: 0.8rem;
          gap: 4px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-item-desktop:hover,
        .nav-item-desktop.active {
          color: #000;
          background: #f3f4f6;
          font-weight: 600;
        }

        /* Page Title */
        .wishlist-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #111;
        }

        /* Grid Layout */
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* Card */
        .wishlist-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .wishlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .card-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ef4444;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .rating-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          padding: 4px 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-details {
          padding: 16px;
        }

        .product-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #111;
        }

        .price-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .current-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #059669;
        }

        .old-price {
          font-size: 0.9rem;
          color: #9ca3af;
          text-decoration: line-through;
        }

        .discount-tag {
          font-size: 0.85rem;
          color: #059669;
          font-weight: 600;
          margin-bottom: 12px;
          display: block;
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          background: #111;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: #333;
        }

        /* Empty State */
        .empty-wishlist-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }

        .empty-icon {
          color: #d4af37;
          margin-bottom: 16px;
        }

        /* Bottom Nav Mobile */
        .bottom-nav-mobile {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #eee;
          display: ${isMobile ? 'flex' : 'none'};
          justify-content: space-around;
          padding: 10px 0;
          z-index: 900;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #9ca3af;
          font-size: 0.75rem;
          gap: 4px;
          cursor: pointer;
        }

        .nav-item.active {
          color: #000;
          font-weight: 600;
        }
      `}</style>

      {/* HEADER (ONLY ON LARGE SCREENS) */}
      {!isMobile && (
        <div className="wishlist-header">
          <div className="header-left">
            <div className="logo">AROHA HUB</div>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <FaSearch className="search-icon" size={14} />
              <input type="text" placeholder="Search luxury items..." />
              <FaChevronDown className="dropdown-icon" size={12} />
            </div>
          </div>

          <div className="header-right">
            {[
              { id: "home", label: "Home" },
              { id: "heart", label: "Wishlist" },
              { id: "cart", label: "Cart" },
              { id: "user", label: "Profile" }
            ].map((tab) => (
              <div
                key={tab.id}
                className={`nav-item-desktop ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => handleNavClick(tab.id)}
              >
                {tab.id === "home" && <FaHome size={20} />}
                {tab.id === "heart" && <FaHeart size={20} />}
                {tab.id === "cart" && <FaShoppingCart size={20} />}
                {tab.id === "user" && <FaUser size={20} />}
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div>
        <h2 className="wishlist-title">
          My Wishlist ({displayItems.length} items)
        </h2>

        {displayItems.length === 0 ? (
          <div className="empty-wishlist-state">
            <FaHeart size={64} className="empty-icon" />
            <h3>Your wishlist is empty</h3>
            <p>Looks like you haven't saved anything yet.</p>
            <button
              className="action-btn"
              onClick={() => navigate("/maindashboard")}
              style={{ marginTop: "20px" }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {displayItems.map((product) => {
              const productId = product._id;
              const currentPrice = product.finalPrice ?? product.price ?? 0;
              const originalPrice = product.price ?? 0;
              const hasDiscount = originalPrice > currentPrice;

              return (
                <div key={productId} className="wishlist-card">
                  <div className="card-image-container">
                    <img
                      src={
                        Array.isArray(product.images) &&
                        product.images.length > 0
                          ? product.images[0]
                          : "https://via.placeholder.com/600x600?text=No+Image"
                      }
                      alt={product.name || "Wishlist product"}
                      className="card-image"
                    />

                    <button
                      className="remove-btn"
                      onClick={() => removeFromWishlist(productId)}
                      aria-label={`Remove ${
                        product.name || "product"
                      } from wishlist`}
                    >
                      <FaTrashAlt size={12} />
                    </button>

                    <div className="rating-badge">
                      <FaStar color="#FFD700" size={10} />
                      <span>{product.rating || 4.5}</span>
                    </div>
                  </div>

                  <div className="card-details">
                    <h3 className="product-name">
                      {product.name || "Unnamed product"}
                    </h3>

                    <div className="price-row">
                      <span className="current-price">
                        ₹{Number(currentPrice).toLocaleString("en-IN")}
                      </span>

                      {hasDiscount && (
                        <span className="old-price">
                          ₹{Number(originalPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    {hasDiscount && (
                      <span className="discount-tag">
                        {Math.round(
                          ((originalPrice - currentPrice) / originalPrice) *
                            100
                        )}
                        % OFF
                      </span>
                    )}

                    <button
                      className="action-btn"
                      onClick={() => addToCart(productId)}
                    >
                      Move To Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV (ONLY ON SMALL SCREENS) */}
      <div className="bottom-nav-mobile">
        {[
          { id: "home", label: "Home" },
          { id: "heart", label: "Wishlist" },
          { id: "cart", label: "Cart" },
          { id: "user", label: "Profile" }
        ].map((tab) => (
          <div
            key={tab.id}
            className={`nav-item ${
              activeTab === tab.id ? "active" : ""
            }`}
            onClick={() => handleNavClick(tab.id)}
          >
            {tab.id === "home" && <FaHome size={20} />}
            {tab.id === "heart" && <FaHeart size={20} />}
            {tab.id === "cart" && <FaShoppingCart size={20} />}
            {tab.id === "user" && <FaUser size={20} />}
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
