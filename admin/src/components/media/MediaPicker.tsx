import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  AlertCircle,
  Film,
  Image,
  Inbox,
  Library,
  Link,
  Play,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { AdminMedia } from '../../api/media';
import { fetchMedia } from '../../api/media';
import { ActionButton } from '../ActionButton';
import { useToast } from '../Toast';
import {
  formatBytes,
  isImageMedia,
  isVideoMedia,
  uploadMediaFile,
} from '../../hooks/useMediaLibrary';
import '../ui.css';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, item: AdminMedia) => void;
  kind?: 'image' | 'video';
  title?: string;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  kind = 'image',
  title = 'Choose from media library',
}: MediaPickerProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'media', 'picker', kind],
    queryFn: () => fetchMedia({ kind, limit: 60 }),
    enabled: open,
  });

  const filtered =
    query.data?.items.filter((item) =>
      kind === 'image' ? isImageMedia(item) : isVideoMedia(item),
    ) ?? [];

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setUploading(true);
    setUploadPct(0);
    try {
      const item = await uploadMediaFile(file, setUploadPct);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      setSelectedId(item.id);
      showToast('Upload complete');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadPct(null);
    }
  }

  if (!open) return null;

  const accept = kind === 'image' ? 'image/*' : 'video/*';

  return (
    <div className="drawer-overlay media-picker-overlay" role="presentation" onClick={onClose}>
      <div
        className="media-picker"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <h2>{title}</h2>
          <div className="media-picker-head-actions">
            <ActionButton
              variant="navy"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload aria-hidden strokeWidth={1.8} />
              {uploading ? 'Uploading…' : 'Upload from device'}
            </ActionButton>
            <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
              <X aria-hidden strokeWidth={1.8} />
            </button>
          </div>
        </header>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            void handleUpload(e.target.files);
            e.target.value = '';
          }}
        />
        {uploadPct != null ? (
          <div className="upload-progress media-picker-upload" role="status">
            <div className="upload-progress-bar" style={{ width: `${uploadPct}%` }} />
            <span>Uploading… {uploadPct}%</span>
          </div>
        ) : null}
        <div className="media-picker-body">
          {query.isLoading ? (
            <div className="media-picker-state" role="status">
              <Library aria-hidden strokeWidth={1.7} />
              <strong>Loading media library…</strong>
            </div>
          ) : query.isError ? (
            <div className="media-picker-state error" role="alert">
              <AlertCircle aria-hidden strokeWidth={1.7} />
              <strong>Could not load media</strong>
              <span>{query.error instanceof Error ? query.error.message : 'Please try again.'}</span>
              <ActionButton variant="ghost" onClick={() => void query.refetch()}>
                <RefreshCw aria-hidden strokeWidth={1.8} />
                Try again
              </ActionButton>
            </div>
          ) : filtered.length === 0 ? (
            <div className="media-picker-state">
              <Inbox aria-hidden strokeWidth={1.7} />
              <strong>No {kind} assets yet</strong>
              <span>Upload from your device to add the first one.</span>
            </div>
          ) : (
            <div className="media-grid compact">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`media-card selectable${selectedId === item.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                  onDoubleClick={() => {
                    onSelect(item.url, item);
                    onClose();
                  }}
                >
                  <MediaThumb item={item} />
                  <div className="media-card-meta">
                    <span>{formatBytes(item.sizeBytes)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <footer className="drawer-foot">
          <ActionButton variant="ghost" onClick={() => setSelectedId(null)}>
            Clear
          </ActionButton>
          <ActionButton
            variant="gold"
            disabled={!selectedId}
            onClick={() => {
              const item = filtered.find((row) => row.id === selectedId);
              if (item) {
                onSelect(item.url, item);
                onClose();
              }
            }}
          >
            Use selected
          </ActionButton>
        </footer>
      </div>
    </div>
  );
}

export function MediaThumb({ item }: { item: AdminMedia }) {
  if (isImageMedia(item)) {
    return <img src={item.url} alt="" className="media-thumb" loading="lazy" />;
  }

  if (isVideoMedia(item)) {
    return (
      <div className="media-thumb video">
        <video src={item.url} muted preload="metadata" />
        <span className="media-play"><Play aria-hidden fill="currentColor" strokeWidth={1.8} /></span>
      </div>
    );
  }

  return <div className="media-thumb file">{item.type}</div>;
}

interface CoverImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: 'image' | 'video';
  allowUrl?: boolean;
}

export function CoverImageField({
  label,
  value,
  onChange,
  kind = 'image',
  allowUrl = true,
}: CoverImageFieldProps) {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const accept = kind === 'image' ? 'image/*' : 'video/*';

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setUploading(true);
    setUploadPct(0);
    try {
      const item = await uploadMediaFile(file, setUploadPct);
      onChange(item.url);
      showToast(`${kind === 'image' ? 'Image' : 'Video'} uploaded`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadPct(null);
    }
  }

  return (
    <div className="cover-field">
      <span className="form-label">{label}</span>
      <div className="cover-field-row">
        {value && kind === 'image' ? (
          <img src={value} alt="" className="cover-preview" />
        ) : value && kind === 'video' ? (
          <video src={value} className="cover-preview" muted preload="metadata" />
        ) : (
          <div className="cover-preview empty">
            {kind === 'image' ? (
              <Image aria-hidden strokeWidth={1.7} />
            ) : (
              <Film aria-hidden strokeWidth={1.7} />
            )}
            <span>No {kind} selected</span>
          </div>
        )}
        <div className="cover-actions">
          <ActionButton
            variant="gold"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload aria-hidden strokeWidth={1.8} />
            {uploading ? `Uploading… ${uploadPct ?? 0}%` : 'Upload from device'}
          </ActionButton>
          <ActionButton variant="ghost" onClick={() => setPickerOpen(true)}>
            <Library aria-hidden strokeWidth={1.8} />
            Choose from library
          </ActionButton>
          {allowUrl ? (
            <ActionButton variant="ghost" onClick={() => setShowUrl((open) => !open)}>
              <Link aria-hidden strokeWidth={1.8} />
              {showUrl ? 'Hide URL' : 'Paste URL'}
            </ActionButton>
          ) : null}
          {value ? (
            <ActionButton variant="ghost" onClick={() => onChange('')}>
              <Trash2 aria-hidden strokeWidth={1.8} />
              Remove
            </ActionButton>
          ) : null}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          void handleUpload(e.target.files);
          e.target.value = '';
        }}
      />
      {uploadPct != null && uploading ? (
        <div className="upload-progress cover-upload-progress" role="status">
          <div className="upload-progress-bar" style={{ width: `${uploadPct}%` }} />
          <span>Uploading… {uploadPct}%</span>
        </div>
      ) : null}
      {showUrl ? (
        <input
          className="form-input"
          type="url"
          value={value}
          placeholder="https://…"
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        kind={kind}
        title={`Choose ${kind === 'image' ? 'image' : 'video'}`}
      />
    </div>
  );
}

/** Alias for cover/avatar/thumbnail fields with device upload. */
export const ImageField = CoverImageField;
