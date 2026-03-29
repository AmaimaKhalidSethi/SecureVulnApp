import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { SecurityProvider } from './context/SecurityContext';
import useSecurityMode from './hooks/useSecurityMode';
import API from './api/axiosConfig';
import HomePage from './pages/HomePage';

import CommentsPage       from './pages/CommentsPage';
import SearchPage         from './pages/SearchPage';
import CsrfDemoPage       from './pages/CsrfDemoPage';
import IdorDemoPage       from './pages/IdorDemoPage';
import SecurityStatusPage from './pages/SecurityStatusPage';
import SecurityLogsPage   from './pages/SecurityLogsPage';
import BruteForceDemo     from './pages/BruteForceDemo';
import AttackChainPage    from './pages/AttackChainPage';
import HeadersDemo        from './pages/HeadersDemo';

const NAV_ITEMS = [
  { path: '/home',    icon: '🏠', label: 'Home'          },  // ← ADD
  { path: '/xss',     icon: '💬', label: 'Stored XSS'    },  // ← was '/'
  { path: '/search',  icon: '🔍', label: 'Reflected XSS' },
  { path: '/csrf',    icon: '🎭', label: 'CSRF'          },
  { path: '/idor',    icon: '🔓', label: 'IDOR'          },
  { path: '/brute',   icon: '💀', label: 'Brute Force'   },
  { path: '/headers', icon: '🔒', label: 'HTTP Headers'  },
  { path: '/chain',   icon: '⚔️', label: 'Attack Chain'  },
  { path: '/status',  icon: '🛡️', label: 'Status'        },
  { path: '/logs',    icon: '📋', label: 'Logs'          },
];

