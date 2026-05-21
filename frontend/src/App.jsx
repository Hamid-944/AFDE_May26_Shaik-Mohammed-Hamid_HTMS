import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Shell from './components/Shell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import CreateTicketPage from './pages/CreateTicketPage';
import SearchPage from './pages/SearchPage';
import TicketDetailsPage from './pages/TicketDetailsPage';
import { clearSession, createTicket, deleteTicket, fetchTicket, fetchTickets, getStoredUser, login, searchTickets, setSession, updateTicket } from './api';

function AnimatedRoute({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28 }}
    >
      {children}
    </motion.div>
  );
}

function TicketDetailsRoute({ tickets, canManage, onUpdateTicket }) {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(tickets.find((item) => String(item.ticket_id) === ticketId));

  useEffect(() => {
    let ignore = false;
    if (ticket) return undefined;
    fetchTicket(ticketId).then((result) => {
      if (!ignore) setTicket(result);
    }).catch(() => {
      if (!ignore) setTicket(null);
    });
    return () => {
      ignore = true;
    };
  }, [ticketId, ticket]);

  return <TicketDetailsPage ticket={ticket} canManage={canManage} onUpdateTicket={onUpdateTicket} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getStoredUser());
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const canManage = user?.role === 'admin';

  const refreshTickets = async (params = {}) => {
    setLoadingTickets(true);
    try {
      const data = params && Object.keys(params).length ? await searchTickets(params) : await fetchTickets();
      setTickets(data);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshTickets();
    }
  }, [user]);

  const handleLogin = async (email, password) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const response = await login(email, password);
      setSession(response.access_token, response.user);
      setUser(response.user);
      navigate('/');
    } catch (error) {
      setAuthError(error?.response?.data?.detail || 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setTickets([]);
    navigate('/login');
  };

  const handleCreateTicket = async (payload) => {
    await createTicket(payload);
    await refreshTickets();
    navigate('/tickets');
  };

  const handleDeleteTicket = async (ticketId) => {
    await deleteTicket(ticketId);
    await refreshTickets();
  };

  const handleUpdateTicket = async (ticketId, payload) => {
    const updatedTicket = await updateTicket(ticketId, payload);
    await refreshTickets();
    return updatedTicket;
  };

  const handleSearch = async (params) => {
    await refreshTickets(params);
    navigate('/search');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} loading={authLoading} error={authError} />;
  }

  return (
    <Shell user={user} onLogout={handleLogout}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedRoute><DashboardPage tickets={tickets} user={user} /></AnimatedRoute>} />
          <Route path="/tickets" element={<AnimatedRoute><TicketsPage tickets={tickets} onDeleteTicket={handleDeleteTicket} canManage={canManage} /></AnimatedRoute>} />
          <Route path="/create" element={<AnimatedRoute><CreateTicketPage onSubmitTicket={handleCreateTicket} user={user} /></AnimatedRoute>} />
          <Route path="/search" element={<AnimatedRoute><SearchPage tickets={tickets} onSearch={handleSearch} /></AnimatedRoute>} />
          <Route path="/tickets/:ticketId" element={<AnimatedRoute><TicketDetailsRoute tickets={tickets} canManage={canManage} onUpdateTicket={handleUpdateTicket} /></AnimatedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {loadingTickets ? <div className="loading-strip">Refreshing support queue...</div> : null}
    </Shell>
  );
}
