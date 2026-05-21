import TicketTable from '../components/TicketTable';

export default function TicketsPage({ tickets, onDeleteTicket, canManage }) {
  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          {canManage ? (
            <>
              <span className="eyebrow">Ticket inventory</span>
              <h2>Monitor every support request in one place.</h2>
              <p>View, manage, and resolve tickets across all employees.</p>
            </>
          ) : (
            <>
              <span className="eyebrow">My tickets</span>
              <h2>Your submitted support requests.</h2>
              <p>Track status updates and resolution notes for tickets you've raised.</p>
            </>
          )}
        </div>
      </header>

      <TicketTable tickets={tickets} onDelete={onDeleteTicket} canManage={canManage} />
    </div>
  );
}
