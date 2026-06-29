import notifee, {TriggerType, TimestampTrigger} from '@notifee/react-native';
import {makeDoseNotificationId} from './idScheme';
import {CHANNEL_MEDICATION} from './channels';
import {CATEGORY_MEDICATION} from './categories';

const MAX_SNOOZES = 3;

export async function scheduleSnooze(
  data: Record<string, string>,
  newSnoozeIndex: number,
  delayMinutes: number,
): Promise<void> {
  const snoozeAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  const originalScheduledAt = new Date(data.scheduledAt);

  const notificationId = makeDoseNotificationId(
    data.medicationId,
    originalScheduledAt,
    newSnoozeIndex,
  );

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: snoozeAt.getTime(),
    alarmManager: {allowWhileIdle: true},
  };

  const remaining = MAX_SNOOZES - newSnoozeIndex;
  const extra =
    remaining > 0 ? `(${remaining} gezek galdy)` : '(sonky yadyma salma)';

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: `${data.drugName ?? 'Derman'}`,
      body: `${data.dosage ?? ''} — ${data.memberName ?? ''} ${extra}`,
      data: {
        ...data,
        snoozeIndex: String(newSnoozeIndex),
      },
      android: {
        channelId: CHANNEL_MEDICATION,
        pressAction: {id: 'default'},
        actions: [
          {title: 'Kabul et', pressAction: {id: 'take'}},
          ...(newSnoozeIndex < MAX_SNOOZES
            ? [{title: 'Yzyna goj', pressAction: {id: 'snooze'}}]
            : []),
          {title: 'Gechir', pressAction: {id: 'skip'}},
        ],
      },
      ios: {
        categoryId: CATEGORY_MEDICATION,
        sound: 'default',
        interruptionLevel: 'timeSensitive',
      },
    },
    trigger,
  );
}
