import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
  request,
  type PermissionStatus,
} from 'react-native-permissions';

export async function getContactsPermissionStatus(): Promise<PermissionStatus> {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CONTACTS
      : PERMISSIONS.ANDROID.READ_CONTACTS;

  return check(permission);
}

export async function requestContactsPermission(): Promise<PermissionStatus> {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CONTACTS
      : PERMISSIONS.ANDROID.READ_CONTACTS;

  return request(permission);
}

export function isPermissionGranted(status: PermissionStatus): boolean {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

export async function openDeviceSettings(): Promise<void> {
  await openSettings();
}
