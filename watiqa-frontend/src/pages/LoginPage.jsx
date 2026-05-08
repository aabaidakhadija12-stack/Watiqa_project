import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import api from '../api/api';

// Layout partagé pour les pages d'authentification (connexion & inscription)
function AuthLayout({ children }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isRTL = lang === 'ar';

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 60%, #e8f5e9 100%)',
      display: 'flex', flexDirection: 'column'
    }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Superposition de fond décorative */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: "#d8d3d3ff",
        opacity: 0.08
      }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Barre de navigation supérieure avec le logo cliquable */}
        <nav className="navbar" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Watiqa" style={{ height: '100px', objectFit: 'contain' }} />
          </div>
        </nav>

        {/* Contenu de la page (formulaire de connexion ou d'inscription) */}
        {children}

      </div>
    </div>
  );
}

// Page de connexion
export function LoginPage() {
  const { lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const tr = useT(lang);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('login'); // login | verify
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (e) {
      const data = e.response?.data;
      if (e.response?.status === 403 && data?.requires_email_verification) {
        setStep('verify');
        setCode('');
        setInfo(lang === 'ar'
          ? 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني.'
          : 'Saisissez le code reçu par email.');
      } else {
        setErr(data?.message || data?.errors?.email?.[0] || (lang === 'ar' ? 'تعذر تسجيل الدخول' : 'Connexion impossible'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const res = await api.post('/auth/verify-email', { email, password, code });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (e) {
      const data = e.response?.data;
      setErr(data?.message || data?.errors?.code?.[0] || (lang === 'ar' ? 'رمز غير صحيح' : 'Code invalide'));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      await api.post('/auth/resend-verification', { email, password });
      setInfo(lang === 'ar' ? 'تم إعادة إرسال الرمز' : 'Code renvoyé');
    } catch (e) {
      const data = e.response?.data;
      setErr(data?.message || (lang === 'ar' ? 'تعذر إعادة الإرسال' : 'Renvoi impossible'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: 480, padding: '2.5rem' }}>

          {/* Titre de la page */}
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', color: '#1a2e4a' }}>
            {step === 'verify' ? (lang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Vérifier votre email') : tr.connexion}
          </h2>

          {step === 'login' ? (
            <>
              {/* Champ email */}
              <div className="form-group">
                <label className="form-label">{tr.email}</label>
                <div className="input-wrap">
                  <input className="form-input" type="email" placeholder={tr.email_placeholder} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Champ mot de passe */}
              <div className="form-group">
                <label className="form-label">{tr.password}</label>
                <div className="input-wrap">
                  <input className="form-input" type="password" placeholder={tr.password_placeholder} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'رمز التحقق (6 أرقام)' : 'Code (6 chiffres)'}</label>
                <div className="input-wrap">
                  <input className="form-input" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/[^\d]/g, ''))} />
                </div>
              </div>
            </>
          )}

          {info ? <p style={{ marginTop: '0.75rem', color: '#2f855a', fontSize: '0.9rem', textAlign: 'center' }}>{info}</p> : null}
          {err ? (
            <p style={{ marginTop: '0.75rem', color: '#b00020', fontSize: '0.9rem', textAlign: 'center' }}>{err}</p>
          ) : null}

          {/* Bouton de connexion */}
          {step === 'login' ? (
            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '0.5rem' }} onClick={handleSubmit} disabled={busy}>
              {tr.se_connecter}
            </button>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleVerify} disabled={busy}>
                {lang === 'ar' ? 'تأكيد' : 'Confirmer'}
              </button>
              <button
                className="btn btn-full btn-lg"
                style={{ background: '#fff', border: '1px solid #c9a84c', color: '#1a2e4a' }}
                onClick={handleResend}
                disabled={busy}
              >
                {lang === 'ar' ? 'إعادة إرسال الرمز' : 'Renvoyer le code'}
              </button>
              <button
                className="btn btn-full btn-lg"
                style={{ background: '#fff', border: '1px solid #cbd5e0', color: '#1a2e4a' }}
                onClick={() => { setStep('login'); setErr(''); setInfo(''); }}
                disabled={busy}
              >
                {lang === 'ar' ? 'رجوع' : 'Retour'}
              </button>
            </div>
          )}

          {/* Lien vers la page d'inscription */}
          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#718096', fontSize: '0.9rem' }}>
            {tr.no_account}{' '}
            <span style={{ color: '#c9a84c', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/register')}>
              {tr.sinscrire}
            </span>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

// Page d'inscription
export function RegisterPage() {
  const { lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const tr = useT(lang);

  const [form, setForm] = useState({ name: '', email: '', phone: '', cin: '', password: '', confirm: '' });
  const [code, setCode] = useState('');
  const [step, setStep] = useState('register'); // register | verify
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');

  // Mettre à jour un champ du formulaire
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email,
        phone: form.phone.trim(),
        cin: form.cin.trim().toUpperCase(),
        password: form.password,
        password_confirmation: form.confirm,
      });
      setStep('verify');
      setCode('');
      setInfo(lang === 'ar'
        ? 'تم إنشاء الحساب. أدخل رمز التحقق المرسل إلى بريدك الإلكتروني.'
        : 'Compte cree. Saisissez le code recu par email.');
    } catch (e) {
      const data = e.response?.data;
      setErr(data?.message || (lang === 'ar' ? 'تعذر إنشاء الحساب' : 'Création du compte impossible'));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const res = await api.post('/auth/verify-email', {
        email: form.email,
        password: form.password,
        code,
      });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (e) {
      const data = e.response?.data;
      setErr(data?.message || data?.errors?.code?.[0] || (lang === 'ar' ? 'رمز غير صحيح' : 'Code invalide'));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      await api.post('/auth/resend-verification', { email: form.email, password: form.password });
      setInfo(lang === 'ar' ? 'تم إعادة إرسال الرمز' : 'Code renvoyé');
    } catch (e) {
      const data = e.response?.data;
      setErr(data?.message || (lang === 'ar' ? 'تعذر إعادة الإرسال' : 'Renvoi impossible'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: 480, padding: '2.5rem' }}>

          {/* Titre de la page */}
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem', color: '#1a2e4a' }}>
            {step === 'verify' ? (lang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Vérifier votre email') : tr.sinscrire}
          </h2>

          {step === 'register' ? (
            <>
              {[
                { key: 'name', label: tr.fullname, placeholder: lang === 'ar' ? 'أدخل اسمك الكامل' : 'Entrer votre nom complet' },
                { key: 'email', label: tr.email, placeholder: tr.email_placeholder, type: 'email' },
                { key: 'phone', label: lang === 'ar' ? 'الهاتف' : 'Telephone', placeholder: '+212612345678', type: 'tel' },
                { key: 'cin', label: 'CIN', placeholder: 'AB123456' },
                { key: 'password', label: tr.password, placeholder: tr.choose_password, type: 'password' },
                { key: 'confirm', label: tr.confirm_password, placeholder: tr.confirm_password_placeholder, type: 'password' },
              ].map(field => (
                <div className="form-group" key={field.key}>
                  <label className="form-label">{field.label}</label>
                  <div className="input-wrap">
                    <input className="form-input" type={field.type || 'text'} placeholder={field.placeholder}
                      value={form[field.key]} onChange={e => set(field.key)(field.key === 'cin' ? e.target.value.toUpperCase() : e.target.value)} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'رمز التحقق (6 أرقام)' : 'Code (6 chiffres)'}</label>
                <div className="input-wrap">
                  <input className="form-input" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/[^\d]/g, ''))} />
                </div>
              </div>
              <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {lang === 'ar'
                  ? 'ستستخدم نفس كلمة المرور التي أدخلتها عند التسجيل للتحقق من الرمز.'
                  : 'On utilise le même mot de passe saisi à l’inscription pour valider le code.'}
              </p>
            </>
          )}

          {info ? <p style={{ marginTop: '0.75rem', color: '#2f855a', fontSize: '0.9rem', textAlign: 'center' }}>{info}</p> : null}
          {err ? <p style={{ marginTop: '0.75rem', color: '#b00020', fontSize: '0.9rem', textAlign: 'center' }}>{err}</p> : null}

          {/* Bouton de création de compte */}
          {step === 'register' ? (
            <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: '0.5rem' }} onClick={handleRegister} disabled={busy}>
              {tr.create_account}
            </button>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleVerify} disabled={busy}>
                {lang === 'ar' ? 'تأكيد' : 'Confirmer'}
              </button>
              <button
                className="btn btn-full btn-lg"
                style={{ background: '#fff', border: '1px solid #c9a84c', color: '#1a2e4a' }}
                onClick={handleResend}
                disabled={busy}
              >
                {lang === 'ar' ? 'إعادة إرسال الرمز' : 'Renvoyer le code'}
              </button>
            </div>
          )}

          {/* Lien vers la page de connexion */}
          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#718096', fontSize: '0.9rem' }}>
            {tr.already_account}{' '}
            <span style={{ color: '#c9a84c', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/login')}>
              {tr.se_connecter}
            </span>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
