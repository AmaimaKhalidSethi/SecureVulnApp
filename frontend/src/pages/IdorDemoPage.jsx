// pages/IdorDemoPage.jsx
// ============================================================
// IDOR ATTACK & DEFENSE DEMO
// Shows how changing a user ID in the request gives
// access to other users' data in vulnerable mode
// ============================================================

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

export default function IdorDemoPage() {
  const { token: myToken, isAuthenticated } = useAuth();
  const [mode,       setMode]       = useState('unknown');
  const [users,      setUsers]      = useState([]);
  const [targetId,   setTargetId]   = useState('');
  const [results,    setResults]    = useState([]);
  const [updateData, setUpdateData] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [updateError, setUpdateError] = useState('');



  useEffect(() => {
    API.get('/mode').then(r => setMode(r.data.currentMode)).catch(() => {});
    // Fetch user list to get IDs to attack
    API.get('/users')
      .then(r => setUsers(r.data.users || []))
      .catch(() => {});
  }, []);

  const addResult = (label, data, type = 'info') => {
    setResults(prev => [{
      id:        Date.now(),
      label,
      data,
      type,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev]);
  };

  // ── Attack: read another user's profile ───────────────────
  const attackRead = async () => {
    if (!targetId) return alert('Enter a target user ID first');
    setLoading(true);
    try {
      const res = await API.get(`/users/${targetId}`);
      addResult(
        `GET /api/users/${targetId.slice(0,8)}... (IDOR read)`,
        res.data,
        res.data.warning ? 'attack' : 'safe'
      );
    } catch (err) {
      addResult(`GET /api/users/${targetId.slice(0,8)}...`, err.response?.data, 'blocked');
    } finally {
      setLoading(false);
    }
  };

  // ── Attack: update another user's profile ─────────────────
  const attackUpdate = async () => {
    if (!targetId) return alert('Enter a target user ID first');
    setLoading(true);
    try {
      const body = updateData
        ? JSON.parse(updateData)
        : { username: 'HACKED_BY_IDOR', role: 'admin' };

      const res = await API.put(`/users/${targetId}`, body);
      addResult(
        `PUT /api/users/${targetId.slice(0,8)}... (IDOR update)`,
        res.data,
        res.data.warning ? 'attack' : 'safe'
      );
    } catch (err) {
      addResult(`PUT /api/users/${targetId.slice(0,8)}...`, err.response?.data, 'blocked');
    } finally {
      setLoading(false);
    }
  };

  // ── List all users (enumerate targets) ────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      setUsers(res.data.users || []);
      addResult('GET /api/users (enumeration)', res.data, res.data.warning ? 'attack' : 'safe');
    } catch (err) {
      addResult('GET /api/users', err.response?.data, 'blocked');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🔓 IDOR — Insecure Direct Object Reference</h1>

        <div style={mode === 'vulnerable' ? styles.vulnBanner : styles.secureBanner}>
          {mode === 'vulnerable'
            ? '⚠️ VULNERABLE MODE — any user can read/edit/delete any other user'
            : '🔒 SECURE MODE — ownership enforced, cross-user access blocked'}
        </div>

        {/* Concept explainer */}
        <div style={styles.explainer}>
          <h3 style={{ color: '#f39c12', marginTop: 0 }}>The Attack</h3>
          <p style={{ color: '#ccc', lineHeight: 1.7 }}>
            In vulnerable mode, <code>GET /api/users/ANY_ID</code> returns that user's
            data to anyone with a valid JWT — regardless of whose JWT it is.
            The server authenticates you but never checks if you're
            <em> authorized</em> to access that specific resource.
          </p>
          <p style={{ color: '#ccc', lineHeight: 1.7 }}>
            Step 1: Enumerate users via <code>GET /api/users</code> to collect IDs.
            Step 2: Request any ID directly. Step 3: Update or delete at will.
          </p>
        </div>

        {/* Token status */}
        <div style={styles.tokenBox}>
          <span style={{ color: '#888' }}>Your JWT: </span>
          {isAuthenticated
            ? <span style={{ color: '#2ecc71', fontFamily: 'monospace', fontSize: '12px' }}>
                {myToken?.slice(0, 40)}...
              </span>
            : <span style={{ color: '#e74c3c' }}>
                Not logged in — use the register/login flow first
              </span>
          }
        </div>

        {/* Step 1: Enumerate */}
        <div style={styles.section}>
          <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>
            Step 1 — Enumerate All Users
          </h3>
          <button onClick={fetchUsers} disabled={loading} style={styles.attackBtn}>
            GET /api/users — List All Users
          </button>

          {users.length > 0 && (
            <div style={styles.userList}>
              <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>
                Click any user to set as attack target:
              </p>
              {users.map(u => (
                <div
                  key={u._id}
                  onClick={() => setTargetId(u._id)}
                  style={{
                    ...styles.userCard,
                    border: targetId === u._id
                      ? '2px solid #e74c3c'
                      : '1px solid #0f3460',
                  }}
                >
                  <span style={{ color: '#3498db', fontWeight: 'bold' }}>{u.username}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}> — {u.email}</span>
                  <span style={{ color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
                    {' '}({u._id})
                  </span>
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    color: u.role === 'admin' ? '#f39c12' : '#888'
                  }}>
                    [{u.role}]
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Attack */}
        <div style={styles.section}>
          <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>
            Step 2 — Attack Target ID
          </h3>
          <input
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            placeholder="Paste or click a target user ID above"
            style={styles.input}
          />
          <div style={styles.btnRow}>
            <button
              onClick={attackRead}
              disabled={loading}  // ← already there, confirm it's on BOTH buttons
              style={{ ...styles.attackBtn, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '⏳ Loading...' : 'Read Target Profile'}
            </button>
            <button
              onClick={attackUpdate}
              disabled={loading}
              style={{ ...styles.warnBtn, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '⏳ Loading...' : 'Update Target Profile'}
            </button>
          </div>
          <textarea
            value={updateData}
            onChange={e => setUpdateData(e.target.value)}
            placeholder={'Optional update payload (JSON):\n{"username":"HACKED","role":"admin"}'}
            rows={3}
            style={styles.textarea}
          />
          <p style={{ color: '#888', fontSize: '12px' }}>
            In vulnerable mode, the role field change also works — mass assignment vulnerability.
            In secure mode, role is whitelisted out.
          </p>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={styles.section}>
            <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>Results</h3>
            {results.map(r => (
              <div key={r.id} style={
                r.type === 'attack'  ? styles.attackResult  :
                r.type === 'blocked' ? styles.blockedResult :
                styles.safeResult
              }>
                <div style={styles.resultHeader}>
                  <span style={{ fontWeight: 'bold' }}>
                    {r.type === 'attack'  ? '💀' :
                     r.type === 'blocked' ? '🔒' : '✅'} {r.label}
                  </span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{r.timestamp}</span>
                </div>
                <pre style={styles.resultBody}>
                  {JSON.stringify(r.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:          { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:     { maxWidth: '900px', margin: '0 auto' },
  title:         { color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' },
  vulnBanner:    { background: '#c0392b', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  secureBanner:  { background: '#27ae60', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  explainer:     { background: '#1a1a2e', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  tokenBox:      { background: '#16213e', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' },
  section:       { background: '#16213e', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #0f3460' },
  userList:      { marginTop: '12px' },
  userCard:      { padding: '8px 12px', borderRadius: '4px', marginBottom: '6px', cursor: 'pointer', background: '#0a0a1a' },
  input:         { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#0a0a1a', color: '#e0e0e0', marginBottom: '10px', boxSizing: 'border-box' },
  textarea:      { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#0a0a1a', color: '#e0e0e0', marginTop: '8px', boxSizing: 'border-box', fontFamily: 'monospace' },
  btnRow:        { display: 'flex', gap: '10px', marginBottom: '8px' },
  attackBtn:     { padding: '10px 20px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  warnBtn:       { padding: '10px 20px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  attackResult:  { background: '#2a0a0a', border: '1px solid #c0392b', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  blockedResult: { background: '#0a2a0a', border: '1px solid #27ae60', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  safeResult:    { background: '#0a1a2a', border: '1px solid #2980b9', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  resultHeader:  { display: 'flex', justifyContent: 'space-between', color: '#e0e0e0', marginBottom: '8px' },
  resultBody:    { color: '#aaa', fontSize: '12px', margin: 0, overflow: 'auto', maxHeight: '200px' },
};