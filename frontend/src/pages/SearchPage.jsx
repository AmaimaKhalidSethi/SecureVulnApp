import { useState } from 'react';
import API from '../api/axiosConfig';
import useSecurityMode from '../hooks/useSecurityMode';

export default function SearchPage() {
  const { mode, isVulnerable } = useSecurityMode();
  const [query,   setQuery]   = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/comments/search?q=${encodeURIComponent(query)}`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🔍 Reflected XSS Demo</h1>
        <div style={isVulnerable ? styles.vulnBanner : styles.secureBanner}>
          {isVulnerable ? '⚠️ VULNERABLE — search query echoed as raw HTML' : '🔒 SECURE — query HTML-encoded before reflection'}
        </div>
        <div style={styles.searchBox}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Try: <img src=x onerror="alert(1)">' style={styles.input} />
          <button onClick={search} disabled={loading} style={styles.btn}>
            {loading ? '⏳' : '🔍 Search'}
          </button>
        </div>
        <div style={styles.quickBtns}>
          {['<script>alert("XSS")</script>', '<img src=x onerror="alert(1)">', 'normal search'].map(p => (
            <button key={p} onClick={() => setQuery(p)} style={styles.quickBtn}>{p.substring(0, 30)}</button>
          ))}
        </div>
        {result && (
          <div style={styles.result}>
            <p style={{ color: '#888', fontSize: '13px' }}>You searched for:</p>
            {isVulnerable
              ? <div dangerouslySetInnerHTML={{ __html: result.searchedFor }} style={{ color: '#e0e0e0' }} />
              : <p style={{ color: '#e0e0e0' }}>{result.searchedFor}</p>}
            <p style={{ color: '#aaa', fontSize: '13px', marginTop: '8px' }}>{result.count} result(s) found</p>
          </div>
        )}
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
  searchBox:    { display: 'flex', gap: '8px', marginBottom: '12px' },
  input:        { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#0a0a1a', color: '#e0e0e0' },
  btn:          { padding: '10px 20px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  quickBtns:    { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  quickBtn:     { padding: '4px 10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  result:       { background: '#16213e', padding: '16px', borderRadius: '8px', border: '1px solid #0f3460' },
};