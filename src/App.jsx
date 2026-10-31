import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';

// Components
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { BottomNav } from './components/common/BottomNav';
import { Footer } from './components/common/Footer';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Categories } from './pages/Categories';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { Wishlist } from './pages/Wishlist';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { About } from './pages/About';

// Utilities
import { captureUtmParams } from './utils';

// Accessibility Skip Link helper
const SkipLink = () => (
  <a href="#main-content" className="skip-link no-print">
    Skip to main content
  </a>
);

// Reading scroll progress indicator
const ScrollProgress = () => {
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight <= 0) {
        setScrollWidth(0);
        return;
      }
      setScrollWidth((window.scrollY / totalHeight) * 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="scroll-progress-bar no-print"
      style={{ width: `${scrollWidth}%` }}
      aria-hidden="true"
    />
  );
};

// Route Observer to capture UTM params and scroll to top on navigation
function RouteObserver() {
  const location = useLocation();

  useEffect(() => {
    captureUtmParams();
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return null;
}

// Global Intersection Observer for scroll-reveal animations across pages and dynamic loads
function ScrollRevealManager() {
  const location = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.documentElement.classList.add('js-reveal');
      return;
    }

    document.documentElement.classList.add('js-reveal');

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observedSet = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const scanAndObserve = () => {
      const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
      elements.forEach((el) => {
        if (!observedSet.has(el)) {
          observedSet.add(el);
          observer.observe(el);
        }
      });
    };

    scanAndObserve();
    const mutationObserver = new MutationObserver(() => scanAndObserve());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(scanAndObserve, 150);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search]);

  return null;
}

function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Normalize path to exclude trailing slashes for clean matching
  const currentPath = location.pathname.replace(/\/$/, '') || '/';
  const isAuthPage = currentPath === '/login' || currentPath === '/register';

  return (
    <>
      <SkipLink />
      {!isAuthPage && <ScrollProgress />}

      {!isAuthPage && <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
      {!isAuthPage && <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}

      <main id="main-content" style={isAuthPage ? { display: 'flex', flexDirection: 'column', flex: '1 0 auto' } : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Orders defaultTab="orders" />} />
          <Route path="/orders" element={<Orders defaultTab="orders" />} />
          <Route path="/profile" element={<Orders defaultTab="profile" />} />
          <Route path="/admin" element={<Orders defaultTab="admin" />} />
          <Route path="/customerhome" element={<Home />} />
          <Route path="/adminhome" element={<Orders defaultTab="admin" />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route
            path="*"
            element={
              <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>404</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  The page you are looking for does not exist or has been moved.
                </p>
                <a href="/" className="btn btn-primary">
                  Return to Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>

      {!isAuthPage && <Footer />}
      {!isAuthPage && <BottomNav />}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <RouteObserver />
                <ScrollRevealManager />
                <MainLayout />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
