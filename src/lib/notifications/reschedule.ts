import notifee from '@notifee/react-native';
import {Platform} from 'react-native';
import {computeUpcomingDoses, scheduleDoseNotification} from './scheduler';
import reminderStore from '../store/reminderStore';

const IOS_BUDGET = 58;
const ANDROID_BUDGET = 500;

export async function rescheduleAllNotifications(): Promise<void> {
  const existingIds = await notifee.getTriggerNotificationIds();
  const medIds = existingIds.filter(
    id => id.startsWith('med:') || id.startsWith('chk:'),
  );
  await Promise.all(medIds.map(id => notifee.cancelTriggerNotification(id)));

  const state = reminderStore.getState();
  const {medications, schedules, familyMembers, mealTimes} = state;
  const activeMeds = medications.filter(m => m.isActive);
  const activeSchedules = schedules.filter(s => s.isActive);

  const budget = Platform.OS === 'ios' ? IOS_BUDGET : ANDROID_BUDGET;
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);

  let allDoses: Array<{
    medication: Reminder.Medication;
    memberName: string;
    scheduledAt: Date;
  }> = [];

  for (const med of activeMeds) {
    const medSchedules = activeSchedules.filter(
      s => s.medicationId === med.id,
    );
    const member = familyMembers.find(m => m.id === med.memberId);
    const memberName = member?.name ?? 'Men';

    for (const schedule of medSchedules) {
      const doses = computeUpcomingDoses(med, schedule, mealTimes, horizon);
      for (const dose of doses) {
        allDoses.push({
          medication: med,
          memberName,
          scheduledAt: dose.scheduledAt,
        });
      }
    }
  }

  allDoses.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  allDoses = allDoses.slice(0, budget);

  await Promise.all(
    allDoses.map(d =>
      scheduleDoseNotification(d.medication, d.memberName, d.scheduledAt),
    ),
  );
}
