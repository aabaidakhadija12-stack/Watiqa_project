import React from 'react';

export function FormField({ label, required, icon, children, half }) {
  return (
    <div className="form-group" style={half ? {} : {}}>
      {label && (
        <label className="form-label">
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

export function TextInput({ icon, placeholder, value, onChange, type = 'text' }) {
  return (
    <div className="input-wrap">
      {icon && <span className="input-icon">{icon}</span>}
      <input
        type={type}
        className="form-input"
        style={!icon ? { paddingLeft: '14px' } : {}}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export function SelectInput({ options, value, onChange, placeholder }) {
  return (
    <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function RadioGroup({ options, value, onChange }) {
  return (
    <div className="radio-group">
      {options.map(o => (
        <label key={o.value} className={`radio-item ${value === o.value ? 'selected' : ''}`}>
          <input type="radio" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.icon && <span>{o.icon}</span>}
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function Counter({ value, onChange, min = 1, max = 10 }) {
  return (
    <div className="counter">
      <button className="counter-btn" onClick={() => value > min && onChange(value - 1)}>−</button>
      <span className="counter-val">{value}</span>
      <button className="counter-btn" onClick={() => value < max && onChange(value + 1)}>+</button>
    </div>
  );
}

export function Stepper({ steps, current, lang }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`step-item ${i === current ? 'active' : i < current ? 'done' : ''}`}>
            <div className="step-num">{i < current ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
          {i < steps.length - 1 && <span className="step-arrow">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function FormSection({ title, icon, children }) {
  return (
    <div className="form-section">
      <div className="form-section-title">
        {icon && <span>{icon}</span>}
        {title}
      </div>
      {children}
    </div>
  );
}
