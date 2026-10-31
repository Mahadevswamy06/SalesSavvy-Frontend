import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import apiClient from '../api/apiClient';
import { IconClose, IconUser } from '../components/common/Icons';

const AuthContext = createContext(null);

export const AuthPromptModal = ({ isOpen, closePrompt, goToLogin, goToRegister, promptMessage }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closePrompt();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closePrompt]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closePrompt}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 99999,
        animation: 'modalFadeIn 0.2s ease-out',
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '18px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary)',
          padding: '32px 28px 28px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
          textAlign: 'center',
          animation: 'modalSlideUp 0.22s ease-out',
        }}
      >
        <button
          type="button"
          onClick={closePrompt}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <IconClose size={20} />
        </button>

        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(3, 105, 161, 0.12)',
            color: 'var(--color-brand-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
        >
          <IconUser size={28} />
        </div>

        <h2
          id="auth-prompt-title"
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '8px',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Sign in to continue
        </h2>
        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
            marginBottom: '26px',
            padding: '0 8px',
          }}
        >
          {promptMessage}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={goToLogin}
            className="btn btn-primary btn-full"
            style={{
              height: '44px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={goToRegister}
            className="btn btn-secondary btn-full"
            style={{
              height: '44px',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
            }}
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={closePrompt}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px',
              marginTop: '4px',
              transition: 'color var(--transition-fast)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('salesavvy_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('salesavvy_token') || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Auth prompt modal state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState('/shop');
  const [promptMessage, setPromptMessage] = useState(
    'Please sign in to your Sales Savvy account to continue with this action.'
  );

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('salesavvy_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('salesavvy_user');
      }
    } catch (e) {
      console.warn('Failed to sync user to localStorage', e);
    }
  }, [user]);

  // Sync token state to localStorage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('salesavvy_token', token);
      } else {
        localStorage.removeItem('salesavvy_token');
      }
    } catch (e) {
      console.warn('Failed to sync token to localStorage', e);
    }
  }, [token]);

  // Sync profile on mount when a user session exists. This project authenticates
  // requests with the HTTP-only authToken cookie, so a localStorage Bearer token
  // may not exist even after a successful login.
  useEffect(() => {
    const syncProfile = async () => {
      if (!user) return;
      try {
        const profile = await apiClient.get('/users/profile');
        if (profile) {
          setUser((prev) => ({
            ...prev,
            id: profile.id || profile.userId || prev?.id,
            username: profile.username,
            name: profile.name || profile.username,
            email: profile.email,
            role: profile.role,
            createdAt: profile.createdAt,
          }));
        }
      } catch {
        // silent sync fallback
      }
    };
    syncProfile();
  }, [user?.id]);

  // Login handler connected to real Spring Boot API
  const login = async (usernameOrEmail, password, options = {}) => {
    setLoading(true);
    try {
      const data = await apiClient.post('/auth/login', {
        username: usernameOrEmail.trim(),
        password: password,
      });

      const cleanName = data.username || (usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail);
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      const userData = {
        id: data.id || `usr-${Date.now()}`,
        username: data.username || cleanName,
        name: formattedName,
        email: data.email || (usernameOrEmail.includes('@') ? usernameOrEmail : `${cleanName}@example.com`),
        role: (data.role || 'CUSTOMER').toUpperCase(),
        phone: data.phone || '+91 98765 43210',
        memberSince: 'October 2026',
      };

      setUser(userData);
      // This backend currently authenticates with the HTTP-only authToken cookie
      // and does not include a token in the login JSON response.
      setToken(data.token || null);
      if (!options?.silent) {
        showToast(`Welcome back, ${userData.name}!`, 'success');
      }
      return { success: true, user: userData, role: userData.role };
    } catch (err) {
      const errorMsg = err.message || 'Unable to connect to authentication server. Please check your connection.';
      if (!options?.silent) {
        showToast(errorMsg, 'error');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register handler connected to real Spring Boot API
  const register = async ({ fullName, username, email, password, role = 'CUSTOMER' }, options = {}) => {
    setLoading(true);
    try {
      const chosenUsername = (username || fullName || email.split('@')[0]).trim().replace(/\s+/g, '_');
      const requestedRole = (role || 'CUSTOMER').toUpperCase();

      // Security requirement: public registration must ALWAYS create a CUSTOMER account,
      // regardless of any role value sent from the frontend.
      // Admin account creation cannot be obtained via public registration.
      const assignedRole = (user && user.role === 'ADMIN' && requestedRole === 'ADMIN') ? 'ADMIN' : 'CUSTOMER';

      const payload = {
        username: chosenUsername,
        email: email.trim(),
        password: password,
        role: assignedRole,
      };

      const data = await apiClient.post('/users/register', payload);

      if (!options?.silent) {
        showToast('Account created successfully! Please sign in with your credentials.', 'success');
      }
      return { success: true, data };
    } catch (err) {
      const errorMsg = err.message || 'Unable to reach registration server. Please try again.';
      if (!options?.silent) {
        showToast(errorMsg, 'error');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Profile update handler connected to real Spring Boot API
  const updateProfile = async (updatedFields) => {
    setLoading(true);
    try {
      if (!user) throw new Error('Please sign in again before updating your profile.');
      const profile = await apiClient.put('/users/profile', updatedFields);
      if (!profile) throw new Error('The server did not return the updated profile.');
      const next = { ...(user || {}), ...profile, ...updatedFields,
        id: profile.id || profile.userId || user?.id,
        username: profile.username || updatedFields.username || user?.username,
        name: profile.name || updatedFields.name || user?.name,
        email: profile.email || updatedFields.email || user?.email };
      setUser(next);
      try { localStorage.setItem('salesavvy_user', JSON.stringify(next)); } catch {}
      const isAddressOnlyUpdate = ['address', 'city', 'state', 'pincode'].some((key) => Object.prototype.hasOwnProperty.call(updatedFields, key)) && !Object.prototype.hasOwnProperty.call(updatedFields, 'email') && !Object.prototype.hasOwnProperty.call(updatedFields, 'username');
      showToast(isAddressOnlyUpdate ? 'Delivery address saved successfully!' : 'Profile details saved successfully!', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Unable to save profile changes to the server.', 'error');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler connected to real Spring Boot API
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }

    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('salesavvy_user');
      localStorage.removeItem('salesavvy_token');
    } catch {}
    showToast('You have been signed out successfully.', 'info');
  };

  // Require authentication prompt helper
  const requireAuth = useCallback(
    (destination = '/shop', customMessage = null) => {
      if (user) {
        return true;
      }
      setIntendedDestination(destination);
      if (customMessage) {
        setPromptMessage(customMessage);
      } else {
        setPromptMessage('Please sign in to your Sales Savvy account to continue with this action.');
      }
      setIsPromptOpen(true);
      return false;
    },
    [user]
  );

  const closePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  const goToLogin = useCallback(() => {
    setIsPromptOpen(false);
    navigate(`/login?redirect=${encodeURIComponent(intendedDestination)}`);
  }, [intendedDestination, navigate]);

  const goToRegister = useCallback(() => {
    setIsPromptOpen(false);
    navigate(`/register?redirect=${encodeURIComponent(intendedDestination)}`);
  }, [intendedDestination, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        updateProfile,
        logout,
        requireAuth,
        isPromptOpen,
        closePrompt,
        goToLogin,
        goToRegister,
        promptMessage,
        intendedDestination,
      }}
    >
      {children}
      <AuthPromptModal
        isOpen={isPromptOpen}
        closePrompt={closePrompt}
        goToLogin={goToLogin}
        goToRegister={goToRegister}
        promptMessage={promptMessage}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Seamless alias so existing useAuthPrompt imports continue to work seamlessly
export const useAuthPrompt = useAuth;

export default AuthContext;
