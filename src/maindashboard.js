import React, { useEffect, useState } from "react";
import MainHeader from "./mainheader";

// --- ICONS ---
const IconSVG = ({ name }) => {
  const paths = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    cart: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    filter: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2"
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

// --- COUNTDOWN TIMER COMPONENT (Shared for Mobile & Desktop) ---
const CountdownTimer = ({ targetDate, isMobile }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Responsive sizing for timer numbers
  // Mobile: Smaller to fit in compact banner
  const numSize = isMobile ? "16px" : "24px";
  const labelSize = isMobile ? "8px" : "11px";
  const gap = isMobile ? "6px" : "15px";
  
  // GREEN COLOR FOR TIMER AS REQUESTED
  const timerColor = "#00ff22"; 

  const TimeBox = ({ val, label }) => (
    <div style={{ textAlign: "center", minWidth: isMobile ? "24px" : "50px" }}>
      <div style={{ 
        fontSize: numSize, 
        fontWeight: "800", 
        color: timerColor, 
        lineHeight: "1.1",
        fontFamily: "'Inter', sans-serif",
        textShadow: "0 2px 4px rgba(0,0,0,0.5)"
      }}>
        {val.toString().padStart(2, '0')}
      </div>
      <div style={{ 
        fontSize: labelSize, 
        textTransform: "uppercase", 
        color: "#fff", 
        marginTop: "2px",
        fontWeight: "700",
        fontFamily: "'Inter', sans-serif",
        opacity: 0.9
      }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: gap, alignItems: "center", marginTop: isMobile ? "6px" : "15px" }}>
      <TimeBox val={timeLeft.days} label="Days" />
      <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>:</span>
      <TimeBox val={timeLeft.hours} label="Hrs" />
      <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>:</span>
      <TimeBox val={timeLeft.minutes} label="Min" />
      <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>:</span>
      <TimeBox val={timeLeft.seconds} label="Sec" />
    </div>
  );
};

// --- IMAGE CAROUSEL COMPONENT (Shared) ---
const SaleCarousel = ({ images, isMobile }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: "hidden",
      borderRadius: isMobile ? "12px" : "20px",
      zIndex: 1
    }}>
      {images.map((img, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: currentIndex === index ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
        />
      ))}
      {/* Dark Overlay for text readability */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, width: "100%", height: "100%",
        background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 100%)",
        zIndex: 2
      }} />
      
      {/* Dots Indicator */}
      <div style={{
        position: "absolute",
        bottom: isMobile ? "6px" : "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "6px",
        zIndex: 3
      }}>
        {images.map((_, idx) => (
          <div key={idx} style={{
            width: currentIndex === idx ? "16px" : "8px",
            height: "6px",
            borderRadius: "3px",
            background: currentIndex === idx ? "#fff" : "rgba(255,255,255,0.4)",
            transition: "all 0.3s ease"
          }} />
        ))}
      </div>
    </div>
  );
};

