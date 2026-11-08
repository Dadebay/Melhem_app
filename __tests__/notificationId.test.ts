import {
  makeDoseNotificationId,
  parseDoseNotificationId,
} from '../src/lib/notifications/idScheme';

describe('dose notification IDs', () => {
  it('keeps the medication, time and snooze number together', () => {
    const date = new Date(2026, 10, 8, 9, 30);
    const id = makeDoseNotificationId('med-42', date, 2);
    expect(parseDoseNotificationId(id)).toEqual({
      medicationId: 'med-42',
      date: '20261108',
      time: '0930',
      snoozeIndex: 2,
    });
  });

  it('rejects unrelated notification IDs', () => {
    expect(parseDoseNotificationId('other:42')).toBeNull();
  });
});
