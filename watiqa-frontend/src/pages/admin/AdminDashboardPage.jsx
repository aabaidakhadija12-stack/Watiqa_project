import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';
import { CalendarDays, Clock, FileText, Users } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function AdminDashboardPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, demandes: 0, demandes_en_cours: 0, rendezvous: 0, rendezvous_confirmed: 0, rendezvous_cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const labels = {
    users: lang === 'ar' ? 'المستخدمون' : 'Utilisateurs',
    demandes: lang === 'ar' ? 'الطلبات' : 'Demandes',
    pending: lang === 'ar' ? 'قيد المعالجة' : 'En cours',
    rdv: lang === 'ar' ? 'المواعيد' : 'Rendez-vous',
    graphTitle: lang === 'ar' ? 'إحصائيات الطلبات والمواعيد' : 'Statistiques des demandes et rendez-vous',
    graphDesc: lang === 'ar' ? 'عرض منظّم لحالة الطلبات والمواعيد الحالية في لوحة التحكم.' : "Visualisez l'évolution des demandes et rendez-vous clés dans un aperçu clair.",
    graphRequests: lang === 'ar' ? 'الطلبات' : 'Demandes',
    graphAppointments: lang === 'ar' ? 'المواعيد' : 'Rendez-vous',
    graphConfirmed: lang === 'ar' ? 'المؤكدة' : 'Confirmés',
    graphCancelled: lang === 'ar' ? 'الملغاة' : 'Annulés',
    graphPending: lang === 'ar' ? 'قيد الانتظار' : 'En attente',
    graphSummaryAppointments: lang === 'ar' ? 'عدد المواعيد' : 'Nombre de rendez-vous',
    graphSummaryDocuments: lang === 'ar' ? 'عدد الوثائق' : 'Nombre de documents',
    graphLegendInfo: lang === 'ar' ? 'هذا العرض يعطيك نظرة سريعة على حالة البيانات والمواعيد' : "Cette vue vous donne un aperçu rapide des données et de l'état des rendez-vous.",
    title: lang === 'ar' ? 'مرحبا بك في فضاء الإدارة' : "Bienvenue dans l'espace d'administration",
    desc: lang === 'ar'
      ? 'تابع الطلبات، حدّث حالتها، وادِر حسابات المستخدمين من لوحة واضحة وآمنة.'
      : 'Suivez les demandes, mettez à jour leur statut et gérez les comptes utilisateurs depuis un tableau clair et sécurisé.',
    monthlyTrend: lang === 'ar' ? 'منحنى الطلبات' : 'Tendance mensuelle',
    monthlyEvolution: lang === 'ar' ? 'تطور البيانات الشهري' : 'Évolution mensuelle des demandes',
    requestUnit: lang === 'ar' ? 'طلب' : 'demande(s)',
  };

  const kpiCards = [
    { title: labels.rdv, value: stats.rendezvous, icon: <CalendarDays size={18} />, path: '/admin/rendezvous' },
    { title: labels.pending, value: stats.demandes_en_cours, icon: <Clock size={18} />, path: '/admin/demandes' },
    { title: labels.demandes, value: stats.demandes, icon: <FileText size={18} />, path: '/admin/demandes' },
    { title: labels.users, value: stats.users, icon: <Users size={18} />, path: '/admin/users' },
  ];

  const chartLabels = lang === 'ar'
    ? ['يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس', 'يناير', 'فبر', 'مار', 'أبر', 'ماي']
    : ['Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
  const chartValues = [12, 14, 13, 15, 14, 16, 15, 45, 48, 50, 55, 60];

  const trendPercentage = 300;

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: labels.graphRequests,
        data: chartValues,
        borderColor: '#2ec27e',
        backgroundColor: 'rgba(46,194,126,0.08)',
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: '#2ec27e',
        pointHoverBackgroundColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#ffffff',
        borderColor: 'rgba(46,194,126,0.3)',
        borderWidth: 1,
        titleColor: '#065f46',
        bodyColor: '#111827',
        displayColors: false,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.parsed.y} ${labels.requestUnit}`,
        },
      },
    },
    scales: {
      x: {
        reverse: true,
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Segoe UI, sans-serif', size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 248, 235, 0.8)', borderDash: [3, 3] },
        border: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Segoe UI, sans-serif', size: 12 } },
      },
    },
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
      {/* KPI Cards */}
      <div className="dashboard-kpi-grid">
        {kpiCards.map((card) => (
          <button
            key={card.title}
            type="button"
            className="kpi-card kpi-card-link"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onClick={() => navigate(card.path)}
          >
            <div className="kpi-left-border"></div>
            <div className="kpi-icon">{card.icon}</div>
            <div className="kpi-content">
              <div className="kpi-title">{card.title}</div>
              <div className="kpi-value">{loading ? '...' : card.value}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Statistics Section */}
      <section className="dashboard-stats-section">
        <h3 className="dashboard-section-title">{labels.graphTitle}</h3>

        <div className="dashboard-summary-grid">
          <div className="dashboard-summary-card">
            <div className="dashboard-summary-value">{loading ? '...' : stats.rendezvous}</div>
            <div className="dashboard-summary-label">{labels.graphSummaryAppointments}</div>
          </div>
          <div className="dashboard-summary-card">
            <div className="dashboard-summary-value">{loading ? '...' : stats.demandes}</div>
            <div className="dashboard-summary-label">{labels.graphSummaryDocuments}</div>
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div className="dashboard-chart-title-section">
              <h4 className="dashboard-chart-title">{labels.monthlyTrend}</h4>
              <p className="dashboard-chart-description">{labels.monthlyEvolution}</p>
            </div>
            <div className="dashboard-growth-badge">{trendPercentage > 0 ? '+' : ''}{trendPercentage}%</div>
          </div>

          <div className="dashboard-chart-wrapper">
            <Line data={chartData} options={chartOptions} height={160} />
          </div>
        </div>
      </section>

      {/* Welcome Banner */}
      <section className="dashboard-welcome-banner">
        <span className="banner-badge">WATIQA ADMIN</span>
        <h2>{labels.title}</h2>
        <p>{labels.desc}</p>
      </section>
    </AdminLayout>
  );
}
