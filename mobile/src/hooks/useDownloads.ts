import { useCallback, useEffect, useState } from 'react';
import {
  downloadLessonMaterial,
  downloadLessonNotes,
  downloadLessonVideo,
  listDownloads,
  removeDownload,
  type DownloadKind,
  type DownloadRecord,
} from '../offline/downloadManager';

export function useLessonDownloads(courseId: string) {
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const items = await listDownloads(courseId);
    setRecords(items);
  }, [courseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getStatus = (lessonId: string, kind: DownloadKind) => {
    const key = `${courseId}:${lessonId}:${kind}`;
    const record = records.find((item) => item.key === key);
    if (activeKey === key) {
      return 'downloading' as const;
    }
    return record?.status ?? null;
  };

  const downloadVideo = async (input: {
    lessonId: string;
    lessonTitle: string;
    videoUrl: string;
  }) => {
    const key = `${courseId}:${input.lessonId}:video`;
    setActiveKey(key);
    try {
      await downloadLessonVideo({
        courseId,
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        videoUrl: input.videoUrl,
      });
      await refresh();
    } finally {
      setActiveKey(null);
    }
  };

  const downloadNotes = async (input: {
    lessonId: string;
    lessonTitle: string;
    notes: string;
  }) => {
    const key = `${courseId}:${input.lessonId}:notes`;
    setActiveKey(key);
    try {
      await downloadLessonNotes({
        courseId,
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        notes: input.notes,
      });
      await refresh();
    } finally {
      setActiveKey(null);
    }
  };

  const downloadMaterial = async (input: {
    lessonId: string;
    lessonTitle: string;
    materialUrl: string;
    materialName?: string;
  }) => {
    const key = `${courseId}:${input.lessonId}:material`;
    setActiveKey(key);
    try {
      await downloadLessonMaterial({
        courseId,
        lessonId: input.lessonId,
        lessonTitle: input.lessonTitle,
        materialUrl: input.materialUrl,
        materialName: input.materialName,
      });
      await refresh();
    } finally {
      setActiveKey(null);
    }
  };

  const remove = async (lessonId: string, kind: DownloadKind) => {
    await removeDownload(courseId, lessonId, kind);
    await refresh();
  };

  return {
    records,
    getStatus,
    downloadVideo,
    downloadNotes,
    downloadMaterial,
    remove,
    refresh,
  };
}
