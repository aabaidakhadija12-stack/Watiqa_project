import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';

export default function GuichetPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const isRTL = lang === 'ar';
  const docs = tr.docs;

  const cards = [
    { key: 'naissance', form: '/form-naissance' },
    { key: 'residence', form: '/form-residence' },
    { key: 'vie', form: '/form-vie' },
    { key: 'celibat', form: '/form-celibat' },
    { key: 'casier', form: '/form-casier' },
    { key: 'deces', form: '/form-deces' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div style={{ padding: '3rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#1a4a2e', marginBottom: '0.75rem' }}>
            {tr.guichet_title}
          </h1>
          <p style={{ color: '#718096', fontSize: '1.05rem' }}>{tr.guichet_sub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {cards.map(({ key, form }, i) => {
            const doc = docs[key];
            return (
              <div key={key} className="card fade-in" style={{
                padding: '1.75rem', cursor: 'pointer', transition: 'all 0.25s',
                animationDelay: `${i * 0.08}s`,
                borderTop: '4px solid #40916c'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{doc.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1a4a2e', marginBottom: '0.5rem' }}>{doc.title}</h3>
                <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>{doc.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span className="badge badge-green">⏱ {doc.delay}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(form)}>
                    {tr.request_btn} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
