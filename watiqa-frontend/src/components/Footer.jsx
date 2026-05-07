import React from 'react';
import { useT } from '../i18n';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();
  const tr = useT(lang);
  return (
    <footer className="footer">
      <span>{tr.footer_rights}</span>
      <div className="footer-links">
        <a href="#">{tr.contact}</a>
        <a href="#">{tr.about}</a>
      </div>
    </footer>
  );
}
