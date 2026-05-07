import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';

export default function AdminDemandesPage() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  const labels = {
    loading: lang === 'ar' ? 'جار التحميل...' : 'Chargement...',
    empty: lang === 'ar' ? 'لا توجد طلبات حاليا' : 'Aucune demande pour le moment',
    tracking: lang === 'ar' ? 'رقم التتبع' : 'Suivi',
    citizen: lang === 'ar' ? 'المواطن' : 'Citoyen',
    document: lang === 'ar' ? 'الوثيقة' : 'Document',
    status: lang === 'ar' ? 'الحالة' : 'Statut',
    actions: lang === 'ar' ? 'تغيير الحالة' : 'Changer le statut',
    updatedError: lang === 'ar' ? 'تعذر تحديث الحالة' : 'Erreur lors de la mise à jour du statut',
  };

  const documentLabels = {
    naissance: lang === 'ar' ? 'رسم الولادة' : 'Acte de naissance',
    deces: lang === 'ar' ? 'رسم الوفاة' : 'Acte de décès',
    celibat: lang === 'ar' ? 'شهادة العزوبة' : 'Certificat de célibat',
    residence: lang === 'ar' ? 'شهادة السكنى' : 'Certificat de résidence',
    vie: lang === 'ar' ? 'شهادة الحياة' : 'Certificat de vie',
    casier_judiciaire: lang === 'ar' ? 'السجل العدلي' : 'Casier judiciaire',
  };

  const statusLabels = {
    en_attente: lang === 'ar' ? 'في الانتظار' : 'En attente',
    en_traitement: lang === 'ar' ? 'قيد المعالجة' : 'En traitement',
    approuve: lang === 'ar' ? 'مقبول' : 'Approuvé',
    rejete: lang === 'ar' ? 'مرفوض' : 'Rejeté',
  };

  const statusOptions = ['en_attente', 'en_traitement', 'approuve', 'rejete'];

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/demandes');
      setDemandes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleUpdateStatus = async (id, statut) => {
    try {
      await api.patch(`/admin/demandes/${id}/statut`, { statut });
      fetchDemandes();
    } catch (e) {
      alert(labels.updatedError);
    }
  };

  const getStatusBadge = (status) => {
    const pillClass = {
      en_attente: 'pill-warning',
      en_traitement: 'pill-info',
      approuve: 'pill-success',
      rejete: 'pill-danger',
    }[status] || 'pill-default';

    return <span className={`admin-pill ${pillClass}`}>{statusLabels[status] || status}</span>;
  };

  return (
    <AdminLayout activePage="admin-demandes">
      <div className="admin-table-container fade-in">
        {loading ? (
          <div className="admin-empty-state">
            <div className="spinner admin-spinner"></div>
            <div>{labels.loading}</div>
          </div>
        ) : demandes.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">Documents</div>
            <div>{labels.empty}</div>
          </div>
        ) : (
          <table className="admin-table" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <thead>
              <tr>
                <th>{labels.tracking}</th>
                <th>{labels.citizen}</th>
                <th>{labels.document}</th>
                <th>{labels.status}</th>
                <th>{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map(d => (
                <tr key={d.id}>
                  <td className="admin-td-id">{d.numero_suivi}</td>
                  <td className="admin-td-name">{d.user?.name || d.data?.nom_complet || d.data?.firstname || 'N/A'}</td>
                  <td>{documentLabels[d.type] || d.type}</td>
                  <td>{getStatusBadge(d.statut)}</td>
                  <td>
                    <select
                      className="admin-select"
                      value={d.statut}
                      onChange={(e) => handleUpdateStatus(d.id, e.target.value)}
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
