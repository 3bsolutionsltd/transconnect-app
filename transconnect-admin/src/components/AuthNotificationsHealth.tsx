import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { AuthNotificationsHealthResponse, AuthNotificationsTestResponse, systemHealthApi } from '../lib/api';

const StatusPill: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
      ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
    }`}
  >
    {ok ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
    {label}
  </span>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow border">
    <div className="px-5 py-4 border-b border-gray-200">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const toBool = (value: any): boolean => Boolean(value);

type RiskSeverity = 'critical' | 'warning' | 'info';

const getRiskMeta = (risk: string): { severity: RiskSeverity; actions: string[] } => {
  const lower = risk.toLowerCase();

  if (lower.includes('in-memory') || lower.includes('will fail') || lower.includes('will not be delivered')) {
    return {
      severity: 'critical',
      actions: [
        'Escalate immediately and fix before release.',
        'Verify configuration on staging and production after applying fix.',
      ],
    };
  }

  if (lower.includes('admin notification email target')) {
    return {
      severity: 'warning',
      actions: [
        'Set ADMIN_NOTIFICATION_EMAIL or SUPPORT_EMAIL in backend environment.',
        'Send a test email from this page to confirm delivery.',
      ],
    };
  }

  if (lower.includes('demo_mode') || lower.includes('non-production')) {
    return {
      severity: 'info',
      actions: [
        'For production validation, disable demo mode.',
        'Repeat OTP delivery tests in production-like env.',
      ],
    };
  }

  return {
    severity: 'warning',
    actions: ['Review this risk and add a remediation owner/date.'],
  };
};

const severityStyles: Record<RiskSeverity, string> = {
  critical: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const severityBadge: Record<RiskSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

const AuthNotificationsHealth: React.FC = () => {
  const [data, setData] = useState<AuthNotificationsHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState<'email' | 'sms' | 'both' | null>(null);
  const [testResult, setTestResult] = useState<AuthNotificationsTestResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await systemHealthApi.getAuthNotificationsHealth();
      setData(response);
      if (!testEmail && response.notifications.adminWorkflow.adminEmailTarget) {
        setTestEmail(response.notifications.adminWorkflow.adminEmailTarget);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load system health status.');
    } finally {
      setLoading(false);
    }
  }, [testEmail]);

  const runTest = async (channel: 'email' | 'sms' | 'both') => {
    setTestLoading(channel);
    setTestError(null);
    setTestResult(null);
    try {
      const response = await systemHealthApi.sendAuthNotificationTest({
        channel,
        email: testEmail || undefined,
        phoneNumber: testPhone || undefined,
      });
      setTestResult(response);
    } catch (err: any) {
      setTestError(err?.message || 'Failed to send test notification.');
    } finally {
      setTestLoading(null);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const readyScore = data
    ? [
        toBool(data.auth.emailSignup.smtpConfigured),
        toBool(data.auth.phoneOtpSignupLogin.providerReady),
        toBool(data.notifications.channels.push.configured),
        toBool(data.notifications.adminWorkflow.adminEmailConfigured),
      ].filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Auth and Notifications Health</h1>
          <p className="text-gray-600">Operational readiness for signup, OTP, and notification channels.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border p-6 text-gray-600">Loading health status...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <div className="font-semibold mb-1">Unable to fetch health status</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SectionCard title="Environment">
              <p className="text-sm text-gray-700">{data.environment}</p>
              <p className="text-xs text-gray-500 mt-2">Updated: {new Date(data.timestamp).toLocaleString()}</p>
            </SectionCard>
            <SectionCard title="Readiness Score">
              <p className="text-3xl font-bold text-gray-900">{readyScore}/4</p>
              <p className="text-xs text-gray-500 mt-2">SMTP, SMS OTP, Push, Admin Email</p>
            </SectionCard>
            <SectionCard title="Email OTP">
              <StatusPill ok={data.auth.emailSignup.emailOtpConfigured} label={data.auth.emailSignup.emailOtpConfigured ? 'Ready' : 'Not Ready'} />
              <p className="text-xs text-gray-500 mt-2">{data.auth.emailSignup.verifyEndpoint}</p>
            </SectionCard>
            <SectionCard title="Phone OTP">
              <StatusPill ok={data.auth.phoneOtpSignupLogin.providerReady} label={data.auth.phoneOtpSignupLogin.providerReady ? 'Ready' : 'Not Ready'} />
              <p className="text-xs text-gray-500 mt-2">Expiry: {data.auth.phoneOtpSignupLogin.otpExpirySeconds}s</p>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Auth Channels">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Email / SMTP</span>
                  <StatusPill ok={data.auth.emailSignup.smtpConfigured} label={data.auth.emailSignup.smtpConfigured ? 'Configured' : 'Missing Config'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Phone OTP Delivery</span>
                  <StatusPill ok={data.auth.phoneOtpSignupLogin.providerReady} label={data.auth.phoneOtpSignupLogin.providerReady ? 'Configured' : 'Missing Provider'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">OTP Store Safety</span>
                  <StatusPill ok={data.auth.phoneOtpSignupLogin.otpStore.productionSafe} label={data.auth.phoneOtpSignupLogin.otpStore.productionSafe ? 'Production Safe' : 'In-Memory'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Demo Mode</span>
                  <StatusPill ok={!data.auth.phoneOtpSignupLogin.demoMode} label={data.auth.phoneOtpSignupLogin.demoMode ? 'Enabled' : 'Disabled'} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Notification Channels">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Email</span>
                  <StatusPill ok={data.notifications.channels.email.configured} label={data.notifications.channels.email.configured ? 'Ready' : 'Not Ready'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">SMS</span>
                  <StatusPill ok={data.notifications.channels.sms.configured} label={data.notifications.channels.sms.configured ? 'Ready' : 'Not Ready'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Push</span>
                  <StatusPill ok={data.notifications.channels.push.configured} label={data.notifications.channels.push.configured ? 'Ready' : 'Not Ready'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Admin Workflow Email</span>
                  <StatusPill
                    ok={data.notifications.adminWorkflow.adminEmailConfigured}
                    label={data.notifications.adminWorkflow.adminEmailConfigured ? 'Configured' : 'Missing Target'}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Live Delivery Test">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Send test notifications as admin to validate real channel delivery from the backend.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Test Email (optional)</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Test Phone (optional)</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+256700123456"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runTest('email')}
                  disabled={testLoading !== null}
                  className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {testLoading === 'email' ? 'Sending...' : 'Test Email'}
                </button>
                <button
                  onClick={() => runTest('sms')}
                  disabled={testLoading !== null}
                  className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {testLoading === 'sms' ? 'Sending...' : 'Test SMS'}
                </button>
                <button
                  onClick={() => runTest('both')}
                  disabled={testLoading !== null}
                  className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {testLoading === 'both' ? 'Sending...' : 'Test Both'}
                </button>
              </div>

              {testError && (
                <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{testError}</div>
              )}

              {testResult && (
                <div className={`rounded-md border p-3 text-sm ${testResult.success ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                  <div className="font-semibold mb-1">{testResult.message}</div>
                  <div className="text-xs mb-2">{new Date(testResult.timestamp).toLocaleString()}</div>
                  {testResult.results.email && (
                    <div className="mb-1">
                      Email: {testResult.results.email.success ? 'Success' : 'Failed'}
                      {testResult.results.email.target ? ` (${testResult.results.email.target})` : ''}
                      {testResult.results.email.error ? ` - ${testResult.results.email.error}` : ''}
                    </div>
                  )}
                  {testResult.results.sms && (
                    <div>
                      SMS: {testResult.results.sms.success ? 'Success' : 'Failed'}
                      {testResult.results.sms.target ? ` (${testResult.results.sms.target})` : ''}
                      {testResult.results.sms.provider ? ` via ${testResult.results.sms.provider}` : ''}
                      {testResult.results.sms.error ? ` - ${testResult.results.sms.error}` : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Risk Flags">
            {data.risks.length === 0 ? (
              <div className="flex items-center text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                <ShieldCheck className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">No immediate risks were reported.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {data.risks.map((risk, index) => (
                  <div key={index} className={`border rounded-md p-3 ${severityStyles[getRiskMeta(risk).severity]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{risk}</span>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-white/70">
                        {severityBadge[getRiskMeta(risk).severity]}
                      </span>
                    </div>
                    <div className="mt-2 text-xs">
                      <div className="font-semibold mb-1">Action checklist</div>
                      {getRiskMeta(risk).actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start mb-1">
                          <span className="mr-1.5">•</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Implementation Note">
            <div className="flex items-start text-gray-700">
              <ShieldAlert className="h-5 w-5 mr-2 mt-0.5 text-blue-600" />
              <p className="text-sm">{data.notifications.adminWorkflow.note}</p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default AuthNotificationsHealth;
