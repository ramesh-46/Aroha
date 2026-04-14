import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "./sweetalertConfig";

function SupportCenter() {
  const seller = JSON.parse(localStorage.getItem("sellerData") || "null");
  const [queries, setQueries] = useState([]);
  const [activeQuery, setActiveQuery] = useState(null);
  const [reply, setReply] = useState("");

  const fetchQueries = async () => {
    try {
      const res = await axios.get("https://aroha.onrender.com/support");
      setQueries(res.data.queries || []);
      if (!activeQuery && res.data.queries?.length) {
        setActiveQuery(res.data.queries[0]);
      }
    } catch (err) {
      console.error("Failed to load support queries", err);
      Swal.fire("Unable to load support queries.", "", "error");
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const sendReply = async () => {
    if (!activeQuery?._id || !reply.trim()) return;
    try {
      const res = await axios.post(`https://aroha.onrender.com/support/${activeQuery._id}/reply`, {
        senderType: "admin",
        senderId: seller?._id,
        message: reply.trim()
      });
      const updated = res.data.query;
      setQueries((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setActiveQuery(updated);
      setReply("");
    } catch (err) {
      console.error("Failed to send reply", err);
      Swal.fire("Unable to send reply.", "", "error");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Customer Queries</h2>
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          {queries.map((query) => (
            <button
              key={query._id}
              style={{
                ...styles.queryButton,
                background: activeQuery?._id === query._id ? "#fee2e2" : "#fff"
              }}
              onClick={() => setActiveQuery(query)}
            >
              <strong>{query.userId?.name || "Customer"}</strong>
              <span>{query.productName || "General support"}</span>
              <small>{query.status}</small>
            </button>
          ))}
        </div>
        <div style={styles.chatPanel}>
          {!activeQuery ? (
            <p>Select a query to start responding.</p>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <h3 style={{ margin: 0 }}>{activeQuery.productName || "Support conversation"}</h3>
                <p style={styles.meta}>Customer: {activeQuery.userId?.name || "Unknown"}</p>
              </div>
              <div style={styles.messages}>
                {(activeQuery.messages || []).map((message) => (
                  <div
                    key={message._id}
                    style={{
                      ...styles.message,
                      alignSelf: message.senderType === "admin" ? "flex-end" : "flex-start",
                      background: message.senderType === "admin" ? "#111827" : "#f3f4f6",
                      color: message.senderType === "admin" ? "#fff" : "#111827"
                    }}
                  >
                    <strong>{message.senderType === "admin" ? "Admin" : "Customer"}</strong>
                    <span>{message.message}</span>
                  </div>
                ))}
              </div>
              <div style={styles.replyRow}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply to customer"
                  style={styles.textarea}
                />
                <button style={styles.sendButton} onClick={sendReply}>
                  Send Reply
                </button>
              </div>
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
    minHeight: "100vh",
    background: "#f6f7fb"
  },
  heading: {
    margin: "0 0 18px"
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "18px"
  },
  sidebar: {
    background: "#fff",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "10px",
    alignContent: "start",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
  },
  queryButton: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer",
    display: "grid",
    gap: "4px"
  },
  chatPanel: {
    background: "#fff",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "14px"
  },
  chatHeader: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "10px"
  },
  meta: {
    margin: "6px 0 0",
    color: "#6b7280"
  },
  messages: {
    minHeight: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  message: {
    maxWidth: "70%",
    borderRadius: "14px",
    padding: "10px 12px",
    display: "grid",
    gap: "6px"
  },
  replyRow: {
    display: "grid",
    gap: "10px"
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #d0d7e2"
  },
  sendButton: {
    justifySelf: "start",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer"
  }
};

export default SupportCenter;
