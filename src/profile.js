import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaFilter, FaTruck, FaCheckCircle, FaClock, FaTimesCircle, FaBox,
  FaMapMarkerAlt, FaPhone, FaUser, FaCalendarAlt, FaReceipt, FaCreditCard,
  FaBars, FaHome, FaHeart, FaShoppingCart, FaEdit, FaEyeSlash, FaSignOutAlt,
  FaChevronDown, FaStar, FaSpinner
} from "react-icons/fa";

// Icon Component
const IconSVG = ({ name }) => {
  const paths = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    cart: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
};

function Profile() {
  const [form, setForm] = useState(JSON.parse(localStorage.getItem("user")) || {});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("user");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false); // Track if orders are already loaded

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch orders (memoized to prevent unnecessary re-creation)
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`https://aroha.onrender.com/orders/${user._id}`);
      const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
      setOrdersLoaded(true);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch orders only when showOrders becomes true and orders are not already loaded
  useEffect(() => {
    if (showOrders && !ordersLoaded) {
      fetchOrders();
    }
  }, [showOrders, fetchOrders, ordersLoaded]);

  // Filter orders
  useEffect(() => {
    let filtered = [...orders];

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(query) ||
        order.items.some(item =>
          item.productId?.name?.toLowerCase().includes(query) ||
          item.productId?.brand?.toLowerCase().includes(query)
        )
      );
    }

    setFilteredOrders(filtered);
  }, [statusFilter, searchQuery, orders]);

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

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'delivered': return <FaCheckCircle color="#10b981" />;
      case 'pending': return <FaClock color="#f59e0b" />;
      case 'cancelled': return <FaTimesCircle color="#ef4444" />;
      case 'shipped': return <FaTruck color="#3b82f6" />;
      default: return <FaBox color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'delivered': return "#10b981";
      case 'pending': return "#f59e0b";
      case 'cancelled': return "#ef4444";
      case 'shipped': return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.post("https://aroha.onrender.com/auth/profile/update", form);
      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Profile updated!");
        setIsEditing(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Reset ordersLoaded when hiding orders
  const toggleShowOrders = () => {
    if (showOrders) {
      setOrdersLoaded(false); // Reset loaded state when hiding
    }
    setShowOrders(!showOrders);
  };

  if (!user) return <p style={{ textAlign: 'center', padding: '60px', color: '#666' }}>Please log in to view your profile.</p>;

  return (
    <div className="profile-page-container">
      {/* INJECT CSS STYLES */}
      <style>{`
        .profile-page-container {
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .profile-header {
          display: ${isMobile ? 'none' : 'flex'};
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          position: sticky;
          top: 0;
          z-index: 100;
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

        /* Profile Content */
        .profile-content {
          flex: 1;
          padding: 20px;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #111;
        }

        .profile-form {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }

        .profile-image-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .profile-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #000;
        }

        .profile-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .label {
          margin-bottom: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #333;
        }

        .input {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 0.9rem;
          outline: none;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .action-btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .edit-btn {
          background: #111;
          color: white;
        }

        .update-btn {
          background: #28a745;
          color: white;
        }

        .orders-btn {
          background: #17a2b8;
          color: white;
        }

        .logout-btn {
          background: #dc3545;
          color: white;
        }

        /* Orders Section */
        .orders-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          flex: 1;
          overflow-y: auto;
          max-height: ${isMobile ? 'calc(100vh - 300px)' : 'calc(100vh - 200px)'};
        }

        .orders-header {
          margin-bottom: 20px;
        }

        .orders-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #111;
        }

        .orders-count {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }

        /* Filters */
        .filters-section {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 10px 16px;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          color: #000;
        }

        .status-filters {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .status-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e5e5e5;
          background: white;
          color: #6b7280;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .status-btn.active {
          background: #111;
          color: white;
          border-color: #111;
        }

        /* Loader */
        .loader-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .loader {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Orders List */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .order-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          background: #fafafa;
        }

        .order-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-id {
          font-size: 1rem;
          font-weight: 700;
          color: #000;
          display: flex;
          align-items: center;
        }

        .order-date {
          font-size: 0.85rem;
          color: #666;
          display: flex;
          align-items: center;
        }

        .order-status {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
        }

        .order-status-text {
          margin-left: 8px;
          font-weight: 600;
        }

        /* Order Items */
        .order-items {
          padding: 16px 20px;
        }

        .item-row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .item-row:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #eee;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #000;
          margin: 0 0 4px 0;
        }

        .item-brand {
          font-size: 0.85rem;
          color: #666;
          margin: 0 0 8px 0;
        }

        .item-meta {
          font-size: 0.8rem;
          color: #999;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .item-price {
          text-align: right;
          min-width: 100px;
        }

        .final-price {
          font-size: 1rem;
          font-weight: 700;
          color: #10b981;
        }

        .original-price {
          font-size: 0.85rem;
          color: #999;
          text-decoration: line-through;
        }

        /* Order Summary */
        .order-summary {
          padding: 16px 20px;
          background: #fafafa;
          border-top: 1px solid #f3f4f6;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-label {
          font-size: 0.8rem;
          color: #666;
        }

        .summary-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: #000;
        }

        .summary-item.total {
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
          margin-top: 8px;
        }

        .summary-value.total {
          color: #10b981;
          font-size: 1.1rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        /* Bottom Nav */
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
          z-index: 1000;
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
        <div className="profile-header">
          <div className="header-left">
            <div className="logo">AROHA HUB</div>
          </div>
          <div className="header-center">
            <div className="search-bar">
              <FaSearch className="search-icon" size={14} />
              <input type="text" placeholder="Search luxury items..." />
              <FaChevronDown size={12} style={{ color: '#999', marginLeft: '8px' }} />
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

      {/* PROFILE CONTENT */}
      <div className="profile-content">
        <h2 className="page-title">Profile</h2>

        {/* Profile Form */}
        <div className="profile-form">
          {form.photoUrl && (
            <div className="profile-image-container">
              <img
                src={form.photoUrl}
                alt="Profile"
                className="profile-image"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = "https://via.placeholder.com/120"; }}
              />
            </div>
          )}

          <div className="profile-fields">
            {Object.keys(form)
              .filter((key) => key !== "password" && key !== "createdAt" && key !== "__v")
              .map((key) => (
                <div key={key} className="input-group">
                  <label className="label">
                    {key === "_id"
                      ? "User ID"
                      : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                  </label>
                  <input
                    value={form[key] || ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="input"
                    disabled={key === "_id" || !isEditing}
                    style={{
                      backgroundColor: key === "_id" || !isEditing ? "#f5f5f5" : "#fff",
                      cursor: key === "_id" || !isEditing ? "not-allowed" : "text",
                    }}
                  />
                </div>
              ))}
          </div>

          <div className="action-buttons">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="action-btn edit-btn">
                Edit
              </button>
            ) : (
              <button onClick={handleUpdate} className="action-btn update-btn">
                Save Changes
              </button>
            )}

            <button onClick={toggleShowOrders} className="action-btn orders-btn">
              {showOrders ? "Hide Orders" : "Show Orders"}
            </button>

            <button onClick={handleLogout} className="action-btn logout-btn">
              Logout
            </button>
          </div>
        </div>

        {/* ORDERS SECTION (SCROLLABLE) */}
        {showOrders && (
          <div className="orders-section">
            <div className="orders-header">
              <h3 className="orders-title">My Orders</h3>
              <p className="orders-count">{filteredOrders.length} orders found</p>
            </div>

            {/* Filters */}
            <div className="filters-section">
              <div className="search-box">
                <FaSearch style={{ color: "#999", marginRight: "8px" }} />
                <input
                  type="text"
                  placeholder="Search by order ID or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="status-filters">
                {["all", "pending", "shipped", "delivered", "cancelled"].map(status => (
                  <button
                    key={status}
                    className={`status-btn ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Loader or Orders List */}
            {isLoading ? (
              <div className="loader-container">
                <FaSpinner className="loader" size={32} color="#10b981" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <FaBox size={48} color="#ddd" style={{ marginBottom: '16px' }} />
                <h3>No orders found</h3>
                <p>{searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "You haven't placed any orders yet"}</p>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map(order => (
                  <div key={order._id} className="order-card">
                    {/* Order Header */}
                    <div className="order-header">
                      <div className="order-info">
                        <div className="order-id">
                          <FaReceipt style={{ marginRight: "8px", color: "#666" }} />
                          Order #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div className="order-date">
                          <FaCalendarAlt style={{ marginRight: "6px", color: "#999" }} />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="order-status">
                        {getStatusIcon(order.status)}
                        <span className="order-status-text" style={{ color: getStatusColor(order.status) }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="order-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="item-row">
                          <img
                            src={item.productId?.images?.[0] || "https://via.placeholder.com/60"}
                            alt={item.productId?.name || "Product"}
                            className="item-image"
                          />
                          <div className="item-details">
                            <h4 className="item-name">{item.productId?.name || "Product"}</h4>
                            <p className="item-brand">{item.productId?.brand || "Brand"}</p>
                            <div className="item-meta">
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="item-price">
                            <div className="final-price">
                              ₹{Math.round((item.productId?.finalPrice || item.productId?.price) * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                      <div className="summary-grid">
                        <div className="summary-item">
                          <span className="summary-label">Subtotal</span>
                          <span className="summary-value">₹{Math.round(order.totalAmount - (order.deliveryCharge || 0)).toLocaleString()}</span>
                        </div>
                        {order.deliveryCharge > 0 && (
                          <div className="summary-item">
                            <span className="summary-label">Delivery</span>
                            <span className="summary-value">₹{order.deliveryCharge.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="summary-item total">
                          <span className="summary-label">Total Paid</span>
                          <span className="summary-value total">₹{Math.round(order.totalAmount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
}

<<<<<<< HEAD
export default Profile;
=======
export default Profile;
>>>>>>> f3b2c4e (Updated application)
