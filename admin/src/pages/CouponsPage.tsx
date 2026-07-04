import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  createAdminCoupon,
  deleteAdminCoupon,
  listAdminCoupons,
  setAdminCouponActive,
  type AdminCoupon,
  type CouponType,
} from '../api/coupons';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/content/FormField';
import { useToast } from '../components/Toast';
import './coupons.css';

const defaultForm = {
  code: '',
  type: 'percent' as CouponType,
  value: '10',
  usageLimit: '100',
  expiresAt: '',
};

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatDiscount(row: AdminCoupon) {
  if (row.type === 'percent') {
    return `${row.value}% off`;
  }
  return `₹${(row.value / 100).toLocaleString('en-IN')} off`;
}

function couponStatus(row: AdminCoupon) {
  if (!row.active) {
    return { label: 'Inactive', className: 'p-draft' };
  }
  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    return { label: 'Expired', className: 'p-rej' };
  }
  if (row.usedCount >= row.usageLimit) {
    return { label: 'Limit reached', className: 'p-rej' };
  }
  return { label: 'Active', className: 'p-pub' };
}

function toIsoExpiry(localValue: string) {
  if (!localValue) {
    throw new Error('Expiry date is required');
  }
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid expiry date');
  }
  return date.toISOString();
}

export function CouponsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  const couponsQuery = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => listAdminCoupons(),
  });

  const previewDiscount = useMemo(() => {
    const numeric = Number(form.value);
    if (!numeric || Number.isNaN(numeric)) {
      return '—';
    }
    if (form.type === 'percent') {
      return `${numeric}% off plan price`;
    }
    return `₹${numeric.toLocaleString('en-IN')} off plan price`;
  }, [form.type, form.value]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = form.code.trim();
      if (!code) {
        throw new Error('Coupon code is required');
      }

      const usageLimit = Number(form.usageLimit);
      if (!usageLimit || usageLimit < 1) {
        throw new Error('Usage limit must be at least 1');
      }

      const rawValue = Number(form.value);
      if (!rawValue || rawValue < 1) {
        throw new Error('Discount value is required');
      }

      const value = form.type === 'flat' ? Math.round(rawValue * 100) : Math.round(rawValue);

      if (form.type === 'percent' && (value < 1 || value > 100)) {
        throw new Error('Percent discount must be between 1 and 100');
      }

      if (form.type === 'flat' && value < 100) {
        throw new Error('Flat discount must be at least ₹1');
      }

      return createAdminCoupon({
        code,
        type: form.type,
        value,
        usageLimit,
        expiresAt: toIsoExpiry(form.expiresAt),
      });
    },
    onSuccess: () => {
      showToast('Coupon created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      setForm(defaultForm);
    },
    onError: (err: Error) => showToast(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => setAdminCouponActive(id, false),
    onSuccess: () => {
      showToast('Coupon deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => setAdminCouponActive(id, true),
    onSuccess: () => {
      showToast('Coupon activated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCoupon(id),
    onSuccess: () => {
      showToast('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = couponsQuery.data?.items ?? [];

  return (
    <div className="coupons-page">
      <div className="coupons-grid">
        <div className="panel">
          <div className="ph">
            <h3>Create coupon</h3>
          </div>
          <div className="drawer-form" style={{ padding: '0 16px 16px' }}>
            <p className="coupon-form-note">
              Codes are validated at checkout. Discount is applied to the server-computed plan price.
            </p>

            <FormField id="coupon-code" label="Code">
              <input
                id="coupon-code"
                className="form-input"
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
                placeholder="SAVE20"
                maxLength={32}
              />
            </FormField>

            <FormField id="coupon-type" label="Discount type">
              <select
                id="coupon-type"
                className="form-input"
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    type: event.target.value as CouponType,
                    value: event.target.value === 'percent' ? '10' : '50',
                  }))
                }
              >
                <option value="percent">Percent off</option>
                <option value="flat">Flat amount (₹)</option>
              </select>
            </FormField>

            <FormField
              id="coupon-value"
              label={form.type === 'percent' ? 'Percent off' : 'Flat amount (₹)'}
            >
              <input
                id="coupon-value"
                className="form-input"
                type="number"
                min={1}
                max={form.type === 'percent' ? 100 : undefined}
                value={form.value}
                onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              />
              <p className="coupon-value-hint">Preview: {previewDiscount}</p>
            </FormField>

            <FormField id="coupon-limit" label="Usage limit">
              <input
                id="coupon-limit"
                className="form-input"
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
              />
            </FormField>

            <FormField id="coupon-expires" label="Expires at">
              <input
                id="coupon-expires"
                className="form-input"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
              />
            </FormField>

            <div className="coupon-form-actions">
              <button
                type="button"
                className="tbtn gold"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving…' : 'Create coupon'}
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <h3>Coupons</h3>
          </div>
          <p className="coupon-form-note" style={{ padding: '0 16px' }}>
            Used count increments only after a successful payment.
          </p>
          <div style={{ padding: '0 16px 16px' }}>
            <DataTable<AdminCoupon>
              rows={rows}
              emptyMessage={couponsQuery.isLoading ? 'Loading coupons…' : 'No coupons yet'}
              columns={[
                {
                  key: 'code',
                  header: 'Code',
                  render: (row) => <strong>{row.code}</strong>,
                },
                {
                  key: 'discount',
                  header: 'Discount',
                  render: (row) => formatDiscount(row),
                },
                {
                  key: 'usage',
                  header: 'Used / limit',
                  render: (row) => `${row.usedCount} / ${row.usageLimit}`,
                },
                {
                  key: 'expires',
                  header: 'Expires',
                  render: (row) => formatWhen(row.expiresAt),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => {
                    const status = couponStatus(row);
                    return <span className={`pill ${status.className}`}>{status.label}</span>;
                  },
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (row) => (
                    <div className="act">
                      {row.active ? (
                        <button
                          type="button"
                          className="abtn no"
                          onClick={() => deactivateMutation.mutate(row.id)}
                          disabled={deactivateMutation.isPending}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="abtn pri"
                          onClick={() => activateMutation.mutate(row.id)}
                          disabled={activateMutation.isPending}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        className="abtn no"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete coupon ${row.code}?`)) {
                            deleteMutation.mutate(row.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
