import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuthPrompt } from '../context/AuthContext';
import { formatCurrency } from '../utils';
import { IconClose } from '../components/common/Icons';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ fontSize: '1.15rem' }}>{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            style={{ color: 'var(--text-secondary)', padding: '4px' }}
          >
            <IconClose size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Cart = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuthPrompt();
  const {
    cartItems,
    totalItemsCount,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    tax,
    discount,
    coupon,
    applyCoupon,
    removeCoupon,
    total,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
    }
  };

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.id);
      setItemToRemove(null);
    }
  };

  const confirmClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            maxWidth: '540px',
            margin: '0 auto',
            padding: '48px 32px',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <h2 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Your Shopping Cart is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>
            Looks like you haven't added anything to your cart yet. Explore our everyday essentials and find something you like.
          </p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page container" style={{ paddingBottom: '70px' }}>
      {/* Breadcrumbs matching Screen 4 */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <span className="current">Cart</span>
      </nav>

      {/* Page Title matching wireframe: "Your Cart (X items)" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '20px 0 24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          Your Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
        </h1>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-danger)',
            fontWeight: 600,
          }}
        >
          Clear Cart
        </button>
      </div>

      {/* Main Cart Grid: Items List + Order Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '36px',
          alignItems: 'start',
        }}
        className="cart-layout-grid"
      >
        {/* Left: Cart Items Table/Cards matching wireframe */}
        <div className="card" style={{ padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cartItems.map((item, index) => {
              const lineTotal = item.price * item.quantity;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    paddingBottom: index !== cartItems.length - 1 ? '20px' : '0',
                    borderBottom:
                      index !== cartItems.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}
                  className="cart-item-row"
                >
                  {/* Item Image */}
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {/* Title & Options */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        marginBottom: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      <Link to={`/product/${item.productId}`} style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </Link>
                    </h3>
                    {(item.selectedColor || item.selectedSize) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        {item.selectedColor && item.selectedSize && <span> &bull; </span>}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      </div>
                    )}
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.price)}
                    </div>
                  </div>

                  {/* Quantity Stepper matching wireframe: - 1 + */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        width: '32px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div
                    style={{
                      width: '100px',
                      textAlign: 'right',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                    className="cart-line-total"
                  >
                    {formatCurrency(lineTotal)}
                  </div>

                  {/* Remove Button (x) */}
                  <button
                    type="button"
                    onClick={() => setItemToRemove(item)}
                    aria-label={`Remove ${item.name} from cart`}
                    style={{
                      color: 'var(--text-muted)',
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                    onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <IconClose size={18} />
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.875rem',
                color: 'var(--color-brand-primary)',
                fontWeight: 600,
              }}
            >
              <span>&larr;</span>
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card matching wireframe */}
        <div
          className="card"
          style={{
            padding: '24px',
            position: 'sticky',
            top: '84px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
            Order Summary
          </h2>

          {/* Subtotal, Shipping, Tax Breakdown matching wireframe */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
              <span style={{ fontWeight: 600, color: shipping === 0 ? 'var(--color-success)' : 'inherit' }}>
                {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tax (10%)</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(tax)}</span>
            </div>

            {coupon && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9375rem',
                  color: 'var(--color-success)',
                  fontWeight: 600,
                }}
              >
                <span>Coupon ({coupon.code})</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
          </div>

          {/* Promo Code Input */}
          <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            {coupon ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--color-success)' }}>{coupon.code}</strong> applied ({coupon.description})
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Discount code (try SAVVY10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8125rem', padding: '8px 12px', height: '38px' }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Grand Total matching wireframe */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid var(--border-light)',
              paddingTop: '16px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(total)}
            </span>
          </div>

          {/* Proceed to Checkout Button */}
          <button
            type="button"
            onClick={() => {
              if (requireAuth('/checkout', 'Please sign in to your Sales Savvy account to proceed to checkout.')) {
                navigate('/checkout');
              }
            }}
            className="btn btn-primary btn-full btn-lg"
            style={{ fontWeight: 700, marginBottom: '14px' }}
          >
            Proceed to Checkout
          </button>

          {/* Continue Shopping Link matching wireframe */}
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/shop"
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textDecoration: 'underline',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Removing single item */}
      <ConfirmationModal
        isOpen={!!itemToRemove}
        title="Remove Item from Cart"
        message={`Are you sure you want to remove "${itemToRemove?.name}" from your shopping cart?`}
        confirmLabel="Remove"
        isDanger={true}
        onConfirm={confirmRemoveItem}
        onCancel={() => setItemToRemove(null)}
      />

      {/* Confirmation Modal for Clearing whole cart */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear Entire Cart"
        message="Are you sure you want to remove all items from your cart? This action cannot be undone."
        confirmLabel="Clear All"
        isDanger={true}
        onConfirm={confirmClearCart}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 900px) {
          .cart-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .cart-item-row {
            flex-wrap: wrap;
            gap: 12px !important;
          }
          .cart-line-total {
            width: auto !important;
          }
        }
      `}</style>
    </div>
  );
};
