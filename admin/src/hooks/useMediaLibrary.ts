import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeMediaUpload,
  deleteMedia,
  fetchMedia,
  presignMediaUpload,
  type AdminMedia,
} from '../api/media';
import { uploadMultipartWithProgress, uploadWithProgress } from '../utils/mediaUpload';

export async function uploadMediaFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<AdminMedia> {
  const presign = await presignMediaUpload({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });

  if (presign.mode === 'direct') {
    const form = new FormData();
    form.append('file', file);
    form.append('uploadToken', presign.uploadToken ?? '');
    const result = (await uploadMultipartWithProgress(
      '/api/admin/media/upload',
      form,
      onProgress,
    )) as AdminMedia;
    return { ...result, id: result.id ?? (result as { _id?: string })._id?.toString?.() ?? '' };
  }

  await uploadWithProgress(
    presign.uploadUrl,
    {
      method: presign.method,
      body: file,
      headers: presign.headers,
    },
    onProgress,
  );

  return completeMediaUpload({
    key: presign.key,
    mimeType: file.type,
    sizeBytes: file.size,
  });
}

export function useMediaLibrary(kind?: 'image' | 'video') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'media', { kind }],
    queryFn: () => fetchMedia({ kind, limit: 60 }),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (n: number) => void }) =>
      uploadMediaFile(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });

  return { query, uploadMutation, deleteMutation, items: query.data?.items ?? [] };
}

export function isImageMedia(item: AdminMedia) {
  return item.type.startsWith('image/');
}

export function isVideoMedia(item: AdminMedia) {
  return item.type.startsWith('video/');
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
