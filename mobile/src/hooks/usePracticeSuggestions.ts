import { useMutation } from '@tanstack/react-query';
import { aiApi, type PracticeSuggestionsInput } from '../api';

export function usePracticeSuggestions() {
  return useMutation({
    mutationFn: (input: PracticeSuggestionsInput) => aiApi.getPracticeSuggestions(input),
  });
}
