import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";

function UserLogin() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  const luxuryTexts = [
    "Curating your premium experience...",
    "Entering the world of JIGIRI KART...",
    "Just a moment of elegance...",
  ];

  const images = [
    
    "https://i.pinimg.com/1200x/8b/80/9b/8b809bb4a197b259f41c3596c38d84a1.jpg",
    "https://i.pinimg.com/1200x/eb/7a/31/eb7a313a6ad58b772c17669658ae2fb5.jpg",
    "https://i.pinimg.com/736x/01/5b/98/015b987d7d9e6ee026a18e6d9d97998e.jpg",
    "https://i.pinimg.com/736x/27/10/8a/27108a79d1b4bd954c6e474d08bf1e0b.jpg"
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // LOGIN
  const handleLogin = async () => {
    if (!mobile || !password) {
      return showToast("Kindly fill in all credentials.");
    }

    setLoading(true);
    setLoadingText(luxuryTexts[Math.floor(Math.random() * 3)]);

    try {
      const res = await axios.post(
        "https://aroha.onrender.com/auth/login",
        { mobile, password }
      );

      if (res?.data?.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        showToast("Welcome back. Your experience awaits.");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        showToast("Access denied. Please verify your details.");
        setLoading(false);
      }
    } catch {
      showToast("Something went wrong. Please try again shortly.");
      setLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoadingText(luxuryTexts[Math.floor(Math.random() * 3)]);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const res = await axios.post(
        "https://aroha.onrender.com/auth/google-login",
        {
          name: user.displayName,
          email: user.email,
        }
      );

      if (!res.data.isNewUser) {
        localStorage.setItem(
          "user",
          JSON.stringify({ ...res.data.user, photoUrl: user.photoURL })
        );
        showToast("Successfully signed in.");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        navigate("/signup", {
          state: {
            name: res.data.name,
            email: res.data.email,
            photoUrl: user.photoURL,
          },
        });
      }
    } catch {
      showToast("Google authentication was unsuccessful.");
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={container}>
        {/* LEFT */}
        <div style={leftBox}>
          <div style={imageBox}>
            <img src={images[index]} alt="" style={imageStyle} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={rightBox}>
          <div style={card}>
            <h1 style={logo}>JIGIRI KART</h1>
            <h2 style={welcome}>Welcome Back</h2>

            <div style={inputWrapper}>
              <PhoneIcon />
              <input
                type="text"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                style={input}
              />
            </div>

            <div style={inputWrapper}>
              <LockIcon />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
              />
            </div>

            <button onClick={handleLogin} style={primaryBtn}>
              {loading ? <Loader /> : "Login"}
            </button>

            {loading && <p style={loadingTextStyle}>{loadingText}</p>}

            <div style={divider}>OR</div>

            <button onClick={handleGoogleLogin} style={googleBtn}>
              <GoogleIcon /> Continue with Google
            </button>

            <button onClick={handleGoogleLogin} style={outlineBtn}>
              Sign up
            </button>

            <button onClick={() => navigate("/dashboard")} style={skipBtn}>
              Explore without login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ICONS */

const PhoneIcon = () => <span style={{ fontSize: "20px" }}>📱</span>;
const LockIcon = () => <span style={{ fontSize: "20px" }}>🔒</span>;
const GoogleIcon = () => (
  <span style={{ marginRight: "8px", fontWeight: "bold" }}>G</span>
);
const Loader = () => <div style={spinner}></div>;

/* STYLES */

const page = {
  background: "#f4f4f4",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px",
};

const container = {
  width: "100%",
  maxWidth: "1390px",
  display: "flex",
  flexWrap: "wrap",
  gap: "25px",
  background: "#fff",
  padding: "15px",
  borderRadius: "20px",
};

const leftBox = {
  flex: "1 1 620px",
};

const rightBox = {
  flex: "1 1 450px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

/* ✅ FIXED IMAGE SIZE (NO JUMP) */
const imageBox = {
  width: "100%",
  aspectRatio: "16 / 9", // 🔥 FIXED RATIO
  overflow: "hidden",
  borderRadius: "12px",
  background: "#eee",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover", // 🔥 keeps image perfect
  transition: "opacity 0.4s ease-in-out",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  textAlign: "center",
};

const logo = {
  fontSize: "48px",
  fontWeight: "bold",
};

const welcome = {
  fontSize: "28px",
  marginBottom: "20px",
};

const inputWrapper = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "15px",
};

const input = {
  border: "none",
  outline: "none",
  marginLeft: "10px",
  width: "100%",
  fontSize: "17px",
};

const primaryBtn = {
  width: "100%",
  padding: "15px",
  background: "#000",
  color: "#fff",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "17px",
};

const googleBtn = {
  width: "100%",
  padding: "15px",
  background: "#000",
  color: "#fff",
  borderRadius: "12px",
  marginBottom: "10px",
};

const outlineBtn = {
  width: "100%",
  padding: "15px",
  border: "3px solid #000",
  borderRadius: "12px",
};

const divider = {
  margin: "15px 0",
  color: "#888",
};

const skipBtn = {
  marginTop: "15px",
  background: "transparent",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

const spinner = {
  width: "18px",
  height: "18px",
  border: "2px solid #fff",
  borderTop: "2px solid transparent",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const loadingTextStyle = {
  marginTop: "10px",
  fontSize: "14px",
  color: "#666",
};

/* ✅ PREMIUM TOAST */
const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "#000",
  color: "#fff",
  padding: "14px 22px",
  borderRadius: "12px",
  fontSize: "14px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  animation: "fadeIn 0.3s ease",
};

export default UserLogin;