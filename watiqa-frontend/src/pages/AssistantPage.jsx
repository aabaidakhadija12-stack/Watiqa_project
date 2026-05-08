import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import botImg from '../assets/bot.png';
import volumeImg from '../assets/volume.png';
import audioImg from '../assets/audio.png';
import noShoutingImg from '../assets/no-shouting.png';

const SYSTEM_PROMPT = `Tu es l'assistant Watiqa, spécialisé dans les services administratifs marocains de la plateforme Watiqa.

SERVICES DISPONIBLES SUR WATIQA :
1. Acte de naissance (رسم الولادة) — délai 3-5 jours
2. Certificat de résidence (شهادة الإقامة) — délai 1-2 jours
3. Certificat de vie (شهادة الحياة) — délai 1-2 jours
4. Certificat de célibat (شهادة العزوبة) — délai 2-3 jours
5. Casier judiciaire (السجل العدلي) — délai 5-7 jours
6. Acte de décès (رسم الوفاة) — délai 2-3 jours

PAGES DE LA PLATEFORME :
- Guichet (الشباك) : pour soumettre les demandes de documents
- Rendez-vous (المواعيد) : pour réserver un créneau en commune
- Suivi (المتابعة) : pour suivre l'état d'une demande avec le numéro de dossier

RÈGLES DE RÉPONSE :
- Si l'utilisateur écrit en arabe → réponds UNIQUEMENT en arabe
- Si l'utilisateur écrit en français → réponds UNIQUEMENT en français
- Donne toujours les étapes numérotées (1️⃣ 2️⃣ 3️⃣...) pour chaque procédure
- Liste clairement les documents nécessaires
- Indique toujours le délai de traitement
- Rappelle que le suivi est disponible depuis la page Suivi
- Sois concis, clair et bienveillant
- Utilise des emojis pour rendre la réponse lisible`;

