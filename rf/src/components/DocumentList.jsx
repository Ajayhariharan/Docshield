import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import ShareModal from './ShareModal';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

// === PDF Viewer Component ===
function PDFViewer({ pdfData, watermark }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (!pdfData) return;
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const pageCanvases = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        // Fill white background
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        await page.render({ canvasContext: ctx, viewport }).promise;
        pageCanvases.push(canvas.toDataURL());
      }
      setPages(pageCanvases);
    };
    loadPdf();
  }, [pdfData]);

  return (
    <div style={{ height: '80vh', overflowY: 'auto', position: 'relative' }}>
      <div style={watermarkOverlayStyleBlack}>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} style={watermarkTextStyleBlack}>
            {watermark}
          </span>
        ))}
      </div>
      {pages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`page-${i}`}
          style={{ width: '100%', marginBottom: '10px', pointerEvents: 'none' }}
        />
      ))}
    </div>
  );
}

// === Image Viewer Component ===
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
      <img
        src={imageData}
        alt="shared-img"
        style={{ maxWidth: "100%", maxHeight: "80vh", pointerEvents: "none" }}
      />
    </div>
  );
}

export default function DocumentList({ refreshTrigger }) {
  const [docs, setDocs] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // Viewer modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const fetchDocuments = () => {
    axios.get('/files/mydocs')
      .then(res => setDocs(res.data))
      .catch(() => setDocs([]));
  };

  const downloadMyDocument = async (fileId, originalName) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/files/mydocs/download/${fileId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setMessageType('error');
      setMessage('Failed to download document');
    }
  };

  const requestDeleteDocument = (doc) => {
    setDocToDelete(doc);
    setShowConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    try {
      await axios.delete(`/files/mydocs/${docToDelete._id}`);
      setMessageType('success');
      setMessage(`Document "${docToDelete.originalname}" deleted successfully!`);
      fetchDocuments();
    } catch {
      setMessageType('error');
      setMessage('Failed to delete document');
    } finally {
      setShowConfirm(false);
      setDocToDelete(null);
    }
  };

  const cancelDeleteDocument = () => {
    setShowConfirm(false);
    setDocToDelete(null);
  };

  // Format filesize helper
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // === View document handler, same as sharedWithMe, fetches raw file and displays in modal ===
  const viewDocument = async (doc) => {
    try {
      let url = `http://localhost:5000/api/files/mydocs/download/${doc._id}`;
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const fileExt = doc.originalname.split('.').pop().toLowerCase();
      if (fileExt === 'pdf') {
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
      setModalName(doc.originalname);
      setViewModalOpen(true);
    } catch (error) {
      alert('Error opening document');
      console.error(error);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setPdfData(null);
    setImageData(null);
    setModalName('');
  };

  return (
    <div>
      {message && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          color: messageType === 'success' ? '#065f46' : '#991b1b',
          backgroundColor: messageType === 'success' ? '#d1fae5' : '#fecaca',
          position: 'relative'
        }}>
          {message}
          <button onClick={() => setMessage(null)} style={{
            position: 'absolute',
            right: '10px',
            top: '10px',
            border: 'none',
            background: 'transparent',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            color: messageType === 'success' ? '#065f46' : '#991b1b',
          }} aria-label="Dismiss message">&times;</button>
        </div>
      )}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Filename</th>
            <th style={thStyle}>File Type</th>
            <th style={thStyle}>File Size</th>
            <th style={thStyle}>Uploaded On</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc, idx) => (
            <tr
              key={doc._id}
              style={idx % 2 === 0 ? rowEvenStyle : rowOddStyle}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseOut={e => (e.currentTarget.style.backgroundColor =
                idx % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)")}
            >
              <td style={tdStyle}>{doc.originalname}</td>
              <td style={tdStyle}>{doc.fileType || 'N/A'}</td>
              <td style={tdStyle}>{formatFileSize(doc.fileSize)}</td>
              <td style={tdStyle}>{new Date(doc.createdAt).toLocaleString()}</td>
              <td style={tdStyle}>
                <div style={btnGroup}>
                  <button onClick={() => { setSelectedDoc(doc); setShowShareModal(true); }} style={{ ...btnBase, ...btnShare }}>Share</button>
                  <button onClick={() => viewDocument(doc)} style={{ ...btnBase, ...btnView }}>View</button>
                  <button onClick={() => downloadMyDocument(doc._id, doc.originalname)} style={{ ...btnBase, ...btnDownload }}>Download</button>
                  <button onClick={() => requestDeleteDocument(doc)} style={{ ...btnBase, ...btnDelete }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showShareModal && <ShareModal file={selectedDoc} onClose={() => setShowShareModal(false)} />}

      {showConfirm && (
        <div style={modalOverlayStyle}>
          <div style={confirmDialogStyle}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete "{docToDelete.originalname}"?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={cancelDeleteDocument} style={{ ...btnBase, backgroundColor: '#6b7280' }}>Cancel</button>
              <button onClick={confirmDeleteDocument} style={{ ...btnBase, backgroundColor: '#dc2626' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* === File View Modal === */}
      {viewModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3>{modalName}</h3>
              <button onClick={closeViewModal} style={closeBtnStyle}>X</button>
            </div>
            <>
              {pdfData && <PDFViewer pdfData={pdfData} watermark={'Confidential'} />}
              {imageData && <ImageViewer imageData={imageData} watermark={'Confidential'} />}
              {!pdfData && !imageData && <div style={{ color: '#f87171', padding: '40px', textAlign: 'center' }}>Unsupported file type or error opening file.</div>}
            </>
          </div>
        </div>
      )}
    </div>
  );
}

/* === Styles: identical to sharedwithme page === */
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
const thStyle = {
  padding: "12px",
  textAlign: "left",
  backgroundColor: "rgba(30,30,30,0.8)",
  color: "#fff",
  fontWeight: "600",
};
const tdStyle = {
  padding: "12px",
  color: "#ddd",
  verticalAlign: "middle",
};
const rowEvenStyle = {
  backgroundColor: "rgba(255,255,255,0.05)",
};
const rowOddStyle = {
  backgroundColor: "rgba(255,255,255,0.02)",
};
const btnGroup = {
  display: "flex",
  alignItems: "center",
  gap: '8px',
};
const btnBase = {
  padding: "6px 12px",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  color: "#fff",
  transition: "background-color 0.3s",
};
const btnDelete = {
  backgroundColor: '#e74c3c',
};
const btnDownload = {
  backgroundColor: '#3498db',
};
const btnShare = {
  backgroundColor: '#2ecc71',
};
const btnView = {
  backgroundColor: '#3b82f6',
};
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};
const modalContentStyle = {
  width: "80%",
  maxWidth: "900px",
  backgroundColor: "#1e1e1e",
  borderRadius: "12px",
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  userSelect: "none",
};
const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  color: "#fff",
};
const closeBtnStyle = {
  background: "red",
  border: "none",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "600",
};
const confirmDialogStyle = {
  backgroundColor: "#222",
  padding: "30px 20px",
  width: "320px",
  borderRadius: "12px",
  color: "#fff",
  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
};
const watermarkOverlayStyleBlack = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexWrap: "wrap",
  pointerEvents: "none",
  opacity: 0.15,
};
const watermarkTextStyleBlack = {
  flex: "1 0 20%",
  textAlign: "center",
  fontSize: "14px",
  color: "#000",
  transform: "rotate(-30deg)",
  userSelect: "none",
};
