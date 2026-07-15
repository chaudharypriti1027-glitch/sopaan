import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  CircleCheck,
  CircleOff,
  FlaskConical,
  Gift,
  PlugZap,
  Save,
  ScrollText,
  Settings2,
  TriangleAlert,
} from 'lucide-react';
import { fetchAuditLogs, recordAuditTest } from '../api/admin';
import {
  fetchPlatformSettings,
  revokeWelcomeMonthForAll,
  updatePlatformSettings,
} from '../api/settings';
import { formatApiError } from '../api/errors';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { Pill } from '../components/Pill';
import { QueryErrorBanner } from '../components/QueryErrorBanner';
import { useToast } from '../components/Toast';
import './settings.css';

type SettingsForm = {
  freeAiQuota: string;
  freeAiQualityDoubtsPerDay: string;
  freeAiEvaluationsPerDay: string;
  freeAiTestsPerDay: string;
  freeMocksPerDay: string;
  proPriceMonthly: string;
  proPriceYearly: string;
  freeShowAds: boolean;
  welcomeMonthEnabled: boolean;
};

const defaultForm: SettingsForm = {
  freeAiQuota: '10',
  freeAiQualityDoubtsPerDay: '2',
  freeAiEvaluationsPerDay: '2',
  freeAiTestsPerDay: '2',
  freeMocksPerDay: '3',
  proPriceMonthly: '299',
  proPriceYearly: '2499',
  freeShowAds: true,
  welcomeMonthEnabled: true,
};

