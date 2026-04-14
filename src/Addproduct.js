import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "./sweetalertConfig";
import {
  FaPlus, FaImage, FaTag, FaShoppingCart, FaPercent,
  FaRupeeSign, FaTshirt, FaPalette, FaRuler, FaHashtag,
  FaTimes, FaCheck, FaInfoCircle, FaBoxOpen
} from "react-icons/fa";

function AddProduct() {
  const [categories, setCategories] = useState(["Men", "Women", "Children", "Jewelry", "Accessories"]);
  const [subCategories, setSubCategories] = useState({
    Men: ["Shirts", "Pants", "T-Shirts", "Innerwear"],
    Women: ["Sarees", "Western", "Jeans", "Lehenga", "Tops"],
    Children: ["T-Shirts", "Pants", "Dresses", "Shorts"],
    Jewelry: ["Rings", "Necklaces", "Earrings", "Bracelets"],
    Accessories: ["Purses", "Belts", "Perfumes", "Sunglasses"]
  });
  const [brands, setBrands] = useState([
    "Otto",
    "Polo",
    "Zara",
    "H&M",
    "Levis",
    "Nike",
    "Adidas"
  ]);
  const [collections, setCollections] = useState([
    "Summer Collection",
    "Winter Collection",
    "Festive Collection",
    "Casual Collection"
  ]);
  const colors = ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Gray", "Navy", "Beige"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const [categoryTypes, setCategoryTypes] = useState({
    Men: ["Cotton", "Polyester", "Silk", "Denim", "Linen", "Wool", "Leather"],
    Women: ["Cotton", "Polyester", "Silk", "Denim", "Linen", "Chiffon", "Georgette", "Velvet"],
    Children: ["Cotton", "Polyester", "Denim", "Fleece", "Wool"],
    Jewelry: ["Gold", "Silver", "Platinum", "Diamond", "Artificial", "Beaded"],
    Accessories: ["Leather", "PU Leather", "Canvas", "Metal", "Plastic"]
  });

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subCategory: "",
    brand: "",
    collection: "",
    customCollection: "",
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
    customBrand: "",
    customCategory: "",
    customSubCategory: "",
    customType: "",
    customKeyword: "",
    customTag: "",
    imageUrlInput: ""
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch attributes from backend
    axios.get("https://aroha.onrender.com/products/attributes")
      .then(res => {
        if (res.data) {
          if (res.data.categories && res.data.categories.length > 0) {
            setCategories(prev => [...new Set([...prev, ...res.data.categories])]);
          }
          if (res.data.brands && res.data.brands.length > 0) {
            setBrands(prev => [...new Set([...prev, ...res.data.brands])]);
          }
          
          setSubCategories(prev => {
            const next = { ...prev };
            Object.keys(res.data.subCategories || {}).forEach(cat => {
              if (!next[cat]) next[cat] = [];
              next[cat] = [...new Set([...next[cat], ...res.data.subCategories[cat]])];
            });
            return next;
          });
          
          setCategoryTypes(prev => {
            const next = { ...prev };
            Object.keys(res.data.categoryTypes || {}).forEach(cat => {
              if (!next[cat]) next[cat] = [];
              next[cat] = [...new Set([...next[cat], ...res.data.categoryTypes[cat]])];
            });
            return next;
          });
        }
      })
      .catch(err => console.error("Error fetching dynamic attributes:", err));
  }, []);

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

  useEffect(() => {
    setFormData(prev => ({ ...prev, subCategory: "" }));
    // Auto-fetch next SKU when category changes
    if (formData.category) {
      axios.get(`https://aroha.onrender.com/products/next-sku/${formData.category}`)
        .then(res => {
          if (res.data.success) {
             setFormData(prev => ({ ...prev, sku: res.data.sku }));
          }
        })
        .catch(err => console.error("Failed to fetch SKU", err));
    } else {
      setFormData(prev => ({ ...prev, sku: "" }));
    }
  }, [formData.category]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
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

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const addCustomItem = (field, value) => {
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value],
        [`custom${field.charAt(0).toUpperCase() + field.slice(1)}`]: ""
      }));
    }
  };

  const removeItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for missing fields
    const missingFields = [];
    if (!formData.name) missingFields.push("Product Name");
    if (!formData.price) missingFields.push("Base Price");
    if (!formData.category) missingFields.push("Category");
    if (!formData.subCategory) missingFields.push("Sub-Category");
    if (!formData.brand || formData.brand === "custom") {
      missingFields.push("Brand");
    }
    if (!formData.collection) missingFields.push("Collection");
    if (formData.color.length === 0) missingFields.push("Color (Select at least one)");
    if (formData.size.length === 0) missingFields.push("Size (Select at least one)");
    if (!formData.type) missingFields.push("Type / Material");
    if (!formData.sku) missingFields.push("SKU");
    if (formData.images.length === 0) missingFields.push("Product Image Links (Add at least one link)");

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Missing Fields",
        html: `Cannot add product. The following required fields are missing:<br><br>- ${missingFields.join("<br>- ")}`,
        icon: "warning"
      });
      return;
    }
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
          data.append(key, JSON.stringify(formData[key]));
        }
        else if (typeof formData[key] === "object") {
          data.append(key, JSON.stringify(formData[key]));
        }
        else if (formData[key] !== "" && !key.startsWith("custom") && key !== "imageUrlInput") {
          data.append(key, formData[key]);
        }
      });
      
      const seller = JSON.parse(localStorage.getItem("sellerData"));
      const user = JSON.parse(localStorage.getItem("user"));
      const owner = seller || user;

      if (owner) {
        data.append("sellerId", owner._id || "");
        data.append("sellerName", owner.name || owner.companyName || owner.email || "");
        data.append("soldBy", owner.companyName || owner.name || "AROHA Seller");
      }

      await axios.post("https://aroha.onrender.com/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        title: "Success",
        text: "Product added successfully!",
        icon: "success"
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error adding product:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to add product. Check console for details.",
        icon: "error"
      });
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto 24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}><FaPlus /> Add New Product</h2>
        <button
          type="button"
          onClick={() => navigate("/seller-orders")}
          style={styles.sellerOrdersButton}
        >
          <FaBoxOpen /> Go to Seller Orders
        </button>
      </div>
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
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Custom Category"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.customCategory) {
                    setFormData(prev => ({ ...prev, category: formData.customCategory, customCategory: "" }));
                  }
                }}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            {formData.category && !categories.includes(formData.category) && (
              <div style={{ marginTop: "5px", fontSize: "0.85rem", color: "green" }}>
                Active Category: {formData.category}
              </div>
            )}
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
                {(subCategories[formData.category] || []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <div style={styles.customInputGroup}>
                <input
                  type="text"
                  name="customSubCategory"
                  value={formData.customSubCategory}
                  onChange={handleChange}
                  style={styles.customInput}
                  placeholder="Custom Sub-Category"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (formData.customSubCategory) {
                      setFormData(prev => ({ ...prev, subCategory: formData.customSubCategory, customSubCategory: "" }));
                    }
                  }}
                  style={styles.addButton}
                >
                  <FaPlus />
                </button>
              </div>
              {formData.subCategory && !(subCategories[formData.category] || []).includes(formData.subCategory) && (
                <div style={{ marginTop: "5px", fontSize: "0.85rem", color: "green" }}>
                  Active Sub-Category: {formData.subCategory}
                </div>
              )}
            </div>
          )}
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Collection</label>

            <select
              name="collection"
              value={formData.collection}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select Collection</option>
              {collections.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customCollection"
                value={formData.customCollection}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Custom Collection"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.customCollection) {
                    setCollections(prev => [...prev, formData.customCollection]); // ✅ add to list
                    setFormData(prev => ({
                      ...prev,
                      collection: formData.customCollection,
                      customCollection: ""
                    }));
                  }
                }}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>

            {formData.collection && !collections.includes(formData.collection) && (
              <div style={{ marginTop: "5px", fontSize: "0.85rem", color: "green" }}>
                Active Collection: {formData.collection}
              </div>
            )}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaTag /> Brand</label>

            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customBrand"
                value={formData.customBrand}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Custom Brand"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.customBrand) {
                    setBrands(prev => [...prev, formData.customBrand]);
                    setFormData(prev => ({
                      ...prev,
                      brand: formData.customBrand,
                      customBrand: ""
                    }));
                  }
                }}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>

            {formData.brand && !brands.includes(formData.brand) && (
              <div style={{ marginTop: "5px", fontSize: "0.85rem", color: "green" }}>
                Selected Brand: {formData.brand}
              </div>
            )}
          </div>
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
                  <span style={{ 
                    display: 'inline-block', 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: color.toLowerCase(), 
                    borderRadius: '50%', 
                    border: '1px solid #ccc',
                    marginRight: '4px' 
                  }}></span>
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
            <label style={styles.label}><FaTag /> Type / Material</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select Type</option>
              {(categoryTypes[formData.category] || []).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="customType"
                value={formData.customType}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Custom Type"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.customType) {
                    setFormData(prev => ({ ...prev, type: formData.customType, customType: "" }));
                  }
                }}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            {formData.type && !(categoryTypes[formData.category] || []).includes(formData.type) && (
              <div style={{ marginTop: "5px", fontSize: "0.85rem", color: "green" }}>
                Selected: {formData.type}
              </div>
            )}
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
            <label style={styles.label}><FaHashtag /> SKU*</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              style={styles.input}
              placeholder="Unique SKU"
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaImage /> Product Image Links*</label>
            <div style={styles.customInputGroup}>
              <input
                type="text"
                name="imageUrlInput"
                value={formData.imageUrlInput}
                onChange={handleChange}
                style={styles.customInput}
                placeholder="Paste image URL here"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.imageUrlInput) {
                    setFormData(prev => ({
                      ...prev,
                      images: [...prev.images, prev.imageUrlInput],
                      imageUrlInput: ""
                    }));
                  }
                }}
                style={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            
            <div style={styles.imagePreview}>
              {formData.images.map((imgUrl, index) => (
                <div key={index} style={styles.previewContainer}>
                  <img
                    src={imgUrl}
                    alt={`Preview ${index}`}
                    style={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem("images", imgUrl)}
                    style={styles.removeImage}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit and Seller Orders Button */}
        <div style={styles.submitGroup}>
          <button type="submit" style={styles.submitButton}>
            <FaCheck /> Save Product
          </button>
        
        </div>
      </form>
    </div>
  );
}

// Styles (Premium System Look)
const styles = {
  container: {
    padding: "40px 20px",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: "#1f2937",
    backgroundColor: "#f3f4f6", // lighter gray
    minHeight: "100vh",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "24px",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "1200px",
    margin: "0 auto 24px auto",
  },
  form: {
    background: "#ffffff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.02)",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    marginBottom: "24px",
  },
  inputGroup: {
    flex: "1 1 calc(33.333% - 24px)",
    minWidth: "260px",
    "@media (max-width: 768px)": {
      flex: "1 1 calc(50% - 24px)",
    },
    "@media (max-width: 480px)": {
      flex: "1 1 100%",
    },
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.95rem",
    background: "#f9fafb",
    color: "#111827",
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  checkboxGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    margin: "8px 0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#374151",
    cursor: "pointer",
  },
  customInputGroup: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  customInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.9rem",
    background: "#f9fafb",
    outline: "none",
  },
  addButton: {
    padding: "10px 14px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s ease",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  tag: {
    background: "#e5e7eb",
    color: "#374151",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tagRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "0 0 0 4px",
    color: "#9ca3af",
    display: "flex",
    alignItems: "center",
  },
  dimensions: {
    display: "flex",
    gap: "12px",
  },
  dimensionInput: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.9rem",
    background: "#f9fafb",
    outline: "none",
  },
  imagePreview: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  previewContainer: {
    position: "relative",
    display: "inline-block",
  },
  previewImage: {
    width: "90px",
    height: "90px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  removeImage: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.75rem",
    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
  },
  submitGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
  },
  submitButton: {
    padding: "14px 28px",
    background: "#10b981", // Emerald success color
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.05rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
  },
  sellerOrdersButton: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#111827",
    border: "2px solid #111827",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    marginBottom: "24px", // To space it out from form
    maxWidth: "max-content",
    marginLeft: "auto",
    marginRight: "auto",
  },
};

export default AddProduct;
