import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { IconHome, IconShoppingBag, IconCart, IconUser } from './Icons';

export const BottomNav = () => {
  const location = useLocation();
  const { totalItemsCount } = useCart();

  const navItems = [
    { label: 'Home', path: '/', icon: IconHome },
    { label: 'Shop', path: '/shop', icon: IconShoppingBag },
    { label: 'Cart', path: '/cart', icon: IconCart, badge: totalItemsCount },
    { label: 'Account', path: '/account', icon: IconUser },
  ];

  return (
    <>
      <nav
        className="mobile-bottom-navigation"
        aria-label="Mobile quick navigation"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-light)',
          padding: '8px 16px',
          zIndex: 99,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
          justifyContent: 'space-around',
          alignItems: 'center',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: isActive ? 700 : 500,
                position: 'relative',
                padding: '4px 12px',
                transition: 'color var(--transition-fast)',
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-10px',
                      backgroundColor: 'var(--color-brand-primary)',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-navigation {
            display: flex !important;
          }
          /* Add bottom padding to body so content doesn't get covered by bottom nav */
          body {
            padding-bottom: 60px !important;
          }
        }
      `}</style>
    </>
  );
};
