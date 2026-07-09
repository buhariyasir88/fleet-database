import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Vessels from './components/Vessels';
import Contracts from './components/Contracts';
import Tenders from './components/Tenders';
import Invoices from './components/Invoices';
import Utilization from './components/Utilization';
import Reports from './components/Reports';
import './App.css';

// Setup axios default
axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
  }, []);

  const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('/api/login', { username, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLogin(response.data.user);
      } catch (err) {
        setError('Invalid username or password');
      }
    };

    return (
      <div className="login-container">
        <div className="login-box">
          <h2>⚓ Fleet Management System</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit">Login</button>
          </form>
          <div className="login-help">
            <p>Admin: admin / admin123</p>
            <p>User: chartering / chartering123</p>
          </div>
        </div>
      </div>
    );
  };

  const Layout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      navigate('/login');
    };

    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="logo">
            <h2>⚓ Fleet DB</h2>
          </div>
          <nav>
            <Link to="/">📊 Dashboard</Link>
            <Link to="/clients">👥 Clients</Link>
            <Link to="/vessels">🚢 Vessels</Link>
            <Link to="/contracts">📄 Contracts</Link>
            <Link to="/tenders">📋 Tenders</Link>
            <Link to="/invoices">💰 Invoices</Link>
            <Link to="/utilization">📈 Utilization</Link>
            <Link to="/reports">📊 Reports</Link>
          </nav>
          <div className="sidebar-footer">
            <span>👤 {user?.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </aside>
        <main className="main-content">
          {children}
        </main>
      </div>
    );
  };

  if (!isLoggedIn) {
    return <Login onLogin={(userData) => { setIsLoggedIn(true); setUser(userData); }} />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/vessels" element={<Vessels />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/utilization" element={<Utilization />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;