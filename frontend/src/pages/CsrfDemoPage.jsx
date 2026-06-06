import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import useSecurityMode from '../hooks/useSecurityMode';
import { getCsrfToken } from '../utils/csrfHelper';

export default function CsrfDemoPage() {
  const { mode, isVulnerable } = useSecurityMode();
  const [results, setResults]  = useState([]);
  const [loading, setLoading]  = useState(false);

  const addResult = (label, data, type = 'info', headers = null, tokenStr = null) =>
    setResults(prev => [{ id: Date.now(), label, data, type, headers, tokenStr, time: new Date().toLocaleTimeString() }, ...prev]);

  const forgedTransfer = async () => {
    setLoading(true);
    try {
      // Simulate an attacker site by using raw fetch (bypassing the axios interceptor)
      const res = await fetch('http://localhost:5000/api/user/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Intentionally omitting Authorization and X-CSRF-Token
        body: JSON.stringify({ amount: 9999, toAccount: 'ATTACKER_BANK' })
      });
      
      const data = await res.json();
      const headersSent = {
        'Content-Type': 'application/json',
        'Authorization': '(absent)',
        'X-CSRF-Token': '(absent)'
      };

      if (!res.ok) throw { response: { data }, headersSent };
      addResult('Forged Transfer', data, 'attack', headersSent);
    } catch (err) {
      addResult('Forged Transfer', err.response?.data || err.message, 'blocked', err.headersSent || {
        'Content-Type': 'application/json',
        'Authorization': '(absent)',
        'X-CSRF-Token': '(absent)'
      });
    } finally { setLoading(false); }
  };

  const legitTransfer = async () => {
    setLoading(true);
    try {
      // Explicitly get token just for the UI display (interceptor will still attach it automatically)
      const token = await getCsrfToken();
      const tokenStr = token ? `Fetched CSRF token: ${token.substring(0, 15)}...` : 'No token available';

      const res = await API.post('/user/transfer', { amount: 10, toAccount: 'FRIEND' });
      
      const headersSent = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')?.substring(0, 10)}...`,
        'X-CSRF-Token': res.config.headers['X-CSRF-Token'] || '(absent)'
      };

      addResult('Legitimate Transfer (with CSRF token)', res.data, 'safe', headersSent, tokenStr);
    } catch (err) {
      const headersSent = err.config ? {
        'Content-Type': 'application/json',
        'Authorization': err.config.headers?.['Authorization'] || '(absent)',
        'X-CSRF-Token': err.config.headers?.['X-CSRF-Token'] || '(absent)'
      } : {};
      addResult('Legitimate Transfer', err.response?.data || err.message, 'blocked', headersSent);
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🎭 CSRF Attack Demo</h1>
        <div style={isVulnerable ? styles.vulnBanner : styles.secureBanner}>
          {isVulnerable ? '⚠️ VULNERABLE — no CSRF token required, any origin accepted' : '🔒 SECURE — CSRF token + origin validation active'}
        </div>
        <div style={styles.btnRow}>
          <button onClick={forgedTransfer} disabled={loading} style={styles.attackBtn}>
            💀 Launch Forged Transfer (no CSRF token)
          </button>
          <button onClick={legitTransfer} disabled={loading} style={styles.safeBtn}>
            ✅ Legitimate Transfer (with token)
          </button>
        </div>
        {results.map(r => (
          <div key={r.id} style={r.type === 'attack' ? styles.attackResult : r.type === 'blocked' ? styles.blockedResult : styles.safeResult}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ color: '#e0e0e0' }}>{r.type === 'attack' ? '💀' : r.type === 'blocked' ? '🔒' : '✅'} {r.label}</strong>
              <span style={{ color: '#888', fontSize: '12px' }}>{r.time}</span>
            </div>
            
            {r.tokenStr && (
              <div style={{ color: '#f39c12', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
                {r.tokenStr}
              </div>
            )}
            
            {r.headers && (
              <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                <strong style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Request Headers Sent:</strong>
                {Object.entries(r.headers).map(([k, v]) => (
                  <div key={k} style={{ color: v === '(absent)' ? '#e74c3c' : '#2ecc71', fontSize: '12px', fontFamily: 'monospace' }}>
                    {k}: {v}
                  </div>
                ))}
              </div>
            )}

            <pre style={{ color: '#aaa', fontSize: '12px', margin: 0, overflow: 'auto' }}>
              {JSON.stringify(r.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page:          { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:     { maxWidth: '800px', margin: '0 auto' },
  title:         { color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' },
  vulnBanner:    { background: '#c0392b', color: 'white', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  secureBanner:  { background: '#27ae60', color: 'white', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  btnRow:        { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  attackBtn:     { padding: '12px 20px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  safeBtn:       { padding: '12px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  attackResult:  { background: '#2a0a0a', border: '1px solid #c0392b', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  blockedResult: { background: '#0a2a0a', border: '1px solid #27ae60', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  safeResult:    { background: '#0a1a2a', border: '1px solid #2980b9', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
};