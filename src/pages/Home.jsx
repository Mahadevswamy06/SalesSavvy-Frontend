import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../api';
import { ProductCard } from '../components/common/ProductCard';
import { HeroBanner } from '../components/common/HeroBanner';
import { IconChevronRight } from '../components/common/Icons';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const [showAllCategories, setShowAllCategories] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCategories || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend product service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real backend products: Trending Products & New Arrivals
  const trendingList = products.filter((p) => p.isTrending || p.isFeatured);
  const trendingProducts = (trendingList.length > 0 ? trendingList : products).slice(0, 4);

  // New arrivals: most recent backend catalog products
  const newArrivals = (products.length > 4 ? [...products].slice(-4).reverse() : products).slice(0, 4);

  return (
    <div className="home-page">
      {/* Sliding Trending Hero Banner directly below navbar */}
      <HeroBanner />

      {/* Shop by Category matching wireframe */}
      <section style={{ padding: '48px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div
            className="reveal-on-scroll reveal-fade-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Shop by Category</h2>
            {categories.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllCategories((value) => !value)}
                style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{showAllCategories ? 'Show Less' : 'View All'}</span>
                <IconChevronRight size={14} />
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              Loading categories...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{error}</p>
              <button type="button" onClick={fetchData} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              No categories available at the moment.
            </div>
          ) : (
            /* Circular Category Tiles matching wireframe */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '24px',
                textAlign: 'center',
              }}
            >
              {(showAllCategories ? categories : categories.slice(0, 8)).map((cat, idx) => (
                <Link
                  key={cat.categoryId || cat.id}
                  to={`/shop?category=${encodeURIComponent(cat.categoryId || cat.id || cat.slug)}`}
                  className="reveal-on-scroll reveal-scale-up"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform var(--transition-fast)',
                    '--reveal-delay': `${idx * 65}ms`,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '2px solid var(--border-light)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <img
                      src={cat.image || cat.categoryImage || undefined}
                      alt={cat.categoryName || cat.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.style.background = 'linear-gradient(135deg, #E0F2FE, #BAE6FD)'; }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cat.categoryName || cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Products */}
      <section style={{ padding: '48px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div
            className="reveal-on-scroll reveal-fade-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Trending Products</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
                Handpicked community favorites and best-selling daily essentials.
              </p>
            </div>
            <Link
              to="/shop"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All</span>
              <IconChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              Loading trending products...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{error}</p>
              <button type="button" onClick={fetchData} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          ) : trendingProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-4" style={{ gap: '20px' }}>
              {trendingProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="reveal-on-scroll reveal-fade-up"
                  style={{
                    '--reveal-delay': `${idx * 80}ms`,
                    height: '100%',
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section style={{ padding: '48px 0 64px' }}>
        <div className="container">
          <div
            className="reveal-on-scroll reveal-fade-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>New Arrivals</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
                The latest curated additions to our store catalog.
              </p>
            </div>
            <Link
              to="/shop"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All</span>
              <IconChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              Loading new arrivals...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>{error}</p>
              <button type="button" onClick={fetchData} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          ) : newArrivals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-4" style={{ gap: '20px' }}>
              {newArrivals.map((product, idx) => (
                <div
                  key={`new-${product.id}`}
                  className="reveal-on-scroll reveal-fade-up"
                  style={{
                    '--reveal-delay': `${idx * 80}ms`,
                    height: '100%',
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Home;
