import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Utilization() {
  const [utilizations, setUtilizations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    vessel_id: '',
    month: '',
    year: '',
    budget_days: '',
    onhire_days: '',
    variance_days: '',
    variance_percent: '',
    remarks: ''
  });

  useEffect(() => {
    fetchUtilizations();
  }, []);

  const fetchUtilizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/utilization');
      console.log('Fetched utilization data:', response.data);
      setUtilizations(response.data);
    } catch (error) {
      console.error('Error fetching utilizations:', error);
      alert('Failed to fetch utilization data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const budgetDays = parseFloat(formData.budget_days) || 0;
      const onhireDays = parseFloat(formData.onhire_days) || 0;
      const varianceDays = onhireDays - budgetDays;
      const variancePercent = budgetDays > 0 ? (varianceDays / budgetDays) * 100 : 0;

      const dataToSend = {
        ...formData,
        variance_days: varianceDays,
        variance_percent: variancePercent
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/utilization/${editingId}`, dataToSend);
        alert('Utilization updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/utilization', dataToSend);
        alert('Utilization added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        vessel_id: '',
        month: '',
        year: '',
        budget_days: '',
        onhire_days: '',
        variance_days: '',
        variance_percent: '',
        remarks: ''
      });
      await fetchUtilizations();
    } catch (error) {
      console.error('Error saving utilization:', error);
      alert('Failed to save utilization. Please check the console for details.');
    }
  };

  const handleEdit = (util) => {
    setEditingId(util.id);
    setFormData({
      vessel_id: util.vessel_id || '',
      month: util.month || '',
      year: util.year || '',
      budget_days: util.budget_days || '',
      onhire_days: util.onhire_days || '',
      variance_days: util.variance_days || '',
      variance_percent: util.variance_percent || '',
      remarks: util.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this utilization record?')) {
      try {
        await axios.delete(`http://localhost:5000/api/utilization/${id}`);
        await fetchUtilizations();
        alert('Utilization record deleted successfully!');
      } catch (error) {
        console.error('Error deleting utilization:', error);
        alert('Failed to delete utilization record.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1>📈 Vessel Utilization</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({
              vessel_id: '',
              month: '',
              year: '',
              budget_days: '',
              onhire_days: '',
              variance_days: '',
              variance_percent: '',
              remarks: ''
            });
            setShowModal(true);
          }}>
            + Add Utilization Record
          </button>
          <button className="btn btn-success" onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vessel ID</th>
                <th>Month</th>
                <th>Year</th>
                <th>Budget Days</th>
                <th>On-Hire Days</th>
                <th>Variance (Days)</th>
                <th>Variance (%)</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilizations.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                    No utilization records found. Click "Add Utilization Record" to create one.
                  </td>
                </tr>
              ) : (
                utilizations.map((util) => (
                  <tr key={util.id}>
                    <td>{util.vessel_id}</td>
                    <td>{util.month}</td>
                    <td>{util.year}</td>
                    <td>{util.budget_days}</td>
                    <td>{util.onhire_days}</td>
                    <td style={{ color: util.variance_days < 0 ? '#dc3545' : '#28a745' }}>
                      {util.variance_days}
                    </td>
                    <td style={{ color: util.variance_percent < 0 ? '#dc3545' : '#28a745' }}>
                      {util.variance_percent ? util.variance_percent.toFixed(1) + '%' : '0%'}
                    </td>
                    <td>{util.remarks}</td>
                    <td>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(util)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(util.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Utilization' : 'Add Utilization Record'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Vessel ID *</label>
                  <input
                    type="number"
                    value={formData.vessel_id}
                    onChange={(e) => setFormData({...formData, vessel_id: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    required
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Budget Days *</label>
                  <input
                    type="number"
                    value={formData.budget_days}
                    onChange={(e) => setFormData({...formData, budget_days: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>On-Hire Days *</label>
                  <input
                    type="number"
                    value={formData.onhire_days}
                    onChange={(e) => setFormData({...formData, onhire_days: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <p><strong>Variance will be calculated automatically:</strong></p>
                <p>Variance Days = On-Hire Days - Budget Days</p>
                <p>Variance % = (Variance Days / Budget Days) × 100</p>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingId ? 'Update Utilization' : 'Save Utilization'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Utilization;