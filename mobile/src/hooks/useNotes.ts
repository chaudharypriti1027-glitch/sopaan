import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteNote, listNotes, saveNote, type SavedNote } from '../notes/notesStorage';
import { queryKeys } from './queryKeys';

export function useSavedNotes() {
  return useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: listNotes,
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: Omit<SavedNote, 'id' | 'createdAt'>) => saveNote(note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    },
  });
}
