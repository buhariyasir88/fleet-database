import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    vessels: 0,
    activeContracts: 0,
    completedContracts: 0
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-success" onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="number">{stats.clients || 0}</div>
          <div className="label">Total Clients</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.vessels || 0}</div>
          <div className="label">Total Vessels</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.activeContracts || 0}</div>
          <div className="label">Active Contracts</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.completedContracts || 0}</div>
          <div className="label">Completed Contracts</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Recent Activity</h3>
        <p>Dashboard overview will be displayed here.</p>
      </div>
    </div>
  );
}

export default Dashboard;