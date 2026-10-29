import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaCamera, FaCloudUploadAlt, FaTimes, FaSearch, FaMagic, FaArrowRight, FaRedoAlt, FaBoxOpen, FaCheckCircle } from "react-icons/fa";

let visionModelPromise = null;
const loadScript = (src, marker) => new Promise((resolve, reject) => {
  if (window[marker]) return resolve();
  const existing = document.querySelector(`script[data-aroha-vision="${marker}"]`);
  if (existing) {
    existing.addEventListener("load", resolve, { once: true });
    existing.addEventListener("error", reject, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.dataset.arohaVision = marker;
  script.onload = resolve;
  script.onerror = () => reject(new Error("Could not load the free vision model. Check your internet connection and try again."));
  document.head.appendChild(script);
});

const getFreeVisionModel = async () => {
  if (!visionModelPromise) {
    visionModelPromise = (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js", "tf");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js", "mobilenet");
      await window.tf.ready();
      return window.mobilenet.load({ version: 2, alpha: 0.5 });
    })().catch((error) => { visionModelPromise = null; throw error; });
  }
  return visionModelPromise;
};

const loadImageElement = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  if (/^https?:/i.test(src)) image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Could not load a catalog image."));
  image.src = src;
});

const getImageEmbedding = async (model, image) => {
  const tensor = model.infer(image, true);
  try {
    const vector = Array.from(await tensor.data());
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / magnitude);
  } finally {
    tensor.dispose();
  }
};

const cosineSimilarity = (left, right) => {
  if (!left || !right || left.length !== right.length) return 0;
  let score = 0;
  for (let index = 0; index < left.length; index += 1) score += left[index] * right[index];
  return score;
};

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
  const [progress, setProgress] = useState(0);
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
    if (!file) { inputRef.current?.click(); return; }
    setStatus("loading"); setError(""); setProgress(0);
    const startedAt = performance.now();
    try {
      // Open-source MobileNet runs in the visitor browser; the uploaded photo is not sent to a paid AI API.
      const model = await getFreeVisionModel();
      setProgress(8);
      const queryImage = await loadImageElement(preview);
      const queryEmbedding = await getImageEmbedding(model, queryImage);
      const catalogResponse = await axios.get(API + "/products", { timeout: 30000 });
      const catalog = (Array.isArray(catalogResponse.data) ? catalogResponse.data : [])
        .filter((product) => product && product.isActive !== false && Number(product.stock) > 0 && Array.isArray(product.images) && product.images.length > 0)
        .slice(0, 40);
      if (!catalog.length) {
        setResults([]); setDescription("There are no in-stock catalog products with images to compare yet."); setStatus("done"); return;
      }
      const ranked = []; let processed = 0;
      for (const product of catalog) {
        const imageValue = product.images[0];
        if (!imageValue) continue;
        try {
          const image = await loadImageElement(getImageUrl(imageValue));
          const embedding = await getImageEmbedding(model, image);
          const similarity = cosineSimilarity(queryEmbedding, embedding);
          ranked.push({ ...product, matchScore: Math.max(0, Math.min(100, Math.round(similarity * 100))) });
        } catch (imageError) {
          console.warn("[Aroha free visual search] skipped unreadable catalog image", { productId: String(product._id || ""), reason: String(imageError.message || "image unavailable").slice(0, 100) });
        }
        processed += 1;
        setProgress(8 + Math.round((processed / catalog.length) * 90));
      }
      ranked.sort((a, b) => b.matchScore - a.matchScore);
      setResults(ranked.filter((product) => product.matchScore > 0).slice(0, 12));
      setDescription("Compared your photo with " + processed + " in-stock catalog images using the free, open-source MobileNet model in your browser.");
      setStatus("done");
      console.info("[Aroha free visual search] completed", { catalogSize: catalog.length, resultCount: ranked.length, durationMs: Math.round(performance.now() - startedAt), model: "MobileNetV2 browser inference" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Free visual search is temporarily unavailable. Please try again.";
      setError(message); setStatus("error");
      console.error("[Aroha free visual search] failed", { status: err.response?.status || "browser-model", durationMs: Math.round(performance.now() - startedAt), message: String(message).slice(0, 180) });
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
          {status === "loading" && <p className="aroha-visual-loading-note">Loading the free vision model and comparing catalog photos… {progress}%</p>}

          {status === "done" && (
            <div className="aroha-visual-results">
              <div className="aroha-visual-results-heading">
                <div><p className="aroha-visual-eyebrow">VISUAL MATCHES</p><h3>{results.length ? `${results.length} products found` : "No close matches yet"}</h3></div>
                <button className="aroha-visual-reset" onClick={() => { setFile(null); setPreview(""); setResults([]); setDescription(""); setStatus("idle"); setError(""); setProgress(0); if (inputRef.current) inputRef.current.value = ""; }}><FaRedoAlt /> New search</button>
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
