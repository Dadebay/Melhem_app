import {useLayoutEffect, useMemo, useState} from 'react';
import {Alert, FlatList, Pressable, Text, View} from 'react-native';
import Animated, {FadeInRight, Layout} from 'react-native-reanimated';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useShallow} from 'zustand/react/shallow';
import {
  Beaker,
  Brush,
  ChevronRight,
  Droplets,
  Edit3,
  MoreHorizontal,
  Pause,
  Pill,
  Play,
  Plus,
  Syringe,
  Trash2,
  Wind,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import {rescheduleAllNotifications} from '../../lib/notifications/reschedule';

type Props = NativeStackScreenProps<Nav.Reminder, 'MedicationsList'>;

type FilterKey = 'all' | 'active' | 'completed' | 'paused';

const FILTER_KEYS: Record<FilterKey, string> = {
  all: 'reminders.all',
  active: 'settings.active',
  completed: 'settings.completed',
  paused: 'medicationsList.paused',
};

const FORM_ICONS: Record<
  Reminder.MedicationForm,
  React.ComponentType<{size: number; color: string; strokeWidth: number}>
> = {
  tablet: Pill,
  capsule: Pill,
  liquid: Beaker,
  drops: Droplets,
  injection: Syringe,
  inhaler: Wind,
  topical: Brush,
  suppository: Pill,
  patch: Pill,
  other: MoreHorizontal,
};

function getScheduleSummary(
  schedule: Reminder.Schedule | undefined,
  t: (key: string, opts?: any) => string,
): string {
  if (!schedule) {
    return '';
  }
  const {config} = schedule;
  if (config.type === 'fixed_times') {
    const count = config.fixedTimes.times.length;
    return t('medicationsList.timesPerDay', {count});
  }
  if (config.type === 'interval') {
    return t('medicationsList.everyNHours', {
      hours: config.interval.intervalHours,
    });
  }
  if (config.type === 'meal_relative') {
    const labels: Record<Reminder.MealRelation, string> = {
      before_meal: t('addMedication.beforeMeal'),
      after_meal: t('addMedication.afterMeal'),
      with_meal: t('addMedication.withMeals'),
    };
    return labels[config.mealRelative.relation];
  }
  return '';
}

function getCourseProgress(
  schedule: Reminder.Schedule | undefined,
): {current: number; total: number} | null {
  if (!schedule) {
    return null;
  }
  const {course} = schedule;
  if (course.kind === 'indefinite') {
    return null;
  }

  const start = new Date(course.startDate);
  const today = new Date();
  const daysSinceStart = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / 86400000),
  );

  if (course.kind === 'n_days') {
    return {current: Math.min(daysSinceStart, course.days), total: course.days};
  }
  if (course.kind === 'date_range') {
    const end = new Date(course.endDate);
    const totalDays = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / 86400000),
    );
    return {current: Math.min(daysSinceStart, totalDays), total: totalDays};
  }

  return null;
}

