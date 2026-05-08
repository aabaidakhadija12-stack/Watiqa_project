import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';

const communes = ['Agadir Ida Outanane', 'Inzegane', 'Ait Melloul', 'Dcheira El Jihadia', 'Biougra', 'Taroudant'];
const times = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];

const documentLabels = {
  residence: { fr: 'Certificat de résidence', ar: 'شهادة السكنى' },
  naissance: { fr: 'Acte de naissance', ar: 'رسم الولادة' },
  vie: { fr: 'Certificat de vie', ar: 'شهادة الحياة' },
  casier_judiciaire: { fr: 'Casier judiciaire', ar: 'السجل العدلي' },
  celibat: { fr: 'Certificat de célibat', ar: 'شهادة العزوبة' },
  deces: { fr: 'Acte de décès', ar: 'رسم الوفاة' },
};

export default function RendezVousPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const isRTL = lang === 'ar';
  const [form, setForm] = useState({ commune: '', demandeType: '', date: '', time: '' });
  const [demandes, setDemandes] = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const today = new Date().toISOString().split('T')[0];

  const labels = {
    noDemandes: lang === 'ar'
      ? 'يجب إنشاء طلب وثيقة أولا قبل حجز موعد.'
      : 'Vous devez créer une demande de document avant de prendre un rendez-vous.',
    loading: lang === 'ar' ? 'جار تحميل طلباتك...' : 'Chargement de vos demandes...',
    bookError: lang === 'ar' ? 'تعذر حجز الموعد' : 'Impossible de réserver le rendez-vous',
    booking: lang === 'ar' ? 'جار الحجز...' : 'Réservation...',
    confirmed: lang === 'ar' ? 'تم تأكيد الموعد!' : 'Rendez-vous confirmé !',
    bringCin: lang === 'ar' ? 'أحضر بطاقتك الوطنية والوثائق اللازمة.' : 'Pensez à apporter votre CIN et les documents nécessaires.',
    home: lang === 'ar' ? 'الرئيسية' : "Retour à l'accueil",
  };

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const res = await api.get('/demandes');
        setDemandes(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDemandes(false);
      }
    };
    fetchDemandes();
  }, []);

  const availableTypes = useMemo(() => {
    return [...new Set(demandes.map(d => d.type).filter(Boolean))];
  }, [demandes]);

  const availableTimes = useMemo(() => {
    if (form.date !== today) return times;

    const now = new Date();
    return times.filter(time => new Date(`${form.date}T${time}:00`) > now);
  }, [form.date, today]);

  const selectedDocumentLabel = form.demandeType
    ? documentLabels[form.demandeType]?.[lang] || form.demandeType
    : '';

  const handleBook = async () => {
    if (!form.commune || !form.demandeType || !form.date || !form.time) return;

    setBusy(true);
    setError('');

    try {
      await api.post('/rendezvous', {
        date_rdv: form.date,
        heure_rdv: form.time,
        service: selectedDocumentLabel,
        motif: form.commune,
        demande_type: form.demandeType,
      });
      setConfirmed(true);
    } catch (e) {
      const data = e.response?.data;
      setError(data?.message || labels.bookError);
    } finally {
      setBusy(false);
    }
  };

  if (confirmed) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div className="card fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: 480 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#1a4a2e', marginBottom: '1rem' }}>
            {labels.confirmed}
          </h2>
          <div className="alert alert-success" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: '1.5rem', display: 'grid', gap: '0.4rem' }}>
            <div><strong>{form.commune}</strong></div>
            <div>{selectedDocumentLabel}</div>
            <div>{form.date} à {form.time}</div>
          </div>
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            {labels.bringCin}
          </div>
          <button className="btn btn-primary" onClick={() => { setConfirmed(false); navigate('/'); }}>
            {labels.home}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div style={{ padding: '3rem 2rem', maxWidth: '650px', margin: '0 auto' }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#1a4a2e', marginBottom: '0.75rem' }}>
            {tr.rdv_title}
          </h1>
          <p style={{ color: '#718096' }}>{tr.rdv_sub}</p>
        </div>

        <div className="card fade-in" style={{ padding: '2rem' }}>
          {loadingDemandes ? (
            <div className="alert alert-info">{labels.loading}</div>
          ) : availableTypes.length === 0 ? (
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>{labels.noDemandes}</div>
          ) : null}

          <div className="form-group">
            <label className="form-label">{tr.choose_commune}</label>
            <select className="form-select" value={form.commune} onChange={e => set('commune')(e.target.value)}>
              <option value="">-- {tr.choose_commune} --</option>
              {communes.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{tr.choose_service}</label>
            <select
              className="form-select"
              value={form.demandeType}
              onChange={e => set('demandeType')(e.target.value)}
              disabled={availableTypes.length === 0}
            >
              <option value="">-- {tr.choose_service} --</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{documentLabels[type]?.[lang] || type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{tr.choose_date}</label>
            <input type="date" className="form-input no-icon" min={today} value={form.date} onChange={e => set('date')(e.target.value)} style={{ paddingLeft: '14px' }} />
          </div>

          {form.date && (
            <div className="form-group">
              <label className="form-label">{tr.available_slots}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {availableTimes.map(t => (
                  <button key={t}
                    className={`radio-item ${form.time === t ? 'selected' : ''}`}
                    style={{ cursor: 'pointer', border: '1.5px solid', borderColor: form.time === t ? '#2d6a4f' : '#e2e8f0', borderRadius: '8px', padding: '8px 16px', background: form.time === t ? '#d8f3dc' : 'white', fontWeight: 600, fontSize: '0.875rem', color: form.time === t ? '#1a4a2e' : '#4a5568' }}
                    onClick={() => set('time')(t)}
                  >{t}</button>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1rem' }}
            onClick={handleBook}
            disabled={busy || availableTypes.length === 0 || !form.commune || !form.demandeType || !form.date || !form.time}
          >
            {busy ? labels.booking : tr.book_rdv}
          </button>
          {error ? (
            <p style={{ marginTop: '0.9rem', color: '#c53030', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  );
}
