import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, FileText, Save, User2 } from 'lucide-react';

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const editableDefaults = {
  employee_name: '',
  department: '',
  issue_category: '',
  description: '',
  priority: 'Medium',
  status: 'Open',
  resolution_notes: '',
};

export default function TicketDetailsPage({ ticket, canManage, onUpdateTicket }) {
  const [form, setForm] = useState(editableDefaults);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (ticket) {
      setForm({
        employee_name: ticket.employee_name || '',
        department: ticket.department || '',
        issue_category: ticket.issue_category || '',
        description: ticket.description || '',
        priority: ticket.priority || 'Medium',
        status: ticket.status || 'Open',
        resolution_notes: ticket.resolution_notes || '',
      });
    }
  }, [ticket]);

  const updateField = (fieldName, value) => {
    setForm((current) => ({ ...current, [fieldName]: value }));
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await onUpdateTicket(ticket.ticket_id, form);
      setForm({
        employee_name: updated.employee_name || '',
        department: updated.department || '',
        issue_category: updated.issue_category || '',
        description: updated.description || '',
        priority: updated.priority || 'Medium',
        status: updated.status || 'Open',
        resolution_notes: updated.resolution_notes || '',
      });
      setSaveMessage('Ticket updated successfully.');
    } finally {
      setSaving(false);
    }
  };

  if (ticket === undefined) {
    return (
      <div className="glass-panel empty-state">
        <h3>Loading ticket...</h3>
        <p>Fetching ticket details, please wait.</p>
      </div>
    );
  }

  if (ticket === null) {
    return (
      <div className="glass-panel empty-state">
        <h3>Ticket not found</h3>
        <p>The ticket may have been deleted or the ID is incorrect.</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          <span className="eyebrow">Ticket details</span>
          <h2>#{ticket.ticket_id} {ticket.issue_category}</h2>
          <p>Full request context, status, and resolution notes in a single view.</p>
        </div>
        <div className={`hero-badge status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>
          {ticket.status}
        </div>
      </header>

      <section className="detail-grid">
        <article className="glass-panel detail-card">
          <div className="detail-row"><User2 size={16} /> <span>{ticket.employee_name}</span></div>
          <div className="detail-row"><ClipboardList size={16} /> <span>{ticket.department}</span></div>
          <div className="detail-row"><CalendarDays size={16} /> <span>{formatDate(ticket.created_at)}</span></div>
        </article>

        <article className="glass-panel detail-card">
          <div className="detail-row">
            <span className="muted">Priority</span>
            <span className={`pill priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
          </div>
          <div className="detail-row">
            <span className="muted">Status</span>
            <span className={`pill status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span>
          </div>
        </article>

        <article className="glass-panel detail-card full-width">
          <div className="section-heading">
            <FileText size={18} />
            <h3>Description</h3>
          </div>
          <p>{ticket.description}</p>
        </article>

        <article className="glass-panel detail-card full-width">
          <div className="section-heading">
            <FileText size={18} />
            <h3>Resolution Notes</h3>
          </div>
          <p>{ticket.resolution_notes || 'No resolution notes have been added yet.'}</p>
        </article>

        {canManage ? (
          <form className="glass-panel detail-card full-width form-card" onSubmit={submitUpdate}>
            <div className="section-heading">
              <Save size={18} />
              <h3>Admin Update Panel</h3>
            </div>

            <div className="form-grid">
              <label>
                <span>Employee Name</span>
                <input value={form.employee_name} onChange={(event) => updateField('employee_name', event.target.value)} />
              </label>
              <label>
                <span>Department</span>
                <input value={form.department} onChange={(event) => updateField('department', event.target.value)} />
              </label>
              <label>
                <span>Category</span>
                <input value={form.issue_category} onChange={(event) => updateField('issue_category', event.target.value)} />
              </label>
              <label>
                <span>Priority</span>
                <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </label>
            </div>

            <label className="full-span">
              <span>Description</span>
              <textarea rows="5" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>

            <label className="full-span">
              <span>Resolution Notes</span>
              <textarea rows="4" value={form.resolution_notes} onChange={(event) => updateField('resolution_notes', event.target.value)} />
            </label>

            {saveMessage ? <div className="status-strip">{saveMessage}</div> : null}

            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
