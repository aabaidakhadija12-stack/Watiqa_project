import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';

export default function AdminRendezVousPage() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);

  const labels = {
    loading: lang === 'ar' ? 'جار التحميل...' : 'Chargement...',
    empty: lang === 'ar' ? 'لا توجد مواعيد حاليا' : 'Aucun rendez-vous pour le moment',
    citizen: lang === 'ar' ? 'المواطن' : 'Citoyen',
    email: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
    date: lang === 'ar' ? 'التاريخ' : 'Date',
    time: lang === 'ar' ? 'الوقت' : 'Heure',
    service: lang === 'ar' ? 'الخدمة' : 'Service',
    motif: lang === 'ar' ? 'السبب' : 'Motif',
    status: lang === 'ar' ? 'الحالة' : 'Statut',
    confirmed: lang === 'ar' ? 'مؤكد' : 'Confirmé',
    cancelled: lang === 'ar' ? 'ملغى' : 'Annulé',
  };

  useEffect(() => {
    const fetchRendezVous = async () => {
      try {
        const res = await api.get('/admin/rendezvous');
        setRendezvous(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRendezVous();
  }, []);

  const getStatusBadge = (status) => {
    const isCancelled = status === 'annule';
    return (
      <span className={`admin-pill ${isCancelled ? 'pill-danger' : 'pill-success'}`}>
        {isCancelled ? labels.cancelled : labels.confirmed}
      </span>
    );
  };

  return (
    <AdminLayout activePage="admin-rendezvous">
      <div className="admin-table-container fade-in">
        {loading ? (
          <div className="admin-empty-state">
            <div className="spinner admin-spinner"></div>
            <div>{labels.loading}</div>
          </div>
        ) : rendezvous.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">Rendez-vous</div>
            <div>{labels.empty}</div>
          </div>
        ) : (
          <table className="admin-table" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <thead>
              <tr>
                <th>{labels.citizen}</th>
                <th>{labels.email}</th>
                <th>{labels.date}</th>
                <th>{labels.time}</th>
                <th>{labels.service}</th>
                <th>{labels.motif}</th>
                <th>{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {rendezvous.map(rdv => (
                <tr key={rdv.id}>
                  <td className="admin-td-name">{rdv.user?.name || 'N/A'}</td>
                  <td style={{ color: 'var(--text-mid)' }}>{rdv.user?.email || '-'}</td>
                  <td>{rdv.date_rdv}</td>
                  <td>{rdv.heure_rdv}</td>
                  <td>{rdv.service || '-'}</td>
                  <td>{rdv.motif || '-'}</td>
                  <td>{getStatusBadge(rdv.statut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
