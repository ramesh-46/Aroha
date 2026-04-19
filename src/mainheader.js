import React, { useState } from "react";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const NavIcon = ({ name }) => {
  const paths = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    cart: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.home} />
    </svg>
  );
};

function MainHeader({ selectedCategory, setSelectedCategory, onFilterClick, onNavClick }) {
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const mainCategories = ["All", "Men", "Women", "Jewelry", "Accessories", "Children"];

  const styles = {
    header: {
      display: "flex",
      flexDirection: "column", 
      padding: "8px 20px",
      background: "#ffffff",
      borderBottom: "1px solid #f0f0f0",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      fontFamily: "'Inter', sans-serif",
      gap: "8px"
    },
    topRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: { 
      fontSize: "22px", 
      fontWeight: "800", 
      color: "#111", 
      letterSpacing: "-0.5px",
      cursor: "pointer",
    },
    searchContainer: {
      flex: 1,
      maxWidth: "400px",
      margin: "0 20px",
      display: "flex",
      alignItems: "center",
      background: "#f5f5f7",
      borderRadius: "50px",
      padding: "8px 16px",
      border: "1px solid transparent",
    },
    searchInput: {
      flex: 1,
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: "14px",
      color: "#333",
      marginLeft: "10px",
      fontWeight: "500",
    },
    filterBtn: {
      background: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#555",
    },
    nav: {
      display: "flex",
      gap: "8px",
    },
    navButton: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      padding: "6px 12px",
      borderRadius: "12px",
      border: "none",
      background: "transparent",
      fontSize: "11px",
      fontWeight: "600",
      color: "#666",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    navButtonActive: {
      color: "#111",
      background: "#f5f5f5",
    },
    catRow: {
      display: "flex",
      justifyContent: "center",
      gap: "10px",
      overflowX: "auto",
      paddingBottom: "4px",
      scrollbarWidth: "none",
    },
    catPill: (isActive) => ({
      padding: "6px 16px",
      borderRadius: "20px",
      background: isActive ? "#111" : "#fff",
      color: isActive ? "#fff" : "#666",
      border: "1px solid #eee",
      fontSize: "13px",
      fontWeight: "600",
      whiteSpace: "nowrap",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: isActive ? "0 4px 10px rgba(0,0,0,0.1)" : "none",
    })
  };

  const navItems = [
    { id: "home", label: "Home", icon: "home" },
    { id: "wishlist", label: "Wishlist", icon: "heart" },
    { id: "cart", label: "Cart", icon: "cart" },
    { id: "profile", label: "Profile", icon: "user" },
  ];

  return (
    <div style={styles.header}>
      <div style={styles.topRow}>
        <div style={styles.logo}>AROHA HUB</div>
        
        <div style={styles.searchContainer}>
          <SearchIcon />
          <input type="text" placeholder="Search luxury items..." style={styles.searchInput} />
          <div style={styles.filterBtn} onClick={onFilterClick}><FilterIcon /></div>
        </div>

        <div style={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.navButton,
                ...(hoveredBtn === item.id ? styles.navButtonActive : {})
              }}
              onMouseEnter={() => setHoveredBtn(item.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              // Pass the item ID to the parent handler which determines navigation vs state change
              onClick={() => onNavClick && onNavClick(item.id)}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.catRow}>
        {mainCategories.map(cat => (
          <div 
            key={cat} 
            style={styles.catPill(selectedCategory === cat)}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainHeader;