import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import bot from '../assets/bot.png';
import bg1 from '../assets/bg1.png';
import bg2 from '../assets/bg2.png';
import icon1 from '../assets/1.png';
import icon2 from '../assets/2.png';
import icon3 from '../assets/3.png';
import icon4 from '../assets/4.png';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const tr = useT(lang);
  const isRTL = lang === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundImage: isRTL ? `url(${bg2})` : `url(${bg1})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ paddingBlockStart: '16vh', paddingInlineEnd: '4rem', paddingInlineStart: '4rem', maxWidth: '1200px', margin: '0 auto', textAlign: isRTL ? 'right' : 'left', minHeight: '88vh', display: 'flex', flexDirection: 'column' }} className="fade-in">
        <h1 style={{ fontSize: isRTL ? 'clamp(2.6rem, 4vw, 3.8rem)' : 'clamp(2.2rem, 3.5vw, 3.2rem)', fontWeight: 700, color: '#1a4a2e', lineHeight: isRTL ? 1.5 : 1.2, marginBottom: isRTL ? '1.8rem' : '1.25rem', whiteSpace: 'normal', maxWidth: '650px' }}>
          {tr.hero_title}
        </h1>
        <p style={{ fontSize: isRTL ? '1.2rem' : '1.05rem', color: '#4a5568', marginBottom: isRTL ? '2.5rem' : '2rem', maxWidth: '550px', lineHeight: isRTL ? 1.8 : 1.5, whiteSpace: 'pre-wrap' }}>
          {isRTL ? tr.hero_sub : `${tr.hero_sub1}\n${tr.hero_sub2}`}
        </p>

        <div style={{ display: 'flex', gap: isRTL ? '1.5rem' : '1rem', flexWrap: 'nowrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/guichet')} style={{ padding: isRTL ? '14px 36px' : undefined, fontSize: isRTL ? '1.1rem' : undefined }}>
            {tr.start_request}
          </button>
          {!user && (
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/register')} style={{ padding: isRTL ? '14px 36px' : undefined, fontSize: isRTL ? '1.1rem' : undefined }}>
              {tr.register}
            </button>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '2rem 2rem 3rem', maxWidth: '100%', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.9rem', color: '#1a4a2e', marginBottom: '1rem' }}>
          {lang === 'ar' ? 'كيف يعمل؟' : 'Comment ça marche'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {[
            { icon: icon1, title: lang === 'ar' ? 'إنشاء طلب' : 'Créer une demande', desc: lang === 'ar' ? 'أنشئ طلبك بسهولة' : 'Créer votre demande.' },
            { icon: icon2, title: lang === 'ar' ? 'دفع رسوم الإرسال' : "Payer les frais d'envoi", desc: lang === 'ar' ? 'ادفع بأمان ببطاقة بنكية' : 'Payer les frais de la commande en toute sécurité avec une carte bancaire.' },
            { icon: icon3, title: lang === 'ar' ? 'تتبع الطلب' : 'Suivre la commande', desc: lang === 'ar' ? 'تابع حالة طلبك خطوة بخطوة' : "Suivre l'état d'avancement de la commande pas à pas." },
            { icon: icon4, title: lang === 'ar' ? 'استلام الوثائق' : 'Recevoir les documents', desc: lang === 'ar' ? 'استلم وثائقك بالبريد' : "Recevoir les documents par courrier postal dans l'adresse renseignée." },
          ].map((f, i) => (
            <div key={i} className="card fade-in" style={{ padding: '1.5rem', textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
              <img src={f.icon} alt="" aria-hidden="true" style={{ width: '52px', height: '52px', objectFit: 'contain', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a4a2e', marginBottom: '0.4rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#718096' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div style={{ marginTop: '2rem', padding: '1.5rem 2rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', color: '#1a4a2e', marginBottom: '1rem' }}>
          {tr.offices}
        </h2>
        <div style={{ height: '350px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <MapContainer center={[31.7917, -7.0926]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <Marker position={[33.5731, -7.5898]}><Popup>Casablanca</Popup></Marker>
            <Marker position={[34.0209, -6.8416]}><Popup>Rabat</Popup></Marker>
            <Marker position={[31.6295, -7.9811]}><Popup>Marrakech</Popup></Marker>
            <Marker position={[35.7595, -5.8340]}><Popup>Tanger</Popup></Marker>
            <Marker position={[30.4278, -9.5981]}><Popup>Agadir</Popup></Marker>
            <Marker position={[34.6867, -1.9114]}><Popup>Oujda</Popup></Marker>
            <Marker position={[30.2769, -9.0100]}><Popup>Oulad Teima</Popup></Marker>
            <Marker position={[30.4694, -8.8749]}><Popup>Taroudant</Popup></Marker>
          </MapContainer>
        </div>
      </div>

      <div
        onClick={() => navigate('/assistant')}
        style={{
          position: 'fixed', bottom: '1.5rem', insetInlineEnd: '1.5rem',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(45,106,79,0.4)',
          zIndex: 9999, animation: 'pulse 2s infinite'
        }}
        title={tr.need_help}
      >
        <img src={bot} alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>

      <Footer />
    </div>
  );
}
