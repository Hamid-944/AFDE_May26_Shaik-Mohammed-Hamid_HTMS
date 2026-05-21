import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const categories = [
  'VPN Issue',
  'Password Reset',
  'Software Installation',
  'Laptop Issue',
  'Email Access',
  'Network Connectivity',
  'Hardware Request',
];

const priorities = ['Low', 'Medium', 'High', 'Critical'];

function buildDefaultForm(user) {
  return {
    employee_name: user?.role === 'employee' ? (user?.full_name || '') : '',
    department: '',
    issue_category: 'VPN Issue',
    description: '',
    priority: 'Medium',
    status: 'Open',
    resolution_notes: '',
  };
}

export default function CreateTicketPage({ onSubmitTicket, user }) {
  const [form, setForm] = useState(() => buildDefaultForm(user));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (form.employee_name.trim().length < 2) nextErrors.employee_name = 'Employee name is required.';
    if (form.department.trim().length < 2) nextErrors.department = 'Department is required.';
    if (form.description.trim().length < 10) nextErrors.description = 'Describe the issue with at least 10 characters.';
    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      await onSubmitTicket(form);
      setForm(buildDefaultForm(user));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          <span className="eyebrow">Create request</span>
          <h2>Raise a new support incident in seconds.</h2>
          <p>Structured ticket intake keeps the queue clean, searchable, and audit-friendly.</p>
        </div>
        <div className="hero-badge">
          <PlusCircle size={18} />
          <span>New ticket entry</span>
        </div>
      </header>

      <form className="glass-panel form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>
            <span>Employee Name</span>
            <input
              value={form.employee_name}
              onChange={(event) => updateField('employee_name', event.target.value)}
              readOnly={user?.role === 'employee'}
              className={user?.role === 'employee' ? 'input-locked' : ''}
            />
            {errors.employee_name ? <small className="form-error-inline">{errors.employee_name}</small> : null}
          </label>
          <label>
            <span>Department</span>
            <input value={form.department} onChange={(event) => updateField('department', event.target.value)} />
            {errors.department ? <small className="form-error-inline">{errors.department}</small> : null}
          </label>
          <label>
            <span>Category</span>
            <select value={form.issue_category} onChange={(event) => updateField('issue_category', event.target.value)}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
        </div>

        <label className="full-span">
          <span>Description</span>
          <textarea rows="6" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          {errors.description ? <small className="form-error-inline">{errors.description}</small> : null}
        </label>

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit ticket'}
        </button>
      </form>
    </div>
  );
}
