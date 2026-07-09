import React from 'react';

function Reports() {
  const handlePrint = () => window.print();

  return (
    <div>
      <div className="page-header">
        <h1>📊 Reports</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-success" onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Reports Dashboard</h3>
        <p>Comprehensive reports will be available here.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p>📌 This section is under construction.</p>
          <p>Reports will include:</p>
          <ul>
            <li>Client reports</li>
            <li>Vessel utilization reports</li>
            <li>Financial reports</li>
            <li>Contract performance reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Reports;