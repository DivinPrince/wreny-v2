interface AdminFormFieldProps {
  label: string
  name: string
  type?: 'text' | 'password' | 'number' | 'email' | 'tel' | 'url' | 'select' | 'textarea'
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  error?: string
}

export default function AdminFormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  options,
  error,
}: AdminFormFieldProps) {
  let input: React.ReactNode

  if (type === 'select') {
    input = (
      <select
        className="adm-form-select"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  } else if (type === 'textarea') {
    input = (
      <textarea
        className="adm-form-textarea"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={4}
      />
    )
  } else {
    input = (
      <input
        className="adm-form-input"
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    )
  }

  return (
    <div className="adm-form-field">
      <label className="adm-form-label" htmlFor={name}>
        {label}
        {required && <span className="adm-form-required">*</span>}
      </label>
      {input}
      {error && <span className="adm-form-error">{error}</span>}
    </div>
  )
}