export default function AssistantPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const isRTL = lang === 'ar';
  
  const [messages, setMessages] = useState([
    { role: 'assistant', text: tr.chat_welcome }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Forcer le chargement des voix au démarrage
    if (synthRef.current && synthRef.current.getVoices().length === 0) {
      synthRef.current.onvoiceschanged = () => {};
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant', { message: text });
      const reply = res.data.reply || (lang === 'ar' ? 'عذراً، حدث خطأ.' : 'Désolé, une erreur est survenue.');
      setMessages(m => [...m, { role: 'assistant', text: reply }]);

      // Auto speak assistant reply
      speak(reply);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', text: lang === 'ar' ? '❌ خطأ في الاتصال. حاول مجدداً.' : '❌ Erreur de connexion. Veuillez réessayer.' }]);
    }
    setLoading(false);
  };

  // Extract: first line (title) + numbered steps only
  const extractSpeakableText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    // Match emoji numbers like 1️⃣ (digit + U+FE0F + U+20E3) or plain "1." / "1)"
    const stepLines = lines.slice(1).filter(l =>
      /^\d\uFE0F\u20E3/.test(l) || /^\d+[.)]\s/.test(l)
    );
    return [firstLine, ...stepLines].join('. ');
  };

  // Split text into chunks <=190 chars at sentence breaks
  const splitIntoChunks = (text, maxLen = 190) => {
    const chunks = [];
    const parts = text.split('. ');
    let current = '';
    for (const p of parts) {
      const candidate = current ? current + '. ' + p : p;
      if (candidate.length > maxLen && current.length > 0) {
        chunks.push(current.trim());
        current = p;
      } else {
        current = candidate;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
  };

  const speak = async (text) => {
    stopSpeaking();

    const isTextArabic = /[\u0600-\u06FF]/.test(text);
    const ttsLang = isTextArabic ? 'ar' : 'fr';

    // Extract only title + steps for reading
    const speakableText = extractSpeakableText(text);
    const cleanText = speakableText
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[*#_]/g, '')
      .trim();

    const chunks = splitIntoChunks(cleanText);
    let stopped = false;

    // Stop handler needs to know about this sequence
    window._watiqaStopChunks = () => { stopped = true; };

    const playChunk = (index) => {
      if (stopped || index >= chunks.length) {
        if (!stopped) setIsSpeaking(false);
        return;
      }
      const chunk = chunks[index];
      const url = `${api.defaults.baseURL}/assistant/tts?text=${encodeURIComponent(chunk)}&lang=${ttsLang}`;
      const audio = new Audio(url);
      window.currentWatiqaAudio = audio;
      if (index === 0) setIsSpeaking(true);
      audio.onended = () => playChunk(index + 1);
      audio.onerror = () => { setIsSpeaking(false); fallbackToSynth(cleanText, ttsLang); };
      audio.play().catch(() => { setIsSpeaking(false); fallbackToSynth(cleanText, ttsLang); });
    };

    try {
      playChunk(0);
    } catch (e) {
      fallbackToSynth(cleanText, ttsLang);
    }
  };

  const fallbackToSynth = (text, lang) => {
    if (!synthRef.current) return;
    const utter = new SpeechSynthesisUtterance(text.substring(0, 300));
    // Use Moroccan Arabic dialect for AR, standard French for FR
    utter.lang = lang === 'ar' ? 'ar-MA' : 'fr-FR';

    const voices = synthRef.current.getVoices();
    let voice;
    if (lang === 'ar') {
      // Prefer ar-MA, fallback to any Arabic voice
      voice = voices.find(v => v.lang === 'ar-MA')
        || voices.find(v => v.lang.startsWith('ar'))
        || voices.find(v => v.name.toLowerCase().includes('arabic'));
    } else {
      voice = voices.find(v => v.lang === 'fr-FR')
        || voices.find(v => v.lang.startsWith('fr'))
        || voices.find(v => v.name.toLowerCase().includes('french'));
    }
    if (voice) utter.voice = voice;

    utter.rate = 1.0;
    setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  };

  const stopSpeaking = () => {
    // Stop chunk sequence if running
    if (window._watiqaStopChunks) window._watiqaStopChunks();
    if (window.currentWatiqaAudio) {
      window.currentWatiqaAudio.pause();
      window.currentWatiqaAudio.currentTime = 0;
    }
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Reconnaissance vocale non supportée'); return; }
    const rec = new SR();
    rec.lang = isRTL ? 'ar-MA' : 'fr-FR';
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    rec.start();
    recognitionRef.current = rec;
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const newConversation = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setMessages([{ role: 'assistant', text: tr.chat_welcome }]);
    setInput('');
  };

  const suggestions = lang === 'ar'
    ? [
        'كيف أطلب رسم الولادة؟',
        'خطوات شهادة الإقامة؟',
        'كيف أتابع طلبي؟',
        'ما هي آجال المعالجة؟',
      ]
    : [
        'Comment demander un acte de naissance ?',
        'Étapes pour un certificat de résidence ?',
        'Comment suivre ma demande ?',
        'Quels sont les délais de traitement ?',
      ];

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'linear-gradient(160deg, #e8f5e9 0%, #f0f9ff 50%, #e8f5e9 100%)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}><img src={botImg} alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: '#48bb78', borderRadius: '50%', border: '2px solid white' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a4a2e' }}>{lang === 'ar' ? 'مساعد وثيقة' : 'Assistant Watiqa'}</div>
                <div style={{ fontSize: '0.75rem', color: '#48bb78', fontWeight: 500 }}>● {tr.online}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isSpeaking && (
                <button className="btn btn-sm btn-outline" onClick={stopSpeaking} style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={noShoutingImg} alt="stop" style={{ width: 14, height: 14 }} /> {lang === 'ar' ? 'إيقاف' : 'Stopper'}
                </button>
              )}
              <button className="btn btn-sm btn-outline" onClick={newConversation}>
                {tr.new_chat}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', background: '#f8faf9' }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0 1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 12, alignItems: 'flex-start'
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', background: 'white' }}>
                    <img src={botImg} alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '85%', padding: '12px 18px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #1a4a2e, #2d6a4f)' : '#ffffff',
                  color: msg.role === 'user' ? 'white' : '#1a2e23',
                  fontSize: '0.95rem', lineHeight: 1.7, border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.02)' : '0 4px 12px rgba(45,106,79,0.15)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                  {msg.role === 'assistant' && (
                    <button onClick={() => speak(msg.text)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '0.75rem', fontWeight: 500 }}>
                      <img src={volumeImg} alt="speak" style={{ width: 14, height: 14, opacity: 0.7 }} /> {lang === 'ar' ? 'استمع' : 'Écouter'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
                  <img src={botImg} alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: '18px 18px 18px 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 8, height: 8, background: '#2d6a4f', borderRadius: '50%', display: 'inline-block', animation: `bounce 1.4s infinite ${i * 0.2}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area */}
        <div style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff', paddingBottom: '1rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            {messages.length <= 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', justifyContent: 'center' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    padding: '8px 16px', borderRadius: '50px', background: '#f8faf9', border: '1px solid #e2e8f0',
                    fontSize: '0.85rem', color: '#4a5568', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#d8f3dc'; e.currentTarget.style.borderColor = '#2d6a4f'; e.currentTarget.style.color = '#1a4a2e'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8faf9'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#4a5568'; }}
                  >{s}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8faf9', padding: '8px', borderRadius: '50px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <button
                onClick={isListening ? stopVoice : startVoice}
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: isListening ? '#e53e3e' : '#ffffff', color: isListening ? 'white' : '#4a5568',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                  boxShadow: isListening ? '0 0 0 4px rgba(229,62,62,0.2)' : '0 2px 5px rgba(0,0,0,0.05)'
                }}
                title={lang === 'ar' ? 'الإدخال الصوتي' : 'Saisie vocale'}
              >
                {isListening ? <img src={noShoutingImg} alt="stop" style={{ width: 22, height: 22, filter: 'brightness(0) invert(1)' }} /> : <img src={audioImg} alt="mic" style={{ width: 22, height: 22 }} />}
              </button>

              <input
                style={{ flex: 1, padding: '12px 4px', border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '1rem', outline: 'none', color: '#1a2e23' }}
                placeholder={isListening ? (lang === 'ar' ? 'أتسمع...' : 'J\'écoute...') : tr.type_message}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              />

              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: input.trim() ? 'linear-gradient(135deg, #1a4a2e, #2d6a4f)' : '#e2e8f0',
                  color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                  opacity: (!input.trim() || loading) ? 0.6 : 1
                }}
              >➤</button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: '#a0aec0', fontWeight: 500 }}>
              {lang === 'ar' ? 'المساعد الذكي قد يخطئ أحيانا، يرجى التأكد من المعلومات الرسمية.' : 'L\'assistant intelligent peut parfois se tromper, veuillez vérifier les informations officielles.'}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
