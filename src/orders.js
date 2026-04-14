import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "./sweetalertConfig";
import {
  FaBoxOpen, FaTruck, FaHome, FaClock, FaShoppingCart,
  FaMoneyBillWave, FaHistory, FaMapMarkerAlt, FaPhoneAlt,
  FaExclamationTriangle, FaImage, FaQuestionCircle
} from "react-icons/fa";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supportThreads, setSupportThreads] = useState([]);
  const [activeSupport, setActiveSupport] = useState(null);
  const [supportMessage, setSupportMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.get(`https://aroha.onrender.com/orders/user/${user._id}`);
      setOrders(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (user?._id) {
      fetchSupportThreads();
    }
  }, []);

  const fetchSupportThreads = async () => {
    try {
      const res = await axios.get(`https://aroha.onrender.com/support?userId=${user._id}`);
      setSupportThreads(res.data.queries || []);
    } catch (err) {
      console.error("Failed to fetch support queries", err);
    }
  };

  // Helper function to safely get product image
  const getProductImage = (item) => {
    let img = null;
    if (item.productSnapshot?.images && item.productSnapshot.images.length > 0) {
      img = item.productSnapshot.images[0];
    } else if (item.productId?.images && item.productId.images.length > 0) {
      img = item.productId.images[0];
    }
    
    if (img) {
      return img.startsWith("http") ? img : `https://aroha.onrender.com/uploads/${img}`;
    }
    return "https://via.placeholder.com/150?text=No+Image";
  };

  // Helper function to safely get product name
  const getProductName = (item) => {
    if (item.productSnapshot?.name) return item.productSnapshot.name;
    if (item.productId?.name) return item.productId.name;
    return "Unknown Product";
  };

  // Helper function to safely get product price
  const getProductPrice = (item) => {
    if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
      return item.discountedPrice * item.quantity;
    }
    if (!item.productId) return 0;
    const originalPrice = Number(item.productId.price) || 0;
    const finalPrice = Number(item.productId.finalPrice);
    const hasDiscount = Number.isFinite(finalPrice) && finalPrice < originalPrice;

    return (hasDiscount ? finalPrice : originalPrice) * item.quantity;
  };

  const formatPrice = (value) => Math.round(Number(value) || 0);

  const openSupport = (order, item) => {
    const existingThread = supportThreads.find(
      (thread) =>
        (thread.orderId === order._id || thread.orderId?._id === order._id) &&
        (thread.productId === item.productId?._id || thread.productId?._id === item.productId?._id)
    );

    setActiveSupport({
      order,
      item,
      thread: existingThread || null
    });
    setSupportMessage("");
  };

  const sendSupportMessage = async () => {
    if (!activeSupport || !supportMessage.trim()) return;

    try {
      let thread = activeSupport.thread;
      if (!thread) {
        const res = await axios.post("https://aroha.onrender.com/support", {
          userId: user._id,
          orderId: activeSupport.order._id,
          productId: activeSupport.item.productId?._id,
          productName: getProductName(activeSupport.item),
          message: supportMessage.trim()
        });
        thread = res.data.query;
      } else {
        const res = await axios.post(`https://aroha.onrender.com/support/${thread._id}/reply`, {
          senderType: "user",
          senderId: user._id,
          message: supportMessage.trim()
        });
        thread = res.data.query;
      }

      setSupportThreads((prev) => {
        const exists = prev.some((item) => item._id === thread._id);
        return exists ? prev.map((item) => (item._id === thread._id ? thread : item)) : [thread, ...prev];
      });
      setActiveSupport((prev) => ({ ...prev, thread }));
      setSupportMessage("");
    } catch (err) {
      console.error("Failed to send support message", err);
      Swal.fire("Error", "Unable to send help request.", "error");
    }
  };

  if (!user) return (
    <div style={styles.noUser}>
      <FaBoxOpen style={styles.noUserIcon} />
      <p>Please log in to view orders.</p>
    </div>
  );

  if (loading) return (
    <div style={styles.loading}>
      <FaBoxOpen style={styles.loadingIcon} />
      <p>Loading orders...</p>
    </div>
  );

  if (error) return (
    <div style={styles.error}>
      <FaExclamationTriangle style={styles.errorIcon} />
      <p>{error}</p>
      <button onClick={fetchOrders} style={styles.retryButton}>Retry</button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📦 Your Orders</h2>

      {orders.length === 0 ? (
        <div style={styles.noOrders}>
          <FaBoxOpen style={styles.noOrdersIcon} />
          <p>No orders found.</p>
        </div>
      ) : (
        <div style={styles.ordersGrid}>
          {orders.map((order) => {
            const itemSubtotal = order.items.reduce((sum, i) => sum + getProductPrice(i), 0);
            const couponDiscount = Number(order.discountAmount) || 0;
            const finalOrderTotal = Math.max(itemSubtotal - couponDiscount, 0);

            return (
            <div key={order._id} style={styles.orderBox}>
              {/* Order Header */}
              <div style={styles.orderHeader}>
                <div style={styles.orderId}>
                  <FaShoppingCart style={styles.icon} />
                  <span>Order #{order._id.substring(0, 8)}...</span>
                </div>
                <div style={styles.status}>
                  <FaTruck style={styles.icon} />
                  <span style={styles[`status_${order.status.toLowerCase().replace(" ", "_")}`]}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div style={styles.customerInfo}>
                <div style={styles.infoRow}>
                  <FaPhoneAlt style={styles.icon} />
                  <span>{order.customerName}</span>
                </div>
                <div style={styles.infoRow}>
                  <FaPhoneAlt style={styles.icon} />
                  <span>{order.customerMobile}</span>
                </div>
                <div style={styles.infoRow}>
                  <FaMapMarkerAlt style={styles.icon} />
                  <span>{order.deliveryAddress.substring(0, 25)}...</span>
                </div>
              </div>

              {/* Items Preview */}
              <div style={styles.itemsSection}>
                <h5 style={styles.sectionTitle}>Items:</h5>
                <div style={styles.itemsGrid}>
                  {order.items.map((i) => {
                    const originalUnitPrice = (i.originalPrice !== undefined && i.originalPrice !== null) ? i.originalPrice : (Number(i.productId?.price) || 0);
                    const discountedUnitPrice = (i.discountedPrice !== undefined && i.discountedPrice !== null) ? i.discountedPrice : Number(i.productId?.finalPrice);
                    const hasDiscount = Number.isFinite(discountedUnitPrice) && discountedUnitPrice < originalUnitPrice;
                    const originalTotalPrice = originalUnitPrice * i.quantity;
                    const finalTotalPrice = (hasDiscount ? discountedUnitPrice : originalUnitPrice) * i.quantity;

                    return (
                      <div key={i._id} style={styles.itemBox}>
                        <img
                          src={getProductImage(i)}
                          alt={getProductName(i)}
                          style={styles.itemImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150?text=Image+Error";
                          }}
                        />
                        <div style={styles.itemDetails}>
                          <p style={styles.itemName}>{getProductName(i).substring(0, 15)}...</p>
                          <p style={styles.itemQty}>Qty: {i.quantity}</p>
                          {hasDiscount ? (
                            <div style={styles.itemPriceWrap}>
                              <p style={styles.itemOriginalPrice}>₹{formatPrice(originalTotalPrice)}</p>
                              <p style={styles.itemPrice}>₹{formatPrice(finalTotalPrice)}</p>
                            </div>
                          ) : (
                            <p style={styles.itemPrice}>₹{formatPrice(originalTotalPrice)}</p>
                          )}
                          <button style={styles.helpButton} onClick={() => openSupport(order, i)}>
                            <FaQuestionCircle /> Help
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {order.items.length > 3 && (
                    <div style={styles.moreItems}>
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              {/* Order Footer */}
              <div style={styles.orderFooter}>
                <div style={styles.totalBlock}>
                  {couponDiscount > 0 && (
                    <div style={styles.couponRow}>
                      <span>Coupon Discount:</span>
                      <span>-₹{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div style={styles.total}>
                    <FaMoneyBillWave style={styles.icon} />
                    <span>Total: ₹{formatPrice(finalOrderTotal)}</span>
                  </div>
                </div>
                <div style={styles.date}>
                  <FaClock style={styles.icon} />
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status History */}
              {order.statusHistory?.length > 0 && (
                <div style={styles.historySection}>
                  <h5 style={styles.sectionTitle}>
                    <FaHistory style={styles.icon} /> Status History:
                  </h5>
                  <ul style={styles.historyList}>
                    {order.statusHistory.slice(0, 2).map((s, idx) => (
                      <li key={idx} style={styles.historyItem}>
                        <FaClock style={styles.smallIcon} />
                        <span>{s.status} at {new Date(s.updatedAt).toLocaleString()}</span>
                      </li>
                    ))}
                    {order.statusHistory.length > 2 && (
                      <li style={styles.moreHistory}>+{order.statusHistory.length - 2} more updates</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {activeSupport && (
        <div style={styles.supportOverlay}>
          <div style={styles.supportModal}>
            <h3 style={styles.supportTitle}>Help for {getProductName(activeSupport.item)}</h3>
            <div style={styles.supportMessages}>
              {(activeSupport.thread?.messages || []).length === 0 ? (
                <p style={styles.supportEmpty}>Start the conversation and admin replies will appear here.</p>
              ) : (
                activeSupport.thread.messages.map((message) => (
                  <div
                    key={message._id}
                    style={{
                      ...styles.supportBubble,
                      alignSelf: message.senderType === "user" ? "flex-end" : "flex-start",
                      background: message.senderType === "user" ? "#111827" : "#f3f4f6",
                      color: message.senderType === "user" ? "#fff" : "#111827"
                    }}
                  >
                    <strong>{message.senderType === "user" ? "You" : "Admin"}</strong>
                    <span>{message.message}</span>
                  </div>
                ))
              )}
            </div>
            <textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Describe the issue or question"
              style={styles.supportInput}
            />
            <div style={styles.supportActions}>
              <button style={styles.helpButton} onClick={sendSupportMessage}>Send</button>
              <button style={styles.supportCloseButton} onClick={() => setActiveSupport(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (Premium E-commerce Look)
const styles = {
  container: {
    padding: "40px 20px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#1f2937",
    backgroundColor: "#f3f4f6", // lighter gray
    minHeight: "100vh",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "800",
    marginBottom: "24px",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  noUser: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#6b7280",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  },
  noUserIcon: {
    fontSize: "4rem",
    color: "#d1d5db",
    marginBottom: "16px",
  },
  loading: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#6b7280",
  },
  loadingIcon: {
    fontSize: "3rem",
    color: "#9ca3af",
    marginBottom: "16px",
    animation: "spin 1s linear infinite",
  },
  error: {
    padding: "40px",
    textAlign: "center",
    color: "#ef4444",
    background: "#fef2f2",
    borderRadius: "16px",
    border: "1px solid #fee2e2",
  },
  errorIcon: {
    fontSize: "3rem",
    color: "#ef4444",
    marginBottom: "16px",
  },
  retryButton: {
    marginTop: "16px",
    padding: "10px 20px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  noOrders: {
    padding: "60px",
    textAlign: "center",
    color: "#6b7280",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  },
  noOrdersIcon: {
    fontSize: "4rem",
    color: "#d1d5db",
    marginBottom: "16px",
  },
  ordersGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  orderBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.02)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
    gap: "12px",
  },
  orderId: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#111827",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    padding: "6px 12px",
    borderRadius: "20px",
    background: "#f3f4f6", // default fallback
  },
  customerInfo: {
    marginBottom: "20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "12px",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#4b5563",
    fontWeight: "500",
  },
  itemsSection: {
    margin: "20px 0",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1.05rem",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#111827",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  itemBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "border-color 0.2s",
  },
  itemImage: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
  },
  itemDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  itemName: {
    margin: "0 0 6px 0",
    fontWeight: "600",
    fontSize: "0.95rem",
    color: "#111827",
  },
  itemQty: {
    margin: "0 0 6px 0",
    color: "#6b7280",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  itemPrice: {
    margin: 0,
    fontWeight: "700",
    color: "#10b981", // Emerald green
    fontSize: "1rem",
  },
  itemPriceWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "2px",
  },
  itemOriginalPrice: {
    margin: 0,
    color: "#9ca3af",
    textDecoration: "line-through",
    fontSize: "0.85rem",
  },
  helpButton: {
    marginTop: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "6px 12px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    alignSelf: "flex-start",
  },
  supportOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  supportModal: {
    width: "100%",
    maxWidth: "560px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  supportTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#111827",
  },
  supportMessages: {
    minHeight: "200px",
    maxHeight: "350px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "#f9fafb",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  },
  supportEmpty: {
    margin: "auto",
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
  },
  supportBubble: {
    maxWidth: "85%",
    borderRadius: "16px",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "0.95rem",
    lineHeight: "1.4",
  },
  supportInput: {
    width: "100%",
    minHeight: "100px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "12px 16px",
    fontSize: "0.95rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  supportActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px",
  },
  supportCloseButton: {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 20px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  moreItems: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "106px", // match itemBox approx height
    background: "#f9fafb",
    borderRadius: "12px",
    border: "1px dashed #d1d5db",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6b7280",
  },
  orderFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    flexWrap: "wrap",
    gap: "16px",
  },
  totalBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  couponRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#ef4444",
  },
  total: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1.15rem",
    fontWeight: "800",
    color: "#111827",
  },
  date: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#6b7280",
    fontWeight: "500",
  },
  historySection: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "16px",
    borderRadius: "12px",
  },
  historyList: {
    paddingLeft: "24px",
    margin: 0,
    color: "#4b5563",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.9rem",
    marginBottom: "10px",
    fontWeight: "500",
  },
  moreHistory: {
    fontSize: "0.85rem",
    color: "#9ca3af",
    marginTop: "8px",
    listStyle: "none",
    fontWeight: "500",
  },
  icon: {
    color: "#6b7280",
    fontSize: "1.1rem",
  },
  smallIcon: {
    color: "#9ca3af",
    fontSize: "0.85rem",
  },
  status_pending: {
    color: "#d97706", // Amber
    background: "#fef3c7",
  },
  status_under_confirmation: {
    color: "#0284c7", // Light Blue
    background: "#e0f2fe",
  },
  status_processing: {
    color: "#2563eb", // Blue
    background: "#dbeafe",
  },
  status_packing: {
    color: "#7c3aed", // Violet
    background: "#ede9fe",
  },
  status_delivered: {
    color: "#059669", // Emerald
    background: "#d1fae5",
  },
  "@media (max-width: 768px)": {
    ordersGrid: {
      gap: "16px",
    },
    itemBox: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
    itemImage: {
      width: "100%",
      height: "120px",
    },
  },
};

export default Orders;
