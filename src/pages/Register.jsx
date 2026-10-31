import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconCart, IconEye, IconEyeOff } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [role, setRole] = useState('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (!formData.username.trim() && !formData.email.trim() && !formData.password) {
        setErrorMessage('All fields are required.');
      } else {
        const firstErrorKey = Object.keys(errors)[0];
        setErrorMessage(errors[firstErrorKey]);
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Dropdown submits CUSTOMER role
      await register(
        {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role,
        },
        { silent: true }
      );

      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="register-page-container container"
      style={{
        padding: '24px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '960px',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-light)',
        }}
      >
        {/* Left Column: Form */}
        <div style={{ padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Brand Logo Header */}
          <div style={{ marginBottom: '20px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-header)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <IconCart size={22} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Sales Savvy</span>
            </Link>
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '6px',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '20px' }}>
            Join us and start shopping
          </p>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Inline Success Message */}
          {successMessage && (
            <div className="success-message" role="status">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="register-username">
                Username
              </label>
              <input
                id="register-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`form-input ${fieldErrors.username ? 'error' : ''}`}
                placeholder="Enter your username"
                autoComplete="username"
                style={{ height: '40px', fontSize: '0.9rem' }}
              />
              {fieldErrors.username && <div className="form-error">{fieldErrors.username}</div>}
            </div>

            {/* Email Address */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
                style={{ height: '40px', fontSize: '0.9rem' }}
              />
              {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="register-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  style={{ height: '40px', fontSize: '0.9rem', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {fieldErrors.password && <div className="form-error">{fieldErrors.password}</div>}
            </div>

            {/* Role Dropdown */}
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" htmlFor="register-role">
                Role
              </label>
              <select
                id="register-role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
                style={{ height: '40px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>

            {/* Full-width Sign Up Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-full btn-lg"
              style={{
                height: '46px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-brand-primary)', fontWeight: 700 }}>
              Login
            </Link>
          </div>
        </div>

        {/* Right Column: Decorative Lifestyle Side */}
        <div
          className="register-visual-side"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderLeft: '1px solid var(--border-light)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '24px',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
              alt="Lifestyle Everyday Living"
              style={{ width: '100%', height: '280px', objectFit: 'cover' }}
            />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Shop Smarter,
            <br />
            Live Better
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.5' }}>
            Join thousands of smart shoppers enjoying transparent pricing, genuine reviews, and seamless returns.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .register-visual-side {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
