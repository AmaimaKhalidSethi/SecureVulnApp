// pages/BruteForceDemo.jsx
// ============================================================
// BRUTE FORCE ATTACK & RATE LIMIT DEMO
// Simulates automated login attempts and shows rate limiting
// ============================================================

import { useState, useRef } from 'react';
import API from '../api/axiosConfig';
import useSecurityMode from '../hooks/useSecurityMode';

// Common password wordlist for dictionary attack simulation
const WORDLIST = [
  'password', '123456', 'password123', 'admin', 'letmein',
  'qwerty', 'abc123', 'monkey', 'master', 'dragon',
  'pass', '111111', 'baseball', 'iloveyou', 'trustno1',
  'sunshine', 'princess', 'welcome', 'shadow', 'superman',
  'michael', 'football', 'jesus', 'ninja', 'mustang',
  'password1', 'abc', 'test123', 'hello', 'charlie',
];

export default function BruteForceDemo() {
  const { mode, isVulnerable } = useSecurityMode();

  const [targetEmail,  setTargetEmail]  = useState('hacker@test.com');
  const [attempts,     setAttempts]     = useState([]);
  const [running,      setRunning]      = useState(false);
  const [stats,        setStats]        = useState(null);
  const [delay,        setDelay]        = useState(200);
  const stopRef = useRef(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const runBruteForce = async () => {
    setRunning(true);
    setAttempts([]);
    setStats(null);
    stopRef.current = false;

    const startTime  = Date.now();
    let successFound = false;
    let blockedAt    = null;
    let attemptCount = 0;

    for (const password of WORDLIST) {
      if (stopRef.current) break;

      attemptCount++;
      const attemptStart = Date.now();

      try {
        const res = await API.post('/auth/login', {
          email: targetEmail,
          password,
        });

        // Success
        const duration = Date.now() - attemptStart;
        setAttempts(prev => [...prev, {
          attempt:  attemptCount,
          password,
          status:   'SUCCESS',
          code:     200,
          duration,
          message:  '✅ LOGIN SUCCEEDED',
        }]);
        successFound = true;
        break;

      } catch (err) {
        const duration = Date.now() - attemptStart;
        const status   = err.response?.status;
        const message  = err.response?.data?.error || err.message;

        setAttempts(prev => [...prev, {
          attempt:  attemptCount,
          password,
          status:   status === 429 ? 'RATE_LIMITED' :
                    status === 423 ? 'ACCOUNT_LOCKED' : 'FAILED',
          code:     status,
          duration,
          message,
        }]);

        if (status === 429) {
          blockedAt = attemptCount;
          break; // rate limited — stop
        }

        if (status === 423) {
          break; // account locked — stop
        }
      }

      await sleep(delay); // delay between attempts
    }

    const totalTime = Date.now() - startTime;

    setStats({
      totalAttempts: attemptCount,
      totalTime:     `${(totalTime / 1000).toFixed(1)}s`,
      avgPerAttempt: `${Math.round(totalTime / attemptCount)}ms`,
      outcome:       successFound   ? '✅ Password found!'         :
                     blockedAt      ? `🔒 Blocked after ${blockedAt} attempts` :
                                      '❌ Password not in wordlist',
      blockedAt,
      mode,
    });

    setRunning(false);
  };

  const stopAttack = () => {
    stopRef.current = true;
    setRunning(false);
  };

  const clearResults = () => {
    setAttempts([]);
    setStats(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>💀 Brute Force Attack Demo</h1>

        <div style={isVulnerable ? styles.vulnBanner : styles.secureBanner}>
          {isVulnerable
            ? '⚠️ VULNERABLE MODE — no rate limiting, unlimited attempts'
            : '🔒 SECURE MODE — rate limited to 10 attempts per 15 minutes'}
        </div>

        {/* Concept box */}
        <div style={styles.conceptBox}>
          <h3 style={{ color: '#f39c12', marginTop: 0 }}>How This Attack Works</h3>
          <p style={{ color: '#ccc', lineHeight: 1.7 }}>
            This demo fires automated login requests using a dictionary of{' '}
            <strong>{WORDLIST.length} common passwords</strong>. In vulnerable mode,
            the server accepts unlimited attempts — the attacker tries every password
            until one works or the list is exhausted. In secure mode, the server
            blocks the IP after 10 attempts and returns <code>429 Too Many Requests</code>.
          </p>
        </div>

        {/* Config */}
        <div style={styles.configBox}>
          <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>Attack Configuration</h3>
          <div style={styles.configRow}>
            <div style={styles.configItem}>
              <label style={styles.label}>Target Email</label>
              <input
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                style={styles.input}
                placeholder="target@example.com"
              />
              <p style={styles.hint}>
                Must be a registered user. Register one on Day 3 auth routes first.
              </p>
            </div>
            <div style={styles.configItem}>
              <label style={styles.label}>
                Delay Between Attempts: {delay}ms
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={delay}
                onChange={e => setDelay(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <p style={styles.hint}>
                0ms = maximum speed. Increase to see attempts clearly.
              </p>
            </div>
          </div>

          {/* Wordlist preview */}
          <div style={styles.wordlistPreview}>
            <span style={{ color: '#888', fontSize: '13px' }}>
              Wordlist preview ({WORDLIST.length} passwords):{' '}
            </span>
            <span style={{ color: '#f39c12', fontSize: '12px', fontFamily: 'monospace' }}>
              {WORDLIST.slice(0, 8).join(', ')}...
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.btnRow}>
          <button
            onClick={runBruteForce}
            disabled={running}
            style={styles.attackBtn}
          >
            {running ? '⏳ Attacking...' : '🚀 Start Dictionary Attack'}
          </button>
          {running && (
            <button onClick={stopAttack} style={styles.stopBtn}>
              ⏹ Stop
            </button>
          )}
          {attempts.length > 0 && !running && (
            <button onClick={clearResults} style={styles.clearBtn}>
              🗑 Clear
            </button>
          )}
        </div>

        {/* Stats summary */}
        {stats && (
          <div style={{
            ...styles.statsBox,
            borderColor: stats.blockedAt ? '#27ae60' : '#e74c3c',
          }}>
            <h3 style={{ color: '#f39c12', marginTop: 0 }}>Attack Summary</h3>
            <div style={styles.statsGrid}>
              <StatItem label="Outcome"       value={stats.outcome} />
              <StatItem label="Total Attempts" value={stats.totalAttempts} />
              <StatItem label="Total Time"     value={stats.totalTime} />
              <StatItem label="Avg per attempt" value={stats.avgPerAttempt} />
              <StatItem label="Mode"
                value={stats.mode}
                color={stats.mode === 'vulnerable' ? '#e74c3c' : '#2ecc71'}
              />
              {stats.blockedAt && (
                <StatItem
                  label="Blocked at attempt"
                  value={`#${stats.blockedAt}`}
                  color="#2ecc71"
                />
              )}
            </div>

            {!stats.blockedAt && isVulnerable && (
              <div style={styles.vulnWarning}>
                ⚠️ No rate limiting active — attacker could try the full wordlist
                and beyond with no server-side resistance
              </div>
            )}
            {stats.blockedAt && (
              <div style={styles.secureNote}>
                🔒 Rate limiting stopped the attack after {stats.blockedAt} attempts.
                Attacker must wait before trying again — making automation impractical.
              </div>
            )}
          </div>
        )}

        {/* Attempt log */}
        {attempts.length > 0 && (
          <div style={styles.logBox}>
            <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>
              Attempt Log ({attempts.length})
            </h3>
            <div style={styles.logScroll}>
              {attempts.map((a, i) => (
                <div key={i} style={{
                  ...styles.logRow,
                  background:
                    a.status === 'SUCCESS'      ? '#0a3a0a' :
                    a.status === 'RATE_LIMITED' ? '#0a2a3a' :
                    a.status === 'ACCOUNT_LOCKED'? '#2a1a0a' :
                    '#1a1a1a',
                }}>
                  <span style={styles.attemptNum}>#{a.attempt}</span>
                  <span style={styles.attemptPassword}>
                    <code>{a.password}</code>
                  </span>
                  <span style={{
                    ...styles.attemptStatus,
                    color:
                      a.status === 'SUCCESS'       ? '#2ecc71' :
                      a.status === 'RATE_LIMITED'  ? '#3498db' :
                      a.status === 'ACCOUNT_LOCKED'? '#f39c12' :
                      '#e74c3c',
                  }}>
                    {a.status === 'SUCCESS'       ? '✅ SUCCESS'      :
                     a.status === 'RATE_LIMITED'  ? '🔒 RATE LIMITED' :
                     a.status === 'ACCOUNT_LOCKED'? '🔒 LOCKED'       :
                     `❌ ${a.code}`}
                  </span>
                  <span style={styles.attemptDuration}>{a.duration}ms</span>
                  <span style={styles.attemptMessage}>{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defense explanation */}
        <div style={styles.defenseBox}>
          <h3 style={{ color: '#2ecc71', marginTop: 0 }}>
            🛡️ Defense Layers in Secure Mode
          </h3>
          <div style={styles.defenseGrid}>
            <DefenseItem
              title="Rate Limiting (today)"
              desc="10 attempts per 15 min per IP — 429 Too Many Requests blocks automation"
              active={!isVulnerable}
            />
            <DefenseItem
              title="Account Lockout (Day 3)"
              desc="5 consecutive failures → account locked for 15 minutes"
              active={!isVulnerable}
            />
            <DefenseItem
              title="bcrypt Hashing (Day 3)"
              desc="Even if DB is dumped, passwords cannot be reversed efficiently"
              active={!isVulnerable}
            />
            <DefenseItem
              title="Security Logging (Day 9)"
              desc="Every failed attempt logged with IP — pattern detection possible"
              active={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = '#e0e0e0' }) {
  return (
    <div style={statStyles.item}>
      <div style={statStyles.label}>{label}</div>
      <div style={{ ...statStyles.value, color }}>{value}</div>
    </div>
  );
}

function DefenseItem({ title, desc, active }) {
  return (
    <div style={{
      ...defStyles.item,
      borderLeft: `3px solid ${active ? '#27ae60' : '#555'}`,
      opacity: active ? 1 : 0.5,
    }}>
      <div style={{ color: active ? '#2ecc71' : '#888', fontWeight: 'bold', fontSize: '14px' }}>
        {active ? '✅' : '❌'} {title}
      </div>
      <div style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>{desc}</div>
    </div>
  );
}

const styles = {
  page:         { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:    { maxWidth: '900px', margin: '0 auto' },
  title:        { color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' },
  vulnBanner:   { background: '#c0392b', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  secureBanner: { background: '#27ae60', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  conceptBox:   { background: '#1a1a2e', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  configBox:    { background: '#16213e', border: '1px solid #0f3460', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  configRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' },
  configItem:   {},
  label:        { color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' },
  input:        { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#0a0a1a', color: '#e0e0e0', boxSizing: 'border-box' },
  hint:         { color: '#666', fontSize: '12px', margin: '4px 0 0' },
  wordlistPreview: { marginTop: '8px', padding: '8px', background: '#0a0a1a', borderRadius: '4px' },
  btnRow:       { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  attackBtn:    { padding: '12px 24px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  stopBtn:      { padding: '12px 24px', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  clearBtn:     { padding: '12px 24px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  statsBox:     { background: '#16213e', border: '2px solid', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' },
  vulnWarning:  { background: '#3a0a0a', color: '#e74c3c', padding: '10px', borderRadius: '4px', fontSize: '13px' },
  secureNote:   { background: '#0a3a0a', color: '#2ecc71', padding: '10px', borderRadius: '4px', fontSize: '13px' },
  logBox:       { background: '#0f0f1a', border: '1px solid #0f3460', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  logScroll:    { maxHeight: '400px', overflowY: 'auto' },
  logRow:       { display: 'grid', gridTemplateColumns: '40px 130px 130px 70px 1fr', gap: '8px', padding: '6px 8px', borderBottom: '1px solid #1a1a2e', fontSize: '13px', alignItems: 'center' },
  attemptNum:   { color: '#888', fontFamily: 'monospace' },
  attemptPassword: { color: '#f39c12' },
  attemptStatus:   { fontWeight: 'bold', fontSize: '12px' },
  attemptDuration: { color: '#888', fontFamily: 'monospace', fontSize: '12px' },
  attemptMessage:  { color: '#666', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  defenseBox:   { background: '#0d1f0d', border: '1px solid #1a5c1a', borderRadius: '8px', padding: '16px' },
  defenseGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
};

const statStyles = {
  item:  { background: '#0a0a2a', borderRadius: '6px', padding: '12px', textAlign: 'center' },
  label: { color: '#888', fontSize: '12px', marginBottom: '6px' },
  value: { fontSize: '18px', fontWeight: 'bold' },
};

const defStyles = {
  item: { background: '#0a0a1a', padding: '12px', borderRadius: '4px' },
};