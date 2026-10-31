import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconCart, IconEye, IconEyeOff } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedUsername = formData.username.trim();
    const password = formData.password;

    if (!trimmedUsername && !password) {
      setErrorMessage('Username and password are required.');
      errors.username = 'Username is required';
      errors.password = 'Password is required';
      setFieldErrors(errors);
      return false;
    }

    if (!trimmedUsername) {
      errors.username = 'Username is required';
      setErrorMessage('Username is required.');
    }

    if (!password) {
      errors.password = 'Password is required';
      if (!errors.username) {
        setErrorMessage('Password is required.');
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(formData.username, formData.password, { silent: true });
      const role = (res?.role || res?.user?.role || '').toUpperCase();
      if (role === 'ADMIN') {
        navigate('/adminhome');
      } else {
        navigate('/customerhome');
      }
    } catch (err) {
      const status = err.status || err?.data?.status;
      if (status === 401 || status === 400) {
        setErrorMessage('Invalid username or password.');
      } else {
        setErrorMessage(err.message || 'Invalid username or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="login-page-container container"
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
        <div style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Brand Logo Header */}
          <div style={{ marginBottom: '24px' }}>
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
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '24px' }}>
            Sign in to continue to your account
          </p>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" htmlFor="login-username">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`form-input ${fieldErrors.username ? 'error' : ''}`}
                placeholder="Enter your username"
                autoComplete="username"
                style={{ height: '42px', fontSize: '0.9375rem' }}
              />
              {fieldErrors.username && <div className="form-error">{fieldErrors.username}</div>}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ height: '42px', fontSize: '0.9375rem', paddingRight: '40px' }}
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

            {/* Full-width Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-full btn-lg"
              style={{
                height: '46px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
              }}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            New user?{' '}
            <Link to="/register" style={{ color: 'var(--color-brand-primary)', fontWeight: 700 }}>
              Create an account
            </Link>
          </div>
        </div>

        {/* Right Column: Decorative Lifestyle Side */}
        <div
          className="login-visual-side"
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
              src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80"
              alt="Lifestyle Everyday Essentials"
              style={{ width: '100%', height: '280px', objectFit: 'cover' }}
            />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Better Products
            <br />
            For A Brighter You
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.5' }}>
            Curated everyday retail essentials with direct warranty and nationwide doorstep delivery.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-visual-side {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
