/**
 * SaleSavvy Utility Helpers
 * Currency/Date formatters and UTM parameter tracking
 */

// ==========================================
// Formatting Utilities
// ==========================================

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// ==========================================
// UTM Parameter Tracking
// ==========================================

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];

export const getSavedUtmParams = () => {
  try {
    const saved = sessionStorage.getItem('salesavvy_utm_params');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const captureUtmParams = () => {
  if (typeof window === 'undefined') return;
  const searchParams = new URLSearchParams(window.location.search);
  const found = {};
  UTM_KEYS.forEach((key) => {
    if (searchParams.has(key)) {
      found[key] = searchParams.get(key);
    }
  });
  if (Object.keys(found).length > 0) {
    const existing = getSavedUtmParams();
    const merged = { ...existing, ...found };
    sessionStorage.setItem('salesavvy_utm_params', JSON.stringify(merged));
  }
};

export const appendUtmParams = (targetUrl) => {
  const params = getSavedUtmParams();
  if (Object.keys(params).length === 0) return targetUrl;
  
  const [base, hash] = targetUrl.split('#');
  const [path, query] = base.split('?');
  const searchParams = new URLSearchParams(query || '');

  Object.entries(params).forEach(([key, val]) => {
    if (!searchParams.has(key)) {
      searchParams.set(key, val);
    }
  });

  const queryString = searchParams.toString();
  return `${path}${queryString ? '?' + queryString : ''}${hash ? '#' + hash : ''}`;
};
