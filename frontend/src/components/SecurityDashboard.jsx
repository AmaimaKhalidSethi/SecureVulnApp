import useSecurityMode from '../hooks/useSecurityMode';

export default function SecurityDashboard() {
  const { mode, config, isVulnerable, lastChecked, refresh } = useSecurityMode();

  if (!config) return <p style={{ color: '#aaa' }}>Loading security config...</p>;

  const sections = [
    {
      title: '🔐 Authentication',
      items: [
        { key: 'Password Storage',      current: config.auth?.hashPasswords,          vuln: 'Plain text',               secure: 'bcrypt (10 rounds)' },
        { key: 'JWT Enforcement',       current: config.auth?.enforceJwt,             vuln: 'Disabled — all routes open', secure: 'Required on all protected routes' },
        { key: 'Brute Force Protection', current: config.auth?.enforceJwt,            vuln: 'None — unlimited attempts', secure: 'Lockout after 5 fails (15 min)' },
      ],
    },
    {
      title: '🧹 Input Handling',
      items: [
        { key: 'Input Sanitization',  current: config.input?.sanitizeInputs, vuln: 'None — XSS stored raw',         secure: 'DOMPurify strips scripts' },
        { key: 'Input Validation',    current: config.input?.validateInputs, vuln: 'None — any value accepted',     secure: 'express-validator enforced' },
        { key: 'NoSQL Sanitization',  current: config.input?.mongoSanitize,  vuln: '$operators pass through',       secure: 'express-mongo-sanitize active' },
      ],
    },
    {
      title: '🚦 Rate Limiting',
      items: [
        { key: 'Rate Limiter', current: config.rateLimit?.enabled, vuln: 'Disabled — unlimited requests', secure: '10 req/15min on auth, 200/15min global' },
      ],
    },
    {
      title: '🌐 HTTP Security',
      items: [
        { key: 'Security Headers', current: config.headers?.useHelmet, vuln: 'None — no Helmet.js', secure: 'Full Helmet suite (CSP, HSTS, XFO...)' },
        { key: 'CORS Policy',      current: config.headers?.useHelmet, vuln: 'Wildcard * — any origin', secure: 'localhost:3000 only' },
      ],
    },
    {
      title: '👤 Access Control',
      items: [
        { key: 'Ownership Checks',  current: config.data?.enforceOwnership,       vuln: 'None — IDOR possible',       secure: 'JWT ID vs resource ID checked' },
        { key: 'Role Assignment',   current: !config.data?.allowAdminSelfPromotion, vuln: 'Client-controlled',         secure: 'Server-forced to "user"' },
      ],
    },
    {
      title: '💬 Error Handling',
      items: [
        { key: 'Error Messages', current: !config.errors?.verbose, vuln: 'Full stack traces exposed', secure: 'Generic messages only' },
      ],
    },
  ];

  const totalSettings = sections.reduce((a, s) => a + s.items.length, 0);
  const secureCount   = sections.reduce((a, s) => a + s.items.filter(i => i.current).length, 0);
  const securePercent = Math.round((secureCount / totalSettings) * 100);

  return (
    <div>
      <div style={isVulnerable ? styles.scoreCardVuln : styles.scoreCardSecure}>
        <div style={styles.scoreLeft}>
          <div style={styles.scoreNumber}>{securePercent}%</div>
          <div style={styles.scoreLabel}>Security Score</div>
        </div>
        <div style={styles.scoreRight}>
          <div style={{ color: 'white', fontSize: '18px' }}>Mode: <strong>{mode.toUpperCase()}</strong></div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{secureCount}/{totalSettings} protections active</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Last updated: {lastChecked?.toLocaleTimeString()}</div>
          <button onClick={refresh} style={styles.refreshBtn}>↻ Refresh Now</button>
        </div>
        <div style={styles.progressBarTrack}>
          <div style={{ ...styles.progressBarFill, width: `${securePercent}%`, background: securePercent === 100 ? '#27ae60' : securePercent > 50 ? '#f39c12' : '#e74c3c' }} />
        </div>
      </div>

      {sections.map(section => (
        <div key={section.title} style={styles.section}>
          <h3 style={styles.sectionTitle}>{section.title}</h3>
          <div style={styles.tableHeader}>
            <span>Setting</span><span>Vulnerable</span><span>Secure</span><span>Status</span>
          </div>
          {section.items.map(item => (
            <div key={item.key} style={{ ...styles.tableRow, background: item.current ? '#0a1a0a' : '#1a0a0a' }}>
              <span style={{ color: '#e0e0e0' }}>{item.key}</span>
              <span style={{ color: '#e74c3c', fontSize: '12px' }}>{item.vuln}</span>
              <span style={{ color: '#2ecc71', fontSize: '12px' }}>{item.secure}</span>
              <span style={{ textAlign: 'center' }}>
                {item.current
                  ? <span style={styles.activeTag}>✅ ACTIVE</span>
                  : <span style={styles.inactiveTag}>❌ OFF</span>}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const styles = {
  scoreCardVuln:    { background: 'linear-gradient(135deg, #3d0000, #7b1010)', borderRadius: '10px', padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  scoreCardSecure:  { background: 'linear-gradient(135deg, #003d1a, #0d5c2a)', borderRadius: '10px', padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  scoreLeft:        { textAlign: 'center' },
  scoreNumber:      { fontSize: '52px', fontWeight: 'bold', color: 'white', lineHeight: 1 },
  scoreLabel:       { color: 'rgba(255,255,255,0.7)', fontSize: '13px' },
  scoreRight:       { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  refreshBtn:       { marginTop: '8px', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', alignSelf: 'flex-start' },
  progressBarTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(0,0,0,0.3)' },
  progressBarFill:  { height: '100%', transition: 'width 0.5s ease' },
  section:          { marginBottom: '20px' },
  sectionTitle:     { color: '#f39c12', marginBottom: '8px', fontSize: '15px' },
  tableHeader:      { display: 'grid', gridTemplateColumns: '1.5fr 2fr 2fr 0.8fr', gap: '8px', padding: '6px 10px', background: '#0f0f1a', borderRadius: '4px 4px 0 0', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow:         { display: 'grid', gridTemplateColumns: '1.5fr 2fr 2fr 0.8fr', gap: '8px', padding: '8px 10px', borderBottom: '1px solid #1a1a2e', fontSize: '13px', alignItems: 'center' },
  activeTag:        { background: '#0d3d1a', color: '#2ecc71', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' },
  inactiveTag:      { background: '#3d0d0d', color: '#e74c3c', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' },
};