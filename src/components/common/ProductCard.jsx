import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatCurrency, calculateDiscount } from '../../utils';
import { IconHeart, IconStar } from './Icons';

export const StarRating = ({ rating = 0, reviewsCount, showCount = true, size = 13 }) => {
  const rounded = Math.round(rating * 10) / 10;

  return (
    <div className="star-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconStar key={star} size={size} filled={star <= Math.round(rating)} />
        ))}
      </div>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: '2px' }}>
        {rounded.toFixed(1)}
      </span>
      {showCount && reviewsCount !== undefined && (
        <span style={{ color: 'var(--text-muted)' }}>
          ({reviewsCount})
        </span>
      )}
    </div>
  );
};

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const discountPercent = calculateDiscount(product.originalPrice, product.price);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      className="product-card card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      {/* Product Image Area */}
      <Link
        to={`/product/${product.id}`}
        style={{
          display: 'block',
          position: 'relative',
          paddingTop: '90%',
          backgroundColor: 'var(--bg-secondary)',
          overflow: 'hidden',
        }}
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '16px',
            transition: 'transform var(--transition-smooth)',
          }}
          onError={(e) => { const img = e.currentTarget; if (img.dataset.fallbackApplied) { img.style.display = 'none'; const fallback = img.nextElementSibling; if (fallback) fallback.style.display = 'flex'; return; } img.dataset.fallbackApplied = 'true'; img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" fill="#f1f5f9"/><g fill="none" stroke="#94a3b8" stroke-width="10" stroke-linejoin="round"><path d="M180 170l70-35 70 35 45 55-45 30-25-28v140H205V227l-25 28-45-30z"/></g><text x="250" y="420" text-anchor="middle" font-family="Arial" font-size="22" fill="#64748b">Product image</text></svg>'); }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />
        <div aria-hidden="true" style={{ display: product.image ? 'none' : 'flex', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Image unavailable</div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            color: isFavorited ? 'var(--badge-sale-bg)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)',
            transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
            zIndex: 2,
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        >
          <IconHeart size={16} filled={isFavorited} />
        </button>

        {/* Optional Discount Tag if discount >= 15% */}
        {discountPercent >= 15 && (
          <span
            className="badge badge-discount"
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 2,
            }}
          >
            {discountPercent}% OFF
          </span>
        )}
      </Link>

      {/* Card Body */}
      <div
        style={{
          padding: '14px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div>
          {/* Category Tag */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {product.category}
          </span>

          {/* Product Title */}
          <h3
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              marginTop: '4px',
              marginBottom: '6px',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
            }}
          >
            <Link
              to={`/product/${product.id}`}
              style={{ color: 'var(--text-heading)' }}
            >
              {product.name}
            </Link>
          </h3>

          {/* Price & Original Price */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                }}
              >
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span
                className="badge badge-discount"
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  fontWeight: 700,
                }}
              >
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Star Rating */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StarRating rating={product.rating} reviewsCount={product.reviewsCount} />
          </div>
        </div>

        {/* Action Button: Add to Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="btn btn-primary btn-full btn-sm"
          style={{
            marginTop: '8px',
            fontWeight: 600,
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};
