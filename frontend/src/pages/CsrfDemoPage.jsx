import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import useSecurityMode from '../hooks/useSecurityMode';

export default function CsrfDemoPage() {
  const { mode, isVulnerable } = useSecurityMode();
  const [results, setResults]  = useState([]);
  const [loading, setLoading]  = useState(false);

  const addResult = (label, data, type = 'info') =>
    setResults(prev => [{ id: Date.now(), label, data, type, time: new Date().toLocaleTimeString() }, ...prev]);

  const forgedTransfer = async () => {
    setLoading(true);
    try {
      const res = await API.post('/user/transfer', { amount: 9999, toAccount: 'ATTACKER_BANK' });
      addResult('Forged Transfer', res.data, 'attack');
    } catch (err) {
      addResult('Forged Transfer', err.response?.data, 'blocked');
    } finally { setLoading(false); }
  };

  const legitTransfer = async () => {
    setLoading(true);
    try {
      const res = await API.post('/user/transfer', { amount: 10, toAccount: 'FRIEND' });
      addResult('Legitimate Transfer (with CSRF token)', res.data, 'safe');
    } catch (err) {
      addResult('Legitimate Transfer', err.response?.data, 'blocked');
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