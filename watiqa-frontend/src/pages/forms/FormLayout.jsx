import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Stepper, FormSection, FormField, Counter, RadioGroup } from '../../components/FormField';
import { useT } from '../../i18n';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

export function FormLayout({ title, subtitle, icon, children, onSubmit }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const tr = useT(lang);
  const isRTL = lang === 'ar';
  const isAdminPreview = user?.role === 'admin';
  
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dossierNum, setDossierNum] = useState(`WTQ-2026-${Math.floor(Math.random() * 9000 + 1000)}`);
  const [submitting, setSubmitting] = useState(false);

  // register a getter that returns the current form object and a type string
  const formGetterRef = useRef(null);
  const formTypeRef = useRef(null);

  const registerSubmit = (getForm, type) => {
    formGetterRef.current = getForm;
    formTypeRef.current = type;
  };

  const handleSubmit = async () => {
    // if a custom onSubmit prop is provided, call it with the form data
    const getForm = formGetterRef.current;
    const type = formTypeRef.current;

    if (isAdminPreview) return;

    if (onSubmit) {
      try {
        setSubmitting(true);
        await onSubmit();
        setSubmitted(true);
      } finally {
        setSubmitting(false);
      }
      window.scrollTo(0, 0);
      return;
    }

    if (!getForm || !type) {
      // fallback: just show submitted state
      setSubmitted(true);
      window.scrollTo(0, 0);
      return;
    }

    const form = getForm();

    try {
      setSubmitting(true);
      const res = await api.post('/demandes', { type, data: form });
      const numero = res?.data?.numero_suivi || res?.data?.demande?.numero_suivi;
      if (numero) setDossierNum(numero);
      setSubmitted(true);
    } catch (e) {
      console.error('Submit demande error', e);
      // optionally show toast/alert — left simple
      alert((e?.response?.data?.message) || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
      window.scrollTo(0, 0);
    }
  };

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div className="card fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#1a4a2e', marginBottom: '0.5rem' }}>
            {lang === 'ar' ? 'تم إرسال طلبك!' : 'Demande envoyée !'}
          </h2>
          <p style={{ color: '#718096', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {lang === 'ar' ? 'سيتم معالجة طلبك في أقرب وقت ممكن' : 'Votre demande sera traitée dans les plus brefs délais.'}
          </p>
          <div className="alert alert-success" style={{ marginBottom: '1.5rem', textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: 4 }}>{lang === 'ar' ? 'رقم الملف' : 'Numéro de dossier'}</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{dossierNum}</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/suivi')}> {lang === 'ar' ? 'متابعة الطلب' : 'Suivre ma demande'}</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>{lang === 'ar' ? 'الرئيسية' : 'Accueil'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="page-inner" style={{ maxWidth: 760 }}>
        <Stepper steps={[tr.step_info, tr.step_confirm, tr.step_done]} current={0} />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{icon}</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.7rem', fontWeight: 700, color: '#1a4a2e', marginBottom: '0.4rem' }}>{title}</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem' }}>{subtitle}</p>
        </div>

        {children({ tr, isRTL, registerSubmit })}

        {isAdminPreview && (
          <div className="alert alert-warning" style={{ marginTop: '1rem', display: 'block', textAlign: isRTL ? 'right' : 'left' }}>
            <strong>{lang === 'ar' ? 'وضع المعاينة' : 'Mode aperçu'}</strong>
            <div style={{ marginTop: 6 }}>
              {lang === 'ar'
                ? 'أنت تشاهد هذا النموذج كمسؤول فقط. لا يمكن إنشاء طلب من حساب الإدارة.'
                : "Vous consultez ce formulaire en tant qu'administrateur. La création de demande est désactivée pour ce compte."}
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '1rem' }} onClick={handleSubmit} disabled={submitting || isAdminPreview}>
          {submitting ? (lang === 'ar' ? 'جارٍ الإرسال...' : 'Envoi...') : (<>{tr.submit} →</>)}
        </button>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Stepper steps={[tr.step_info, tr.step_confirm, tr.step_done]} current={0} />
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '1.5rem', marginTop: '1rem' }}>
        <button style={{ background: 'none', border: '1px solid #e2e8f0', padding: '8px 20px', borderRadius: '50px', cursor: 'pointer', color: '#718096', fontSize: '0.85rem' }}
          onClick={() => navigate('/assistant')}>
           {lang === 'ar' ? 'هل تحتاج مساعدة؟' : "Besoin d'aide ?"}
        </button>
      </div>
      <Footer />
    </div>
  );
}

export function DeliverySection({ tr, form, setField }) {
  return (
    <FormSection title={tr.request_info} >
      <div className="form-group">
        <label className="form-label">{tr.delivery}</label>
        <RadioGroup
          value={form.delivery}
          onChange={v => setField('delivery')(v)}
          options={[
            { value: 'pickup', label: tr.pickup, icon: '🏛' },
            { value: 'home', label: tr.home_delivery, icon: '🏠' }
          ]}
        />
      </div>
      {form.delivery === 'home' && (
        <div className="grid-2" style={{ marginTop: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">{tr.address}</label>
            <input className="form-input no-icon" placeholder={tr.address} value={form.addressDelivery || ''} onChange={e => setField('addressDelivery')(e.target.value)} style={{ paddingLeft: 14 }} />
          </div>
          <div className="form-group">
            <label className="form-label">{tr.city}</label>
            <input className="form-input no-icon" placeholder={tr.city} value={form.cityDelivery || ''} onChange={e => setField('cityDelivery')(e.target.value)} style={{ paddingLeft: 14 }} />
          </div>
          <div className="form-group">
            <label className="form-label">{tr.postal}</label>
            <input className="form-input no-icon" placeholder={tr.postal} value={form.postal || ''} onChange={e => setField('postal')(e.target.value)} style={{ paddingLeft: 14 }} />
          </div>
          <div className="form-group">
            <label className="form-label">{tr.phone}</label>
            <div className="input-wrap">
              <input className="form-input" placeholder={tr.phone} value={form.phone || ''} onChange={e => setField('phone')(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
}
