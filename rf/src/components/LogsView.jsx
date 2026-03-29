import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

export default function LogsView() {
  const [docId, setDocId] = useState('');
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`/files/logs/${docId}`);
      setLogs(res.data.logs);
      if (!res.data.logs.length) setMessage('No logs found');
      else setMessage('');
    } catch {
      setLogs([]);
      setMessage('Error fetching logs');
    }
  };

  return (
    <div>
      <input placeholder="Enter Document ID for Logs" value={docId} onChange={e => setDocId(e.target.value)} />
      <button onClick={fetchLogs}>Get Logs</button>
      {message && <p>{message}</p>}
      <ul>
        {logs.map((log, idx) => <li key={idx}>{log}</li>)}
      </ul>
    </div>
  );
}
