// pages/SecurityLogsPage.jsx
// ============================================================
// LIVE SECURITY LOG DASHBOARD
// Polls /api/logs every 5 seconds for real-time attack feed
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import API from '../api/axiosConfig';

const SEVERITY_STYLES = {
  CRITICAL: { background: '#3d0000', border: '#c0392b', badge: '#e74c3c', text: '💀 CRITICAL' },
  HIGH:     { background: '#2a0d00', border: '#e67e22', badge: '#e67e22', text: '🔴 HIGH'     },
  MEDIUM:   { background: '#2a2a00', border: '#f39c12', badge: '#f1c40f', text: '🟠 MEDIUM'   },
  LOW:      { background: '#002a0d', border: '#27ae60', badge: '#2ecc71', text: '🟡 LOW'      },
  INFO:     { background: '#001a2a', border: '#2980b9', badge: '#3498db', text: 'ℹ️  INFO'    },
};

export default function SecurityLogsPage() {
  const [logs,       setLogs]       = useState([]);
  const [stats,      setStats]      = useState(null);
  const [filter,     setFilter]     = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      const severityParam = filter !== 'ALL' ? `?severity=${filter}` : '';
      const [logsRes, statsRes] = await Promise.all([
        API.get(`/logs${severityParam}`),
        API.get('/logs/stats'),
      ]);
      setLogs(logsRes.data.logs   || []);
      setStats(statsRes.data.stats || null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial load
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const clearLogs = async () => {
    await API.delete('/logs');
    setLogs([]);
    setStats(null);
  };

  const filters = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🔍 Security Event Logs</h1>

        {/* Stats cards */}
        {stats && (
          <div style={styles.statsGrid}>
            <StatCard label="Total Events"   value={stats.total}   color="#3498db" />
            <StatCard label="Attacks"        value={stats.attacks} color="#e74c3c" />
            <StatCard label="Blocked"        value={stats.blocked} color="#27ae60" />
            <StatCard label="Allowed"        value={stats.allowed} color="#e67e22" />
          </div>
        )}

        {/* Event type breakdown */}
        {stats?.byEvent && Object.keys(stats.byEvent).length > 0 && (
          <div style={styles.eventBreakdown}>
            <h3 style={styles.sectionTitle}>Event Breakdown</h3>
            <div style={styles.eventGrid}>
              {Object.entries(stats.byEvent)
                .sort((a, b) => b[1] - a[1])
                .map(([event, count]) => (
                  <div key={event} style={styles.eventBadge}>
                    <span style={styles.eventName}>{event.replace(/_/g, ' ')}</span>
                    <span style={styles.eventCount}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.filterRow}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...styles.filterBtn,
                  background: filter === f ? '#2980b9' : '#16213e',
                  border:     filter === f
                    ? '1px solid #3498db'
                    : '1px solid #0f3460',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={styles.controlRight}>
            <span style={styles.timestamp}>
              {lastUpdate ? `Updated: ${lastUpdate.toLocaleTimeString()}` : ''}
            </span>
            <button
              onClick={() => setAutoRefresh(a => !a)}
              style={{
                ...styles.controlBtn,
                background: autoRefresh ? '#1a5c2a' : '#3d1a00',
              }}
            >
              {autoRefresh ? '⏸ Pause' : '▶ Resume'} Auto-refresh
            </button>
            <button onClick={fetchLogs}  style={styles.controlBtn}>↻ Refresh</button>
            <button onClick={clearLogs}  style={styles.dangerBtn}>🗑 Clear Logs</button>
          </div>
        </div>

        {/* Log entries */}
        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center' }}>Loading logs...</p>
        ) : logs.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: '#888' }}>No logs yet.</p>
            <p style={{ color: '#666', fontSize: '13px' }}>
              Trigger attacks on other pages and logs will appear here in real time.
            </p>
          </div>
        ) : (
          <div style={styles.logList}>
            {logs.map(log => {
              const sev = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.INFO;
              return (
                <div key={log.id} style={{
                  ...styles.logCard,
                  background:   sev.background,
                  borderLeft:   `4px solid ${sev.border}`,
                }}>
                  <div style={styles.logHeader}>
                    <div style={styles.logLeft}>
                      <span style={{ ...styles.severityBadge, background: sev.badge }}>
                        {sev.text}
                      </span>
                      <span style={styles.eventType}>
                        {log.event.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        ...styles.outcomeBadge,
                        background: log.outcome === 'BLOCKED'   ? '#1a4a1a' :
                                    log.outcome === 'ALLOWED'   ? '#4a1a1a' :
                                    log.outcome === 'SANITIZED' ? '#1a3a4a' : '#2a2a2a',
                        color:      log.outcome === 'BLOCKED'   ? '#2ecc71' :
                                    log.outcome === 'ALLOWED'   ? '#e74c3c' :
                                    log.outcome === 'SANITIZED' ? '#3498db' : '#aaa',
                      }}>
                        {log.outcome}
                      </span>
                    </div>
                    <span style={styles.timestamp2}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={styles.logDetails}>
                    {log.ip && (
                      <span style={styles.detail}>
                        <span style={styles.detailLabel}>IP:</span> {log.ip}
                      </span>
                    )}
                    {log.route && (
                      <span style={styles.detail}>
                        <span style={styles.detailLabel}>Route:</span> {log.route}
                      </span>
                    )}
                    {log.userId && log.userId !== 'unauthenticated' && (
                      <span style={styles.detail}>
                        <span style={styles.detailLabel}>User:</span>
                        {String(log.userId).substring(0, 12)}...
                      </span>
                    )}
                    {log.targetId && (
                      <span style={styles.detail}>
                        <span style={styles.detailLabel}>Target:</span>
                        {String(log.targetId).substring(0, 12)}...
                      </span>
                    )}
                    {log.email && (
                      <span style={styles.detail}>
                        <span style={styles.detailLabel}>Email:</span> {log.email}
                      </span>
                    )}
                    {log.reason && (
                      <span style={styles.detail}>
                        <span style={styles.detailLabel}>Reason:</span> {log.reason}
                      </span>
                    )}
                    {log.mode && (
                      <span style={{
                        ...styles.detail,
                        color: log.mode === 'vulnerable' ? '#e74c3c' : '#2ecc71',
                      }}>
                        <span style={styles.detailLabel}>Mode:</span> {log.mode}
                      </span>
                    )}
                  </div>

                  {/* Show payload for injection/XSS */}
                  {(log.payload || log.rawPayload) && (
                    <details style={styles.payloadDetails}>
                      <summary style={styles.payloadSummary}>
                        🔍 View payload
                      </summary>
                      <code style={styles.payloadCode}>
                        {log.payload || log.rawPayload}
                      </code>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...cardStyles.card, borderTop: `3px solid ${color}` }}>
      <div style={{ ...cardStyles.value, color }}>{value ?? 0}</div>
      <div style={cardStyles.label}>{label}</div>
    </div>
  );
}

const cardStyles = {
  card:  { background: '#16213e', borderRadius: '8px', padding: '16px', textAlign: 'center' },
  value: { fontSize: '32px', fontWeight: 'bold' },
  label: { color: '#888', fontSize: '13px', marginTop: '4px' },
};

const styles = {
  page:           { minHeight: '100vh', background: '#0a0a1a', padding: '20px' },
  container:      { maxWidth: '1100px', margin: '0 auto' },
  title:          { color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' },
  statsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' },
  eventBreakdown: { background: '#16213e', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
  sectionTitle:   { color: '#f39c12', marginTop: 0, fontSize: '14px' },
  eventGrid:      { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  eventBadge:     { background: '#0a0a2a', border: '1px solid #0f3460', borderRadius: '4px', padding: '4px 10px', display: 'flex', gap: '8px', alignItems: 'center' },
  eventName:      { color: '#aaa', fontSize: '12px' },
  eventCount:     { color: '#3498db', fontWeight: 'bold', fontSize: '14px' },
  controls:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' },
  filterRow:      { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filterBtn:      { padding: '6px 14px', color: '#e0e0e0', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  controlRight:   { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  controlBtn:     { padding: '6px 12px', background: '#16213e', border: '1px solid #0f3460', color: '#e0e0e0', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  dangerBtn:      { padding: '6px 12px', background: '#3d0000', border: '1px solid #c0392b', color: '#e74c3c', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  timestamp:      { color: '#888', fontSize: '12px' },
  emptyState:     { textAlign: 'center', padding: '40px', background: '#16213e', borderRadius: '8px' },
  logList:        { display: 'flex', flexDirection: 'column', gap: '8px' },
  logCard:        { borderRadius: '6px', padding: '12px', borderLeft: '4px solid transparent' },
  logHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' },
  logLeft:        { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  severityBadge:  { color: 'white', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' },
  eventType:      { color: '#e0e0e0', fontWeight: 'bold', fontSize: '13px' },
  outcomeBadge:   { padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' },
  timestamp2:     { color: '#888', fontSize: '12px', fontFamily: 'monospace' },
  logDetails:     { display: 'flex', flexWrap: 'wrap', gap: '12px' },
  detail:         { color: '#aaa', fontSize: '12px' },
  detailLabel:    { color: '#888', marginRight: '4px' },
  payloadDetails: { marginTop: '8px' },
  payloadSummary: { color: '#f39c12', cursor: 'pointer', fontSize: '12px' },
  payloadCode:    { display: 'block', background: '#0a0a0a', color: '#e74c3c', padding: '8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', marginTop: '6px', wordBreak: 'break-all' },
};