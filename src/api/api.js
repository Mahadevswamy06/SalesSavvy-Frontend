import apiClient from './apiClient';

/**
 * Normalizes a product record from the Spring Boot backend or admin API
 * into a consistent frontend model.
 */
export const normalizeProduct = (raw) => {
  if (!raw) return null;

  const id = String(raw.product_id ?? raw.productId ?? raw.id ?? '');
  const rawImages = raw.images ?? raw.imageUrls ?? raw.image_urls ?? raw.productImages ?? raw.product_images ?? raw.productImageList;
  const singleImage = raw.image ?? raw.imageUrl ?? raw.image_url ?? raw.productImage ?? raw.productImageUrl ?? raw.product_image ?? raw.photoUrl ?? raw.thumbnail ?? raw.mainImage;
  const backendRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const normalizeImageUrl = (entry) => {
    const value = typeof entry === 'string' ? entry : (entry?.imageUrl ?? entry?.image_url ?? entry?.url ?? entry?.image ?? '');
    if (typeof value !== 'string' || !value.trim()) return '';
    const clean = value.trim();
    if (/^(https?:)?\/\//i.test(clean) || /^(data:|blob:)/i.test(clean)) return clean;
    return `${backendRoot}/${clean.replace(/^\/+/, '')}`;
  };
  const normalizeOptions = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
      const text = value.trim();
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
      } catch { /* comma-separated value is supported too */ }
      return text.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const rawColorImages = raw.colorImages ?? raw.color_images ?? raw.variantImages ?? raw.variant_images;
  const normalizeColorImages = (value) => {
    if (!value) return {};
    let source = value;
    if (typeof source === 'string') {
      try {
        source = JSON.parse(source);
      } catch {
        // Older database rows may contain a single image URL in color_images.
        // Treat that URL as the default image instead of discarding it.
        return {};
      }
    }
    if (Array.isArray(source)) {
      return source.reduce((acc, item) => {
        if (item && (item.color || item.name) && (item.imageUrl || item.image_url || item.image || item.url)) {
          acc[String(item.color || item.name).trim()] = normalizeImageUrl(item.imageUrl || item.image_url || item.image || item.url);
        }
        return acc;
      }, {});
    }
    if (typeof source !== 'object') return {};
    return Object.entries(source).reduce((acc, [color, image]) => {
      const url = normalizeImageUrl(image);
      if (color.trim() && url) acc[color.trim()] = url;
      return acc;
    }, {});
  };
  const colorImages = normalizeColorImages(rawColorImages);
  const imageValues = Array.isArray(rawImages) ? rawImages : (rawImages ? [rawImages] : []);
  const images = [...imageValues, ...(singleImage ? [singleImage] : [])]
    .map(normalizeImageUrl)
    .filter(Boolean)
    .filter((url, index, arr) => arr.indexOf(url) === index);
  const legacyColorImage = typeof rawColorImages === 'string' && !Object.keys(colorImages).length
    ? normalizeImageUrl(rawColorImages)
    : '';
  const colorImageGallery = Object.values(colorImages).filter(Boolean);
  const allImages = [...images, ...colorImageGallery, ...(legacyColorImage ? [legacyColorImage] : [])]
    .filter((url, index, arr) => arr.indexOf(url) === index);

  const categoryName = raw.category?.categoryName || raw.categoryName || (typeof raw.category === 'string' ? raw.category : '') || 'General';
  const categoryId = String(raw.categoryId ?? raw.category?.categoryId ?? raw.category?.id ?? categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); 

  const categoryHint = String(raw.category?.categoryName || raw.categoryName || raw.category || raw.name || '').toLowerCase();
  const isClothing = /cloth|apparel|fashion|shirt|t-shirt|tshirt|jean|trouser|dress|hoodie|jacket|kurta|topwear|bottomwear|wear/.test(categoryHint);
  const normalizedColors = normalizeOptions(raw.colors ?? raw.availableColors ?? raw.colorOptions);
  const normalizedSizes = normalizeOptions(raw.sizes ?? raw.availableSizes ?? raw.sizeOptions);

  const price = Number(raw.price) || 0;
  const originalPrice = raw.originalPrice ? Number(raw.originalPrice) : (price > 0 ? Math.round(price * 1.35) : 0);
  const stock = raw.stock ?? raw.stockCount ?? 0;

  return {
    id,
    productId: id,
    name: raw.name || 'Product',
    description: raw.description || '',
    price,
    originalPrice,
    stock,
    stockCount: stock,
    inStock: stock > 0,
    image: allImages[0] || '',
    gallery: allImages,
    images: allImages,
    category: categoryName,
    categoryId,
    brand: raw.brand || 'Sales Savvy',
    rating: Number(raw.rating) || 4.5,
    reviewsCount: Number(raw.reviewsCount ?? raw.reviewCount) || 36,
    isFeatured: raw.isFeatured !== undefined ? Boolean(raw.isFeatured) : true,
    isTrending: raw.isTrending !== undefined ? Boolean(raw.isTrending) : false,
    isBestseller: raw.isBestseller !== undefined ? Boolean(raw.isBestseller) : false,
    colors: normalizedColors.length ? normalizedColors : (isClothing ? ['Black', 'White', 'Blue'] : []),
    colorImages,
    sizes: normalizedSizes.length ? normalizedSizes : (isClothing ? ['S', 'M', 'L', 'XL', 'XXL'] : []),
    specifications: raw.specifications || {
      'Availability': stock > 0 ? 'In Stock' : 'Out of Stock',
      'Category': categoryName,
    },
  };
};

