import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {Flame, Trophy} from 'lucide-react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import AdherenceRing from '../../components/AdherenceRing';
import {useShallow} from 'zustand/react/shallow';
import {computeAdherence} from './helpers';
import {computeCurrentStreak, computeBestStreak} from '../Reminders/helpers';

type Props = NativeStackScreenProps<Nav.Reminder, 'Statistics'>;
type Period = 'week' | 'month' | '3months' | 'all';

const PERIOD_KEYS: Record<Period, string> = {
  week: 'statistics.week',
  month: 'statistics.month',
  '3months': 'statistics.threeMonths',
  all: 'statistics.all',
};

const PERIODS: Period[] = ['week', 'month', '3months', 'all'];

function getPeriodDays(period: Period): number {
  switch (period) {
    case 'week':
      return 7;
    case 'month':
      return 30;
    case '3months':
      return 90;
    case 'all':
      return 365;
  }
}

const StatisticsScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const [period, setPeriod] = useState<Period>('week');

  const effectiveMemberId =
    route.params?.memberId ??
    reminderStore.getState().activeMemberId;

  const {intakeLogs, medications, schedules, mealTimes} = reminderStore(
    useShallow(state => ({
      intakeLogs: state.intakeLogs,
      medications: state.medications,
      schedules: state.schedules,
      mealTimes: state.mealTimes,
    })),
  );

  const memberLogs = useMemo(
    () => intakeLogs.filter(l => l.memberId === effectiveMemberId),
    [intakeLogs, effectiveMemberId],
  );

  const memberMedications = useMemo(
    () =>
      medications.filter(
        m => m.memberId === effectiveMemberId && m.isActive,
      ),
    [medications, effectiveMemberId],
  );

  const memberSchedules = useMemo(
    () => {
      const medIds = new Set(memberMedications.map(m => m.id));
      return schedules.filter(s => medIds.has(s.medicationId));
    },
    [schedules, memberMedications],
  );

  const periodDays = getPeriodDays(period);
  const adherence = useMemo(
    () => computeAdherence(memberLogs, periodDays),
    [memberLogs, periodDays],
  );
  const currentStreak = useMemo(
    () => computeCurrentStreak(memberLogs, memberSchedules, memberMedications, mealTimes),
    [memberLogs, memberSchedules, memberMedications, mealTimes],
  );
  const bestStreak = useMemo(
    () => computeBestStreak(memberLogs, memberSchedules, memberMedications, mealTimes),
    [memberLogs, memberSchedules, memberMedications, mealTimes],
  );

  // Daily bar chart data
  const barData = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : periodDays;
    const displayDays = Math.min(days, 90);
    const result: {date: string; label: string; taken: number; total: number}[] = [];
    const today = dayjs();

    for (let i = displayDays - 1; i >= 0; i--) {
      const date = today.subtract(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayLogs = memberLogs.filter(
        l => dayjs(l.scheduledTime).format('YYYY-MM-DD') === dateStr,
      );
      result.push({
        date: dateStr,
        label: date.format('dd').charAt(0),
        taken: dayLogs.filter(l => l.status === 'taken').length,
        total: dayLogs.length,
      });
    }
    return result;
  }, [memberLogs, period, periodDays]);

  const maxDoses = useMemo(
    () => Math.max(1, ...barData.map(d => d.total)),
    [barData],
  );

  // Per-medication breakdown
  const medBreakdown = useMemo(() => {
    const cutoff = dayjs().subtract(periodDays, 'day').startOf('day');
    return memberMedications.map(med => {
      const medLogs = memberLogs.filter(
        l =>
          l.medicationId === med.id &&
          dayjs(l.scheduledTime).isAfter(cutoff),
      );
      const taken = medLogs.filter(l => l.status === 'taken').length;
      const total = medLogs.length;
      const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
      return {id: med.id, name: med.name, color: med.color, pct, taken, total};
    });
  }, [memberMedications, memberLogs, periodDays]);

  const barWidth = period === 'week' ? 24 : 8;

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Period selector */}
      <View style={{flexDirection: 'row', gap: 8}}>
        {PERIODS.map(p => {
          const isActive = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: isActive
                  ? colors.$brandActive
                  : colors.$surface,
              }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isActive ? '#FFFFFF' : colors.$textPrimary,
                }}>
                {t(PERIOD_KEYS[p])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Overall adherence */}
      <View style={{alignItems: 'center', paddingVertical: 8}}>
        <AdherenceRing
          percentage={adherence}
          size={120}
          label={t('statistics.overallAdherence')}
        />
      </View>

      {/* Streak cards */}
      <View style={{flexDirection: 'row', gap: 12}}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.$surface,
            borderRadius: 14,
            padding: 16,
            alignItems: 'center',
            gap: 4,
          }}>
          <Flame size={24} color={colors.$warning} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.$textPrimary,
            }}>
            {currentStreak}
          </Text>
          <Text style={{fontSize: 12, color: colors.$textPrimary}}>{t('statistics.day')}</Text>
          <Text style={{fontSize: 12, color: colors.$textSecondary}}>
            {t('statistics.currentStreak')}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.$surface,
            borderRadius: 14,
            padding: 16,
            alignItems: 'center',
            gap: 4,
          }}>
          <Trophy size={24} color={colors.$warning} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.$textPrimary,
            }}>
            {bestStreak}
          </Text>
          <Text style={{fontSize: 12, color: colors.$textPrimary}}>{t('statistics.day')}</Text>
          <Text style={{fontSize: 12, color: colors.$textSecondary}}>
            {t('statistics.bestStreak')}
          </Text>
        </View>
      </View>

      {/* Daily bar chart */}
      <View
        style={{
          backgroundColor: colors.$surface,
          borderRadius: 14,
          padding: 16,
        }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'flex-end',
            gap: period === 'week' ? 8 : 3,
            height: 120,
          }}>
          {barData.map(bar => {
            const totalHeight = bar.total > 0 ? (bar.total / maxDoses) * 80 : 0;
            const takenHeight =
              bar.total > 0 ? (bar.taken / maxDoses) * 80 : 0;
            const missedHeight = totalHeight - takenHeight;

            return (
              <View
                key={bar.date}
                style={{
                  width: barWidth,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: 100,
                }}>
                {bar.total > 0 ? (
                  <View
                    style={{
                      width: barWidth,
                      borderRadius: barWidth / 2,
                      overflow: 'hidden',
                    }}>
                    {missedHeight > 0 && (
                      <View
                        style={{
                          height: missedHeight,
                          backgroundColor: colors.$error,
                          opacity: 0.4,
                        }}
                      />
                    )}
                    {takenHeight > 0 && (
                      <View
                        style={{
                          height: takenHeight,
                          backgroundColor: colors.$success,
                        }}
                      />
                    )}
                  </View>
                ) : (
                  <View
                    style={{
                      width: barWidth,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.$border,
                      opacity: 0.3,
                    }}
                  />
                )}
                {period === 'week' && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.$textSecondary,
                      marginTop: 4,
                    }}>
                    {bar.label}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Per-medication breakdown */}
      {medBreakdown.length > 0 && (
        <View style={{gap: 10}}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.$textSecondary,
              marginLeft: 4,
            }}>
            {t('statistics.perMedication')}
          </Text>
          <View
            style={{
              backgroundColor: colors.$surface,
              borderRadius: 14,
              padding: 16,
              gap: 14,
            }}>
            {medBreakdown.map(med => (
              <Pressable
                key={med.id}
                onPress={() =>
                  navigation.navigate('MedicationDetail', {
                    medicationId: med.id,
                  })
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: med.color,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.$textPrimary,
                  }}
                  numberOfLines={1}>
                  {med.name}
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.$border,
                    opacity: 0.3,
                  }}>
                  <View
                    style={{
                      width: `${med.pct}%`,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.$success,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.$textPrimary,
                    width: 40,
                    textAlign: 'right',
                  }}>
                  {med.pct}%
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default StatisticsScreen;
