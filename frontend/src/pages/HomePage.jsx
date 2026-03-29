// pages/HomePage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSecurityMode from '../hooks/useSecurityMode';

const ATTACKS = [
  {
    path:    '/search',
    icon:    '💉',
    tag:     'A03:2021',
    title:   'NoSQL Injection',
    desc:    'Bypass authentication using MongoDB operator objects. No password needed.',
    color:   '#e74c3c',
    day:     'Day 4',
  },
  {
    path:    '/',
    icon:    '☠️',
    tag:     'A03:2021',
    title:   'Cross-Site Scripting',
    desc:    'Store malicious scripts that execute in every victim\'s browser.',
    color:   '#9b59b6',
    day:     'Day 5',
  },
  {
    path:    '/csrf',
    icon:    '🎭',
    tag:     'A01:2021',
    title:   'CSRF Exploitation',
    desc:    'Forge state-changing requests from a malicious origin.',
    color:   '#e67e22',
    day:     'Day 6',
  },
  {
    path:    '/idor',
    icon:    '🔓',
    tag:     'A01:2021',
    title:   'IDOR / Broken Access',
    desc:    'Access and exfiltrate any user\'s data by changing an ID.',
    color:   '#f39c12',
    day:     'Day 7',
  },
  {
    path:    '/brute',
    icon:    '🔨',
    tag:     'A07:2021',
    title:   'Brute Force',
    desc:    'Automate login attempts with a dictionary attack wordlist.',
    color:   '#3498db',
    day:     'Day 10',
  },
  {
    path:    '/headers',
    icon:    '🔒',
    tag:     'A05:2021',
    title:   'HTTP Headers',
    desc:    'Browser-enforced CSP, HSTS, and clickjacking defenses.',
    color:   '#1abc9c',
    day:     'Day 11',
  },
  {
    path:    '/chain',
    icon:    '⚔️',
    tag:     'Kill Chain',
    title:   'Full Attack Chain',
    desc:    'Six-phase red team simulation: recon → injection → XSS → IDOR → CSRF → cover.',
    color:   '#e74c3c',
    day:     'Day 12',
  },
  {
    path:    '/logs',
    icon:    '📡',
    tag:     'A09:2021',
    title:   'Security Logging',
    desc:    'Real-time event feed. Every attack attempt captured and classified.',
    color:   '#27ae60',
    day:     'Day 9',
  },
];

