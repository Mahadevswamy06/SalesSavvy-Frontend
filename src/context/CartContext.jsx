import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import apiClient from '../api/apiClient';

const CartContext = createContext();
const CART_STORAGE_KEY = 'salesavvy_cart';

const readSavedCart = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const toBackendProductId = (productId) => {
  const id = Number(productId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeBackendCart = (response) => {
  const products = response?.cart?.products;
  if (!Array.isArray(products)) return null;

  return products.map((item) => {
    const id = String(item.product_id ?? item.productId ?? item.id ?? '');
    const price = Number(item.price_per_unit ?? item.pricePerUnit ?? item.price ?? 0);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const image = item.image_url || item.imageUrl || item.image || '';

    return {
      id: `cart-${id}`,
      productId: id,
      name: item.name || 'Product',
      description: item.description || '',
      price,
      originalPrice: price,
      image,
      quantity,
      selectedColor: null,
      selectedSize: null,
    };
  });
};

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const username = user?.username;

  const [cartItems, setCartItems] = useState(readSavedCart);
  const [coupon, setCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('salesavvy_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // The browser copy is a fallback for guests and while the backend is unavailable.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.warn('Unable to persist cart locally', error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (coupon) localStorage.setItem('salesavvy_coupon', JSON.stringify(coupon));
      else localStorage.removeItem('salesavvy_coupon');
    } catch (error) {
      console.warn('Unable to persist coupon', error);
    }
  }, [coupon]);

  // When a user signs in, load their MySQL cart from the existing GET /api/cart/items route.
  useEffect(() => {
    let active = true;
    const loadServerCart = async () => {
      if (!isAuthenticated || !username) return;
      try {
        const response = await apiClient.get('/cart/items');
        const serverItems = normalizeBackendCart(response);
        if (active && serverItems) setCartItems(serverItems);
      } catch (error) {
        // Keep the local cart usable if the backend/cart table is unavailable.
        console.warn('Could not load the account cart from the backend:', error.message);
      }
    };
    loadServerCart();
    return () => { active = false; };
  }, [isAuthenticated, username]);

  const syncCartRequest = useCallback(async (operation, item, quantity) => {
    if (!isAuthenticated || !username) return;
    const productId = toBackendProductId(item?.productId);
    if (!productId) {
      showToast('This product has no valid backend product ID, so this cart change is saved only in this browser.', 'warning');
      return;
    }

    try {
      const payload = { username, productId, quantity };
      if (operation === 'add') await apiClient.post('/cart/add', payload);
      if (operation === 'update') await apiClient.put('/cart/update', payload);
      if (operation === 'delete') await apiClient.delete('/cart/delete', payload);
    } catch (error) {
      console.warn(`Cart ${operation} could not be synced with the backend:`, error.message);
      showToast('Your cart changed in this browser, but the server did not save the change. Check that the backend and cart_items table are available.', 'warning');
    }
  }, [isAuthenticated, username, showToast]);

  const addToCart = (product, quantity = 1, options = {}) => {
    const selectedColor = options.selectedColor || product.colors?.[0] || null;
    const selectedSize = options.selectedSize || product.sizes?.[0] || null;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) =>
        String(item.productId) === String(product.id) &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
      );

      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
        return next;
      }

      return [...prevItems, {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: String(product.id),
        name: product.name,
        price: Number(product.price) || 0,
        originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
        image: product.image || product.imageUrl || '',
        quantity,
        selectedColor,
        selectedSize,
      }];
    });

    // The backend identifies cart rows by product and username (not UI cart item ID).
    void syncCartRequest('add', { productId: product.id }, quantity);
    showToast(`Added "${product.name}" to cart`, 'success');
  };

  const removeFromCart = (cartItemId) => {
    const item = cartItems.find((entry) => entry.id === cartItemId);
    setCartItems((prev) => prev.filter((entry) => entry.id !== cartItemId));
    if (item) {
      void syncCartRequest('delete', item, 0);
      showToast(`Removed "${item.name}" from cart`, 'info');
    }
  };

  const updateQuantity = (cartItemId, newQty) => {
    const item = cartItems.find((entry) => entry.id === cartItemId);
    if (!item) return;
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) => prev.map((entry) => entry.id === cartItemId ? { ...entry, quantity: newQty } : entry));
    void syncCartRequest('update', item, newQty);
  };

  const clearCart = ({ syncBackend = true } = {}) => {
    const currentItems = cartItems;
    setCartItems([]);
    setCoupon(null);
    // There is no clear-all route in the existing backend, so delete each item through its existing endpoint.
    if (syncBackend) currentItems.forEach((item) => { void syncCartRequest('delete', item, 0); });
  };

  // Reconcile before payment because the existing payment verification service reads items from MySQL.
  const syncCartToBackend = useCallback(async () => {
    if (!isAuthenticated || !username) {
      throw new Error('Please sign in before syncing your cart.');
    }

    const response = await apiClient.get('/cart/items');
    const serverItems = response?.cart?.products;
    if (!Array.isArray(serverItems)) {
      throw new Error('The backend returned an unexpected cart response.');
    }

    const serverQuantities = new Map(serverItems.map((item) => [
      String(item.product_id ?? item.productId ?? item.id),
      Number(item.quantity) || 0,
    ]));
    const localQuantities = new Map(cartItems.map((item) => [String(item.productId), Number(item.quantity) || 1]));

    for (const serverItem of serverItems) {
      const id = String(serverItem.product_id ?? serverItem.productId ?? serverItem.id);
      if (!localQuantities.has(id)) {
        await apiClient.delete('/cart/delete', { username, productId: Number(id) });
      }
    }

    for (const item of cartItems) {
      const productId = toBackendProductId(item.productId);
      if (!productId) throw new Error(`Product "${item.name}" does not have a valid backend product ID.`);
      const existingQuantity = serverQuantities.get(String(productId));
      if (existingQuantity === undefined) {
        await apiClient.post('/cart/add', { username, productId, quantity: Number(item.quantity) || 1 });
      } else if (existingQuantity !== (Number(item.quantity) || 1)) {
        await apiClient.put('/cart/update', { username, productId, quantity: Number(item.quantity) || 1 });
      }
    }
    return true;
  }, [cartItems, isAuthenticated, username]);

  const applyCoupon = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'SAVVY10') {
      setCoupon({ code: 'SAVVY10', percentage: 10, description: '10% Off Sitewide' });
      showToast('Coupon SAVVY10 applied (10% Off)!', 'success');
      return { success: true, message: '10% discount applied successfully!' };
    }
    if (cleanCode === 'WELCOME50') {
      setCoupon({ code: 'WELCOME50', fixed: 50, description: '₹50 First Order Credit' });
      showToast('Coupon WELCOME50 applied (₹50 Off)!', 'success');
      return { success: true, message: '₹50 flat discount applied!' };
    }
    showToast('Invalid coupon code. Try "SAVVY10"', 'warning');
    return { success: false, message: 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => {
    setCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0), [cartItems]);
  const totalItemsCount = useMemo(() => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [cartItems]);
  const shipping = subtotal > 0 && subtotal < 999 ? 99 : 0;
  const tax = subtotal > 0 ? Math.round(subtotal * 0.10) : 0;
  let discount = 0;
  if (coupon?.percentage) discount = Math.round((subtotal * coupon.percentage) / 100);
  else if (coupon?.fixed) discount = Math.min(subtotal, coupon.fixed);
  const total = Math.max(0, subtotal + shipping + tax - discount);

  return (
    <CartContext.Provider value={{
      cartItems, totalItemsCount, addToCart, removeFromCart, updateQuantity, clearCart, syncCartToBackend,
      coupon, applyCoupon, removeCoupon, subtotal, shipping, tax, discount, total,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
