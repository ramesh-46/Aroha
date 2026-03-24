import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [form, setForm] = useState(JSON.parse(localStorage.getItem("user")) || {});
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async () => {
    try {
      const res = await axios.post("http://localhost:5000/auth/profile/update", form);
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

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Profile</h2>

      <div style={styles.buttonRow}>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
            Edit
          </button>
        ) : (
          <button onClick={handleUpdate} style={styles.updateBtn}>
            Save Changes
          </button>
        )}
      </div>

      <div style={styles.grid}>
        {Object.keys(form)
          .filter((key) => key !== "password" && key !== "createdAt") // remove password and createdAt
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

      <button onClick={handleLogout} style={styles.logoutBtn}>
        Logout
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  },
  editBtn: {
    padding: "10px 18px",
    background: "#010102ff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  updateBtn: {
    padding: "10px 18px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  logoutBtn: {
    width: "100%",
    padding: "12px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    marginTop: "20px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default Profile;

// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { FaUser, FaMobileAlt, FaEnvelope, FaVenusMars, FaHome, FaInfoCircle, FaLock, FaSignOutAlt } from "react-icons/fa";

// function Profile() {
//   const [form, setForm] = useState(JSON.parse(localStorage.getItem("user")) || {});
//   const navigate = useNavigate();

//   const handleUpdate = async () => {
//     try {
//       const res = await axios.post("http://localhost:5000/auth/profile/update", form);
//       if (res.data.success) {
//         localStorage.setItem("user", JSON.stringify(res.data.user));
//         alert("Profile updated!");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/");
//   };

//   return (
//     <div style={formContainer}>
//       <h2>Profile</h2>
//       {Object.keys(form).map((key) => (
//         <div key={key} style={inputWrapper}>
//           <div style={iconStyle}>
//             {key === "name" && <FaUser />}
//             {key === "mobile" && <FaMobileAlt />}
//             {key === "email" && <FaEnvelope />}
//             {key === "password" && <FaLock />}
//             {key === "gender" && <FaVenusMars />}
//             {key === "address" && <FaHome />}
//             {key === "details" && <FaInfoCircle />}
//           </div>
//           <input
//             placeholder={key}
//             value={form[key] || ""}
//             onChange={(e) => setForm({ ...form, [key]: e.target.value })}
//             style={inputStyle}
//             disabled={key === "_id" || key === "createdAt" || key === "__v"}
//           />
//         </div>
//       ))}
//       <button onClick={handleUpdate} style={btnStyle}>Update Profile</button>
//       <button onClick={handleLogout} style={logoutBtnStyle}>
//         <FaSignOutAlt style={{ marginRight: "8px" }} /> Logout
//       </button>
//     </div>
//   );
// }

// const formContainer = {
//   maxWidth: "400px",
//   margin: "50px auto",
//   padding: "20px",
//   border: "1px solid #ccc",
//   borderRadius: "10px",
//   textAlign: "center",
// };

// const inputWrapper = {
//   display: "flex",
//   alignItems: "center",
//   width: "90%",
//   margin: "10px auto",
//   position: "relative",
// };

// const iconStyle = {
//   position: "absolute",
//   left: "10px",
//   color: "#999",
// };

// const inputStyle = {
//   width: "100%",
//   padding: "10px 10px 10px 35px",
//   margin: "10px 0",
//   borderRadius: "5px",
//   border: "1px solid #ccc",
// };

// const btnStyle = {
//   width: "95%",
//   padding: "10px",
//   background: "#000",
//   color: "#fff",
//   border: "none",
//   borderRadius: "5px",
//   cursor: "pointer",
//   margin: "15px 0",
// };

// const logoutBtnStyle = {
//   width: "95%",
//   padding: "10px",
//   background: "#dc3545",
//   color: "#fff",
//   border: "none",
//   borderRadius: "5px",
//   cursor: "pointer",
//   margin: "10px 0",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
// };

// export default Profile;
