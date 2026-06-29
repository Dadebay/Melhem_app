import notifee from '@notifee/react-native';

export const CATEGORY_MEDICATION = 'medication-reminder';

export async function registerIOSCategories(): Promise<void> {
  await notifee.setNotificationCategories([
    {
      id: CATEGORY_MEDICATION,
      actions: [
        {id: 'take', title: 'Kabul et', foreground: false},
        {id: 'snooze', title: 'Yzyna goj', foreground: false},
        {id: 'skip', title: 'Gechir', foreground: false},
      ],
    },
  ]);
}
