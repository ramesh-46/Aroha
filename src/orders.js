import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBoxOpen, FaTruck, FaHome, FaClock, FaShoppingCart,
  FaMoneyBillWave, FaHistory, FaMapMarkerAlt, FaPhoneAlt, FaInfoCircle
} from "react-icons/fa";

function Orders() {
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5000/orders/user/${user._id}`);
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (!user) return (
    <div style={styles.noUser}>
      <FaBoxOpen style={styles.noUserIcon} />
      <p>Please log in to view orders.</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📦 Your Orders</h2>

      {orders.length === 0 ? (
        <div style={styles.noOrders}>
          <FaBoxOpen style={styles.noOrdersIcon} />
          <p>No orders yet.</p>
        </div>
      ) : (
        <div style={styles.ordersGrid}>
          {orders.map((order) => (
            <div key={order._id} style={styles.orderBox}>
              {/* Order Header */}
              <div style={styles.orderHeader}>
                <div style={styles.orderId}>
                  <FaShoppingCart style={styles.icon} />
                  <span>Order #{order._id.substring(0, 8)}</span>
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
                  {order.items.slice(0, 3).map((i) => (
                    <div key={i.productId._id} style={styles.itemBox}>
                      <img
                        src={`http://localhost:5000/uploads/${i.productId.images?.[0]}`}
                        alt={i.productId.name}
                        style={styles.itemImage}
                      />
                      <div style={styles.itemDetails}>
                        <p style={styles.itemName}>{i.productId.name.substring(0, 15)}...</p>
                        <p style={styles.itemQty}>Qty: {i.quantity}</p>
                        <p style={styles.itemPrice}>₹{(i.productId.finalPrice || i.productId.price) * i.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div style={styles.moreItems}>
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              {/* Order Footer */}
              <div style={styles.orderFooter}>
                <div style={styles.total}>
                  <FaMoneyBillWave style={styles.icon} />
                  <span>Total: ₹{order.items.reduce((sum, i) => sum + (i.productId.finalPrice || i.productId.price) * i.quantity, 0)}</span>
                </div>
                <div style={styles.date}>
                  <FaClock style={styles.icon} />
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status History (Collapsible) */}
              {order.statusHistory?.length > 0 && (
                <div style={styles.historySection}>
                  <h5 style={styles.sectionTitle}>
                    <FaHistory style={styles.icon} /> Status History:
                  </h5>
                  <ul style={styles.historyList}>
                    {order.statusHistory.slice(0, 2).map((s, idx) => (
                      <li key={idx} style={styles.historyItem}>
                        <FaClock style={styles.smallIcon} />
                        <span>{s.status} at {new Date(s.updatedAt).toLocaleTimeString()}</span>
                      </li>
                    ))}
                    {order.statusHistory.length > 2 && (
                      <li style={styles.moreHistory}>+{order.statusHistory.length - 2} more updates</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
    color: "#333",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "2rem",
    marginBottom: "20px",
    textAlign: "center",
    color: "#2c3e50",
  },
  noUser: {
    padding: "40px",
    textAlign: "center",
    color: "#666",
  },
  noUserIcon: {
    fontSize: "3rem",
    color: "#ddd",
    marginBottom: "10px",
  },
  noOrders: {
    padding: "40px",
    textAlign: "center",
    color: "#666",
  },
  noOrdersIcon: {
    fontSize: "3rem",
    color: "#ddd",
    marginBottom: "10px",
  },
  ordersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  orderBox: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "15px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    ":hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    },
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px dashed #eee",
  },
  orderId: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  customerInfo: {
    marginBottom: "12px",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    marginBottom: "6px",
    color: "#555",
  },
  itemsSection: {
    margin: "12px 0",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    marginBottom: "10px",
    color: "#2c3e50",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "10px",
  },
  itemBox: {
    border: "1px solid #eee",
    borderRadius: "6px",
    padding: "6px",
    background: "#fefefe",
    textAlign: "center",
  },
  itemImage: {
    width: "100%",
    height: "60px",
    objectFit: "cover",
    borderRadius: "4px",
    marginBottom: "4px",
  },
  itemDetails: {
    fontSize: "0.75rem",
  },
  itemName: {
    margin: "0 0 2px 0",
    fontWeight: "500",
  },
  itemQty: {
    margin: "0 0 2px 0",
    color: "#666",
  },
  itemPrice: {
    margin: 0,
    fontWeight: "bold",
    color: "#28a745",
  },
  moreItems: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60px",
    background: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #eee",
    fontSize: "0.75rem",
    color: "#666",
  },
  orderFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
    paddingTop: "8px",
    borderTop: "1px dashed #eee",
  },
  total: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95rem",
    fontWeight: "bold",
    color: "#28a745",
  },
  date: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.8rem",
    color: "#666",
  },
  historySection: {
    marginTop: "12px",
    paddingTop: "8px",
    borderTop: "1px dashed #eee",
  },
  historyList: {
    paddingLeft: "15px",
    margin: 0,
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.8rem",
    marginBottom: "6px",
    color: "#555",
  },
  moreHistory: {
    fontSize: "0.75rem",
    color: "#999",
    textAlign: "center",
    marginTop: "4px",
  },
  icon: {
    color: "#666",
    fontSize: "0.9rem",
  },
  smallIcon: {
    color: "#666",
    fontSize: "0.75rem",
  },
  status_pending: {
    color: "#ffc107",
  },
  status_under_confirmation: {
    color: "#17a2b8",
  },
  status_processing: {
    color: "#007bff",
  },
  status_packing: {
    color: "#6f42c1",
  },
  status_delivered: {
    color: "#28a745",
  },
  // --- Media Queries ---
  "@media (max-width: 1200px)": {
    ordersGrid: {
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    },
  },
  "@media (max-width: 768px)": {
    ordersGrid: {
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    },
  },
  "@media (max-width: 480px)": {
    ordersGrid: {
      gridTemplateColumns: "1fr",
    },
  },
};

export default Orders;
