import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchAuditLogs, recordAuditTest } from '../api/admin';
import { fetchPlatformSettings, updatePlatformSettings } from '../api/settings';
import { formatApiError } from '../api/errors';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { Pill } from '../components/Pill';
import { useToast } from '../components/Toast';
import { PagePlaceholder } from '../components/PagePlaceholder';
import './settings.css';

type SettingsForm = {
  freeAiQuota: string;
  freeAiTestsPerDay: string;
  freeMocksPerDay: string;
  proPriceMonthly: string;
  proPriceYearly: string;
  freeShowAds: boolean;
};

const defaultForm: SettingsForm = {
  freeAiQuota: '10',
  freeAiTestsPerDay: '2',
  freeMocksPerDay: '3',
  proPriceMonthly: '299',
  proPriceYearly: '2499',
  freeShowAds: true,
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
      freeAiQuota: String(settings.freeAiQuota),
      freeAiTestsPerDay: String(settings.freeAiTestsPerDay),
      freeMocksPerDay: String(settings.freeMocksPerDay),
      proPriceMonthly: String(settings.proPriceMonthly),
      proPriceYearly: String(settings.proPriceYearly),
      freeShowAds: settings.freeShowAds,
    });
  }, [settingsQuery.data?.settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const freeAiQuota = Number(form.freeAiQuota);
      const freeAiTestsPerDay = Number(form.freeAiTestsPerDay);
      const freeMocksPerDay = Number(form.freeMocksPerDay);
      const proPriceMonthly = Number(form.proPriceMonthly);
      const proPriceYearly = Number(form.proPriceYearly);

      if ([freeAiQuota, freeAiTestsPerDay, freeMocksPerDay, proPriceMonthly, proPriceYearly].some(
        (value) => Number.isNaN(value) || value < 0,
      )) {
        throw new Error('Enter valid non-negative numbers');
      }

      if (proPriceMonthly < 1 || proPriceYearly < 1) {
        throw new Error('Pro prices must be at least ₹1');
      }

      return updatePlatformSettings({
        freeAiQuota,
        freeAiTestsPerDay,
        freeMocksPerDay,
        proPriceMonthly,
        proPriceYearly,
        freeShowAds: form.freeShowAds,
      });
    },
    onSuccess: () => {
      showToast('Platform settings saved');
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

  return (
    <PagePlaceholder title="Settings">
      <div className="panel">
        <h3>Platform settings</h3>
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
        <ActionButton
          variant="gold"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || settingsQuery.isLoading}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save platform settings'}
        </ActionButton>
      </div>

      <div className="panel">
        <h3>Integrations</h3>
        <p className="page-sub">API keys are configured via server environment variables only.</p>
        <div className="settings-integrations">
          {Object.entries(integrations).map(([name, status]) => (
            <div className="settings-integration" key={name}>
              <div>
                <b>{name}</b>
                <div className="page-sub">
                  {status.configured ? 'Configured' : 'Not configured'} · env only
                </div>
              </div>
              <span className={`pill ${status.configured ? 'p-pub' : 'p-draft'}`}>
                {status.keyIdMasked ?? status.masked ?? (status.configured ? 'set' : 'missing')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Audit log</h3>
        <p className="page-sub" style={{ marginBottom: 12 }}>
          Every admin mutation is recorded server-side.
        </p>
        <ActionButton
          variant="gold"
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
        >
          Record test audit action
        </ActionButton>
      </div>

      <div className="panel">
        <h3>Recent audit entries</h3>
        <DataTable
          rows={auditQuery.data?.items ?? []}
          emptyMessage={auditQuery.isLoading ? 'Loading…' : 'No audit entries yet'}
          columns={[
            {
              key: 'at',
              header: 'When',
              render: (row) => new Date(row.at).toLocaleString(),
            },
            { key: 'action', header: 'Action', render: (row) => <Pill tone="navy">{row.action}</Pill> },
            { key: 'resource', header: 'Resource', render: (row) => row.resource },
            {
              key: 'actor',
              header: 'Actor',
              render: (row) => row.actor?.name ?? '—',
            },
          ]}
        />
      </div>
    </PagePlaceholder>
  );
}
