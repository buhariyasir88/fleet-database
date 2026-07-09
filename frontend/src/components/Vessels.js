import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Vessels() {
  const [vessels, setVessels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    flag: '',
    year: '',
    grt: '',
    dwt: '',
    speed: '',
    total_seat: ''
  });

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vessels');
      setVessels(response.data);
    } catch (error) {
      console.error('Error fetching vessels:', error);
      alert('Failed to fetch vessels');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/vessels/${editingId}`, formData);
        alert('Vessel updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/vessels', formData);
        alert('Vessel added successfully!');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', type: '', flag: '', year: '', grt: '', dwt: '', speed: '', total_seat: '' });
      await fetchVessels();
    } catch (error) {
      console.error('Error saving vessel:', error);
      alert('Failed to save vessel.');
    }
  };

  const handleEdit = (vessel) => {
    setEditingId(vessel.id);
    setFormData({
      name: vessel.name || '',
      type: vessel.type || '',
      flag: vessel.flag || '',
      year: vessel.year || '',
      grt: vessel.grt || '',
      dwt: vessel.dwt || '',
      speed: vessel.speed || '',
      total_seat: vessel.total_seat || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vessel?')) {
      try {
        await axios.delete(`http://localhost:5000/api/vessels/${id}`);
        await fetchVessels();
        alert('Vessel deleted successfully!');
      } catch (error) {
        console.error('Error deleting vessel:', error);
        alert('Failed to delete vessel.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚢 Vessels</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: '', flag: '', year: '', grt: '', dwt: '', speed: '', total_seat: '' });
            setShowModal(true);
          }}>
            + Add Vessel
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
                <th>Name</th>
                <th>Type</th>
                <th>Flag</th>
                <th>Year</th>
                <th>GRT</th>
                <th>DWT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vessels.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No vessels found. Click "Add Vessel" to create one.
                  </td>
                </tr>
              ) : (
                vessels.map((vessel) => (
                  <tr key={vessel.id}>
                    <td>{vessel.name}</td>
                    <td>{vessel.type}</td>
                    <td>{vessel.flag}</td>
                    <td>{vessel.year}</td>
                    <td>{vessel.grt}</td>
                    <td>{vessel.dwt}</td>
                    <td>
                      <button className="btn btn-warning btn-sm" onClick={() => handleEdit(vessel)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(vessel.id)}>
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
              <h2>{editingId ? 'Edit Vessel' : 'Add New Vessel'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Vessel Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Flag</label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={(e) => setFormData({...formData, flag: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Year Built</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>GRT</label>
                  <input
                    type="number"
                    value={formData.grt}
                    onChange={(e) => setFormData({...formData, grt: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>DWT</label>
                  <input
                    type="number"
                    value={formData.dwt}
                    onChange={(e) => setFormData({...formData, dwt: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Speed (knots)</label>
                  <input
                    type="text"
                    value={formData.speed}
                    onChange={(e) => setFormData({...formData, speed: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Total Seats</label>
                <input
                  type="number"
                  value={formData.total_seat}
                  onChange={(e) => setFormData({...formData, total_seat: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingId ? 'Update Vessel' : 'Save Vessel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vessels;