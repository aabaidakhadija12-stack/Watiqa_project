import React, { useState } from 'react';
import { FormLayout, DeliverySection } from './FormLayout';
import { FormSection, RadioGroup } from '../../components/FormField';
import { useLanguage } from '../../context/LanguageContext';

function PersonSection({ tr, form, setField, showCin = true }) {
  return (
    <>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">{tr.lastname}</label>
          <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.lastname} value={form.lastname || ''} onChange={e => setField('lastname')(e.target.value)} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">{tr.firstname}</label>
          <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.firstname} value={form.firstname || ''} onChange={e => setField('firstname')(e.target.value)} /></div>
        </div>
      </div>
      {showCin && (
        <div className="form-group">
          <label className="form-label">{tr.cin}</label>
          <div className="input-wrap"><input className="form-input no-icon" placeholder="A123456" value={form.cin || ''} onChange={e => setField('cin')(e.target.value)} /></div>
        </div>
      )}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">{tr.birthdate}</label>
          <input type="date" className="form-input no-icon" style={{ paddingLeft: 14 }} value={form.birthdate || ''} onChange={e => setField('birthdate')(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{tr.birthplace}</label>
          <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.birthplace} value={form.birthplace || ''} onChange={e => setField('birthplace')(e.target.value)} /></div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{tr.gender}</label>
        <RadioGroup value={form.gender || 'male'} onChange={setField('gender')} options={[
          { value: 'male', label: tr.male },
          { value: 'female', label: tr.female }
        ]} />
      </div>
    </>
  );
}

export function FormResidence() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ delivery: 'home' });
  const setField = k => v => setForm(f => ({ ...f, [k]: v }));

  const title = lang === 'ar' ? 'شهادة الإقامة' : 'Demande de Certificat de Résidence';

  return (
    <FormLayout title={title} subtitle="">
      {({ tr, registerSubmit }) => {
        registerSubmit(() => form, 'residence');
        return (
        <>
          <FormSection title={tr.personal_info}>
            <PersonSection tr={tr} form={form} setField={setField} />
          </FormSection>
          <FormSection title={tr.residence_info}>
            <div className="form-group">
              <label className="form-label">{tr.address}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.address} value={form.address || ''} onChange={e => setField('address')(e.target.value)} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{tr.neighborhood}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.neighborhood} value={form.neighborhood || ''} onChange={e => setField('neighborhood')(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr.city}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.city} value={form.city || ''} onChange={e => setField('city')(e.target.value)} /></div>
              </div>
            </div>
          </FormSection>
          <FormSection title={tr.request_info}>
            <div className="form-group">
              <label className="form-label">{tr.motif}</label>
              <select className="form-select" value={form.motif || ''} onChange={e => setField('motif')(e.target.value)}>
                <option value="">{tr.motif_placeholder}</option>
                <option>{lang === 'ar' ? 'ملف إداري' : 'Dossier administratif'}</option>
                <option>{lang === 'ar' ? 'عمل' : 'Travail'}</option>
                <option>{lang === 'ar' ? 'تأشيرة' : 'Visa'}</option>
                <option>{lang === 'ar' ? 'مدرسة' : 'École'}</option>
                <option>{lang === 'ar' ? 'بنك' : 'Banque'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{tr.delivery}</label>
              <RadioGroup value={form.delivery} onChange={setField('delivery')} options={[
                { value: 'pickup', label: tr.pickup },
                { value: 'home', label: tr.home_delivery }
              ]} />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.phone}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.phone} value={form.phone || ''} onChange={e => setField('phone')(e.target.value)} /></div>
            </div>
          </FormSection>
        </>
      );
    }}
    </FormLayout>
  );
}

