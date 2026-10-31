import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  IconClose,
  IconSun,
  IconMoon,
  IconHome,
  IconShoppingBag,
  IconGrid,
  IconUser,
  IconPackage,
  IconHeart,
  IconCart,
  IconLogOut,
  IconInfo,
} from './Icons';

export const MobileNav = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { totalItemsCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const prevPathRef = useRef(location.pathname);

  // Close drawer only when route actually changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const links = [
    { label: 'Home', path: '/', icon: IconHome },
    { label: 'Shop', path: '/shop', icon: IconShoppingBag },
    { label: 'Categories', path: '/categories', icon: IconGrid },
    { label: 'About Us', path: '/about', icon: IconInfo },
    ...(isAuthenticated
      ? [
          { label: 'My Profile', path: '/profile', icon: IconUser },
          { label: 'My Orders', path: '/orders', icon: IconPackage },
        ]
      : [{ label: 'Sign In / Register', path: '/login', icon: IconUser }]),
    { label: 'Wishlist', path: '/wishlist', badge: wishlistCount, icon: IconHeart },
    { label: 'Cart', path: '/cart', badge: totalItemsCount, icon: IconCart },
  ];


  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Full-width Menu Panel touching both edges (matching wireframe Phone 2) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          animation: 'mobileNavFadeIn 180ms ease-out',
        }}
      >
        {/* Header: Brand on left, Close button on far right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <Link
            to="/"
            onClick={onClose}
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-heading)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <IconCart size={22} style={{ color: 'var(--color-brand-primary)' }} />
            <span>Sales Savvy</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              color: 'var(--text-primary)',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <IconClose size={24} />
          </button>
        </div>

        {/* Drawer Links touching edge-to-edge */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', boxSizing: 'border-box' }}>
          <nav>
            {links.map((link) => {
              const isActive =
                link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 24px',
                    fontSize: '1rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--text-primary)',
                    borderLeft: isActive ? '4px solid var(--color-brand-primary)' : '4px solid transparent',
                    backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {Icon && <Icon size={19} className="drawer-item-icon" />}
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--badge-sale-bg)',
                        color: 'var(--badge-sale-text)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Logout Action matching Phone 2 */}
            {isAuthenticated && (
              <div style={{ padding: '8px 24px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    onClose();
                    await logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    color: 'var(--color-danger)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    padding: '8px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <IconLogOut size={19} />
                  <span>Logout ({user?.name || 'Account'})</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Drawer Footer with Theme Toggle & Status */}
        <div
          style={{
            padding: '18px 24px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Theme: {theme === 'light' ? 'Light' : 'Dark'}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-card)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes mobileNavFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
