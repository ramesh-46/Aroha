import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

// --- Main App ---
const Homepage = () => {
  return (
    <div style={styles.app}>
      <Header />
      <Hero />
      <Main />
      <Footer />
    </div>
  );
};

// --- Popup Modal ---
const PopupModal = ({ label, onClose }) => {
  const productData = {
    Men: {
      Shirts: [
        "https://images.unsplash.com/photo-1684549742130-c2083354da35?q=80&w=739&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1624295964179-ead4807b22ca?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1566195890590-46caf800d75a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Pants: [
        "https://images.unsplash.com/photo-1611619826841-927d9ad0eceb?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1666899462970-40dfe2ef3a70?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1035&auto=format&fit=crop",
      ],
      "T-Shirts": [
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1035&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1035&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1602810319428-019690571b5b?q=80&w=1035&auto=format&fit=crop",
      ],
      Innerwear: [
        "https://images.unsplash.com/photo-1656587132121-aaccc57589cf?q=80&w=1112&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    Women: {
      Sarees: [
        "https://images.unsplash.com/photo-1705164456205-69d775ce1482?q=80&w=741&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1705164454907-a04fe248f675?q=80&w=792&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Western: [
        "https://images.unsplash.com/photo-1622586192289-b396e1ea3bde?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1632812452083-72d3c8abe533?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Jeans: [
        "https://images.unsplash.com/photo-1590902939083-c7f7d6a6d990?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1742980511651-b845fa826f33?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Lehenga: [
        "https://images.unsplash.com/photo-1732508531942-f36d9da79d9e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1610047614301-13c63f00c032?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Tops: [
        "https://images.unsplash.com/photo-1496070527953-98faef8b036f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1658435323421-c8397182ef10?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    Children: {
      "T-Shirts": [
        "https://images.unsplash.com/photo-1689093197152-dbdfd8c353c8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Pants: [
        "https://plus.unsplash.com/premium_photo-1701204056522-0999ece8145e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Dresses: [
        "https://images.unsplash.com/photo-1585483947202-d72b328f5e0c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Shorts: [
        "https://images.unsplash.com/photo-1726303827945-9c6e9c3a1a63?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1657412235023-c7c492501ce2?q=80&w=687&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1515408320118-b85c3d473d8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      ],
    },
    Jewelry: {
      Rings: [
        "https://images.unsplash.com/photo-1642575904226-e43265872da4?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Necklaces: [
        "https://images.unsplash.com/photo-1620441090373-f6977a23fa0b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://plus.unsplash.com/premium_photo-1757960107520-b0a8736c06fa?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Earrings: [
        "https://images.unsplash.com/photo-1653227907864-560dce4c252d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Bracelets: [
        "https://images.unsplash.com/photo-1626784214765-754de4c5a77b?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1632801981184-4dce451c7ca6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dhttps://images.unsplash.com/photo-1586495777744-4432e7858464?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      ],
    },
    Accessories: {
      Purses: [
        "https://images.unsplash.com/photo-1689903777276-141133d42760?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1689903777384-31fd780bef3c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Belts: [
        "https://plus.unsplash.com/premium_photo-1726769202190-ad2a3f2f360b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1664285612706-b32633c95820?q=80&w=958&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Perfumes: [
        "https://images.unsplash.com/photo-1595389294696-ae969ff71d90?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1577962272294-564f38f71d90?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1594035910663-369b72b7abe2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      Sunglasses: [
        "https://images.unsplash.com/photo-1639762485055-1565f145bf2d?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1734449406372-2a829c1e2d8a?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1732139637065-1088495050db?q=80&w=730&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <h2 style={styles.modalTitle}>{label}</h2>
        <div style={styles.productTypesContainer}>
          {Object.entries(productData[label] || {}).map(([type, images], index) => (
            <ProductCarousel key={index} type={type} images={images} />
          ))}
        </div>
     <button
  style={styles.startShoppingButton}
  onClick={() => {
    window.location.href = "/login";
  }}
>
  Start Shopping
</button>

      </div>
    </div>
  );
};

// --- Product Carousel (for each product type in popup) ---
const ProductCarousel = ({ type, images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);
  return (
    <div style={styles.productCarousel}>
      <h3 style={styles.productTypeTitle}>{type}</h3>
      <div style={styles.carouselImageContainer}>
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${type} ${index + 1}`}
            style={{
              ...styles.carouselImage,
              opacity: index === currentImageIndex ? 1 : 0,
              transition: "opacity 0.5s ease-in-out",
            }}
            loading="lazy"
          />
        ))}
      </div>
      {/* <button style={styles.shopNowButton}>Shop Now</button> */}
    </div>
  );
};

// --- Main with Category Carousels ---
const Main = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = [
    {
      label: "Men",
      note: "Starting from ₹199",
      images: [
        "https://images.unsplash.com/photo-1508243771214-6e95d137426b?q=80&w=687&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1026&auto=format&fit=crop",
      ],
    },
    {
      label: "Women",
      note: "Starting from ₹199",
      images: [
        "https://images.unsplash.com/photo-1511130558090-00af810c21b1?q=80&w=689&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1717342586432-3fb4c5bd39c1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    {
      label: "Children",
      note: "Starting from ₹199",
      images: [
        "https://images.unsplash.com/photo-1666985229819-8bd7d5f13ecb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1583339127421-755823840f07?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    {
      label: "Jewelry",
      note: "Starting from ₹199",
      images: [
        "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1137&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1722410180687-b05b50922362?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    {
      label: "Accessories",
      note: "Starting from ₹199",
      images: [
        "https://plus.unsplash.com/premium_photo-1755901268367-ba428c5031bc?q=80&w=1239&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1656166229928-b5fbb452fc94?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
  ];
  return (
    <main style={styles.main}>
      <section>
        <div style={styles.introText}>
          <p>
            AROHA sources premium Indian-inspired clothing directly from manufacturers and lists on leading marketplaces. We serve retailers and online shoppers through partner platforms.
          </p>
        </div>
      </section>
      <section id="categories">
        <h2 style={styles.sectionTitle}>Collections</h2>
        <div style={styles.categories}>
          {categories.map((category, index) => (
            <div key={index} onClick={() => setSelectedCategory(category.label)}>
              <CategoryCard label={category.label} note={category.note} images={category.images} />
            </div>
          ))}
        </div>
      </section>
      {selectedCategory && (
        <PopupModal
          label={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
      <section id="marketplaces" style={styles.marketplaces}>
        <h2 style={styles.sectionTitle}>Available On</h2>
        <p>Find our collections on these marketplaces.</p>
        <div style={styles.marketplaceBadges}>
          {["Meesho", "Flipkart", "Amazon", "Ajio"].map((platform, index) => (
            <span key={index} style={styles.badge}>{platform}</span>
          ))}
        </div>
      </section>
    </main>
  );
};

// --- Category Card with Carousel ---
const CategoryCard = ({ label, note, images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);
  return (
    <div
      style={{
        ...styles.categoryCard,
        transform: "translateY(0)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        ":hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
        },
      }}
      tabIndex="0"
    >
      <div style={styles.categoryImageContainer}>
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${label} ${index + 1}`}
            style={{
              ...styles.categoryImage,
              opacity: index === currentImageIndex ? 1 : 0,
              transition: "opacity 0.5s ease-in-out",
            }}
            loading="lazy"
          />
        ))}
      </div>
      <div style={styles.categoryLabel}>{label}</div>
      <div style={styles.categoryNote}>{note}</div>
    </div>
  );
};

// --- Header ---
const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Categories", href: "#categories" },
    { name: "Marketplaces", href: "#marketplaces" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.logoContainer}>
          <img
            src="https://i.postimg.cc/MZsBK9X0/Screenshot-2025-09-27-201020.png"
            alt="AROHA Logo"
            style={styles.logoImg}
            loading="lazy"
          />
          <span style={styles.brandName}>AROHA HUB</span>
        </div>
        <div style={styles.contactInfo}>
          <a href="mailto:arohahubinfo@proton.me" style={styles.contactLink}>
            arohahubinfo@proton.me
          </a>
          <a
            href="https://wa.me/918019802281?text=I%20visited%20AROHA%20website%20-%20I%20want%20help%20with%20orders%20and%20catalog."
            target="_blank"
            rel="noopener"
            style={styles.contactLink}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
              alt="WhatsApp"
              style={styles.whatsappIcon}
            />
            WhatsApp
          </a>
          {/* Login Button */}
          <button
            style={styles.loginButton}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
        {/* Mobile Menu Button */}
        <button
          style={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
        {/* Desktop Nav */}
        <nav style={styles.desktopNav}>
          <ul style={styles.navUl}>
            {navItems.map((item, index) => (
              <li key={index}>
                <a href={item.href} style={styles.navA}>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div style={styles.mobileMenuOverlay}>
          <div style={styles.mobileMenuContent}>
            <button
              style={styles.mobileMenuCloseButton}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ×
            </button>
            <ul style={styles.mobileNavUl}>
              {navItems.map((item, index) => (
                <li key={index} style={styles.mobileNavLi}>
                  <a
                    href={item.href}
                    style={styles.mobileNavA}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

// --- Hero with Carousel ---
const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroImages = [
    "https://i.postimg.cc/m22Yh2zx/pexels-vikashkr50-27155549.jpg",
    "https://images.unsplash.com/photo-1580657018950-c7f7d6a6d990?q=80&w=1170&auto=format&fit=crop",
    "https://plus.unsplash.com/premium_photo-1664533227566-94bde440039f?q=80&w=1170&auto=format&fit=crop",
    "https://plus.unsplash.com/premium_photo-1661611277583-139a0653b166?q=80&w=1170&auto=format&fit=crop",
    "https://i.postimg.cc/WbHk3mcY/young-woman-beautiful-dress-hat.jpg",
    "https://i.postimg.cc/jdf4pq1k/ca9a01d1-e52c-40ca-8824-b289ee4d48bf.jpg",
    "https://plus.unsplash.com/premium_photo-1664202525979-80d1da46b34b?q=80&w=1171&auto=format&fit=crop",
    "https://i.postimg.cc/L5KnLSVJ/a9051df4-e428-4a05-9194-e782185c591c.jpg",
    "https://images.unsplash.com/photo-1541495532687-d41ee8904943?q=80&w=991&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1510734790177-c931e3956547?q=80&w=1173&auto=format&fit=crop",
    "https://i.pinimg.com/736x/ff/c8/cb/ffc8cb48cf587c7a05529fd65f74ad3a.jpg",
    "https://images.unsplash.com/photo-1659167664742-a592e00f5a29?q=80&w=1334&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1662376992924-da68f73ff112?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroImages.length]);
  return (
    <div style={styles.hero} id="home">
      {heroImages.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Hero ${index + 1}`}
          style={{
            ...styles.heroImg,
            opacity: index === currentImageIndex ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
          loading="lazy"
        />
      ))}
      <div style={styles.heroContent}>
        <h1 style={styles.heroH1}>AROHA — Modern • Traditional • Premium</h1>
        <p style={styles.heroP}>Wholesale • Manufacturer • Marketplace Sellers</p>
        <div style={styles.marketplaceBadges}>
          {["Meesho", "Flipkart", "Amazon", "Ajio"].map((platform, index) => (
            <span key={index} style={styles.badge}>{platform}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Footer ---
const Footer = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '*****') {
      navigate('/AddProduct');
    } else {
      alert('Incorrect password');
    }
  };

  const extraLinks = [
    { name: "Help", href: "#help" },
    { name: "Donation", href: "#donation" },
    { name: "Notice", href: "#notice" },
    { name: "About", href: "#about" },
    { name: "Seller Login", href: "#", onClick: (e) => { e.preventDefault(); setShowPopup(true); } },
  ];

  return (
    <footer id="contact" style={styles.footer}>
      <div style={styles.footerGrid}>
        <div style={styles.footerAddress}>
          <div style={styles.logoContainer}>
            <img
              src="https://i.postimg.cc/MZsBK9X0/Screenshot-2025-09-27-201020.png"
              alt="AROHA Logo"
              style={styles.logoImg}
              loading="lazy"
            />
            <span style={styles.brandName}>AROHA</span>
          </div>
          <p>Hyderabad, Telangana 500016</p>
          <p>arohahubinfo@proton.me</p>
          <p>+91 8019802281</p>
        </div>
        <div style={styles.footerMap}>
          <iframe
            title="AROHA Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.207747912984!2d78.4866713148218!3d17.4410447880397!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93c79f7a13f3%3A0x6f45c03d3a1b0f0!2sHyderabad%2C%20Telangana%20500016!5e0!3m2!1sen!2sin!4v1630000000000!5m2!1sen!2sin"
            width="100%"
            height="200"
            style={{ border: 0, borderRadius: "8px" }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </div>
      <div style={styles.footerExtraLinks}>
        {extraLinks.map((item, index) => (
          <a
            key={index}
            href={item.href}
            style={styles.extraLink}
            onClick={item.onClick}
          >
            {item.name}
          </a>
        ))}
      </div>
      <div style={styles.copyright}>
        <p>© 2025 AROHA HUB. All images credited to Unsplash / Pexels.</p>
      </div>

      {/* Popup JSX */}
      {showPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', textAlign: 'center' }}>
            <h3>Seller Admin Login</h3>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ background: '#000000ff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};

// --- Styles ---
const styles = {
  app: {
    fontFamily: "'Inter', system-ui, sans-serif",
    lineHeight: 1.6,
    overflowX: "hidden",
    color: "#000",
    backgroundColor: "#fff",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(0, 0, 0, 0.04)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    padding: "1rem 2rem",
  },
  headerInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoImg: {
    height: "50px",
    objectFit: "contain",
  },
  brandName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
    fontWeight: 400,
    color: "#2c3e50",
    letterSpacing: "0.05em",
  },
  loginButton: {
    backgroundColor: "black",
    color: "white",
    border: "none",
    padding: "8px 16px",
    marginLeft: "10px",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold",
  },
  contactInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.875rem",
  },
  whatsappIcon: {
    width: "25px",
    height: "25px",
   
  },
  contactLink: {
    color: "inherit",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },
  navUl: {
    display: "flex",
    listStyle: "none",
    gap: "1.5rem",
    margin: 0,
    padding: 0,
  },
  navA: {
    fontWeight: 500,
    fontSize: "0.95rem",
    color: "inherit",
    textDecoration: "none",
    position: "relative",
  },
  hero: {
    position: "relative",
    height: "80vh",
    minHeight: "600px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: "4rem",
  },
  heroImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    padding: "0 1.5rem",
    maxWidth: "900px",
    color: "#fff",
  },
  heroH1: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(2.25rem, 6vw, 4rem)",
    fontWeight: 400,
    marginBottom: "1rem",
    letterSpacing: "0.05em",
  },
  heroP: {
    fontSize: "clamp(1rem, 3vw, 1.25rem)",
    fontWeight: 300,
    marginBottom: "1.5rem",
    color: "#fff",
  },
  marketplaceBadges: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  badge: {
    border: "1px solid #000",
    padding: "0.35rem 0.85rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  main: {
    padding: "0 2rem 4rem",
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
    textAlign: "center",
    marginBottom: "2rem",
  },
  introText: {
    maxWidth: "700px",
    margin: "0 auto",
    textAlign: "center",
    fontSize: "clamp(1rem, 3vw, 1.125rem)",
    fontWeight: 300,
    lineHeight: 1.7,
  },
  categories: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2rem",
  },
  categoryCard: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    aspectRatio: "3/4",
    cursor: "pointer",
    transform: "translateZ(0)",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    background: "#f5f5f5",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: "1rem",
    textAlign: "center",
  },
  categoryImageContainer: {
    width: "100%",
    height: "200px",
    overflow: "hidden",
    position: "relative",
    marginBottom: "1rem",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    position: "absolute",
    top: 0,
    left: 0,
  },
  categoryLabel: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  categoryNote: {
    fontSize: "0.875rem",
    fontWeight: 300,
  },
  marketplaces: {
    textAlign: "center",
  },
  footer: {
    background: "rgba(0, 0, 0, 0.04)",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
    padding: "2.5rem 2rem 1.5rem",
  },
  footerGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "2rem",
    marginBottom: "1.5rem",
  },
  footerAddress: {
    flex: 1,
    minWidth: "250px",
  },
  footerMap: {
    flex: 1,
    minWidth: "300px",
  },
  footerExtraLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  extraLink: {
    color: "inherit",
    textDecoration: "none",
    fontSize: "0.875rem",
  },
  copyright: {
    textAlign: "center",
    fontSize: "0.875rem",
    opacity: 0.7,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    maxWidth: "900px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#000",
  },
  modalTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  productTypesContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  productCarousel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  productTypeTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    textAlign: "center",
  },
  carouselImageContainer: {
    width: "100%",
    height: "150px",
    overflow: "hidden",
    position: "relative",
    borderRadius: "8px",
    border: "1px solid rgba(0, 0, 0, 0.12)",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    position: "absolute",
    top: 0,
    left: 0,
  },
  shopNowButton: {
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "background-color 0.3s ease",
    ":hover": {
      backgroundColor: "#333",
    },
  },
  startShoppingButton: {
    display: "block",
    margin: "2rem auto 0",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "0.75rem 2rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    transition: "background-color 0.3s ease",
    ":hover": {
      backgroundColor: "#333",
    },
  },
  // Mobile Menu Styles
  mobileMenuButton: {
    display: "none",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#000",
    padding: "0.5rem",
  },
  mobileMenuOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 999,
  },
  mobileMenuContent: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    margin: "1rem",
    maxWidth: "300px",
    position: "relative",
  },
  mobileMenuCloseButton: {
    position: "absolute",
    top: "0.5rem",
    right: "0.5rem",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  mobileNavUl: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  mobileNavLi: {
    marginBottom: "0.75rem",
  },
  mobileNavA: {
    color: "inherit",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: 500,
  },
  desktopNav: {
    display: "block",
  },
  // Responsive Styles
  "@media (max-width: 768px)": {
    mobileMenuButton: {
      display: "block",
    },
    desktopNav: {
      display: "none",
    },
  },
};

export default Homepage;
