import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function TicketTable({ tickets, onDelete, canManage }) {
  if (!tickets.length) {
    return (
      <div className="empty-state glass-panel">
        <h3>No tickets found</h3>
        <p>Start by creating a ticket or loosen the current filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap glass-panel">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.ticket_id}>
              <td>#{ticket.ticket_id}</td>
              <td>{ticket.employee_name}</td>
              <td>{ticket.issue_category}</td>
              <td><span className={`pill priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
              <td><span className={`pill status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.status}</span></td>
              <td>{formatDate(ticket.created_at)}</td>
              <td className="table-actions">
                <Link className="table-link" to={`/tickets/${ticket.ticket_id}`}>
                  View <ArrowRight size={14} />
                </Link>
                {canManage ? (
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => {
                      if (window.confirm(`Delete ticket #${ticket.ticket_id}? This cannot be undone.`)) {
                        onDelete(ticket.ticket_id);
                      }
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
