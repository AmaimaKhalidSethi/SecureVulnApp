import { useState } from 'react';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import useSecurityMode from '../hooks/useSecurityMode';

export default function CommentsPage() {
  const { mode, isVulnerable } = useSecurityMode();
  const [refresh, setRefresh]  = useState(0);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>💬 Stored XSS Demo</h1>
        <div style={isVulnerable ? styles.vulnBanner : styles.secureBanner}>
          {isVulnerable
            ? '⚠️ VULNERABLE — XSS payloads stored raw and executed on render'
            : '🔒 SECURE — DOMPurify sanitizes input, text node rendering'}
        </div>
        <CommentForm onCommentAdded={() => setRefresh(r => r + 1)} mode={mode} />
        <CommentList mode={mode} refreshTrigger={refresh} />
      </div>
    </div>
  );
}

const styles = {
  page:         { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:    { maxWidth: '800px', margin: '0 auto' },
  title:        { color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' },
  vulnBanner:   { background: '#c0392b', color: 'white', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
  secureBanner: { background: '#27ae60', color: 'white', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' },
};