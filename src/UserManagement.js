import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "./sweetalertConfig";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (query = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/auth/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
      Swal.fire("Unable to load users.", "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openUser = async (user) => {
    try {
      const res = await axios.get(`http://localhost:5000/auth/users/${user._id}/orders`);
      setSelectedUser(res.data.user);
      setUserOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch user orders", err);
      Swal.fire("Unable to load user details.", "", "error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Users & Order History</h2>
        <div style={styles.searchRow}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, mobile, email, or ID"
            style={styles.input}
          />
          <button style={styles.button} onClick={() => fetchUsers(search)}>
            Search
          </button>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={styles.panel}>
          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((user) => (
              <button key={user._id} style={styles.userCard} onClick={() => openUser(user)}>
                <strong>{user.name || "Unnamed User"}</strong>
                <span>{user.mobile}</span>
                <span>{user.email || "No email"}</span>
                <small>{user._id}</small>
              </button>
            ))
          )}
        </div>

        <div style={styles.panel}>
          {!selectedUser ? (
            <p>Select a user to view full details and order history.</p>
          ) : (
            <>
              <div style={styles.userSummary}>
                <h3 style={{ margin: "0 0 8px" }}>{selectedUser.name || "Unnamed User"}</h3>
                <p style={styles.meta}>Mobile: {selectedUser.mobile}</p>
                <p style={styles.meta}>Email: {selectedUser.email || "No email"}</p>
                <p style={styles.meta}>Address: {selectedUser.address || "No address"}</p>
              </div>
              <h4 style={styles.sectionTitle}>Order History</h4>
              {userOrders.length === 0 ? (
                <p>No orders for this user yet.</p>
              ) : (
                userOrders.map((order) => (
                  <div key={order._id} style={styles.orderCard}>
                    <strong>Order #{order._id.slice(-6)}</strong>
                    <p style={styles.meta}>Status: {order.status}</p>
                    <p style={styles.meta}>Coupon: {order.couponCode || "None"}</p>
                    <p style={styles.meta}>Total: Rs. {Math.round(order.totalAmount || 0)}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f6f7fb",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px"
  },
  heading: {
    margin: 0
  },
  searchRow: {
    display: "flex",
    gap: "10px",
    flex: "1 1 360px"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 380px) 1fr",
    gap: "18px"
  },
  panel: {
    background: "#fff",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "12px",
    alignContent: "start"
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d0d7e2"
  },
  button: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer"
  },
  userCard: {
    textAlign: "left",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    cursor: "pointer",
    display: "grid",
    gap: "4px"
  },
  userSummary: {
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb"
  },
  sectionTitle: {
    margin: "4px 0 0"
  },
  orderCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px"
  },
  meta: {
    margin: "4px 0"
  }
};

export default UserManagement;
