import React, { useState } from 'react';
import axios from '../api/axiosConfig';

export default function ShareModal({ file, onClose }) {
  const [expiryType, setExpiryType] = useState('temporary'); // 'temporary' or 'permanent'
  const [expiryDateTime, setExpiryDateTime] = useState('');
  const [allowedUsers, setAllowedUsers] = useState('');
  const [message, setMessage] = useState('');

  const accessType = 'restricted';

  const handleShare = async () => {
    if (expiryType === 'temporary' && !expiryDateTime) {
      setMessage('⚠️ Please select an expiry date and time.');
      return;
    }

    const expiryDate =
      expiryType === 'permanent'
        ? null
        : new Date(expiryDateTime).toISOString();

    if (expiryType !== 'permanent' && new Date(expiryDateTime) <= new Date()) {
      setMessage('⚠️ Expiry time must be in the future.');
      return;
    }

    const allowedEmails = allowedUsers
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    if (allowedEmails.length === 0) {
      setMessage('⚠️ Please enter at least one email.');
      return;
    }

    const body = {
      expiry: expiryDate,
      accessType,
      allowedUsers: allowedEmails,
    };

    try {
      const res = await axios.post(`/files/share/${file._id}`, body);
      console.log("Share response:", res.data);

      if (res.data && res.data.link) {
        setMessage('✅ File shared successfully!');
      } else {
        setMessage('⚠️ File shared but no link returned by server');
      }
    } catch (err) {
      console.error("Share error:", err.response?.data || err.message);
      setMessage('❌ Error sharing the file');
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle}>×</button>

        <h3 style={{ marginBottom: '15px' }}>Share “{file.originalname}”</h3>

        {/* Expiry Type Selection */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px' }}>Expiry Type:</label>
          <select
            value={expiryType}
            onChange={e => setExpiryType(e.target.value)}
            style={selectStyle}
          >
            <option value="temporary">Set Expiry Date & Time</option>
            <option value="permanent">Permanent (No Expiry)</option>
          </select>
        </div>

        {/* Calendar + Time Picker */}
        {expiryType === 'temporary' && (
          <div style={{ marginBottom: '12px' }}>
            <label>Select Expiry Date & Time:</label>
            <input
              type="datetime-local"
              value={expiryDateTime}
              onChange={e => setExpiryDateTime(e.target.value)}
              style={inputStyle}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}

        {/* Allowed Users */}
        <div style={{ marginBottom: '12px' }}>
          <label>Allowed Emails (comma separated):</label>
          <input
            type="text"
            value={allowedUsers}
            onChange={e => setAllowedUsers(e.target.value)}
            style={inputStyle}
            placeholder="e.g. user1@mail.com, user2@mail.com"
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button
            onClick={handleShare}
            style={btnPrimary}
            onMouseEnter={e => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
          >
            Generate Link & Share
          </button>
        </div>

        {/* Message Box */}
        {message && (
          <div style={msgBoxStyle}>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==== Styles ==== */
const overlayStyle = {
  background: 'rgba(0,0,0,0.6)',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: '#1e1e1e',
  padding: '25px',
  width: '420px',
  borderRadius: '12px',
  color: 'white',
  boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
  position: 'relative'
};

const closeBtnStyle = {
  position: 'absolute',
  top: '10px',
  right: '12px',
  background: 'transparent',
  border: 'none',
  fontSize: '22px',
  color: '#e53935',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '20px',
  border: '1px solid #555',
  background: '#2a2a2a',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  marginTop: '6px',
};

const inputStyle = {
  display: 'block',
  width: '93%',
  marginTop: '6px',
  padding: '10px 14px',
  borderRadius: '20px',
  border: '1px solid #555',
  background: '#2a2a2a',
  color: 'white',
  fontSize: '14px',
  outline: 'none'
};

const btnPrimary = {
  background: '#4CAF50',
  color: 'white',
  padding: '10px 14px',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  flex: 1,
  fontSize: '15px',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  transform: 'scale(1)',
};

const msgBoxStyle = {
  marginTop: '15px',
  textAlign: 'center',
  fontWeight: 'bold',
  background: '#111',
  padding: '10px',
  borderRadius: '12px',
  wordWrap: 'break-word',
  overflowWrap: 'anywhere'
};
