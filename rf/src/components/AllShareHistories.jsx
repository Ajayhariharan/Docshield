import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

export default function AllShareHistories() {
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFileId, setExpandedFileId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // Fetch files periodically (10s)
  useEffect(() => {
    fetchFiles();
    const intervalId = setInterval(fetchFiles, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/files/share-history');
      setAllFiles(res.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch share histories');
      setLoading(false);
    }
  };

  // === Determine link status ===
  const getLinkStatus = (expiresAt) => {
    if (!expiresAt || expiresAt === null) return 'Permanent';
    return new Date() > new Date(expiresAt) ? 'Expired' : 'Active';
  };

  // === Revoke confirm dialog ===
  const requestRevokeShare = (fileId, token) => {
    setPendingRevoke({ fileId, token });
    setShowConfirm(true);
  };

  const confirmRevokeShare = async () => {
    try {
      await axios.delete(`/files/share/${pendingRevoke.fileId}/${pendingRevoke.token}`);
      setMessageType('success');
      setMessage('Share link revoked.');
      fetchFiles();
    } catch (err) {
      setMessageType('error');
      setMessage('Failed to revoke share link.');
    } finally {
      setShowConfirm(false);
      setPendingRevoke(null);
    }
  };

  const cancelRevokeShare = () => {
    setShowConfirm(false);
    setPendingRevoke(null);
  };

  if (loading) return <p style={{ color: '#fff' }}>Loading share histories...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (allFiles.length === 0) return <p style={{ color: '#ccc' }}>No files available.</p>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Inline success/error alert */}
      {message && (
        <div
          style={{
            padding: '12px 20px',
            marginBottom: '20px',
            borderRadius: '8px',
            color: messageType === 'success' ? '#065f46' : '#991b1b',
            backgroundColor: messageType === 'success' ? '#d1fae5' : '#fecaca',
            position: 'relative',
          }}
        >
          {message}
          <button
            onClick={() => setMessage(null)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              border: 'none',
              background: 'transparent',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              color: messageType === 'success' ? '#065f46' : '#991b1b',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* === Files List === */}
      {allFiles.map((file) => (
        <div
          key={file.fileId}
          style={{
            marginBottom: 25,
            backgroundColor: 'rgba(30,30,30,0.75)',
            borderRadius: 12,
            padding: 15,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() =>
              setExpandedFileId(expandedFileId === file.fileId ? null : file.fileId)
            }
          >
            <h4 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{file.originalname}</h4>
            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
              {expandedFileId === file.fileId ? 'Hide Histories ▲' : 'Show Histories ▼'}
            </span>
          </div>

          {expandedFileId === file.fileId && (
            <div style={{ marginTop: 15 }}>
              {file.shareHistory.length === 0 ? (
                <p style={{ color: '#aaa' }}>No shares for this document.</p>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Shared At</th>
                      <th style={thStyle}>Access Type</th>
                      <th style={thStyle}>Allowed Users</th>
                      <th style={thStyle}>Expires At</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {file.shareHistory.map((link, idx) => {
                      const status = getLinkStatus(link.expiresAt);
                      const statusColor =
                        status === 'Expired'
                          ? '#dc2626'
                          : status === 'Active'
                          ? '#22c55e'
                          : '#facc15'; // gold for permanent
                      return (
                        <tr
                          key={idx}
                          style={{
                            ...(idx % 2 === 0 ? rowEvenStyle : rowOddStyle),
                            transition: 'background 0.2s ease',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.15)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              idx % 2 === 0
                                ? rowEvenStyle.backgroundColor
                                : rowOddStyle.backgroundColor)
                          }
                        >
                          <td style={tdStyle}>
                            {new Date(link.sharedAt).toLocaleString()}
                          </td>
                          <td style={tdStyle}>{link.accessType}</td>
                          <td style={tdStyle}>
                            {link.allowedUsers.length > 0
                              ? link.allowedUsers.join(', ')
                              : 'Public'}
                          </td>
                          <td style={tdStyle}>
                            {link.expiresAt
                              ? new Date(link.expiresAt).toLocaleString()
                              : 'Permanent ♾️'}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              color: statusColor,
                              fontWeight: 'bold',
                            }}
                          >
                            {status}
                          </td>
                          <td style={tdStyle}>
                            <button
                              style={revokeBtnStyle}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.transform = 'scale(1.08)')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = 'scale(1)')
                              }
                              onClick={() => requestRevokeShare(file.fileId, link.token)}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}

      {/* === Confirm Modal === */}
      {showConfirm && (
        <div style={modalOverlayStyle}>
          <div style={confirmDialogStyle}>
            <h3>Confirm Revoke</h3>
            <p>Are you sure you want to revoke this share link?</p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={cancelRevokeShare}
                style={{ ...btnBase, backgroundColor: '#6b7280' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRevokeShare}
                style={{ ...btnBase, backgroundColor: '#dc2626' }}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* === Styles === */
const tableStyle = {
  width: '100%',
  minWidth: '1000px',
  borderCollapse: 'collapse',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
  marginTop: 10,
};
const thStyle = {
  padding: '12px',
  textAlign: 'left',
  backgroundColor: 'rgba(30,30,30,0.95)',
  color: '#fff',
  fontWeight: '600',
};
const tdStyle = {
  padding: '12px',
  color: '#ddd',
  verticalAlign: 'top',
};
const rowEvenStyle = {
  backgroundColor: 'rgba(255,255,255,0.05)',
};
const rowOddStyle = {
  backgroundColor: 'rgba(255,255,255,0.02)',
};
const revokeBtnStyle = {
  padding: '6px 16px',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  backgroundColor: '#ef4444',
  color: '#fff',
  fontWeight: '600',
  transition: 'all 0.2s ease',
};
const btnBase = {
  padding: '6px 16px',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  color: '#fff',
  transition: 'all 0.3s ease',
};
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,
};
const confirmDialogStyle = {
  backgroundColor: '#222',
  padding: '30px 20px',
  width: '320px',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
};
