import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import apiClient from '../api/apiClient';

const WishlistContext = createContext();
const STORAGE_KEY = 'salesavvy_wishlist';

const readLocalWishlist = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const normalizeProduct = (item) => ({
  ...item,
  id: String(item.productId ?? item.product_id ?? item.id),
  name: item.name || 'Product',
  price: Number(item.price ?? item.price_per_unit ?? 0),
  image: item.image || item.imageUrl || item.image_url || '',
});

export const WishlistProvider = ({ children }) => {
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(readLocalWishlist);

  // Signed-in users load and persist wishlist records in MySQL through /api/wishlist.
  useEffect(() => {
    let active = true;
    const loadWishlist = async () => {
      if (!isAuthenticated) return;
      try {
        const localItems = readLocalWishlist();
        // Migrate valid guest wishlist product IDs to the signed-in user's database wishlist.
        await Promise.all(localItems.map(async (item) => {
          const productId = Number(item.productId ?? item.id);
          if (Number.isInteger(productId) && productId > 0) {
            try { await apiClient.post('/wishlist', { productId }); } catch (error) {
              if (error.status !== 404) console.warn('Wishlist migration skipped:', error.message);
            }
          }
        }));
        const response = await apiClient.get('/wishlist');
        const products = Array.isArray(response?.products) ? response.products.map(normalizeProduct) : [];
        if (active) setWishlistItems(products);
      } catch (error) {
        console.warn('Could not load wishlist from backend:', error.message);
      }
    };
    loadWishlist();
    return () => { active = false; };
  }, [isAuthenticated, user?.username]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems)); }
    catch (error) { console.warn('Unable to persist wishlist locally', error); }
  }, [wishlistItems]);

  const isInWishlist = useCallback((productId) =>
    wishlistItems.some((item) => String(item.id) === String(productId)), [wishlistItems]);

  const toggleWishlist = async (product) => {
    const productId = Number(product.productId ?? product.id);
    if (isInWishlist(product.id)) {
      setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(product.id)));
      if (isAuthenticated && Number.isInteger(productId) && productId > 0) {
        try { await apiClient.delete(`/wishlist/${productId}`); }
        catch (error) { showToast(`Wishlist removal was not saved to the server: ${error.message}`, 'warning'); }
      }
      showToast(`Removed "${product.name}" from wishlist`, 'info');
      return;
    }

    setWishlistItems((prev) => [...prev, product]);
    if (isAuthenticated) {
      if (!Number.isInteger(productId) || productId <= 0) {
        showToast('This product has no valid backend ID; it is saved only in this browser.', 'warning');
      } else {
        try { await apiClient.post('/wishlist', { productId }); }
        catch (error) { showToast(`Wishlist was not saved to the server: ${error.message}`, 'warning'); }
      }
    }
    showToast(`Saved "${product.name}" to wishlist`, 'success');
  };

  const removeFromWishlist = async (productId) => {
    const item = wishlistItems.find((entry) => String(entry.id) === String(productId));
    setWishlistItems((prev) => prev.filter((entry) => String(entry.id) !== String(productId)));
    if (isAuthenticated && Number.isInteger(Number(productId)) && Number(productId) > 0) {
      try { await apiClient.delete(`/wishlist/${Number(productId)}`); }
      catch (error) { showToast(`Wishlist removal was not saved to the server: ${error.message}`, 'warning'); }
    }
    if (item) showToast(`Removed "${item.name}" from wishlist`, 'info');
  };

  const clearWishlist = async () => {
    setWishlistItems([]);
    if (isAuthenticated) {
      try { await apiClient.delete('/wishlist'); }
      catch (error) { showToast(`Wishlist clearing was not saved to the server: ${error.message}`, 'warning'); }
    }
    showToast('Wishlist cleared', 'info');
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount: wishlistItems.length,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

export default WishlistContext;
