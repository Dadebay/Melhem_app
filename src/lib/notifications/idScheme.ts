import dayjs from 'dayjs';

export function makeDoseNotificationId(
  medicationId: string,
  scheduledAt: Date,
  snoozeIndex: number = 0,
): string {
  const date = dayjs(scheduledAt).format('YYYYMMDD');
  const time = dayjs(scheduledAt).format('HHmm');
  return `med:${medicationId}:dose:${date}:${time}:snz:${snoozeIndex}`;
}

export function makeMissedCheckId(
  medicationId: string,
  scheduledAt: Date,
): string {
  const date = dayjs(scheduledAt).format('YYYYMMDD');
  const time = dayjs(scheduledAt).format('HHmm');
  return `chk:${medicationId}:${date}:${time}`;
}

export function parseDoseNotificationId(id: string) {
  const parts = id.split(':');
  if (parts.length !== 7 || parts[0] !== 'med') return null;
  return {
    medicationId: parts[1],
    date: parts[3],
    time: parts[4],
    snoozeIndex: parseInt(parts[6], 10),
  };
}
