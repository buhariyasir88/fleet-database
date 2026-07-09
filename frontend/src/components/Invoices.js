import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    contract_id: '',
    vessel_name: '',
    charterer: '',
    dcr: '',
    duration: '',
    submission_date: '',
    total_amount: '',
    expected_payment_date: '',
    month: '',
    budgeted_sale: '',
    actual_bill: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/invoices');
      console.log('Fetched invoices:', response.data);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      alert('Failed to fetch invoices. Check console for details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/invoices/${editingId}`, formData);
        alert('Invoice updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/invoices', formData);
        alert('Invoice added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        contract_id: '',
        vessel_name: '',
        charterer: '',
        dcr: '',
        duration: '',
        submission_date: '',
        total_amount: '',
        expected_payment_date: '',
        month: '',
        budgeted_sale: '',
        actual_bill: ''
      });
      await fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Check console for details.');
    }
  };

  const handleEdit = (invoice) => {
    setEditingId(invoice.id);
    setFormData({
      contract_id: invoice.contract_id || '',
      vessel_name: invoice.vessel_name || '',
      charterer: invoice.charterer || '',
      dcr: invoice.dcr || '',
      duration: invoice.duration || '',
      submission_date: invoice.submission_date || '',
      total_amount: invoice.total_amount || '',
      expected_payment_date: invoice.expected_payment_date || '',
      month: invoice.month || '',
      budgeted_sale: invoice.budgeted_sale || '',
      actual_bill: invoice.actual_bill || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`http://localhost:5000/api/invoices/${id}`);
        await fetchInvoices();
        alert('Invoice deleted successfully!');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1>💰 Invoices</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({
              contract_id: '',
              vessel_name: '',
              charterer: '',
              dcr: '',
              duration: '',
              submission_date: '',
              total_amount: '',
              expected_payment_date: '',
              month: '',
              budgeted_sale: '',
              actual_bill: ''
            });
            setShowModal(true);
          }}>
            + Add Invoice
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
                <th>ID</th>
                <th>Vessel</th>
                <th>Charterer</th>
                <th>DCR</th>
                <th>Duration</th>
                <th>Total Amount</th>
                <th>Month</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No invoices found. Click "Add Invoice" to create one.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.vessel_name}</td>
                    <td>{invoice.charterer}</td>
                    <td>{invoice.dcr}</td>
                    <td>{invoice.duration}</td>
                    <td>${parseFloat(invoice.total_amount).toLocaleString()}</td>
                    <td>{invoice.month}</td>
                    <td>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(invoice)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(invoice.id)}>
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
              <h2>{editingId ? 'Edit Invoice' : 'Add New Invoice'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Contract ID</label>
                  <input
                    type="number"
                    value={formData.contract_id}
                    onChange={(e) => setFormData({...formData, contract_id: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Vessel Name *</label>
                  <input
                    type="text"
                    value={formData.vessel_name}
                    onChange={(e) => setFormData({...formData, vessel_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Charterer</label>
                  <input
                    type="text"
                    value={formData.charterer}
                    onChange={(e) => setFormData({...formData, charterer: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>DCR</label>
                  <input
                    type="text"
                    value={formData.dcr}
                    onChange={(e) => setFormData({...formData, dcr: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (days)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Submission Date *</label>
                  <input
                    type="date"
                    value={formData.submission_date}
                    onChange={(e) => setFormData({...formData, submission_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expected Payment Date</label>
                  <input
                    type="date"
                    value={formData.expected_payment_date}
                    onChange={(e) => setFormData({...formData, expected_payment_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Month</label>
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    placeholder="e.g., January 2024"
                  />
                </div>
                <div className="form-group">
                  <label>Budgeted Sale ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budgeted_sale}
                    onChange={(e) => setFormData({...formData, budgeted_sale: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Actual Bill ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_bill}
                  onChange={(e) => setFormData({...formData, actual_bill: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingId ? 'Update Invoice' : 'Save Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;