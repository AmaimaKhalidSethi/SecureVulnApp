import { useState } from 'react';
import useSecurityMode from '../hooks/useSecurityMode';

export default function SecurityBanner() {
  const { config, mode, isVulnerable, loading, lastChecked, error, refresh } = useSecurityMode();
  const [expanded, setExpanded] = useState(false);

  if (loading) return null;
  if (error)   return (
    <div style={styles.errorBadge}>❌ Backend offline</div>
  );

  return (
    <div style={styles.wrapper}>

      {/* Expandable detail panel — appears above badge */}
      {expanded && config && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={{ color: '#e0e0e0', fontWeight: 'bold', fontSize: '13px' }}>
              Security Settings
            </span>
            <span style={{ color: '#888', fontSize: '11px' }}>
              {lastChecked?.toLocaleTimeString()}
            </span>
          </div>
          <div style={styles.itemList}>
            {[
              ['Password Hashing',  config.auth?.hashPasswords],
              ['JWT Enforcement',   config.auth?.enforceJwt],
              ['Input Sanitize',    config.input?.sanitizeInputs],
              ['NoSQL Sanitize',    config.input?.mongoSanitize],
              ['Rate Limiting',     config.rateLimit?.enabled],
              ['Helmet Headers',    config.headers?.useHelmet],
              ['Generic Errors',    !config.errors?.verbose],
              ['IDOR Protection',   config.data?.enforceOwnership],
            ].map(([label, active]) => (
              <div key={label} style={styles.item}>
                <span style={{ color: '#aaa', fontSize: '12px' }}>{label}</span>
                <span style={{ color: active ? '#2ecc71' : '#e74c3c', fontSize: '12px', fontWeight: 'bold' }}>
                  {active ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
          <button onClick={refresh} style={styles.refreshBtn}>↻ Refresh</button>
        </div>
      )}

      {/* The badge itself */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          ...styles.badge,
          background:  isVulnerable
            ? 'linear-gradient(135deg, #7b0000, #c0392b)'
            : 'linear-gradient(135deg, #0d3d1a, #27ae60)',
          boxShadow: isVulnerable
            ? '0 4px 20px rgba(192,57,43,0.5)'
            : '0 4px 20px rgba(39,174,96,0.4)',
        }}
      >
        <span style={styles.dot(isVulnerable)} />
        <span style={styles.badgeText}>
          {isVulnerable ? '⚠️ VULNERABLE' : '🔒 SECURE'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
          {expanded ? '▼' : '▲'}
        </span>
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position:      'fixed',
    bottom:        '20px',
    right:         '20px',
    zIndex:        999,
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'flex-end',
    gap:           '8px',
  },

  errorBadge: {
    position:   'fixed',
    bottom:     '20px',
    right:      '20px',
    background: '#3d0000',
    color:      '#ff6b6b',
    padding:    '8px 14px',
    borderRadius: '20px',
    fontSize:   '13px',
    zIndex:     999,
  },

  badge: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '8px 16px',
    borderRadius: '20px',
    border:       'none',
    cursor:       'pointer',
    color:        'white',
    fontWeight:   'bold',
    fontSize:     '13px',
    transition:   'all 0.2s ease',
  },

  badgeText: {
    whiteSpace: 'nowrap',
    fontSize:   '12px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },

  dot: (isVulnerable) => ({
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    background:   isVulnerable ? '#ffb3b3' : '#b3ffcc',
    flexShrink:   0,
  }),

  panel: {
    background:   '#0d0d1f',
    border:       '1px solid #1a1a3a',
    borderRadius: '10px',
    padding:      '14px',
    minWidth:     '240px',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
  },

  panelHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '10px',
    paddingBottom:  '8px',
    borderBottom:   '1px solid #1a1a3a',
  },

  itemList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
    marginBottom:  '12px',
  },

  item: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '4px 0',
  },

  refreshBtn: {
    width:        '100%',
    padding:      '6px',
    background:   '#1a1a3a',
    border:       '1px solid #2a2a5a',
    color:        '#888',
    borderRadius: '6px',
    cursor:       'pointer',
    fontSize:     '12px',
  },
};