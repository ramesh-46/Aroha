import React, { useEffect, useState } from "react";
import axios from "axios";

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    actionType: "",
    fromDate: "",
    toDate: "",
    notTakenAction: false,
    showRecentDeliveries: false,
  });
  const [editOrderId, setEditOrderId] = useState(null);

  // --- Fetch Orders ---
  const fetchOrders = async () => {
    try {
      const res = await axios.get("https://aroha.onrender.com/orders/all");
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- Update Order Status ---
  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await axios.put(`https://aroha.onrender.com/orders/status/${orderId}`, { status });
      setOrders(orders.map((o) => (o._id === orderId ? res.data : o)));
      setEditOrderId(null);
    } catch (err) {
      console.log(err);
      alert("Failed to update status");
    }
  };

  // --- Filter Logic ---
  const filteredOrders = orders.filter((order) => {
    if (filters.actionType && order.status !== filters.actionType) return false;
    if (filters.notTakenAction && order.status !== "Pending") return false;
    if (filters.fromDate && new Date(order.createdAt) < new Date(filters.fromDate)) return false;
    if (filters.toDate && new Date(order.createdAt) > new Date(filters.toDate)) return false;
    if (!filters.showRecentDeliveries && order.status === "Delivered") return false;
    return true;
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🛒 All Customer Orders</h2>

      {/* --- Filters --- */}
      <div style={styles.filters}>
        <select
          onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
          value={filters.actionType}
          style={styles.select}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Under Confirmation">Under Confirmation</option>
          <option value="Processing">Processing</option>
          <option value="Packing">Packing</option>
          <option value="Delivered">Delivered</option>
        </select>

        <input
          type="date"
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
          value={filters.fromDate}
          style={styles.input}
        />

        <input
          type="date"
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          value={filters.toDate}
          style={styles.input}
        />

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={filters.notTakenAction}
            onChange={(e) => setFilters({ ...filters, notTakenAction: e.target.checked })}
            style={styles.checkbox}
          />
          Pending Only
        </label>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={filters.showRecentDeliveries}
            onChange={(e) => setFilters({ ...filters, showRecentDeliveries: e.target.checked })}
            style={styles.checkbox}
          />
          Show Delivered
        </label>
      </div>

      {/* --- Orders Grid (5-6 per row) --- */}
      {filteredOrders.length === 0 ? (
        <p style={styles.noOrders}>No orders found.</p>
      ) : (
        <div style={styles.ordersGrid}>
          {filteredOrders.map((order) => (
            <div key={order._id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <h4 style={styles.orderId}>Order ID: {order._id.substring(0, 8)}...</h4>
                <p style={styles.status}>Status: <strong>{order.status}</strong></p>
                <p style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>

              <div style={styles.customerInfo}>
                <p>Customer: {order.customerName}</p>
                <p>Mobile: {order.customerMobile}</p>
                <p style={styles.address}>Address: {order.deliveryAddress.substring(0, 15)}...</p>
              </div>

              {/* --- Items Preview (First 2 items) --- */}
              <div style={styles.itemsPreview}>
                {order.items.slice(0, 2).map((i) => (
                  <div key={i.productId._id} style={styles.itemPreview}>
                    <img
                      src={`https://aroha.onrender.com/uploads/${i.productId.images?.[0]}`}
                      alt={i.productId.name}
                      style={styles.itemImage}
                    />
                    <div style={styles.itemDetails}>
                      <p style={styles.itemName}>{i.productId.name.substring(0, 10)}...</p>
                      <p style={styles.itemQty}>Qty: {i.quantity}</p>
                      <p style={styles.itemPrice}>₹{(i.productId.finalPrice || i.productId.price) * i.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && <p style={styles.moreItems}>+{order.items.length - 2} more</p>}
              </div>

              <p style={styles.total}>
                Total: ₹
                {order.items.reduce(
                  (sum, i) => sum + (i.productId.finalPrice || i.productId.price) * i.quantity,
                  0
                )}
              </p>

              {/* --- Edit Status --- */}
              {editOrderId === order._id ? (
                <div style={styles.editStatus}>
                  <select
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    value={order.status}
                    style={styles.select}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Confirmation">Under Confirmation</option>
                    <option value="Processing">Processing</option>
                    <option value="Packing">Packing</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                  <button
                    onClick={() => setEditOrderId(null)}
                    style={styles.saveButton}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditOrderId(order._id)}
                  style={styles.editButton}
                >
                  Edit Status
                </button>
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
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#333",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
    marginBottom: "20px",
    textAlign: "center",
    color: "#2c3e50",
  },
  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
    background: "#f8f9fa",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.9rem",
  },
  checkbox: {
    margin: 0,
  },
  ordersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },
  orderCard: {
    background: "#fff",
    borderRadius: "10px",
    padding: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    ":hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    },
  },
  orderHeader: {
    marginBottom: "10px",
    paddingBottom: "8px",
    borderBottom: "1px dashed #eee",
  },
  orderId: {
    margin: "0 0 4px 0",
    fontSize: "0.9rem",
    color: "#555",
  },
  status: {
    margin: "0 0 4px 0",
    fontSize: "0.85rem",
  },
  date: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#777",
  },
  customerInfo: {
    marginBottom: "10px",
    fontSize: "0.85rem",
  },
  address: {
    fontSize: "0.8rem",
    color: "#666",
  },
  itemsPreview: {
    margin: "10px 0",
  },
  itemPreview: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    padding: "6px",
    background: "#f8f9fa",
    borderRadius: "6px",
    fontSize: "0.8rem",
  },
  itemImage: {
    width: "40px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "4px",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    margin: "0 0 2px 0",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
  itemQty: {
    margin: "0 0 2px 0",
    fontSize: "0.75rem",
    color: "#666",
  },
  itemPrice: {
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  moreItems: {
    fontSize: "0.75rem",
    color: "#999",
    textAlign: "center",
  },
  total: {
    margin: "10px 0",
    fontSize: "1rem",
    fontWeight: "bold",
    textAlign: "right",
  },
  editStatus: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
  },
  saveButton: {
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "5px",
    border: "none",
    background: "#28a745",
    color: "#fff",
    fontSize: "0.8rem",
    flex: 1,
  },
  editButton: {
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "5px",
    border: "1px solid #ddd",
    background: "#f8f9fa",
    fontSize: "0.8rem",
    width: "100%",
    marginTop: "8px",
  },
  noOrders: {
    textAlign: "center",
    fontSize: "1rem",
    color: "#666",
    marginTop: "40px",
  },
};

export default SellerOrders;
