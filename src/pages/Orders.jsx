import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils';
import {
  IconUser,
  IconClose,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconShoppingBag,
  IconHome,
  IconLogOut,
  IconGrid,
  IconSearch,
} from '../components/common/Icons';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getOrders, getProducts, addProduct, deleteProduct, changeUserPassword } from '../api';
import apiClient from '../api/apiClient';

export const Orders = ({ defaultTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();

  const activeTab = searchParams.get('tab') || defaultTab || (location.pathname === '/profile' ? 'profile' : location.pathname === '/admin' ? 'admin' : 'orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Admin Dashboard State
  const [adminProducts, setAdminProducts] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    stock: '',
    image: '',
    description: '',
  });

  // Profile Form state initialized with real authenticated user
  const [profileName, setProfileName] = useState(user?.name || user?.username || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  const [profileCity, setProfileCity] = useState(user?.city || '');
  const [profileState, setProfileState] = useState(user?.state || '');
  const [profilePincode, setProfilePincode] = useState(user?.pincode || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    }
  }, [isAuthenticated, location, navigate]);

  // Sync profile details when user profile changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || user.username || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
      setProfileCity(user.city || '');
      setProfileState(user.state || '');
      setProfilePincode(user.pincode || '');
    }
  }, [user]);

  // Refresh the saved profile from the backend on account-page load.
  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      apiClient.get('/users/profile').then((profile) => {
        if (!active || !profile) return;
        setProfileName(profile.name || profile.username || '');
        setProfileEmail(profile.email || '');
        setProfilePhone(profile.phone || '');
        setProfileAddress(profile.address || '');
        setProfileCity(profile.city || '');
        setProfileState(profile.state || '');
        setProfilePincode(profile.pincode || '');
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [isAuthenticated]);

  // Load real backend orders from the authenticated user's cookie session.
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setOrdersList([]);
          setLoadingOrders(false);
        }
        return;
      }
      setLoadingOrders(true);
      setOrdersError(null);
      try {
        const backendOrders = await getOrders();
        if (isMounted) setOrdersList(backendOrders || []);
      } catch (err) {
        if (isMounted) setOrdersError(err.message || 'Failed to load orders from backend.');
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };
    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Fetch products for Admin Management
  const fetchAdminProducts = useCallback(async () => {
    setLoadingAdmin(true);
    setAdminError(null);
    try {
      const data = await getProducts();
      setAdminProducts(data || []);
    } catch (err) {
      setAdminError(err.message || 'Unable to connect to product service.');
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminProducts();
    }
  }, [activeTab, fetchAdminProducts]);

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;
    setActionLoading(true);
    try {
      await deleteProduct(productId);
      showToast(`Product "${productName}" was deleted.`, 'success');
      setAdminProducts((prev) => prev.filter((p) => p.id !== productId && p.productId !== productId));
    } catch (err) {
      showToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      showToast('Please provide at least product name and price.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await addProduct({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 10),
      });
      showToast(`Product "${newProduct.name}" created successfully!`, 'success');
      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: 'Electronics',
        price: '',
        stock: '',
        image: '',
        description: '',
      });
      fetchAdminProducts();
    } catch (err) {
      showToast(err.message || 'Failed to create product.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const profileResult = await updateProfile({
      name: profileName.trim(),
      username: profileName.trim().replace(/\s+/g, '_'),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    });
    if (profileResult?.success) {
      setEditingProfile(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const result = await updateProfile({
      address: profileAddress.trim(),
      city: profileCity.trim(),
      state: profileState.trim(),
      pincode: profilePincode.trim(),
      phone: profilePhone.trim(),
    });
    if (result?.success) {
      setEditingAddress(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Fill in all password fields.', 'error');
      return;
    }
    try {
      await changeUserPassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEditingPassword(false);
      showToast('Password changed successfully.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to change password.', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="account-page container" style={{ paddingBottom: '70px' }}>
      {/* Breadcrumbs matching wireframe */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <span className="current">My Account</span>
      </nav>

      {/* Main Account Grid: Sidebar + Tab Content matching wireframe */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '36px',
          alignItems: 'start',
        }}
        className="account-layout-grid"
      >
        {/* Left Sidebar matching wireframe */}
        <aside className="card" style={{ padding: '24px' }}>
          {/* User Profile Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-light)',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {profileName || 'Customer'}
                </span>
                {user?.role === 'ADMIN' && (
                  <span
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profileEmail}
              </div>
            </div>
          </div>

          {/* Navigation Links matching wireframe Screen 8 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: activeTab === 'profile' ? 700 : 500,
                color: activeTab === 'profile' ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'profile' ? 'var(--bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <IconUser size={16} />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: activeTab === 'orders' ? 700 : 500,
                color: activeTab === 'orders' ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'orders' ? 'var(--bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <IconShoppingBag size={16} />
              <span>Orders ({ordersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('addresses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: activeTab === 'addresses' ? 700 : 500,
                color: activeTab === 'addresses' ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'addresses' ? 'var(--bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <IconHome size={16} />
              <span>Addresses</span>
            </button>



            <button
              type="button"
              onClick={() => handleTabChange('password')}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', textAlign: 'left', fontSize: '0.9rem',
                fontWeight: activeTab === 'password' ? 700 : 500,
                color: activeTab === 'password' ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'password' ? 'var(--bg-tertiary)' : 'transparent',
                borderRadius: 'var(--radius-sm)', transition: 'background-color var(--transition-fast)',
              }}
            >
              <IconEye size={16} />
              <span>Change Password</span>
            </button>

            {(user?.role === 'ADMIN' || activeTab === 'admin') && (
              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === 'admin' ? 700 : 500,
                  color: activeTab === 'admin' ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
                  backgroundColor: activeTab === 'admin' ? 'var(--bg-tertiary)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <IconGrid size={16} />
                <span>Admin Dashboard</span>
              </button>
            )}

            <div style={{ margin: '12px 0', borderTop: '1px solid var(--border-light)' }} />

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '0.9rem',
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
              }}
            >
              <IconLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Right Tab Content */}
        <div>
          {/* TAB 1: ORDERS matching wireframe */}
          {activeTab === 'orders' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Orders</h1>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {ordersList.length} total orders
                </span>
              </div>

              {/* Order Cards List */}
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  Loading your orders...
                </div>
              ) : ordersError ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
                  <p style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{ordersError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="btn btn-secondary btn-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : ordersList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <IconShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No orders found</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    You haven't placed any orders yet. Once you complete an order, it will appear here.
                  </p>
                  <Link to="/shop" className="btn btn-primary btn-sm">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {ordersList.map((order, idx) => {
                    const statusClass =
                      order.status === 'Delivered'
                        ? 'badge-status-delivered'
                        : order.status === 'Processing'
                        ? 'badge-status-processing'
                        : 'badge-status-shipped';

                  return (
                    <div
                      key={order.orderId + idx}
                      className="card"
                      style={{
                        padding: '20px 24px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '20px',
                      }}
                    >
                      {/* Left: Order ID & Date */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {order.orderId}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Placed on {formatDate(order.date)}
                        </div>
                      </div>

                      {/* Middle: Amount */}
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCurrency(order.total)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </div>

                      {/* Status Badge matching wireframe */}
                      <div>
                        <span className={`badge ${statusClass}`} style={{ padding: '4px 10px', fontSize: '0.8125rem' }}>
                          {order.status}
                        </span>
                      </div>

                      {/* Action: View Details button matching wireframe */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--color-accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>View Details</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* PROFILE: username, email and phone only */}
          {activeTab === 'profile' && (
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Profile Information</h2>
                {!editingProfile && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingProfile(true)}>Edit Details</button>}
              </div>
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="form-input" readOnly={!editingProfile} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="form-input" readOnly={!editingProfile} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="form-input" readOnly={!editingProfile} />
                </div>
                {editingProfile && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setProfileName(user?.name || user?.username || ''); setProfileEmail(user?.email || ''); setProfilePhone(user?.phone || ''); setEditingProfile(false); }}>Cancel</button>
                  </div>
                )}
              </form>
              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '24px', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>Account Password</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>Change your password in a separate, secure section.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleTabChange('password')}>Change Password</button>
              </div>
            </div>
          )}

          {/* SAVED ADDRESS: separate from profile details */}
          {activeTab === 'addresses' && (
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Saved Delivery Address</h2>
                {!editingAddress && <button type="button" onClick={() => setEditingAddress(true)} className="btn btn-secondary btn-sm">{profileAddress || profileCity ? 'Update Address' : 'Add Address'}</button>}
              </div>
              {!editingAddress ? (
                profileAddress || profileCity || profileState || profilePincode ? (
                  <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{profileName}</strong><br />
                    {profileAddress && <>{profileAddress}<br /></>}
                    {[profileCity, profileState].filter(Boolean).join(', ')} {profilePincode}
                    {profilePhone && <><br />Phone: {profilePhone}</>}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>You haven't saved a delivery address yet. Select Add Address to save one for future checkouts.</p>
                )
              ) : (
                <form onSubmit={handleSaveAddress}>
                  <div className="form-group"><label className="form-label">House / Street Address</label><input className="form-input" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} required placeholder="House number, street, area" /></div>
                  <div className="form-group"><label className="form-label">City</label><input className="form-input" value={profileCity} onChange={(e) => setProfileCity(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">State</label><input className="form-input" value={profileState} onChange={(e) => setProfileState(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">PIN Code</label><input className="form-input" inputMode="numeric" maxLength={6} value={profilePincode} onChange={(e) => setProfilePincode(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Contact Phone</label><input className="form-input" type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required /></div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="btn btn-primary">Save Address</button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setProfileAddress(user?.address || ''); setProfileCity(user?.city || ''); setProfileState(user?.state || ''); setProfilePincode(user?.pincode || ''); setEditingAddress(false); }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* PASSWORD: separate section */}
          {activeTab === 'password' && (
            <div className="card" style={{ padding: '28px', maxWidth: '650px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Change Password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Enter your current password and choose a new password with at least 8 characters.</p>
              <form onSubmit={handleChangePassword}>
                <div className="form-group"><label className="form-label">Current Password</label><div style={{ position: 'relative' }}><input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="form-input" required style={{ paddingRight: '42px' }} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}</button></div></div>
                <div className="form-group"><label className="form-label">New Password</label><input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className="form-input" minLength={8} required /></div>
                <div className="form-group"><label className="form-label">Confirm New Password</label><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="form-input" minLength={8} required /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}><button type="submit" className="btn btn-primary">Save New Password</button><button type="button" className="btn btn-secondary" onClick={() => handleTabChange('profile')}>Cancel</button></div>
              </form>
            </div>
          )}

          {/* TAB 5: ADMIN DASHBOARD */}
          {activeTab === 'admin' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-light)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Admin Dashboard</h1>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Spring Boot Product Catalog Management & Operations
                  </span>
                </div>
                {user?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    + Add New Product
                  </button>
                )}
              </div>

              {user?.role !== 'ADMIN' ? (
                <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Administrator Access Notice
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    You are currently signed in as a customer ({user?.email || 'Guest'}). Administrator credentials are required to modify products.
                  </p>
                  <button type="button" onClick={() => handleTabChange('profile')} className="btn btn-secondary btn-sm">
                    Back to Profile
                  </button>
                </div>
              ) : (
                <div>
                  {/* Search bar */}
                  <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '320px' }}>
                    <input
                      type="text"
                      placeholder="Filter products..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                    />
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <IconSearch size={16} />
                    </span>
                  </div>

                  {loadingAdmin ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                      Loading catalog from backend...
                    </div>
                  ) : adminError ? (
                    <div className="card" style={{ padding: '24px', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
                      <p style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{adminError}</p>
                      <button type="button" onClick={fetchAdminProducts} className="btn btn-secondary btn-sm">
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                              <th style={{ padding: '12px 16px' }}>Product</th>
                              <th style={{ padding: '12px 16px' }}>Category</th>
                              <th style={{ padding: '12px 16px' }}>Price</th>
                              <th style={{ padding: '12px 16px' }}>Stock</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminProducts
                              .filter((p) =>
                                !adminSearch ||
                                p.name?.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                p.category?.toLowerCase().includes(adminSearch.toLowerCase())
                              )
                              .map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px' }} />
                                      <div>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.id}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.category}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <span style={{ color: p.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                                      {p.stock}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(p.id, p.name)}
                                      disabled={actionLoading}
                                      className="btn btn-sm"
                                      style={{ color: '#ef4444', backgroundColor: 'transparent', border: '1px solid #fecaca', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal for Admin */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '28px', maxWidth: '520px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New Product</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Wireless Mouse"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Audio">Audio</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1999"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Stock Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Detailed product highlights..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary btn-sm"
                >
                  {actionLoading ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '28px', maxWidth: '640px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-light)',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Order Details: {selectedOrder.orderId}</h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Placed on {formatDate(selectedOrder.date)} &bull; Status: {selectedOrder.status}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close dialog"
                style={{ color: 'var(--text-secondary)' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            {/* Items in this order */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
                Purchased Items
              </h4>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i !== selectedOrder.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                      backgroundColor: 'var(--bg-secondary)',
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
                          Qty: {item.quantity}
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

            {/* Total and Shipping Address */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                fontSize: '0.875rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)' }}>Shipping To:</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.shippingAddress?.fullName}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedOrder.shippingAddress?.address}</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)' }}>Total Amount:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(selectedOrder.total)}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '4px' }}>
                  Payment: {selectedOrder.paymentMethod || 'Confirmed'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
              >
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 820px) {
          .account-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
