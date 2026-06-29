import notifee from '@notifee/react-native';
import {scheduleSnooze} from './snooze';
import {rescheduleAllNotifications} from './reschedule';
import reminderStore from '../store/reminderStore';

const MAX_SNOOZES = 3;

export async function handleNotificationAction(detail: {
  notification?: {id?: string; data?: Record<string, string>};
  pressAction?: {id: string};
}): Promise<void> {
  const actionId = detail.pressAction?.id;
  const data = detail.notification?.data;
  if (!data || !actionId) return;

  const {medicationId, scheduledTime, scheduledAt, memberId} = data;
  const time = scheduledTime || scheduledAt;
  const snoozeIndex = parseInt(data.snoozeIndex ?? '0', 10);
  const store = reminderStore.getState();
  const snoozeDelay = store.snoozeDelayMinutes;

  // Find or create intake log
  const schedules = store.schedules.filter(s => s.medicationId === medicationId);
  const scheduleId = schedules[0]?.id ?? '';

  switch (actionId) {
    case 'take': {
      const existing = store.intakeLogs.find(
        l => l.medicationId === medicationId && l.scheduledTime === time,
      );
      if (existing) {
        store.updateIntakeStatus(existing.id, 'taken', new Date().toISOString());
      } else {
        store.logIntake({
          medicationId,
          scheduleId,
          memberId: memberId ?? store.activeMemberId,
          scheduledTime: time,
          status: 'taken',
          actualTime: new Date().toISOString(),
        });
      }
      break;
    }

    case 'skip': {
      const existing = store.intakeLogs.find(
        l => l.medicationId === medicationId && l.scheduledTime === time,
      );
      if (existing) {
        store.updateIntakeStatus(existing.id, 'skipped', new Date().toISOString());
      } else {
        store.logIntake({
          medicationId,
          scheduleId,
          memberId: memberId ?? store.activeMemberId,
          scheduledTime: time,
          status: 'skipped',
          actualTime: new Date().toISOString(),
        });
      }
      break;
    }

    case 'snooze': {
      if (snoozeIndex < MAX_SNOOZES) {
        await scheduleSnooze(data, snoozeIndex + 1, snoozeDelay);
      } else {
        const existing = store.intakeLogs.find(
          l => l.medicationId === medicationId && l.scheduledTime === time,
        );
        if (existing) {
          store.updateIntakeStatus(existing.id, 'missed');
        } else {
          store.logIntake({
            medicationId,
            scheduleId,
            memberId: memberId ?? store.activeMemberId,
            scheduledTime: time,
            status: 'missed',
          });
        }
      }
      break;
    }

    case 'default':
      break;
  }

  if (detail.notification?.id) {
    await notifee.cancelNotification(detail.notification.id);
  }

  await rescheduleAllNotifications();
}
