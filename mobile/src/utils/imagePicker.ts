import * as ImagePicker from 'expo-image-picker';

export type PickedImageAsset = {
  uri: string;
  mimeType: string;
  fileName: string;
};

async function ensurePermission(kind: 'camera' | 'library'): Promise<boolean> {
  const result =
    kind === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  return result.granted;
}

export async function pickImageBase64(
  source: 'camera' | 'library' = 'camera',
): Promise<string | null> {
  const granted = await ensurePermission(source === 'camera' ? 'camera' : 'library');
  if (!granted) {
    return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          base64: true,
          quality: 0.65,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          base64: true,
          quality: 0.65,
        });

  if (result.canceled || !result.assets[0]?.base64) {
    return null;
  }

  return result.assets[0].base64;
}

export async function pickImageAsset(
  source: 'camera' | 'library' = 'library',
): Promise<PickedImageAsset | null> {
  const granted = await ensurePermission(source === 'camera' ? 'camera' : 'library');
  if (!granted) {
    return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.75,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.75,
        });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? 'avatar.jpg',
  };
}
