import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Swal from "./sweetalertConfig";

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
  const navigate = useNavigate(); // Initialize useNavigate

  // --- Fetch Orders ---
  const fetchOrders = async () => {

    try {
      const res = await axios.get("http://localhost:5000/orders/all");
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
      const res = await axios.put(`http://localhost:5000/orders/status/${orderId}`, { status });
      setOrders(orders.map((o) => (o._id === orderId ? res.data : o)));
      setEditOrderId(null);
    } catch (err) {
      console.log(err);
      Swal.fire("Error", "Failed to update status", "error");
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
      <div style={styles.headerContainer}>
        <h2 style={styles.heading}>🛒 All Customer Orders</h2>
        <button
          onClick={() => navigate("/Addproduct")}
          style={styles.addProductButton}
        >
          Add Product
        </button>
      </div>

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
                <p style={styles.address}>
                  Location: {order.customerLocation?.lat && order.customerLocation?.lng
                    ? `${order.customerLocation.lat}, ${order.customerLocation.lng}`
                    : "Not shared"}
                </p>
                <p style={styles.address}>Coupon: {order.couponCode || "None"}</p>
              </div>
              {/* --- Items Preview (First 2 items) --- */}
              <div style={styles.itemsPreview}>
                {order.items.slice(0, 2).map((i) => {
                  const imageSrc = i.productSnapshot?.images?.length ? i.productSnapshot.images[0] : (i.productId?.images?.length ? i.productId.images[0] : null);
                  const name = i.productSnapshot?.name || i.productId?.name || "N/A";
                  const origPrice = (i.originalPrice !== undefined && i.originalPrice !== null) ? i.originalPrice : (Number(i.productId?.price) || 0);
                  const discPrice = (i.discountedPrice !== undefined && i.discountedPrice !== null) ? i.discountedPrice : (Number(i.productId?.finalPrice) || 0);
                  
                  return (
                  <div key={i._id} style={styles.itemPreview}>
                    {imageSrc ? (
                      <img
                        src={`http://localhost:5000/uploads/${imageSrc}`}
                        alt={name}
                        style={styles.itemImage}
                      />
                    ) : (
                      <div style={{ ...styles.itemImage, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "10px", color: "#999" }}>No Image</span>
                      </div>
                    )}
                    <div style={styles.itemDetails}>
                      <p style={styles.itemName}>{name.substring(0, 10)}...</p>
                      <p style={styles.itemQty}>Qty: {i.quantity}</p>
                      <p style={styles.itemPrice}>Original: ₹{Math.round(origPrice * i.quantity)}</p>
                      <p style={styles.itemPrice}>Discounted: ₹{Math.round(discPrice * i.quantity)}</p>
                    </div>
                  </div>
                )})}
                {order.items.length > 2 && <p style={styles.moreItems}>+{order.items.length - 2} more</p>}
              </div>
              <p style={styles.total}>Total: ₹{Math.round(order.totalAmount || 0)}</p>
              {order.discountAmount > 0 && <p style={styles.meta}>Coupon Deduction: -₹{Math.round(order.discountAmount)}</p>}
              {order.deliveryCharge > 0 && <p style={styles.meta}>Delivery: ₹{Math.round(order.deliveryCharge)}</p>}
              {order.items[0]?.productSnapshot && (
                <details style={styles.snapshotBox}>
                  <summary>Full Product JSON</summary>
                  <pre style={styles.snapshotText}>
                    {JSON.stringify(order.items.map((item) => item.productSnapshot), null, 2)}
                  </pre>
                </details>
              )}
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
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
    marginBottom: "0",
    textAlign: "left",
    color: "#2c3e50",
  },
  addProductButton: {
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "6px",
    border: "none",
    background: "#000",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: "500",
    transition: "background 0.3s ease",
    ":hover": {
      background: "#333",
    },
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
  meta: {
    margin: "4px 0",
    fontSize: "0.8rem",
    color: "#555",
  },
  snapshotBox: {
    marginTop: "8px",
    fontSize: "0.75rem",
  },
  snapshotText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: "140px",
    overflowY: "auto",
    background: "#f8fafc",
    padding: "8px",
    borderRadius: "6px",
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
