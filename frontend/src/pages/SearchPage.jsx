import { useState } from 'react';
import { Filter } from 'lucide-react';
import TicketTable from '../components/TicketTable';

const categories = ['', 'VPN Issue', 'Password Reset', 'Software Installation', 'Laptop Issue', 'Email Access', 'Network Connectivity', 'Hardware Request'];
const statuses = ['', 'Open', 'In Progress', 'Resolved', 'Closed'];
const priorities = ['', 'Low', 'Medium', 'High', 'Critical'];

export default function SearchPage({ tickets, onSearch }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const submit = (event) => {
    event.preventDefault();
    onSearch({ query, category, status, priority });
  };

  return (
    <div className="page-stack">
      <header className="page-hero glass-panel">
        <div>
          <span className="eyebrow">Search and filter</span>
          <h2>Find historical tickets with precision.</h2>
          <p>Search by keyword, category, status, or priority to quickly locate relevant incidents.</p>
        </div>
      </header>

      <form className="glass-panel search-form" onSubmit={submit}>
        <div className="search-grid">
          <label>
            <span>Keyword</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="vpn, email, laptop..." />
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item || 'all-category'} value={item}>{item || 'All categories'}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {statuses.map((item) => <option key={item || 'all-status'} value={item}>{item || 'All statuses'}</option>)}
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              {priorities.map((item) => <option key={item || 'all-priority'} value={item}>{item || 'All priorities'}</option>)}
            </select>
          </label>
        </div>

        <button className="secondary-button" type="submit">
          <Filter size={16} />
          Apply filters
        </button>
      </form>

      <TicketTable tickets={tickets} onDelete={() => {}} canManage={false} />
    </div>
  );
}
