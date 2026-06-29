import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import notifee, {
  TriggerType,
  TimestampTrigger,
  AndroidStyle,
} from '@notifee/react-native';
import {CHANNEL_MEDICATION} from './channels';
import {CATEGORY_MEDICATION} from './categories';
import {makeDoseNotificationId} from './idScheme';

dayjs.extend(minMax);

export type ComputedDose = {
  medicationId: string;
  scheduledAt: Date;
};

export function computeUpcomingDoses(
  medication: Reminder.Medication,
  schedule: Reminder.Schedule,
  mealTimes: Record<Reminder.MealSlot, string>,
  horizon: Date,
  now: Date = new Date(),
): ComputedDose[] {
  const doses: ComputedDose[] = [];
  const {config, course} = schedule;

  const rangeStart = dayjs(course.startDate);
  const rangeEnd =
    course.kind === 'date_range'
      ? dayjs(course.endDate)
      : course.kind === 'n_days'
        ? rangeStart.add(course.days, 'day')
        : dayjs(horizon);

  const effectiveEnd = dayjs.min(dayjs(horizon), rangeEnd)!;

  const dailyTimes: string[] = [];

  if (config.type === 'fixed_times') {
    dailyTimes.push(...config.fixedTimes.times);
  } else if (config.type === 'interval') {
    const {intervalHours, startTime} = config.interval;
    const [sh, sm] = startTime.split(':').map(Number);
    let cursor = sh * 60 + sm;
    while (cursor < 24 * 60) {
      const hh = String(Math.floor(cursor / 60)).padStart(2, '0');
      const mm = String(cursor % 60).padStart(2, '0');
      dailyTimes.push(`${hh}:${mm}`);
      cursor += intervalHours * 60;
    }
  } else if (config.type === 'meal_relative') {
    const {relation, offsetMinutes, mealsPerDay} = config.mealRelative;
    const slots: Reminder.MealSlot[] = ['breakfast', 'lunch', 'dinner'];
    const activeMeals = slots.slice(0, mealsPerDay);
    for (const meal of activeMeals) {
      const mealTime = mealTimes[meal];
      if (!mealTime) continue;
      const [mh, mmn] = mealTime.split(':').map(Number);
      const offset =
        relation === 'before_meal'
          ? -offsetMinutes
          : relation === 'after_meal'
            ? offsetMinutes
            : 0;
      const total = mh * 60 + mmn + offset;
      const hh = String(Math.floor(Math.max(0, total) / 60)).padStart(2, '0');
      const mm = String(Math.max(0, total) % 60).padStart(2, '0');
      dailyTimes.push(`${hh}:${mm}`);
    }
  }

  let day = dayjs(now).startOf('day');
  while (day.isBefore(effectiveEnd) || day.isSame(effectiveEnd, 'day')) {
    if (day.isBefore(rangeStart, 'day')) {
      day = day.add(1, 'day');
      continue;
    }
    if (
      schedule.daysOfWeek &&
      !schedule.daysOfWeek.includes(day.day() as Reminder.DayOfWeek)
    ) {
      day = day.add(1, 'day');
      continue;
    }

    for (const time of dailyTimes) {
      const [h, m] = time.split(':').map(Number);
      const doseTime = day.hour(h).minute(m).second(0).millisecond(0);
      if (doseTime.toDate() > now && !doseTime.isAfter(effectiveEnd)) {
        doses.push({
          medicationId: medication.id,
          scheduledAt: doseTime.toDate(),
        });
      }
    }
    day = day.add(1, 'day');
  }

  return doses.sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
  );
}

export async function scheduleDoseNotification(
  medication: Reminder.Medication,
  memberName: string,
  scheduledAt: Date,
): Promise<string> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: scheduledAt.getTime(),
    alarmManager: {allowWhileIdle: true},
  };

  const notificationId = makeDoseNotificationId(medication.id, scheduledAt);

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: medication.name,
      body: `${medication.dosage} — ${memberName} uchin`,
      data: {
        type: 'medication_reminder',
        medicationId: medication.id,
        memberId: medication.memberId,
        scheduledAt: scheduledAt.toISOString(),
        snoozeIndex: '0',
        drugName: medication.name,
        dosage: medication.dosage,
        memberName,
      },
      android: {
        channelId: CHANNEL_MEDICATION,
        pressAction: {id: 'default'},
        actions: [
          {title: 'Kabul et', pressAction: {id: 'take'}},
          {title: 'Yzyna goj', pressAction: {id: 'snooze'}},
          {title: 'Gechir', pressAction: {id: 'skip'}},
        ],
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `${medication.dosage} ${medication.name} — ${memberName} uchin`,
        },
      },
      ios: {
        categoryId: CATEGORY_MEDICATION,
        sound: 'default',
        interruptionLevel: 'timeSensitive',
      },
    },
    trigger,
  );

  return notificationId;
}
