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
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    share: "M18 5a3 3 0 1 0-2.83-4H15a3 3 0 0 0 3 3z M6 15a3 3 0 1 0-2.83-4H3a3 3 0 0 0 3 3z M18 23a3 3 0 1 0-2.83-4H15a3 3 0 0 0 3 3z M8.59 13.51 15.42 17.49 M15.41 6.51 8.59 10.49",
    minus: "M5 12h14",
    plus: "M12 5v14M5 12h14",
    check: "M20 6L9 17l-5-5",
    loader: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
  };
  
  const specificPaths = {
     plus: "M12 5v14M5 12h14",
     minus: "M5 12h14"
  };

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={specificPaths[name] || paths[name]} />
    </svg>
  );
};

// --- COUNTDOWN TIMER COMPONENT ---
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

  const numSize = isMobile ? "14px" : "22px";
  const labelSize = isMobile ? "7px" : "10px";
  const gap = isMobile ? "4px" : "12px";
  const timerColor = "#00ff22"; 

  const TimeBox = ({ val, label }) => (
    <div style={{ textAlign: "center", minWidth: isMobile ? "20px" : "45px" }}>
      <div style={{ fontSize: numSize, fontWeight: "800", color: timerColor, lineHeight: "1.1", fontFamily: "'Inter', sans-serif", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
        {val.toString().padStart(2, '0')}
      </div>
      <div style={{ fontSize: labelSize, textTransform: "uppercase", color: "#fff", marginTop: "2px", fontWeight: "700", fontFamily: "'Inter', sans-serif", opacity: 0.9 }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: gap, alignItems: "center", marginTop: isMobile ? "4px" : "12px" }}>
      <TimeBox val={timeLeft.days} label="Days" />
      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>:</span>
      <TimeBox val={timeLeft.hours} label="Hrs" />
      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>:</span>
      <TimeBox val={timeLeft.minutes} label="Min" />
      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>:</span>
      <TimeBox val={timeLeft.seconds} label="Sec" />
    </div>
  );
};