export function FormVie() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ delivery: 'home' });
  const setField = k => v => setForm(f => ({ ...f, [k]: v }));
  const title = lang === 'ar' ? 'شهادة الحياة' : 'Demande de Certificat de Vie';

  return (
    <FormLayout title={title} subtitle="">
      {({ tr, registerSubmit }) => {
        registerSubmit(() => form, 'vie');
        return (
        <>
          <FormSection title={tr.personal_info}>
            <PersonSection tr={tr} form={form} setField={setField} />
          </FormSection>
          <FormSection title={tr.supplemental_info}>
            <div className="form-group">
              <label className="form-label">{tr.address}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.address} value={form.address || ''} onChange={e => setField('address')(e.target.value)} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{tr.profession} <span style={{ color: '#718096', fontWeight: 400 }}>{tr.optional}</span></label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.profession} value={form.profession || ''} onChange={e => setField('profession')(e.target.value)} /></div>
              </div>
            </div>
          </FormSection>
          <FormSection title={tr.admin_info}>
            <div className="form-group">
              <label className="form-label">{tr.organism}</label>
              <select className="form-select" value={form.organism || ''} onChange={e => setField('organism')(e.target.value)}>
                <option value="">{tr.organism_placeholder}</option>
                <option>CNSS</option>
                <option>{lang === 'ar' ? 'بنك' : 'Banque'}</option>
                <option>CMR</option>
                <option>RCAR</option>
                <option>{lang === 'ar' ? 'إدارة أخرى' : 'Autre administration'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{tr.motif}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.motif} value={form.motif || ''} onChange={e => setField('motif')(e.target.value)} /></div>
            </div>
          </FormSection>
          <FormSection title={tr.request_info}>
            <div className="form-group">
              <label className="form-label">{tr.delivery}</label>
              <RadioGroup value={form.delivery} onChange={setField('delivery')} options={[
                { value: 'pickup', label: tr.pickup },
                { value: 'home', label: tr.home_delivery }
              ]} />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.phone}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.phone} value={form.phone || ''} onChange={e => setField('phone')(e.target.value)} /></div>
            </div>
          </FormSection>
        </>
      );
    }}
    </FormLayout>
  );
}

export function FormCelibat() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ delivery: 'home', marital: 'single', gender: 'male' });
  const setField = k => v => setForm(f => ({ ...f, [k]: v }));
  const title = lang === 'ar' ? 'شهادة العزوبة' : 'Demande de Certificat de Célibat';

  return (
    <FormLayout title={title} subtitle="">
      {({ tr, registerSubmit }) => {
        registerSubmit(() => form, 'celibat');
        return (
        <>
          <FormSection title={tr.personal_info}>
            <PersonSection tr={tr} form={form} setField={setField} />
          </FormSection>
          <FormSection title={tr.family_info}>
            <div className="form-group">
              <label className="form-label">{tr.marital_status}</label>
              <select className="form-select" value={form.marital} onChange={e => setField('marital')(e.target.value)}>
                <option value="single">{tr.single}</option>
                <option value="married">{tr.married}</option>
                <option value="divorced">{tr.divorced}</option>
                <option value="widowed">{tr.widowed}</option>
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{tr.profession}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.profession} value={form.profession || ''} onChange={e => setField('profession')(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr.address}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.address} value={form.address || ''} onChange={e => setField('address')(e.target.value)} /></div>
              </div>
            </div>
          </FormSection>
          <FormSection title={tr.parent_info}>
            <div className="form-group">
              <label className="form-label">{tr.father_name}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.father_name} value={form.fatherName || ''} onChange={e => setField('fatherName')(e.target.value)} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">{tr.mother_name}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.mother_name} value={form.motherName || ''} onChange={e => setField('motherName')(e.target.value)} /></div>
            </div>
          </FormSection>
          <FormSection title={tr.request_info}>
            <div className="form-group">
              <label className="form-label">{tr.motif}</label>
              <select className="form-select" value={form.motif || ''} onChange={e => setField('motif')(e.target.value)}>
                <option value="">{tr.motif_placeholder}</option>
                <option>{lang === 'ar' ? 'زواج' : 'Mariage'}</option>
                <option>{lang === 'ar' ? 'تأشيرة' : 'Visa'}</option>
                <option>{lang === 'ar' ? 'عمل' : 'Emploi'}</option>
                <option>{lang === 'ar' ? 'ملف إداري' : 'Dossier administratif'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{tr.delivery}</label>
              <RadioGroup value={form.delivery} onChange={setField('delivery')} options={[
                { value: 'pickup', label: tr.pickup },
                { value: 'home', label: tr.home_delivery }
              ]} />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.phone}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.phone} value={form.phone || ''} onChange={e => setField('phone')(e.target.value)} /></div>
            </div>
          </FormSection>
        </>
      );
    }}
    </FormLayout>
  );
}

