import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaStar, FaStarHalfAlt, FaHeart, FaFilter, FaSlidersH,
  FaTimes, FaTag, FaTshirt, FaChild, FaGem, FaShoppingBag,
  FaShoppingBasket, FaMale, FaFemale, FaChevronLeft, FaChevronRight,
  FaCopy, FaTwitter, FaFacebook, FaWhatsapp, FaCheckCircle, FaExclamationCircle,
  FaTruck, FaUndo, FaLock
} from "react-icons/fa";
import Header, { MobileBottomNav } from "./Header";

// Error Popup Component
const ErrorPopup = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={styles.errorPopupOverlay} onClick={onClose}>
      <div style={styles.errorPopupContent} onClick={(e) => e.stopPropagation()}>
        <FaExclamationCircle size={40} color="#ef4444" />
        <p style={styles.errorPopupMessage}>{message}</p>
        <button style={styles.errorPopupButton} onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

// Success Toast
const SuccessToast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={styles.successToast}>
      <FaCheckCircle style={{ marginRight: "8px" }} />
      {message}
    </div>
  );
};

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "", subCategory: "", gender: "", minPrice: "", maxPrice: "",
    minDiscount: "", minRating: "", sizes: [], brands: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [toast, setToast] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!user;

  const showToast = (message) => setToast({ message });
  const showError = (message) => setErrorPopup(message);

  // Fetch metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axios.get("https://aroha.onrender.com/products");
        const cmap = {};
        res.data.forEach(p => {
          if (p.category) {
            if (!cmap[p.category]) cmap[p.category] = new Set();
            if (p.subCategory) cmap[p.category].add(p.subCategory);
          }
        });
        const finalMap = {};
        Object.keys(cmap).forEach(k => { finalMap[k] = Array.from(cmap[k]); });
        setCategoriesMap(finalMap);
      } catch (err) {
        showError("Failed to load categories");
      }
    };
    fetchMetadata();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (filters.category) params.append("category", filters.category);
      if (filters.subCategory) params.append("subCategory", filters.subCategory);
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minDiscount) params.append("minDiscount", filters.minDiscount);
      if (filters.minRating) params.append("minRating", filters.minRating);
      const res = await axios.get(`https://aroha.onrender.com/products/search?${params.toString()}`);
      setProducts(res.data || []);
    } catch (err) {
      showError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, filters]);

  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p._id === productId);
      if (product) {
        setSelectedProduct(product);
        setCurrentImageIndex(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (!productId) {
      setSelectedProduct(null);
    }
  }, [productId, products]);

  const handleNavigate = (path) => {
    if (!isLoggedIn && path !== "/login") {
      navigate("/login");
      showError("Please login to continue");
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
    showToast("Logged out successfully");
  };

  const handleAddToCart = async (productId, e) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn) {
      handleNavigate("/login");
      return;
    }
    try {
      await axios.post("https://aroha.onrender.com/cart", { userId: user._id, productId, quantity: 1 });
      showToast("Added to cart successfully!");
    } catch (err) {
      showError("Failed to add to cart");
    }
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      if (filterType === "sizes" || filterType === "brands") {
        return {
          ...prev,
          [filterType]: prev[filterType].includes(value)
            ? prev[filterType].filter(item => item !== value)
            : [...prev[filterType], value]
        };
      }
      return { ...prev, [filterType]: prev[filterType] === value ? "" : value };
    });
  };

  const clearFilters = () => {
    setFilters({ category: "", subCategory: "", gender: "", minPrice: "", maxPrice: "", minDiscount: "", minRating: "", sizes: [], brands: [] });
    showToast("Filters cleared");
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars.push(<FaStar key={i} style={styles.star} />);
      else if (i === fullStars && hasHalfStar) stars.push(<FaStarHalfAlt key={i} style={styles.star} />);
      else stars.push(<FaStar key={i} style={{ ...styles.star, color: "#e5e5e5" }} />);
    }
    return stars;
  };

  const getCategoryIcon = (category) => {
    if (!category) return <FaTag size={20} />;
    const cat = category.toLowerCase();
    if (cat.includes("women") || cat.includes("girl")) return <FaFemale size={22} />;
    if (cat.includes("men") || cat.includes("boy")) return <FaMale size={22} />;
    if (cat.includes("child") || cat.includes("kid")) return <FaChild size={22} />;
    if (cat.includes("jewel") || cat.includes("ring")) return <FaGem size={22} />;
    if (cat.includes("accessor")) return <FaShoppingBag size={22} />;
    if (cat.includes("shirt") || cat.includes("cloth")) return <FaTshirt size={22} />;
    return <FaShoppingBasket size={22} />;
  };

  const getSimilarProducts = (product) => {
    if (!product) return [];
    return products.filter(p => p._id !== product._id && (p.category === product.category || p.subCategory === product.subCategory)).slice(0, 4);
  };

  const handleShare = (product, platform) => {
    const url = `${window.location.origin}/product/${product._id}`;
    const text = `Check out ${product.name} on Aroha Hub!`;
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => showToast("Link copied!")).catch(() => showError("Failed to copy link"));
    } else {
      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
      };
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const parseProductData = (product) => {
    const color = typeof product.color === 'string' ? JSON.parse(product.color) : product.color || [];
    const size = typeof product.size === 'string' ? JSON.parse(product.size) : product.size || [];
    const images = product.images || [];
    const discount = product.discount || 0;
    const finalPrice = product.finalPrice || product.price;
    const rating = product.rating || 0;
    const isOutOfStock = (product.stock || 0) <= 0;
    return { color, size, images, discount, finalPrice, rating, isOutOfStock };
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % (selectedProduct?.images?.length || 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + (selectedProduct?.images?.length || 1)) % (selectedProduct?.images?.length || 1));

  const selectProduct = (product) => {
    navigate(`/product/${product._id}`);
  };

  const goBackToList = () => {
    navigate("/dashboard");
    setSelectedProduct(null);
    setCurrentImageIndex(0);
    setSelectedSize("");
    setSelectedColor("");
  };

  // Product Detail View
  if (selectedProduct) {
    const { color, size, images, discount, finalPrice, rating, isOutOfStock } = parseProductData(selectedProduct);
    const similarProducts = getSimilarProducts(selectedProduct);

    return (
      <div style={styles.container}>
        <Header
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          searchValue={search}
          onSearchChange={setSearch}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          isMenuOpen={isMenuOpen}
        />

        <main style={styles.mainDetail}>
          <button onClick={goBackToList} style={styles.backToListBtn}>
            <FaChevronLeft style={{ marginRight: "6px" }} /> Back to Shopping
          </button>

          <div style={styles.detailWrapper}>
            {/* Left - Images */}
            <div style={styles.leftColumn}>
              <div style={styles.imageCarousel}>
                <button onClick={prevImage} style={styles.carouselBtn}><FaChevronLeft /></button>
                <div style={styles.mainImage}>
                  {images[currentImageIndex] ? (
                    <img src={images[currentImageIndex]} alt={selectedProduct.name} style={styles.img} />
                  ) : <div style={styles.noImage}>No Image</div>}
                  {discount > 0 && <div style={styles.badge}>{discount}% OFF</div>}
                </div>
                <button onClick={nextImage} style={styles.carouselBtn}><FaChevronRight /></button>
              </div>
              {images.length > 1 && (
                <div style={styles.thumbnails}>
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)} style={{ ...styles.thumb, border: currentImageIndex === idx ? "2px solid #1a1a1a" : "2px solid transparent" }}>
                      <img src={img} alt="" style={styles.thumbImg} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Product Details */}
            <div style={styles.rightColumn}>
              <div style={styles.breadcrumb}>{selectedProduct.category} / {selectedProduct.subCategory}</div>
              <h1 style={styles.title}>{selectedProduct.name}</h1>

              <div style={styles.infoRow}>
                <span style={styles.brandLabel}>Brand:</span>
                <span style={styles.brandValue}>{selectedProduct.brand}</span>
                <span style={styles.tag}>{selectedProduct.collection}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.price}>₹{finalPrice.toLocaleString('en-IN')}</span>
                {discount > 0 && (<>
                  <span style={styles.oldPrice}>₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                  <span style={styles.save}>Save ₹{(selectedProduct.price - finalPrice).toFixed(2)}</span>
                </>)}
              </div>

              <div style={styles.stockRow}>
                {isOutOfStock ? (
                  <span style={styles.outOfStock}><FaTimes style={{ marginRight: "4px" }} />Out of Stock</span>
                ) : (
                  <span style={styles.inStock}><FaCheckCircle style={{ marginRight: "4px" }} />{selectedProduct.stock} available</span>
                )}
                <span style={styles.rating}><FaStar style={{ marginRight: "4px", color: "#ffc107" }} />{rating} ({selectedProduct.reviews?.length || 0})</span>
              </div>

              {color.length > 0 && (
                <div style={styles.compactOption}>
                  <label style={styles.label}>Color:</label>
                  <div style={styles.colorOptions}>
                    {color.map((c, i) => (
                      <button key={i} onClick={() => setSelectedColor(c)} style={{ ...styles.colorDot, background: c.toLowerCase().replace(/\s/g, ''), border: selectedColor === c ? "2px solid #1a1a1a" : "2px solid #e5e5e5" }} title={c} />
                    ))}
                  </div>
                </div>
              )}

              {size.length > 0 && (
                <div style={styles.compactOption}>
                  <label style={styles.label}>Size:</label>
                  <div style={styles.sizeOptions}>
                    {size.map((s, i) => (
                      <button key={i} onClick={() => setSelectedSize(s)} style={{ ...styles.sizeBtn, background: selectedSize === s ? "#1a1a1a" : "#fff", color: selectedSize === s ? "#fff" : "#1a1a1a" }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.quickSpecs}>
                <div style={styles.specItem}><span style={styles.specLabel}>SKU:</span> {selectedProduct.sku}</div>
                <div style={styles.specItem}><span style={styles.specLabel}>Type:</span> {selectedProduct.type || "N/A"}</div>
                {selectedProduct.weight && <div style={styles.specItem}><span style={styles.specLabel}>Weight:</span> {selectedProduct.weight}g</div>}
              </div>

              <div style={styles.descBox}>
                <h4 style={styles.sectionTitle}>Description</h4>
                <p style={styles.desc}>{selectedProduct.description || `Premium quality ${selectedProduct.name} from ${selectedProduct.brand}.`}</p>
              </div>

              <button onClick={(e) => handleAddToCart(selectedProduct._id, e)} style={isOutOfStock ? styles.disabledCart : styles.cartBtn} disabled={isOutOfStock}>
                <FaShoppingBasket style={{ marginRight: "8px" }} />{isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              <div style={styles.trustBadges}>
                <div style={styles.trustItem}><FaLock size={14} /> Secure</div>
                <div style={styles.trustItem}><FaTruck size={14} /> Free Ship</div>
                <div style={styles.trustItem}><FaUndo size={14} /> Returns</div>
              </div>

              <div style={styles.shareRow}>
                <span style={styles.shareLabel}>Share:</span>
                <button onClick={() => handleShare(selectedProduct, 'twitter')} style={styles.shareBtn}><FaTwitter /></button>
                <button onClick={() => handleShare(selectedProduct, 'facebook')} style={styles.shareBtn}><FaFacebook /></button>
                <button onClick={() => handleShare(selectedProduct, 'whatsapp')} style={styles.shareBtn}><FaWhatsapp /></button>
                <button onClick={() => handleShare(selectedProduct, 'copy')} style={styles.shareBtn}><FaCopy /></button>
              </div>
            </div>
          </div>

          {similarProducts.length > 0 && (
            <div style={styles.similarSection}>
              <h2 style={styles.sectionTitle2}>Similar Products</h2>
              <div style={styles.similarGrid}>
                {similarProducts.map((p) => {
                  const pData = parseProductData(p);
                  return (
                    <div key={p._id} style={styles.similarCard} onClick={() => selectProduct(p)}>
                      <div style={styles.similarImgWrap}>
                        {pData.images[0] && <img src={pData.images[0]} alt={p.name} style={styles.similarImg} />}
                        {pData.discount > 0 && <div style={styles.similarBadge}>{pData.discount}% OFF</div>}
                      </div>
                      <div style={styles.similarInfo}>
                        <h4 style={styles.similarName}>{p.name}</h4>
                        <p style={styles.similarBrand}>{p.brand}</p>
                        <div style={styles.similarPrice}>₹{pData.finalPrice.toLocaleString('en-IN')}</div>
                        <div style={styles.similarStars}>{renderStars(pData.rating)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        <MobileBottomNav onNavigate={handleNavigate} currentPath={location.pathname} />

        {toast && <SuccessToast message={toast.message} onClose={() => setToast(null)} />}
        {errorPopup && <ErrorPopup message={errorPopup} onClose={() => setErrorPopup(null)} />}
      </div>
    );
  }

  // Dashboard Grid View
  return (
    <div style={styles.container}>
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        searchValue={search}
        onSearchChange={setSearch}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />

      <main style={styles.main}>
        <div style={styles.dashboardHeader}>
          <h1 style={styles.pageTitle}>Shopping Dashboard</h1>
          <button onClick={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
            <FaSlidersH style={{ marginRight: "6px" }} /> {showFilters ? "Hide" : "Show"} Filters
          </button>
        </div>

        <div style={styles.categories}>
          {[...new Set([...Object.keys(categoriesMap), "Children", "Jewelry"])].filter(cat => !cat.toLowerCase().includes("test")).map(cat => (
            <button key={cat} onClick={() => toggleFilter("category", filters.category === cat ? "" : cat)} style={{ ...styles.catBtn, background: filters.category === cat ? "linear-gradient(135deg, #1a1a1a 0%, #333 100%)" : "#fff", color: filters.category === cat ? "#fff" : "#1a1a1a" }}>
              {getCategoryIcon(cat)}<span style={styles.catText}>{cat}</span>
            </button>
          ))}
        </div>

        {showFilters && (
          <div style={styles.filtersPanel}>
            <div style={styles.filterCol}>
              <h4 style={styles.filterTitle}>Gender</h4>
              {["Men", "Women", "Unisex"].map(g => (<label key={g} style={styles.filterLabel}><input type="radio" name="gender" checked={filters.gender === g} onChange={() => toggleFilter("gender", g)} />{g}</label>))}
            </div>
            <div style={styles.filterCol}>
              <h4 style={styles.filterTitle}>Price</h4>
              <div style={styles.priceRow}>
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => toggleFilter("minPrice", e.target.value)} style={styles.filterInput} />
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => toggleFilter("maxPrice", e.target.value)} style={styles.filterInput} />
              </div>
            </div>
            <div style={styles.filterCol}>
              <h4 style={styles.filterTitle}>Rating</h4>
              {[4, 3, 2, 1].map(r => (<label key={r} style={styles.filterLabel}><input type="radio" name="rating" checked={filters.minRating == r} onChange={() => toggleFilter("minRating", r)} />{renderStars(r)} & up</label>))}
            </div>
            <button onClick={clearFilters} style={styles.clearBtn}>Clear Filters</button>
          </div>
        )}

        {loading ? <div style={styles.loading}>Loading products...</div> : (
          <div style={styles.grid}>
            {products.length === 0 ? <div style={styles.empty}>No products found</div> : (
              products.map((p) => {
                const { color, images, discount, finalPrice, rating, isOutOfStock } = parseProductData(p);
                return (
                  <div key={p._id} style={styles.card} onClick={() => selectProduct(p)}>
                    <div style={styles.cardImgWrap}>
                      {images[0] && <img src={images[0]} alt={p.name} style={styles.cardImg} />}
                      {discount > 0 && <div style={styles.cardBadge}>{discount}% OFF</div>}
                      <button style={styles.wishBtn}><FaHeart /></button>
                    </div>
                    <div style={styles.cardInfo}>
                      <h3 style={styles.cardTitle}>{p.name}</h3>
                      <p style={styles.cardBrand}>{p.brand}</p>
                      <div style={styles.cardPriceRow}>
                        <span style={styles.cardPrice}>₹{finalPrice.toLocaleString('en-IN')}</span>
                        {discount > 0 && <span style={styles.cardOldPrice}>₹{p.price.toLocaleString('en-IN')}</span>}
                      </div>
                      <div style={styles.cardStars}>{renderStars(rating)} <span style={styles.cardRatingText}>({rating})</span></div>
                      <p style={isOutOfStock ? styles.cardOutOfStock : styles.cardInStock}>{isOutOfStock ? "Out of Stock" : `${p.stock} in stock`}</p>
                      {color.length > 0 && (<div style={styles.cardColors}>{color.slice(0, 3).map((c, i) => (<span key={i} style={{ ...styles.colorDotSmall, background: c.toLowerCase().replace(/\s/g, '') }} />))}</div>)}
                    </div>
                    <div style={styles.cardActions}>
                      <button style={styles.viewBtn} onClick={(e) => { e.stopPropagation(); selectProduct(p); }}>View Details</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <MobileBottomNav onNavigate={handleNavigate} currentPath={location.pathname} />

      {toast && <SuccessToast message={toast.message} onClose={() => setToast(null)} />}
      {errorPopup && <ErrorPopup message={errorPopup} onClose={() => setErrorPopup(null)} />}
    </div>
  );
}

// Styles (fully responsive)
const styles = {
  container: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#fafafa", minHeight: "100vh", paddingBottom: "70px" },
  main: { maxWidth: "1400px", margin: "0 auto", padding: "20px" },
  mainDetail: { maxWidth: "1400px", margin: "0 auto", padding: "20px", paddingBottom: "80px" },
  dashboardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  pageTitle: { fontSize: "clamp(22px, 5vw, 28px)", fontWeight: "700", color: "#1a1a1a", margin: 0 },
  filterBtn: { padding: "10px 20px", background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", whiteSpace: "nowrap" },
  categories: { display: "flex", gap: "12px", marginBottom: "24px", overflowX: "auto", padding: "8px 4px", scrollbarWidth: "none" },
  catBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "12px 20px", borderRadius: "12px", cursor: "pointer", transition: "all 0.3s ease", minWidth: "80px", border: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  catText: { fontSize: "11px", fontWeight: "600" },
  filtersPanel: { background: "#fff", padding: "20px", borderRadius: "16px", marginBottom: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-end" },
  filterCol: { display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "140px" },
  filterTitle: { fontSize: "11px", fontWeight: "700", color: "#1a1a1a", textTransform: "uppercase" },
  filterLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#555", cursor: "pointer" },
  priceRow: { display: "flex", gap: "8px" },
  filterInput: { flex: 1, padding: "8px 12px", border: "2px solid #e5e5e5", borderRadius: "8px", fontSize: "13px" },
  clearBtn: { padding: "8px 20px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  card: { background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", cursor: "pointer", transition: "all 0.3s ease" },
  cardImgWrap: { position: "relative", height: "260px", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cardImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
  cardBadge: { position: "absolute", top: "10px", left: "10px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "10px" },
  wishBtn: { position: "absolute", top: "10px", right: "10px", width: "34px", height: "34px", borderRadius: "50%", border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  cardInfo: { padding: "14px" },
  cardTitle: { fontSize: "14px", fontWeight: "600", color: "#1a1a1a", margin: "0 0 4px 0" },
  cardBrand: { fontSize: "12px", color: "#666", margin: "0 0 8px 0" },
  cardPriceRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" },
  cardPrice: { fontSize: "18px", fontWeight: "700", color: "#1a1a1a" },
  cardOldPrice: { fontSize: "13px", color: "#999", textDecoration: "line-through" },
  cardStars: { display: "flex", alignItems: "center", gap: "3px", marginBottom: "6px", flexWrap: "wrap" },
  star: { color: "#ffc107", fontSize: "12px" },
  cardRatingText: { fontSize: "11px", color: "#666" },
  cardInStock: { fontSize: "11px", color: "#15803d", fontWeight: "600", margin: "0 0 8px 0" },
  cardOutOfStock: { fontSize: "11px", color: "#dc2626", fontWeight: "600", margin: "0 0 8px 0" },
  cardColors: { display: "flex", gap: "5px" },
  colorDotSmall: { width: "14px", height: "14px", borderRadius: "50%", display: "inline-block", border: "1px solid #ddd" },
  cardActions: { padding: "0 14px 14px" },
  viewBtn: { width: "100%", padding: "10px", background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  empty: { textAlign: "center", padding: "60px", color: "#999" },
  loading: { textAlign: "center", padding: "60px", color: "#666" },
  backToListBtn: { display: "inline-flex", alignItems: "center", padding: "8px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: "30px", cursor: "pointer", marginBottom: "20px", fontWeight: "600", fontSize: "13px" },
  detailWrapper: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", marginBottom: "32px" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "12px" },
  rightColumn: { display: "flex", flexDirection: "column", gap: "12px" },
  imageCarousel: { position: "relative", display: "flex", alignItems: "center", gap: "10px" },
  mainImage: { flex: 1, height: "clamp(300px, 50vw, 450px)", background: "#f8f9fa", borderRadius: "16px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  img: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
  badge: { position: "absolute", top: "12px", left: "12px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontWeight: "700", fontSize: "12px" },
  carouselBtn: { width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e5e5e5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  thumbnails: { display: "flex", gap: "10px", overflowX: "auto", padding: "4px" },
  thumb: { width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", cursor: "pointer", flexShrink: 0, background: "#f8f9fa" },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  breadcrumb: { fontSize: "12px", color: "#666" },
  title: { fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700", color: "#1a1a1a", margin: 0 },
  infoRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  brandLabel: { fontSize: "13px", color: "#666" },
  brandValue: { fontSize: "15px", fontWeight: "700", color: "#1a1a1a" },
  tag: { fontSize: "11px", color: "#666", background: "#f0f0f0", padding: "3px 10px", borderRadius: "20px" },
  price: { fontSize: "clamp(24px, 6vw, 32px)", fontWeight: "700", color: "#1a1a1a" },
  oldPrice: { fontSize: "16px", color: "#999", textDecoration: "line-through" },
  save: { fontSize: "12px", color: "#10b981", fontWeight: "600", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px" },
  stockRow: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  inStock: { display: "inline-flex", alignItems: "center", padding: "4px 10px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", fontWeight: "600", fontSize: "12px" },
  outOfStock: { display: "inline-flex", alignItems: "center", padding: "4px 10px", background: "#fef2f2", color: "#dc2626", borderRadius: "6px", fontWeight: "600", fontSize: "12px" },
  rating: { fontSize: "12px", color: "#666" },
  compactOption: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "11px", fontWeight: "700", color: "#1a1a1a", textTransform: "uppercase" },
  colorOptions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  colorDot: { width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" },
  sizeOptions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  sizeBtn: { minWidth: "42px", padding: "8px 14px", borderRadius: "8px", border: "2px solid #e5e5e5", background: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  quickSpecs: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px", background: "#f8f9fa", padding: "12px", borderRadius: "10px" },
  specItem: { fontSize: "12px", color: "#555" },
  specLabel: { fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: "600" },
  descBox: { background: "#f8f9fa", padding: "14px", borderRadius: "10px" },
  sectionTitle: { fontSize: "12px", fontWeight: "700", margin: "0 0 8px 0", color: "#1a1a1a", textTransform: "uppercase" },
  desc: { fontSize: "13px", lineHeight: "1.5", color: "#555", margin: 0 },
  cartBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  disabledCart: { width: "100%", padding: "14px", background: "#e5e5e5", color: "#999", border: "none", borderRadius: "10px", cursor: "not-allowed", fontSize: "14px", fontWeight: "700" },
  trustBadges: { display: "flex", justifyContent: "space-around", padding: "12px 0", borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5", flexWrap: "wrap", gap: "12px" },
  trustItem: { display: "flex", alignItems: "center", fontSize: "11px", color: "#666", gap: "5px" },
  shareRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  shareLabel: { fontSize: "12px", color: "#666" },
  shareBtn: { width: "34px", height: "34px", borderRadius: "8px", border: "1px solid #e5e5e5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  similarSection: { marginTop: "32px", padding: "24px", background: "#fff", borderRadius: "20px" },
  sectionTitle2: { fontSize: "clamp(18px, 4vw, 24px)", fontWeight: "700", color: "#1a1a1a", marginBottom: "20px", textAlign: "center" },
  similarGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" },
  similarCard: { background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", cursor: "pointer" },
  similarImgWrap: { position: "relative", height: "200px", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" },
  similarImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
  similarBadge: { position: "absolute", top: "8px", left: "8px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff", padding: "3px 8px", borderRadius: "5px", fontWeight: "700", fontSize: "9px" },
  similarInfo: { padding: "12px" },
  similarName: { fontSize: "13px", fontWeight: "600", margin: "0 0 4px 0" },
  similarBrand: { fontSize: "11px", color: "#666", margin: "0 0 6px 0" },
  similarPrice: { fontSize: "16px", fontWeight: "700", marginBottom: "6px" },
  similarStars: { display: "flex", gap: "2px" },
  errorPopupOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  errorPopupContent: { background: "#fff", padding: "24px", borderRadius: "20px", textAlign: "center", maxWidth: "320px", width: "85%" },
  errorPopupMessage: { fontSize: "14px", color: "#555", margin: "16px 0", lineHeight: "1.4" },
  errorPopupButton: { padding: "8px 24px", background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)", color: "#fff", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  successToast: { position: "fixed", bottom: "80px", right: "20px", left: "20px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", padding: "12px 20px", borderRadius: "10px", zIndex: 9998, fontWeight: "600", fontSize: "13px", textAlign: "center", maxWidth: "300px", margin: "0 auto" },
  noImage: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", color: "#999", fontSize: "12px" }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes modalSlide { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .categories::-webkit-scrollbar, .thumbnails::-webkit-scrollbar { display: none; }
  * { scrollbar-width: thin; }
  @media (max-width: 768px) {
    .grid { gap: 12px; }
    .cardImgWrap { height: 200px; }
    .cardInfo { padding: 10px; }
    .cardPrice { font-size: 16px; }
    .detailWrapper { padding: 16px; gap: 20px; }
    .quickSpecs { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .grid { grid-template-columns: 1fr 1fr; }
    .similarGrid { grid-template-columns: 1fr 1fr; }
    .categories { gap: 8px; }
    .catBtn { padding: 8px 12px; min-width: 65px; }
    .catText { font-size: 9px; }
    .filtersPanel { flex-direction: column; align-items: stretch; }
    .priceRow { flex-direction: column; }
    .trustBadges { flex-direction: column; align-items: center; }
    .infoRow { flex-direction: column; align-items: flex-start; }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;