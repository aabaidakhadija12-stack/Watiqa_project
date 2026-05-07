import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

export default function SuiviPage() {
  const { lang } = useLanguage();
  const tr = useT(lang);
  const isRTL = lang === 'ar';

  const [search, setSearch] = useState('');
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);

  const labels = {
    loading: lang === 'ar' ? 'جار التحميل...' : 'Chargement...',
    empty: lang === 'ar' ? 'لا يوجد أي ملف' : 'Aucun dossier trouvé',
    en_attente: lang === 'ar' ? 'في الانتظار' : 'En attente',
    en_traitement: lang === 'ar' ? 'قيد المعالجة' : 'En traitement',
    approuve: lang === 'ar' ? 'مقبول' : 'Approuvé',
    rejete: lang === 'ar' ? 'مرفوض' : 'Rejeté',
  };

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const res = await api.get('/demandes');
        setDossiers(res.data);
      } catch (error) {
        console.error('Error fetching demandes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDemandes();
  }, []);

  const statusColor = {
    en_attente: '#b7791f',
    en_traitement: '#2b6cb0',
    approuve: '#2d6a4f',
    rejete: '#c53030',
  };

  const statusBg = {
    en_attente: '#fef3c7',
    en_traitement: '#ebf8ff',
    approuve: '#d8f3dc',
    rejete: '#fed7d7',
  };

  const filtered = dossiers.filter(d =>
    (d.numero_suivi && d.numero_suivi.toLowerCase().includes(search.toLowerCase())) ||
    (d.type && d.type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#1a4a2e', marginBottom: '0.75rem' }}>
            {tr.suivi_title}
          </h1>
          <p style={{ color: '#718096' }}>{tr.suivi_sub}</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="input-wrap">
            <input className="form-input" placeholder={tr.search_dossier} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card fade-in" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                {[tr.dossier_num, tr.type, tr.date, tr.status].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: isRTL ? 'right' : 'left', fontWeight: 700, fontSize: '0.82rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d.id || i}
                  style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#1a4a2e', fontSize: '0.875rem', fontFamily: 'monospace' }}>{d.numero_suivi}</td>
                  <td style={{ padding: '1rem', color: '#4a5568', fontSize: '0.875rem' }}>
                    {tr.docs && tr.docs[d.type] ? tr.docs[d.type].title : d.type}
                  </td>
                  <td style={{ padding: '1rem', color: '#718096', fontSize: '0.875rem' }}>
                    {new Date(d.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: statusBg[d.statut] || '#e2e8f0',
                      color: statusColor[d.statut] || '#4a5568'
                    }}>
                      {labels[d.statut] || d.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>{labels.loading}</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#718096' }}>
              <p>{labels.empty}</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
