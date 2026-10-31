import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api';
import { IconChevronRight } from '../components/common/Icons';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend category service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="categories-page container" style={{ paddingBottom: '70px' }}>
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        <span className="current">Categories</span>
      </nav>

      <div className="reveal-on-scroll reveal-fade-up" style={{ margin: '16px 0 36px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Explore Categories</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '600px' }}>
          Choose a category to see the products available in our store.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading categories from server...
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
          <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</p>
          <button type="button" onClick={fetchCategories} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            No categories are currently available in the database.
          </p>
          <Link to="/shop" className="btn btn-primary btn-sm">
            View All Products
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
          }}
        >
          {categories.map((cat, idx) => (
            <Link
              key={cat.categoryId || cat.id}
              to={`/shop?category=${encodeURIComponent(cat.categoryId || cat.id || cat.slug)}`}
              className="card reveal-on-scroll reveal-fade-up"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                '--reveal-delay': `${idx * 90}ms`,
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div
                className="reveal-on-scroll reveal-image-mask"
                style={{
                  height: '200px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-secondary)',
                  '--reveal-delay': `${idx * 90 + 50}ms`,
                }}
              >
                <img
                  src={cat.image || cat.categoryImage || undefined}
                  alt={cat.categoryName || cat.name}
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{cat.categoryName || cat.name}</h2>
                    {cat.itemCount > 0 && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {cat.itemCount} {cat.itemCount === 1 ? 'product' : 'products'}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {cat.description || `Browse products in ${cat.categoryName || cat.name}.`}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    marginTop: '18px',
                  }}
                >
                  <span>Browse {cat.categoryName || cat.name}</span>
                  <IconChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
