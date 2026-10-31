import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/common/ProductCard';
import { IconHeart } from '../components/common/Icons';

export const Wishlist = () => {
  const { wishlistItems, wishlistCount, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((product) => {
      addToCart(product, 1);
    });
  };

  return (
    <div className="wishlist-page container" style={{ paddingBottom: '70px' }}>
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <span className="current">Wishlist</span>
      </nav>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '20px 0 32px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            My Wishlist ({wishlistCount} {wishlistCount === 1 ? 'item' : 'items'})
          </h1>
        </div>

        {wishlistCount > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleMoveAllToCart}
              className="btn btn-secondary btn-sm"
            >
              Move All to Cart
            </button>
            <button
              type="button"
              onClick={clearWishlist}
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-danger)',
                fontWeight: 600,
                padding: '0 8px',
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {wishlistCount === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            maxWidth: '520px',
            margin: '40px auto',
            padding: '48px 32px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--text-muted)',
            }}
          >
            <IconHeart size={26} />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>Your Wishlist is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
            Keep track of items you love. Click the heart icon on any product card or details page to save it for later.
          </p>
          <Link to="/shop" className="btn btn-primary">
            Explore Products
          </Link>
        </div>
      ) : (
        /* Wishlist Grid */
        <div className="grid grid-cols-4" style={{ gap: '24px' }}>
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
