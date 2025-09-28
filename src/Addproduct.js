import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaImage, FaTag, FaShoppingCart, FaPercent,
  FaRupeeSign, FaTshirt, FaPalette, FaRuler, FaHashtag,
  FaTimes, FaCheck, FaInfoCircle
} from "react-icons/fa";

function AddProduct() {
  // Predefined options
  const categories = ["Men", "Women", "Children", "Jewelry", "Accessories"];
  const subCategories = {
    Men: ["Shirts", "Pants", "T-Shirts", "Innerwear"],
    Women: ["Sarees", "Western", "Jeans", "Lehenga", "Tops"],
    Children: ["T-Shirts", "Pants", "Dresses", "Shorts"],
    Jewelry: ["Rings", "Necklaces", "Earrings", "Bracelets"],
    Accessories: ["Purses", "Belts", "Perfumes", "Sunglasses"]
  };
  const brands = ["AROHA", "Local", "Premium", "Designer", "Other"];
  const colors = ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Gray", "Navy", "Beige"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const types = ["Cotton", "Polyester", "Silk", "Denim", "Linen", "Wool", "Leather"];

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subCategory: "",
    brand: "",
    price: "",
    discount: "",
    finalPrice: "",
    color: [],
    size: [],
    type: "",
    keywords: [],
    stock: "",
    images: [],
    sku: "",
    weight: "",
    dimensions: { length: "", width: "", height: "" },
    tags: [],
    isFeatured: false,
    isActive: true,
    material: "",
    customColor: "",
    customSize: "",
    customKeyword: "",
    customTag: ""
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const navigate = useNavigate();

  // Auto-calculate final price and discount
  useEffect(() => {
    if (formData.price) {
      const price = parseFloat(formData.price) || 0;
      const discount = parseFloat(formData.discount) || 0;
      const finalPrice = price - (price * discount / 100);
      setFormData(prev => ({
        ...prev,
        finalPrice: finalPrice.toFixed(2),
        discount: discount > 100 ? 100 : discount
      }));
    }
  }, [formData.price, formData.discount]);

  // Update subcategories when category changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, subCategory: "" }));
  }, [formData.category]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "images") {
      const filesArray = Array.from(files);
      setFormData(prev => ({ ...prev, images: filesArray }));
      setImagePreviews(filesArray.map(file => URL.createObjectURL(file)));
    }
    else if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
    else if (name.startsWith("dimensions.")) {
      const dimension = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimension]: value }
      }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle checkbox changes for arrays
  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  // Add custom items
  const addCustomItem = (field, value) => {
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value],
        [`custom${field.charAt(0).toUpperCase() + field.slice(1)}`]: ""
      }));
    }
  };

  // Remove item
  const removeItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || formData.images.length === 0) {
      alert("Please provide at least Name, Price, and one Image.");
      return;
    }
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === "images") {
          formData.images.forEach(file => data.append("images", file));
        }
        else if (Array.isArray(formData[key])) {
          data.append(key, JSON.stringify(formData[key]));
        }
        else if (typeof formData[key] === "object") {
          data.append(key, JSON.stringify(formData[key]));
        }
        else if (formData[key] !== "" && !key.startsWith("custom")) {
          data.append(key, formData[key]);
        }
      });
      await axios.post("http://localhost:5000/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product added successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product. Check console for details.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}><FaPlus /> Add New Product</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Info Row */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Product Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Category*</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.input}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {formData.category && (
            <div style={styles.inputGroup}>
              <label style={styles.label}><FaTag /> Sub-Category</label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Select Sub-Category</option>
                {subCategories[formData.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pricing Row */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaRupeeSign /> Price*</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaPercent /> Discount (%)</label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              style={styles.input}
              placeholder="0"
              min="0"
              max="100"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaRupeeSign /> Final Price</label>
            <input
              type="text"
              value={formData.finalPrice}
              style={styles.input}
              readOnly
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaShoppingCart /> Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              style={styles.input}
              placeholder="0"
            />
          </div>
        </div>

        {/* Attributes Row */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaPalette /> Color</label>
            <div style={styles.checkboxGroup}>
              {colors.map(color => (
                <label key={color} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.color.includes(color)}
                    onChange={() => handleCheckboxChange("color", color)}
                  />
                  {color}
                </label>
              ))}
            </div>
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customColor"
                value={formData.customColor}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Add custom color"
              />
              <button
                type="button"
                onClick={() => addCustomItem("color", formData.customColor)}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            <div style={styles.tags}>
              {formData.color.map(color => (
                <span key={color} style={styles.tag}>
                  {color}
                  <button
                    type="button"
                    onClick={() => removeItem("color", color)}
                    style={styles.tagRemove}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Size and Type Row */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaRuler /> Size</label>
            <div style={styles.checkboxGroup}>
              {sizes.map(size => (
                <label key={size} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.size.includes(size)}
                    onChange={() => handleCheckboxChange("size", size)}
                  />
                  {size}
                </label>
              ))}
            </div>
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customSize"
                value={formData.customSize}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Add custom size"
              />
              <button
                type="button"
                onClick={() => addCustomItem("size", formData.customSize)}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            <div style={styles.tags}>
              {formData.size.map(size => (
                <span key={size} style={styles.tag}>
                  {size}
                  <button
                    type="button"
                    onClick={() => removeItem("size", size)}
                    style={styles.tagRemove}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select Type</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Info Row */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Keywords</label>
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customKeyword"
                value={formData.customKeyword}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Add keyword"
              />
              <button
                type="button"
                onClick={() => addCustomItem("keywords", formData.customKeyword)}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            <div style={styles.tags}>
              {formData.keywords.map(keyword => (
                <span key={keyword} style={styles.tag}>
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeItem("keywords", keyword)}
                    style={styles.tagRemove}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Tags</label>
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customTag"
                value={formData.customTag}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Add tag"
              />
              <button
                type="button"
                onClick={() => addCustomItem("tags", formData.customTag)}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            <div style={styles.tags}>
              {formData.tags.map(tag => (
                <span key={tag} style={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeItem("tags", tag)}
                    style={styles.tagRemove}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dimensions and Weight Row */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaRuler /> Dimensions (cm)</label>
            <div style={styles.dimensions}>
              <input
                type="number"
                name="dimensions.length"
                value={formData.dimensions.length}
                onChange={handleChange}
                style={styles.dimensionInput}
                placeholder="Length"
              />
              <input
                type="number"
                name="dimensions.width"
                value={formData.dimensions.width}
                onChange={handleChange}
                style={styles.dimensionInput}
                placeholder="Width"
              />
              <input
                type="number"
                name="dimensions.height"
                value={formData.dimensions.height}
                onChange={handleChange}
                style={styles.dimensionInput}
                placeholder="Height"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaRuler /> Weight (grams)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              style={styles.input}
              placeholder="0"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaHashtag /> SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              style={styles.input}
              placeholder="Unique SKU"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaImage /> Product Images*</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleChange}
              style={styles.input}
              required
            />
            <div style={styles.imagePreview}>
              {imagePreviews.map((preview, index) => (
                <div key={index} style={styles.previewContainer}>
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    style={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...formData.images];
                      newImages.splice(index, 1);
                      setFormData(prev => ({
                        ...prev,
                        images: newImages
                      }));
                      setImagePreviews(prev => prev.filter((_, i) => i !== index));
                    }}
                    style={styles.removeImage}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={styles.submitGroup}>
          <button type="submit" style={styles.submitButton}>
            <FaCheck /> Save Product
          </button>
        </div>
      </form>
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
    color: "#333",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "2rem",
    marginBottom: "20px",
    color: "#2c3e50",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  form: {
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "20px",
  },
  inputGroup: {
    flex: "1",
    minWidth: "200px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
    color: "#444",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    background: "#f8f9fa",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    margin: "5px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  customInputGroup: {
    display: "flex",
    gap: "5px",
    marginTop: "5px",
  },
  customInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  addButton: {
    padding: "8px 12px",
    background: "#2c3e50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },
  tag: {
    background: "#e9ecef",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  tagRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "0 0 0 4px",
    color: "#666",
  },
  dimensions: {
    display: "flex",
    gap: "10px",
  },
  dimensionInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.9rem",
  },
  imagePreview: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  previewContainer: {
    position: "relative",
    display: "inline-block",
  },
  previewImage: {
    width: "80px",
    height: "80px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
  removeImage: {
    position: "absolute",
    top: "5px",
    right: "5px",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.7rem",
  },
  submitGroup: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "25px",
  },
  submitButton: {
    padding: "12px 24px",
    background: "#2c3e50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.3s",
    ":hover": {
      background: "#1a252f",
    },
  },
};

export default AddProduct;