export function SettingsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(defaultForm);

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: fetchPlatformSettings,
  });

  const auditQuery = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => fetchAuditLogs(10),
  });

  useEffect(() => {
    const settings = settingsQuery.data?.settings;
    if (!settings) return;

    setForm({
      freeAiQuota: String(settings.freeAiQuota ?? defaultForm.freeAiQuota),
      freeAiQualityDoubtsPerDay: String(
        settings.freeAiQualityDoubtsPerDay ?? defaultForm.freeAiQualityDoubtsPerDay
      ),
      freeAiEvaluationsPerDay: String(
        settings.freeAiEvaluationsPerDay ?? defaultForm.freeAiEvaluationsPerDay
      ),
      freeAiTestsPerDay: String(settings.freeAiTestsPerDay ?? defaultForm.freeAiTestsPerDay),
      freeMocksPerDay: String(settings.freeMocksPerDay ?? defaultForm.freeMocksPerDay),
      proPriceMonthly: String(settings.proPriceMonthly ?? defaultForm.proPriceMonthly),
      proPriceYearly: String(settings.proPriceYearly ?? defaultForm.proPriceYearly),
      freeShowAds: settings.freeShowAds !== false,
      welcomeMonthEnabled: settings.welcomeMonthEnabled !== false,
    });
  }, [settingsQuery.data?.settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const freeAiQuota = Number(form.freeAiQuota);
      const freeAiQualityDoubtsPerDay = Number(form.freeAiQualityDoubtsPerDay);
      const freeAiEvaluationsPerDay = Number(form.freeAiEvaluationsPerDay);
      const freeAiTestsPerDay = Number(form.freeAiTestsPerDay);
      const freeMocksPerDay = Number(form.freeMocksPerDay);
      const proPriceMonthly = Number(form.proPriceMonthly);
      const proPriceYearly = Number(form.proPriceYearly);

      if (
        [
          freeAiQuota,
          freeAiQualityDoubtsPerDay,
          freeAiEvaluationsPerDay,
          freeAiTestsPerDay,
          freeMocksPerDay,
          proPriceMonthly,
          proPriceYearly,
        ].some((value) => Number.isNaN(value) || value < 0)
      ) {
        throw new Error('Enter valid non-negative numbers');
      }

      if (proPriceMonthly < 1 || proPriceYearly < 1) {
        throw new Error('Pro prices must be at least ₹1');
      }

      return updatePlatformSettings({
        freeAiQuota,
        freeAiQualityDoubtsPerDay,
        freeAiEvaluationsPerDay,
        freeAiTestsPerDay,
        freeMocksPerDay,
        proPriceMonthly,
        proPriceYearly,
        freeShowAds: form.freeShowAds,
        welcomeMonthEnabled: form.welcomeMonthEnabled,
      });
    },
    onSuccess: () => {
      showToast('Platform settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err: Error) => showToast(formatApiError(err)),
  });

  const revokeWelcomeMutation = useMutation({
    mutationFn: revokeWelcomeMonthForAll,
    onSuccess: (result) => {
      showToast(
        result?.message ||
          (typeof result?.revoked === 'number'
            ? `Cancelled free Pro for ${result.revoked} student(s)`
            : 'Welcome free-month trials cancelled')
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err: Error) => showToast(formatApiError(err)),
  });

  const testMutation = useMutation({
    mutationFn: recordAuditTest,
    onSuccess: () => {
      showToast('Test audit action recorded');
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (err: Error) => showToast(formatApiError(err)),
  });

  const integrations = settingsQuery.data?.integrations ?? {};
  const integrationEntries = Object.entries(integrations).filter(
    ([, status]) => status && typeof status === 'object'
  );
  const settingsBusy = saveMutation.isPending || settingsQuery.isLoading || settingsQuery.isError;

  const confirmRevokeWelcome = () => {
    const confirmed = window.confirm(
      'End free Pro for every student currently on the welcome / free-month trial?\n\n' +
        '• Paid monthly and yearly subscriptions are NOT cancelled\n' +
        '• Active free-trial entitlements end immediately\n' +
        '• Turn off “Welcome free month” separately to stop new grants'
    );
    if (!confirmed) return;
    revokeWelcomeMutation.mutate();
  };

  return (
    <div className="settings-page">
      {settingsQuery.isError ? (
        <QueryErrorBanner
          error={settingsQuery.error}
          onRetry={() => void settingsQuery.refetch()}
        />
      ) : null}

      <div className="panel">
        <h3 className="panel-title-icon">
          <Settings2 aria-hidden strokeWidth={1.8} />
          Platform settings
        </h3>
        <p className="page-sub">
          Pricing and free-tier limits apply immediately to checkout and AI quota enforcement.
        </p>
        <div className="settings-grid">
          <FormField id="proPriceMonthly" label="Pro price (monthly, ₹)">
            <input
              id="proPriceMonthly"
              type="number"
              min={1}
              value={form.proPriceMonthly}
              onChange={(e) => setForm((prev) => ({ ...prev, proPriceMonthly: e.target.value }))}
            />
          </FormField>
          <FormField id="proPriceYearly" label="Pro price (yearly, ₹)">
            <input
              id="proPriceYearly"
              type="number"
              min={1}
              value={form.proPriceYearly}
              onChange={(e) => setForm((prev) => ({ ...prev, proPriceYearly: e.target.value }))}
            />
          </FormField>
          <FormField id="freeAiQuota" label="Free AI doubts / day">
            <input
              id="freeAiQuota"
              type="number"
              min={0}
              value={form.freeAiQuota}
              onChange={(e) => setForm((prev) => ({ ...prev, freeAiQuota: e.target.value }))}
            />
          </FormField>
          <FormField id="freeAiTestsPerDay" label="Free AI tests / day">
            <input
              id="freeAiTestsPerDay"
              type="number"
              min={0}
              value={form.freeAiTestsPerDay}
              onChange={(e) => setForm((prev) => ({ ...prev, freeAiTestsPerDay: e.target.value }))}
            />
          </FormField>
          <FormField id="freeAiQualityDoubtsPerDay" label="Free image / fresh AI doubts / day">
            <input
              id="freeAiQualityDoubtsPerDay"
              type="number"
              min={0}
              value={form.freeAiQualityDoubtsPerDay}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, freeAiQualityDoubtsPerDay: e.target.value }))
              }
            />
          </FormField>
          <FormField id="freeAiEvaluationsPerDay" label="Free answer evaluations / day">
            <input
              id="freeAiEvaluationsPerDay"
              type="number"
              min={0}
              value={form.freeAiEvaluationsPerDay}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, freeAiEvaluationsPerDay: e.target.value }))
              }
            />
          </FormField>
          <FormField id="freeMocksPerDay" label="Free mocks / day">
            <input
              id="freeMocksPerDay"
              type="number"
              min={0}
              value={form.freeMocksPerDay}
              onChange={(e) => setForm((prev) => ({ ...prev, freeMocksPerDay: e.target.value }))}
            />
          </FormField>
          <label className="settings-check" htmlFor="freeShowAds">
            <input
              id="freeShowAds"
              type="checkbox"
              checked={form.freeShowAds}
              onChange={(e) => setForm((prev) => ({ ...prev, freeShowAds: e.target.checked }))}
            />
            Show ads on free tier
          </label>
        </div>
        <ActionButton variant="gold" onClick={() => saveMutation.mutate()} disabled={settingsBusy}>
          <Save aria-hidden strokeWidth={1.8} />
          {saveMutation.isPending ? 'Saving…' : 'Save platform settings'}
        </ActionButton>
      </div>

      <div className="panel">
        <h3 className="panel-title-icon">
          <Gift aria-hidden strokeWidth={1.8} />
          Welcome free month
        </h3>
        <p className="page-sub">
          New students can receive 1 month of Sopaan Pro free on signup. Disable the offer to stop
          future grants, or revoke all active free trials without touching paid plans.
        </p>
        <label className="settings-check settings-check-block" htmlFor="welcomeMonthEnabled">
          <input
            id="welcomeMonthEnabled"
            type="checkbox"
            checked={form.welcomeMonthEnabled}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, welcomeMonthEnabled: e.target.checked }))
            }
          />
          Offer 1 month free Pro to new students
        </label>
        <div className="settings-actions-row">
          <ActionButton
            variant="gold"
            onClick={() => saveMutation.mutate()}
            disabled={settingsBusy}
          >
            <Save aria-hidden strokeWidth={1.8} />
            {saveMutation.isPending ? 'Saving…' : 'Save welcome offer'}
          </ActionButton>
          <ActionButton
            variant="ghost"
            onClick={confirmRevokeWelcome}
            disabled={revokeWelcomeMutation.isPending || settingsQuery.isError}
          >
            <TriangleAlert aria-hidden strokeWidth={1.8} />
            {revokeWelcomeMutation.isPending ? 'Cancelling…' : 'Cancel free subscription for all'}
          </ActionButton>
        </div>
        <p className="page-sub settings-danger-hint">
          Bulk cancel ends welcome/trial Pro only. Monthly and yearly Razorpay subscriptions stay
          active.
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title-icon">
          <PlugZap aria-hidden strokeWidth={1.8} />
          Integrations
        </h3>
        <p className="page-sub">API keys are configured via server environment variables only.</p>
        <div className="settings-integrations">
          {integrationEntries.length === 0 ? (
            <p className="page-sub">No integration status available.</p>
          ) : (
            integrationEntries.map(([name, status]) => (
              <div className="settings-integration" key={name}>
                <div className="settings-integration-copy">
                  <span className={`integration-icon ${status.configured ? 'is-ready' : ''}`}>
                    {status.configured ? (
                      <CircleCheck aria-hidden strokeWidth={1.8} />
                    ) : (
                      <CircleOff aria-hidden strokeWidth={1.8} />
                    )}
                  </span>
                  <div>
                    <b>{name}</b>
                    <div className="page-sub">
                      {status.configured ? 'Configured' : 'Not configured'} · env only
                    </div>
                  </div>
                </div>
                <span className={`pill ${status.configured ? 'p-pub' : 'p-draft'}`}>
                  {status.keyIdMasked ?? status.masked ?? (status.configured ? 'set' : 'missing')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title-icon">
          <FlaskConical aria-hidden strokeWidth={1.8} />
          Audit controls
        </h3>
        <p className="page-sub" style={{ marginBottom: 12 }}>
          Every admin mutation is recorded server-side.
        </p>
        <ActionButton
          variant="gold"
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
        >
          <FlaskConical aria-hidden strokeWidth={1.8} />
          Record test audit action
        </ActionButton>
      </div>

      <div className="panel">
        <h3 className="panel-title-icon">
          <ScrollText aria-hidden strokeWidth={1.8} />
          Recent audit entries
        </h3>
        <DataTable
          rows={auditQuery.data?.items ?? []}
          emptyMessage="No audit entries yet"
          isLoading={auditQuery.isLoading}
          error={auditQuery.isError ? auditQuery.error : undefined}
          onRetry={() => void auditQuery.refetch()}
          columns={[
            {
              key: 'at',
              header: 'When',
              render: (row) => new Date(row.at).toLocaleString(),
            },
            {
              key: 'action',
              header: 'Action',
              render: (row) => <Pill tone="navy">{row.action}</Pill>,
            },
            { key: 'resource', header: 'Resource', render: (row) => row.resource },
            {
              key: 'actor',
              header: 'Actor',
              render: (row) => row.actor?.name ?? '—',
            },
          ]}
        />
      </div>
    </div>
  );
}
