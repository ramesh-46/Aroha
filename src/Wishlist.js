import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaHome, FaShoppingCart, FaUser, FaTrashAlt, FaStar, FaSearch, FaChevronDown } from "react-icons/fa";
import axios from "axios";

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState("heart");
  const user = JSON.parse(localStorage.getItem("user"));

  // --- Fetch Wishlist Items ---
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`https://aroha.onrender.com/wishlist/${user._id}`);
        setWishlistItems(res.data.items || []);
      } catch (err) {
        console.error("Fetch Wishlist Error:", err);
      }
    };
    fetchWishlist();
  }, [user]);

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
    if (!user) return;
    try {
      await axios.delete(`https://aroha.onrender.com/wishlist/remove/${user._id}/${productId}`);
      setWishlistItems(wishlistItems.filter(item => item.productId._id !== productId));
    } catch (err) {
      console.error("Remove from Wishlist Error:", err);
    }
  };

  // --- Add to Cart ---
  const addToCart = async (productId) => {
    if (!user) return;
    try {
      await axios.post("https://aroha.onrender.com/cart", {
        userId: user._id,
        productId,
        quantity: 1
      });
      navigate("/cart");
    } catch (err) {
      console.error("Add to Cart Error:", err);
    }
  };

  // --- Mock Data (Fallback) ---
  const mockWishlistItems = [
    {
      productId: { _id: "1", name: "Royal Silk Saree", price: 863.30, oldPrice: 890.00, images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80"] },
      rating: 4.8,
      reviews: 39
    },
    {
      productId: { _id: "2", name: "Premium Cotton Combo", price: 9000, oldPrice: 10000, images: ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80"] },
      rating: 4.5,
      reviews: 21
    },
    {
      productId: { _id: "3", name: "18K Gold Necklace", price: 25000, oldPrice: 30000, images: ["https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80"] },
      rating: 5.0,
      reviews: 55
    },
    {
      productId: { _id: "4", name: "Nike Air Limited", price: 6500, oldPrice: 7500, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"] },
      rating: 4.7,
      reviews: 80
    }
  ];

  // Use mock data if no user or empty wishlist
  const displayItems = user ? wishlistItems : mockWishlistItems;

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

        .nav-item-desktop:hover, .nav-item-desktop.active {
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
                className={`nav-item-desktop ${activeTab === tab.id ? 'active' : ''}`}
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
        <h2 className="wishlist-title">My Wishlist ({displayItems.length} items)</h2>
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
            {displayItems.map((item) => (
              <div key={item.productId?._id || item.id} className="wishlist-card">
                <div className="card-image-container">
                  <img
                    src={item.productId?.images?.[0] || item.image}
                    alt={item.productId?.name || item.name}
                    className="card-image"
                  />
                  <button
                    className="remove-btn"
                    onClick={() => removeFromWishlist(item.productId?._id || item.id)}
                  >
                    <FaTrashAlt size={12} />
                  </button>
                  <div className="rating-badge">
                    <FaStar color="#FFD700" size={10} />
                    <span>{item.rating || 4.5}</span>
                  </div>
                </div>
                <div className="card-details">
                  <h3 className="product-name">{item.productId?.name || item.name}</h3>
                  <div className="price-row">
                    <span className="current-price">₹{(item.productId?.price || item.price).toLocaleString()}</span>
                    {item.productId?.oldPrice && (
                      <span className="old-price">₹{(item.productId?.oldPrice || item.oldPrice).toLocaleString()}</span>
                    )}
                  </div>
                  {item.productId?.oldPrice && (
                    <span className="discount-tag">
                      {Math.round(((item.productId?.oldPrice - (item.productId?.price || item.price)) / (item.productId?.oldPrice || item.oldPrice)) * 100)}% OFF
                    </span>
                  )}
                  <button
                    className="action-btn"
                    onClick={() => addToCart(item.productId?._id || item.id)}
                  >
                    Move To Cart
                  </button>
                </div>
              </div>
            ))}
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
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
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