function isCourseCompleted(schedule: Reminder.Schedule): boolean {
  const {course} = schedule;
  const todayStr = new Date().toISOString().slice(0, 10);

  if (course.kind === 'date_range') {
    return course.endDate < todayStr;
  }
  if (course.kind === 'n_days') {
    const start = new Date(course.startDate);
    const end = new Date(start.getTime() + course.days * 86400000);
    return end.toISOString().slice(0, 10) < todayStr;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const MedicationsListScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const [filter, setFilter] = useState<FilterKey>('all');

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    activeMemberId,
    medications,
    schedules,
    toggleMedicationActive,
    removeMedication,
  } = reminderStore(
    useShallow(state => ({
      activeMemberId: state.activeMemberId,
      medications: state.medications,
      schedules: state.schedules,
      toggleMedicationActive: state.toggleMedicationActive,
      removeMedication: state.removeMedication,
    })),
  );

  const memberId = route.params?.memberId ?? activeMemberId;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('AddMedication', {memberId})}
          hitSlop={8}>
          <Plus size={22} color={colors.$textPrimary} strokeWidth={1.5} />
        </Pressable>
      ),
    });
  }, [navigation, memberId, colors.$textPrimary]);

  const memberMeds = useMemo(
    () => medications.filter(m => m.memberId === memberId),
    [medications, memberId],
  );

  const filteredMeds = useMemo(() => {
    return memberMeds.filter(med => {
      const medSchedules = schedules.filter(s => s.medicationId === med.id);

      switch (filter) {
        case 'all':
          return true;
        case 'active':
          return med.isActive && !medSchedules.some(s => isCourseCompleted(s));
        case 'completed':
          return medSchedules.some(s => isCourseCompleted(s));
        case 'paused':
          return !med.isActive;
        default:
          return true;
      }
    });
  }, [memberMeds, schedules, filter]);

  const getFirstSchedule = (medId: string): Reminder.Schedule | undefined => {
    return schedules.find(s => s.medicationId === medId);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      t('common.delete'),
      t('medicationsList.deleteConfirm', {name}),
      [
        {text: t('common.no'), style: 'cancel'},
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setExpandedId(null);
            removeMedication(id);
          },
        },
      ],
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: Reminder.Medication;
    index: number;
  }) => {
    const schedule = getFirstSchedule(item.id);
    const summary = getScheduleSummary(schedule, t);
    const progress = getCourseProgress(schedule);
    const FormIcon = FORM_ICONS[item.form] || Pill;
    const isExpanded = expandedId === item.id;

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 50).duration(300)}
        layout={Layout.springify()}>
        <Pressable
          onPress={() =>
            navigation.navigate('MedicationDetail', {medicationId: item.id})
          }
          onLongPress={() => setExpandedId(isExpanded ? null : item.id)}
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 14,
            padding: 14,
            opacity: item.isActive ? 1 : 0.6,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {/* Icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: item.color + '26',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <FormIcon size={20} color={item.color} strokeWidth={1.5} />
            </View>

            {/* Info */}
            <View style={{flex: 1, marginLeft: 12}}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}
                numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.$textSecondary,
                  marginTop: 1,
                }}>
                {item.dosage}
              </Text>
              {summary ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.$textSecondary,
                    marginTop: 1,
                  }}>
                  {summary}
                </Text>
              ) : null}
              {progress && (
                <View style={{marginTop: 6}}>
                  <View
                    style={{
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: colors.$border,
                    }}>
                    <View
                      style={{
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: colors.$brandActive,
                        width: `${Math.min(
                          100,
                          (progress.current / progress.total) * 100,
                        )}%`,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.$textSecondary,
                      marginTop: 2,
                    }}>
                    {progress.current}/{progress.total}{' '}
                    {t('medicationsList.daysProgress')}
                  </Text>
                </View>
              )}
              {item.remainingPills !== undefined && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 4,
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        item.remainingPills <= 5
                          ? colors.$error
                          : colors.$textSecondary,
                      fontWeight: item.remainingPills <= 5 ? '600' : '400',
                    }}>
                    {t('medicationsList.pillsLeft', {
                      count: item.remainingPills,
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Chevron */}
            <ChevronRight
              size={16}
              color={colors.$textSecondary}
              strokeWidth={1.5}
            />
          </View>

          {/* Quick Actions (on long press) */}
          {isExpanded && (
            <Animated.View
              entering={FadeInRight.duration(200)}
              style={{
                flexDirection: 'row',
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.$border,
                gap: 8,
              }}>
              <Pressable
                onPress={() => {
                  setExpandedId(null);
                  navigation.navigate('EditMedication', {
                    medicationId: item.id,
                  });
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.$infoBg,
                }}>
                <Edit3 size={14} color={colors.$info} strokeWidth={1.5} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.$info,
                  }}>
                  {t('common.edit')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setExpandedId(null);
                  toggleMedicationActive(item.id);
                  rescheduleAllNotifications();
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.$warningBg,
                }}>
                {item.isActive ? (
                  <Pause size={14} color={colors.$warning} strokeWidth={1.5} />
                ) : (
                  <Play size={14} color={colors.$success} strokeWidth={1.5} />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: item.isActive ? colors.$warning : colors.$success,
                  }}>
                  {item.isActive
                    ? t('medicationsList.pause')
                    : t('medicationsList.resume')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item.id, item.name)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.$errorBg,
                }}>
                <Trash2 size={14} color={colors.$error} strokeWidth={1.5} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.$error,
                  }}>
                  {t('common.delete')}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  // Empty state
  if (memberMeds.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          backgroundColor: colors.$background,
        }}>
        <Pill size={64} color={colors.$textSecondary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            textAlign: 'center',
            color: colors.$textPrimary,
            marginTop: 12,
          }}>
          {t('reminders.noMedications')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            textAlign: 'center',
            color: colors.$textSecondary,
            marginTop: 4,
          }}>
          {t('reminders.noMedicationsHint')}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('AddMedication', {memberId})}
          style={{
            backgroundColor: colors.$brandActive,
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 14,
            marginTop: 16,
          }}>
          <Text
            style={{
              color: colors.$brandActiveText,
              fontWeight: '600',
              fontSize: 15,
            }}>
            {t('reminders.addFirstMedication')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      {/* Filter Chips */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
        }}>
        {(['all', 'active', 'completed', 'paused'] as FilterKey[]).map(key => {
          const isSelected = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: isSelected
                  ? colors.$brandActive
                  : colors.$surface,
              }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: isSelected
                    ? colors.$brandActiveText
                    : colors.$textSecondary,
                }}>
                {t(FILTER_KEYS[key])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Medications List */}
      <FlatList
        data={filteredMeds}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={{
              paddingTop: 60,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 14,
                color: colors.$textSecondary,
                textAlign: 'center',
              }}>
              {t('medicationsList.noFilterResults')}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MedicationsListScreen;
