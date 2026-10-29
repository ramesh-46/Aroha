import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaCamera, FaCloudUploadAlt, FaTimes, FaSearch, FaMagic, FaArrowRight, FaRedoAlt, FaBoxOpen, FaCheckCircle } from "react-icons/fa";

const API = "https://aroha.onrender.com";

const getImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/")) return value.startsWith("/uploads/") ? API + value : value;
  return API + "/uploads/" + encodeURIComponent(value);
};

const formatPrice = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function ImageSearchModal({ onClose, onSelectProduct }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [results, setResults] = useState([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKey = (event) => { if (event.key === "Escape" && status !== "loading") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, status]);

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const chooseFile = (nextFile) => {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      return;
    }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setResults([]);
    setDescription("");
    setError("");
    setStatus("ready");
  };

  const searchImage = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    setStatus("loading");
    setError("");
    const startedAt = performance.now();
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await axios.post(`${API}/products/image-search`, body, {
        timeout: 90000
      });
      setResults(response.data.products || []);
      setDescription(response.data.description || "Visual matches from the Aroha catalog");
      setStatus("done");
      console.info("[Aroha image search] completed", {
        resultCount: (response.data.products || []).length,
        durationMs: Math.round(performance.now() - startedAt)
      });
    } catch (err) {
      const message = err.response?.data?.message || (err.code === "ECONNABORTED"
        ? "Image search took too long. Please try a smaller image."
        : "Image search is temporarily unavailable. Please try again.");
      setError(message);
      setStatus("error");
      console.error("[Aroha image search] failed", {
        status: err.response?.status || "network",
        durationMs: Math.round(performance.now() - startedAt)
      });
    }
  };

  return (
    <div className="aroha-visual-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && status !== "loading") onClose(); }}>
      <section className="aroha-visual-modal" role="dialog" aria-modal="true" aria-labelledby="aroha-visual-title">
        <header className="aroha-visual-header">
          <div className="aroha-visual-heading">
            <span className="aroha-visual-mark"><FaMagic /></span>
            <div>
              <p className="aroha-visual-eyebrow">AROHA SMART SHOPPING</p>
              <h2 id="aroha-visual-title">Search with an image</h2>
              <p className="aroha-visual-subtitle">Find products that look like the photo.</p>
            </div>
          </div>
          <button className="aroha-visual-close" onClick={onClose} disabled={status === "loading"} aria-label="Close image search"><FaTimes /></button>
        </header>

        <div className="aroha-visual-body">
          <input ref={inputRef} className="aroha-visual-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <div className={`aroha-visual-dropzone ${preview ? "has-preview" : ""}`} onClick={() => !preview && inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }} role={!preview ? "button" : undefined} tabIndex={!preview ? 0 : undefined} onKeyDown={(event) => { if (!preview && (event.key === "Enter" || event.key === " ")) inputRef.current?.click(); }}>
            {preview ? (
              <>
                <img className="aroha-visual-preview" src={preview} alt="Selected product for visual search" />
                <div className="aroha-visual-preview-actions">
                  <span><FaCheckCircle /> Image ready</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>Change photo</button>
                </div>
              </>
            ) : (
              <div className="aroha-visual-upload-prompt">
                <span className="aroha-visual-upload-icon"><FaCloudUploadAlt /></span>
                <strong>Drop your product photo here</strong>
                <span>or choose an image from your device</span>
                <span className="aroha-visual-file-hint"><FaCamera /> JPG, PNG or WebP · up to 5 MB</span>
              </div>
            )}
          </div>

          {error && <div className="aroha-visual-error" role="alert">{error}</div>}
          <button className="aroha-visual-search-btn" onClick={searchImage} disabled={status === "loading"}>
            {status === "loading" ? <><span className="aroha-visual-spinner" /> Analyzing image and matching products…</> : <><FaSearch /> Find similar products <FaArrowRight /></>}
          </button>
          {status === "loading" && <p className="aroha-visual-loading-note">Checking product details and availability in the Aroha catalog.</p>}

          {status === "done" && (
            <div className="aroha-visual-results">
              <div className="aroha-visual-results-heading">
                <div><p className="aroha-visual-eyebrow">VISUAL MATCHES</p><h3>{results.length ? `${results.length} products found` : "No close matches yet"}</h3></div>
                <button className="aroha-visual-reset" onClick={() => { setFile(null); setPreview(""); setResults([]); setDescription(""); setStatus("idle"); setError(""); if (inputRef.current) inputRef.current.value = ""; }}><FaRedoAlt /> New search</button>
              </div>
              {description && <p className="aroha-visual-description">{description}</p>}
              {results.length ? (
                <div className="aroha-visual-product-grid">
                  {results.map((product, index) => {
                    const image = Array.isArray(product.images) ? product.images[0] : "";
                    return <button className="aroha-visual-product" key={product._id} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }} onClick={() => onSelectProduct(product)}>
                      <span className="aroha-visual-product-image">{image ? <img src={getImageUrl(image)} alt={product.name} loading="lazy" /> : <FaBoxOpen />}</span>
                      <span className="aroha-visual-product-info"><strong>{product.name}</strong><span className="aroha-visual-product-meta">{product.brand || product.category || "Aroha collection"}</span><span className="aroha-visual-product-price">{formatPrice(product.finalPrice ?? product.price)}</span>{product.stock > 0 && <span className="aroha-visual-stock">In stock</span>}</span>
                      <FaArrowRight className="aroha-visual-product-arrow" />
                    </button>;
                  })}
                </div>
              ) : <div className="aroha-visual-empty"><FaBoxOpen /><strong>No close matches found</strong><span>Try a clearer photo with the product centered and good lighting.</span></div>}
            </div>
          )}
        </div>
        <footer className="aroha-visual-footer">Results are matched against products listed in Aroha Hub.</footer>
      </section>
    </div>
  );
}
