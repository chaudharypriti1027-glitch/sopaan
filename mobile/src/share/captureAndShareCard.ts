import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { buildShareMessage, type ShareCardData } from './types';

export async function captureAndShareCard(
  ref: RefObject<View | null>,
  data: ShareCardData,
  referral?: { webLink?: string; code?: string },
) {
  if (!ref.current) {
    throw new Error('Share card is not ready');
  }

  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  const message = buildShareMessage(data, referral?.webLink);

  if (Platform.OS === 'ios') {
    await Share.share({ url: uri, message });
    return;
  }

  await Share.share({
    message: referral?.webLink ? `${message}\n${uri}` : message,
    url: uri,
    title: 'Share your Sopaan milestone',
  });
}
