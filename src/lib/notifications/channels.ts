import notifee, {AndroidImportance} from '@notifee/react-native';

export const CHANNEL_MEDICATION = 'medication-reminders';
export const CHANNEL_MISSED = 'missed-doses';

export async function createNotificationChannels(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_MEDICATION,
    name: 'Derman yadyma salmalary',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.createChannel({
    id: CHANNEL_MISSED,
    name: 'Sypdyrylan dozalar',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
}