/**
 * Normalizes a category object for the UI
 */
export const normalizeCategory = (raw) => {
  if (!raw) return null;

  const name = String(raw.categoryName ?? raw.name ?? raw.title ?? 'Category');
  const slug = String(raw.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  const id = String(raw.categoryId ?? raw.id ?? slug);
  const rawImage = raw.categoryImage ?? raw.category_image ?? raw.imageUrl ?? raw.image_url ?? raw.image ?? raw.thumbnail ?? '';
  const backendRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api').replace(/\/api\/?$/, '').replace(/\/$/, '');
  const image = typeof rawImage === 'string' && rawImage.trim() && !/^(https?:)?\/\//i.test(rawImage) && !/^(data:|blob:)/i.test(rawImage)
    ? `${backendRoot}/${rawImage.trim().replace(/^\/+/, '')}`
    : rawImage;

  return {
    ...raw,
    id,
    categoryId: String(raw.categoryId ?? id),
    categoryName: name,
    name,
    slug,
    description: raw.description ?? '',
    image,
    categoryImage: image,
    itemCount: Number(raw.itemCount ?? raw.productCount ?? raw.productsCount) || 0,
  };
};

/**
 * Fetch products from Spring Boot GET /api/products
 * Supports optional backend category filtering: /api/products?category={name}
 */
export const getProducts = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  const endpoint = `/products${query.toString() ? `?${query.toString()}` : ''}`;

  const data = await apiClient.get(endpoint);
  let productArray = [];

  if (Array.isArray(data)) {
    productArray = data;
  } else if (data && Array.isArray(data.products)) {
    productArray = data.products;
  } else if (data && Array.isArray(data.content)) {
    productArray = data.content;
  }

  return productArray.map(normalizeProduct).filter(Boolean);
};

/**
 * Fetch a single product by ID
 * Calls Spring Boot GET /api/products/{id}
 */
