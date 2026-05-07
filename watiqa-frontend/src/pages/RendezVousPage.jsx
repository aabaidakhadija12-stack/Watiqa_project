import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';

const communes = ['Agadir Ida Outanane', 'Inzegane', 'Ait Melloul', 'Dcheira El Jihadia', 'Biougra', 'Taroudant'];
const services = ['Certificat de résidence', 'Acte de naissance', 'Certificat de vie', 'Casier judiciaire', 'Certificat de célibat' ,'Acte de Décès'];
const times = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];

export default function RendezVousPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const isRTL = lang === 'ar';
  const [form, setForm] = useState({ commune: '', service: '', date: '', time: '' });
  const [confirmed, setConfirmed] = useState(false);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const today = new Date().toISOString().split('T')[0];

  if (confirmed) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div className="card fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#1a4a2e', marginBottom: '1rem' }}>
            {lang === 'ar' ? 'تم تأكيد الموعد!' : 'Rendez-vous confirmé !'}
          </h2>
          <div className="alert alert-success" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <div>📍 <strong>{form.commune}</strong></div>
            <div>📋 {form.service}</div>
            <div>📅 {form.date} à {form.time}</div>
          </div>
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            🪪 {lang === 'ar' ? 'أحضر بطاقتك الوطنية' : 'Pensez à apporter votre CIN et les documents nécessaires.'}
          </div>
          <button className="btn btn-primary" onClick={() => { setConfirmed(false); navigate('/'); }}>
            {lang === 'ar' ? 'الرئيسية' : 'Retour à l\'accueil'}
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
          <div className="form-group">
            <label className="form-label">{tr.choose_commune}</label>
            <select className="form-select" value={form.commune} onChange={e => set('commune')(e.target.value)}>
              <option value="">-- {tr.choose_commune} --</option>
              {communes.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{tr.choose_service}</label>
            <select className="form-select" value={form.service} onChange={e => set('service')(e.target.value)}>
              <option value="">-- {tr.choose_service} --</option>
              {services.map(s => <option key={s}>{s}</option>)}
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
                {times.map(t => (
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
            onClick={() => form.commune && form.service && form.date && form.time && setConfirmed(true)}
            disabled={!form.commune || !form.service || !form.date || !form.time}
          >
            {tr.book_rdv}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
