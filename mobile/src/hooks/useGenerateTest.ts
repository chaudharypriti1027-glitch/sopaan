import { useMutation } from '@tanstack/react-query';
import { aiApi, type GenerateTestInput } from '../api';

export function useGenerateTest() {
  return useMutation({
    mutationFn: (input: GenerateTestInput) => aiApi.generateTest(input),
  });
}
