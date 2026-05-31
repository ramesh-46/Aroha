import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaFilter, FaTruck, FaCheckCircle, FaClock, FaTimesCircle, FaBox,
  FaMapMarkerAlt, FaPhone, FaUser, FaCalendarAlt, FaReceipt, FaCreditCard,
  FaBars, FaHome, FaHeart, FaShoppingCart
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
  const [activeTab, setActiveTab] = useState("profile");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const res = await axios.get(`https://aroha.onrender.com/orders/${user._id}`);
        const sortedOrders = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } catch (err) {
        console.log(err);
      }
    };
    if (showOrders) {
      fetchOrders();
    }
  }, [showOrders, user]);

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
    if (tabId === 'home') navigate('/dashboard');
    else if (tabId === 'wishlist') navigate('/wishlist');
    else if (tabId === 'cart') navigate('/cart');
    else if (tabId === 'profile') navigate('/profile');
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
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
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

  if (!user) return <p style={styles.loginPrompt}>Please log in to view your profile.</p>;

  return (
    <div style={styles.pageContainer}>
      {/* DESKTOP HEADER */}
      {!isMobile && (
        <div style={styles.desktopHeader}>
          <div style={styles.logo}>AROHA HUB</div>
          <div style={styles.searchBar}>
            <FaSearch style={{ marginRight: "8px", color: "#666", fontSize: "14px" }} />
            <input 
              type="text" 
              placeholder="Search luxury items..." 
              style={styles.searchInput}
            />
            <div style={styles.filterIcon}>
              <FaFilter style={{ fontSize: "14px" }} />
            </div>
          </div>
          <div style={styles.navIcons}>
            {[
              { id: "home", label: "Home", icon: "home" },
              { id: "heart", label: "Wishlist", icon: "heart" },
              { id: "cart", label: "Cart", icon: "cart" },
              { id: "user", label: "Profile", icon: "user" }
            ].map((tab) => (
              <div 
                key={tab.id} 
                style={styles.navIconItem(activeTab === tab.id)}
                onClick={() => handleNavClick(tab.id)}
              >
                <IconSVG name={tab.icon} />
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE CONTENT */}
      <div style={styles.profileContent}>
        <h1 style={styles.pageTitle}>Profile</h1>
        
        {/* Profile Form */}
        <div style={styles.profileForm}>
          {/* Profile Image */}
          {form.photoUrl && (
            <div style={styles.profileImageContainer}>
              <img 
                src={form.photoUrl} 
                alt="Profile" 
                style={styles.profileImage}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/120";
                }}
              />
            </div>
          )}

          {/* Profile Fields */}
          <div style={styles.profileFields}>
            {Object.keys(form)
              .filter((key) => key !== "password" && key !== "createdAt" && key !== "__v")
              .map((key) => (
                <div key={key} style={styles.inputGroup}>
                  <label style={styles.label}>
                    {key === "_id"
                      ? "User ID"
                      : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                  </label>
                  <input
                    value={form[key] || ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{
                      ...styles.input,
                      backgroundColor: key === "_id" || !isEditing ? "#f5f5f5" : "#fff",
                      cursor: key === "_id" || !isEditing ? "not-allowed" : "text",
                    }}
                    disabled={key === "_id" || !isEditing}
                  />
                </div>
              ))}
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                Edit
              </button>
            ) : (
              <button onClick={handleUpdate} style={styles.updateBtn}>
                Save Changes
              </button>
            )}
            
            <button onClick={() => setShowOrders(!showOrders)} style={styles.ordersBtn}>
              {showOrders ? "Hide Orders" : "Show Orders"}
            </button>
            
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        {/* Orders Section */}
        {showOrders && (
          <div style={styles.ordersSection}>
            <div style={styles.pageHeader}>
              <h2 style={styles.ordersTitle}>My Orders</h2>
              <p style={styles.pageSubtitle}>{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found</p>
            </div>

            {/* Filters */}
            <div style={styles.filtersSection}>
              <div style={styles.searchBox}>
                <FaSearch style={{ color: "#9ca3af", marginRight: "8px" }} />
                <input 
                  type="text" 
                  placeholder="Search by order ID or product name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInputField}
                />
              </div>
              <div style={styles.statusFilters}>
                {["all", "pending", "shipped", "delivered", "cancelled"].map(status => (
                  <button 
                    key={status} 
                    onClick={() => setStatusFilter(status)}
                    style={styles.statusBtn(statusFilter === status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div style={styles.emptyState}>
                <FaBox size={48} color="#d1d5db" />
                <h3>No orders found</h3>
                <p>{searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "You haven't placed any orders yet"}</p>
              </div>
            ) : (
              <div style={styles.ordersList}>
                {filteredOrders.map(order => (
                  <div key={order._id} style={styles.orderCard}>
                    {/* Order Header */}
                    <div style={styles.orderHeader}>
                      <div style={styles.orderInfo}>
                        <div style={styles.orderId}>
                          <FaReceipt style={{ marginRight: "8px", color: "#6b7280" }} />
                          Order #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div style={styles.orderDate}>
                          <FaCalendarAlt style={{ marginRight: "6px", color: "#9ca3af" }} />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div style={styles.orderStatus}>
                        {getStatusIcon(order.status)}
                        <span style={{ color: getStatusColor(order.status), fontWeight: "600", marginLeft: "8px" }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={styles.orderItems}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                          <img 
                            src={Array.isArray(item.productSnapshot?.images) ? item.productSnapshot.images[0] : item.productId?.images?.[0]} 
                            alt={item.productSnapshot?.name || item.productId?.name}
                            style={styles.itemImage}
                          />
                          <div style={styles.itemDetails}>
                            <h4 style={styles.itemName}>{item.productSnapshot?.name || item.productId?.name}</h4>
                            <p style={styles.itemBrand}>{item.productSnapshot?.brand || item.productId?.brand}</p>
                            <div style={styles.itemMeta}>
                              <span>Qty: {item.quantity}</span>
                              {item.productSnapshot?.size && <span>• Size: {item.productSnapshot.size}</span>}
                              {item.productSnapshot?.color && <span>• Color: {item.productSnapshot.color}</span>}
                            </div>
                          </div>
                          <div style={styles.itemPrice}>
                            <div style={styles.finalPrice}>₹{Math.round(item.lineTotal).toLocaleString()}</div>
                            {item.originalPrice > item.discountedPrice && (
                              <div style={styles.originalPrice}>₹{Math.round(item.originalPrice * item.quantity).toLocaleString()}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div style={styles.orderSummary}>
                      <div style={styles.summaryGrid}>
                        <div style={styles.summaryItem}>
                          <span style={styles.summaryLabel}>Subtotal</span>
                          <span style={styles.summaryValue}>₹{Math.round(order.subtotalAmount).toLocaleString()}</span>
                        </div>
                        {order.couponCode && (
                          <div style={styles.summaryItem}>
                            <span style={styles.summaryLabel}>Coupon ({order.couponCode})</span>
                            <span style={{ ...styles.summaryValue, color: "#10b981" }}>-₹{Math.round(order.discountAmount).toLocaleString()}</span>
                          </div>
                        )}
                        <div style={styles.summaryItem}>
                          <span style={styles.summaryLabel}>Delivery</span>
                          <span style={styles.summaryValue}>{order.deliveryCharge === 0 ? "Free" : `₹${order.deliveryCharge}`}</span>
                        </div>
                        <div style={{ ...styles.summaryItem, borderTop: "1px solid #e5e7eb", paddingTop: "12px", marginTop: "8px" }}>
                          <span style={{ ...styles.summaryLabel, fontWeight: "700", color: "#000" }}>Total Paid</span>
                          <span style={{ ...styles.summaryValue, fontWeight: "700", color: "#10b981", fontSize: "18px" }}>
                            ₹{Math.round(order.totalAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div style={styles.deliverySection}>
                      <div style={styles.deliveryInfo}>
                        <FaUser style={{ color: "#6b7280", marginRight: "8px" }} />
                        <div>
                          <div style={styles.deliveryLabel}>Customer</div>
                          <div style={styles.deliveryValue}>{order.customerName}</div>
                        </div>
                      </div>
                      <div style={styles.deliveryInfo}>
                        <FaPhone style={{ color: "#6b7280", marginRight: "8px" }} />
                        <div>
                          <div style={styles.deliveryLabel}>Mobile</div>
                          <div style={styles.deliveryValue}>{order.customerMobile}</div>
                        </div>
                      </div>
                      <div style={styles.deliveryInfo}>
                        <FaMapMarkerAlt style={{ color: "#6b7280", marginRight: "8px" }} />
                        <div>
                          <div style={styles.deliveryLabel}>Address</div>
                          <div style={styles.deliveryValue}>{order.deliveryAddress}</div>
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

      {/* BOTTOM NAVIGATION - Mobile only */}
      {isMobile && (
        <div style={styles.bottomNav}>
          {[
            { id: "home", label: "Home" }, 
            { id: "heart", label: "Wishlist" }, 
            { id: "cart", label: "Cart" }, 
            { id: "user", label: "Profile" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div 
                key={tab.id} 
                style={styles.navPill(isActive)} 
                onClick={() => handleNavClick(tab.id)}
              >
                <IconSVG name={tab.id} />
                {isActive && <span style={styles.navLabel}>{tab.label}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
    paddingBottom: "100px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    backgroundColor: "#fafafa",
    minHeight: "100vh"
  },

  // DESKTOP HEADER
  desktopHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    background: "#fff",
    borderBottom: "1px solid #e5e5e5",
    marginBottom: "24px",
    height: "64px"
  },
  logo: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#000",
    letterSpacing: "-0.5px"
  },
  searchBar: {
    flex: 1,
    maxWidth: "500px",
    margin: "0 32px",
    display: "flex",
    alignItems: "center",
    background: "#f5f5f5",
    borderRadius: "24px",
    padding: "10px 18px",
    border: "1px solid #e5e5e5"
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "14px",
    color: "#333",
    marginLeft: "8px"
  },
  filterIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#fff",
    border: "1px solid #ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#666"
  },
  navIcons: {
    display: "flex",
    gap: "24px"
  },
  navIconItem: (isActive) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    color: isActive ? "#000" : "#666",
    transition: "color 0.3s ease",
    fontSize: "12px",
    fontWeight: "500"
  }),

  // PROFILE CONTENT
  profileContent: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#000",
    margin: "0 0 24px 0"
  },
  profileForm: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  profileImageContainer: {
    display: "flex",
    justifyContent: "center"
  },
  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #000"
  },
  profileFields: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333"
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none"
  },
  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap"
  },
  editBtn: {
    padding: "10px 20px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  },
  updateBtn: {
    padding: "10px 20px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  },
  ordersBtn: {
    padding: "10px 20px",
    background: "#17a2b8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  },
  logoutBtn: {
    padding: "10px 20px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
  },

  // ORDERS SECTION
  ordersSection: {
    marginTop: "32px",
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  ordersTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#000",
    margin: "0 0 8px 0"
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0
  },
  pageHeader: {
    marginBottom: "24px"
  },

  // FILTERS
  filtersSection: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  searchBox: {
    flex: 1,
    minWidth: "300px",
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    padding: "10px 16px"
  },
  searchInputField: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#000"
  },
  statusFilters: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px"
  },
  statusBtn: (isActive) => ({
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #e5e5e5",
    background: isActive ? "#000" : "#fff",
    color: isActive ? "#fff" : "#6b7280",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap"
  }),

  // ORDERS LIST
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  orderCard: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e5e5",
    overflow: "hidden"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
    background: "#fafafa"
  },
  orderInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  orderId: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#000",
    display: "flex",
    alignItems: "center"
  },
  orderDate: {
    fontSize: "13px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center"
  },
  orderStatus: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px"
  },

  // ORDER ITEMS
  orderItems: {
    padding: "16px 20px"
  },
  itemRow: {
    display: "flex",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6"
  },
  itemImage: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #e5e5e5"
  },
  itemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#000",
    margin: "0 0 4px 0"
  },
  itemBrand: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 8px 0"
  },
  itemMeta: {
    fontSize: "12px",
    color: "#9ca3af",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  itemPrice: {
    textAlign: "right",
    minWidth: "120px"
  },
  finalPrice: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#10b981"
  },
  originalPrice: {
    fontSize: "13px",
    color: "#9ca3af",
    textDecoration: "line-through"
  },

  // ORDER SUMMARY
  orderSummary: {
    padding: "16px 20px",
    background: "#fafafa",
    borderTop: "1px solid #f3f4f6"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px"
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#6b7280"
  },
  summaryValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#000"
  },

  // DELIVERY SECTION
  deliverySection: {
    padding: "16px 20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    borderTop: "1px solid #f3f4f6"
  },
  deliveryInfo: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px"
  },
  deliveryLabel: {
    fontSize: "11px",
    color: "#9ca3af",
    textTransform: "uppercase",
    fontWeight: "600"
  },
  deliveryValue: {
    fontSize: "14px",
    color: "#000",
    fontWeight: "500"
  },

  // EMPTY STATE
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e5e5"
  },

  // LOGIN PROMPT
  loginPrompt: {
    textAlign: "center",
    padding: "60px",
    color: "#6b7280",
    backgroundColor: "#fff",
    minHeight: "100vh"
  },

  // BOTTOM NAV
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65px",
    background: "#fff",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
    zIndex: 1000,
    borderTop: "1px solid #f0f0f0",
  },
  navPill: (isActive) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    padding: isActive ? "8px 18px" : "10px 12px",
    background: isActive ? "#000" : "transparent",
    color: isActive ? "#fff" : "#999",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    minWidth: isActive ? "85px" : "50px",
  }),
  navLabel: {
    fontSize: "11px",
    fontWeight: "600",
  },
};

export default Profile;
