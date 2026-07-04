import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { AdminMedia } from '../../api/media';
import { fetchMedia } from '../../api/media';
import { ActionButton } from '../ActionButton';
import { formatBytes, isImageMedia, isVideoMedia } from '../../hooks/useMediaLibrary';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'media', 'picker', kind],
    queryFn: () => fetchMedia({ kind, limit: 60 }),
    enabled: open,
  });

  const filtered =
    query.data?.items.filter((item) =>
      kind === 'image' ? isImageMedia(item) : isVideoMedia(item),
    ) ?? [];

  if (!open) return null;

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
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <svg className="svg" viewBox="0 0 24 24" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="media-picker-body">
          {query.isLoading ? (
            <p className="empty-note">Loading media…</p>
          ) : filtered.length === 0 ? (
            <p className="empty-note">
              No {kind} assets yet. Upload some in Media library first.
            </p>
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
        <span className="media-play">▶</span>
      </div>
    );
  }

  return <div className="media-thumb file">{item.type}</div>;
}

interface CoverImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export function CoverImageField({ label, value, onChange }: CoverImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="cover-field">
      <span className="form-label">{label}</span>
      <div className="cover-field-row">
        {value ? (
          <img src={value} alt="" className="cover-preview" />
        ) : (
          <div className="cover-preview empty">No cover selected</div>
        )}
        <div className="cover-actions">
          <ActionButton variant="ghost" onClick={() => setPickerOpen(true)}>
            Choose from library
          </ActionButton>
          {value ? (
            <ActionButton variant="ghost" onClick={() => onChange('')}>
              Remove
            </ActionButton>
          ) : null}
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        kind="image"
        title="Choose cover image"
      />
    </div>
  );
}
