export function formatTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getDateStr(date: Date): string {
  // Use local calendar components — toISOString() would convert to UTC and
  // shift the date back for early-morning local times in positive timezones
  // (e.g. UTC+5 in Turkmenistan), causing doses to land on the wrong day.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns true if the given course is active on `dateStr` (YYYY-MM-DD),
 * comparing whole calendar days (timezone-safe).
 */
export function isCourseActiveOn(
  course: Reminder.CourseDuration,
  dateStr: string,
): boolean {
  if (dateStr < course.startDate) {
    return false;
  }
  if (course.kind === 'date_range') {
    return dateStr <= course.endDate;
  }
  if (course.kind === 'n_days') {
    // startDate counts as day 1, so the last active day is start + (days - 1).
    const start = new Date(`${course.startDate}T00:00:00`);
    const last = new Date(start);
    last.setDate(last.getDate() + course.days - 1);
    return dateStr <= getDateStr(last);
  }
  return true; // indefinite
}

export function getTodayDoseTimes(
  medications: Reminder.Medication[],
  schedules: Reminder.Schedule[],
  mealTimes: Record<Reminder.MealSlot, string>,
  forDate?: Date,
): Array<{medicationId: string; time: string; scheduleId: string}> {
  const result: Array<{
    medicationId: string;
    time: string;
    scheduleId: string;
  }> = [];
  const today = forDate ?? new Date();
  const dayOfWeek = today.getDay() as Reminder.DayOfWeek;
  const todayStr = getDateStr(today);

  const activeMeds = medications.filter(m => m.isActive);

  for (const med of activeMeds) {
    const medSchedules = schedules.filter(
      s => s.medicationId === med.id && s.isActive,
    );

    for (const schedule of medSchedules) {
      if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(dayOfWeek)) {
        continue;
      }

      if (!isCourseActiveOn(schedule.course, todayStr)) {
        continue;
      }

      const {config} = schedule;
      const times: string[] = [];

      if (config.type === 'fixed_times') {
        times.push(...config.fixedTimes.times);
      } else if (config.type === 'interval') {
        const startMins = formatTimeToMinutes(config.interval.startTime);
        const intervalMins = config.interval.intervalHours * 60;
        let current = startMins;
        while (current < 24 * 60) {
          times.push(minutesToTime(current));
          current += intervalMins;
        }
      } else if (config.type === 'meal_relative') {
        const meals: Reminder.MealSlot[] = ['breakfast', 'lunch', 'dinner'];
        const mealsToUse = meals.slice(0, config.mealRelative.mealsPerDay);
        for (const meal of mealsToUse) {
          const mealMins = formatTimeToMinutes(mealTimes[meal]);
          const offset = config.mealRelative.offsetMinutes;
          const relation = config.mealRelative.relation;
          let timeMins = mealMins;
          if (relation === 'before_meal') {
            timeMins = mealMins - offset;
          } else if (relation === 'after_meal') {
            timeMins = mealMins + offset;
          }
          times.push(minutesToTime(Math.max(0, timeMins)));
        }
      }

      for (const t of times) {
        result.push({
          medicationId: med.id,
          time: t,
          scheduleId: schedule.id,
        });
      }
    }
  }

  result.sort((a, b) => a.time.localeCompare(b.time));
  return result;
}

/**
 * Compute current streak: consecutive days (going back from yesterday)
 * where all scheduled doses were taken.
 */
export function computeCurrentStreak(
  intakeLogs: Reminder.IntakeLog[],
  schedules: Reminder.Schedule[],
  medications: Reminder.Medication[],
  mealTimes: Record<Reminder.MealSlot, string>,
): number {
  let streak = 0;
  const today = new Date();

  for (let daysBack = 1; daysBack <= 365; daysBack++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    const dateStr = getDateStr(date);

    const doses = getTodayDoseTimes(medications, schedules, mealTimes, date);
    if (doses.length === 0) {
      break;
    }

    const dayLogs = intakeLogs.filter(
      l => l.scheduledTime.slice(0, 10) === dateStr,
    );
    const takenCount = dayLogs.filter(l => l.status === 'taken').length;

    if (takenCount >= doses.length) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Compute best streak: longest consecutive run of fully-taken days.
 */
export function computeBestStreak(
  intakeLogs: Reminder.IntakeLog[],
  schedules: Reminder.Schedule[],
  medications: Reminder.Medication[],
  mealTimes: Record<Reminder.MealSlot, string>,
): number {
  let best = 0;
  let streak = 0;
  const today = new Date();

  for (let daysBack = 1; daysBack <= 365; daysBack++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    const dateStr = getDateStr(date);

    const doses = getTodayDoseTimes(medications, schedules, mealTimes, date);
    if (doses.length === 0) {
      if (streak > best) {
        best = streak;
      }
      streak = 0;
      continue;
    }

    const dayLogs = intakeLogs.filter(
      l => l.scheduledTime.slice(0, 10) === dateStr,
    );
    const takenCount = dayLogs.filter(l => l.status === 'taken').length;

    if (takenCount >= doses.length) {
      streak++;
    } else {
      if (streak > best) {
        best = streak;
      }
      streak = 0;
    }
  }

  if (streak > best) {
    best = streak;
  }
  return best;
}

/** @deprecated Use computeCurrentStreak instead */
export const computeStreak = computeCurrentStreak;