function MainDashboard() {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState("home");
  const [visibleItems, setVisibleItems] = useState([]);
  
  // Backend Data States
  const [saleData, setSaleData] = useState(null);
  const [saleImages, setSaleImages] = useState([]);
  const [saleMessage, setSaleMessage] = useState("");
  const [targetDate, setTargetDate] = useState(null);
  const [saleType, setSaleType] = useState("Super Sale");

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    sort: "latest",
    rating: "all",
    collection: "all"
  });

  const subCategoryMap = {
    "All": ["All"],
    "Men": ["All", "T-Shirts", "Shirts", "Jeans", "Jackets", "Shoes"],
    "Women": ["All", "Dresses", "Tops", "Skirts", "Heels", "Bags"],
    "Jewelry": ["All", "Necklaces", "Rings", "Earrings", "Bracelets"],
    "Accessories": ["All", "Watches", "Sunglasses", "Belts", "Hats"],
    "Groceries": ["All", "Fruits", "Vegetables", "Dairy", "Snacks"]
  };

  // Fetch Backend Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("https://aroha.onrender.com/settings");
        const data = await response.json();
        
        if (data.success && data.settings) {
          setSaleImages(data.settings.saleImages || []);
          setSaleMessage(data.settings.saleBannerMessage || "Unmissable deals!");
          
          const backendType = data.settings.flashSaleCategory;
          if (backendType && backendType.trim() !== "") {
            setSaleType(`${backendType} Sale`);
          } else {
            setSaleType("Super Sale");
          }

          if (data.saleStatus === "live") {
            setTargetDate(data.settings.saleEndsAt);
          } else {
            setTargetDate(data.settings.saleStartsAt);
          }
          setSaleData(data.settings);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        setSaleMessage("Unmissable deals on your favorite styles – shop the sale before it’s gone!");
        setSaleImages([
           "https://i.pinimg.com/1200x/00/1e/dd/001eddfc4ae1cf9b78cd4bb242a8d3b2.jpg"
        ]);
      }
    };

    fetchSettings();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    const timer = setTimeout(() => {
      setLoading(false);
      const items = Array.from({ length: 8 }, (_, i) => i);
      items.forEach((_, index) => {
        setTimeout(() => setVisibleItems(prev => [...prev, index]), index * 100);
      });
    }, 600);

    return () => { clearTimeout(timer); window.removeEventListener("resize", handleResize); };
  }, []);

  useEffect(() => {
    setSelectedSubCategory("All");
  }, [selectedCategory]);

  // Mock Products
  const products = Array.from({ length: 30 }).map((_, i) => {
    let category = "Men";
    let subCat = "T-Shirts";
    if (i % 5 === 0) { category = "Women"; subCat = "Dresses"; }
    if (i % 5 === 1) { category = "Jewelry"; subCat = "Rings"; }
    if (i % 5 === 2) { category = "Groceries"; subCat = "Fruits"; }
    if (i % 5 === 3) { category = "Accessories"; subCat = "Watches"; }
    if(category === "Men") subCat = ["T-Shirts", "Jeans", "Jackets"][i % 3];

    return {
      id: i,
      name: `${category === 'Groceries' ? 'Organic' : 'Urban'} ${subCat.slice(0, -1)} ${i + 1}`,
      price: 500 + (i * 100),
      mainCategory: category,
      subCategory: subCat,
      collection: i % 3 === 0 ? "Luxury" : i % 3 === 1 ? "Premium" : "Signature",
      rating: Math.floor(Math.random() * 2) + 4,
      orders: Math.floor(Math.random() * 1000),
      date: Date.now() - (i * 86400000)
    };
  });

  const getFilteredProducts = () => {
    let result = [...products];
    if (selectedCategory !== "All") result = result.filter(p => p.mainCategory === selectedCategory);
    if (selectedSubCategory !== "All") result = result.filter(p => p.subCategory === selectedSubCategory);
    if (filters.collection !== "all") result = result.filter(p => p.collection.toLowerCase() === filters.collection);
    if (filters.rating !== "all") result = result.filter(p => p.rating >= parseInt(filters.rating));
    
    if (filters.sort === "low-high") result.sort((a, b) => a.price - b.price);
    else if (filters.sort === "high-low") result.sort((a, b) => b.price - a.price);
    else if (filters.sort === "most-ordered") result.sort((a, b) => b.orders - a.orders);
    else result.sort((a, b) => b.date - a.date);

    return result;
  };

  const filteredProducts = getFilteredProducts();
  const currentSubCategories = subCategoryMap[selectedCategory] || ["All"];

  const styles = {
    container: {
      fontFamily: "'Inter', sans-serif",
      background: "#fafafa",
      minHeight: "100vh",
      paddingBottom: isMobile ? "80px" : "40px",
      opacity: loading ? 0 : 1,
      transition: "opacity 0.5s ease",
    },
    mobileTopSection: {
      position: "sticky",
      top: 0,
      zIndex: 900,
      background: "rgba(250, 250, 250, 0.95)",
      backdropFilter: "blur(10px)",
      padding: "10px 16px",
      borderBottom: "1px solid rgba(0,0,0,0.05)",
    },
    searchRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "12px",
    },
    searchBox: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      background: "#fff",
      borderRadius: "12px",
      padding: "10px 14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      border: "1px solid #eee",
    },
    searchInput: {
      flex: 1,
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: "14px",
      color: "#111",
      marginLeft: "8px",
      fontWeight: "500",
    },
    filterBtnMobile: {
      width: "40px",
      height: "40px",
      background: "#fff",
      border: "1px solid #eee",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#111",
    },
    categoryScroll: {
      display: "flex",
      gap: "10px",
      overflowX: "auto",
      paddingBottom: "5px",
      scrollbarWidth: "none",
    },
    catPill: (isActive) => ({
      padding: "8px 18px",
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
    }),
    /* UPDATED BANNER STYLES FOR COMPACT MOBILE LAYOUT */
    banner: {
      margin: isMobile ? "10px 16px" : "20px",
      // Reduced padding for mobile to fit content better
      padding: isMobile ? "12px 15px" : "40px 60px",
      borderRadius: isMobile ? "12px" : "20px",
      background: "#111", 
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
      aspectRatio: isMobile ? "16/9" : "unset",
      height: isMobile ? "auto" : "320px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    bannerContent: { 
      position: "relative", 
      zIndex: 10,
      maxWidth: isMobile ? "95%" : "600px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: "100%"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: "16px",
      padding: "0 16px",
    },
    card: (index) => ({
      borderRadius: "16px",
      background: "#fff",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      transition: "all 0.3s ease",
      cursor: "pointer",
      opacity: visibleItems.includes(index) ? 1 : 0,
      transform: visibleItems.includes(index) ? "translateY(0)" : "translateY(20px)",
    }),
    imagePlaceholder: { width: "100%", aspectRatio: "1/1", background: "#f0f0f0" },
    cardDetails: { padding: "12px" },
    productName: { fontSize: "14px", color: "#333", fontWeight: "600", marginBottom: "4px" },
    price: { fontWeight: "700", fontSize: "15px", color: "#000" },
    bottomNav: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "60px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderTopLeftRadius: "20px",
      borderTopRightRadius: "20px",
      display: isMobile ? "flex" : "none",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 -5px 15px rgba(0,0,0,0.05)",
      zIndex: 1000,
      paddingBottom: "5px",
      gap: "10px",
    },
    navPill: (isActive) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: isActive ? "8px 16px" : "10px",
      borderRadius: "30px",
      background: isActive ? "#000" : "transparent",
      color: isActive ? "#fff" : "#9ca3af",
      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      cursor: "pointer",
      minWidth: isActive ? "100px" : "40px",
      boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
    }),
    navLabel: { fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap" },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 2000,
      display: showFilterModal ? "flex" : "none",
      justifyContent: "center",
      alignItems: "flex-end",
    },
    modalSheet: {
      background: "#fff",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "85vh",
      overflowY: "auto",
      borderTopLeftRadius: "24px",
      borderTopRightRadius: "24px",
      padding: "24px",
      animation: "slideUp 0.3s ease-out",
    },
    modalTitle: { fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "#111" },
    filterSection: { marginBottom: "20px" },
    filterLabel: { fontSize: "14px", fontWeight: "600", color: "#666", marginBottom: "10px", display: "block" },
    optionGrid: { display: "flex", gap: "10px", flexWrap: "wrap" },
    optionBtn: (isActive) => ({
      padding: "10px 16px",
      borderRadius: "12px",
      border: "1px solid #eee",
      background: isActive ? "#111" : "#fff",
      color: isActive ? "#fff" : "#333",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }),
    applyBtn: {
      width: "100%",
      padding: "16px",
      background: "#111",
      color: "#fff",
      border: "none",
      borderRadius: "16px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "10px",
    },
    loader: {
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", fontSize: "20px", fontWeight: "600", color: "#111",
    },
  };

  if (loading) return <div style={styles.loader}>AROHA HUB</div>;

  return (
    <div style={styles.container}>
      {!isMobile && <MainHeader 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
        onFilterClick={() => setShowFilterModal(true)}
      />}

      {isMobile && (
        <div style={styles.mobileTopSection}>
          <div style={styles.searchRow}>
            <div style={styles.searchBox}>
              <span style={{ fontSize: "18px", color: "#666" }}>🔍</span>
              <input type="text" placeholder="Explore Luxury..." style={styles.searchInput} />
            </div>
            <div style={styles.filterBtnMobile} onClick={() => setShowFilterModal(true)}>
              <IconSVG name="filter" />
            </div>
          </div>
          <div style={styles.categoryScroll}>
            {["All", "Men", "Women", "Jewelry", "Accessories", "Groceries"].map(cat => (
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
      )}

      {/* SUB-CATEGORY FILTER BAR */}
      {selectedCategory !== "All" && (
        <div style={{...styles.categoryScroll, padding: "10px 16px"}}>
           {currentSubCategories.map(sub => (
             <div 
               key={sub}
               style={{
                 padding: "6px 14px",
                 borderRadius: "16px",
                 background: selectedSubCategory === sub ? "#333" : "#fff",
                 color: selectedSubCategory === sub ? "#fff" : "#666",
                 border: "1px solid #ddd",
                 fontSize: "12px",
                 fontWeight: "600",
                 whiteSpace: "nowrap",
                 cursor: "pointer"
               }}
               onClick={() => setSelectedSubCategory(sub)}
             >
               {sub}
             </div>
           ))}
        </div>
      )}

      {/* DYNAMIC SALE BANNER */}
      <div style={styles.banner}>
        <SaleCarousel images={saleImages} isMobile={isMobile} />
        
        <div style={styles.bannerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
             <IconSVG name="clock" />
             <span style={{ 
               fontSize: isMobile ? "15px" : "13px", 
               fontWeight: "800", 
               textTransform: "uppercase", 
               letterSpacing: "0.5px", 
               color: "#fffb00",
               fontFamily: "'Inter', sans-serif"
             }}>
               {saleData?.saleStatus === "live" ? "Sale Ends In" : "Sale Starts In"}
             </span>
          </div>
          
          {/* Dynamic Headline from Backend - Smaller Font for Mobile */}
          <h2 style={{ 
            margin: "0 0 4px 0", 
            fontSize: isMobile ? "13px" : "40px", 
            fontWeight: "800",
            lineHeight: "1.1",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            fontFamily: "'Inter', sans-serif"
          }}>
            {saleType} 🔥
          </h2>
          
          {/* Stylized Description - Smaller Font for Mobile */}
          <p style={{ 
            margin: "0 0 8px 0", 
            fontSize: isMobile ? "8px" : "16px", 
            opacity: 0.95,
            fontWeight: "500",
            maxWidth: "95%",
            fontFamily: "'Inter', sans-serif",
            fontStyle: "italic",
            letterSpacing: "0.3px",
            lineHeight: "1.3"
          }}>
            {saleMessage}
          </p>

          {targetDate && <CountdownTimer targetDate={targetDate} isMobile={isMobile} />}
        </div>
      </div>

      {/* Product Grid */}
      <div style={styles.grid}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item, index) => (
            <div key={item.id} style={styles.card(index)}>
              <div style={styles.imagePlaceholder}></div>
              <div style={styles.cardDetails}>
                <div style={styles.productName}>{item.name}</div>
                <div style={styles.price}>₹{item.price}</div>
                <div style={{fontSize: "11px", color: "#888", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px"}}>
                   <span style={{color: "#FFD700"}}>★</span> {item.rating} | {item.orders} orders
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{padding: "40px", textAlign: "center", color: "#888", gridColumn: "1/-1"}}>
            No products found for this filter.
          </div>
        )}
      </div>

      {/* FILTER MODAL SHEET */}
      <div style={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
        <div style={styles.modalSheet} onClick={e => e.stopPropagation()}>
          <div style={styles.modalTitle}>Filter Products</div>
          
          <div style={styles.filterSection}>
            <span style={styles.filterLabel}>Sort By</span>
            <div style={styles.optionGrid}>
              {[
                { val: "latest", label: "Latest" },
                { val: "low-high", label: "Price: Low to High" },
                { val: "high-low", label: "Price: High to Low" },
                { val: "most-ordered", label: "Most Ordered" }
              ].map(opt => (
                <button 
                  key={opt.val} 
                  style={styles.optionBtn(filters.sort === opt.val)}
                  onClick={() => setFilters({...filters, sort: opt.val})}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.filterSection}>
            <span style={styles.filterLabel}>Minimum Rating</span>
            <div style={styles.optionGrid}>
              {["all", "5", "4", "3", "2", "1"].map(opt => (
                <button 
                  key={opt} 
                  style={styles.optionBtn(filters.rating === opt)}
                  onClick={() => setFilters({...filters, rating: opt})}
                >
                  {opt === "all" ? "Any" : `${opt} Stars`}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.filterSection}>
            <span style={styles.filterLabel}>Collection Type</span>
            <div style={styles.optionGrid}>
              {["all", "signature", "premium", "luxury"].map(opt => (
                <button 
                  key={opt} 
                  style={styles.optionBtn(filters.collection === opt)}
                  onClick={() => setFilters({...filters, collection: opt})}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button style={styles.applyBtn} onClick={() => setShowFilterModal(false)}>
            Apply Filters
          </button>
        </div>
      </div>

      {isMobile && (
        <div style={styles.bottomNav}>
          {[
            { id: "home", label: "Home" },
            { id: "heart", label: "Wishlist" },
            { id: "cart", label: "Cart" },
            { id: "user", label: "Profile" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                style={styles.navPill(isActive)}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconSVG name={tab.id} />
                <span style={{...styles.navLabel, display: isActive ? "block" : "none"}}>
                  {tab.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default MainDashboard;