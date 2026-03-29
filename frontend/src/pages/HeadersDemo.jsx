// pages/HeadersDemo.jsx
// ============================================================
// HTTP SECURITY HEADERS DEMO
// Shows which headers are active, what they do,
// and demonstrates the impact of each one
// ============================================================

import { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import useSecurityMode from '../hooks/useSecurityMode';

const HEADER_DETAILS = [
  {
    name:    'Content-Security-Policy',
    short:   'CSP',
    attack:  'XSS — Cross-Site Scripting',
    icon:    '🛡️',
    vulnerable: "Not set — browser loads scripts from ANY origin",
    secure:     "default-src 'self' — only same-origin resources allowed",
    demo:    'Try posting <script>alert("XSS")</script> as a comment. In secure mode CSP prevents inline script execution even if it reaches the DOM.',
    severity: 'CRITICAL',
  },
  {
    name:    'X-Frame-Options',
    short:   'XFO',
    attack:  'Clickjacking',
    icon:    '🖼️',
    vulnerable: "Not set — your pages can be embedded in any iframe",
    secure:     "DENY — browser refuses to render page inside any iframe",
    demo:    'An attacker puts your login page inside an invisible iframe on evil.com. User thinks they are clicking evil.com but actually submitting credentials to your app.',
    severity: 'HIGH',
  },
  {
    name:    'Strict-Transport-Security',
    short:   'HSTS',
    attack:  'SSL Stripping / MITM',
    icon:    '🔐',
    vulnerable: "Not set — browser will attempt HTTP if HTTPS fails",
    secure:     "max-age=31536000 — browser forces HTTPS for 1 year",
    demo:    'Without HSTS, attacker intercepts HTTP redirect to HTTPS and keeps connection as HTTP, reading all traffic in plaintext.',
    severity: 'HIGH',
  },
  {
    name:    'X-Content-Type-Options',
    short:   'XCTO',
    attack:  'MIME Sniffing / Polyglot Files',
    icon:    '📄',
    vulnerable: "Not set — browser may execute files based on content, not extension",
    secure:     "nosniff — browser strictly respects Content-Type header",
    demo:    'Attacker uploads a file named image.jpg that actually contains JavaScript. Without nosniff, browser might execute it as a script.',
    severity: 'MEDIUM',
  },
  {
    name:    'X-XSS-Protection',
    short:   'XXP',
    attack:  'Reflected XSS (legacy browsers)',
    icon:    '🔍',
    vulnerable: "Not set — browser XSS filter disabled",
    secure:     "1; mode=block — browser blocks page on XSS detection",
    demo:    'Older browsers had built-in XSS filters. This header enables and configures them. Modern browsers rely on CSP instead.',
    severity: 'LOW',
  },
  {
    name:    'Referrer-Policy',
    short:   'RP',
    attack:  'Information Leakage',
    icon:    '🔗',
    vulnerable: "Not set — full URL including query params sent cross-origin",
    secure:     "strict-origin-when-cross-origin — only origin sent cross-origin",
    demo:    'User on yourapp.com/reset?token=abc123 clicks external link. Without this header, the full URL including the reset token is sent to the external site.',
    severity: 'MEDIUM',
  },
  {
    name:    'Permissions-Policy',
    short:   'PP',
    attack:  'Feature Abuse via XSS',
    icon:    '🎙️',
    vulnerable: "Not set — all browser features available to scripts",
    secure:     "camera=(), microphone=(), geolocation=() — hardware access denied",
    demo:    'XSS payload attempts navigator.mediaDevices.getUserMedia() to access webcam. With Permissions-Policy, browser denies the request entirely.',
    severity: 'MEDIUM',
  },
];

export default function HeadersDemo() {
  const { mode, isVulnerable } = useSecurityMode();
  const [headerData,  setHeaderData]  = useState(null);
  const [actualHeaders, setActualHeaders] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState(null);

  useEffect(() => {
    fetchHeaderInfo();
  }, [mode]);

  const fetchHeaderInfo = async () => {
    setLoading(true);
    try {
      const res = await API.get('/headers');
      setHeaderData(res.data);
    } catch (err) {
      console.error('Failed to fetch header info', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch actual response headers from the API
  const checkActualHeaders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/mode');
      const headerObj = {};
      const securityHeaders = [
        'content-security-policy',
        'x-frame-options',
        'strict-transport-security',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
      ];
      securityHeaders.forEach(h => {
        const val = res.headers.get(h);
        headerObj[h] = val || '❌ NOT PRESENT';
      });
      setActualHeaders(headerObj);
    } catch (err) {
      console.error('Failed to check headers', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🔒 HTTP Security Headers</h1>

        <div style={isVulnerable ? styles.vulnBanner : styles.secureBanner}>
          {isVulnerable
            ? '⚠️ VULNERABLE MODE — No security headers sent to browser'
            : '🔒 SECURE MODE — Full Helmet.js header suite active'}
        </div>

        {/* Concept */}
        <div style={styles.conceptBox}>
          <h3 style={{ color: '#f39c12', marginTop: 0 }}>
            How Browser Enforcement Works
          </h3>
          <p style={{ color: '#ccc', lineHeight: 1.7 }}>
            Security headers travel in the HTTP response from your server to the
            browser. The browser reads them <strong>before rendering the page</strong>{' '}
            and enforces every policy automatically. Your JavaScript code doesn't
            need to do anything — the browser is the enforcement engine.
            No header = no protection, even if your backend code is perfect.
          </p>
        </div>

        {/* Live header check */}
        <div style={styles.liveCheck}>
          <h3 style={{ color: '#e0e0e0', marginTop: 0 }}>
            Live Header Verification
          </h3>
          <p style={{ color: '#888', fontSize: '13px' }}>
            Fetch actual response headers from the backend right now:
          </p>
          <button onClick={checkActualHeaders} disabled={loading} style={styles.checkBtn}>
            {loading ? '⏳ Checking...' : '🔍 Check Actual Response Headers'}
          </button>

          {actualHeaders && (
            <div style={styles.actualHeaders}>
              {Object.entries(actualHeaders).map(([header, value]) => (
                <div key={header} style={{
                  ...styles.headerRow,
                  background: value === '❌ NOT PRESENT' ? '#2a0a0a' : '#0a2a0a',
                }}>
                  <span style={styles.headerName}>{header}</span>
                  <span style={{
                    ...styles.headerValue,
                    color: value === '❌ NOT PRESENT' ? '#e74c3c' : '#2ecc71',
                    fontSize: value === '❌ NOT PRESENT' ? '13px' : '11px',
                  }}>
                    {value}
                  </span>
                </div>
              ))}
              <p style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>
                Switch modes and click again to see headers appear/disappear.
              </p>
            </div>
          )}
        </div>

        {/* Header cards */}
        <h2 style={{ color: '#e0e0e0', marginBottom: '12px' }}>
          Security Header Reference
        </h2>
        <div style={styles.cardGrid}>
          {HEADER_DETAILS.map(header => (
            <div
              key={header.name}
              onClick={() => setSelected(selected?.name === header.name ? null : header)}
              style={{
                ...styles.card,
                border: selected?.name === header.name
                  ? '2px solid #3498db'
                  : '1px solid #0f3460',
                cursor: 'pointer',
              }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>{header.icon}</span>
                <div>
                  <div style={styles.cardShort}>{header.short}</div>
                  <div style={styles.cardName}>{header.name}</div>
                </div>
                <span style={{
                  ...styles.severityBadge,
                  background:
                    header.severity === 'CRITICAL' ? '#7b0000' :
                    header.severity === 'HIGH'     ? '#4a2000' :
                    header.severity === 'MEDIUM'   ? '#3a3a00' : '#002a00',
                  color:
                    header.severity === 'CRITICAL' ? '#ff6b6b' :
                    header.severity === 'HIGH'     ? '#e67e22' :
                    header.severity === 'MEDIUM'   ? '#f1c40f' : '#2ecc71',
                }}>
                  {header.severity}
                </span>
              </div>

              <div style={styles.attackLabel}>
                Prevents: <strong>{header.attack}</strong>
              </div>

              <div style={styles.statusRow}>
                <div style={isVulnerable ? styles.vulnStatus : styles.secureStatus}>
                  {isVulnerable ? `❌ ${header.vulnerable}` : `✅ ${header.secure}`}
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.name === header.name && (
                <div style={styles.expandedDetail}>
                  <div style={styles.detailSection}>
                    <strong style={{ color: '#e74c3c' }}>Without this header:</strong>
                    <p style={styles.detailText}>{header.vulnerable}</p>
                  </div>
                  <div style={styles.detailSection}>
                    <strong style={{ color: '#2ecc71' }}>With this header:</strong>
                    <p style={styles.detailText}>{header.secure}</p>
                  </div>
                  <div style={styles.detailSection}>
                    <strong style={{ color: '#f39c12' }}>Attack scenario:</strong>
                    <p style={styles.detailText}>{header.demo}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DevTools instructions */}
        <div style={styles.devToolsBox}>
          <h3 style={{ color: '#3498db', marginTop: 0 }}>
            🔧 How to Verify in Browser DevTools
          </h3>
          <ol style={{ color: '#ccc', lineHeight: 2 }}>
            <li>Press <code style={styles.code}>F12</code> to open DevTools</li>
            <li>Click the <code style={styles.code}>Network</code> tab</li>
            <li>Refresh the page (<code style={styles.code}>F5</code>)</li>
            <li>Click any request in the list (e.g., the first one)</li>
            <li>Click the <code style={styles.code}>Response Headers</code> section</li>
            <li>
              In <strong style={{ color: '#e74c3c' }}>vulnerable mode</strong>:
              you will NOT see CSP, X-Frame-Options, etc.
            </li>
            <li>
              In <strong style={{ color: '#2ecc71' }}>secure mode</strong>:
              all headers appear with their values
            </li>
          </ol>
          <div style={styles.codeBlock}>
            <p style={{ color: '#888', fontSize: '12px', margin: '0 0 8px 0' }}>
              Or check via PowerShell:
            </p>
            <code style={styles.codeInner}>
              {'Invoke-WebRequest -Uri http://localhost:5000/api/mode | Select-Object -ExpandProperty Headers'}
            </code>
          </div>
        </div>

        {/* CSP and XSS connection */}
        <div style={styles.xssBox}>
          <h3 style={{ color: '#e74c3c', marginTop: 0 }}>
            🎯 CSP vs XSS — The Direct Connection
          </h3>
          <div style={styles.xssGrid}>
            <div style={styles.xssCard}>
              <h4 style={{ color: '#e74c3c', marginTop: 0 }}>
                Day 5 XSS — No CSP
              </h4>
              <code style={styles.xssCode}>
                {'<script>alert("XSS")</script>'}
              </code>
              <p style={styles.xssText}>
                Script tag stored in DB → served to browser →
                browser executes it → attacker wins
              </p>
              <p style={{ color: '#e74c3c', fontSize: '13px' }}>
                ❌ No header = no defense at browser level
              </p>
            </div>
            <div style={styles.xssCard}>
              <h4 style={{ color: '#2ecc71', marginTop: 0 }}>
                Day 5 XSS — With CSP
              </h4>
              <code style={styles.xssCode}>
                {'<script>alert("XSS")</script>'}
              </code>
              <p style={styles.xssText}>
                Script tag stored in DB → served to browser →
                browser checks CSP → script not in allowed list →
                browser REFUSES to execute
              </p>
              <p style={{ color: '#2ecc71', fontSize: '13px' }}>
                ✅ CSP = second layer of defense even if sanitization fails
              </p>
            </div>
          </div>
          <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
            CSP is defense-in-depth — it catches XSS even if DOMPurify sanitization
            fails or is bypassed. Never rely on a single defense layer.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:         { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:    { maxWidth: '1000px', margin: '0 auto' },
  title:        { color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' },
  vulnBanner:   { background: '#c0392b', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  secureBanner: { background: '#27ae60', color: 'white', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  conceptBox:   { background: '#1a1a2e', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  liveCheck:    { background: '#16213e', border: '1px solid #0f3460', borderRadius: '8px', padding: '16px', marginBottom: '24px' },
  checkBtn:     { padding: '10px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '12px' },
  actualHeaders:{ marginTop: '12px' },
  headerRow:    { display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' },
  headerName:   { color: '#3498db', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold' },
  headerValue:  { fontFamily: 'monospace', maxWidth: '500px', wordBreak: 'break-all' },
  cardGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '12px', marginBottom: '24px' },
  card:         { background: '#16213e', borderRadius: '8px', padding: '14px', transition: 'border 0.2s' },
  cardHeader:   { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' },
  cardIcon:     { fontSize: '24px', flexShrink: 0 },
  cardShort:    { color: '#3498db', fontWeight: 'bold', fontSize: '14px' },
  cardName:     { color: '#888', fontSize: '11px', fontFamily: 'monospace' },
  severityBadge:{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 },
  attackLabel:  { color: '#aaa', fontSize: '13px', marginBottom: '8px' },
  statusRow:    {},
  vulnStatus:   { color: '#e74c3c', fontSize: '12px', lineHeight: 1.5 },
  secureStatus: { color: '#2ecc71', fontSize: '12px', lineHeight: 1.5 },
  expandedDetail: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #0f3460' },
  detailSection:{ marginBottom: '10px' },
  detailText:   { color: '#ccc', fontSize: '13px', lineHeight: 1.6, margin: '4px 0 0' },
  devToolsBox:  { background: '#0d1f37', border: '1px solid #2980b9', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  code:         { background: '#0a0a1a', color: '#f39c12', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '13px' },
  codeBlock:    { background: '#0a0a1a', padding: '12px', borderRadius: '6px', marginTop: '12px' },
  codeInner:    { color: '#f39c12', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' },
  xssBox:       { background: '#1a0a0a', border: '1px solid #c0392b', borderRadius: '8px', padding: '16px' },
  xssGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  xssCard:      { background: '#0a0a0a', padding: '14px', borderRadius: '6px' },
  xssCode:      { display: 'block', background: '#1a0a0a', color: '#e74c3c', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', marginBottom: '8px' },
  xssText:      { color: '#aaa', fontSize: '13px', lineHeight: 1.6 },
};