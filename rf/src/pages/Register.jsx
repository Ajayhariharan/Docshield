// src/pages/Register.jsx
import React, { useState } from 'react';
import axios from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();

  

    try {
      await axios.post('/auth/register', { username, email, password });
      setMessage('Registration successful! Please login.');
      navigate('/login');
    } catch {
      setMessage('Registration failed');
    }
  };

  return (
    <div style={pageStyle}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.7); }
        button:hover { transform: scale(1.05) !important; }
        @keyframes fadeInUp {
          0% {opacity: 0; transform: translateY(30px);}
          100% {opacity: 1; transform: translateY(0);}
        }
        .register-card { animation: fadeInUp 0.8s ease forwards; }
      `}</style>

      <div style={cardStyle} className="register-card">
        <h2 style={titleStyle}>Register</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputWrapper}>
            <FaUser style={iconStyle} />
            <input
              required
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              minLength={3}
              style={inputStyle}
            />
          </div>
          <div style={inputWrapper}>
            <FaEnvelope style={iconStyle} />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          
          <div style={inputWrapper}>
            <FaLock style={iconStyle} />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              style={inputStyle}
            />
          </div>
          <button type="submit" style={btnStyle}>Register</button>
        </form>
        {message && <p style={messageStyle}>{message}</p>}
        <p style={loginText}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={linkStyle}
            onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.target.style.textDecoration = 'none')}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

/* === Styles === */
const pageStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  fontFamily: 'Arial, sans-serif'
};

const cardStyle = {
  background: 'rgba(255, 255, 255, 0)',
  backdropFilter: 'blur(2px)',
  padding: '45px',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  textAlign: 'center',
  width: '360px',
  color: 'white',
  transition: 'all 0.3s ease'
};

const titleStyle = {
  marginBottom: '25px',
  fontSize: '28px',
  fontWeight: 'bold',
  textShadow: '0 0 10px rgba(255,255,255,0.3)'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
};

const inputWrapper = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '25px',
  padding: '12px 15px',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease'
};

const iconStyle = {
  color: 'white',
  marginRight: '12px',
  fontSize: '16px'
};

const inputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'white',
  fontSize: '15px',
  borderRadius: '25px'
};

const btnStyle = {
  padding: '14px',
  borderRadius: '25px',
  border: 'none',
  background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  transform: 'scale(1)'
};

const messageStyle = {
  color: '#ff6b6b',
  marginTop: '14px',
  fontSize: '14px',
  textShadow: '0 0 6px rgba(255,0,0,0.5)'
};

const loginText = {
  marginTop: '22px',
  fontSize: '14px'
};

const linkStyle = {
  color: '#4CAF50',
  textDecoration: 'none',
  fontWeight: 'bold',
  transition: '0.3s'
};
