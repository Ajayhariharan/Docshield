import React, { useState, useContext } from 'react';
import axios from '../api/axiosConfig';
import { AuthContext } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { identifier, password });
      login(res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={pageStyle}>
      {/* Inject keyframes + placeholder color + hover here */}
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          input::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          button:hover {
            transform: scale(1.05) !important;
          }
        `}
      </style>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Login</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputWrapper}>
            <FaUser style={iconStyle} />
            <input
              required
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
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
              style={inputStyle}
            />
          </div>
          <button type="submit" style={btnStyle}>
            Login
          </button>
        </form>
        {error && <p style={errorStyle}>{error}</p>}
        <p style={registerText}>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            style={linkStyle}
            onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.target.style.textDecoration = 'none')}
          >
            Register here
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
  background: 'linear-gradient(135deg, #0D0B1E, #1A103D, #2E1A47, #3B1F5E)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  fontFamily: 'Arial, sans-serif'
};

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(8px)',
  padding: '45px',
  borderRadius: '20px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
  textAlign: 'center',
  width: '360px',
  color: 'white',
  transition: 'all 0.3s ease'
};

const titleStyle = {
  marginBottom: '25px',
  fontSize: '28px',
  fontWeight: 'bold',
  textShadow: '0 0 12px rgba(150, 100, 220, 0.7)'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px'
};

const inputWrapper = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.08)',
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
  background: 'linear-gradient(135deg, #5A189A, #3C1361)',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
  transform: 'scale(1)'
};

const errorStyle = {
  color: '#ff6b6b',
  marginTop: '14px',
  fontSize: '14px',
  textShadow: '0 0 6px rgba(255,0,0,0.5)'
};

const registerText = {
  marginTop: '22px',
  fontSize: '14px'
};

const linkStyle = {
  color: '#9D4EDD',
  textDecoration: 'none',
  fontWeight: 'bold',
  transition: '0.3s'
};