const STATS = [
  { value: '8',    label: 'Attack Surfaces',  color: '#e74c3c' },
  { value: '2',    label: 'Modes',            color: '#3498db' },
  { value: 'OWASP', label: 'Top 10 Coverage', color: '#f39c12' },
  { value: '100%', label: 'Hands-On',         color: '#2ecc71' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { mode, isVulnerable } = useSecurityMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={styles.page}>

      {/* ── Animated grid background ── */}
      <div style={styles.gridBg} aria-hidden />

      {/* ── Hero ── */}
      <section style={{ ...styles.hero, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>

        <div style={styles.heroBadge}>
          <span style={{ ...styles.heroBadgeDot, background: isVulnerable ? '#e74c3c' : '#2ecc71' }} />
          <span style={styles.heroBadgeText}>
            {isVulnerable ? 'VULNERABLE MODE ACTIVE' : 'SECURE MODE ACTIVE'}
          </span>
        </div>

        <h1 style={styles.heroTitle}>
          <span style={styles.heroTitleMain}>SecureVuln</span>
          <span style={styles.heroTitleAccent}>App</span>
        </h1>

        <p style={styles.heroSub}>
          A dual-mode MERN cybersecurity lab. Flip between{' '}
          <span style={{ color: '#e74c3c', fontWeight: 600 }}>vulnerable</span> and{' '}
          <span style={{ color: '#2ecc71', fontWeight: 600 }}>secure</span>{' '}
          to see exactly how attacks work — and how defenses stop them.
        </p>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                ...styles.statCard,
                borderTop: `2px solid ${s.color}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(12px)',
                transition: `opacity 0.5s ease ${0.2 + i * 0.08}s, transform 0.5s ease ${0.2 + i * 0.08}s`,
              }}
            >
              <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={styles.ctaRow}>
          <button onClick={() => navigate('/chain')} style={styles.ctaPrimary}>
            ⚔️ Run Full Attack Chain
          </button>
          <button onClick={() => navigate('/status')} style={styles.ctaSecondary}>
            🛡️ View Security Status
          </button>
        </div>
      </section>

      {/* ── Mode explainer ── */}
      <section style={{ ...styles.modeSection, opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.3s' }}>
        <div style={styles.modeCard}>
          <div style={styles.modeCardHeader}>
            <span style={styles.modeCardIcon}>⚠️</span>
            <div>
              <h3 style={{ ...styles.modeCardTitle, color: '#e74c3c' }}>Vulnerable Mode</h3>
              <p style={styles.modeCardSub}>All protections disabled — attacks succeed</p>
            </div>
            {isVulnerable && <span style={styles.activePill}>● ACTIVE</span>}
          </div>
          <ul style={styles.modeList}>
            {['Plain text passwords stored in DB', 'NoSQL operators accepted in login', 'XSS payloads stored and executed', 'No CSRF token validation', 'Any user\'s data accessible via ID'].map(item => (
              <li key={item} style={styles.modeListItem}>
                <span style={{ color: '#e74c3c' }}>✗</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.modeArrow}>VS</div>

        <div style={{ ...styles.modeCard, borderColor: '#27ae60' }}>
          <div style={styles.modeCardHeader}>
            <span style={styles.modeCardIcon}>🔒</span>
            <div>
              <h3 style={{ ...styles.modeCardTitle, color: '#2ecc71' }}>Secure Mode</h3>
              <p style={styles.modeCardSub}>All defenses active — attacks blocked</p>
            </div>
            {!isVulnerable && <span style={{ ...styles.activePill, background: '#0d3d1a', color: '#2ecc71', borderColor: '#27ae60' }}>● ACTIVE</span>}
          </div>
          <ul style={styles.modeList}>
            {['bcrypt hashing + account lockout', 'express-mongo-sanitize strips operators', 'DOMPurify + CSP headers block XSS', 'Synchronizer token + origin validation', 'Ownership checks enforce IDOR protection'].map(item => (
              <li key={item} style={styles.modeListItem}>
                <span style={{ color: '#2ecc71' }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Attack cards ── */}
      <section style={styles.attacksSection}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionTitleAccent}>//</span> Attack Modules
        </h2>
        <p style={styles.sectionSub}>
          Each module demonstrates a real vulnerability. Switch modes using the sidebar to see attacks succeed or get blocked in real time.
        </p>

        <div style={styles.attackGrid}>
          {ATTACKS.map((attack, i) => (
            <button
              key={attack.path + i}
              onClick={() => navigate(attack.path)}
              style={{
                ...styles.attackCard,
                borderTop: `2px solid ${attack.color}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(16px)',
                transition: `opacity 0.5s ease ${0.1 + i * 0.05}s, transform 0.5s ease ${0.1 + i * 0.05}s, background 0.2s ease`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#13132a'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0d0d1f'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={styles.attackCardTop}>
                <span style={styles.attackIcon}>{attack.icon}</span>
                <span style={{ ...styles.attackTag, color: attack.color, borderColor: attack.color + '44', background: attack.color + '11' }}>
                  {attack.tag}
                </span>
              </div>
              <h3 style={styles.attackTitle}>{attack.title}</h3>
              <p style={styles.attackDesc}>{attack.desc}</p>
              <div style={styles.attackFooter}>
                <span style={{ ...styles.dayBadge, color: attack.color }}>{attack.day}</span>
                <span style={styles.attackArrow}>→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <span style={{ color: '#333', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
          SecureVulnApp · Built for cybersecurity learning · Never deploy vulnerable mode in production
        </span>
      </footer>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight:  '100vh',
    background: '#0a0a1a',
    padding:    '0 0 40px 0',
    position:   'relative',
    overflow:   'hidden',
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Subtle dot-grid background
  gridBg: {
    position:   'fixed',
    inset:      0,
    background: `radial-gradient(circle at 1px 1px, #1a1a3a 1px, transparent 0)`,
    backgroundSize: '32px 32px',
    opacity:    0.4,
    pointerEvents: 'none',
    zIndex:     0,
  },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    position:   'relative',
    zIndex:     1,
    maxWidth:   '860px',
    margin:     '0 auto',
    padding:    '64px 32px 48px',
    textAlign:  'center',
  },

  heroBadge: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '7px',
    padding:        '5px 14px',
    borderRadius:   '20px',
    background:     '#0d0d1f',
    border:         '1px solid #1a1a3a',
    marginBottom:   '28px',
    fontSize:       '11px',
    letterSpacing:  '1.5px',
    color:          '#888',
  },

  heroBadgeDot: {
    width:        '7px',
    height:       '7px',
    borderRadius: '50%',
  },

  heroBadgeText: { fontFamily: "'JetBrains Mono', monospace" },

  heroTitle: {
    fontSize:      'clamp(42px, 7vw, 72px)',
    fontFamily:    "'Syne', sans-serif",
    fontWeight:    800,
    letterSpacing: '-2px',
    lineHeight:    1,
    marginBottom:  '20px',
  },

  heroTitleMain: { color: '#e0e0e0' },
  heroTitleAccent: {
    color:      '#3498db',
    marginLeft: '4px',
  },

  heroSub: {
    color:        '#888',
    fontSize:     '15px',
    lineHeight:   1.8,
    maxWidth:     '580px',
    margin:       '0 auto 36px',
    fontFamily:   "'JetBrains Mono', monospace",
  },

  statsRow: {
    display:        'flex',
    justifyContent: 'center',
    gap:            '12px',
    flexWrap:       'wrap',
    marginBottom:   '36px',
  },

  statCard: {
    background:   '#0d0d1f',
    border:       '1px solid #1a1a3a',
    borderRadius: '8px',
    padding:      '16px 24px',
    textAlign:    'center',
    minWidth:     '100px',
  },

  statValue: {
    display:    'block',
    fontSize:   '26px',
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
  },

  statLabel: {
    display:       'block',
    color:         '#555',
    fontSize:      '11px',
    marginTop:     '4px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },

  ctaRow: {
    display:        'flex',
    gap:            '12px',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },

  ctaPrimary: {
    padding:      '13px 28px',
    background:   '#c0392b',
    color:        'white',
    border:       'none',
    borderRadius: '6px',
    cursor:       'pointer',
    fontWeight:   700,
    fontSize:     '14px',
    fontFamily:   "'JetBrains Mono', monospace",
    letterSpacing: '0.5px',
    transition:   'background 0.2s',
  },

  ctaSecondary: {
    padding:      '13px 28px',
    background:   'transparent',
    color:        '#e0e0e0',
    border:       '1px solid #2a2a4a',
    borderRadius: '6px',
    cursor:       'pointer',
    fontSize:     '14px',
    fontFamily:   "'JetBrains Mono', monospace",
    transition:   'border-color 0.2s',
  },

  // ── Mode explainer ─────────────────────────────────────────
  modeSection: {
    position:       'relative',
    zIndex:         1,
    maxWidth:       '860px',
    margin:         '0 auto 56px',
    padding:        '0 32px',
    display:        'flex',
    gap:            '16px',
    alignItems:     'stretch',
    flexWrap:       'wrap',
  },

  modeCard: {
    flex:         1,
    minWidth:     '260px',
    background:   '#0d0d1f',
    border:       '1px solid #c0392b',
    borderRadius: '10px',
    padding:      '20px',
  },

  modeCardHeader: {
    display:      'flex',
    alignItems:   'flex-start',
    gap:          '12px',
    marginBottom: '16px',
  },

  modeCardIcon:  { fontSize: '24px', flexShrink: 0 },
  modeCardTitle: { fontSize: '16px', fontFamily: "'Syne', sans-serif", fontWeight: 700, margin: '0 0 2px' },
  modeCardSub:   { color: '#666', fontSize: '12px', margin: 0 },

  activePill: {
    marginLeft:   'auto',
    padding:      '3px 10px',
    background:   '#3d0000',
    color:        '#e74c3c',
    border:       '1px solid #c0392b',
    borderRadius: '20px',
    fontSize:     '10px',
    fontWeight:   700,
    letterSpacing: '1px',
    whiteSpace:   'nowrap',
  },

  modeList: {
    listStyle:     'none',
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },

  modeListItem: {
    color:      '#888',
    fontSize:   '13px',
    display:    'flex',
    gap:        '8px',
    lineHeight: 1.5,
  },

  modeArrow: {
    display:     'flex',
    alignItems:  'center',
    color:       '#333',
    fontSize:    '13px',
    fontWeight:  700,
    letterSpacing: '2px',
    flexShrink:  0,
    alignSelf:   'center',
  },

  // ── Attack grid ────────────────────────────────────────────
  attacksSection: {
    position:  'relative',
    zIndex:    1,
    maxWidth:  '860px',
    margin:    '0 auto',
    padding:   '0 32px',
  },

  sectionTitle: {
    fontSize:      '22px',
    fontFamily:    "'Syne', sans-serif",
    fontWeight:    700,
    color:         '#e0e0e0',
    marginBottom:  '8px',
  },

  sectionTitleAccent: { color: '#3498db', marginRight: '8px' },

  sectionSub: {
    color:        '#666',
    fontSize:     '13px',
    marginBottom: '28px',
    lineHeight:   1.7,
  },

  attackGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap:                 '12px',
  },

  attackCard: {
    background:   '#0d0d1f',
    border:       '1px solid #1a1a3a',
    borderRadius: '10px',
    padding:      '18px',
    textAlign:    'left',
    cursor:       'pointer',
    display:      'flex',
    flexDirection:'column',
    gap:          '10px',
  },

  attackCardTop: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },

  attackIcon: { fontSize: '24px' },

  attackTag: {
    fontSize:     '10px',
    fontWeight:   700,
    padding:      '3px 8px',
    borderRadius: '4px',
    border:       '1px solid',
    letterSpacing:'0.5px',
  },

  attackTitle: {
    color:      '#e0e0e0',
    fontFamily: "'Syne', sans-serif",
    fontSize:   '15px',
    fontWeight: 700,
    margin:     0,
  },

  attackDesc: {
    color:      '#666',
    fontSize:   '12px',
    lineHeight: 1.6,
    margin:     0,
    flex:       1,
  },

  attackFooter: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      '4px',
  },

  dayBadge: {
    fontSize:      '11px',
    fontWeight:    700,
    letterSpacing: '0.5px',
  },

  attackArrow: {
    color:    '#2a2a5a',
    fontSize: '18px',
  },

  // ── Footer ─────────────────────────────────────────────────
  footer: {
    position:   'relative',
    zIndex:     1,
    textAlign:  'center',
    marginTop:  '56px',
    padding:    '20px 32px 0',
    borderTop:  '1px solid #0d0d1f',
  },
};