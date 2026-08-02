import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {ChevronLeft, ChevronRight, Check, X, AlertCircle, Clock} from 'lucide-react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import dayjs, {Dayjs} from 'dayjs';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import {useShallow} from 'zustand/react/shallow';
import {getTodayDoseTimes} from '../Reminders/helpers';

type Props = NativeStackScreenProps<Nav.Reminder, 'CalendarView'>;

// Month and day header arrays are now loaded from i18n locale files

type DayAdherence = 'allTaken' | 'someTaken' | 'noneTaken' | 'scheduled' | 'none';

type SelectedDose = {
  id: string;
  medicationId: string;
  time: string;
  status: 'taken' | 'skipped' | 'missed' | 'scheduled';
  actualTime?: string;
};

const CalendarViewScreen = ({route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const memberId = route.params?.memberId;
  const medicationId = route.params?.medicationId;

  const {intakeLogs, medications, schedules, mealTimes, activeMemberId} =
    reminderStore(
      useShallow(state => ({
        intakeLogs: state.intakeLogs,
        medications: state.medications,
        schedules: state.schedules,
        mealTimes: state.mealTimes,
        activeMemberId: state.activeMemberId,
      })),
    );

  const effectiveMemberId = memberId ?? activeMemberId;

  const memberMedications = useMemo(
    () =>
      medications.filter(
        m =>
          m.memberId === effectiveMemberId &&
          m.isActive &&
          (!medicationId || m.id === medicationId),
      ),
    [medications, effectiveMemberId, medicationId],
  );

  const memberSchedules = useMemo(() => {
    const medIds = new Set(memberMedications.map(m => m.id));
    return schedules.filter(s => medIds.has(s.medicationId) && s.isActive);
  }, [schedules, memberMedications]);

  // Planned doses for a given calendar day, respecting schedule course bounds
  // (start date, n-days duration, day-of-week filters).
  const getPlannedDoses = useMemo(
    () => (date: Dayjs) =>
      getTodayDoseTimes(memberMedications, memberSchedules, mealTimes, date.toDate()),
    [memberMedications, memberSchedules, mealTimes],
  );

  const memberLogs = useMemo(
    () =>
      intakeLogs.filter(
        l =>
          l.memberId === effectiveMemberId &&
          (!medicationId || l.medicationId === medicationId),
      ),
    [intakeLogs, effectiveMemberId, medicationId],
  );

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day() === 0
      ? startOfMonth.subtract(6, 'day')
      : startOfMonth.subtract(startOfMonth.day() - 1, 'day');
    const days: Dayjs[] = [];
    let day = startDay;
    while (days.length < 42) {
      days.push(day);
      day = day.add(1, 'day');
      if (days.length >= 35 && day.isAfter(endOfMonth)) {
        break;
      }
    }
    while (days.length % 7 !== 0) {
      days.push(day);
      day = day.add(1, 'day');
    }
    return days;
  }, [currentMonth]);

  const getDayAdherence = (date: Dayjs): DayAdherence => {
    const dateStr = date.format('YYYY-MM-DD');
    const today = dayjs();

    // Doses planned for this day per the prescribed course/schedule.
    const plannedCount = getPlannedDoses(date).length;
    if (plannedCount === 0) {
      return 'none';
    }

    const takenCount = memberLogs.filter(
      l =>
        dayjs(l.scheduledTime).format('YYYY-MM-DD') === dateStr &&
        l.status === 'taken',
    ).length;

    if (takenCount >= plannedCount) {
      return 'allTaken';
    }
    if (takenCount > 0) {
      return 'someTaken';
    }
    // No doses taken yet — today and future days are still "scheduled",
    // only past days with nothing taken count as missed.
    if (!date.isBefore(today, 'day')) {
      return 'scheduled';
    }
    return 'noneTaken';
  };

  const getDotColor = (adherence: DayAdherence): string | null => {
    switch (adherence) {
      case 'allTaken':
        return colors.$success;
      case 'someTaken':
        return colors.$warning;
      case 'noneTaken':
        return colors.$error;
      case 'scheduled':
        return colors.$info;
      default:
        return null;
    }
  };

  const selectedDayLogs = useMemo<SelectedDose[]>(() => {
    if (!selectedDate) {
      return [];
    }
    const date = dayjs(selectedDate);
    const isPast = date.isBefore(dayjs(), 'day');
    const planned = getPlannedDoses(date);

    const dayLogs = memberLogs.filter(
      l => dayjs(l.scheduledTime).format('YYYY-MM-DD') === selectedDate,
    );

    if (planned.length === 0) {
      // No active course for this day — fall back to any historical logs.
      return dayLogs
        .map(l => ({
          id: l.id,
          medicationId: l.medicationId,
          time: dayjs(l.scheduledTime).format('HH:mm'),
          status: l.status,
          actualTime: l.actualTime,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
    }

    return planned
      .map(dose => {
        const log = dayLogs.find(
          l =>
            l.medicationId === dose.medicationId &&
            l.scheduleId === dose.scheduleId &&
            dayjs(l.scheduledTime).format('HH:mm') === dose.time,
        );
        const status: SelectedDose['status'] = log
          ? log.status
          : isPast
            ? 'missed'
            : 'scheduled';
        return {
          id: `${dose.scheduleId}-${dose.time}`,
          medicationId: dose.medicationId,
          time: dose.time,
          status,
          actualTime: log?.actualTime,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, memberLogs, getPlannedDoses]);

  const selectedDayStats = useMemo(() => {
    const taken = selectedDayLogs.filter(l => l.status === 'taken').length;
    return {taken, total: selectedDayLogs.length};
  }, [selectedDayLogs]);

  const getMedicationName = (medId: string): string => {
    return memberMedications.find(m => m.id === medId)?.name ?? '';
  };

  const getMedicationColor = (medId: string): string => {
    return memberMedications.find(m => m.id === medId)?.color ?? colors.$border;
  };

  const todayStr = dayjs().format('YYYY-MM-DD');
  const isCurrentMonth = (date: Dayjs) =>
    date.month() === currentMonth.month();

  const rows: Dayjs[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    rows.push(calendarDays.slice(i, i + 7));
  }

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <Check size={14} color={colors.$success} strokeWidth={2} />;
      case 'skipped':
        return <X size={14} color={colors.$error} strokeWidth={2} />;
      case 'missed':
        return <AlertCircle size={14} color={colors.$warning} strokeWidth={2} />;
      case 'scheduled':
        return <Clock size={14} color={colors.$info} strokeWidth={2} />;
      default:
        return null;
    }
  };

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'taken':
        return t('reminders.takenStatus');
      case 'skipped':
        return t('reminders.skipped');
      case 'missed':
        return t('reminders.missed');
      case 'scheduled':
        return t('reminders.scheduled');
      default:
        return '';
    }
  };

  const months = t('reminders.months', {returnObjects: true}) as string[];
  const dayHeaders = t('reminders.dayHeaders', {returnObjects: true}) as string[];

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Month navigator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}>
        <Pressable
          onPress={() => setCurrentMonth(prev => prev.subtract(1, 'month'))}
          hitSlop={12}>
          <ChevronLeft size={24} color={colors.$textPrimary} strokeWidth={1.5} />
        </Pressable>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: colors.$textPrimary,
          }}>
          {months[currentMonth.month()]} {currentMonth.year()}
        </Text>
        <Pressable
          onPress={() => setCurrentMonth(prev => prev.add(1, 'month'))}
          hitSlop={12}>
          <ChevronRight size={24} color={colors.$textPrimary} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Day headers */}
      <View style={{flexDirection: 'row'}}>
        {dayHeaders.map(day => (
          <View key={day} style={{flex: 1, alignItems: 'center'}}>
            <Text
              style={{
                fontSize: 12,
                color: colors.$textSecondary,
                textAlign: 'center',
              }}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{gap: 2}}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={{flexDirection: 'row'}}>
            {row.map(date => {
              const dateStr = date.format('YYYY-MM-DD');
              const inMonth = isCurrentMonth(date);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const adherence = getDayAdherence(date);
              const dotColor = getDotColor(adherence);

              return (
                <Pressable
                  key={dateStr}
                  onPress={() =>
                    setSelectedDate(prev => (prev === dateStr ? null : dateStr))
                  }
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View
                    style={[
                      {
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      isToday && {backgroundColor: colors.$brandActive},
                      isSelected &&
                        !isToday && {backgroundColor: colors.$infoBg},
                    ]}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isToday ? '700' : '400',
                        color: isToday
                          ? '#FFFFFF'
                          : !inMonth
                            ? colors.$textDisabled
                            : colors.$textPrimary,
                      }}>
                      {date.date()}
                    </Text>
                  </View>
                  {dotColor ? (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: dotColor,
                        marginTop: 2,
                      }}
                    />
                  ) : (
                    <View style={{width: 4, height: 4, marginTop: 2}} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected day detail */}
      {selectedDate && selectedDayLogs.length > 0 && (
        <View
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 14,
            padding: 16,
            gap: 12,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {dayjs(selectedDate).format('D')} {months[dayjs(selectedDate).month()]}
            </Text>
            <View
              style={{
                backgroundColor: colors.$infoBg,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}>
              <Text style={{fontSize: 12, color: colors.$info, fontWeight: '500'}}>
                {t('reminders.takenOf', {taken: selectedDayStats.taken, total: selectedDayStats.total})}
              </Text>
            </View>
          </View>

          {selectedDayLogs.map(log => (
            <View
              key={log.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 6,
                borderLeftWidth: 3,
                borderLeftColor: getMedicationColor(log.medicationId),
                paddingLeft: 10,
              }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.$textSecondary,
                  width: 40,
                }}>
                {log.time}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}
                numberOfLines={1}>
                {getMedicationName(log.medicationId)}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                {renderStatusIcon(log.status)}
                <Text style={{fontSize: 11, color: colors.$textSecondary}}>
                  {statusLabel(log.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedDate && selectedDayLogs.length === 0 && (
        <View
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 14,
            padding: 20,
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 14, color: colors.$textSecondary}}>
            {t('reminders.noScheduleForDay')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default CalendarViewScreen;
