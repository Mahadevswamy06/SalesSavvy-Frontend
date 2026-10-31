import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProducts, getCategories } from '../api';
import { ProductCard } from '../components/common/ProductCard';
import { IconSearch, IconFilter, IconClose } from '../components/common/Icons';
import { formatCurrency } from '../utils';

const ITEMS_PER_PAGE = 8;

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'popularity';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory ? [initialCategory] : []
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState(10000); // 0 to 10000
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch products and categories from backend
  const fetchShopData = async () => {
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
      setError(err.message || 'Unable to connect to backend product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  // Sync state with URL params when searchParams change externally
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategories((prev) => (prev.length === 1 && prev[0] === cat ? prev : [cat]));
    } else if (!searchParams.has('category')) {
      setSelectedCategories((prev) => (prev.length > 0 ? [] : prev));
    }
    const search = searchParams.get('search');
    if (search !== null) {
      setSearchQuery((prev) => (prev === search ? prev : search));
    }
    const sort = searchParams.get('sort');
    if (sort) {
      setSortBy((prev) => (prev === sort ? prev : sort));
    }
  }, [searchParams]);

  // Check if a category is selected (supports numeric ID, slug, or name)
  const isCategorySelected = (cat) => {
    const catId = String(cat.categoryId ?? cat.id ?? '').trim().toLowerCase();
    const catSlug = String(cat.slug ?? '').trim().toLowerCase();
    const catName = String(cat.categoryName ?? cat.name ?? '').trim().toLowerCase();
    return selectedCategories.some((c) => {
      const s = String(c).trim().toLowerCase();
      return s === catSlug || (catId && s === catId) || (catName && s === catName);
    });
  };

  // Handle category checkbox change
  const handleCategoryToggle = (categorySlug) => {
    const slugStr = String(categorySlug).trim().toLowerCase();
    const catObj = categories.find((c) =>
      String(c.slug).toLowerCase() === slugStr ||
      String(c.categoryId ?? c.id).toLowerCase() === slugStr ||
      String(c.categoryName ?? c.name).toLowerCase() === slugStr
    );
    const catId = catObj ? String(catObj.categoryId ?? catObj.id).toLowerCase() : '';
    const catSlug = catObj ? String(catObj.slug).toLowerCase() : slugStr;
    const catName = catObj ? String(catObj.categoryName ?? catObj.name).toLowerCase() : '';

    setSelectedCategories((prev) => {
      const exists = prev.some((c) => {
        const s = String(c).trim().toLowerCase();
        return s === catSlug || (catId && s === catId) || (catName && s === catName);
      });
      const next = exists
        ? prev.filter((c) => {
            const s = String(c).trim().toLowerCase();
            return s !== catSlug && (!catId || s !== catId) && (!catName || s !== catName);
          })
        : [...prev, categorySlug];
      setCurrentPage(1);
      return next;
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setPriceRange(10000);
    setSortBy('popularity');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Filtered & Sorted products computation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategories.length > 0) {
        const normalizeCategoryKey = (value) => String(value ?? '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
        const matchesCategory = selectedCategories.some((cat) => {
          const selected = normalizeCategoryKey(cat);
          const productId = normalizeCategoryKey(product.categoryId);
          const productName = normalizeCategoryKey(product.category);
          const categoryRecord = categories.find((item) =>
            normalizeCategoryKey(item.categoryId || item.id) === selected ||
            normalizeCategoryKey(item.slug) === selected ||
            normalizeCategoryKey(item.categoryName || item.name) === selected
          );
          return selected === productId || selected === productName ||
            (categoryRecord && (
              normalizeCategoryKey(categoryRecord.categoryId || categoryRecord.id) === productId ||
              normalizeCategoryKey(categoryRecord.categoryName || categoryRecord.name) === productName
            ));
        });
        if (!matchesCategory) {
          return false;
        }
      }

      // Price filter
      if (product.price > priceRange) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesBrand = product.brand?.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesBrand && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
      // Default: Popularity (rating * reviewsCount)
      return b.rating * b.reviewsCount - a.rating * a.reviewsCount;
    });
  }, [products, categories, selectedCategories, priceRange, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const activeFiltersCount =
    selectedCategories.length + (searchQuery ? 1 : 0) + (priceRange < 10000 ? 1 : 0);

  // Derive the active category display name for the breadcrumb from Spring Boot categories
  const selectedCategoryName = useMemo(() => {
    if (selectedCategories.length !== 1) {
      return null;
    }

    const selectedKey = String(selectedCategories[0]).trim();
    if (!selectedKey) return null;

    // Match selected category ID, slug, or name against categories from backend
    const matchedCategory = categories.find((cat) => {
      const cId = String(cat.categoryId ?? cat.id ?? '').trim();
      const cSlug = String(cat.slug ?? '').trim();
      const cName = String(cat.categoryName ?? cat.name ?? '').trim();
      return (
        cId === selectedKey ||
        cSlug.toLowerCase() === selectedKey.toLowerCase() ||
        cName.toLowerCase() === selectedKey.toLowerCase()
      );
    });

    if (matchedCategory) {
      return matchedCategory.categoryName || matchedCategory.name || null;
    }

    // Fallback: match from products catalog
    const matchedProduct = products.find((prod) => {
      const pCatId = String(prod.categoryId ?? '').trim();
      const pCatName = String(prod.category ?? '').trim();
      return (
        pCatId === selectedKey ||
        pCatName.toLowerCase() === selectedKey.toLowerCase()
      );
    });

    if (matchedProduct && matchedProduct.category) {
      return matchedProduct.category;
    }

    // Do not display raw numeric IDs to the user
    if (/^\d+$/.test(selectedKey)) {
      return null;
    }

    return selectedKey.replace(/-/g, ' ');
  }, [selectedCategories, categories, products]);

  return (
    <div className="shop-page container" style={{ paddingBottom: '60px' }}>
      {/* Breadcrumbs matching wireframe */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">&gt;</span>
        {selectedCategoryName ? (
          <>
            <Link to="/shop">Shop</Link>
            <span className="separator">&gt;</span>
            <span className="current">{selectedCategoryName}</span>
          </>
        ) : (
          <span className="current">Shop</span>
        )}
      </nav>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '36px',
          alignItems: 'start',
        }}
        className="shop-layout-grid"
      >
        {/* Desktop Sidebar Filters */}
        <aside
          className="desktop-filters card reveal-on-scroll reveal-fade-left"
          style={{
            padding: '24px',
            position: 'sticky',
            top: '84px',
          }}
        >
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Categories List */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '12px' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map((cat) => {
                const checked = isCategorySelected(cat);
                return (
                  <label
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      padding: '2px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCategoryToggle(cat.slug)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--color-brand-primary)',
                        }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    {cat.itemCount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({cat.itemCount})
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Price Range</h4>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹0 - {formatCurrency(priceRange)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="500"
              value={priceRange}
              onChange={(e) => {
                setPriceRange(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: '100%', accentColor: 'var(--color-brand-primary)' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}
            >
              <span>₹0</span>
              <span>₹10,000</span>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '8px' }}>
              Sort By
            </h4>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="popularity">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviewed</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="btn btn-secondary btn-full btn-sm"
          >
            Clear Filters
          </button>
        </aside>

        {/* Right Area: Catalog Header + Grid */}
        <div>
          {/* Catalog Top Bar */}
          <div
            className="reveal-on-scroll reveal-fade-up"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                {selectedCategories.length === 1
                  ? categories.find((c) => c.slug === selectedCategories[0])?.name || 'All Products'
                  : 'All Products'}
              </h1>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </div>
            </div>

            {/* Search Input + Mobile Filter Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-input"
                  style={{
                    padding: '8px 12px 8px 34px',
                    fontSize: '0.875rem',
                    height: '38px',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <IconSearch size={16} />
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <IconClose size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="btn btn-secondary btn-sm mobile-filter-btn"
                style={{ display: 'none', height: '38px' }}
              >
                <IconFilter size={16} />
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading products from server...
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
              <p style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</p>
              <button type="button" onClick={fetchShopData} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            /* Product Grid matching wireframe */
            <div className="grid grid-cols-3" style={{ gap: '24px' }}>
              {paginatedProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="reveal-on-scroll reveal-fade-up"
                  style={{
                    '--reveal-delay': `${(idx % 6) * 75}ms`,
                    height: '100%',
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              className="card"
              style={{
                padding: '60px 24px',
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
                <IconSearch size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                No products found matching your filters
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  maxWidth: '460px',
                  margin: '0 auto 20px',
                }}
              >
                Try widening your price range, clearing specific category filters, or checking your search terms.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-primary btn-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls matching wireframe */}
          {!loading && !error && totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '44px',
              }}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`btn btn-sm ${
                    currentPage === page ? 'btn-primary' : 'btn-secondary'
                  }`}
                  style={{
                    minWidth: '38px',
                    height: '38px',
                    padding: 0,
                    fontWeight: 700,
                  }}
                >
                  {page}
                </button>
              ))}

              {currentPage < totalPages && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ minWidth: '38px', height: '38px', padding: 0 }}
                  aria-label="Next page"
                >
                  &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="modal-overlay" onClick={() => setMobileFilterOpen(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px', maxWidth: '360px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '12px',
              }}
            >
              <h3 style={{ fontSize: '1.15rem' }}>Filters</h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
                style={{ color: 'var(--text-secondary)' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            {/* Mobile Categories */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                Categories
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isCategorySelected(cat)}
                      onChange={() => handleCategoryToggle(cat.slug)}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile Price Slider */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <span>Price Range:</span>
                <span>₹0 - {formatCurrency(priceRange)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-brand-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout CSS */}
      <style>{`
        @media (max-width: 900px) {
          .shop-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .desktop-filters {
            display: none !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Shop;
