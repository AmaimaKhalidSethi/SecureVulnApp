import { useEffect, useState } from 'react';
import API from '../api/axiosConfig';
import { SkeletonCommentList } from './SkeletonLoaders';

export default function CommentList({ mode, refreshTrigger }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/comments');
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [refreshTrigger]);

  if (loading)            return <SkeletonCommentList />;
  if (comments.length === 0) return <p style={{ color: '#aaa' }}>No comments yet. Be the first to comment!</p>;

  return (
    <div>
      <h3 style={{ color: '#e0e0e0' }}>Comments ({comments.length})</h3>
      {comments.map(comment => (
        <div key={comment._id} style={styles.card}>
          <div style={styles.header}>
            <span style={styles.author}>{comment.author}</span>
            <span style={styles.meta}>
              {new Date(comment.createdAt).toLocaleString()} |{' '}
              <span style={comment.storedInMode === 'vulnerable' ? styles.vulnBadge : styles.secureBadge}>
                stored in {comment.storedInMode} mode
              </span>
            </span>
          </div>

          {mode === 'vulnerable' ? (
            <div>
              <div style={styles.content} dangerouslySetInnerHTML={{ __html: comment.content }} />
              <p style={styles.vulnNote}>⚠️ Rendered with dangerouslySetInnerHTML — scripts execute</p>
            </div>
          ) : (
            <div>
              <p style={styles.content}>{comment.content}</p>
              <p style={styles.secureNote}>🔒 Rendered as text node — scripts cannot execute</p>
            </div>
          )}

          {comment.rawContent !== comment.sanitizedContent && (
            <details style={styles.details}>
              <summary style={styles.summary}>🔍 View raw vs sanitized</summary>
              <div style={styles.comparison}>
                <div>
                  <strong style={{ color: '#e74c3c' }}>Raw:</strong>
                  <code style={styles.code}>{comment.rawContent}</code>
                </div>
                <div>
                  <strong style={{ color: '#2ecc71' }}>Sanitized:</strong>
                  <code style={styles.code}>{comment.sanitizedContent}</code>
                </div>
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  card:        { background: '#16213e', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #0f3460' },
  header:      { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' },
  author:      { color: '#3498db', fontWeight: 'bold' },
  meta:        { color: '#888', fontSize: '12px' },
  vulnBadge:   { color: '#e74c3c' },
  secureBadge: { color: '#2ecc71' },
  content:     { color: '#e0e0e0', margin: '8px 0' },
  vulnNote:    { color: '#e74c3c', fontSize: '12px', fontStyle: 'italic' },
  secureNote:  { color: '#2ecc71', fontSize: '12px', fontStyle: 'italic' },
  details:     { marginTop: '10px' },
  summary:     { color: '#f39c12', cursor: 'pointer', fontSize: '13px' },
  comparison:  { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '8px', background: '#0a0a1a', borderRadius: '4px' },
  code:        { display: 'block', color: '#e0e0e0', fontFamily: 'monospace', fontSize: '12px', marginTop: '4px', wordBreak: 'break-all' },
};