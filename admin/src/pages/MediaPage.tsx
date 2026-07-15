import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ImagePlus, Library, Trash2, Upload } from 'lucide-react';
import { deleteMedia, fetchMedia, type AdminMedia } from '../api/media';
import { ActionButton } from '../components/ActionButton';
import { QueryErrorBanner } from '../components/QueryErrorBanner';
import { MediaThumb } from '../components/media/MediaPicker';
import { useToast } from '../components/Toast';
import { formatBytes, isImageMedia, isVideoMedia, uploadMediaFile } from '../hooks/useMediaLibrary';

export function MediaPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kindFilter, setKindFilter] = useState<'all' | 'image' | 'video'>('all');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'media', { kindFilter }],
    queryFn: () =>
      fetchMedia({
        kind: kindFilter === 'all' ? undefined : kindFilter,
        limit: 60,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadMediaFile(file, setUploadPct),
    onMutate: () => setUploadPct(0),
    onSettled: () => setUploadPct(null),
    onSuccess: () => {
      showToast('Upload complete');
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      showToast('Deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
    onError: (err: Error) => showToast(err.message),
  });

  const items = query.data?.items ?? [];

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('URL copied');
    } catch {
      showToast('Could not copy URL');
    }
  }

  function handleDelete(item: AdminMedia) {
    if (!window.confirm('Delete this media asset from storage and the library?')) return;
    deleteMutation.mutate(item.id);
  }

  return (
    <div className="content-page media-page">
      <div className="toolbar">
        <select
          className="filter-select"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}
          aria-label="Filter media type"
        >
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <ActionButton
          variant="gold"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <Upload aria-hidden strokeWidth={1.8} />
          Upload media
        </ActionButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {uploadPct != null ? (
        <div className="upload-progress" role="status">
          <div className="upload-progress-bar" style={{ width: `${uploadPct}%` }} />
          <span>Uploading… {uploadPct}%</span>
        </div>
      ) : null}

      {query.isError ? (
        <QueryErrorBanner error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="media-library-state" role="status">
          <Library aria-hidden strokeWidth={1.7} />
          <strong>Loading media library…</strong>
        </div>
      ) : items.length === 0 ? (
        <div className="media-library-state">
          <ImagePlus aria-hidden strokeWidth={1.7} />
          <strong>No media uploaded yet</strong>
          <span>Upload an image or video to reuse it across courses and content.</span>
          <ActionButton variant="gold" onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden strokeWidth={1.8} />
            Upload first asset
          </ActionButton>
        </div>
      ) : (
        <div className="media-grid">
          {items.map((item) => (
            <article key={item.id} className="media-card">
              <MediaThumb item={item} />
              <div className="media-card-meta">
                <span className="media-type">
                  {isImageMedia(item) ? 'Image' : isVideoMedia(item) ? 'Video' : item.type}
                </span>
                <span>{formatBytes(item.sizeBytes)}</span>
              </div>
              <div className="media-card-actions">
                <button type="button" className="abtn" onClick={() => void copyUrl(item.url)}>
                  <Copy aria-hidden strokeWidth={1.8} />
                  Copy URL
                </button>
                <button
                  type="button"
                  className="abtn no"
                  disabled={busyId === item.id}
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 aria-hidden strokeWidth={1.8} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
