import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getProducts } from '../api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuthPrompt } from '../context/AuthContext';
import { formatCurrency, calculateDiscount } from '../utils';
import { ProductCard, StarRating } from '../components/common/ProductCard';
import {
  IconHeart,
} from '../components/common/Icons';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { requireAuth } = useAuthPrompt();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await getProductById(id);
        if (!isMounted) return;

        setProduct(item);
        const initialColor = item.colors && item.colors.length > 0 ? item.colors[0] : '';
        const initialColorImage = initialColor ? (item.colorImages?.[initialColor] || Object.entries(item.colorImages || {}).find(([key]) => key.toLowerCase() === initialColor.toLowerCase())?.[1]) : '';
        setActiveImage(initialColorImage || item.gallery?.[0] || item.image || '');
        setQuantity(1);
        setSelectedColor(initialColor);
        setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : '');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Fetch related products
        try {
          const all = await getProducts();
          if (isMounted) {
            const related = all
              .filter((p) => String(p.id) !== String(item.id))
              .slice(0, 4);
            setRelatedProducts(related);
          }
        } catch {
          // related products can silently fail
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Product not found');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {error || "The product you're looking for doesn't exist or is currently unavailable."}
        </p>
        <Link to="/shop" className="btn btn-primary">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const discountPercent = calculateDiscount(product.originalPrice, product.price);
  const galleryImages = [...new Set([...(product.gallery || []), product.image, activeImage].filter(Boolean))];
  const activeImageIndex = Math.max(0, galleryImages.indexOf(activeImage));
  const showGalleryImage = (index) => {
    if (!galleryImages.length) return;
    const nextIndex = (index + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[nextIndex]);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, { selectedColor, selectedSize });
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, { selectedColor, selectedSize });
    if (requireAuth('/checkout', 'Please sign in to your Sales Savvy account to continue with Buy Now.')) {
      navigate('/checkout');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast('Product link copied to clipboard!', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="product-detail-page container" style={{ paddingBottom: '70px' }}>
      {/* Breadcrumbs matching wireframe */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <Link to="/shop">Shop</Link>
        <span className="separator">&gt;</span>
        <Link to={`/shop?category=${product.categoryId}`}>{product.category}</Link>
        <span className="separator">&gt;</span>
        <span className="current">{product.name}</span>
      </nav>

      {/* Main Product Layout: Gallery + Info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
          gap: '38px',
          alignItems: 'start',
          marginBottom: '56px',
        }}
        className="product-detail-grid"
      >
        {/* Left Column: Image Gallery matching wireframe */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
          }}
          className="product-gallery-container"
        >
          {/* Thumbnails vertical rail */}
          {galleryImages.length > 1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '92px',
                flexShrink: 0,
              }}
              className="gallery-thumbnails"
            >
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(imgUrl)}
                  aria-label={`View photo ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '90px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border:
                      activeImage === imgUrl
                        ? '2px solid var(--color-brand-primary)'
                        : '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '4px',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Showcase Image */}
          <div
            className="card product-main-image-card"
            style={{
              flex: '1 1 0%',
              minWidth: 0,
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
              aspectRatio: '1 / 1',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={activeImage || product.image || undefined}
              alt={product.name}
              loading="eager"
              onError={(e) => { const img = e.currentTarget; if (img.dataset.fallbackApplied) { img.style.display = 'none'; const fallback = img.nextElementSibling; if (fallback) fallback.style.display = 'flex'; return; } img.dataset.fallbackApplied = 'true'; img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" fill="#f1f5f9"/><g fill="none" stroke="#94a3b8" stroke-width="10" stroke-linejoin="round"><path d="M180 170l70-35 70 35 45 55-45 30-25-28v140H205V227l-25 28-45-30z"/></g><text x="250" y="420" text-anchor="middle" font-family="Arial" font-size="22" fill="#64748b">Product image</text></svg>'); }}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                margin: 'auto',
                transition: 'transform var(--transition-smooth)',
              }}
            />
            <div aria-hidden="true" style={{ display: activeImage || product.image ? 'none' : 'flex', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)' }}>No product image URL returned by the backend. Add an image URL to this product in MySQL.</div>

            {galleryImages.length > 1 && (
              <>
                <button type="button" aria-label="Previous product image" onClick={() => showGalleryImage(activeImageIndex - 1)} className="product-gallery-arrow product-gallery-arrow-left">‹</button>
                <button type="button" aria-label="Next product image" onClick={() => showGalleryImage(activeImageIndex + 1)} className="product-gallery-arrow product-gallery-arrow-right">›</button>
                <div className="product-gallery-dots" aria-label="Product image position">
                  {galleryImages.slice(0, 6).map((img, index) => (
                    <button key={`${img}-${index}`} type="button" aria-label={`Show image ${index + 1}`} onClick={() => setActiveImage(img)} className={activeImage === img ? 'active' : ''} />
                  ))}
                </div>
              </>
            )}

            {/* Discount Badge on Hero Image */}
            {discountPercent >= 15 && (
              <span
                className="badge badge-discount"
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  padding: '4px 10px',
                  fontSize: '0.85rem',
                }}
              >
                Save {discountPercent}%
              </span>
            )}


          </div>
        </div>

        {/* Right Column: Product Purchasing Info matching wireframe */}
        <div className="product-purchase-info" style={{ '--reveal-delay': '100ms' }}>
          {/* Brand & Category tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--color-brand-primary)',
              }}
            >
              {product.brand || 'Sales Savvy'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              SKU: SS-{product.id}
            </span>
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '14px',
            }}
          >
            {product.name}
          </h1>

          {/* Rating & Reviews row matching wireframe */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <StarRating rating={product.rating} size={16} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{product.rating}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ({product.reviewsCount} reviews)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: product.inStock ? '#16a34a' : '#ef4444',
              }}
            >
              {product.inStock ? `In Stock (${product.stockCount} available)` : 'Out of Stock'}
            </span>
          </div>

          {/* Price Header matching wireframe */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              {formatCurrency(product.price)}
            </span>

            {product.originalPrice > product.price && (
              <>
                <span
                  style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'line-through',
                  }}
                >
                  {formatCurrency(product.originalPrice)}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#16a34a',
                  }}
                >
                  Save {formatCurrency(product.originalPrice - product.price)} ({discountPercent}% off)
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: '24px',
            }}
          >
            {product.description}
          </p>

          {/* Color Selection if available */}
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Color: <span style={{ color: 'var(--text-secondary)' }}>{selectedColor}</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      const colorImage = product.colorImages?.[color] || Object.entries(product.colorImages || {}).find(([key]) => key.toLowerCase() === color.toLowerCase())?.[1];
                      if (colorImage) setActiveImage(colorImage);
                      else if (product.gallery?.length > 1) {
                        const colorIndex = product.colors.indexOf(color);
                        setActiveImage(product.gallery[colorIndex % product.gallery.length]);
                      } else setActiveImage(product.image || '');
                    }}
                    style={{
                      padding: product.colorImages?.[color] ? '8px 10px' : '6px 14px',
                      minWidth: product.colorImages?.[color] ? '76px' : undefined,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: selectedColor === color ? 700 : 500,
                      backgroundColor:
                        selectedColor === color ? 'var(--color-brand-primary)' : 'var(--bg-card)',
                      color:
                        selectedColor === color ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                      border:
                        selectedColor === color
                          ? '1px solid var(--color-brand-primary)'
                          : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {product.colorImages?.[color] && (
                      <img src={product.colorImages[color]} alt={`${color} ${product.name}`} style={{ width: '44px', height: '44px', objectFit: 'contain', display: 'block', margin: '0 auto 5px', borderRadius: '4px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>{!product.colorImages?.[color] && <span aria-hidden="true" style={{ width: '13px', height: '13px', borderRadius: '50%', display: 'inline-block', background: ({ black: '#171717', white: '#ffffff', blue: '#2563eb', red: '#dc2626', green: '#16a34a', yellow: '#eab308', pink: '#ec4899', grey: '#9ca3af', gray: '#9ca3af', brown: '#92400e', purple: '#9333ea', orange: '#f97316' })[color.toLowerCase()] || '#cbd5e1', border: '1px solid #cbd5e1' }} />} {color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection if available */}
          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Size: <span style={{ color: 'var(--text-secondary)' }}>{selectedSize}</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: '40px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: selectedSize === size ? 700 : 500,
                      backgroundColor:
                        selectedSize === size ? 'var(--color-brand-primary)' : 'var(--bg-card)',
                      color:
                        selectedSize === size ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                      border:
                        selectedSize === size
                          ? '1px solid var(--color-brand-primary)'
                          : '1px solid var(--border-light)',
                      cursor: 'pointer',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Buttons matching wireframe */}
          <div
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '28px',
            }}
          >
            {/* Quantity Stepper */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                height: '46px',
              }}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                style={{
                  width: '40px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                -
              </button>
              <span
                style={{
                  width: '36px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stockCount || 99, q + 1))}
                aria-label="Increase quantity"
                style={{
                  width: '40px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="btn btn-primary"
              style={{ flex: 1, height: '46px', whiteSpace: 'nowrap' }}
            >
              Add to Cart
            </button>

            {/* Buy Now Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="btn btn-secondary"
              style={{ flex: 1, height: '46px', whiteSpace: 'nowrap' }}
            >
              Buy Now
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: isFavorited ? 'var(--badge-sale-bg)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <IconHeart size={20} filled={isFavorited} />
            </button>
          </div>

          {/* Guarantee Badges mini row */}

        </div>
      </div>

      {/* Specifications & "You may also like" 2-column section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 1fr)',
          gap: '48px',
          alignItems: 'start',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '36px',
        }}
        className="product-bottom-grid"
      >
        {/* Left Column: Specifications */}
        <div className="product-detail-section">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
            Specifications
          </h2>
          {product.specifications ? (
            <div
              className="card"
              style={{
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody>
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <tr
                      key={key}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 18px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          width: '38%',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {key}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
              Standard retail specifications apply.
            </div>
          )}
        </div>

        {/* Right Column: "You may also like" */}
        <div className="product-detail-section">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
            You may also like
          </h2>
          {relatedProducts.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
              }}
              className="related-products-grid"
            >
              {relatedProducts.slice(0, 2).map((relProduct, idx) => (
                <div
                  key={relProduct.id}
                  className="reveal-on-scroll reveal-scale-up"
                  style={{
                    '--reveal-delay': `${idx * 100}ms`,
                    height: '100%',
                  }}
                >
                  <ProductCard product={relProduct} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No related products to recommend at this time.
            </div>
          )}
        </div>
      </div>

      {/* Responsive adjustments */}
      <style>{`
        .product-gallery-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 42px; height: 42px; border: 0; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.94); color: #075b9f;
          box-shadow: 0 2px 12px rgba(15,23,42,.12); cursor: pointer;
          font-size: 30px; line-height: 1; z-index: 2;
        }
        .product-gallery-arrow-left { left: 16px; }
        .product-gallery-arrow-right { right: 16px; }
        .product-gallery-dots {
          position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 7px; align-items: center; z-index: 2;
        }
        .product-gallery-dots button {
          width: 10px; height: 10px; border: 0; border-radius: 50%;
          background: #d1d5db; padding: 0; cursor: pointer;
        }
        .product-gallery-dots button.active { background: var(--color-brand-primary); }
        .product-main-image-card > img { object-fit: contain; }
        .product-purchase-info { min-width: 0; }
        @media (max-width: 840px) {
          .product-main-image-card { min-height: 0 !important; }
          .product-gallery-container { gap: 12px !important; }
          .gallery-thumbnails { flex-direction: row !important; width: 100% !important; overflow-x: auto; }
          .gallery-thumbnails button { min-width: 76px; height: 76px !important; }
          .product-gallery-container { flex-direction: column-reverse !important; }
        }
        @media (max-width: 840px) {
          .product-detail-grid,
          .product-bottom-grid {
            grid-template-columns: 1fr !important;
          }
          .gallery-thumbnails {
            flex-direction: row !important;
            width: 100% !important;
            overflow-x: auto;
          }
          .product-gallery-container {
            flex-direction: column-reverse !important;
          }
        }
        @media (max-width: 540px) {
          .related-products-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;
