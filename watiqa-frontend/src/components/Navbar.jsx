import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.png';
import emblem from '../assets/emblem.png';
import avatar from '../assets/avatar.png';
import logoutIcon from '../assets/logout.png';
import api from '../api/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const tr = useT(lang);
  const isRTL = lang === 'ar';
  const dashboardLabel = lang === 'ar' ? 'لوحة التحكم' : 'Dashboard';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleUserIcon = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      logout();
      navigate('/');
      setShowUserMenu(false);
    }
  };

  return (
    <nav className="navbar" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="nav-logo" onClick={() => navigate('/')}>
        <img src={logo} alt="Watiqa" style={{ height: '100px', objectFit: 'contain' }} />
      </div>

      <div className="nav-links">
        <button className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          {tr.home}
        </button>

        <div className="nav-dropdown">
          <button className={`nav-link ${isActive('/guichet') ? 'active' : ''}`} onClick={() => navigate('/guichet')}>
            {tr.guichet}
          </button>

          <div className="nav-dropdown-content">
            {tr.docs && Object.entries(tr.docs).map(([key, doc]) => (
              <div key={key} className="dropdown-item" onClick={() => navigate(`/form-${key}`)}>
                <span>{doc.icon}</span>
                <span>{doc.title}</span>
              </div>
            ))}
          </div>
        </div>

        {user?.role !== 'admin' && (
          <>
            <button className={`nav-link ${isActive('/suivi') ? 'active' : ''}`} onClick={() => navigate('/suivi')}>
              {tr.suivi}
            </button>

            <button className={`nav-link ${isActive('/rendezvous') ? 'active' : ''}`} onClick={() => navigate('/rendezvous')}>
              {tr.rendezvous}
            </button>
          </>
        )}

        <button className={`nav-link ${isActive('/assistant') ? 'active' : ''}`} onClick={() => navigate('/assistant')}>
          {tr.assistant}
        </button>

        {user?.role === 'admin' && (
          <button className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => navigate('/admin')}>
            {dashboardLabel}
          </button>
        )}
      </div>

      <div className="nav-actions">
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
          <button className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>ع</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }} ref={menuRef}>
          {user && (
            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {user.name}
            </span>
          )}

          {!user ? (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              {tr.se_connecter}
            </button>
          ) : (
            <button
              className="nav-icon-btn"
              onClick={handleUserIcon}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <img src={avatar} alt="user" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          )}

          {user && showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: isRTL ? 'auto' : 0,
                left: isRTL ? 0 : 'auto',
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                padding: '6px',
                minWidth: '180px',
                border: '1px solid #eee',
                zIndex: 50
              }}
            >
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setShowUserMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: '#edf7f1',
                    color: '#1a4a2e',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginBottom: '6px',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                >
                  {dashboardLabel}
                </button>
              )}

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  background: '#fff5f5',
                  color: '#c53030',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <img src={logoutIcon} alt="logout" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                {tr.logout}
              </button>
            </div>
          )}
        </div>

        <img src={emblem} alt="Maroc" style={{ height: '42px' }} />
      </div>
    </nav>
  );
}
