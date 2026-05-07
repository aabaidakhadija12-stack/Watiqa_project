import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';
import { CalendarDays, Clock, FileText, Users } from 'lucide-react';

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, demandes: 0, demandes_en_cours: 0, rendezvous: 0 });
  const [loading, setLoading] = useState(true);

  const labels = {
    users: lang === 'ar' ? 'المستخدمون' : 'Utilisateurs',
    demandes: lang === 'ar' ? 'الطلبات' : 'Demandes',
    pending: lang === 'ar' ? 'قيد المعالجة' : 'En cours',
    rdv: lang === 'ar' ? 'المواعيد' : 'Rendez-vous',
    title: lang === 'ar' ? 'مرحبا بك في فضاء الإدارة' : "Bienvenue dans l'espace d'administration",
    desc: lang === 'ar'
      ? 'تابع الطلبات، حدّث حالتها، وادِر حسابات المستخدمين من لوحة واضحة وآمنة.'
      : 'Suivez les demandes, mettez à jour leur statut et gérez les comptes utilisateurs depuis un tableau clair et sécurisé.',
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout activePage="admin-dashboard">
      <div className="admin-stats-grid fade-in">
        <StatCard title={labels.users} value={loading ? '...' : stats.users} icon={<Users />} tone="green" onClick={() => navigate('/admin/users')} />
        <StatCard title={labels.demandes} value={loading ? '...' : stats.demandes} icon={<FileText />} tone="blue" onClick={() => navigate('/admin/demandes')} />
        <StatCard title={labels.pending} value={loading ? '...' : stats.demandes_en_cours} icon={<Clock />} tone="gold" onClick={() => navigate('/admin/demandes')} />
        <StatCard title={labels.rdv} value={loading ? '...' : stats.rendezvous} icon={<CalendarDays />} tone="red" onClick={() => navigate('/admin/rendezvous')} />
      </div>

      <section className="admin-welcome-panel fade-in">
        <div>
          <span className="admin-eyebrow">Watiqa Admin</span>
          <h3>{labels.title}</h3>
          <p>{labels.desc}</p>
        </div>
      </section>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon, tone, onClick }) {
  return (
    <button type="button" className={`admin-stat-card tone-${tone} admin-stat-link`} onClick={onClick}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-details">
        <div className="admin-stat-title">{title}</div>
        <div className="admin-stat-value">{value}</div>
      </div>
    </button>
  );
}
