import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Map month names FR -> AR
const MONTH_TRANSLATIONS = {
  'Janvier': 'يناير', 'janvier': 'يناير', 'Jan': 'يناير', 'jan': 'يناير',
  'Février': 'فبراير', 'février': 'فبراير', 'Fév': 'فبراير', 'fév': 'فبراير', 'Feb': 'فبراير',
  'Mars': 'مارس', 'mars': 'مارس', 'Mar': 'مارس',
  'Avril': 'أبريل', 'avril': 'أبريل', 'Avr': 'أبريل', 'Apr': 'أبريل',
  'Mai': 'ماي', 'mai': 'ماي', 'May': 'ماي',
  'Juin': 'يونيو', 'juin': 'يونيو', 'Jun': 'يونيو',
  'Juillet': 'يوليوز', 'juillet': 'يوليوز', 'Juil': 'يوليوز', 'Jul': 'يوليوز',
  'Août': 'غشت', 'août': 'غشت', 'Aoû': 'غشت', 'Aug': 'غشت',
  'Septembre': 'شتنبر', 'septembre': 'شتنبر', 'Sep': 'شتنبر',
  'Octobre': 'أكتوبر', 'octobre': 'أكتوبر', 'Oct': 'أكتوبر',
  'Novembre': 'نونبر', 'novembre': 'نونبر', 'Nov': 'نونبر',
  'Décembre': 'دجنبر', 'décembre': 'دجنبر', 'Déc': 'دجنبر', 'Dec': 'دجنبر',
};

function translateMonth(label, lang) {
  if (lang !== 'ar') return label;
  // Try direct match first
  if (MONTH_TRANSLATIONS[label]) return MONTH_TRANSLATIONS[label];
  // Try to find a matching key inside the label (e.g. "Janvier 2025")
  for (const [fr, ar] of Object.entries(MONTH_TRANSLATIONS)) {
    if (label.includes(fr)) return label.replace(fr, ar);
  }
  return label;
}

export default function AdminAnalyticsPage() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState({ demandes_by_month: [] });
  const [loading, setLoading] = useState(true);

  const labels = {
    title: lang === 'ar' ? 'لوحة التحليلات' : ' Dashboard analytique',
    subtitle: lang === 'ar' ? 'تحليل بيانات الطلبات والمواعيد' : 'Analyser les données des demandes et des rendez-vous',
    totalRequests: lang === 'ar' ? 'إجمالي الطلبات' : 'Nombre total de demandes',
    peakMonth: lang === 'ar' ? 'الشهر الأعلى' : 'Mois le plus chargé',
    monthlyTrend: lang === 'ar' ? 'الاتجاه الشهري' : 'Tendance mensuelle',
    loadingChart: lang === 'ar' ? 'جار تحميل الرسم البياني...' : 'Chargement du graphique...',
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

  const monthlyData = stats.demandes_by_month || [];
  const totalRequests = monthlyData.reduce((sum, item) => sum + item.count, 0);
  const peakMonth = monthlyData.reduce((max, item) => item.count > max.count ? item : max, { count: 0, label: '' });

  // Translate month labels based on current language
  const translatedLabels = monthlyData.map(item => translateMonth(item.label, lang));
  const translatedPeakLabel = translateMonth(peakMonth.label, lang);

  const chartData = {
    labels: translatedLabels,
    datasets: [
      {
        label: labels.totalRequests,
        data: monthlyData.map(item => item.count),
        backgroundColor: 'rgba(175, 250, 209, 0.75)',
        borderColor: 'rgb(154, 234, 190)',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(46, 194, 126, 0.9)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return `${labels.monthlyTrend} - ${context[0].label}`;
          },
          label: function(context) {
            return `${labels.totalRequests}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', lineWidth: 1 },
        ticks: { color: '#6b7280', font: { size: 12 }, callback: (v) => v },
      },
    },
    elements: { bar: { borderRadius: 8 } },
  };

  return (
    <AdminLayout activePage="admin-analytics">
      <div className="analytics-header">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </div>

      <div className="analytics-metrics-grid">
        <div className="analytics-metric-card">
          <div className="analytics-metric-value">{loading ? '...' : totalRequests}</div>
          <div className="analytics-metric-label">{labels.totalRequests}</div>
        </div>
        <div className="analytics-metric-card">
          <div className="analytics-metric-value">{loading ? '...' : translatedPeakLabel}</div>
          <div className="analytics-metric-label">{labels.peakMonth}</div>
        </div>
      </div>

      <div className="analytics-chart-card">
        <div className="analytics-chart-header">
          <h3>{labels.monthlyTrend}</h3>
        </div>
        <div className="analytics-chart-container">
          {loading ? (
            <div className="analytics-loading">{labels.loadingChart}</div>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
