import { useEffect, useState, useContext } from 'react';
import axios from '../api/axiosConfig';
import { AuthContext } from '../auth/AuthContext';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

export default function SharedWithMeTable() {
  const [docs, setDocs] = useState([]);
  const { user } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [hiddenByBlur, setHiddenByBlur] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [blackout, setBlackout] = useState(false); // overlay for printscreen

  // === Fetch files ===
  const fetchSharedDocs = () => {
    axios.get('/files/sharedwithme')
      .then(res => setDocs(res.data))
      .catch(() => setDocs([]));
  };

  useEffect(() => {
    fetchSharedDocs();
    const intervalId = setInterval(fetchSharedDocs, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // === Key / context restrictions ===
  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();
    const disableCopy = (e) => e.preventDefault();

    const disableKeys = async (e) => {
      const key = e.key.toLowerCase();
      const allowedKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

      // ✅ PrintScreen key protection
      if (key === 'printscreen') {
        e.preventDefault();
        setBlackout(true);
        try {
          await navigator.clipboard.writeText(''); // clears clipboard
          console.log('Clipboard cleared after PrintScreen');
        } catch (err) {
          console.warn('Clipboard clear failed:', err);
        }
        setTimeout(() => setBlackout(false), 2500);
        return;
      }

      // Block other disallowed keys
      if (!allowedKeys.includes(key)) {
        e.preventDefault();
        setErrorVisible(true);
        document.body.style.overflow = 'hidden';
      }
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('copy', disableCopy);
    document.addEventListener('keydown', disableKeys);

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('copy', disableCopy);
      document.removeEventListener('keydown', disableKeys);
    };
  }, []);

  // === Window blur protection ===
  useEffect(() => {
    const handleBlur = () => {
      setHiddenByBlur(true);
      document.body.style.overflow = 'hidden';
    };
    const handleFocus = () => {
      setHiddenByBlur(false);
      document.body.style.overflow = 'auto';
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // === Expiry formatting and status ===
  const formatExpiry = (expiresAt) =>
    expiresAt ? new Date(expiresAt).toLocaleString() : 'Permanent ♾️';

  const getLinkStatus = (expiresAt) => {
    if (!expiresAt || expiresAt === null) return 'Permanent';
    return new Date() > new Date(expiresAt) ? 'Expired' : 'Active';
  };

  // === Handle view file ===
  const handleViewFile = async (file, token) => {
    if (!token) {
      alert('No share link available');
      return;
    }

    const accessType = file.sharedLinks[0]?.type;

    try {
      await axios.get(`/files/access/${token}`, {
        params: accessType === 'restricted' ? { email: user.email } : {},
      });

      let url = `http://localhost:5000/api/files/download-decrypted/${token}`;
      if (accessType === 'restricted') {
        url += `?email=${encodeURIComponent(user.email)}`;
      }

      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const fileExt = file.originalname.split('.').pop().toLowerCase();

      // Watermark: sender → receiver
      const senderEmail = file.sharedBy || 'Unknown';
      const receiverEmail = user.email;
      setWatermarkText(`${senderEmail} → ${receiverEmail}`);

      if (['pdf'].includes(fileExt)) {
        setPdfData(res.data);
        setImageData(null);
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt)) {
        const blob = new Blob([res.data], { type: `image/${fileExt}` });
        const imageUrl = URL.createObjectURL(blob);
        setImageData(imageUrl);
        setPdfData(null);
      } else {
        alert('Unsupported file type.');
        return;
      }

      setIsExpired(false);
      setModalName(file.originalname);
      setModalOpen(true);
    } catch (error) {
      if (error.response && error.response.status === 410) {
        if (file.sharedLinks[0]?.expiresAt === null) {
          setIsExpired(false);
          setModalName(file.originalname);
          setModalOpen(true);
        } else {
          setIsExpired(true);
          setModalName('Expired');
          setModalOpen(true);
        }
      } else if (error.response && error.response.status === 403) {
        alert('You are not authorized to access this restricted file.');
      } else {
        alert('Error accessing file');
        console.error(error);
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalName('');
    setIsExpired(false);
    setPdfData(null);
    setImageData(null);
  };

  const closeError = () => {
    setErrorVisible(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <div style={{ marginTop: "20px", userSelect: "none" }}>
      {/* ⚡ Blackout overlay when PrintScreen pressed */}
      {blackout && (
        <div style={blackOverlayStyle}>
          <h2 style={{ color: "#fff" }}>⚠️ Screenshot Attempt Blocked</h2>
          <p style={{ color: "#ccc" }}>Clipboard Cleared for Security 🔒</p>
        </div>
      )}

      {/* Unauthorized key alert */}
      {errorVisible && (
        <div style={errorOverlayStyle} onClick={closeError}>
          <h1 style={{ fontSize: "2rem", color: "#fff" }}>⚠️ Unauthorized Key Press!</h1>
          <p style={{ color: "#ccc", marginTop: "10px" }}>Only Arrow Keys are allowed.</p>
          <button onClick={closeError} style={errorCloseBtnStyle}>Return</button>
        </div>
      )}

      {/* Tab inactive lock */}
      {hiddenByBlur && (
        <div style={blurOverlayStyle}>
          <h2>🔒 Secure Mode Active</h2>
          <p>Content hidden while tab is inactive.</p>
        </div>
      )}

      {!hiddenByBlur && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>File Name</th>
                <th style={thStyle}>Shared By</th>
                <th style={thStyle}>Expiry Time</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const userSharedLinks = doc.sharedLinks.filter(link =>
                  (link.allowedUsers || []).includes(user.email)
                );
                if (userSharedLinks.length === 0) return null;

                return userSharedLinks.map((sharedLink, index) => {
                  const linkStatus = getLinkStatus(sharedLink.expiresAt);
                  const statusColor =
                    linkStatus === 'Expired' ? '#dc2626' :
                      linkStatus === 'Active' ? '#22c55e' : '#facc15';

                  return (
                    <tr
                      key={`${doc._id}-${index}`}
                      style={{
                        ...(index % 2 === 0 ? rowEvenStyle : rowOddStyle),
                        cursor: "pointer",
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                      onMouseOut={e => e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? rowEvenStyle.backgroundColor : rowOddStyle.backgroundColor}
                    >
                      <td style={tdStyle}>{doc.originalname}</td>
                      <td style={tdStyle}>{doc.sharedBy || 'Unknown'}</td>
                      <td style={tdStyle}>{formatExpiry(sharedLink.expiresAt)}</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: statusColor }}>
                        {linkStatus}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleViewFile(doc, sharedLink.token)}
                          style={viewBtnStyle}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          {/* File view modal */}
          {modalOpen && (
            <div style={modalOverlayStyle}>
              <div style={modalContentStyle}>
                <div style={modalHeaderStyle}>
                  <h3>{modalName}</h3>
                  <button onClick={closeModal} style={closeBtnStyle}>X</button>
                </div>
                {isExpired ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#f87171' }}>
                    <h2>Link Expired</h2>
                    <p>This shared file link has expired and cannot be viewed.</p>
                  </div>
                ) : (
                  <>
                    {pdfData && <PDFViewer pdfData={pdfData} watermark={watermarkText} />}
                    {imageData && <ImageViewer imageData={imageData} watermark={watermarkText} />}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// === PDF Viewer ===
function PDFViewer({ pdfData, watermark }) {
  const [pages, setPages] = useState([]);
  useEffect(() => {
    if (!pdfData) return;
    (async () => {
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const canvases = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvases.push(canvas.toDataURL());
      }
      setPages(canvases);
    })();
  }, [pdfData]);

  return (
    <div style={{ height: '80vh', overflowY: 'auto', position: 'relative' }}>
      {pages.map((src, i) => (
        <div key={i} style={{ position: "relative" }}>
          <div style={watermarkOverlayStyleBlack}>
            {Array.from({ length: 40 }).map((_, j) => (
              <span key={j} style={watermarkTextStyleBlack}>
                {watermark}
              </span>
            ))}
          </div>
          <img src={src} alt={`page-${i}`} style={{ width: '100%', marginBottom: '10px', pointerEvents: 'none' }} />
        </div>
      ))}
    </div>
  );
}

// === Image Viewer ===
function ImageViewer({ imageData, watermark }) {
  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <div style={watermarkOverlayStyleBlack}>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} style={watermarkTextStyleBlack}>
            {watermark}
          </span>
        ))}
      </div>
      <img src={imageData} alt="shared-img" style={{ maxWidth: "100%", maxHeight: "80vh", pointerEvents: "none" }} />
    </div>
  );
}

/* === Styles === */
const tableStyle = { width: "100%", borderCollapse: "collapse", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" };
const thStyle = { padding: "12px", textAlign: "left", backgroundColor: "rgba(30,30,30,0.9)", color: "#fff", fontWeight: "600" };
const tdStyle = { padding: "12px", color: "#ddd", userSelect: "none" };
const rowEvenStyle = { backgroundColor: "rgba(255,255,255,0.05)" };
const rowOddStyle = { backgroundColor: "rgba(255,255,255,0.02)" };
const viewBtnStyle = { padding: "6px 14px", border: "none", borderRadius: "20px", cursor: "pointer", backgroundColor: "#3b82f6", color: "#fff", fontWeight: "600", transition: "all 0.3s ease" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 };
const modalContentStyle = { width: "80%", maxWidth: "900px", backgroundColor: "#1e1e1e", borderRadius: "12px", padding: "10px", display: "flex", flexDirection: "column", userSelect: "none" };
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", color: "#fff" };
const closeBtnStyle = { background: "red", border: "none", borderRadius: "50%", width: "30px", height: "30px", color: "#fff", cursor: "pointer", fontWeight: "600" };
const watermarkOverlayStyleBlack = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexWrap: "wrap", pointerEvents: "none", opacity: 0.15 };
const watermarkTextStyleBlack = { flex: "1 0 20%", textAlign: "center", fontSize: "14px", color: "#000", transform: "rotate(-30deg)", userSelect: "none" };
const errorOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.95)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10000, textAlign: "center" };
const blurOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.9)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 9999 };
const errorCloseBtnStyle = { marginTop: "20px", padding: "10px 20px", backgroundColor: "#f87171", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const blackOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10001, textAlign: "center", transition: "opacity 0.3s ease" };
