import { useToast } from '../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            ...styles[`toast_${toast.type}`],
          }}
        >
          <div style={styles.toastContent}>
            {toast.type === 'success' && <span>✅ </span>}
            {toast.type === 'error' && <span>❌ </span>}
            {toast.type === 'warning' && <span>⚠️ </span>}
            {toast.type === 'info' && <span>ℹ️ </span>}
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={styles.closeBtn}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 9999,
    maxWidth: '400px',
  },

  toast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease-out',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },

  toast_success: {
    background: '#10b981',
    color: 'white',
    border: '1px solid #059669',
  },

  toast_error: {
    background: '#ef4444',
    color: 'white',
    border: '1px solid #dc2626',
  },

  toast_warning: {
    background: '#f59e0b',
    color: 'white',
    border: '1px solid #d97706',
  },

  toast_info: {
    background: '#3b82f6',
    color: 'white',
    border: '1px solid #2563eb',
  },

  toastContent: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },

  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '16px',
    marginLeft: '10px',
    padding: '0',
    transition: 'opacity 0.2s ease',
  },
};

// Add global styles for animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}
