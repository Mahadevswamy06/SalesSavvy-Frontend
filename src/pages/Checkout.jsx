import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatDate } from '../utils';
import { IconShield, IconCheck, IconCopy } from '../components/common/Icons';
import { useToast } from '../context/ToastContext';
import { useAuth, useAuthPrompt } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export const Checkout = () => {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthPrompt();
  const { cartItems, subtotal, shipping, tax, discount, coupon, total, clearCart, syncCartToBackend } = useCart();

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [savedAddressAvailable, setSavedAddressAvailable] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [editingDeliveryAddress, setEditingDeliveryAddress] = useState(false);

  // Load the latest saved profile/address from the backend for checkout.
  useEffect(() => {
    let active = true;

    const applyProfile = (profile) => {
      if (!active || !profile) return;
      const next = {
        fullName: profile.name || profile.username || user?.name || user?.username || '',
        phone: profile.phone || user?.phone || '',
        email: profile.email || user?.email || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
      };
      setFormData(next);
      const hasSavedAddress = Boolean(next.address && next.city && next.state && next.pincode);
      setSavedAddressAvailable(hasSavedAddress);
      setUseSavedAddress(hasSavedAddress);
      setEditingDeliveryAddress(!hasSavedAddress);
    };

    if (isAuthenticated) {
      apiClient.get('/users/profile')
        .then(applyProfile)
        .catch(() => {
          if (!active) return;
          applyProfile(user || {});
        });
    } else if (user) {
      applyProfile(user);
    }

    return () => { active = false; };
  }, [user, isAuthenticated]);

  // If cart is empty and no completed order, redirect to cart
  if (cartItems.length === 0 && !completedOrder) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Your Cart is Empty</h2>
        <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link to="/shop" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.phone.trim() || formData.phone.length < 10)
      errors.phone = 'Valid 10-digit mobile number required';
    if (!formData.email.trim() || !formData.email.includes('@'))
      errors.email = 'Valid email address required';
    if (!formData.address.trim()) errors.address = 'Delivery address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.pincode.trim() || formData.pincode.length < 6)
      errors.pincode = 'Valid 6-digit PIN code required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[data-razorpay-checkout]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout could not be loaded.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay checkout could not be loaded. Check your internet connection.'));
    document.body.appendChild(script);
  });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      requireAuth('/checkout', 'Please sign in to your Sales Savvy account to place this order.');
      return;
    }
    if (!validateForm()) {
      showToast('Please correct the highlighted fields in the form', 'warning');
      return;
    }

    setIsSubmitting(true);
    const orderBase = {
      date: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      items: [...cartItems],
      subtotal,
      shipping,
      tax,
      discount,
      couponCode: coupon?.code || null,
      total,
      shippingAddress: { ...formData },
    };

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Razorpay key is not configured. Add VITE_RAZORPAY_KEY_ID to your frontend .env file using the same key ID configured in the backend.');
      }

      // Persist a newly entered delivery address so it is available next time.
      if (!useSavedAddress || editingDeliveryAddress || !savedAddressAvailable) {
        await apiClient.put('/users/profile', {
          name: formData.fullName.trim(),
          username: formData.fullName.trim().replace(/\s+/g, '_'),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        });
        setSavedAddressAvailable(true);
        setUseSavedAddress(true);
        setEditingDeliveryAddress(false);
        showToast('Delivery address saved for your next checkout.', 'success');
      }

      await syncCartToBackend();
      await loadRazorpay();
      const paymentOrderId = await apiClient.post('/payment/create', {
        totalAmount: Number(total.toFixed(2)),
        paymentMethod,
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        // The backend uses the authenticated user's saved cart and database product prices.
      });
      const razorpayOrderId = typeof paymentOrderId === 'string'
        ? paymentOrderId.trim().replace(/^"|"$/g, '')
        : paymentOrderId?.id || paymentOrderId?.orderId;
      if (!razorpayOrderId) throw new Error('The backend did not return a Razorpay order ID.');

      await new Promise((resolve) => {
        let resolved = false;
        const finish = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };
        const checkout = new window.Razorpay({
          key: razorpayKey,
          amount: Math.round(total * 100),
          currency: 'INR',
          name: 'Sales Savvy',
          description: 'Sales Savvy order payment',
          order_id: razorpayOrderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            delivery_city: formData.city,
            delivery_state: formData.state,
            delivery_pincode: formData.pincode,
          },
          theme: { color: '#0369A1' },
          handler: async (response) => {
            try {
              await apiClient.post('/payment/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              const orderSummary = {
                ...orderBase,
                orderId: response.razorpay_order_id,
                paymentMethod: paymentMethod === 'upi' ? 'Razorpay (UPI / Online)' : 'Razorpay (Card)',
                localOnly: false,
                status: 'Payment verified',
              };
              setCompletedOrder(orderSummary);
              // The backend's payment verification already clears the MySQL cart.
              clearCart({ syncBackend: false });
              showToast('Payment verified and order saved successfully.', 'success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
              showToast(error.message || 'Payment was received, but the backend could not verify it. Do not retry until you check your payment status.', 'error');
            } finally {
              setIsSubmitting(false);
              finish();
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              showToast('Payment window closed. No order confirmation was recorded.', 'info');
              finish();
            },
          },
        });
        checkout.on('payment.failed', (event) => {
          setIsSubmitting(false);
          showToast(event?.error?.description || 'Payment failed. Please try again.', 'error');
          finish();
        });
        checkout.open();
      });
    } catch (error) {
      showToast(error.message || 'Unable to start checkout. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderId = () => {
    if (completedOrder) {
      navigator.clipboard.writeText(completedOrder.orderId);
      setCopiedOrderId(true);
      showToast('Order reference copied to clipboard!', 'info');
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  // ORDER SUCCESS INVOICE VIEW
  if (completedOrder) {
    return (
      <div className="container" style={{ padding: '40px 20px 80px', maxWidth: '780px' }}>
        <div
          className="card"
          style={{
            padding: '36px',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          {/* Success Banner */}
          <div
            style={{
              textAlign: 'center',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.15)',
                color: 'var(--color-success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <IconCheck size={32} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
              Order Confirmed!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Thank you for shopping with Sales Savvy. Your payment was verified by the backend.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                marginTop: '16px',
                border: '1px solid var(--border-light)',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Order ID:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {completedOrder.orderId}
              </strong>
              <button
                type="button"
                onClick={handleCopyOrderId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
              >
                <IconCopy size={13} />
                <span>{copiedOrderId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Delivery & Payment Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '28px',
              fontSize: '0.875rem',
            }}
          >
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Delivery Address:</div>
              <div style={{ fontWeight: 600 }}>{completedOrder.shippingAddress.fullName}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{completedOrder.shippingAddress.address}</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.pincode}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Phone: {completedOrder.shippingAddress.phone}</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated Delivery:</div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.9375rem' }}>
                {formatDate(completedOrder.estimatedDelivery)}
              </div>
              <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Payment Method:</div>
              <div style={{ fontWeight: 600 }}>{completedOrder.paymentMethod}</div>
            </div>
          </div>

          {/* Itemized Receipt Table */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
              Ordered Items
            </h3>
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {completedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: idx !== completedOrder.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                    backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} {item.selectedColor ? `• ${item.selectedColor}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '28px',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(completedOrder.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
              <span style={{ fontWeight: 600 }}>
                {completedOrder.shipping === 0 ? 'FREE' : formatCurrency(completedOrder.shipping)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tax (10%)</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(completedOrder.tax)}</span>
            </div>
            {completedOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                <span>Discount ({completedOrder.couponCode})</span>
                <span>-{formatCurrency(completedOrder.discount)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-medium)',
                fontSize: '1.05rem',
                fontWeight: 800,
              }}
            >
              <span>Total Paid / Payable</span>
              <span>{formatCurrency(completedOrder.total)}</span>
            </div>
          </div>

          {/* Action Buttons: Print Invoice + View All Orders */}
          <div
            className="no-print"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}
          >
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary btn-md"
            >
              Print Official Receipt
            </button>
            <Link to="/account?tab=orders" className="btn btn-primary btn-md">
              View in My Orders
            </Link>
            <Link to="/shop" className="btn btn-secondary btn-md">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD CHECKOUT FORM VIEW
  return (
    <div className="checkout-page container" style={{ paddingBottom: '70px' }}>
      {/* Breadcrumbs matching wireframe */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <Link to="/cart">Cart</Link>
        <span className="separator">&gt;</span>
        <span className="current">Checkout</span>
      </nav>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '16px 0 28px' }}>
        Checkout
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '36px',
          alignItems: 'start',
        }}
        className="checkout-layout-grid"
      >
        {/* Left: Shipping Address & Payment Selection */}
        <form onSubmit={handlePlaceOrder}>
          {/* Section 1: Shipping Address matching wireframe */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand-primary)',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                1
              </span>
              <span>Shipping Address</span>
            </h2>

            {savedAddressAvailable && useSavedAddress && !editingDeliveryAddress ? (
              <div style={{ padding: '18px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>{formData.fullName}</div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {formData.address}<br />
                      {[formData.city, formData.state].filter(Boolean).join(', ')} - {formData.pincode}<br />
                      Phone: {formData.phone}<br />
                      {formData.email}
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setUseSavedAddress(false); setEditingDeliveryAddress(true); }}>Add / Change Address</button>
                </div>
                <div style={{ marginTop: '12px', color: 'var(--color-success)', fontSize: '0.85rem' }}><IconCheck size={15} /> Using your saved delivery address</div>
              </div>
            ) : (
              <>
                {savedAddressAvailable && (
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter a new delivery address. It will be saved to your account for future checkouts.</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setUseSavedAddress(true); setEditingDeliveryAddress(false); setFormErrors({}); }}>Use Saved Address</button>
                  </div>
                )}
                <div className="checkout-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={`form-input ${formErrors.fullName ? 'error' : ''}`} placeholder="Enter your name" required />
                    {formErrors.fullName && <div className="form-error">{formErrors.fullName}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number <span className="required">*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={`form-input ${formErrors.phone ? 'error' : ''}`} placeholder="Enter phone number" required />
                    {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`form-input ${formErrors.email ? 'error' : ''}`} placeholder="Enter email address" required />
                  {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Address <span className="required">*</span></label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`form-input ${formErrors.address ? 'error' : ''}`} placeholder="House number, street, area" required />
                  {formErrors.address && <div className="form-error">{formErrors.address}</div>}
                </div>
                <div className="checkout-grid-3">
                  <div className="form-group">
                    <label className="form-label">City <span className="required">*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={`form-input ${formErrors.city ? 'error' : ''}`} placeholder="City" required />
                    {formErrors.city && <div className="form-error">{formErrors.city}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">State <span className="required">*</span></label>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} className={`form-input ${formErrors.state ? 'error' : ''}`} placeholder="State" required />
                    {formErrors.state && <div className="form-error">{formErrors.state}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code <span className="required">*</span></label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className={`form-input ${formErrors.pincode ? 'error' : ''}`} placeholder="6-digit PIN" maxLength={6} required />
                    {formErrors.pincode && <div className="form-error">{formErrors.pincode}</div>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Section 2: Payment Method matching wireframe */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand-primary)',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                2
              </span>
              <span>Payment Method</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border:
                    paymentMethod === 'upi'
                      ? '2px solid var(--color-brand-primary)'
                      : '1px solid var(--border-medium)',
                  backgroundColor:
                    paymentMethod === 'upi' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>UPI / Online Payment</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Pay using supported UPI apps and online methods through Razorpay checkout.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border:
                    paymentMethod === 'card'
                      ? '2px solid var(--color-brand-primary)'
                      : '1px solid var(--border-medium)',
                  backgroundColor:
                    paymentMethod === 'card' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Credit / Debit Card</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Pay securely using supported credit or debit cards through Razorpay checkout.
                  </div>
                </div>
              </label>
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              All payments are processed securely through Razorpay. Choose UPI/online payment or credit/debit card in the Razorpay checkout window.
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-full btn-lg"
            style={{ fontWeight: 700 }}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Razorpay'}
          </button>
        </form>

        {/* Right: Order Summary Sidebar matching wireframe */}
        <div className="card" style={{ padding: '24px', position: 'sticky', top: '84px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '18px' }}>
            Order Summary
          </h2>

          {/* Mini items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {cartItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.875rem',
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '42px',
                    height: '42px',
                    objectFit: 'contain',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '16px',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
              <span style={{ fontWeight: 600, color: shipping === 0 ? 'var(--color-success)' : 'inherit' }}>
                {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tax (10%)</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: 600 }}>
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-medium)',
                paddingTop: '14px',
                marginTop: '6px',
                fontSize: '1.2rem',
                fontWeight: 800,
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            <IconShield size={16} />
            <span>Your transaction is secure and encrypted</span>
          </div>
        </div>
      </div>

      <style>{`
        .checkout-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .checkout-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) {
          .checkout-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .checkout-grid-2, .checkout-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
