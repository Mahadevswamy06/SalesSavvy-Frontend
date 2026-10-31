import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight } from './Icons';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    heading: 'Better Products For A Brighter You',
    subtitle: 'Discover high-quality products, carefully chosen for your everyday needs.',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=85',
    alt: 'Ceramic decor and lifestyle books for mindful everyday living',
    imageBg: '#ebe5db',
  },
  {
    id: 'slide-2',
    heading: 'Premium Sound, Pure Comfort',
    subtitle: 'Immerse yourself in crystal clear audio with active noise attenuation and all-day battery life.',
    buttonText: 'Shop Now',
    buttonLink: '/shop?category=electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    alt: 'High fidelity wireless headphones with cushioned earcups',
    imageBg: '#e5e9ed',
  },
  {
    id: 'slide-3',
    heading: 'Smart Tech For Modern Living',
    subtitle: 'Track your fitness, stay connected, and elevate your daily wellness routine effortlessly.',
    buttonText: 'Shop Now',
    buttonLink: '/shop?category=electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85',
    alt: 'Smart watch with AMOLED touch display and fitness sensors',
    imageBg: '#eae6e1',
  },
];

export const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Autoplay functionality with smooth pause-on-hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch swipe support for mobile devices
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40; // minimum swipe distance

    if (touchEndX.current !== 0) {
      if (diff > threshold) {
        nextSlide();
      } else if (diff < -threshold) {
        prevSlide();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  return (
    <div className="hero-banner-section container reveal-on-scroll reveal-fade-up" style={{ padding: '24px 20px 28px' }}>
      <div
        className="hero-banner-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotional hero banners"
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'var(--hero-bg, #f4efe6)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          outline: 'none',
        }}
      >
        {/* Sliding Track */}
        <div
          className="hero-banner-track"
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: 'transform 550ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isSlideActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className="hero-slide-item"
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${index + 1} of ${totalSlides}: ${slide.heading}`}
                aria-hidden={!isSlideActive}
                style={{
                  minWidth: '100%',
                  width: '100%',
                  flexShrink: 0,
                  display: 'grid',
                  gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(280px, 1fr)',
                  alignItems: 'center',
                  minHeight: '360px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Left Column: Promotional Text */}
                <div
                  key={`hero-text-${slide.id}-${isSlideActive ? currentSlide : 'dormant'}`}
                  className="hero-text-col"
                  style={{
                    padding: '44px 32px 44px 52px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    zIndex: 2,
                  }}
                >
                  <span
                    className={`badge-sale ${isSlideActive ? 'hero-animate-badge' : ''}`}
                    style={{
                      backgroundColor: 'var(--badge-sale-bg)',
                      color: 'var(--badge-sale-text)',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      letterSpacing: '0.3px',
                      marginBottom: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    Trending Now
                  </span>

                  <h1
                    className={`hero-heading ${isSlideActive ? 'hero-animate-heading' : ''}`}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '2.4rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.18,
                      letterSpacing: '-0.5px',
                      marginBottom: '16px',
                      maxWidth: '520px',
                    }}
                  >
                    {slide.heading}
                  </h1>

                  <p
                    className={`hero-subtitle ${isSlideActive ? 'hero-animate-subtitle' : ''}`}
                    style={{
                      fontSize: '1.025rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: '26px',
                      maxWidth: '460px',
                    }}
                  >
                    {slide.subtitle}
                  </p>

                  <div>
                    <Link
                      to={slide.buttonLink}
                      className={`btn btn-primary hero-cta-btn ${isSlideActive ? 'hero-animate-cta' : ''}`}
                      tabIndex={isSlideActive ? 0 : -1}
                      style={{
                        padding: '11px 28px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{slide.buttonText}</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Lifestyle Product Image */}
                <div
                  className="hero-image-col"
                  style={{
                    position: 'relative',
                    height: '100%',
                    minHeight: '360px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    key={`hero-img-${slide.id}-${isSlideActive ? currentSlide : 'dormant'}`}
                    src={slide.image}
                    alt={slide.alt}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className={isSlideActive ? 'hero-animate-image' : ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '380px',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 600ms ease',
                    }}
                  />
                  {/* Subtle blend gradient on the inner left edge for seamless desktop integration */}
                  <div
                    className="hero-image-overlay"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '80px',
                      background: 'linear-gradient(to right, var(--hero-bg, #f4efe6), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Previous Arrow Button */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="hero-arrow-btn hero-arrow-left"
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--arrow-bg, rgba(255, 255, 255, 0.9))',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.backgroundColor = 'var(--arrow-bg, rgba(255, 255, 255, 0.9))';
          }}
        >
          <IconChevronLeft size={18} />
        </button>

        {/* Next Arrow Button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="hero-arrow-btn hero-arrow-right"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--arrow-bg, rgba(255, 255, 255, 0.9))',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            e.currentTarget.style.backgroundColor = 'var(--arrow-bg, rgba(255, 255, 255, 0.9))';
          }}
        >
          <IconChevronRight size={18} />
        </button>

        {/* Slide Indicator Dots (Bottom Center) */}
        <div
          className="hero-dots-container"
          role="tablist"
          aria-label="Hero slide selection"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
            padding: '4px 8px',
            borderRadius: '12px',
          }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                style={{
                  width: isActive ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: isActive
                    ? 'var(--color-brand-primary)'
                    : 'var(--dot-inactive, rgba(15, 23, 42, 0.28))',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Responsive Styles for Tablet & Mobile Layouts */}
      <style>{`
        :root {
          --hero-bg: var(--bg-card);
          --arrow-bg: var(--bg-card);
          --dot-inactive: rgba(41, 37, 36, 0.25);
        }

        [data-theme="dark"] {
          --hero-bg: var(--bg-card);
          --arrow-bg: var(--bg-card);
          --dot-inactive: rgba(250, 250, 250, 0.35);
        }

        @media (max-width: 900px) {
          .hero-slide-item {
            min-height: 300px !important;
          }
          .hero-text-col {
            padding: 32px 24px 32px 36px !important;
          }
          .hero-heading {
            font-size: 1.85rem !important;
            margin-bottom: 12px !important;
          }
          .hero-subtitle {
            font-size: 0.925rem !important;
            margin-bottom: 20px !important;
          }
          .hero-image-col {
            min-height: 300px !important;
          }
        }

        @media (max-width: 640px) {
          .hero-banner-section {
            padding: 16px 12px 20px !important;
          }
          .hero-banner-container {
            border-radius: 12px !important;
          }
          .hero-slide-item {
            display: flex !important;
            flex-direction: row !important;
            min-height: 200px !important;
            position: relative !important;
          }
          .hero-text-col {
            flex: 1 1 60% !important;
            padding: 20px 14px 28px 18px !important;
            max-width: 65% !important;
          }
          .hero-heading {
            font-size: 1.25rem !important;
            line-height: 1.2 !important;
            margin-bottom: 8px !important;
          }
          .hero-subtitle {
            font-size: 0.775rem !important;
            line-height: 1.4 !important;
            margin-bottom: 14px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .hero-cta-btn {
            padding: 8px 16px !important;
            font-size: 0.8125rem !important;
          }
          .hero-image-col {
            flex: 1 1 40% !important;
            min-height: 200px !important;
            max-width: 40% !important;
          }
          .hero-arrow-btn {
            width: 30px !important;
            height: 30px !important;
          }
          .hero-arrow-left {
            left: 8px !important;
          }
          .hero-arrow-right {
            right: 8px !important;
          }
          .hero-dots-container {
            bottom: 10px !important;
          }
        }

        @media (max-width: 420px) {
          .hero-heading {
            font-size: 1.1rem !important;
          }
          .hero-subtitle {
            font-size: 0.725rem !important;
            margin-bottom: 10px !important;
          }
          .hero-cta-btn {
            padding: 6px 12px !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};
