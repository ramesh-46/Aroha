import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "./sweetalertConfig";

function ResetPassword() {
  const [form, setForm] = useState({ mobile: "", email: "", recoveryCode: "", newPassword: "" });
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      const res = await axios.post("https://aroha.onrender.com/auth/reset-password", {
        mobile: form.mobile,
        email: form.email,
        recoveryCode: form.recoveryCode
      });

      if (res.data.success && res.data.verified) {
        setVerified(true);
        Swal.fire(res.data.message, "", "warning");
      } else {
        Swal.fire(res.data.message, "", "warning");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Something went wrong!", "", "error");
    }
  };

  const handleReset = async () => {
    if (!form.newPassword) return Swal.fire("Enter new password!", "", "error");

    try {
      const res = await axios.post("https://aroha.onrender.com/auth/reset-password", form);
      if (res.data.success && res.data.updated) {
        Swal.fire(res.data.message, "", "warning");
        navigate("/login"); // redirect to login after reset
      } else {
        Swal.fire(res.data.message, "", "warning");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Something went wrong!", "", "error");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Reset Password</h2>
      <div style={styles.grid}>
        {!verified && (
          <>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Mobile Number</label>
              <input
                style={styles.input}
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Recovery Code</label>
              <input
                style={styles.input}
                value={form.recoveryCode}
                onChange={(e) => setForm({ ...form, recoveryCode: e.target.value })}
              />
            </div>
            <button onClick={handleVerify} style={styles.updateBtn}>Verify</button>
          </>
        )}

        {verified && (
          <>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                style={styles.input}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </div>
            <button onClick={handleReset} style={styles.updateBtn}>Reset Password</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "60px auto",
    padding: "30px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    background: "#fff",
  },
  title: {
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "25px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  updateBtn: {
    padding: "12px 20px",
    background: "#000000ff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "10px",
  },
};

export default ResetPassword;
