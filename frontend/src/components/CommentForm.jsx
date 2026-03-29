import { useState } from 'react';
import API from '../api/axiosConfig';

const QUICK_PAYLOADS = [
  { label: 'Script tag',  payload: '<script>alert("XSS")</script>' },
  { label: 'Img onerror', payload: '<img src=x onerror="alert(\'XSS\')">' },
  { label: 'SVG onload',  payload: '<svg onload="alert(\'XSS\')"></svg>' },
  { label: 'Normal text', payload: 'This is a normal safe comment.' },
];

export default function CommentForm({ onCommentAdded, mode }) {
  const [content,  setContent]  = useState('');
  const [author,   setAuthor]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      await API.post('/comments', { content, author: author || 'anonymous' });
      setMessage('✅ Comment posted');
      setContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.form}>
      <h3 style={styles.title}>Post a Comment</h3>
      <div style={styles.quickBtns}>
        {QUICK_PAYLOADS.map(p => (
          <button key={p.label} onClick={() => setContent(p.payload)} style={styles.quickBtn}>
            {p.label}
          </button>
        ))}
      </div>
      <input
        value={author}
        onChange={e => setAuthor(e.target.value)}
        placeholder="Author name (optional)"
        style={styles.input}
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Comment content — try an XSS payload above"
        rows={4}
        style={styles.textarea}
      />
      <button onClick={handleSubmit} disabled={loading} style={styles.submitBtn}>
        {loading ? '⏳ Posting...' : '📤 Post Comment'}
      </button>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  form:      { background: '#16213e', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  title:     { color: '#e0e0e0', marginTop: 0 },
  quickBtns: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
  quickBtn:  { padding: '4px 10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  input:     { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#0a0a1a', color: '#e0e0e0', marginBottom: '8px', boxSizing: 'border-box' },
  textarea:  { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#0a0a1a', color: '#e0e0e0', marginBottom: '8px', boxSizing: 'border-box', fontFamily: 'monospace' },
  submitBtn: { padding: '10px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  message:   { color: '#aaa', fontSize: '13px', marginTop: '8px' },
};