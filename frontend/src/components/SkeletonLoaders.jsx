export function SkeletonCard({ count = 3, height = 120 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={styles.skeletonCard}>
          <div style={{ ...styles.skeletonLine, marginBottom: '12px', width: '80%' }} />
          <div style={{ ...styles.skeletonLine, marginBottom: '12px', height: '14px' }} />
          <div style={{ ...styles.skeletonLine, width: '60%', height: '14px' }} />
        </div>
      ))}
    </>
  );
}

export function SkeletonCommentList() {
  return (
    <div style={styles.commentList}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={styles.skeletonComment}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ ...styles.skeletonAvatar }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...styles.skeletonLine, width: '30%', marginBottom: '6px' }} />
              <div style={{ ...styles.skeletonLine, width: '50%', height: '12px' }} />
            </div>
          </div>
          <div style={{ ...styles.skeletonLine, marginBottom: '8px', height: '14px' }} />
          <div style={{ ...styles.skeletonLine, height: '14px' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div style={styles.table}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={styles.tableRow}>
          <div style={{ ...styles.skeletonLine, width: '20%' }} />
          <div style={{ ...styles.skeletonLine, width: '30%' }} />
          <div style={{ ...styles.skeletonLine, width: '25%' }} />
          <div style={{ ...styles.skeletonLine, width: '15%' }} />
        </div>
      ))}
    </div>
  );
}

const styles = {
  skeletonCard: {
    background: '#16213e',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #0f3460',
  },

  skeletonLine: {
    height: '16px',
    background: 'linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 50%, #2a2a4a 100%)',
    borderRadius: '4px',
    backgroundSize: '200% 100%',
    animation: 'loading 1.5s infinite',
  },

  skeletonAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 50%, #2a2a4a 100%)',
    backgroundSize: '200% 100%',
    animation: 'loading 1.5s infinite',
    flexShrink: 0,
  },

  commentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  skeletonComment: {
    background: '#16213e',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #0f3460',
  },

  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  tableRow: {
    display: 'flex',
    gap: '16px',
    padding: '12px',
    background: '#16213e',
    borderRadius: '6px',
    border: '1px solid #0f3460',
  },
};

// Add global animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;
  document.head.appendChild(style);
}
