import SecurityDashboard from '../components/SecurityDashboard';
import useSecurityMode   from '../hooks/useSecurityMode';

export default function SecurityStatusPage() {
  const { isVulnerable, mode } = useSecurityMode();
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ color: '#e0e0e0', borderBottom: '2px solid #0f3460', paddingBottom: '10px' }}>
          🛡️ Security Status Dashboard
        </h1>
        <p style={{ color: '#aaa' }}>
          Current mode: <strong style={{ color: isVulnerable ? '#e74c3c' : '#2ecc71' }}>{mode.toUpperCase()}</strong>
        </p>
        <SecurityDashboard />
      </div>
    </div>
  );
}