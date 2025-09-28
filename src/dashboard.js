import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch, FaShoppingCart, FaStar, FaStarHalfAlt, FaHeart,
  FaFilter, FaSlidersH, FaTimes, FaRupeeSign, FaTag
} from "react-icons/fa";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    minPrice: "",
    maxPrice: "",
    minDiscount: "",
    minRating: "",
    sizes: [],
    brands: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check login
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!user;

  // Fetch products with filters
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (filters.category) params.append("category", filters.category);
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minDiscount) params.append("minDiscount", filters.minDiscount);
      if (filters.minRating) params.append("minRating", filters.minRating);
      if (filters.sizes.length > 0) params.append("sizes", filters.sizes.join(","));
      if (filters.brands.length > 0) params.append("brands", filters.brands.join(","));

      const res = await axios.get(`http://localhost:5000/products/search?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, filters, location.search]);

  // Navigate with login check
  const handleNavigate = (path) => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  // Add to cart
  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) return navigate("/login");
    try {
      await axios.post(`http://localhost:5000/cart`, {
        userId: user._id,
        productId,
        quantity: 1
      });
      alert("Product added to cart!");
    } catch (err) {
      console.log(err);
      alert("Failed to add to cart");
    }
  };

  // Delete product (admin or owner)
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  // Toggle filter
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
      return { ...prev, [filterType]: value };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: "",
      gender: "",
      minPrice: "",
      maxPrice: "",
      minDiscount: "",
      minRating: "",
      sizes: [],
      brands: []
    });
  };

  // Render stars for rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} style={styles.star} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} style={styles.star} />);
      } else {
        stars.push(<FaStar key={i} style={{ ...styles.star, color: "#ddd" }} />);
      }
    }
    return stars;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <span style={styles.brandName}>AROHA</span>
        </div>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => navigate("/dashboard")}>Dashboard</button>
          {isLoggedIn && <button style={styles.navBtn} onClick={() => navigate("/AddProduct")}>Add Product</button>}
          <button style={styles.navBtn} onClick={() => handleNavigate("/cart")}>Cart</button>
          <button style={styles.navBtn} onClick={() => handleNavigate("/profile")}>Profile</button>
          <button style={styles.navBtn} onClick={() => navigate("/orders")}>Orders</button>
          <button style={styles.navBtn} onClick={() => navigate("/help")}>Help</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <h2 style={styles.heading}>Shopping Dashboard</h2>

        {/* Search and Filter Toggle */}
        <div style={styles.searchFilterContainer}>
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products (e.g., shirts, jeans, sarees)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={styles.filterToggleBtn}
          >
            <FaSlidersH /> {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Filters Sidebar */}
        {showFilters && (
          <div style={styles.filtersContainer}>
            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Category</h3>
              <select
                value={filters.category}
                onChange={(e) => toggleFilter("category", e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Categories</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Children">Children</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Gender</h3>
              <div style={styles.checkboxGroup}>
                {["Men", "Women", "Unisex"].map(gender => (
                  <label key={gender} style={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="gender"
                      checked={filters.gender === gender}
                      onChange={() => toggleFilter("gender", gender)}
                    />
                    {gender}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Price Range</h3>
              <div style={styles.priceRange}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => toggleFilter("minPrice", e.target.value)}
                  style={styles.priceInput}
                />
                <span style={styles.priceSeparator}>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => toggleFilter("maxPrice", e.target.value)}
                  style={styles.priceInput}
                />
              </div>
            </div>

            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Discount</h3>
              <input
                type="number"
                placeholder="Minimum %"
                value={filters.minDiscount}
                onChange={(e) => toggleFilter("minDiscount", e.target.value)}
                style={styles.filterInput}
              />
            </div>

            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Rating</h3>
              <div style={styles.ratingFilter}>
                {[4, 3, 2, 1].map(rating => (
                  <label key={rating} style={styles.ratingLabel}>
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.minRating == rating}
                      onChange={() => toggleFilter("minRating", rating)}
                    />
                    {renderStars(rating)} & up
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Sizes</h3>
              <div style={styles.checkboxGroup}>
                {["XS", "S", "M", "L", "XL", "XXL"].map(size => (
                  <label key={size} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.sizes.includes(size)}
                      onChange={() => toggleFilter("sizes", size)}
                    />
                    {size}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.filterSection}>
              <h3 style={styles.filterTitle}>Brands</h3>
              <div style={styles.checkboxGroup}>
                {["AROHA", "Local", "Premium", "Designer"].map(brand => (
                  <label key={brand} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => toggleFilter("brands", brand)}
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={clearFilters} style={styles.clearFiltersBtn}>
              Clear All Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        <div style={styles.productsContainer}>
          {products.length === 0 ? (
            <p style={styles.noProducts}>No products found. Try different filters.</p>
          ) : (
            <div style={styles.productsGrid}>
              {products.map((p) => {
                // Parse JSON strings if they exist
                const color = typeof p.color === 'string' ? JSON.parse(p.color) : p.color || [];
                const size = typeof p.size === 'string' ? JSON.parse(p.size) : p.size || [];
                const images = p.images || [];
                const discount = p.discount || 0;
                const finalPrice = p.finalPrice || p.price;
                const rating = p.rating || 0;

                return (
                  <div key={p._id} style={styles.productCard}>
                    {discount > 0 && (
                      <div style={styles.discountBadge}>{discount}% OFF</div>
                    )}
                    <div style={styles.productImageContainer}>
                      {images.length > 0 ? (
                        <img
                          src={`http://localhost:5000/uploads/${images[0]}`}
                          alt={p.name}
                          style={styles.productImage}
                        />
                      ) : (
                        <div style={styles.noImage}>No Image</div>
                      )}
                      <button style={styles.wishlistBtn}>
                        <FaHeart />
                      </button>
                    </div>
                    <div style={styles.productInfo}>
                      <h3 style={styles.productName}>{p.name}</h3>
                      <p style={styles.productBrand}>{p.brand || "AROHA"}</p>
                      <div style={styles.priceContainer}>
                        <span style={styles.finalPrice}><FaRupeeSign />{finalPrice}</span>
                        {discount > 0 && (
                          <span style={styles.originalPrice}><FaRupeeSign />{p.price}</span>
                        )}
                        {discount > 0 && (
                          <span style={styles.discountPercent}>{discount}% off</span>
                        )}
                      </div>
                      <div style={styles.ratingContainer}>
                        {renderStars(rating)}
                        <span style={styles.ratingText}>({rating})</span>
                      </div>
                      {color.length > 0 && (
                        <div style={styles.colorOptions}>
                          {color.map((c, i) => (
                            <span
                              key={i}
                              style={{
                                ...styles.colorDot,
                                backgroundColor: c.toLowerCase()
                              }}
                              title={c}
                            />
                          ))}
                        </div>
                      )}
                      {size.length > 0 && (
                        <div style={styles.sizeOptions}>
                          {size.map((s, i) => (
                            <span key={i} style={styles.sizeTag}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={styles.productActions}>
                      <button
                        onClick={() => handleAddToCart(p._id)}
                        style={styles.addToCartBtn}
                      >
                        <FaShoppingCart /> Add to Cart
                      </button>
                    
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Styles
const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    color: "#333",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "#2c3e50",
    color: "#fff",
    flexWrap: "wrap",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  logoContainer: {
    fontSize: "24px",
    fontWeight: "bold",
    fontFamily: "'Cormorant Garamond', serif",
  },
  brandName: {
    color: "#fff",
  },
  navLinks: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  navBtn: {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.3s",
    ":hover": {
      background: "rgba(255,255,255,0.2)",
    },
  },
  main: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "2rem",
    marginBottom: "20px",
    color: "#2c3e50",
  },
  searchFilterContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "15px",
  },
  searchContainer: {
    position: "relative",
    flex: 1,
    minWidth: "300px",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#666",
  },
  searchInput: {
    width: "100%",
    padding: "10px 10px 10px 35px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
  },
  filterToggleBtn: {
    background: "#2c3e50",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filtersContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  filterSection: {
    marginBottom: "20px",
  },
  filterTitle: {
    fontSize: "1.1rem",
    marginBottom: "10px",
    color: "#2c3e50",
    fontWeight: "500",
  },
  filterSelect: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  priceRange: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  priceInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  priceSeparator: {
    color: "#666",
  },
  filterInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  ratingFilter: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  ratingLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  clearFiltersBtn: {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "8px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "15px",
  },
  productsContainer: {
    marginTop: "20px",
  },
  noProducts: {
    textAlign: "center",
    padding: "40px",
    color: "#666",
    fontSize: "1.1rem",
  },
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "25px",
  },
  productCard: {
    background: "#fff",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.3s, box-shadow 0.3s",
    position: "relative",
    ":hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    },
  },
  discountBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "#dc3545",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    zIndex: 1,
  },
  productImageContainer: {
    position: "relative",
    height: "200px",
    background: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s",
    ":hover": {
      transform: "scale(1.05)",
    },
  },
  noImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eee",
    color: "#666",
  },
  wishlistBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(255,255,255,0.8)",
    border: "none",
    borderRadius: "50%",
    width: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 1,
  },
  productInfo: {
    padding: "15px",
  },
  productName: {
    fontSize: "1rem",
    marginBottom: "5px",
    fontWeight: "500",
    color: "#2c3e50",
  },
  productBrand: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "10px",
  },
  priceContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  finalPrice: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  originalPrice: {
    fontSize: "0.9rem",
    color: "#999",
    textDecoration: "line-through",
  },
  discountPercent: {
    fontSize: "0.85rem",
    color: "#dc3545",
    fontWeight: "500",
  },
  ratingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginBottom: "10px",
  },
  star: {
    color: "#ffc107",
    fontSize: "0.9rem",
  },
  ratingText: {
    fontSize: "0.85rem",
    color: "#666",
  },
  colorOptions: {
    display: "flex",
    gap: "5px",
    marginBottom: "10px",
  },
  colorDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "1px solid #ddd",
    display: "inline-block",
  },
  sizeOptions: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  sizeTag: {
    padding: "3px 8px",
    background: "#f8f9fa",
    borderRadius: "4px",
    fontSize: "0.8rem",
    border: "1px solid #ddd",
  },
  productActions: {
    display: "flex",
    gap: "10px",
    padding: "0 15px 15px",
  },
  addToCartBtn: {
    flex: 1,
    padding: "8px",
    background: "#2c3e50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "0.9rem",
  },
  deleteBtn: {
    padding: "8px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "0.9rem",
  },
};

export default Dashboard;
