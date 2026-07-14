import * as FileSystem from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { buildResultReportHtml } from './buildResultReportHtml';
import type { SubmitTestResponse } from '../api/types';

type ShareResultReportInput = {
  testTitle: string;
  subject?: string;
  topic?: string;
  examTag?: string;
  result: SubmitTestResponse;
};

export async function shareResultReport(input: ShareResultReportInput) {
  const html = buildResultReportHtml({
    testTitle: input.testTitle,
    subject: input.subject,
    topic: input.topic,
    examTag: input.examTag,
    attempt: input.result.attempt,
    answers: input.result.answers,
    coaching: input.result.coaching,
  });

  const path = `${FileSystem.documentDirectory}sopaan-result-${Date.now()}.html`;
  await FileSystem.writeAsStringAsync(path, html, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const message = `${input.testTitle} — score ${input.result.attempt.score}, ${input.result.attempt.accuracy}% accuracy. Open the attached report to read all solutions.`;

  if (Platform.OS === 'ios') {
    await Share.share({ url: path, message, title: input.testTitle });
    return;
  }

  await Share.share({
    title: input.testTitle,
    message: `${message}\n${path}`,
    url: path,
  });
}
