import React from "react";
import { FaSearch, FaShoppingCart, FaHeart, FaUser, FaBars, FaTimes, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const Header = ({ isLoggedIn, onLogout, searchValue, onSearchChange, onMenuToggle, isMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    if (!isLoggedIn && path !== "/login") {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  const isDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/product/");

  return (
    <>
      <header style={styles.header}>
        {/* Mobile menu button */}
        <button style={styles.mobileMenuBtn} onClick={onMenuToggle}>
          {isMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {/* Logo */}
        <div style={styles.logoSection} onClick={() => navigate("/dashboard")}>
          <span style={styles.logo}>AROHA HUB</span>
        </div>

        {/* Search - visible on all but can be hidden on very small */}
        {isDashboard && (
          <div style={styles.searchBox}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        )}

        {/* Desktop Navigation Icons - hidden on mobile */}
        <div style={styles.desktopNav}>
          <button style={styles.iconBtn} onClick={() => handleNavigate("/cart")}>
            <FaShoppingCart size={18} />
            <span style={styles.iconLabel}>Cart</span>
          </button>
          <button style={styles.iconBtn} onClick={() => handleNavigate("/profile")}>
            <FaHeart size={18} />
            <span style={styles.iconLabel}>Wishlist</span>
          </button>
          <button style={styles.iconBtn} onClick={() => handleNavigate("/orders")}>
            <FaUser size={18} />
            <span style={styles.iconLabel}>Orders</span>
          </button>
          <button style={styles.iconBtn} onClick={() => handleNavigate("/help")}>
            <FaQuestionCircle size={18} />
            <span style={styles.iconLabel}>Help</span>
          </button>
          {isLoggedIn && (
            <button style={styles.logoutBtn} onClick={onLogout}>
              <FaSignOutAlt size={14} style={{ marginRight: "6px" }} /> Logout
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay (for hamburger) */}
      {isMenuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={onMenuToggle}>
          <div style={styles.mobileMenuContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.mobileNavBtn} onClick={() => { handleNavigate("/dashboard"); onMenuToggle(); }}>Dashboard</button>
            <button style={styles.mobileNavBtn} onClick={() => { handleNavigate("/cart"); onMenuToggle(); }}>Cart</button>
            <button style={styles.mobileNavBtn} onClick={() => { handleNavigate("/profile"); onMenuToggle(); }}>Wishlist</button>
            <button style={styles.mobileNavBtn} onClick={() => { handleNavigate("/orders"); onMenuToggle(); }}>Orders</button>
            <button style={styles.mobileNavBtn} onClick={() => { handleNavigate("/help"); onMenuToggle(); }}>Help</button>
            {isLoggedIn && (
              <button style={{ ...styles.mobileNavBtn, ...styles.mobileLogoutBtn }} onClick={() => { onLogout(); onMenuToggle(); }}>Logout</button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Bottom Navigation for Mobile (shows on all screens, but only visible on mobile via CSS)
export const MobileBottomNav = ({ onNavigate, currentPath }) => {
  const navItems = [
    { icon: <FaSearch size={22} />, label: "Explore", path: "/dashboard" },
    { icon: <FaHeart size={22} />, label: "Wishlist", path: "/profile" },
    { icon: <FaShoppingCart size={22} />, label: "Cart", path: "/cart" },
    { icon: <FaUser size={22} />, label: "Account", path: "/orders" },
    { icon: <FaQuestionCircle size={22} />, label: "Help", path: "/help" },
  ];

  return (
    <div style={styles.bottomNav}>
      {navItems.map((item) => (
        <button
          key={item.path}
          style={{ ...styles.bottomNavItem, color: currentPath === item.path ? "#1a1a1a" : "#999" }}
          onClick={() => onNavigate(item.path)}
        >
          {item.icon}
          <span style={styles.bottomNavLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    gap: "12px",
  },
  logoSection: { cursor: "pointer", flexShrink: 0 },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    fontFamily: "'Cormorant Garamond', serif",
    letterSpacing: "2px",
    background: "linear-gradient(135deg, #fff 0%, #e0e0e0 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  searchBox: { position: "relative", flex: 1, maxWidth: "400px" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px" },
  searchInput: {
    width: "100%",
    padding: "8px 12px 8px 38px",
    border: "none",
    borderRadius: "30px",
    fontSize: "14px",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    outline: "none",
  },
  desktopNav: { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  iconBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", borderRadius: "8px" },
  iconLabel: { fontSize: "10px", marginTop: "2px", opacity: 0.8 },
  logoutBtn: { display: "flex", alignItems: "center", padding: "6px 14px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  mobileMenuBtn: { display: "none", background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: "8px" },
  mobileMenuOverlay: { position: "fixed", top: "60px", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.95)", zIndex: 999, backdropFilter: "blur(8px)" },
  mobileMenuContent: { display: "flex", flexDirection: "column", padding: "20px", gap: "12px" },
  mobileNavBtn: { padding: "14px 20px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: "600", textAlign: "center", cursor: "pointer" },
  mobileLogoutBtn: { background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", marginTop: "8px" },
  
  // Bottom Navigation - visible only on mobile
  bottomNav: {
    display: "none",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    padding: "10px 16px",
    justifyContent: "space-around",
    alignItems: "center",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
    zIndex: 999,
    borderTop: "1px solid #eee",
  },
  bottomNavItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  bottomNavLabel: { fontSize: "10px", fontWeight: "500" },

  // Responsive
  "@media (max-width: 768px)": {
    header: { padding: "10px 16px" },
    logo: { fontSize: "18px" },
    searchInput: { padding: "6px 10px 6px 34px", fontSize: "12px" },
    desktopNav: { display: "none" },  // Hide desktop icons on mobile
    mobileMenuBtn: { display: "flex" },
    bottomNav: { display: "flex" },   // Show bottom navigation on mobile
  },
  "@media (max-width: 480px)": {
    searchBox: { display: "none" },   // Hide search on very small, but can be in bottom nav
    logo: { fontSize: "16px" },
  },
};

export default Header;