export function FormCasierJudiciaire() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ delivery: 'pickup', casierType: 'b2', gender: 'male' });
  const setField = k => v => setForm(f => ({ ...f, [k]: v }));
  const title = lang === 'ar' ? 'السجل العدلي' : 'Casier Judiciaire';

  return (
    <FormLayout title={title} subtitle="">
      {({ tr, registerSubmit }) => {
        registerSubmit(() => form, 'casier');
        return (
        <>
          <FormSection title={tr.personal_info}>
            <PersonSection tr={tr} form={form} setField={setField} />
            <div className="form-group">
              <label className="form-label">{tr.address}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.address} value={form.address || ''} onChange={e => setField('address')(e.target.value)} /></div>
            </div>
          </FormSection>
          <FormSection title={tr.request_info}>
            <div className="form-group">
              <label className="form-label">{tr.casier_type}</label>
              <RadioGroup value={form.casierType} onChange={setField('casierType')} options={[
                { value: 'b2', label: 'Extrait B2' },
                { value: 'b3', label: 'Extrait B3' }
              ]} />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.purpose}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.purpose_placeholder} value={form.purpose || ''} onChange={e => setField('purpose')(e.target.value)} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">{tr.delivery}</label>
              <RadioGroup value={form.delivery} onChange={setField('delivery')} options={[
                { value: 'pickup', label: tr.pickup },
                { value: 'home', label: tr.home_delivery }
              ]} />
            </div>
            <div className="form-group">
              <label className="form-label">{tr.phone}</label>
              <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.phone} value={form.phone || ''} onChange={e => setField('phone')(e.target.value)} /></div>
            </div>
          </FormSection>
        </>
      );
    }}
    </FormLayout>
  );
}

export function FormDeces() {
  const { lang } = useLanguage();
  const [form, setForm] = useState({ delivery: 'pickup', gender: 'male' });
  const setField = k => v => setForm(f => ({ ...f, [k]: v }));
  const title = lang === 'ar' ? 'رسم الوفاة' : 'Demande d\'Acte de Décès';

  return (
    <FormLayout title={title} subtitle="">
      {({ tr, registerSubmit }) => {
        registerSubmit(() => form, 'deces');
        return (
        <>
          <FormSection title={lang === 'ar' ? 'معلومات المتوفى' : 'Informations sur le défunt'}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{tr.deceased_name}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.deceased_name} value={form.decLastname || ''} onChange={e => setField('decLastname')(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr.deceased_firstname}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.deceased_firstname} value={form.decFirstname || ''} onChange={e => setField('decFirstname')(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">{tr.death_date}</label>
                <input type="date" className="form-input no-icon" style={{ paddingLeft: 14 }} value={form.deathDate || ''} onChange={e => setField('deathDate')(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{tr.death_place}</label>
                <div className="input-wrap"><input className="form-input no-icon" placeholder={tr.death_place} value={form.deathPlace || ''} onChange={e => setField('deathPlace')(e.target.value)} /></div>
              </div>
            </div>
          </FormSection>
          <FormSection title={lang === 'ar' ? 'معلومات الطالب' : 'Informations du demandeur'}>
            <PersonSection tr={tr} form={form} setField={setField} />
            <div className="form-group">
              <label className="form-label">{tr.relation}</label>
              <div className="input-wrap">
                <input className="form-input no-icon" placeholder={lang === 'ar' ? 'ابن، ابنة، زوج...' : 'Fils, fille, époux(se)...'} value={form.relation || ''} onChange={e => setField('relation')(e.target.value)} />
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

export default FormResidence;
