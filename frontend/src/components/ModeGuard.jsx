import { useState } from 'react';
import useSecurityMode from '../hooks/useSecurityMode';

export default function ModeGuard({ children, requireMode, action = 'this action' }) {
  const { mode, isVulnerable } = useSecurityMode();
  const [dismissed, setDismissed] = useState(false);

  const modeMatches = mode === requireMode;

  if (modeMatches || dismissed) {
    return (
      <div>
        {!modeMatches && dismissed && (
          <div style={styles.overrideBanner}>
            ⚠️ Warning dismissed — performing {action} in {mode} mode
          </div>
        )}
        {children}
      </div>
    );
  }

  if (requireMode === 'vulnerable' && !isVulnerable) {
    return (
      <div style={styles.guardBox}>
        <div style={styles.icon}>🔒</div>
        <h4 style={styles.title}>Secure Mode Active</h4>
        <p style={styles.message}><strong>{action}</strong> requires vulnerable mode to demonstrate the attack.</p>
        <button onClick={() => setDismissed(true)} style={styles.proceedBtn}>Proceed Anyway (will be blocked)</button>
      </div>
    );
  }

  if (requireMode === 'secure' && isVulnerable) {
    return (
      <div style={styles.guardBoxVuln}>
        <div style={styles.icon}>⚠️</div>
        <h4 style={styles.titleVuln}>Vulnerable Mode Active</h4>
        <p style={styles.message}><strong>{action}</strong> is designed for secure mode.</p>
        <button onClick={() => setDismissed(true)} style={styles.proceedBtnVuln}>Proceed Anyway</button>
      </div>
    );
  }

  return children;
}

const styles = {
  guardBox:       { background: '#0d2137', border: '2px solid #27ae60', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '16px' },
  guardBoxVuln:   { background: '#1a0a00', border: '2px solid #e67e22', borderRadius: '8px', padding: '20px', textAlign: 'center', marginBottom: '16px' },
  icon:           { fontSize: '32px', marginBottom: '8px' },
  title:          { color: '#27ae60', margin: '0 0 8px 0' },
  titleVuln:      { color: '#e67e22', margin: '0 0 8px 0' },
  message:        { color: '#ccc', lineHeight: 1.6, marginBottom: '16px' },
  proceedBtn:     { padding: '8px 16px', background: '#2c3e50', color: '#e0e0e0', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' },
  proceedBtnVuln: { padding: '8px 16px', background: '#7f3b00', color: '#e0e0e0', border: '1px solid #e67e22', borderRadius: '4px', cursor: 'pointer' },
  overrideBanner: { background: '#3d2000', color: '#f39c12', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', marginBottom: '8px' },
};