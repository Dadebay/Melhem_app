import React, {useLayoutEffect, useState, useMemo, useCallback} from 'react';
import {Image, Pressable, ScrollView, Text, View, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Pill,
  Clock,
  Check,
  X,
  AlertCircle,
  Edit3,
  ExternalLink,
  Flame,
  Trophy,
} from 'lucide-react-native';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import AdherenceRing from '../../components/AdherenceRing';
import {computeCurrentStreak, computeBestStreak} from '../Reminders/helpers';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

type Props = NativeStackScreenProps<Nav.Reminder, 'MedicationDetail'>;

type Tab = 'history' | 'statistics';
type StatPeriod = 7 | 30 | 0;

const FORM_LABEL_KEYS: Record<string, string> = {
  tablet: 'reminders.formTablet',
  capsule: 'reminders.formCapsule',
  liquid: 'reminders.formLiquid',
  drops: 'reminders.formDrops',
  injection: 'reminders.formInjection',
  inhaler: 'reminders.formInhaler',
  topical: 'reminders.formTopical',
  other: 'reminders.formOther',
};

const MedicationDetailScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const {medicationId} = route.params;

  const medication = reminderStore(
    s => s.medications.find(m => m.id === medicationId),
  );
  const schedule = reminderStore(
    s => s.schedules.find(sc => sc.medicationId === medicationId),
  );
  const allLogs = reminderStore(s => s.intakeLogs);
  const mealTimes = reminderStore(s => s.mealTimes);

  const [tab, setTab] = useState<Tab>('history');
  const [statPeriod, setStatPeriod] = useState<StatPeriod>(7);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() =>
            navigation.navigate('EditMedication', {medicationId})
          }
          hitSlop={8}>
          <Edit3
            size={20}
            color={colors.$textPrimary}
            strokeWidth={1.5}
          />
        </Pressable>
      ),
    });
  }, [navigation, medicationId, colors.$textPrimary]);

  const logs = useMemo(
    () =>
      allLogs
        .filter(l => l.medicationId === medicationId)
        .sort(
          (a, b) =>
            dayjs(b.scheduledTime).valueOf() -
            dayjs(a.scheduledTime).valueOf(),
        ),
    [allLogs, medicationId],
  );

  const scheduleTimes = useMemo(() => {
    if (!schedule) {
      return [];
    }
    if (schedule.config.type === 'fixed_times') {
      return schedule.config.fixedTimes.times;
    }
    if (schedule.config.type === 'interval') {
      const {intervalHours, startTime} = schedule.config.interval;
      const times: string[] = [];
      const [h, m] = startTime.split(':').map(Number);
      let hour = h;
      while (hour < 24) {
        times.push(
          `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        );
        hour += intervalHours;
      }
      return times;
    }
    return [];
  }, [schedule]);

  const courseProgress = useMemo(() => {
    if (!schedule || schedule.course.kind === 'indefinite') {
      return null;
    }
    const startDate = dayjs(schedule.course.startDate);
    const elapsed = dayjs().diff(startDate, 'day') + 1;
    const total =
      schedule.course.kind === 'n_days'
        ? schedule.course.days
        : dayjs(schedule.course.endDate).diff(startDate, 'day') + 1;
    return {elapsed: Math.min(elapsed, total), total};
  }, [schedule]);

  const groupedLogs = useMemo(() => {
    const cutoff = dayjs().subtract(30, 'day').startOf('day');
    const recent = logs.filter(l =>
      dayjs(l.scheduledTime).isAfter(cutoff),
    );

    const groups: Map<string, Reminder.IntakeLog[]> = new Map();
    for (const log of recent) {
      const dateKey = dayjs(log.scheduledTime).format('YYYY-MM-DD');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(log);
    }
    return groups;
  }, [logs]);

  const formatDateHeader = useCallback((dateStr: string) => {
    const d = dayjs(dateStr);
    if (d.isToday()) {
      return t('reminders.today');
    }
    if (d.isYesterday()) {
      return t('reminders.yesterday');
    }
    return d.format('D MMMM');
  }, [t]);

  const filteredLogs = useMemo(() => {
    if (statPeriod === 0) {
      return logs;
    }
    const cutoff = dayjs().subtract(statPeriod, 'day').startOf('day');
    return logs.filter(l => dayjs(l.scheduledTime).isAfter(cutoff));
  }, [logs, statPeriod]);

  const adherencePercentage = useMemo(() => {
    if (filteredLogs.length === 0) {
      return 0;
    }
    const taken = filteredLogs.filter(l => l.status === 'taken').length;
    return Math.round((taken / filteredLogs.length) * 100);
  }, [filteredLogs]);

  const memberMeds = useMemo(
    () => (medication ? [medication] : []),
    [medication],
  );
  const medSchedules = useMemo(
    () => (schedule ? [schedule] : []),
    [schedule],
  );

  const currentStreak = useMemo(
    () => computeCurrentStreak(logs, medSchedules, memberMeds, mealTimes),
    [logs, medSchedules, memberMeds, mealTimes],
  );
  const bestStreakVal = useMemo(
    () => computeBestStreak(logs, medSchedules, memberMeds, mealTimes),
    [logs, medSchedules, memberMeds, mealTimes],
  );

  const getStatusIcon = useCallback(
    (status: Reminder.IntakeStatus) => {
      switch (status) {
        case 'taken':
          return <Check size={14} color={colors.$success} strokeWidth={2} />;
        case 'skipped':
          return <X size={14} color={colors.$error} strokeWidth={2} />;
        case 'missed':
          return (
            <AlertCircle
              size={14}
              color={colors.$warning}
              strokeWidth={2}
            />
          );
      }
    },
    [colors],
  );

  const getStatusText = useCallback(
    (log: Reminder.IntakeLog) => {
      switch (log.status) {
        case 'taken':
          return log.actualTime
            ? t('reminders.takenAt', {time: dayjs(log.actualTime).format('HH:mm')})
            : t('reminders.takenStatus');
        case 'skipped':
          return t('reminders.skipped');
        case 'missed':
          return t('reminders.missed');
      }
    },
    [t],
  );

  if (!medication) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.$background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{color: colors.$textSecondary}}>
          {t('reminders.medicationNotFound')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.$background}}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Medication Info Card */}
      <View
        style={[styles.infoCard, {backgroundColor: colors.$surface}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          {medication.photoUri ? (
            <Image
              source={{uri: medication.photoUri}}
              style={{width: 48, height: 48, borderRadius: 24}}
            />
          ) : (
            <View
              style={[
                styles.iconCircle,
                {backgroundColor: medication.color + '26'},
              ]}>
              <Pill size={22} color={medication.color} strokeWidth={1.5} />
            </View>
          )}
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.$textPrimary,
              }}>
              {medication.name}
            </Text>
            {medication.dosage ? (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                  marginTop: 2,
                }}>
                {medication.dosage} &middot;{' '}
                {FORM_LABEL_KEYS[medication.form] ? t(FORM_LABEL_KEYS[medication.form]) : medication.form}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                  marginTop: 2,
                }}>
                {FORM_LABEL_KEYS[medication.form] ? t(FORM_LABEL_KEYS[medication.form]) : medication.form}
              </Text>
            )}
          </View>
        </View>

        {/* Schedule chips */}
        {scheduleTimes.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 12,
            }}>
            {scheduleTimes.map((t, i) => (
              <View
                key={i}
                style={[
                  styles.timeChip,
                  {backgroundColor: colors.$infoBg},
                ]}>
                <Clock
                  size={12}
                  color={colors.$info}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.$info,
                  }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Course progress */}
        {courseProgress && (
          <View style={{marginTop: 12, gap: 6}}>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.$border,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(
                    (courseProgress.elapsed / courseProgress.total) * 100,
                    100,
                  )}%`,
                  backgroundColor: colors.$brandActive,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.$textSecondary,
              }}>
              {t('reminders.daysCompleted', {elapsed: courseProgress.elapsed, total: courseProgress.total})}
            </Text>
          </View>
        )}
      </View>

      {/* Link to catalog */}
      {medication.drugId && (
        <Pressable
          onPress={() => {
            navigation.getParent()?.navigate('HomeTab', {
              screen: 'Drug',
              params: {id: medication.drugId},
            });
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: colors.$infoBg,
            borderRadius: 10,
            paddingVertical: 10,
          }}>
          <ExternalLink size={14} color={colors.$info} strokeWidth={1.5} />
          <Text style={{fontSize: 13, fontWeight: '500', color: colors.$info}}>
            {t('medicationDetail.viewInCatalog')}
          </Text>
        </Pressable>
      )}

      {/* Tabs */}
      <View
        style={[styles.tabBar, {borderBottomColor: colors.$border}]}>
        <Pressable
          onPress={() => setTab('history')}
          style={[
            styles.tabItem,
            tab === 'history' && {
              borderBottomWidth: 2,
              borderBottomColor: colors.$brandActive,
            },
          ]}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: tab === 'history' ? '700' : '500',
              color:
                tab === 'history'
                  ? colors.$textPrimary
                  : colors.$textSecondary,
            }}>
            {t('reminders.history')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('statistics')}
          style={[
            styles.tabItem,
            tab === 'statistics' && {
              borderBottomWidth: 2,
              borderBottomColor: colors.$brandActive,
            },
          ]}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: tab === 'statistics' ? '700' : '500',
              color:
                tab === 'statistics'
                  ? colors.$textPrimary
                  : colors.$textSecondary,
            }}>
            {t('reminders.statistics')}
          </Text>
        </Pressable>
      </View>

      {/* Tab content */}
      {tab === 'history' && (
        <View style={{gap: 16}}>
          {groupedLogs.size === 0 && (
            <Text
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                fontSize: 14,
                marginTop: 20,
              }}>
              {t('reminders.noHistory')}
            </Text>
          )}
          {Array.from(groupedLogs.entries()).map(([dateKey, dateLogs]) => (
            <View key={dateKey} style={{gap: 8}}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.$textSecondary,
                  marginLeft: 4,
                }}>
                {formatDateHeader(dateKey)}
              </Text>
              {dateLogs.map(log => (
                <View
                  key={log.id}
                  style={[
                    styles.logRow,
                    {backgroundColor: colors.$surface},
                  ]}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: colors.$textSecondary,
                      width: 44,
                    }}>
                    {dayjs(log.scheduledTime).format('HH:mm')}
                  </Text>
                  {getStatusIcon(log.status)}
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.$textPrimary,
                      flex: 1,
                    }}>
                    {getStatusText(log)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {tab === 'statistics' && (
        <View style={{gap: 20, alignItems: 'center'}}>
          <AdherenceRing
            percentage={adherencePercentage}
            size={100}
            label={t('reminders.adherence')}
          />

          {/* Period chips */}
          <View style={{flexDirection: 'row', gap: 8}}>
            {(
              [
                [7, t('addMedication.daysCount', {count: 7})],
                [30, t('addMedication.daysCount', {count: 30})],
                [0, t('reminders.all')],
              ] as [StatPeriod, string][]
            ).map(([period, label]) => (
              <Pressable
                key={period}
                onPress={() => setStatPeriod(period)}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor:
                      statPeriod === period
                        ? colors.$brandActive
                        : colors.$surface,
                  },
                ]}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color:
                      statPeriod === period
                        ? colors.$brandActiveText
                        : colors.$textPrimary,
                  }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Streak info */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              alignSelf: 'stretch',
            }}>
            <View
              style={[
                styles.streakCard,
                {backgroundColor: colors.$surface},
              ]}>
              <View style={[styles.streakIconWrap, {backgroundColor: colors.$warningBg}]}>
                <Flame
                  size={18}
                  color={colors.$warning}
                  strokeWidth={1.8}
                />
              </View>
              <View style={styles.streakValueRow}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '800',
                    color: colors.$textPrimary,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {currentStreak}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.$textSecondary,
                    marginLeft: 3,
                    marginBottom: 2,
                  }}>
                  {t('reminders.days')}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {t('reminders.currentStreak')}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.$textSecondary,
                  textAlign: 'center',
                  lineHeight: 15,
                }}>
                {t('reminders.currentStreakHint')}
              </Text>
            </View>
            <View
              style={[
                styles.streakCard,
                {backgroundColor: colors.$surface},
              ]}>
              <View style={[styles.streakIconWrap, {backgroundColor: colors.$statusPendingBg}]}>
                <Trophy
                  size={18}
                  color={colors.$statusPending}
                  strokeWidth={1.8}
                />
              </View>
              <View style={styles.streakValueRow}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '800',
                    color: colors.$textPrimary,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {bestStreakVal}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.$textSecondary,
                    marginLeft: 3,
                    marginBottom: 2,
                  }}>
                  {t('reminders.days')}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {t('reminders.bestStreak')}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.$textSecondary,
                  textAlign: 'center',
                  lineHeight: 15,
                }}>
                {t('reminders.bestStreakHint')}
              </Text>
            </View>
          </View>

          {/* Summary stats */}
          <View
            style={[
              styles.statsCard,
              {backgroundColor: colors.$surface},
            ]}>
            <View style={styles.statRow}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                }}>
                {t('reminders.total')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {filteredLogs.length}
              </Text>
            </View>
            <View
              style={[styles.statDivider, {backgroundColor: colors.$border}]}
            />
            <View style={styles.statRow}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                }}>
                {t('reminders.takenCount')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.$success,
                }}>
                {filteredLogs.filter(l => l.status === 'taken').length}
              </Text>
            </View>
            <View
              style={[styles.statDivider, {backgroundColor: colors.$border}]}
            />
            <View style={styles.statRow}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                }}>
                {t('reminders.missedCount')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.$error,
                }}>
                {filteredLogs.filter(l => l.status === 'missed').length}
              </Text>
            </View>
            <View
              style={[styles.statDivider, {backgroundColor: colors.$border}]}
            />
            <View style={styles.statRow}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                }}>
                {t('reminders.skippedCount')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.$warning,
                }}>
                {filteredLogs.filter(l => l.status === 'skipped').length}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  periodChip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  streakCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  streakIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  streakValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statsCard: {
    alignSelf: 'stretch',
    borderRadius: 14,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statDivider: {
    height: 1,
    marginVertical: 6,
  },
});

export default MedicationDetailScreen;
