import React, {useState, useMemo, useCallback} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Pill,
  Clock,
  Timer,
  UtensilsCrossed,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Edit3,
} from 'lucide-react-native';
import {Switch} from 'heroui-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import reminderStore from '../../lib/store/reminderStore';
import StepIndicator from '../../components/StepIndicator';
import MedicationFormSelector from '../../components/MedicationFormSelector';
import TimePickerModal from '../../components/TimePickerModal';
import {rescheduleAllNotifications} from '../../lib/notifications/reschedule';
import {formatTimeToMinutes, minutesToTime} from '../Reminders/helpers';

type Props = NativeStackScreenProps<Nav.Reminder, 'AddMedication'>;

const MEAL_SLOTS: Reminder.MealSlot[] = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABEL_KEYS: Record<Reminder.MealSlot, string> = {
  breakfast: 'settings.breakfast',
  lunch: 'settings.lunch',
  dinner: 'settings.dinner',
};

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['09:00'],
  2: ['09:00', '21:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
  5: ['07:00', '10:00', '13:00', '16:00', '20:00'],
};

const MIN_TIMES_PER_DAY = 1;
const MAX_TIMES_PER_DAY = 10;

// Build default intake times for an arbitrary count. Uses the curated presets
// for 1–5, otherwise distributes evenly across the waking window (08:00–22:00).
function buildTimesForCount(count: number): string[] {
  if (DEFAULT_TIMES[count]) {
    return DEFAULT_TIMES[count];
  }
  const startMins = 8 * 60;
  const endMins = 22 * 60;
  const span = endMins - startMins;
  const times: string[] = [];
  for (let i = 0; i < count; i++) {
    const mins = Math.round(startMins + (span * i) / Math.max(1, count - 1));
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    times.push(`${h}:${m}`);
  }
  return times;
}

const COLOR_PALETTE = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

const DOSAGE_UNIT_KEYS = ['mg', 'ml', 'tablet', 'drop'] as const;

const FORM_ICON_MAP: Record<Reminder.MedicationForm, string> = {
  tablet: 'Pill',
  capsule: 'CircleDot',
  liquid: 'FlaskConical',
  drops: 'Droplets',
  injection: 'Syringe',
  inhaler: 'Wind',
  topical: 'Hand',
  suppository: 'MoreHorizontal',
  patch: 'MoreHorizontal',
  other: 'MoreHorizontal',
};

