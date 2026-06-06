import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { label: 'Home', key: 'h', path: '/home', icon: '🏠' },
  { label: 'Stored XSS', key: 'x', path: '/xss', icon: '💬' },
  { label: 'Reflected XSS', key: 's', path: '/search', icon: '🔍' },
  { label: 'CSRF Attack', key: 'c', path: '/csrf', icon: '🎭' },
  { label: 'IDOR Demo', key: 'i', path: '/idor', icon: '🔓' },
  { label: 'Brute Force', key: 'b', path: '/brute', icon: '💀' },
  { label: 'HTTP Headers', key: 'e', path: '/headers', icon: '🔒' },
  { label: 'Attack Chain', key: 'a', path: '/chain', icon: '⚔️' },
  { label: 'Status', key: 't', path: '/status', icon: '🛡️' },
  { label: 'Logs', key: 'l', path: '/logs', icon: '📋' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K to open palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setSearch('');
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.key === search.toLowerCase()
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={styles.backdrop}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div style={styles.palette} role="dialog" aria-label="Command palette">
        <div style={styles.inputContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Type to search or press a shortcut key (h, x, s, c, i, b, e, a, t, l)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
            autoFocus
            aria-label="Search commands"
          />
          <span style={styles.hint}>ESC to close</span>
        </div>

        <div style={styles.results}>
          {filtered.length > 0 ? (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.path}
                onClick={() => handleSelect(cmd.path)}
                style={{
                  ...styles.resultItem,
                  background: idx === 0 ? '#3a3a5a' : 'transparent',
                }}
                aria-label={`Navigate to ${cmd.label}`}
              >
                <span style={styles.resultIcon}>{cmd.icon}</span>
                <div style={styles.resultText}>
                  <div style={styles.resultLabel}>{cmd.label}</div>
                  <div style={styles.resultKey}>Press {cmd.key}</div>
                </div>
              </button>
            ))
          ) : (
            <div style={styles.noResults}>No commands found</div>
          )}
        </div>

        <div style={styles.footer}>
          Use arrow keys to navigate • Enter to select • Esc to close
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },

  palette: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    background: '#0d0d1f',
    border: '1px solid #1a1a3a',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
  },

  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    borderBottom: '1px solid #1a1a3a',
    position: 'relative',
  },

  searchIcon: {
    fontSize: '18px',
    color: '#888',
    flexShrink: 0,
  },

  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },

  hint: {
    color: '#555',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },

  results: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '300px',
  },

  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    textAlign: 'left',
  },

  resultIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },

  resultText: {
    flex: 1,
    minWidth: 0,
  },

  resultLabel: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '2px',
  },

  resultKey: {
    color: '#888',
    fontSize: '12px',
  },

  noResults: {
    padding: '24px 16px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
  },

  footer: {
    padding: '10px 16px',
    borderTop: '1px solid #1a1a3a',
    color: '#555',
    fontSize: '11px',
    textAlign: 'center',
  },
};
