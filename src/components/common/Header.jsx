import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getProducts, getCategories } from '../../api';
import {
  IconSearch,
  IconUser,
  IconHeart,
  IconCart,
  IconSun,
  IconMoon,
  IconMenu,
  IconChevronDown,
  IconPackage,
  IconLogOut,
  IconGrid,
} from './Icons';
import { formatCurrency } from '../../utils';

export const Header = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItemsCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const accountMenuRef = useRef(null);
  const categoriesDropdownRef = useRef(null);

  // Load products and categories for header autocomplete and navigation
  useEffect(() => {
    let isMounted = true;
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        if (isMounted) {
          setProductsList(prods || []);
          setCategoriesList(cats || []);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Live autocomplete filtering
  const suggestions = searchQuery.trim()
    ? productsList.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(e.target)
      ) {
        setCategoriesDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setAccountMenuOpen(false);
        setCategoriesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowSuggestions(false);
    setAccountMenuOpen(false);
    setCategoriesDropdownOpen(false);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
    navigate('/');
  };

  const isHomeActive = location.pathname === '/';
  const isShopActive = location.pathname === '/shop' && !location.search.includes('category=');
  const isCategoriesActive =
    location.pathname === '/categories' || location.search.includes('category=');
  const isAboutActive = location.pathname === '/about';

  return (
    <header
      className="sticky-header"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100%',
        zIndex: 100,
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '1px solid var(--navbar-border)',
        boxShadow: 'var(--shadow-sm)',
        boxSizing: 'border-box',
        transition: 'background-color var(--transition-fast), border-color var(--transition-fast)',
      }}
    >
      {/* Top Header Row: Logo, Search Bar, Action Icons */}
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          paddingTop: '16px',
          paddingBottom: '14px',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 'var(--max-width)',
        }}
      >
        {/* Brand Section: Logo + Brand Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Mobile Menu Button (Hidden on Desktop) */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="mobile-menu-btn"
            aria-label="Open mobile navigation menu"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--navbar-brand-text)',
              display: 'none',
              padding: '6px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconMenu size={24} />
          </button>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Crisp Shopping Cart Logo: Sky blue in dark mode (#38BDF8), primary blue in light mode (#0369A1) */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M3 6h4.5l3.6 15.5a2 2 0 0 0 1.95 1.5h12.9a2 2 0 0 0 1.95-1.5L30 9.5H8.5"
                stroke="var(--navbar-logo)"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="14" cy="27" r="2.25" fill="var(--navbar-logo)" />
              <circle cx="25" cy="27" r="2.25" fill="var(--navbar-logo)" />
            </svg>

            {/* Brand Typography: #FAFAFA in dark mode, #292524 in light mode */}
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: 'var(--navbar-brand-text)',
                fontFamily: 'var(--font-heading)',
                transition: 'color var(--transition-fast)',
              }}
            >
              Sales Savvy
            </span>
          </Link>
        </div>

        {/* Center Pill-Shaped Search Bar (Desktop) */}
        <div
          ref={searchContainerRef}
          className="desktop-search-container"
          style={{
            flex: '1',
            maxWidth: '540px',
            position: 'relative',
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '46px',
              backgroundColor: 'var(--navbar-search-bg)',
              borderRadius: '9999px',
              border: '1px solid var(--navbar-search-border)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
              padding: '4px 6px 4px 18px',
              boxSizing: 'border-box',
              position: 'relative',
              transition: 'border-color var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast)',
            }}
          >
            <input
              type="text"
              placeholder="Search for products, brands, and more..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              aria-label="Search store products"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.875rem',
                color: 'var(--navbar-search-text)',
                paddingRight: '12px',
                minWidth: 0,
              }}
            />

            {/* Pill Search Button with Icon + Text */}
            <button
              type="submit"
              aria-label="Submit search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                borderRadius: '9999px',
                backgroundColor: 'var(--navbar-btn-bg)',
                border: '1px solid var(--navbar-btn-bg)',
                color: 'var(--navbar-btn-text)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--navbar-btn-hover)';
                e.currentTarget.style.borderColor = 'var(--navbar-btn-hover)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--navbar-btn-bg)';
                e.currentTarget.style.borderColor = 'var(--navbar-btn-bg)';
              }}
            >
              <IconSearch size={15} style={{ color: 'var(--navbar-btn-text)' }} />
              <span>Search</span>
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-dropdown)',
                border: '1px solid var(--border-medium)',
                overflow: 'hidden',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                Suggested Products
              </div>
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  onClick={() => setShowSuggestions(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {p.category} &bull; {p.brand}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                    {formatCurrency(p.price)}
                  </div>
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSearchSubmit}
                style={{
                  width: '100%',
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-brand-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View all results for "{searchQuery}" &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Right Header Action Icons matching reference */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {/* 1. Theme Toggle: Squircle button with outline icon */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="navbar-theme-btn"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid var(--navbar-border)',
              backgroundColor: 'var(--navbar-search-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navbar-brand-text)',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--navbar-hover-bg)';
              e.currentTarget.style.color = 'var(--navbar-link-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--navbar-search-bg)';
              e.currentTarget.style.color = 'var(--navbar-brand-text)';
            }}
          >
            {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
          </button>

          {/* 2. Wishlist Icon with Sale Badge */}
          <Link
            to="/wishlist"
            className="header-action-btn desktop-only-action navbar-action-btn"
            aria-label={`Wishlist with ${wishlistCount} items`}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navbar-link)',
              textDecoration: 'none',
              borderRadius: '10px',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--navbar-hover-bg)';
              e.currentTarget.style.color = 'var(--navbar-link-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--navbar-link)';
            }}
          >
            <IconHeart size={22} />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
                  backgroundColor: 'var(--badge-sale-bg)',
                  color: 'var(--badge-sale-text)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* 3. Shopping Cart Icon with Primary Badge */}
          <Link
            to="/cart"
            className="header-action-btn navbar-action-btn"
            aria-label={`Shopping cart with ${totalItemsCount} items`}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--navbar-link)',
              textDecoration: 'none',
              borderRadius: '10px',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--navbar-hover-bg)';
              e.currentTarget.style.color = 'var(--navbar-link-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--navbar-link)';
            }}
          >
            <IconCart size={23} />
            {totalItemsCount >= 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
                  backgroundColor: 'var(--navbar-logo)',
                  color: 'var(--navbar-btn-text)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {totalItemsCount}
              </span>
            )}
          </Link>

          {/* 4. Account Pill: Sign In link for guests, Account menu dropdown for authenticated users */}
          {!isAuthenticated ? (
            <Link
              to="/login"
              aria-label="Sign In"
              className="navbar-account-btn"
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: '9999px',
                border: '1px solid var(--navbar-border)',
                backgroundColor: 'var(--navbar-search-bg)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--navbar-brand-text)',
                textDecoration: 'none',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'border-color var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--navbar-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--navbar-link-active)';
                e.currentTarget.style.color = 'var(--navbar-link-hover)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--navbar-search-bg)';
                e.currentTarget.style.borderColor = 'var(--navbar-border)';
                e.currentTarget.style.color = 'var(--navbar-brand-text)';
              }}
            >
              <IconUser size={18} />
              <span>Sign In</span>
            </Link>
          ) : (
            <div ref={accountMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-expanded={accountMenuOpen}
                aria-label="Account and profile menu"
                className="navbar-account-btn"
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '9999px',
                  border: '1px solid var(--navbar-border)',
                  backgroundColor: 'var(--navbar-search-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: 'var(--navbar-brand-text)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--navbar-hover-bg)';
                  e.currentTarget.style.color = 'var(--navbar-link-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--navbar-search-bg)';
                  e.currentTarget.style.color = 'var(--navbar-brand-text)';
                }}
              >
                <IconUser size={18} />
                <IconChevronDown
                  size={14}
                  style={{
                    transform: accountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--transition-fast)',
                  }}
                />
              </button>

              {/* Account Dropdown Menu (Authenticated Only) */}
              {accountMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-dropdown)',
                    border: '1px solid var(--border-medium)',
                    overflow: 'hidden',
                    zIndex: 1000,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  {/* User Info Header */}
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        flexShrink: 0,
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Welcome,
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user?.name || user?.username || 'User'}
                      </div>
                      {user?.email && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div style={{ padding: '6px 0' }}>
                    <Link
                      to="/profile"
                      onClick={() => setAccountMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IconUser size={17} style={{ color: 'var(--color-brand-primary)' }} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IconPackage size={17} style={{ color: 'var(--color-brand-primary)' }} />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setAccountMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IconHeart size={17} style={{ color: 'var(--color-brand-primary)' }} />
                      <span>My Wishlist</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 18px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#ef4444',
                          textDecoration: 'none',
                          transition: 'background-color var(--transition-fast)',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <IconGrid size={17} />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>

                  {/* Divider & Logout Button */}
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '6px 0' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 18px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <IconLogOut size={17} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Row Below Search: Home, Shop, Categories */}
      <nav
        className="subnav-bar"
        aria-label="Main store navigation"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          paddingTop: '6px',
          paddingBottom: '8px',
          borderTop: '1px solid var(--navbar-border)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '34px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {/* Home Link with Active Indicator */}
          <Link
            to="/"
            className={`navbar-nav-link ${isHomeActive ? 'active' : ''}`}
            style={{
              fontSize: '0.95rem',
              fontWeight: isHomeActive ? 700 : 500,
              color: isHomeActive ? 'var(--navbar-link-active)' : 'var(--navbar-link)',
              textDecoration: 'none',
              padding: '6px 2px',
              borderBottom: isHomeActive ? '2.5px solid var(--navbar-link-border-active, transparent)' : '2.5px solid transparent',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
            }}
          >
            Home
          </Link>

          {/* Shop Link with Active Indicator */}
          <Link
            to="/shop"
            className={`navbar-nav-link ${isShopActive ? 'active' : ''}`}
            style={{
              fontSize: '0.95rem',
              fontWeight: isShopActive ? 700 : 500,
              color: isShopActive ? 'var(--navbar-link-active)' : 'var(--navbar-link)',
              textDecoration: 'none',
              padding: '6px 2px',
              borderBottom: isShopActive ? '2.5px solid var(--navbar-link-border-active, transparent)' : '2.5px solid transparent',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
            }}
          >
            Shop
          </Link>

          {/* Categories with Dropdown Arrow */}
          <div ref={categoriesDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className={`navbar-nav-link ${isCategoriesActive ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 2px',
                fontSize: '0.95rem',
                fontWeight: isCategoriesActive ? 700 : 500,
                color: isCategoriesActive ? 'var(--navbar-link-active)' : 'var(--navbar-link)',
                borderBottom: isCategoriesActive ? '2.5px solid var(--navbar-link-border-active, transparent)' : '2.5px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'color var(--transition-fast), border-color var(--transition-fast)',
              }}
            >
              <span>Categories</span>
              <IconChevronDown
                size={13}
                style={{
                  transform: categoriesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)',
                }}
              />
            </button>

            {/* Categories Dropdown Menu */}
            {categoriesDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '240px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-dropdown)',
                  border: '1px solid var(--border-medium)',
                  overflow: 'hidden',
                  zIndex: 1000,
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div style={{ padding: '8px 0' }}>
                  {categoriesList.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/shop?category=${encodeURIComponent(cat.categoryId || cat.id || cat.slug)}`}
                      onClick={() => setCategoriesDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 18px',
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-brand-primary)',
                          flexShrink: 0,
                        }}
                      />
                      <span>{cat.categoryName || cat.name}</span>
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '6px', paddingTop: '6px' }}>
                    <Link
                      to="/categories"
                      onClick={() => setCategoriesDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '8px 18px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-brand-primary)',
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Explore All Categories &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* About Us Link with Active Indicator */}
          <Link
            to="/about"
            className={`navbar-nav-link ${isAboutActive ? 'active' : ''}`}
            style={{
              fontSize: '0.95rem',
              fontWeight: isAboutActive ? 700 : 500,
              color: isAboutActive ? 'var(--navbar-link-active)' : 'var(--navbar-link)',
              textDecoration: 'none',
              padding: '6px 2px',
              borderBottom: isAboutActive ? '2.5px solid var(--navbar-link-border-active, transparent)' : '2.5px solid transparent',
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
            }}
          >
            About Us
          </Link>
        </div>
      </nav>

      {/* Mobile Search Bar Row (Clean full-width input for mobile) */}
      <div
        ref={mobileSearchRef}
        className="mobile-search-row"
        style={{
          display: 'none',
          padding: '0 16px 12px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search for products, brands, and more..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            aria-label="Search store products"
            style={{
              width: '100%',
              height: '42px',
              paddingLeft: '16px',
              paddingRight: '44px',
              borderRadius: '9999px',
              border: '1px solid var(--navbar-search-border)',
              backgroundColor: 'var(--navbar-search-bg)',
              color: 'var(--navbar-search-text)',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            aria-label="Submit search"
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'var(--navbar-btn-bg)',
              border: 'none',
              color: 'var(--navbar-btn-text)',
              cursor: 'pointer',
            }}
          >
            <IconSearch size={16} style={{ color: 'var(--navbar-btn-text)' }} />
          </button>
        </form>

        {/* Mobile Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              marginTop: '6px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-dropdown)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {suggestions.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                onClick={() => setShowSuggestions(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-light)',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.name}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                  {formatCurrency(p.price)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Responsive Breakpoint Styles */}
      <style>{`
        @media (max-width: 868px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          .desktop-search-container {
            display: none !important;
          }
          .mobile-search-row {
            display: block !important;
          }
          .subnav-bar {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .desktop-only-action {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
