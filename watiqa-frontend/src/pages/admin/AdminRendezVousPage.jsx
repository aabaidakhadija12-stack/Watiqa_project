import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';

const statusOptions = ['en_attente', 'confirme', 'annule', 'passe'];

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
    motif: lang === 'ar' ? 'الجماعة' : 'Commune',
    status: lang === 'ar' ? 'الحالة' : 'Statut',
    actions: lang === 'ar' ? 'قرار الإدارة' : 'Decision admin',
    updatedError: lang === 'ar' ? 'تعذر تحديث الموعد' : 'Erreur lors de la mise a jour du rendez-vous',
  };

  const statusLabels = {
    en_attente: lang === 'ar' ? 'في انتظار التحقق' : 'En attente',
    confirme: lang === 'ar' ? 'مؤكد' : 'Confirme',
    annule: lang === 'ar' ? 'ملغى' : 'Annule',
    passe: lang === 'ar' ? 'مر عليه الوقت' : 'Passe',
  };

  const fetchRendezVous = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/rendezvous');
      setRendezvous(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRendezVous();
  }, []);

  const handleUpdateStatus = async (id, statut) => {
    try {
      await api.patch(`/admin/rendezvous/${id}/statut`, { statut });
      fetchRendezVous();
    } catch (e) {
      alert(e.response?.data?.message || labels.updatedError);
    }
  };

  const getStatusBadge = (status) => {
    const pillClass = {
      en_attente: 'pill-warning',
      confirme: 'pill-success',
      annule: 'pill-danger',
      passe: 'pill-info',
    }[status] || 'pill-default';

    return <span className={`admin-pill ${pillClass}`}>{statusLabels[status] || status}</span>;
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
                <th>{labels.actions}</th>
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
                  <td>
                    <select
                      className="admin-select"
                      value={rdv.statut}
                      disabled={rdv.statut === 'passe'}
                      onChange={(e) => handleUpdateStatus(rdv.id, e.target.value)}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{statusLabels[status]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
