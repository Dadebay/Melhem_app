import dayjs from 'dayjs';

export function computeAdherence(
  logs: Reminder.IntakeLog[],
  days: number,
): number {
  const cutoff = dayjs().subtract(days, 'day').startOf('day');
  const filtered = logs.filter(l => dayjs(l.scheduledTime).isAfter(cutoff));
  if (filtered.length === 0) {
    return 0;
  }
  const taken = filtered.filter(l => l.status === 'taken').length;
  return (taken / filtered.length) * 100;
}
