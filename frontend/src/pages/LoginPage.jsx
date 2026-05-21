import { useState } from 'react';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Support Admin', email: 'admin@helpdesk.example.com', password: 'admin123', role: 'admin' },
  { name: 'Demo Employee', email: 'employee@helpdesk.example.com', password: 'employee123', role: 'employee' },
  { name: 'Marcus Chen', email: 'marcus.chen@helpdesk.example.com', password: 'marcus123', role: 'employee' },
  { name: 'Priya Patel', email: 'priya.patel@helpdesk.example.com', password: 'priya123', role: 'employee' },
];

export default function LoginPage({ onLogin, loading, error }) {
  const [email, setEmail] = useState('admin@helpdesk.example.com');
  const [password, setPassword] = useState('admin123');

  const submit = (event) => {
    event.preventDefault();
    onLogin(email, password);
  };

  const fillAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <div className="auth-copy">
          <span className="eyebrow">FastAPI + React + MySQL</span>
          <h1>Support operations with a cinematic, enterprise-grade interface.</h1>
          <p>
            A high-clarity ticket console for employees and support admins, built to look premium while staying practical.
          </p>
        </div>

        <div className="hero-panels">
          <div className="hero-card highlight">
            <Sparkles size={18} />
            <strong>Distinctive UI</strong>
            <span>Layered gradients, glass panels, and motion for a memorable capstone.</span>
          </div>
          <div className="hero-card">
            <LockKeyhole size={18} />
            <strong>Secure access</strong>
            <span>JWT auth with role-aware views for employee and admin workflows.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel glass-panel">
        <div>
          <p className="eyebrow">Sign in</p>
          <h2>Enter the support command center</h2>
          <p className="muted">Click any account below to fill credentials, then sign in.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@helpdesk.example.com" />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Unlock workspace'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div>
          <p className="demo-label">Demo accounts — click to fill</p>
          <div className="demo-list">
            {DEMO_ACCOUNTS.map((account) => (
              <div
                key={account.email}
                className="demo-credential"
                role="button"
                tabIndex={0}
                onClick={() => fillAccount(account)}
                onKeyDown={(e) => { if (e.key === 'Enter') fillAccount(account); }}
              >
                <span className={`pill ${account.role === 'admin' ? 'status-in-progress' : 'soft'}`}>
                  {account.role}
                </span>
                <div className="demo-info">
                  <strong>{account.name}</strong>
                  <small>{account.email} · {account.password}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