export const getProductById = async (id) => {
  try {
    const data = await apiClient.get(`/products/${id}`);
    if (data) {
      return normalizeProduct(data);
    }
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  // Fallback: search within product list
  const all = await getProducts();
  const match = all.find((p) => String(p.id) === String(id));
  if (match) return match;

  throw new Error(`Product with ID "${id}" was not found.`);
};

/**
 * Fetch categories from backend.
 * Tries GET /api/categories first. If not yet implemented on backend,
 * dynamically derives unique categories from products list.
 */
export const getCategories = async () => {
  try {
    const data = await apiClient.get('/categories');
    let categoryArray = [];
    if (Array.isArray(data)) {
      categoryArray = data;
    } else if (data && Array.isArray(data.categories)) {
      categoryArray = data.categories;
    }

    if (categoryArray.length > 0) {
      return categoryArray.map(normalizeCategory).filter(Boolean);
    }
  } catch (err) {
    if (err.status !== 404 && err.status !== 405) {
      throw err;
    }
  }

  // Derive categories from backend products
  const products = await getProducts();
  const categoryMap = new Map();

  products.forEach((prod) => {
    const name = prod.category || 'General';
    const slug = prod.categoryId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, {
        id: slug,
        categoryId: slug,
        name,
        slug,
        description: `Explore our high quality selection in ${name}.`,
        image: prod.image,
        itemCount: 1,
      });
    } else {
      const existing = categoryMap.get(slug);
      existing.itemCount += 1;
    }
  });

  return Array.from(categoryMap.values());
};

/**
 * Fetch orders for authenticated user
 * Calls Spring Boot GET /api/orders
 */
export const getOrders = async () => {
  const data = await apiClient.get('/orders');
  const rows = Array.isArray(data) ? data
    : Array.isArray(data?.orders) ? data.orders
    : Array.isArray(data?.products) ? data.products : [];
  const grouped = new Map();
  rows.forEach((row, index) => {
    const id = String(row.orderId ?? row.order_id ?? row.order_id ?? row.id ?? `unknown-${index}`);
    if (!grouped.has(id)) {
      grouped.set(id, {
        ...row,
        id,
        orderId: id,
        status: ['SUCCESS', 'PAID'].includes(String(row.status || row.orderStatus || '').toUpperCase()) ? 'Processing' : (row.status || row.orderStatus || 'Processing'),
        createdAt: row.createdAt || row.created_at || row.date || null,
        date: row.createdAt || row.created_at || row.date || null,
        totalAmount: Number(row.orderTotal ?? row.order_total ?? row.totalAmount ?? row.total_amount ?? 0),
        total: Number(row.orderTotal ?? row.order_total ?? row.totalAmount ?? row.total_amount ?? 0),
        paymentMethod: row.payment_method || row.paymentMethod || '',
        shippingAddress: {
          fullName: row.shipping_name || row.shippingName || '',
          phone: row.shipping_phone || row.shippingPhone || '',
          email: row.shipping_email || row.shippingEmail || '',
          address: row.shipping_address || row.shippingAddress || '',
          city: row.shipping_city || row.shippingCity || '',
          state: row.shipping_state || row.shippingState || '',
          pincode: row.shipping_pincode || row.shippingPincode || '',
        },
        items: [],
      });
    }
    const order = grouped.get(id);
    order.items.push({
      ...row,
      id: row.product_id ?? row.productId ?? row.id,
      name: row.name || row.productName || 'Product',
      quantity: Number(row.quantity || 1),
      price: Number(row.price_per_unit ?? row.pricePerUnit ?? row.price ?? 0),
      totalPrice: Number(row.total_price ?? row.totalPrice ?? 0),
      image: row.image_url || row.imageUrl || row.image || '',
    });
    if (!order.totalAmount) {
      order.totalAmount += Number(row.total_price ?? row.totalPrice ?? 0);
      order.total = order.totalAmount;
    }
  });
  return Array.from(grouped.values()).map((order) => ({ ...order, total: order.totalAmount || order.total || 0 }));
};

export const updateUserProfile = (fields) => apiClient.put('/users/profile', fields);
export const changeUserPassword = (payload) => apiClient.put('/users/password', payload);

/**
 * Admin: Add product
 * Matches backend AdminProductController: POST /admin/products/add
 */
export const addProduct = async (productData) => {
  return apiClient.post('/admin/products/add', productData);
};

/**
 * Admin: Delete product
 * Matches backend AdminProductController: DELETE /admin/products/delete
 */
export const deleteProduct = async (productId) => {
  return apiClient.delete('/admin/products/delete', {
    params: { productId },
  });
};

export default {
  normalizeProduct,
  normalizeCategory,
  getProducts,
  getProductById,
  getCategories,
  getOrders,
  updateUserProfile,
  changeUserPassword,
  addProduct,
  deleteProduct,
};