function Sidebar({ collapsed, setCollapsed }) {
  const { mode, isVulnerable, refresh } = useSecurityMode();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);

  const switchMode = async (targetMode) => {
    if (targetMode === mode || switching) return;
    setSwitching(true);
    try {
      await API.post('/mode/set', { mode: targetMode });
      setTimeout(() => { refresh(); setSwitching(false); }, 1800);
    } catch (err) {
      console.error('Mode switch failed', err);
      setSwitching(false);
    }
  };

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? '60px' : '220px' }}>

      {/* Logo / collapse toggle */}
      <div style={styles.sidebarHeader}>
        {!collapsed && (
          <span style={styles.appName}>🛡️ SecureApp</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={styles.collapseBtn}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Mode toggle buttons */}
      <div style={styles.modeSection}>
        {!collapsed && (
          <p style={styles.modeLabel}>MODE</p>
        )}
        <button
          onClick={() => switchMode('vulnerable')}
          disabled={switching}
          title="Switch to Vulnerable Mode"
          style={{
            ...styles.modeBtn,
            background:  isVulnerable ? '#c0392b' : '#1a0a0a',
            border:      isVulnerable ? '1px solid #e74c3c' : '1px solid #333',
            color:       isVulnerable ? '#fff' : '#888',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <span style={styles.modeBtnIcon}>⚠️</span>
          {!collapsed && (
            <span style={styles.modeBtnText}>
              {switching && !isVulnerable ? '⏳ Switching...' : 'Vulnerable'}
            </span>
          )}
        </button>

        <button
          onClick={() => switchMode('secure')}
          disabled={switching}
          title="Switch to Secure Mode"
          style={{
            ...styles.modeBtn,
            background: !isVulnerable ? '#0d3d1a' : '#0a1a0a',
            border:     !isVulnerable ? '1px solid #27ae60' : '1px solid #333',
            color:      !isVulnerable ? '#fff' : '#888',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <span style={styles.modeBtnIcon}>🔒</span>
          {!collapsed && (
            <span style={styles.modeBtnText}>
              {switching && isVulnerable ? '⏳ Switching...' : 'Secure'}
            </span>
          )}
        </button>

        {/* Current mode badge */}
        {!collapsed && (
          <div style={{
            ...styles.modeBadge,
            background:  isVulnerable ? '#3d0000' : '#003d1a',
            color:       isVulnerable ? '#ff6b6b' : '#6bffb8',
            borderColor: isVulnerable ? '#c0392b' : '#27ae60',
          }}>
            <span style={styles.modeDot(isVulnerable)} />
            {isVulnerable ? 'VULNERABLE' : 'SECURE'}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Nav links */}
      <nav style={styles.nav}>
        {!collapsed && <p style={styles.navLabel}>ATTACK DEMOS</p>}
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              style={{
                ...styles.navLink,
                background:  active ? 'rgba(52,152,219,0.15)' : 'transparent',
                borderLeft:  active ? '3px solid #3498db' : '3px solid transparent',
                paddingLeft: active ? '13px' : '16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span style={styles.navText}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Server restart note */}
      {!collapsed && (
        <p style={styles.footerNote}>
          💡 Mode switch triggers server restart via nodemon
        </p>
      )}
    </aside>
  );
}

function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={styles.appShell}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{ ...styles.main, marginLeft: collapsed ? '60px' : '220px' }}>
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/home"    element={<HomePage />} />
          <Route path="/xss"     element={<CommentsPage />} />
          <Route path="/search"  element={<SearchPage />} />
          <Route path="/csrf"    element={<CsrfDemoPage />} />
          <Route path="/idor"    element={<IdorDemoPage />} />
          <Route path="/brute"   element={<BruteForceDemo />} />
          <Route path="/headers" element={<HeadersDemo />} />
          <Route path="/chain"   element={<AttackChainPage />} />
          <Route path="/status"  element={<SecurityStatusPage />} />
          <Route path="/logs"    element={<SecurityLogsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SecurityProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </SecurityProvider>
  );
}

const styles = {
  appShell: {
    display:    'flex',
    minHeight:  '100vh',
    background: '#0a0a1a',
  },

  // ── Sidebar ───────────────────────────────────────────────
  sidebar: {
    position:        'fixed',
    top:             0,
    left:            0,
    height:          '100vh',
    background:      '#0d0d1f',
    borderRight:     '1px solid #1a1a3a',
    display:         'flex',
    flexDirection:   'column',
    transition:      'width 0.25s ease',
    zIndex:          100,
    overflowX:       'hidden',
    overflowY:       'auto',
  },

  sidebarHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '16px 12px',
    borderBottom:   '1px solid #1a1a3a',
    minHeight:      '56px',
  },

  appName: {
    color:      '#e0e0e0',
    fontWeight: 'bold',
    fontSize:   '15px',
    whiteSpace: 'nowrap',
  },

  collapseBtn: {
    background:  'transparent',
    border:      '1px solid #2a2a4a',
    color:       '#888',
    borderRadius:'4px',
    cursor:      'pointer',
    padding:     '4px 8px',
    fontSize:    '14px',
    flexShrink:  0,
  },

  // ── Mode section ──────────────────────────────────────────
  modeSection: {
    padding:       '12px 8px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },

  modeLabel: {
    color:         '#555',
    fontSize:      '10px',
    fontWeight:    'bold',
    letterSpacing: '1.5px',
    margin:        '0 0 4px 8px',
  },

  modeBtn: {
    display:       'flex',
    alignItems:    'center',
    gap:           '8px',
    padding:       '9px 12px',
    borderRadius:  '6px',
    cursor:        'pointer',
    transition:    'all 0.2s ease',
    fontWeight:    'bold',
    fontSize:      '13px',
    whiteSpace:    'nowrap',
    width:         '100%',
  },

  modeBtnIcon: { fontSize: '15px', flexShrink: 0 },
  modeBtnText: { fontSize: '13px' },

  modeBadge: {
    display:        'flex',
    alignItems:     'center',
    gap:            '6px',
    marginTop:      '4px',
    padding:        '5px 10px',
    borderRadius:   '4px',
    border:         '1px solid',
    fontSize:       '11px',
    fontWeight:     'bold',
    letterSpacing:  '1px',
  },

  modeDot: (isVulnerable) => ({
    width:        '7px',
    height:       '7px',
    borderRadius: '50%',
    background:   isVulnerable ? '#e74c3c' : '#2ecc71',
    flexShrink:   0,
  }),

  // ── Nav ───────────────────────────────────────────────────
  nav: {
    display:       'flex',
    flexDirection: 'column',
    padding:       '4px 0',
    flex:          1,
  },

  navLabel: {
    color:         '#555',
    fontSize:      '10px',
    fontWeight:    'bold',
    letterSpacing: '1.5px',
    margin:        '8px 0 4px 16px',
  },

  navLink: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        '9px 16px',
    textDecoration: 'none',
    transition:     'all 0.15s ease',
    whiteSpace:     'nowrap',
  },

  navIcon: { fontSize: '16px', flexShrink: 0 },
  navText: { color: '#b0b0c8', fontSize: '13px' },

  // ── Misc ──────────────────────────────────────────────────
  divider: {
    height:     '1px',
    background: '#1a1a3a',
    margin:     '4px 0',
  },

  footerNote: {
    color:      '#444',
    fontSize:   '11px',
    padding:    '10px 14px',
    lineHeight: 1.5,
    margin:     0,
  },

  // ── Main ──────────────────────────────────────────────────
  main: {
    flex:       1,
    transition: 'margin-left 0.25s ease',
    minWidth:   0,
  },
};