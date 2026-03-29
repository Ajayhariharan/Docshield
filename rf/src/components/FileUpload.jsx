import React, { useState } from 'react';
import axios from '../api/axiosConfig';

export default function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleChange = e => {
    setFile(e.target.files[0]);
    setMessage('');
    setShowSuccessAnimation(false);  // reset animation on new file select
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return setMessage('Please select a file');
    setUploading(true);
    setMessage('');
    setShowSuccessAnimation(false);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await axios.post('/files/upload', formData);
      setMessage(res.data.message || 'Upload successful!');
      setShowSuccessAnimation(true);
      onUploadSuccess && onUploadSuccess();
    } catch (error) {
      setMessage('Upload failed');
      setShowSuccessAnimation(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={outerWrapper}>
      <div style={containerStyle}>
        {!showSuccessAnimation ? (
          <>
            <h2 style={titleStyle}>Upload Your Document</h2>
            <form onSubmit={handleSubmit} style={formStyle}>
              <input type="file" onChange={handleChange} style={fileInputStyle} />
              <button
                type="submit"
                style={{ 
                  ...uploadBtnStyle, 
                  cursor: uploading ? 'not-allowed' : 'pointer' 
                }}
                disabled={uploading}
                onMouseOver={e => { if (!uploading) e.currentTarget.style.transform = 'scale(1.05)'}}
                onMouseOut={e => { if (!uploading) e.currentTarget.style.transform = 'scale(1)'}}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
            <p style={{ 
              fontSize: "16px", 
              fontWeight: "600", 
              marginTop: "12px",
              color: uploading ? "#1e90ff" : "limegreen" 
            }}>
              {message}
            </p>
          </>
        ) : (
          <SuccessAnimation message={message} onReset={() => setShowSuccessAnimation(false)} />
        )}
      </div>
    </div>
  );
}

function SuccessAnimation({ message, onReset }) {
  return (
    <div style={animationWrapperStyle} onClick={onReset} title="Click to upload another file">
      <div style={packageBoxStyle}>
        <div style={boxTopStyle}>
          <div style={boxTapeStyle}></div>
          <div style={boxTapeStyle}></div>
        </div>
        <div style={boxBottomStyle}></div>
      </div>
      <h2 style={{ color: '#0066f6ff', marginTop: 20 }}>{message || 'Package Delivered!'}</h2>
      <p style={{ color: '#ffffffdd' }}>Click again to upload another file.</p>
    </div>
  );
}

/* --- Styles --- */
const outerWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  height: "100%",
  textAlign: "center",
  userSelect: "none",
};

const containerStyle = {
  background: "rgba(0,0,0,0.4)",
  padding: "40px 50px",
  borderRadius: "20px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  maxWidth: "500px",
  width: "100%",
  textAlign: "center",
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "700",
  marginBottom: "20px",
  color: "#f5f5f5",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  justifyContent: "center",
  alignItems: "center",
};

const fileInputStyle = {
  padding: "8px",
  borderRadius: "10px",
  background: "#4e0c0c4a",
  border: "1px solid #ff0000ff",
  cursor: "pointer",
};

const uploadBtnStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
  backgroundColor: "#3b82f6",
  color: "#fff",
  fontWeight: "600",
  transition: "all 0.3s ease",
};

const animationWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: 30,
  cursor: "pointer",
};

const packageBoxStyle = {
  width: 120,
  height: 90,
  borderRadius: 12,
  position: 'relative',
  backgroundColor: '#fbbf24',
  boxShadow: '0 0 8px 1px #fbbf24',
  animation: 'pulseGlow 1.5s ease-in-out infinite',
};

const boxTopStyle = {
  height: '30%',
  borderBottom: '4px solid #ca8a04',
  position: 'relative',
};

const boxTapeStyle = {
  width: '24%',
  height: 12,
  backgroundColor: '#ca8a04',
  position: 'absolute',
  top: 0,
  borderRadius: 2,
  left: '10%',
  transform: 'skew(-20deg)',
  boxShadow: '0 0 3px rgba(255,255,255,0.5)',
};

const boxBottomStyle = {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  height: '70%',
  borderRadius: '0 0 10px 10px',
  backgroundColor: '#fcd34d',
};

/* Add keyframes pulseGlow in global CSS */
const styleSheet = document.styleSheets[0];
const pulseKeyframes = `
@keyframes pulseGlow {
  0%,100% { box-shadow: 0 0 8px 1px #fbbe2486; }
  50% { box-shadow: 0 0 20px 5px #fbbe246a; }
}
`;
if (![...styleSheet.cssRules].some(rule => rule.name === 'pulseGlow')) {
  styleSheet.insertRule(pulseKeyframes, styleSheet.cssRules.length);
}
