import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  createAdminBanner,
  deleteAdminBanner,
  listAdminBanners,
  setAdminBannerActive,
  updateAdminBanner,
  type AdminBanner,
  type BannerLinkType,
} from '../api/banners';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { useToast } from '../components/Toast';
import './banners.css';

const LINK_OPTIONS: { value: BannerLinkType; label: string; hint?: string }[] = [
  { value: 'premium', label: 'Premium / Pro' },
  { value: 'test_series', label: 'Test series' },
  { value: 'current_affairs', label: 'Current affairs' },
  { value: 'live_classes', label: 'Live classes' },
  { value: 'readiness', label: 'Exam readiness' },
  { value: 'quiz', label: 'Specific test', hint: 'Test ID' },
  { value: 'deeplink', label: 'Custom deeplink', hint: '/stack/Premium' },
];

const defaultForm = {
  message: '',
  linkType: 'premium' as BannerLinkType,
  linkRef: '',
};

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function linkSummary(row: AdminBanner) {
  const option = LINK_OPTIONS.find((item) => item.value === row.linkType);
  if (row.linkType === 'quiz' || row.linkType === 'deeplink') {
    return `${option?.label ?? row.linkType}: ${row.linkRef ?? '—'}`;
  }
  return option?.label ?? row.linkType;
}

export function AnnouncementsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const bannersQuery = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => listAdminBanners(),
  });

  const selectedLink = LINK_OPTIONS.find((item) => item.value === form.linkType);
  const needsRef = form.linkType === 'quiz' || form.linkType === 'deeplink';

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        message: form.message.trim(),
        linkType: form.linkType,
        linkRef: needsRef ? form.linkRef.trim() : undefined,
      };

      if (editingId) {
        return updateAdminBanner(editingId, body);
      }

      return createAdminBanner(body);
    },
    onSuccess: () => {
      showToast(editingId ? 'Banner updated' : 'Banner saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setForm(defaultForm);
      setEditingId(null);
    },
    onError: (err: Error) => showToast(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setAdminBannerActive(id, active),
    onSuccess: (_row, vars) => {
      showToast(vars.active ? 'Banner published on Home' : 'Banner hidden');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminBanner(id),
    onSuccess: () => {
      showToast('Banner deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      if (editingId) {
        setEditingId(null);
        setForm(defaultForm);
      }
    },
    onError: (err: Error) => showToast(err.message),
  });

  const previewHint = useMemo(() => {
    if (form.linkType === 'premium') return 'Tap to view offer';
    if (form.linkType === 'quiz') return 'Tap to start test';
    return 'Tap to open';
  }, [form.linkType]);

  function startEdit(row: AdminBanner) {
    setEditingId(row.id);
    setForm({
      message: row.message,
      linkType: row.linkType,
      linkRef: row.linkRef ?? '',
    });
  }

  function handleSave() {
    if (!form.message.trim()) {
      showToast('Message is required');
      return;
    }

    if (needsRef && !form.linkRef.trim()) {
      showToast(selectedLink?.hint ? `${selectedLink.hint} is required` : 'Link reference is required');
      return;
    }

    saveMutation.mutate();
  }

  return (
    <div className="banners-page">
      <div className="banners-grid">
        <div className="panel">
          <div className="ph">
            <h3>{editingId ? 'Edit banner' : 'Banner builder'}</h3>
          </div>
          <div className="drawer-form" style={{ padding: '0 16px 16px' }}>
            <FormField id="banner-message" label="Message">
              <textarea
                id="banner-message"
                className="form-input form-textarea"
                rows={3}
                maxLength={280}
                value={form.message}
                onChange={(e) => setForm((current) => ({ ...current, message: e.target.value }))}
                placeholder="Short announcement for the Home screen"
              />
            </FormField>
            <FormField id="banner-link-type" label="Tap destination">
              <select
                id="banner-link-type"
                className="form-input"
                value={form.linkType}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    linkType: e.target.value as BannerLinkType,
                    linkRef: '',
                  }))
                }
              >
                {LINK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            {needsRef ? (
              <FormField id="banner-link-ref" label={selectedLink?.hint ?? 'Reference'}>
                <input
                  id="banner-link-ref"
                  className="form-input"
                  value={form.linkRef}
                  onChange={(e) => setForm((current) => ({ ...current, linkRef: e.target.value }))}
                  placeholder={form.linkType === 'deeplink' ? '/stack/Premium' : 'Test ID'}
                />
              </FormField>
            ) : null}
            <div className="banner-actions">
              <ActionButton
                variant="gold"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Save banner'}
              </ActionButton>
              {editingId ? (
                <button
                  type="button"
                  className="abtn"
                  onClick={() => {
                    setEditingId(null);
                    setForm(defaultForm);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="banners-preview-col">
          <div className="sec-t" style={{ marginTop: 0 }}>
            Live preview
          </div>
          <div className="home-banner-preview">
            <div className="home-banner-preview-icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="svg">
                <path d="m3 11 18-5v12L3 14z" />
              </svg>
            </div>
            <div>
              <strong>{form.message.trim() || 'Your banner message'}</strong>
              <span>{previewHint}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sec-t">Banners</div>
      <DataTable
        rows={bannersQuery.data?.items ?? []}
        emptyMessage={bannersQuery.isLoading ? 'Loading banners…' : 'No banners yet'}
        columns={[
          { key: 'message', header: 'Message', render: (row) => row.message },
          { key: 'link', header: 'Destination', render: (row) => linkSummary(row) },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <span className={`pill ${row.active ? 'p-pub' : 'p-draft'}`}>
                {row.active ? 'Live on Home' : 'Hidden'}
              </span>
            ),
          },
          {
            key: 'updated',
            header: 'Updated',
            render: (row) => formatWhen(row.updatedAt),
          },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => (
              <div className="act">
                <button type="button" className="abtn" onClick={() => startEdit(row)}>
                  Edit
                </button>
                {row.active ? (
                  <button
                    type="button"
                    className="abtn no"
                    disabled={publishMutation.isPending}
                    onClick={() => publishMutation.mutate({ id: row.id, active: false })}
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    type="button"
                    className="abtn pri"
                    disabled={publishMutation.isPending}
                    onClick={() => publishMutation.mutate({ id: row.id, active: true })}
                  >
                    Publish
                  </button>
                )}
                <button
                  type="button"
                  className="abtn no"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(row.id)}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
