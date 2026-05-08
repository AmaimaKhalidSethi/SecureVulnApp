// FIX (INFO): App.test.js previously checked for a "learn react link" — a
// Create React App placeholder that doesn't exist. All tests failed immediately.
// Replaced with meaningful tests that cover real application behaviour.

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter }            from 'react-router-dom';
import { SecurityContext }         from './context/SecurityContext';
import useSecurityMode             from './hooks/useSecurityMode';
import SecurityBanner              from './components/SecurityBanner';

// ── Helper: wrap component with a mock SecurityContext value ──
const renderWithSecurity = (ui, contextValue) => {
  return render(
    <SecurityContext.Provider value={contextValue}>
      <MemoryRouter>{ui}</MemoryRouter>
    </SecurityContext.Provider>
  );
};

const mockVulnerableCtx = {
  mode:         'vulnerable',
  config:       { auth: { hashPasswords: false, enforceJwt: false }, rateLimit: { enabled: false }, input: { sanitizeInputs: false, mongoSanitize: false }, headers: { useHelmet: false }, errors: { verbose: true }, data: { enforceOwnership: false } },
  isVulnerable: true,
  isSecure:     false,
  loading:      false,
  lastChecked:  new Date(),
  error:        null,
  refresh:      jest.fn(),
};

const mockSecureCtx = {
  ...mockVulnerableCtx,
  mode:         'secure',
  isVulnerable: false,
  isSecure:     true,
  config:       { auth: { hashPasswords: true, enforceJwt: true }, rateLimit: { enabled: true }, input: { sanitizeInputs: true, mongoSanitize: true }, headers: { useHelmet: true }, errors: { verbose: false }, data: { enforceOwnership: true } },
};

// ── 1. SecurityBanner shows correct label per mode ────────────
describe('SecurityBanner', () => {
  test('shows VULNERABLE badge in vulnerable mode', () => {
    renderWithSecurity(<SecurityBanner />, mockVulnerableCtx);
    expect(screen.getByText(/VULNERABLE/i)).toBeInTheDocument();
  });

  test('shows SECURE badge in secure mode', () => {
    renderWithSecurity(<SecurityBanner />, mockSecureCtx);
    expect(screen.getByText(/SECURE/i)).toBeInTheDocument();
  });

  test('renders nothing while loading', () => {
    renderWithSecurity(<SecurityBanner />, { ...mockVulnerableCtx, loading: true });
    expect(screen.queryByText(/VULNERABLE|SECURE/i)).not.toBeInTheDocument();
  });

  test('shows backend offline message on error', () => {
    renderWithSecurity(<SecurityBanner />, { ...mockVulnerableCtx, loading: false, error: 'Cannot reach backend' });
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});

// ── 2. useSecurityMode hook derives correct booleans ──────────
function ModeConsumer() {
  const { isVulnerable, isSecure, mode } = useSecurityMode();
  return <div data-testid="out">{mode},{String(isVulnerable)},{String(isSecure)}</div>;
}

describe('useSecurityMode', () => {
  test('returns correct values for vulnerable mode', () => {
    renderWithSecurity(<ModeConsumer />, mockVulnerableCtx);
    expect(screen.getByTestId('out').textContent).toBe('vulnerable,true,false');
  });

  test('returns correct values for secure mode', () => {
    renderWithSecurity(<ModeConsumer />, mockSecureCtx);
    expect(screen.getByTestId('out').textContent).toBe('secure,false,true');
  });
});

// ── 3. SecurityContext default values are sane ────────────────
import { SecurityContext as DefaultCtx } from './context/SecurityContext';

test('SecurityContext default value has expected shape', () => {
  const defaults = DefaultCtx._currentValue;
  expect(defaults).toHaveProperty('mode');
  expect(defaults).toHaveProperty('isVulnerable');
  expect(defaults).toHaveProperty('isSecure');
  expect(defaults).toHaveProperty('loading');
  expect(typeof defaults.refresh).toBe('function');
});