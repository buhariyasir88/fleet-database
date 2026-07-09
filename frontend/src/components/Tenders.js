import React from 'react';

function Tenders() {
  const handlePrint = () => window.print();

  return (
    <div>
      <div className="page-header">
        <h1>📋 Tenders</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-success" onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Tenders Management</h3>
        <p>Tender management features will be available here.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p>📌 This section is under construction.</p>
          <p>You can add tenders using the API endpoints.</p>
        </div>
      </div>
    </div>
  );
}

export default Tenders;