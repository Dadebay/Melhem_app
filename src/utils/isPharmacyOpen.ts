import dayjs from 'dayjs';

const isPharmacyOpen = (
  operatingHours: Record<WeekDays, Pharmacy.DailyHours>,
) => {
  const now = dayjs();
  const today = now.format('dddd').toLowerCase() as WeekDays; // e.g., 'monday'

  const hours = operatingHours[today];
  if (!hours) {
    return false;
  } // no hours defined for today

  const openTime = dayjs(`${now.format('YYYY-MM-DD')}T${hours.open}`);
  const closeTime = dayjs(`${now.format('YYYY-MM-DD')}T${hours.close}`);

  return now.isAfter(openTime) && now.isBefore(closeTime);
};

export default isPharmacyOpen;
