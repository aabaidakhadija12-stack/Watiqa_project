import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import AdminLayout from './AdminLayout';

export default function AdminUsersPage() {
  const { lang } = useLanguage();
  const { user: currentUser } = useAuth();
  const isRTL = lang === 'ar';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const labels = {
    loading: lang === 'ar' ? 'جار التحميل...' : 'Chargement...',
    empty: lang === 'ar' ? 'لا يوجد مستخدمون حاليا' : 'Aucun utilisateur pour le moment',
    name: lang === 'ar' ? 'الاسم' : 'Nom',
    email: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
    phone: lang === 'ar' ? 'الهاتف' : 'Téléphone',
    cin: lang === 'ar' ? 'البطاقة الوطنية' : 'CIN',
    role: lang === 'ar' ? 'الدور' : 'Rôle',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    admin: lang === 'ar' ? 'مسؤول' : 'Administrateur',
    citizen: lang === 'ar' ? 'مستخدم' : 'Utilisateur',
    self: lang === 'ar' ? 'حسابك الحالي' : 'Compte actuel',
    updatedError: lang === 'ar' ? 'تعذر تحديث الدور' : 'Erreur lors de la mise à jour du rôle',
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      fetchUsers();
    } catch (e) {
      alert(labels.updatedError);
    }
  };

  return (
    <AdminLayout activePage="admin-users">
      <div className="admin-table-container fade-in">
        {loading ? (
          <div className="admin-empty-state">
            <div className="spinner admin-spinner"></div>
            <div>{labels.loading}</div>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">Users</div>
            <div>{labels.empty}</div>
          </div>
        ) : (
          <table className="admin-table" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <thead>
              <tr>
                <th>{labels.name}</th>
                <th>{labels.email}</th>
                <th>{labels.phone}</th>
                <th>{labels.cin}</th>
                <th>{labels.role}</th>
                <th>{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="admin-td-name">{u.name}</td>
                  <td style={{ color: 'var(--text-mid)' }}>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{u.cin || '-'}</td>
                  <td>
                    <span className={`admin-pill ${u.role === 'admin' ? 'pill-role-admin' : 'pill-role-user'}`}>
                      {u.role === 'admin' ? labels.admin : labels.citizen}
                    </span>
                  </td>
                  <td>
                    {u.id !== currentUser?.id ? (
                      <select
                        className="admin-select"
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      >
                        <option value="user">{labels.citizen}</option>
                        <option value="admin">{labels.admin}</option>
                      </select>
                    ) : (
                      <span className="admin-muted">{labels.self}</span>
                    )}
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