const AddMedicationScreen = ({navigation, route}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();
  const {bottom: safeBottom} = useSafeAreaInsets();
  const addMedication = reminderStore(s => s.addMedication);
  const addSchedule = reminderStore(s => s.addSchedule);
  const activeMemberId = reminderStore(s => s.activeMemberId);
  const mealTimes = reminderStore(s => s.mealTimes);

  const stepLabels = t('addMedication.steps', {returnObjects: true}) as string[];

  const dayLabels: {label: string; value: Reminder.DayOfWeek}[] = [
    {label: t('addMedication.dayMon'), value: 1},
    {label: t('addMedication.dayTue'), value: 2},
    {label: t('addMedication.dayWed'), value: 3},
    {label: t('addMedication.dayThu'), value: 4},
    {label: t('addMedication.dayFri'), value: 5},
    {label: t('addMedication.daySat'), value: 6},
    {label: t('addMedication.daySun'), value: 0},
  ];

  const [step, setStep] = useState(0);
  const [name, setName] = useState(route.params?.drugName ?? '');
  const [form, setForm] = useState<Reminder.MedicationForm>('tablet');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [notes, setNotes] = useState('');
  const [scheduleType, setScheduleType] =
    useState<Reminder.ScheduleType>('fixed_times');
  const [fixedTimes, setFixedTimes] = useState<string[]>([
    '08:00',
    '14:00',
    '20:00',
  ]);
  const [timesPerDay, setTimesPerDay] = useState(3);
  const [intervalHours, setIntervalHours] = useState(8);
  const [intervalStart, setIntervalStart] = useState('08:00');
  const [mealRelation, setMealRelation] =
    useState<Reminder.MealRelation>('before_meal');
  const [mealOffset, setMealOffset] = useState(30);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [hasCourse, setHasCourse] = useState(false);
  const [courseDays, setCourseDays] = useState(14);
  const [courseStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [selectedDays, setSelectedDays] = useState<
    Reminder.DayOfWeek[] | undefined
  >(undefined);
  const [everyDay, setEveryDay] = useState(true);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [editingIntervalStart, setEditingIntervalStart] = useState(false);

  const memberId = route.params?.memberId ?? activeMemberId;

  const handleTimesPerDayChange = useCallback((count: number) => {
    const next = Math.min(MAX_TIMES_PER_DAY, Math.max(MIN_TIMES_PER_DAY, count));
    setTimesPerDay(next);
    setFixedTimes(prev => {
      if (next <= prev.length) {
        return prev.slice(0, next);
      }
      // Growing: keep the user's already-edited times, fill the rest with defaults.
      const generated = buildTimesForCount(next);
      return generated.map((g, i) => (i < prev.length ? prev[i] : g));
    });
  }, []);

  const handleFixedTimeEdit = useCallback((index: number) => {
    setEditingTimeIndex(index);
  }, []);

  const buildScheduleDescription = useMemo(() => {
    if (scheduleType === 'fixed_times') {
      return t('addMedication.fixedTimesDesc2', {count: timesPerDay, times: fixedTimes.join(', ')});
    }
    if (scheduleType === 'interval') {
      return t('addMedication.intervalDesc', {hours: intervalHours, start: intervalStart});
    }
    const relationText =
      mealRelation === 'before_meal'
        ? t('addMedication.mealBeforeDesc', {minutes: mealOffset})
        : mealRelation === 'after_meal'
          ? t('addMedication.mealAfterDesc', {minutes: mealOffset})
          : t('addMedication.duringMeal');
    return t('addMedication.mealScheduleDesc', {relation: relationText, count: mealsPerDay});
  }, [
    t,
    scheduleType,
    timesPerDay,
    fixedTimes,
    intervalHours,
    intervalStart,
    mealRelation,
    mealOffset,
    mealsPerDay,
  ]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert(t('addMedication.alertTitle'), t('addMedication.alertEnterName'));
      return;
    }

    const color =
      COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

    const medId = addMedication({
      name: name.trim(),
      dosage: dosage
        ? `${dosage} ${t(`addMedication.dosageUnits.${dosageUnit}`)}`
        : '',
      form,
      notes,
      color,
      iconName: FORM_ICON_MAP[form],
      drugId: route.params?.drugId,
      memberId,
    });

    let config: Reminder.ScheduleConfig;
    if (scheduleType === 'fixed_times') {
      config = {type: 'fixed_times', fixedTimes: {times: fixedTimes}};
    } else if (scheduleType === 'interval') {
      config = {
        type: 'interval',
        interval: {intervalHours, startTime: intervalStart},
      };
    } else {
      config = {
        type: 'meal_relative',
        mealRelative: {
          relation: mealRelation,
          offsetMinutes: mealRelation === 'with_meal' ? 0 : mealOffset,
          mealsPerDay,
        },
      };
    }

    const course: Reminder.CourseDuration = hasCourse
      ? {kind: 'n_days', startDate: courseStartDate, days: courseDays}
      : {kind: 'indefinite', startDate: courseStartDate};

    addSchedule({
      medicationId: medId,
      config,
      course,
      daysOfWeek: everyDay ? undefined : selectedDays,
    });

    // Schedule notifications immediately after adding
    rescheduleAllNotifications();

    Alert.alert('', t('addMedication.savedSuccess'), [
      {text: 'OK', onPress: () => navigation.goBack()},
    ]);
  }, [
    name,
    dosage,
    dosageUnit,
    form,
    notes,
    memberId,
    route.params?.drugId,
    scheduleType,
    fixedTimes,
    intervalHours,
    intervalStart,
    mealRelation,
    mealOffset,
    mealsPerDay,
    hasCourse,
    courseStartDate,
    courseDays,
    everyDay,
    selectedDays,
    addMedication,
    addSchedule,
    navigation,
  ]);

  const toggleDay = useCallback(
    (day: Reminder.DayOfWeek) => {
      setSelectedDays(prev => {
        const current = prev ?? [];
        if (current.includes(day)) {
          return current.filter(d => d !== day);
        }
        return [...current, day];
      });
    },
    [],
  );

  const renderStep0 = () => (
    <View style={{gap: 20}}>
      {/* Name */}
      <View style={{gap: 8}}>
        <Text style={[s.label, {color: colors.$textSecondary}]}>
          {t('addMedication.drugName')}
        </Text>
        <View
          style={[s.inputContainer, {backgroundColor: colors.$surface}]}>
          <TextInput
            style={[s.input, {color: colors.$textPrimary}]}
            value={name}
            onChangeText={setName}
            placeholder={t('addMedication.drugNamePlaceholder')}
            placeholderTextColor={colors.$textPlaceholder}
          />
        </View>
      </View>

      {/* Form */}
      <View style={{gap: 8}}>
        <Text style={[s.label, {color: colors.$textSecondary}]}>
          {t('addMedication.drugForm')}
        </Text>
        <MedicationFormSelector selected={form} onSelect={setForm} />
      </View>

      {/* Dosage */}
      <View style={{gap: 8}}>
        <Text style={[s.label, {color: colors.$textSecondary}]}>
          {t('addMedication.dosage')}
        </Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          <View
            style={[
              s.inputContainer,
              {backgroundColor: colors.$surface, flex: 1},
            ]}>
            <TextInput
              style={[s.input, {color: colors.$textPrimary}]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="500"
              placeholderTextColor={colors.$textPlaceholder}
              keyboardType="numeric"
            />
          </View>
          <View style={{flexDirection: 'row', gap: 4}}>
            {DOSAGE_UNIT_KEYS.map(unitKey => (
              <Pressable
                key={unitKey}
                onPress={() => setDosageUnit(unitKey)}
                style={[
                  s.chip,
                  {
                    backgroundColor:
                      dosageUnit === unitKey
                        ? colors.$brandActive
                        : colors.$surface,
                  },
                ]}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color:
                      dosageUnit === unitKey
                        ? colors.$brandActiveText
                        : colors.$textPrimary,
                  }}>
                  {t(`addMedication.dosageUnits.${unitKey}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={{gap: 8}}>
        <Text style={[s.label, {color: colors.$textSecondary}]}>
          {t('addMedication.notes')}
        </Text>
        <View
          style={[s.inputContainer, {backgroundColor: colors.$surface}]}>
          <TextInput
            style={[s.input, {color: colors.$textPrimary, minHeight: 60}]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('addMedication.notesPlaceholder')}
            placeholderTextColor={colors.$textPlaceholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  );

  const renderScheduleTypeCard = (
    type: Reminder.ScheduleType,
    icon: React.ReactNode,
    title: string,
    desc: string,
  ) => {
    const isSelected = scheduleType === type;
    return (
      <Pressable
        key={type}
        onPress={() => setScheduleType(type)}
        style={[
          s.scheduleCard,
          {
            backgroundColor: isSelected
              ? colors.$infoBg
              : colors.$surface,
            borderWidth: isSelected ? 1 : 0,
            borderColor: isSelected ? colors.$info : 'transparent',
          },
        ]}>
        {icon}
        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.$textSecondary,
              marginTop: 2,
            }}>
            {desc}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderStep1 = () => (
    <View style={{gap: 20}}>
      {/* Schedule type */}
      <View style={{gap: 8}}>
        <Text style={[s.label, {color: colors.$textSecondary}]}>
          {t('addMedication.scheduleType')}
        </Text>
        {renderScheduleTypeCard(
          'fixed_times',
          <Clock size={20} color={colors.$info} strokeWidth={1.5} />,
          t('addMedication.fixedTimes'),
          t('addMedication.fixedTimesDesc'),
        )}
        {renderScheduleTypeCard(
          'interval',
          <Timer size={20} color={colors.$info} strokeWidth={1.5} />,
          t('addMedication.everyNHours'),
          t('addMedication.everyNHoursDesc'),
        )}
        {renderScheduleTypeCard(
          'meal_relative',
          <UtensilsCrossed
            size={20}
            color={colors.$info}
            strokeWidth={1.5}
          />,
          t('addMedication.withMeals'),
          t('addMedication.withMealsDesc'),
        )}
      </View>

      {/* Sub-forms */}
      {scheduleType === 'fixed_times' && (
        <View style={{gap: 12}}>
          <Text style={[s.label, {color: colors.$textSecondary}]}>
            {t('addMedication.timesPerDay')}
          </Text>
          <View style={s.stepperRow}>
            <Pressable
              onPress={() => handleTimesPerDayChange(timesPerDay - 1)}
              disabled={timesPerDay <= MIN_TIMES_PER_DAY}
              style={[
                s.stepperBtn,
                {
                  backgroundColor: colors.$surface,
                  opacity: timesPerDay <= MIN_TIMES_PER_DAY ? 0.4 : 1,
                },
              ]}>
              <Minus size={16} color={colors.$textPrimary} strokeWidth={2} />
            </Pressable>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.$textPrimary,
                minWidth: 40,
                textAlign: 'center',
              }}>
              {timesPerDay}
            </Text>
            <Pressable
              onPress={() => handleTimesPerDayChange(timesPerDay + 1)}
              disabled={timesPerDay >= MAX_TIMES_PER_DAY}
              style={[
                s.stepperBtn,
                {
                  backgroundColor: colors.$surface,
                  opacity: timesPerDay >= MAX_TIMES_PER_DAY ? 0.4 : 1,
                },
              ]}>
              <Plus size={16} color={colors.$textPrimary} strokeWidth={2} />
            </Pressable>
            <Text
              style={{
                fontSize: 14,
                color: colors.$textSecondary,
                marginLeft: 8,
              }}>
              {t('addMedication.timesUnit')}
            </Text>
          </View>
          <View style={{gap: 8}}>
            {fixedTimes.map((time, i) => (
              <Pressable
                key={i}
                onPress={() => handleFixedTimeEdit(i)}
                style={[
                  s.timeRow,
                  {backgroundColor: colors.$surface},
                ]}>
                <Clock
                  size={16}
                  color={colors.$textSecondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '500',
                    color: colors.$textPrimary,
                    flex: 1,
                  }}>
                  {time}
                </Text>
                <Edit3
                  size={14}
                  color={colors.$textSecondary}
                  strokeWidth={1.5}
                />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {scheduleType === 'interval' && (
        <View style={{gap: 12}}>
          <Text style={[s.label, {color: colors.$textSecondary}]}>
            {t('addMedication.everyHour')}
          </Text>
          <View style={s.stepperRow}>
            <Pressable
              onPress={() =>
                setIntervalHours(h => Math.max(1, h - 1))
              }
              style={[s.stepperBtn, {backgroundColor: colors.$surface}]}>
              <Minus
                size={16}
                color={colors.$textPrimary}
                strokeWidth={2}
              />
            </Pressable>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.$textPrimary,
                minWidth: 40,
                textAlign: 'center',
              }}>
              {intervalHours}
            </Text>
            <Pressable
              onPress={() =>
                setIntervalHours(h => Math.min(24, h + 1))
              }
              style={[s.stepperBtn, {backgroundColor: colors.$surface}]}>
              <Plus
                size={16}
                color={colors.$textPrimary}
                strokeWidth={2}
              />
            </Pressable>
            <Text
              style={{
                fontSize: 14,
                color: colors.$textSecondary,
                marginLeft: 8,
              }}>
              {t('addMedication.hours')}
            </Text>
          </View>
          <Text style={[s.label, {color: colors.$textSecondary}]}>
            {t('addMedication.startTime')}
          </Text>
          <Pressable
            onPress={() => setEditingIntervalStart(true)}
            style={[s.timeRow, {backgroundColor: colors.$surface}]}>
            <Clock
              size={16}
              color={colors.$textSecondary}
              strokeWidth={1.5}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: colors.$textPrimary,
                flex: 1,
              }}>
              {intervalStart}
            </Text>
            <Edit3
              size={14}
              color={colors.$textSecondary}
              strokeWidth={1.5}
            />
          </Pressable>
        </View>
      )}

      {scheduleType === 'meal_relative' && (
        <View style={{gap: 12}}>
          {(
            [
              ['before_meal', t('addMedication.beforeMeal')],
              ['after_meal', t('addMedication.afterMeal')],
              ['with_meal', t('addMedication.duringMeal')],
            ] as [Reminder.MealRelation, string][]
          ).map(([rel, label]) => (
            <Pressable
              key={rel}
              onPress={() => setMealRelation(rel)}
              style={[
                s.scheduleCard,
                {
                  backgroundColor:
                    mealRelation === rel
                      ? colors.$infoBg
                      : colors.$surface,
                  borderWidth: mealRelation === rel ? 1 : 0,
                  borderColor:
                    mealRelation === rel ? colors.$info : 'transparent',
                },
              ]}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}>
                {label}
              </Text>
            </Pressable>
          ))}

          {mealRelation !== 'with_meal' && (
            <View style={{gap: 8}}>
              <Text style={[s.label, {color: colors.$textSecondary}]}>
                {t('addMedication.intervalMinutes')}
              </Text>
              <View style={{flexDirection: 'row', gap: 6}}>
                {[15, 30, 45, 60].map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setMealOffset(m)}
                    style={[
                      s.chip,
                      {
                        backgroundColor:
                          mealOffset === m
                            ? colors.$brandActive
                            : colors.$surface,
                        minWidth: 44,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color:
                          mealOffset === m
                            ? colors.$brandActiveText
                            : colors.$textPrimary,
                      }}>
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={{gap: 8}}>
            <Text style={[s.label, {color: colors.$textSecondary}]}>
              {t('addMedication.mealsPerDay')}
            </Text>
            <View style={{flexDirection: 'row', gap: 6}}>
              {[1, 2, 3].map(n => (
                <Pressable
                  key={n}
                  onPress={() => setMealsPerDay(n)}
                  style={[
                    s.chip,
                    {
                      backgroundColor:
                        mealsPerDay === n
                          ? colors.$brandActive
                          : colors.$surface,
                      minWidth: 40,
                    },
                  ]}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color:
                        mealsPerDay === n
                          ? colors.$brandActiveText
                          : colors.$textPrimary,
                    }}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Derived reminder times — surfaced from the meal schedule */}
          <View style={[s.sectionCard, {backgroundColor: colors.$surface, gap: 10}]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Clock size={16} color={colors.$info} strokeWidth={1.75} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {t('mealTimes.previewTitle')}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('MealTimes')}
                hitSlop={8}>
                <Text
                  style={{fontSize: 13, fontWeight: '600', color: colors.$info}}>
                  {t('mealTimes.edit')}
                </Text>
              </Pressable>
            </View>
            {MEAL_SLOTS.slice(0, mealsPerDay).map(slot => {
              const base = formatTimeToMinutes(mealTimes[slot]);
              const mins =
                mealRelation === 'before_meal'
                  ? base - mealOffset
                  : mealRelation === 'after_meal'
                    ? base + mealOffset
                    : base;
              return (
                <View
                  key={slot}
                  style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: colors.$textSecondary,
                    }}>
                    {t(MEAL_LABEL_KEYS[slot])} · {mealTimes[slot]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.$textPrimary,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {minutesToTime(Math.max(0, mins))}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Course */}
      <View
        style={[s.sectionCard, {backgroundColor: colors.$surface}]}>
        <View style={s.switchRow}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('addMedication.courseSet')}
            </Text>
          </View>
          <Switch
            isSelected={hasCourse}
            onSelectedChange={() => setHasCourse(!hasCourse)}
          />
        </View>
        {hasCourse && (
          <View style={{marginTop: 12, gap: 8}}>
            <View style={s.stepperRow}>
              <Pressable
                onPress={() =>
                  setCourseDays(d => Math.max(1, d - 1))
                }
                style={[
                  s.stepperBtn,
                  {backgroundColor: colors.$background},
                ]}>
                <Minus
                  size={16}
                  color={colors.$textPrimary}
                  strokeWidth={2}
                />
              </Pressable>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.$textPrimary,
                  minWidth: 40,
                  textAlign: 'center',
                }}>
                {courseDays}
              </Text>
              <Pressable
                onPress={() =>
                  setCourseDays(d => Math.min(365, d + 1))
                }
                style={[
                  s.stepperBtn,
                  {backgroundColor: colors.$background},
                ]}>
                <Plus
                  size={16}
                  color={colors.$textPrimary}
                  strokeWidth={2}
                />
              </Pressable>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textSecondary,
                  marginLeft: 8,
                }}>
                {t('reminders.days')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Days of week */}
      <View
        style={[s.sectionCard, {backgroundColor: colors.$surface}]}>
        <View style={s.switchRow}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('addMedication.everyDay')}
            </Text>
          </View>
          <Switch
            isSelected={everyDay}
            onSelectedChange={() => setEveryDay(!everyDay)}
          />
        </View>
        {!everyDay && (
          <View
            style={{
              flexDirection: 'row',
              gap: 6,
              marginTop: 12,
              flexWrap: 'wrap',
            }}>
            {dayLabels.map(({label, value}) => {
              const isOn = selectedDays?.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => toggleDay(value)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: isOn
                        ? colors.$brandActive
                        : colors.$background,
                      minWidth: 40,
                    },
                  ]}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: isOn
                        ? colors.$brandActiveText
                        : colors.$textPrimary,
                    }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View
      style={[s.summaryCard, {backgroundColor: colors.$surface}]}>
      {/* Medication info */}
      <View style={{gap: 4}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <Pill size={20} color={colors.$textPrimary} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.$textPrimary,
              }}>
              {name || t('addMedication.unnamedMedicine')}
            </Text>
          </View>
          <Pressable onPress={() => setStep(0)}>
            <Text style={{fontSize: 13, color: colors.$info}}>
              {t('addMedication.edit')}
            </Text>
          </Pressable>
        </View>
        {dosage ? (
          <Text style={{fontSize: 14, color: colors.$textSecondary}}>
            {dosage} {t(`addMedication.dosageUnits.${dosageUnit}`)}
          </Text>
        ) : null}
      </View>

      <View style={[s.divider, {backgroundColor: colors.$border}]} />

      {/* Schedule */}
      <View style={{gap: 4}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {t('addMedication.schedule')}
          </Text>
          <Pressable onPress={() => setStep(1)}>
            <Text style={{fontSize: 13, color: colors.$info}}>
              {t('addMedication.edit')}
            </Text>
          </Pressable>
        </View>
        <Text style={{fontSize: 14, color: colors.$textSecondary}}>
          {buildScheduleDescription}
        </Text>
      </View>

      <View style={[s.divider, {backgroundColor: colors.$border}]} />

      {/* Course */}
      <View style={{gap: 4}}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.$textPrimary,
          }}>
          {t('addMedication.duration')}
        </Text>
        <Text style={{fontSize: 14, color: colors.$textSecondary}}>
          {hasCourse ? `${courseDays} ${t('reminders.days')}` : t('addMedication.indefinite')}
        </Text>
      </View>

      {!everyDay && selectedDays && selectedDays.length > 0 && (
        <>
          <View
            style={[s.divider, {backgroundColor: colors.$border}]}
          />
          <View style={{gap: 4}}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('addMedication.daysLabel')}
            </Text>
            <Text style={{fontSize: 14, color: colors.$textSecondary}}>
              {dayLabels.filter(d => selectedDays.includes(d.value))
                .map(d => d.label)
                .join(', ')}
            </Text>
          </View>
        </>
      )}

      {notes ? (
        <>
          <View
            style={[s.divider, {backgroundColor: colors.$border}]}
          />
          <View style={{gap: 4}}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('addMedication.notes')}
            </Text>
            <Text style={{fontSize: 14, color: colors.$textSecondary}}>
              {notes}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );

  const canProceed =
    step === 0 ? name.trim().length > 0 : true;

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <StepIndicator currentStep={step} labels={stepLabels} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 90 + safeBottom,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={[
          s.bottomBar,
          {
            backgroundColor: colors.$background,
            borderTopColor: colors.$border,
            paddingBottom: Math.max(safeBottom, 12),
          },
        ]}>
        {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={[s.secondaryBtn, {borderColor: colors.$border}]}>
            <ChevronLeft
              size={16}
              color={colors.$textPrimary}
              strokeWidth={2}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('addMedication.back')}
            </Text>
          </Pressable>
        )}
        {step < 2 ? (
          <Pressable
            onPress={() => setStep(step + 1)}
            disabled={!canProceed}
            style={[
              s.primaryBtn,
              {
                backgroundColor: canProceed
                  ? colors.$brandActive
                  : colors.$textDisabled,
                flex: step === 0 ? 1 : undefined,
              },
            ]}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$brandActiveText,
              }}>
              {t('addMedication.continue')}
            </Text>
            <ChevronRight
              size={16}
              color={colors.$brandActiveText}
              strokeWidth={2}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSave}
            style={[
              s.primaryBtn,
              {backgroundColor: colors.$brandActive},
            ]}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$brandActiveText,
              }}>
              {t('addMedication.save')}
            </Text>
          </Pressable>
        )}
      </View>

      <TimePickerModal
        visible={editingTimeIndex !== null}
        initialTime={
          editingTimeIndex !== null ? fixedTimes[editingTimeIndex] : '08:00'
        }
        onConfirm={time => {
          if (editingTimeIndex !== null) {
            setFixedTimes(prev => {
              const next = [...prev];
              next[editingTimeIndex] = time;
              return next;
            });
          }
          setEditingTimeIndex(null);
        }}
        onCancel={() => setEditingTimeIndex(null)}
      />

      <TimePickerModal
        visible={editingIntervalStart}
        initialTime={intervalStart}
        onConfirm={time => {
          setIntervalStart(time);
          setEditingIntervalStart(false);
        }}
        onCancel={() => setEditingIntervalStart(false)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 12,
  },
  input: {
    fontSize: 15,
    padding: 0,
  },
  chip: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  divider: {
    height: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});

export default AddMedicationScreen;
