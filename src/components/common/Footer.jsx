import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="site-footer">
    {/* Main Footer Links & Branding */}
    <div className="footer-main">
      <div className="container">
        <div className="footer-content">
          {/* Brand & Description */}
          <div className="footer-brand">
            <Link to="/" className="footer-brand-title">
              Sales Savvy
            </Link>
            <p>
              Your one-stop shop for everyday essentials across multiple categories.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="footer-heading">Quick Links</h4>
            <div className="footer-links-list">
              <Link to="/">Home</Link>
              <Link to="/shop">Shop</Link>
              <Link to="/categories">Categories</Link>
              <Link to="/about">About Us</Link>
            </div>
          </div>

        
{/* Contact Information */}
<div className="footer-contact">
  <h4 className="footer-heading">Contact Us</h4>

  <div className="footer-email-row">
    <span className="footer-email-label">Mail:</span>
    <a
      href="mailto:vinayswamy052@gmail.com"
      className="footer-email-link"
    >
      vinayswamy052@gmail.com
    </a>
  </div>

  {/* Razorpay logo below email, aligned to bottom-right */}
  <div className="footer-payment-logo">
    <img
      src="/assets/razorpay-payments.png"
      alt="Razorpay"
      className="razorpay-logo"
    />
  </div>
</div>

            </div>
          </div>
        </div>
    
  

    {/* Copyright & Credits Bar */}
    <div className="footer-copyright-bar">
      <div className="container footer-copyright-container">
        <span>© 2026 Sales Savvy. All rights reserved.</span>
        <span className="footer-credit">
          Designed &amp; Developed with ❤️ by Mahadev Swamy
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
