import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { clearSession } from '../../api/api';
import logo from '../../assets/logo.png';
import avatar from '../../assets/avatar.png';
import './Admin.css';
import { ArrowLeft, BarChart3, CalendarDays, FileText, Home, LogOut, Users } from 'lucide-react';

export default function AdminLayout({ children, activePage }) {
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isRTL = lang === 'ar';

  const labels = {
    roleAdmin: lang === 'ar' ? 'مسؤول' : 'Administrateur',
    dashboard: lang === 'ar' ? 'لوحة التحكم' : 'Tableau de bord',
    analytics: lang === 'ar' ? 'التحليلات' : 'Analyses',
    demandes: lang === 'ar' ? 'الطلبات' : 'Demandes',
    rendezvous: lang === 'ar' ? 'المواعيد' : 'Rendez-vous',
    users: lang === 'ar' ? 'المستخدمون' : 'Utilisateurs',
    back: lang === 'ar' ? 'رجوع للموقع' : 'Retour au site',
    logout: lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion',
  };

  const navItems = [
    { id: '/admin', page: 'admin-dashboard', label: labels.dashboard, icon: <Home size={18} /> },
    { id: '/admin/analytics', page: 'admin-analytics', label: labels.analytics, icon: <BarChart3 size={18} /> },
    { id: '/admin/demandes', page: 'admin-demandes', label: labels.demandes, icon: <FileText size={18} /> },
    { id: '/admin/rendezvous', page: 'admin-rendezvous', label: labels.rendezvous, icon: <CalendarDays size={18} /> },
    { id: '/admin/users', page: 'admin-users', label: labels.users, icon: <Users size={18} /> },
  ];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      clearSession();
      logout();
      navigate('/');
    }
  };

  return (
    <div className="admin-wrapper" dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src={logo} alt="Watiqa" className="admin-sidebar-logo" />
          <div className="admin-sidebar-role">{labels.roleAdmin}</div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Administration">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`admin-nav-item ${activePage === item.page ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={() => navigate('/')} className="admin-btn-outline">
            <ArrowLeft size={16} /> {labels.back}
          </button>
          <button onClick={handleLogout} className="admin-btn-danger">
            <LogOut size={16} /> {labels.logout}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h2 className="admin-page-title">
            {navItems.find(item => item.page === activePage)?.label}
          </h2>

          <div className="admin-header-actions">
            <div className="lang-toggle">
              <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
              <button className={`lang-btn ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>ع</button>
            </div>

            <div className="admin-user-profile">
              <div className="admin-user-info" style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <span className="admin-user-name">{user?.name}</span>
                <span className="admin-user-email">{user?.email}</span>
              </div>
              <div className="admin-avatar-wrap">
                <img src={avatar} alt="admin" className="admin-avatar" />
                <div className="admin-status-dot"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
