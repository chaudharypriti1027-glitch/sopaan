import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createMentor,
  fetchMentors,
  setMentorStatus,
  updateMentor,
  type AdminMentor,
  type MentorInput,
} from '../api/mentors';
import { ActionButton } from '../components/ActionButton';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/content/Drawer';
import { FormField } from '../components/content/FormField';
import { CoverImageField } from '../components/media/MediaPicker';
import { PaginationBar } from '../components/questions/PaginationBar';
import { TableActionButton } from '../components/questions/TableActionButton';
import { useToast } from '../components/Toast';

const PAGE_SIZE = 20;

type FormState = {
  name: string;
  subjects: string;
  bio: string;
  rate: string;
  avatarUrl: string;
};

const emptyForm = (): FormState => ({
  name: '',
  subjects: '',
  bio: '',
  rate: '',
  avatarUrl: '',
});

function toForm(row: AdminMentor): FormState {
  return {
    name: row.name,
    subjects: (row.subjects ?? row.expertise ?? []).join(', '),
    bio: row.bio ?? '',
    rate: row.rate != null ? String(row.rate) : '',
    avatarUrl: row.avatarUrl ?? '',
  };
}

function parseSubjects(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!parseSubjects(form.subjects).length) errors.subjects = 'At least one subject is required';
  if (form.rate.trim() && Number.isNaN(Number(form.rate))) errors.rate = 'Rate must be a number';
  return errors;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatRate(value: number | null) {
  return value != null ? `₹${value}` : '—';
}

export function MentorsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMentor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const query = useQuery({
    queryKey: ['admin', 'mentors', { search, offset }],
    queryFn: () =>
      fetchMentors({
        q: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: MentorInput }) =>
      id ? updateMentor(id, body) : createMentor(body),
    onSuccess: (_data, vars) => {
      showToast(vars.id ? 'Mentor updated' : 'Mentor added');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      closeDrawer();
    },
    onError: (err: Error) => showToast(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setMentorStatus(id, isActive),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (data) => {
      showToast(data.isActive ? 'Mentor reactivated' : 'Mentor deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const rows = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(row: AdminMentor) {
    setEditing(row);
    setForm(toForm(row));
    setErrors({});
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saveMutation.isPending) return;
    setDrawerOpen(false);
    setEditing(null);
  }

  async function handleSave() {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const body: MentorInput = {
      name: form.name.trim(),
      subjects: parseSubjects(form.subjects),
      bio: form.bio.trim() || undefined,
      rate: form.rate.trim() ? Number(form.rate) : undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
    };

    await saveMutation.mutateAsync({ id: editing?.id, body });
  }

  function handleDeactivate(row: AdminMentor) {
    const nextActive = !row.isActive;
    const verb = nextActive ? 'Reactivate' : 'Deactivate';
    if (
      !window.confirm(
        `${verb} ${row.name}?${nextActive ? '' : ' They will be hidden from the student mentor list.'}`,
      )
    ) {
      return;
    }
    statusMutation.mutate({ id: row.id, isActive: nextActive });
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search toolbar-search">
          <svg className="svg" viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            placeholder="Search mentors…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <ActionButton variant="gold" onClick={openCreate}>
          Add mentor
        </ActionButton>
      </div>

      <DataTable
        rows={rows}
        emptyMessage={query.isLoading ? 'Loading mentors…' : 'No mentors yet'}
        columns={[
          {
            key: 'name',
            header: 'Mentor',
            render: (row) => (
              <div className="cellname">
                {row.avatarUrl ? (
                  <img src={row.avatarUrl} alt="" className="mentor-avatar" />
                ) : (
                  <div className="av av-navy">{initials(row.name)}</div>
                )}
                <div>
                  <div>{row.name}</div>
                  <div className="sub">{(row.subjects ?? []).slice(0, 2).join(' · ') || '—'}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'subjects',
            header: 'Subjects',
            render: (row) => (row.subjects ?? []).join(', ') || '—',
          },
          {
            key: 'rate',
            header: 'Rate',
            render: (row) => formatRate(row.rate),
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (row) => `${row.rating}★`,
          },
          {
            key: 'sessions',
            header: 'Sessions',
            render: (row) => row.sessionsCount,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) =>
              row.isActive ? (
                <span className="pill q-pub">Active</span>
              ) : (
                <span className="pill q-rev">Inactive</span>
              ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (row) => (
              <div className="act">
                <TableActionButton onClick={() => openEdit(row)}>Edit</TableActionButton>
                <TableActionButton
                  variant={row.isActive ? 'danger' : 'ok'}
                  disabled={busyId === row.id}
                  onClick={() => handleDeactivate(row)}
                >
                  {row.isActive ? 'Deactivate' : 'Reactivate'}
                </TableActionButton>
              </div>
            ),
          },
        ]}
      />

      {pagination ? (
        <PaginationBar
          offset={pagination.offset}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={setOffset}
        />
      ) : null}

      <Drawer
        open={drawerOpen}
        title={editing ? 'Edit mentor' : 'Add mentor'}
        onClose={closeDrawer}
        onSubmit={() => void handleSave()}
        submitting={saveMutation.isPending}
        submitLabel={editing ? 'Save changes' : 'Create mentor'}
      >
        <div className="drawer-form">
          <FormField id="mentor-name" label="Name" error={errors.name}>
            <input
              id="mentor-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Dr. Sharma"
            />
          </FormField>
          <FormField id="mentor-subjects" label="Subjects (comma-separated)" error={errors.subjects}>
            <input
              id="mentor-subjects"
              className="form-input"
              value={form.subjects}
              onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
              placeholder="Quant, Reasoning, English"
            />
          </FormField>
          <FormField id="mentor-bio" label="Bio">
            <textarea
              id="mentor-bio"
              className="form-input form-textarea"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              placeholder="10+ years mentoring SSC aspirants…"
            />
          </FormField>
          <FormField id="mentor-rate" label="Session rate (₹)" error={errors.rate}>
            <input
              id="mentor-rate"
              type="number"
              min={0}
              className="form-input"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
              placeholder="499"
            />
          </FormField>
          <CoverImageField
            label="Avatar"
            value={form.avatarUrl}
            onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
          />
        </div>
      </Drawer>
    </div>
  );
}
