import notifee, {AndroidImportance} from '@notifee/react-native';

export const CHANNEL_MEDICATION = 'medication-reminders';
export const CHANNEL_MISSED = 'missed-doses';

// Brand green — accent for notifications (small-icon tint, LED) instead of the
// default platform grey/black.
export const NOTIFICATION_ACCENT = '#2E6F40';

export async function createNotificationChannels(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_MEDICATION,
    name: 'Derman yadyma salmalary',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lightColor: NOTIFICATION_ACCENT,
  });

  await notifee.createChannel({
    id: CHANNEL_MISSED,
    name: 'Sypdyrylan dozalar',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    lightColor: NOTIFICATION_ACCENT,
  });
}
