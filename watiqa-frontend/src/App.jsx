import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GuichetPage from './pages/GuichetPage';
import SuiviPage from './pages/SuiviPage';
import RendezVousPage from './pages/RendezVousPage';
import AssistantPage from './pages/AssistantPage';
import FormNaissance from './pages/forms/FormNaissance';
import FormResidence from './pages/forms/FormResidence';
import FormVie from './pages/forms/FormVie';
import FormCelibat from './pages/forms/FormCelibat';
import FormCasierJudiciaire from './pages/forms/FormCasierJudiciaire';
import FormDeces from './pages/forms/FormDeces';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDemandesPage from './pages/admin/AdminDemandesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRendezVousPage from './pages/admin/AdminRendezVousPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import './App.css';

const ProtectedRoute = ({ children, requireAdmin = false, citizenOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="app flex items-center justify-center min-h-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  if (citizenOnly && user.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
};

const AdminRoute = ({ children }) => {
  return <ProtectedRoute requireAdmin={true}>{children}</ProtectedRoute>;
};

const CitizenRoute = ({ children }) => {
  return <ProtectedRoute citizenOnly={true}>{children}</ProtectedRoute>;
};

const MainApp = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected User Routes */}
        <Route path="/guichet" element={<ProtectedRoute><GuichetPage /></ProtectedRoute>} />
        <Route path="/suivi" element={<CitizenRoute><SuiviPage /></CitizenRoute>} />
        <Route path="/rendezvous" element={<CitizenRoute><RendezVousPage /></CitizenRoute>} />
        
        {/* Forms */}
        <Route path="/form-naissance" element={<ProtectedRoute><FormNaissance /></ProtectedRoute>} />
        <Route path="/form-residence" element={<ProtectedRoute><FormResidence /></ProtectedRoute>} />
        <Route path="/form-vie" element={<ProtectedRoute><FormVie /></ProtectedRoute>} />
        <Route path="/form-celibat" element={<ProtectedRoute><FormCelibat /></ProtectedRoute>} />
        <Route path="/form-casier" element={<ProtectedRoute><FormCasierJudiciaire /></ProtectedRoute>} />
        <Route path="/form-deces" element={<ProtectedRoute><FormDeces /></ProtectedRoute>} />
        
        {/* Public routes */}
        <Route path="/assistant" element={<AssistantPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/demandes" element={<AdminRoute><AdminDemandesPage /></AdminRoute>} />
        <Route path="/admin/rendezvous" element={<AdminRoute><AdminRendezVousPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <MainApp />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
