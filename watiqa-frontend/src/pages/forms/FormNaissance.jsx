import React, { useState } from 'react';
import { FormLayout, DeliverySection } from './FormLayout';
import { FormSection, Counter, RadioGroup } from '../../components/FormField';
import { useT } from '../../i18n';
import { useLanguage } from '../../context/LanguageContext';

export default function FormNaissance() {
  const { lang } = useLanguage();
  const tr = useT(lang);
  const [form, setForm] = useState({ firstname: '', lastname: '', birthdate: '', birthplace: '', copyType: 'full', numCopies: 1, delivery: 'pickup' });
  const setField = k => v => setForm(f => ({ ...f, [k]: v }));

  const title = lang === 'ar' ? 'رسم الولادة' : "Demande d'un extrait d'acte de naissance";
  const subtitle = lang === 'ar' ? 'املأ النموذج أدناه للحصول على رسم ولادتك' : "Remplissez le formulaire ci-dessous pour demander l'extrait d'acte de naissance souhaité.";

  return (
    <FormLayout title={title} subtitle={subtitle}>
      {({ tr, isRTL, registerSubmit }) => {
        registerSubmit(() => form, 'naissance');
        return (
        <>
          <FormSection title={tr.personal_info} 
          
          >
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{tr.firstname} <span className="req">*</span></label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.firstname} value={form.firstname} onChange={e => setField('firstname')(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr.lastname} <span className="req">*</span></label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.lastname} value={form.lastname} onChange={e => setField('lastname')(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr.birthdate} <span className="req">*</span></label>
                <input type="date" className="form-input no-icon" style={{ paddingLeft: 14 }} value={form.birthdate} onChange={e => setField('birthdate')(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr.birthplace} <span className="req">*</span></label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.birthplace} value={form.birthplace} onChange={e => setField('birthplace')(e.target.value)} /></div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{tr.copy_type}</label>
                <RadioGroup value={form.copyType} onChange={setField('copyType')} options={[
                  { value: 'full', label: tr.full_copy },
                  { value: 'extract', label: tr.extract }
                ]} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr.num_copies}</label>
                <Counter value={form.numCopies} onChange={setField('numCopies')} />
              </div>
            </div>
          </FormSection>

          <DeliverySection tr={tr} form={form} setField={setField} />
        </>
      );
    }}
    </FormLayout>
  );
}
