import { fileExtensionFromUrl, resolveContentUrl, resolveLessonMaterial } from '../lessonMaterial';

jest.mock('../../config/env', () => ({
  config: { apiOrigin: 'http://localhost:4000' },
}));

describe('lessonMaterial', () => {
  it('resolves relative upload URLs', () => {
    expect(resolveContentUrl('/uploads/media/test.pdf')).toBe(
      'http://localhost:4000/uploads/media/test.pdf',
    );
  });

  it('reads structured material fields', () => {
    expect(
      resolveLessonMaterial({
        materialUrl: '/uploads/media/notes.pdf',
        materialName: 'notes.pdf',
      }),
    ).toEqual({
      url: 'http://localhost:4000/uploads/media/notes.pdf',
      name: 'notes.pdf',
    });
  });

  it('falls back to legacy Study file links in notes', () => {
    expect(
      resolveLessonMaterial({
        notes: 'Summary\n\nStudy file: http://localhost:4000/uploads/media/old.pdf',
      }),
    ).toEqual({
      url: 'http://localhost:4000/uploads/media/old.pdf',
      name: 'old.pdf',
    });
  });

  it('extracts file extensions from URLs', () => {
    expect(fileExtensionFromUrl('http://cdn.example.com/file.PDF?token=1', 'pdf')).toBe('pdf');
  });
});