// --- IMAGE CAROUSEL COMPONENT ---
const SaleCarousel = ({ images, isMobile }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % images.length), 4000);
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", borderRadius: isMobile ? "12px" : "20px", zIndex: 1 }}>
      {images.map((img, index) => (
        <div key={index} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", opacity: currentIndex === index ? 1 : 0, transition: "opacity 1s ease-in-out" }} />
      ))}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 100%)", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: isMobile ? "6px" : "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", zIndex: 3 }}>
        {images.map((_, idx) => (<div key={idx} style={{ width: currentIndex === idx ? "16px" : "8px", height: "6px", borderRadius: "3px", background: currentIndex === idx ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.3s ease" }} />))}
      </div>
    </div>
  );
};

// --- LOADING SCREEN COMPONENT ---
const LuxuryLoader = ({ message }) => (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "#fff", zIndex: 9999, display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: "'Inter', sans-serif"
  }}>
    <div style={{ animation: "spin 1s linear infinite", marginBottom: "20px" }}>
      <IconSVG name="loader" />
    </div>
    <div style={{ fontSize: "16px", fontWeight: "500", color: "#333", letterSpacing: "1px", textAlign: "center", padding: "0 20px" }}>
      {message}
    </div>
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function MainDashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loadingState, setLoadingState] = useState("Initializing Aroha Hub...");
  
  // NAVIGATION STATE
  const [activeTab, setActiveTab] = useState("home");
  const [currentView, setCurrentView] = useState("list"); 
  
  const [visibleItems, setVisibleItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Product Detail States
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeDetailImage, setActiveDetailImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMsg, setCartSuccessMsg] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  const [dynamicCategories, setDynamicCategories] = useState(["All"]);
  const [dynamicSubCategories, setDynamicSubCategories] = useState({ "All": ["All"] });

  const [products, setProducts] = useState([]);

  // --- INITIALIZATION & BACKEND FETCHING ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');

    const fetchData = async () => {
      try {
        setLoadingState("Curating your exclusive collection...");
        
        const settingsRes = await fetch("https://aroha.onrender.com/settings");
        const settingsData = await settingsRes.json();
        
        if (settingsData.success && settingsData.settings) {
          setSaleImages(settingsData.settings.saleImages || []);
          setSaleMessage(settingsData.settings.saleBannerMessage || "Unmissable deals!");
          const backendType = settingsData.settings.flashSaleCategory;
          setSaleType(backendType && backendType.trim() !== "" ? `${backendType} Sale` : "Super Sale");
          setTargetDate(settingsData.saleStatus === "live" ? settingsData.settings.saleEndsAt : settingsData.settings.saleStartsAt);
          setSaleData(settingsData.settings);
        }

        setLoadingState("Polishing the diamonds...");

        const productsRes = await fetch("https://aroha.onrender.com/products");
        const productsData = await productsRes.json();
        
        const cats = new Set(["All"]);
        const subCatsMap = { "All": ["All"] };

        const mappedProducts = productsData.map(p => {
          if (p.category) cats.add(p.category);
          if (p.subCategory) {
            if (!subCatsMap[p.category]) subCatsMap[p.category] = new Set(["All"]);
            if (subCatsMap[p.category] instanceof Set) {
               subCatsMap[p.category].add(p.subCategory);
            }
          }

          return {
            id: p._id,
            name: p.name,
            price: p.finalPrice || p.price,
            originalPrice: p.price,
            mainCategory: p.category,
            subCategory: p.subCategory,
            brand: p.brand,
            collection: p.collection,
            rating: p.rating || 4,
            orders: Math.floor(Math.random() * 100) + 10,
            description: `Premium ${p.type} material from ${p.brand}. Available in ${Array.isArray(p.color) ? p.color.join(', ') : p.color}. Perfect for your ${p.collection} needs.`,
            images: p.images && p.images.length > 0 ? p.images : ["https://via.placeholder.com/800x800?text=No+Image"],
            sizes: p.size || [],
            colors: Array.isArray(p.color) ? p.color : (p.color ? p.color.split(',') : []),
            stock: p.stock,
            discount: p.discount
          };
        });

        setDynamicCategories(Array.from(cats));
        const finalSubMap = {};
        Object.keys(subCatsMap).forEach(key => {
           if (subCatsMap[key] instanceof Set) {
             finalSubMap[key] = Array.from(subCatsMap[key]);
           } else {
             finalSubMap[key] = subCatsMap[key];
           }
        });
        setDynamicSubCategories(finalSubMap);

        setProducts(mappedProducts);
        setLoadingState(null);

        if (productId) {
          const prod = mappedProducts.find(p => p.id === productId);
          if (prod) {
            setSelectedProduct(prod);
            setCurrentView("details");
            setActiveTab("home"); 
            if(prod.sizes && prod.sizes.length > 0) setSelectedSize(prod.sizes[0]);
            if(prod.colors && prod.colors.length > 0) setSelectedColor(prod.colors[0]);
          }
        }

        Array.from({ length: Math.min(8, mappedProducts.length) }).forEach((_, index) => 
          setTimeout(() => setVisibleItems(prev => [...prev, index]), index * 100)
        );

      } catch (error) { 
        console.error("Failed to fetch ", error); 
        setLoadingState(null);
      }
    };

    fetchData();

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    return () => { window.removeEventListener("resize", handleResize); };
  }, []);

  useEffect(() => { setSelectedSubCategory("All"); }, [selectedCategory]);

  const getFilteredProducts = () => {
    let result = [...products];
    
    if (selectedCategory !== "All") result = result.filter(p => p.mainCategory === selectedCategory);
    if (selectedSubCategory !== "All") result = result.filter(p => p.subCategory.toLowerCase() === selectedSubCategory.toLowerCase());
    
    if (filters.collection !== "all") {
       result = result.filter(p => p.collection && p.collection.toLowerCase().includes(filters.collection));
    }

    if (filters.rating !== "all") {
       result = result.filter(p => p.rating >= parseInt(filters.rating));
    }

    if (filters.sort === "low-high") result.sort((a, b) => a.price - b.price);
    else if (filters.sort === "high-low") result.sort((a, b) => b.price - a.price);
    else if (filters.sort === "most-ordered") result.sort((a, b) => b.orders - a.orders);
    else result.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

    return result;
  };

  const filteredProducts = getFilteredProducts();
  const currentSubCategories = dynamicSubCategories[selectedCategory] || ["All"];

  // --- HANDLERS ---
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setCurrentView("details");
    setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : ""); 
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : "");
    setQuantity(1); 
    setActiveDetailImage(0);
    setCartSuccessMsg("");
    setIsWishlisted(false);
    
    const newUrl = `${window.location.pathname}?product=${product.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    window.scrollTo(0, 0);
  };

  const goBackToList = () => {
    setCurrentView("list");
    setSelectedProduct(null);
    window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
  };

  const handleShare = async () => {
    if (!selectedProduct) return;
    const shareLink = `${window.location.origin}${window.location.pathname}?product=${selectedProduct.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedProduct.name,
          text: `Discover this exquisite piece: ${selectedProduct.name}`,
          url: shareLink,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard!");
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      alert("Please select a size.");
      return;
    }
    if (selectedProduct.colors && selectedProduct.colors.length > 0 && !selectedColor) {
      alert("Please select a color.");
      return;
    }

    setIsAddingToCart(true);

    const userId = localStorage.getItem("userId") || "69d0b96f4788990c35ebc5fe";

    const successMessages = [
      "Secured in your vault.",
      "Exquisite choice added.",
      "Reserved for your elegance.",
      "Added to your curated collection."
    ];
    const randomMsg = successMessages[Math.floor(Math.random() * successMessages.length)];

    try {
      const response = await fetch("https://aroha.onrender.com/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          productId: selectedProduct.id,
          quantity: quantity,
          size: selectedSize,
          color: selectedColor
        })
      });

      if (response.ok) {
        setCartSuccessMsg(randomMsg);
        setTimeout(() => setCartSuccessMsg(""), 3000);
      } else {
        alert("Failed to add to cart.");
      }
    } catch (error) {
      console.error("Cart Error:", error);
      alert("Error connecting to server.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  // UPDATED NAVIGATION HANDLER
  const handleNavClick = (tabId) => {
    if (tabId === 'cart') {
      window.location.href = '/cart';
    } else if (tabId === 'profile') {
      window.location.href = '/profile';
    } else if (tabId === 'home') {
      setActiveTab("home");
      setCurrentView("list"); 
      setSelectedProduct(null);
      window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
    } else if (tabId === 'wishlist') {
      setActiveTab("wishlist");
      setCurrentView("list");
      setSelectedProduct(null);
      // Wishlist can be internal or external depending on preference. Keeping internal for SPA feel.
    }
  };

  // --- STYLES ---
  const styles = {
    container: { fontFamily: "'Inter', sans-serif", background: "#f5f5f7", minHeight: "100vh", paddingBottom: isMobile ? "140px" : "40px" },
    mobileTopSection: { position: "sticky", top: 0, zIndex: 900, background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", padding: "10px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)" },
    searchRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
    searchBox: { flex: 1, display: "flex", alignItems: "center", background: "#fff", borderRadius: "12px", padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #eee" },
    searchInput: { flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "14px", color: "#111", marginLeft: "8px", fontWeight: "500" },
    filterBtnMobile: { width: "40px", height: "40px", background: "#fff", border: "1px solid #eee", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#111" },
    categoryScroll: { display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", scrollbarWidth: "none" },
    catPill: (isActive) => ({ padding: "8px 18px", borderRadius: "20px", background: isActive ? "#111" : "#fff", color: isActive ? "#fff" : "#666", border: "1px solid #eee", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.3s ease", boxShadow: isActive ? "0 4px 10px rgba(0,0,0,0.1)" : "none" }),
    banner: { margin: isMobile ? "10px 16px" : "20px", padding: isMobile ? "12px 15px" : "40px 60px", borderRadius: isMobile ? "12px" : "20px", background: "#111", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,0.15)", aspectRatio: isMobile ? "16/9" : "unset", height: isMobile ? "auto" : "320px", display: "flex", flexDirection: "column", justifyContent: "center" },
    bannerContent: { position: "relative", zIndex: 10, maxWidth: isMobile ? "95%" : "600px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" },
    
    grid: { display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? "12px" : "24px", padding: "0 16px" },
    card: (index) => ({ 
      borderRadius: "16px", 
      background: "#fff", 
      overflow: "hidden", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
      transition: "all 0.3s ease", 
      cursor: "pointer", 
      opacity: visibleItems.includes(index) ? 1 : 0, 
      transform: visibleItems.includes(index) ? "translateY(0)" : "translateY(20px)",
      border: "1px solid rgba(0,0,0,0.03)",
      position: "relative"
    }),
    imageContainer: { width: "100%", aspectRatio: "1/1", background: "#f0f0f0", position: "relative", overflow: "hidden" },
    
    imageOverlay: {
      position: "absolute",
      bottom: "8px",
      left: "8px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: "rgba(255, 255, 255, 0.9)",
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "600",
      color: "#333",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    },

    cardDetails: { padding: "12px" },
    productName: { fontSize: "14px", color: "#333", fontWeight: "600", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    
    priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" },
    priceInfo: { display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" },
    finalPrice: { fontWeight: "700", fontSize: "15px", color: "#000" },
    originalPrice: { fontSize: "12px", color: "#999", textDecoration: "line-through" },
    discountText: { fontSize: "12px", color: "#ff5722", fontWeight: "600" },
    
    wishlistIconCard: {
      color: isWishlisted ? "#ff4d4d" : "#ccc",
      cursor: "pointer",
      transition: "color 0.3s ease",
      padding: "4px"
    },

    bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, height: "60px", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", display: isMobile ? "flex" : "none", justifyContent: "center", alignItems: "center", boxShadow: "0 -5px 15px rgba(0,0,0,0.05)", zIndex: 1000, paddingBottom: "5px", gap: "10px" },
    navPill: (isActive) => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: isActive ? "8px 16px" : "10px", borderRadius: "30px", background: isActive ? "#000" : "transparent", color: isActive ? "#fff" : "#9ca3af", transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)", cursor: "pointer", minWidth: isActive ? "100px" : "40px", boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.2)" : "none" }),
    navLabel: { fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap" },
    
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: showFilterModal ? "flex" : "none", justifyContent: "center", alignItems: "flex-end" },
    modalSheet: { background: "#fff", width: "100%", maxWidth: "500px", maxHeight: "85vh", overflowY: "auto", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px", animation: "slideUp 0.3s ease-out" },
    modalTitle: { fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "#111" },
    filterSection: { marginBottom: "20px" },
    filterLabel: { fontSize: "14px", fontWeight: "600", color: "#666", marginBottom: "10px", display: "block" },
    optionGrid: { display: "flex", gap: "10px", flexWrap: "wrap" },
    optionBtn: (isActive) => ({ padding: "10px 16px", borderRadius: "12px", border: "1px solid #eee", background: isActive ? "#111" : "#fff", color: isActive ? "#fff" : "#333", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s ease" }),
    applyBtn: { width: "100%", padding: "16px", background: "#111", color: "#fff", border: "none", borderRadius: "16px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "10px" },
    
    detailContainer: { padding: isMobile ? "16px" : "40px", maxWidth: "1200px", margin: "0 auto" },
    detailGrid: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "20px" : "60px" },
    detailImageMain: { width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "16px", background: "#f0f0f0", marginBottom: "10px" },
    detailThumbs: { display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" },
    thumb: (isActive) => ({ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", border: isActive ? "2px solid #111" : "2px solid transparent", cursor: "pointer", opacity: isActive ? 1 : 0.6 }),
    detailInfo: { display: "flex", flexDirection: "column", gap: "16px" },
    detailTitle: { fontSize: isMobile ? "22px" : "32px", fontWeight: "800", color: "#111", margin: 0, lineHeight: "1.2" },
    detailPrice: { fontSize: "24px", fontWeight: "700", color: "#111", display: "flex", alignItems: "center", gap: "10px" },
    detailRating: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#666" },
    sectionTitle: { fontSize: "15px", fontWeight: "700", color: "#111", marginBottom: "8px" },
    sizeGrid: { display: "flex", gap: "8px", flexWrap: "wrap" },
    sizeBtn: (isActive) => ({ minWidth: "40px", height: "40px", padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #ddd", background: isActive ? "#111" : "#fff", color: isActive ? "#fff" : "#333", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }),
    colorCircle: (color, isActive) => ({ width: "32px", height: "32px", borderRadius: "50%", background: color.toLowerCase(), border: isActive ? "2px solid #111" : "2px solid transparent", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }),
    qtyControl: { display: "flex", alignItems: "center", gap: "16px", border: "1px solid #ddd", borderRadius: "12px", padding: "8px 16px", width: "fit-content" },
    qtyBtn: { background: "none", border: "none", cursor: "pointer", color: "#111", display: "flex", alignItems: "center" },
    
    actionButtons: { display: "flex", gap: "10px", marginTop: "10px" },
    addToCartBtn: { flex: 2, padding: "18px", background: cartSuccessMsg ? "#00C853" : "#111", color: "#fff", border: "none", borderRadius: "16px", fontSize: "18px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
    addToWishlistBtn: { flex: 1, padding: "18px", background: "#fff", color: isWishlisted ? "#ff4d4d" : "#111", border: "2px solid #eee", borderRadius: "16px", fontSize: "18px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.3s ease" },
    
    stickyBottomMobile: { position: "fixed", bottom: "60px", left: 0, right: 0, background: "#fff", padding: "16px", borderTop: "1px solid #eee", zIndex: 999, display: isMobile ? "block" : "none" },
    placeholderPage: { padding: "40px 20px", textAlign: "center", color: "#666" }
  };

  if (loadingState) return <LuxuryLoader message={loadingState} />;

  // --- RENDER PRODUCT DETAILS VIEW ---
  if (currentView === "details" && selectedProduct) {
    const similarProducts = products.filter(p => p.mainCategory === selectedProduct.mainCategory && p.id !== selectedProduct.id).slice(0, 4);

    return (
      <div style={styles.container}>
        {!isMobile && <MainHeader selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onFilterClick={() => setShowFilterModal(true)} onNavClick={handleNavClick} />}

        <div style={styles.detailContainer}>
          <div style={styles.detailGrid}>
            <div>
              <img src={selectedProduct.images[activeDetailImage]} alt={selectedProduct.name} style={styles.detailImageMain} onError={(e) => { e.target.src = "https://via.placeholder.com/800x800?text=Error"; }} />
              <div style={styles.detailThumbs}>
                {selectedProduct.images.map((img, idx) => (
                  <img key={idx} src={img} alt="" style={styles.thumb(activeDetailImage === idx)} onClick={() => setActiveDetailImage(idx)} onError={(e) => { e.target.style.display = 'none'; }} />
                ))}
              </div>
            </div>

            <div style={styles.detailInfo}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "start"}}>
                 <div>
                    <h1 style={styles.detailTitle}>{selectedProduct.name}</h1>
                    <div style={styles.detailRating}>
                       <span style={{color: "#FFD700"}}>★</span> {selectedProduct.rating} | {selectedProduct.orders} orders
                    </div>
                 </div>
                 <button onClick={handleShare} style={{background: "#fff", border: "1px solid #ddd", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.05)"}}>
                   <IconSVG name="share" />
                 </button>
              </div>
              
              <div style={styles.detailPrice}>
                ₹{selectedProduct.price.toLocaleString()} 
                {selectedProduct.originalPrice > selectedProduct.price && (
                  <>
                    <span style={{fontSize: "16px", color: "#888", textDecoration: "line-through", fontWeight: "400"}}>₹{selectedProduct.originalPrice.toLocaleString()}</span>
                    <span style={{fontSize: "14px", color: "#ff5722", fontWeight: "600"}}>({selectedProduct.discount}% OFF)</span>
                  </>
                )}
              </div>
              
              <p style={{ color: "#666", lineHeight: "1.6", fontSize: "15px", margin: "10px 0" }}>
                {selectedProduct.description}
              </p>

              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div>
                  <div style={styles.sectionTitle}>Select Color: <span style={{fontWeight: "400", color: "#666"}}>{selectedColor}</span></div>
                  <div style={{display: "flex", gap: "10px"}}>
                    {selectedProduct.colors.map(color => (
                      <div key={color} style={styles.colorCircle(color, selectedColor === color)} onClick={() => setSelectedColor(color)} title={color} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={styles.sectionTitle}>Select Size</div>
                <div style={styles.sizeGrid}>
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                    selectedProduct.sizes.map(size => (
                      <button key={size} style={styles.sizeBtn(selectedSize === size)} onClick={() => setSelectedSize(size)}>
                        {size}
                      </button>
                    ))
                  ) : (
                    <span style={{color: "#888", fontSize: "14px"}}>One Size / Free Size</span>
                  )}
                </div>
              </div>

              <div>
                <div style={styles.sectionTitle}>Quantity</div>
                <div style={styles.qtyControl}>
                  <button style={styles.qtyBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}><IconSVG name="minus" /></button>
                  <span style={{ fontWeight: "600", minWidth: "20px", textAlign: "center" }}>{quantity}</span>
                  <button style={styles.qtyBtn} onClick={() => setQuantity(quantity + 1)}><IconSVG name="plus" /></button>
                </div>
              </div>

              <div style={styles.actionButtons}>
                 <button style={styles.addToCartBtn} onClick={handleAddToCart} disabled={isAddingToCart}>
                  {cartSuccessMsg ? <><IconSVG name="check" /> {cartSuccessMsg}</> : "Add to Cart"}
                </button>
                <button style={styles.addToWishlistBtn} onClick={handleToggleWishlist}>
                  <IconSVG name="heart" />
                  {isMobile ? "" : (isWishlisted ? "Saved" : "Wishlist")}
                </button>
              </div>

            </div>
          </div>

          <div style={{ marginTop: "60px" }}>
             <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>You May Also Like</h3>
             <div style={styles.grid}>
                {similarProducts.map((item, index) => (
                  <div key={item.id} style={styles.card(index)} onClick={() => handleProductClick(item)}>
                    <div style={styles.imageContainer}>
                       {item.images && item.images[0] && <img src={item.images[0]} alt={item.name} style={{width: "100%", height: "100%", objectFit: "cover"}} />}
                       
                       <div style={styles.imageOverlay}>
                         <span style={{color: "#FFD700"}}>★</span> {item.rating} | {item.orders}
                       </div>
                    </div>
                    <div style={styles.cardDetails}>
                      <div style={styles.productName}>{item.name}</div>
                      
                      <div style={styles.priceRow}>
                        <div style={styles.priceInfo}>
                           <span style={styles.finalPrice}>₹{item.price.toLocaleString()}</span>
                           {item.originalPrice > item.price && (
                             <>
                               <span style={styles.originalPrice}>₹{item.originalPrice.toLocaleString()}</span>
                               <span style={styles.discountText}>({item.discount}% OFF)</span>
                             </>
                           )}
                        </div>
                        <div style={styles.wishlistIconCard}>
                           <IconSVG name="heart" />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {isMobile && showFilterModal && (
           <div style={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
             <div style={styles.modalSheet} onClick={e => e.stopPropagation()}>
               <div style={styles.modalTitle}>Refine Selection</div>
               <div style={styles.filterSection}>
                 <span style={styles.filterLabel}>Brand</span>
                 <div style={{padding: "10px", background: "#f9f9f9", borderRadius: "8px", fontWeight: "600"}}>{selectedProduct.brand}</div>
               </div>
               {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                 <div style={styles.filterSection}>
                   <span style={styles.filterLabel}>Available Colors</span>
                   <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                     {selectedProduct.colors.map(color => (
                       <div key={color} style={styles.colorCircle(color, selectedColor === color)} onClick={() => setSelectedColor(color)} title={color} />
                     ))}
                   </div>
                 </div>
               )}
               <div style={styles.filterSection}>
                 <span style={styles.filterLabel}>Available Sizes</span>
                 <div style={styles.sizeGrid}>
                   {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                     selectedProduct.sizes.map(size => (
                       <button key={size} style={styles.sizeBtn(selectedSize === size)} onClick={() => setSelectedSize(size)}>{size}</button>
                     ))
                   ) : <span style={{color: "#888"}}>One Size</span>}
                 </div>
               </div>
               <button style={styles.applyBtn} onClick={() => setShowFilterModal(false)}>Confirm Selection</button>
             </div>
           </div>
        )}

        {isMobile && (
          <div style={styles.stickyBottomMobile}>
            <div style={styles.actionButtons}>
               <button style={styles.addToCartBtn} onClick={handleAddToCart} disabled={isAddingToCart}>
                 {cartSuccessMsg ? <><IconSVG name="check" /> Added</> : `Add to Cart - ₹${(selectedProduct.price * quantity).toLocaleString()}`}
               </button>
               <button style={styles.addToWishlistBtn} onClick={handleToggleWishlist}>
                 <IconSVG name="heart" />
               </button>
            </div>
          </div>
        )}

        {isMobile && (
          <div style={styles.bottomNav}>
            {[{ id: "home", label: "Home" }, { id: "heart", label: "Wishlist" }, { id: "cart", label: "Cart" }, { id: "user", label: "Profile" }].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} style={styles.navPill(isActive)} onClick={() => handleNavClick(tab.id)}>
                  <IconSVG name={tab.id} />
                  <span style={{...styles.navLabel, display: isActive ? "block" : "none"}}>{tab.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER OTHER TABS ---
  if (activeTab !== "home") {
     return (
       <div style={styles.container}>
         {!isMobile && <MainHeader selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onFilterClick={() => setShowFilterModal(true)} onNavClick={handleNavClick} />}
         <div style={styles.placeholderPage}>
           <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
           <p>This page is under construction.</p>
         </div>
         {isMobile && (
           <div style={styles.bottomNav}>
             {[{ id: "home", label: "Home" }, { id: "heart", label: "Wishlist" }, { id: "cart", label: "Cart" }, { id: "user", label: "Profile" }].map((tab) => {
               const isActive = activeTab === tab.id;
               return (
                 <div key={tab.id} style={styles.navPill(isActive)} onClick={() => handleNavClick(tab.id)}>
                   <IconSVG name={tab.id} />
                   <span style={{...styles.navLabel, display: isActive ? "block" : "none"}}>{tab.label}</span>
                 </div>
               );
             })}
           </div>
         )}
       </div>
     );
  }

  // --- RENDER HOME LIST VIEW ---
  return (
    <div style={styles.container}>
      {!isMobile && <MainHeader selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onFilterClick={() => setShowFilterModal(true)} onNavClick={handleNavClick} />}

      {isMobile && (
        <div style={styles.mobileTopSection}>
          <div style={styles.searchRow}>
            <div style={styles.searchBox}>
              <span style={{ fontSize: "18px", color: "#666" }}><svg
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#000"
  strokeWidth="3"
  strokeLinecap="round"
  strokeLinejoin="round"
  style={{ verticalAlign: "middle" }}
>
  <circle cx="11" cy="11" r="7" />
  <line x1="21" y1="21" x2="16.5" y2="16.5" />
</svg></span>
              <input type="text" placeholder="Explore Luxury..." style={styles.searchInput} />
            </div>
            <div style={styles.filterBtnMobile} onClick={() => setShowFilterModal(true)}><IconSVG name="filter" /></div>
          </div>
          <div style={styles.categoryScroll}>
            {dynamicCategories.map(cat => (
              <div key={cat} style={styles.catPill(selectedCategory === cat)} onClick={() => setSelectedCategory(cat)}>{cat}</div>
            ))}
          </div>
        </div>
      )}

      {selectedCategory !== "All" && (
        <div style={{...styles.categoryScroll, padding: "10px 16px"}}>
           {currentSubCategories.map(sub => (
             <div key={sub} style={{ padding: "6px 14px", borderRadius: "16px", background: selectedSubCategory === sub ? "#333" : "#fff", color: selectedSubCategory === sub ? "#fff" : "#666", border: "1px solid #ddd", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => setSelectedSubCategory(sub)}>{sub}</div>
           ))}
        </div>
      )}

      <div style={styles.banner}>
        <SaleCarousel images={saleImages} isMobile={isMobile} />
        <div style={styles.bannerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
             <IconSVG name="clock" />
             <span style={{ fontSize: isMobile ? "12px" : "24px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", color: "#fffb00", fontFamily: "'Inter', sans-serif" }}>
               {saleData?.saleStatus === "live" ? "Sale Ends In" : "Sale Starts In"}
             </span>
          </div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: isMobile ? "16px" : "36px", fontWeight: "800", lineHeight: "1.1", textShadow: "0 2px 10px rgba(0,0,0,0.5)", fontFamily: "'Inter', sans-serif" }}>{saleType} 🔥</h2>
          <p style={{ margin: "0 0 8px 0", fontSize: isMobile ? "10px" : "14px", opacity: 0.95, fontWeight: "500", maxWidth: "95%", fontFamily: "'Inter', sans-serif", fontStyle: "italic", letterSpacing: "0.3px", lineHeight: "1.3" }}>{saleMessage}</p>
          {targetDate && <CountdownTimer targetDate={targetDate} isMobile={isMobile} />}
        </div>
      </div>

      <div style={styles.grid}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item, index) => (
            <div key={item.id} style={styles.card(index)} onClick={() => handleProductClick(item)}>
              <div style={styles.imageContainer}>
                 {item.images && item.images[0] && <img src={item.images[0]} alt={item.name} style={{width: "100%", height: "100%", objectFit: "cover"}} />}
                 
                 <div style={styles.imageOverlay}>
                   <span style={{color: "#FFD700"}}>★</span> {item.rating} | {item.orders}
                 </div>
              </div>
              <div style={styles.cardDetails}>
                <div style={styles.productName}>{item.name}</div>
                
                <div style={styles.priceRow}>
                  <div style={styles.priceInfo}>
                     <span style={styles.finalPrice}>₹{item.price.toLocaleString()}</span>
                     {item.originalPrice > item.price && (
                       <>
                         <span style={styles.originalPrice}>₹{item.originalPrice.toLocaleString()}</span>
                         <span style={styles.discountText}>({item.discount}% OFF)</span>
                       </>
                     )}
                  </div>
                  <div style={styles.wishlistIconCard}>
                     <IconSVG name="heart" />
                  </div>
                </div>

              </div>
            </div>
          ))
        ) : (
          <div style={{padding: "40px", textAlign: "center", color: "#888", gridColumn: "1/-1"}}>No products found for this filter.</div>
        )}
      </div>

      <div style={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
        <div style={styles.modalSheet} onClick={e => e.stopPropagation()}>
          <div style={styles.modalTitle}>Filter Products</div>
          
          <div style={styles.filterSection}>
            <span style={styles.filterLabel}>Sort By</span>
            <div style={styles.optionGrid}>
              {[{ val: "latest", label: "Latest" }, { val: "low-high", label: "Price: Low to High" }, { val: "high-low", label: "Price: High to Low" }, { val: "most-ordered", label: "Most Ordered" }].map(opt => (
                <button key={opt.val} style={styles.optionBtn(filters.sort === opt.val)} onClick={() => setFilters({...filters, sort: opt.val})}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div style={styles.filterSection}>
            <span style={styles.filterLabel}>Minimum Rating</span>
            <div style={styles.optionGrid}>
              {["all", "5", "4", "3", "2", "1"].map(opt => (
                <button key={opt} style={styles.optionBtn(filters.rating === opt)} onClick={() => setFilters({...filters, rating: opt})}>
                  {opt === "all" ? "Any" : `${opt} Stars`}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.filterSection}>
            <span style={styles.filterLabel}>Collection Type</span>
            <div style={styles.optionGrid}>
              {["all", "signature", "premium", "luxury"].map(opt => (
                <button key={opt} style={styles.optionBtn(filters.collection === opt)} onClick={() => setFilters({...filters, collection: opt})}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button style={styles.applyBtn} onClick={() => setShowFilterModal(false)}>Apply Filters</button>
        </div>
      </div>

      {isMobile && (
        <div style={styles.bottomNav}>
          {[{ id: "home", label: "Home" }, { id: "heart", label: "Wishlist" }, { id: "cart", label: "Cart" }, { id: "user", label: "Profile" }].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} style={styles.navPill(isActive)} onClick={() => handleNavClick(tab.id)}>
                <IconSVG name={tab.id} />
                <span style={{...styles.navLabel, display: isActive ? "block" : "none"}}>{tab.label}</span>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

export default MainDashboard;