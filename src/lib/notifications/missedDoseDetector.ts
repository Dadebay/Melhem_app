import dayjs from 'dayjs';
import reminderStore from '../store/reminderStore';

const GRACE_WINDOW_MINUTES = 30;

export function detectMissedDoses(): void {
  const {intakeLogs, updateIntakeStatus} = reminderStore.getState();
  const cutoff = dayjs().subtract(GRACE_WINDOW_MINUTES, 'minute');

  for (const log of intakeLogs) {
    if (log.status === 'taken' || log.status === 'skipped' || log.status === 'missed') {
      continue;
    }
    if (dayjs(log.scheduledTime).isBefore(cutoff)) {
      updateIntakeStatus(log.id, 'missed');
    }
  }
}
