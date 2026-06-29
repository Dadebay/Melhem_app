import dayjs from 'dayjs';

const PharmacyTodayWorkingHours = (
  operatingHours: Record<WeekDays, Pharmacy.DailyHours>,
) => {
  const now = dayjs();
  const today = now.format('dddd').toLowerCase() as WeekDays; // e.g., 'monday'

  const hours = operatingHours[today];
  if (!hours) {
    return {
      open: '',
      close: '',
    };
  } // no hours defined for today

  return {
    open: hours.open,
    close: hours.close,
  };
};

export default PharmacyTodayWorkingHours;
