import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "./sweetalertConfig";
import {
  FaBoxOpen,
  FaEdit,
  FaSearch,
  FaTrash,
  FaSyncAlt,
  FaTimes
} from "react-icons/fa";

const initialEditState = {
  _id: "",
  name: "",
  category: "",
  subCategory: "",
  brand: "",
  collection: "",
  type: "",
  material: "",
  price: "",
  discount: "",
  stock: "",
  color: "",
  size: "",
  images: ""
};

const getImageSrc = (image) => {
  if (!image) return "https://via.placeholder.com/320x220?text=Product";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `https://aroha.onrender.com/uploads/${image}`;
};

function ProductManagement() {
  const navigate = useNavigate();
  const seller = JSON.parse(localStorage.getItem("sellerData"));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(initialEditState);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [priceForm, setPriceForm] = useState({
    applyTo: "all",
    adjustmentType: "fixed",
    operation: "increase",
    value: "",
    categories: []
  });
  const [priceUpdating, setPriceUpdating] = useState(false);

  const fetchAttributes = async () => {
    try {
      const res = await axios.get("https://aroha.onrender.com/products/attributes");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchProducts = async () => {
    if (!seller?._id) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sellerId", seller._id);
      if (searchId.trim()) params.append("productId", searchId.trim());
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await axios.get(`https://aroha.onrender.com/products/search?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch seller products", err);
      Swal.fire("Unable to load your products right now.", "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, seller?._id]);

  const openEditor = (product) => {
    setEditingProduct(product);
    setEditForm({
      _id: product._id,
      name: product.name || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      brand: product.brand || "",
      collection: product.collection || "",
      type: product.type || "",
      material: product.material || "",
      price: product.price ?? "",
      discount: product.discount ?? "",
      stock: product.stock ?? "",
      color: (product.color || []).join(", "),
      size: (product.size || []).join(", "),
      images: (product.images || []).join(", ")
    });
  };

  const closeEditor = () => {
    setEditingProduct(null);
    setEditForm(initialEditState);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleCategorySelection = (category) => {
    setPriceForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category]
    }));
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();

    if (!priceForm.value) {
      Swal.fire("Enter a fixed amount or percentage value.", "", "error");
      return;
    }

    if (priceForm.applyTo === "selectedProducts" && selectedProductIds.length === 0) {
      Swal.fire("Select at least one product for this update.", "", "error");
      return;
    }

    if (priceForm.applyTo === "selectedCategories" && priceForm.categories.length === 0) {
      Swal.fire("Select at least one category for this update.", "", "error");
      return;
    }

    setPriceUpdating(true);
    try {
      const res = await axios.post("https://aroha.onrender.com/products/bulk-price-update", {
        sellerId: seller._id,
        applyTo: priceForm.applyTo,
        adjustmentType: priceForm.adjustmentType,
        operation: priceForm.operation,
        value: Number(priceForm.value),
        productIds: selectedProductIds,
        categories: priceForm.categories
      });

      setProducts(res.data.products || []);
      setSelectedProductIds([]);
      Swal.fire(`Prices updated for ${res.data.updatedCount} products.`, "", "success");
    } catch (err) {
      console.error("Bulk price update failed", err);
      Swal.fire(err.response?.data?.message || "Failed to update prices.", "", "error");
    } finally {
      setPriceUpdating(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Delete this product permanently?");
    if (!confirmed) return;

    try {
      await axios.delete(`https://aroha.onrender.com/products/${productId}`);
      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      console.error("Failed to delete product", err);
      Swal.fire("Failed to delete product.", "", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: editForm.name,
        category: editForm.category,
        subCategory: editForm.subCategory,
        brand: editForm.brand,
        collection: editForm.collection,
        type: editForm.type,
        material: editForm.material,
        price: editForm.price,
        discount: editForm.discount,
        stock: editForm.stock,
        color: JSON.stringify(editForm.color.split(",").map((item) => item.trim()).filter(Boolean)),
        size: JSON.stringify(editForm.size.split(",").map((item) => item.trim()).filter(Boolean)),
        images: JSON.stringify(editForm.images.split(",").map((item) => item.trim()).filter(Boolean))
      };

      const res = await axios.put(`https://aroha.onrender.com/products/${editForm._id}`, payload);
      setProducts((prev) =>
        prev.map((product) => (product._id === editForm._id ? res.data.product : product))
      );
      closeEditor();
    } catch (err) {
      console.error("Failed to update product", err);
      Swal.fire("Failed to update product.", "", "error");
    }
  };

  if (!seller?._id) {
    return (
      <div style={styles.emptyState}>
        <h2 style={styles.heading}>Product Management</h2>
        <p>Please log in as a seller to manage uploaded products.</p>
        <button style={styles.primaryButton} onClick={() => navigate("/SellerAuth")}>
          Go to Seller Login
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.heading}>Product Management</h2>
          <p style={styles.subText}>View, search, filter, edit, and delete products uploaded by your seller account.</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={fetchProducts}>
            <FaSyncAlt /> Refresh
          </button>
          <button style={styles.primaryButton} onClick={() => navigate("/AddProduct")}>
            <FaBoxOpen /> Add Product
          </button>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by product ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button style={styles.primaryButton} onClick={fetchProducts}>
          Search
        </button>
      </div>

      <section style={styles.pricePanel}>
        <div>
          <h3 style={styles.sectionTitle}>Price Management</h3>
          <p style={styles.sectionText}>Increase or decrease prices for all your products, only selected products, or selected categories.</p>
        </div>
        <form onSubmit={handlePriceUpdate} style={styles.priceForm}>
          <select
            value={priceForm.applyTo}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, applyTo: e.target.value }))}
            style={styles.select}
          >
            <option value="all">All Products</option>
            <option value="selectedProducts">Selected Products</option>
            <option value="selectedCategories">Selected Categories</option>
          </select>
          <select
            value={priceForm.operation}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, operation: e.target.value }))}
            style={styles.select}
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
          <select
            value={priceForm.adjustmentType}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, adjustmentType: e.target.value }))}
            style={styles.select}
          >
            <option value="fixed">Fixed Amount</option>
            <option value="percentage">Percentage (%)</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={priceForm.adjustmentType === "fixed" ? "Amount" : "Percentage"}
            value={priceForm.value}
            onChange={(e) => setPriceForm((prev) => ({ ...prev, value: e.target.value }))}
            style={styles.input}
          />
          <button type="submit" style={styles.primaryButton} disabled={priceUpdating}>
            {priceUpdating ? "Updating..." : "Apply Price Change"}
          </button>
        </form>

        {priceForm.applyTo === "selectedProducts" && (
          <p style={styles.helperText}>{selectedProductIds.length} products selected from the list below.</p>
        )}

        {priceForm.applyTo === "selectedCategories" && (
          <div style={styles.selectionWrap}>
            {categories.map((category) => (
              <label key={category} style={styles.pillLabel}>
                <input
                  type="checkbox"
                  checked={priceForm.categories.includes(category)}
                  onChange={() => toggleCategorySelection(category)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <p style={styles.statusText}>Loading products...</p>
      ) : products.length === 0 ? (
        <p style={styles.statusText}>No products matched this seller, product ID, or category filter.</p>
      ) : (
        <div style={styles.grid}>
          {products.map((product) => (
            <div key={product._id} style={styles.card}>
              <label style={styles.selectRow}>
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product._id)}
                  onChange={() => toggleProductSelection(product._id)}
                />
                <span>Select Product</span>
              </label>
              <img
                src={getImageSrc(product.images?.[0])}
                alt={product.name}
                style={styles.image}
              />
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{product.name}</h3>
                <p style={styles.meta}><strong>ID:</strong> {product._id}</p>
                <p style={styles.meta}><strong>Category:</strong> {product.category || "NA"}</p>
                <p style={styles.meta}><strong>Brand:</strong> {product.brand || "NA"}</p>
                <p style={styles.meta}><strong>Base Price:</strong> Rs. {product.price || 0}</p>
                <p style={styles.meta}><strong>Final Price:</strong> Rs. {product.finalPrice || product.price || 0}</p>
                <div style={styles.cardActions}>
                  <button style={styles.editButton} onClick={() => openEditor(product)}>
                    <FaEdit /> Edit
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(product._id)}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Product</h3>
              <button type="button" style={styles.closeButton} onClick={closeEditor}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={styles.formGrid}>
              <input
                type="text"
                placeholder="Product Name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={editForm.category}
                onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Sub Category"
                value={editForm.subCategory}
                onChange={(e) => setEditForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Brand"
                value={editForm.brand}
                onChange={(e) => setEditForm((prev) => ({ ...prev, brand: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Collection"
                value={editForm.collection}
                onChange={(e) => setEditForm((prev) => ({ ...prev, collection: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Type / Material"
                value={editForm.type}
                onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Material"
                value={editForm.material}
                onChange={(e) => setEditForm((prev) => ({ ...prev, material: e.target.value }))}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Price"
                value={editForm.price}
                onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                style={styles.input}
                required
              />
              <input
                type="number"
                placeholder="Discount"
                value={editForm.discount}
                onChange={(e) => setEditForm((prev) => ({ ...prev, discount: e.target.value }))}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Stock"
                value={editForm.stock}
                onChange={(e) => setEditForm((prev) => ({ ...prev, stock: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Colors separated by commas"
                value={editForm.color}
                onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Sizes separated by commas"
                value={editForm.size}
                onChange={(e) => setEditForm((prev) => ({ ...prev, size: e.target.value }))}
                style={styles.input}
              />
              <textarea
                placeholder="Image URLs separated by commas"
                value={editForm.images}
                onChange={(e) => setEditForm((prev) => ({ ...prev, images: e.target.value }))}
                style={styles.textarea}
                rows={4}
              />
              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryButton} onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton}>
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 20px 60px",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#1c2430"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px"
  },
  heading: {
    margin: 0,
    fontSize: "2rem"
  },
  subText: {
    margin: "8px 0 0",
    color: "#596579"
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  filterBar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "24px"
  },
  searchBox: {
    position: "relative"
  },
  searchIcon: {
    position: "absolute",
    top: "50%",
    left: "14px",
    transform: "translateY(-50%)",
    color: "#7b8798"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d7e2",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "0.95rem"
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d7e2",
    borderRadius: "12px",
    padding: "12px 14px 12px 40px",
    fontSize: "0.95rem"
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d7e2",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "0.95rem",
    background: "#fff"
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#1f6feb",
    color: "#fff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600
  },
  secondaryButton: {
    border: "1px solid #c7d0dd",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#fff",
    color: "#253041",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600
  },
  statusText: {
    padding: "24px",
    textAlign: "center",
    background: "#f7f9fc",
    borderRadius: "16px",
    color: "#607086"
  },
  pricePanel: {
    background: "#f8fbff",
    border: "1px solid #dfe9f6",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "24px"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem"
  },
  sectionText: {
    margin: "8px 0 16px",
    color: "#607086"
  },
  priceForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    alignItems: "center"
  },
  helperText: {
    margin: "12px 0 0",
    color: "#1f5fcc",
    fontSize: "0.92rem"
  },
  selectionWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px"
  },
  pillLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "999px",
    border: "1px solid #d0d7e2",
    background: "#fff",
    fontSize: "0.92rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px"
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(17, 24, 39, 0.08)",
    border: "1px solid #e6ebf2",
    position: "relative"
  },
  selectRow: {
    position: "absolute",
    top: "12px",
    left: "12px",
    zIndex: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.92)",
    fontSize: "0.86rem",
    color: "#243041"
  },
  image: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
    background: "#eef2f8"
  },
  cardBody: {
    padding: "16px"
  },
  cardTitle: {
    margin: "0 0 10px",
    fontSize: "1.1rem"
  },
  meta: {
    margin: "6px 0",
    fontSize: "0.92rem",
    color: "#516074",
    wordBreak: "break-word"
  },
  cardActions: {
    display: "flex",
    gap: "10px",
    marginTop: "14px"
  },
  editButton: {
    flex: 1,
    border: "none",
    borderRadius: "10px",
    padding: "10px 12px",
    background: "#ecf3ff",
    color: "#1f5fcc",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px"
  },
  deleteButton: {
    flex: 1,
    border: "none",
    borderRadius: "10px",
    padding: "10px 12px",
    background: "#fff1f1",
    color: "#cf3131",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(12, 18, 28, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000
  },
  modal: {
    width: "min(860px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "20px",
    padding: "24px"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },
  modalTitle: {
    margin: 0
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "1.1rem",
    cursor: "pointer"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px"
  },
  textarea: {
    gridColumn: "1 / -1",
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d0d7e2",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "0.95rem",
    resize: "vertical"
  },
  modalActions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px"
  },
  emptyState: {
    maxWidth: "680px",
    margin: "90px auto",
    padding: "24px",
    textAlign: "center",
    fontFamily: "'Segoe UI', sans-serif"
  }
};

export default ProductManagement;
