import React, {useState, useMemo} from 'react';
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
  Clock,
  Timer,
  UtensilsCrossed,
  Plus,
  Minus,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import {Separator, Switch} from 'heroui-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import MedicationFormSelector from '../../components/MedicationFormSelector';
import TimePickerModal from '../../components/TimePickerModal';
import {rescheduleAllNotifications} from '../../lib/notifications/reschedule';

type Props = NativeStackScreenProps<Nav.Reminder, 'EditMedication'>;

const DOSAGE_UNITS = ['mg', 'ml', 'tabletka', 'damja'] as const;

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['09:00'],
  2: ['09:00', '21:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
  5: ['07:00', '10:00', '13:00', '16:00', '20:00'],
};

const DAY_LABEL_KEYS: {key: string; value: Reminder.DayOfWeek}[] = [
  {key: 'addMedication.dayMon', value: 1},
  {key: 'addMedication.dayTue', value: 2},
  {key: 'addMedication.dayWed', value: 3},
  {key: 'addMedication.dayThu', value: 4},
  {key: 'addMedication.dayFri', value: 5},
  {key: 'addMedication.daySat', value: 6},
  {key: 'addMedication.daySun', value: 0},
];

const parseDosage = (
  dosageStr: string,
): {amount: string; unit: string} => {
  const parts = dosageStr.split(' ');
  if (parts.length >= 2) {
    return {amount: parts[0], unit: parts.slice(1).join(' ')};
  }
  return {amount: dosageStr, unit: 'mg'};
};

const EditMedicationScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const {medicationId} = route.params;

  const medication = reminderStore(
    s => s.medications.find(m => m.id === medicationId),
  );
  const schedule = reminderStore(
    s => s.schedules.find(sc => sc.medicationId === medicationId),
  );
  const updateMedication = reminderStore(s => s.updateMedication);
  const updateSchedule = reminderStore(s => s.updateSchedule);
  const removeMedication = reminderStore(s => s.removeMedication);

  const parsed = useMemo(
    () => parseDosage(medication?.dosage ?? ''),
    [medication?.dosage],
  );

  const [name, setName] = useState(medication?.name ?? '');
  const [form, setForm] = useState<Reminder.MedicationForm>(
    medication?.form ?? 'tablet',
  );
  const [dosage, setDosage] = useState(parsed.amount);
  const [dosageUnit, setDosageUnit] = useState(parsed.unit);
  const [notes, setNotes] = useState(medication?.notes ?? '');

  const initialScheduleType = schedule?.config.type ?? 'fixed_times';
  const [scheduleType, setScheduleType] =
    useState<Reminder.ScheduleType>(initialScheduleType);

  const initialFixedTimes =
    schedule?.config.type === 'fixed_times'
      ? schedule.config.fixedTimes.times
      : ['08:00', '14:00', '20:00'];
  const [fixedTimes, setFixedTimes] = useState<string[]>(initialFixedTimes);
  const [timesPerDay, setTimesPerDay] = useState(initialFixedTimes.length);

  const [intervalHours, setIntervalHours] = useState(
    schedule?.config.type === 'interval'
      ? schedule.config.interval.intervalHours
      : 8,
  );
  const [intervalStart, setIntervalStart] = useState(
    schedule?.config.type === 'interval'
      ? schedule.config.interval.startTime
      : '08:00',
  );

  const [mealRelation, setMealRelation] = useState<Reminder.MealRelation>(
    schedule?.config.type === 'meal_relative'
      ? schedule.config.mealRelative.relation
      : 'before_meal',
  );
  const [mealOffset, setMealOffset] = useState(
    schedule?.config.type === 'meal_relative'
      ? schedule.config.mealRelative.offsetMinutes
      : 30,
  );
  const [mealsPerDay, setMealsPerDay] = useState(
    schedule?.config.type === 'meal_relative'
      ? schedule.config.mealRelative.mealsPerDay
      : 3,
  );

  const initialHasCourse = schedule?.course.kind !== 'indefinite';
  const [hasCourse, setHasCourse] = useState(initialHasCourse);
  const [courseDays, setCourseDays] = useState(
    schedule?.course.kind === 'n_days' ? schedule.course.days : 14,
  );

  const [everyDay, setEveryDay] = useState(!schedule?.daysOfWeek);
  const [selectedDays, setSelectedDays] = useState<
    Reminder.DayOfWeek[] | undefined
  >(schedule?.daysOfWeek);

  const [isActive, setIsActive] = useState(medication?.isActive ?? true);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [editingIntervalStart, setEditingIntervalStart] = useState(false);

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

  const handleTimesPerDayChange = (count: number) => {
    setTimesPerDay(count);
    setFixedTimes(DEFAULT_TIMES[count] ?? DEFAULT_TIMES[3]);
  };

  const handleFixedTimeEdit = (index: number) => {
    setEditingTimeIndex(index);
  };

  const toggleDay = (day: Reminder.DayOfWeek) => {
    setSelectedDays(prev => {
      const current = prev ?? [];
      if (current.includes(day)) {
        return current.filter(d => d !== day);
      }
      return [...current, day];
    });
  };

  const handleDelete = () => {
    Alert.alert(
      t('addMedication.deleteMedication'),
      t('addMedication.deleteConfirmMessage'),
      [
        {text: t('addMedication.no'), style: 'cancel'},
        {
          text: t('addMedication.deleteAction'),
          style: 'destructive',
          onPress: () => {
            removeMedication(medicationId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('addMedication.alertTitle'), t('addMedication.alertEnterName'));
      return;
    }

    updateMedication(medicationId, {
      name: name.trim(),
      dosage: dosage ? `${dosage} ${dosageUnit}` : '',
      form,
      notes,
      isActive,
    });

    if (schedule) {
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
            offsetMinutes:
              mealRelation === 'with_meal' ? 0 : mealOffset,
            mealsPerDay,
          },
        };
      }

      const startDate =
        schedule.course.startDate ??
        new Date().toISOString().split('T')[0];

      const course: Reminder.CourseDuration = hasCourse
        ? {kind: 'n_days', startDate, days: courseDays}
        : {kind: 'indefinite', startDate};

      updateSchedule(schedule.id, {
        config,
        course,
        daysOfWeek: everyDay ? undefined : selectedDays,
        isActive,
      });
    }

    rescheduleAllNotifications();

    Alert.alert('', t('addMedication.savedChanges'), [
      {text: 'OK', onPress: () => navigation.goBack()},
    ]);
  };

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
          st.scheduleCard,
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

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 120,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Section 1: Medication Info */}
        <View style={{gap: 16}}>
          <Text style={[st.sectionTitle, {color: colors.$textSecondary}]}>
            {t('addMedication.medicationInfo')}
          </Text>

          <View style={{gap: 8}}>
            <Text style={[st.label, {color: colors.$textSecondary}]}>
              {t('addMedication.drugName')}
            </Text>
            <View
              style={[
                st.inputContainer,
                {backgroundColor: colors.$surface},
              ]}>
              <TextInput
                style={[st.input, {color: colors.$textPrimary}]}
                value={name}
                onChangeText={setName}
                placeholder={t('addMedication.drugNamePlaceholder')}
                placeholderTextColor={colors.$textPlaceholder}
              />
            </View>
          </View>

          <View style={{gap: 8}}>
            <Text style={[st.label, {color: colors.$textSecondary}]}>
              {t('addMedication.drugForm')}
            </Text>
            <MedicationFormSelector selected={form} onSelect={setForm} />
          </View>

          <View style={{gap: 8}}>
            <Text style={[st.label, {color: colors.$textSecondary}]}>
              {t('addMedication.dosage')}
            </Text>
            <View style={{flexDirection: 'row', gap: 8}}>
              <View
                style={[
                  st.inputContainer,
                  {backgroundColor: colors.$surface, flex: 1},
                ]}>
                <TextInput
                  style={[st.input, {color: colors.$textPrimary}]}
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="500"
                  placeholderTextColor={colors.$textPlaceholder}
                  keyboardType="numeric"
                />
              </View>
              <View style={{flexDirection: 'row', gap: 4}}>
                {DOSAGE_UNITS.map(unit => (
                  <Pressable
                    key={unit}
                    onPress={() => setDosageUnit(unit)}
                    style={[
                      st.chip,
                      {
                        backgroundColor:
                          dosageUnit === unit
                            ? colors.$brandActive
                            : colors.$surface,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color:
                          dosageUnit === unit
                            ? colors.$brandActiveText
                            : colors.$textPrimary,
                      }}>
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{gap: 8}}>
            <Text style={[st.label, {color: colors.$textSecondary}]}>
              {t('addMedication.notes')}
            </Text>
            <View
              style={[
                st.inputContainer,
                {backgroundColor: colors.$surface},
              ]}>
              <TextInput
                style={[
                  st.input,
                  {color: colors.$textPrimary, minHeight: 60},
                ]}
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

        <Separator />

        {/* Section 2: Schedule */}
        <View style={{gap: 16}}>
          <Text style={[st.sectionTitle, {color: colors.$textSecondary}]}>
            {t('addMedication.schedule')}
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

          {scheduleType === 'fixed_times' && (
            <View style={{gap: 12}}>
              <Text style={[st.label, {color: colors.$textSecondary}]}>
                {t('addMedication.timesPerDay')}
              </Text>
              <View style={{flexDirection: 'row', gap: 6}}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable
                    key={n}
                    onPress={() => handleTimesPerDayChange(n)}
                    style={[
                      st.chip,
                      {
                        backgroundColor:
                          timesPerDay === n
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
                          timesPerDay === n
                            ? colors.$brandActiveText
                            : colors.$textPrimary,
                      }}>
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={{gap: 8}}>
                {fixedTimes.map((time, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleFixedTimeEdit(i)}
                    style={[
                      st.timeRow,
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
              <Text style={[st.label, {color: colors.$textSecondary}]}>
                {t('addMedication.everyHour')}
              </Text>
              <View style={st.stepperRow}>
                <Pressable
                  onPress={() =>
                    setIntervalHours(h => Math.max(1, h - 1))
                  }
                  style={[
                    st.stepperBtn,
                    {backgroundColor: colors.$surface},
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
                  {intervalHours}
                </Text>
                <Pressable
                  onPress={() =>
                    setIntervalHours(h => Math.min(24, h + 1))
                  }
                  style={[
                    st.stepperBtn,
                    {backgroundColor: colors.$surface},
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
                  {t('addMedication.hours')}
                </Text>
              </View>
              <Text style={[st.label, {color: colors.$textSecondary}]}>
                {t('addMedication.startTime')}
              </Text>
              <Pressable
                onPress={() => setEditingIntervalStart(true)}
                style={[
                  st.timeRow,
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
                    st.scheduleCard,
                    {
                      backgroundColor:
                        mealRelation === rel
                          ? colors.$infoBg
                          : colors.$surface,
                      borderWidth: mealRelation === rel ? 1 : 0,
                      borderColor:
                        mealRelation === rel
                          ? colors.$info
                          : 'transparent',
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
                  <Text
                    style={[st.label, {color: colors.$textSecondary}]}>
                    {t('addMedication.intervalMinutes')}
                  </Text>
                  <View style={{flexDirection: 'row', gap: 6}}>
                    {[15, 30, 45, 60].map(m => (
                      <Pressable
                        key={m}
                        onPress={() => setMealOffset(m)}
                        style={[
                          st.chip,
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
                <Text
                  style={[st.label, {color: colors.$textSecondary}]}>
                  {t('addMedication.mealsPerDay')}
                </Text>
                <View style={{flexDirection: 'row', gap: 6}}>
                  {[1, 2, 3].map(n => (
                    <Pressable
                      key={n}
                      onPress={() => setMealsPerDay(n)}
                      style={[
                        st.chip,
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
            </View>
          )}

          {/* Course */}
          <View
            style={[
              st.sectionCard,
              {backgroundColor: colors.$surface},
            ]}>
            <View style={st.switchRow}>
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
              <View style={{marginTop: 12}}>
                <View style={st.stepperRow}>
                  <Pressable
                    onPress={() =>
                      setCourseDays(d => Math.max(1, d - 1))
                    }
                    style={[
                      st.stepperBtn,
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
                      st.stepperBtn,
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
                    {t('addMedication.day')}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Days of week */}
          <View
            style={[
              st.sectionCard,
              {backgroundColor: colors.$surface},
            ]}>
            <View style={st.switchRow}>
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
                {DAY_LABEL_KEYS.map(({key, value}) => {
                  const isOn = selectedDays?.includes(value);
                  return (
                    <Pressable
                      key={value}
                      onPress={() => toggleDay(value)}
                      style={[
                        st.chip,
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
                        {t(key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <Separator />

        {/* Section 3: Actions */}
        <View style={{gap: 16}}>
          <Text style={[st.sectionTitle, {color: colors.$textSecondary}]}>
            {t('addMedication.actions')}
          </Text>

          <View
            style={[
              st.sectionCard,
              {backgroundColor: colors.$surface},
            ]}>
            <View style={st.switchRow}>
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.$textPrimary,
                  }}>
                  {t('addMedication.pauseMedication')}
                </Text>
              </View>
              <Switch
                isSelected={!isActive}
                onSelectedChange={() => setIsActive(!isActive)}
              />
            </View>
          </View>

          <Pressable
            onPress={handleDelete}
            style={[
              st.deleteBtn,
              {backgroundColor: colors.$errorBg},
            ]}>
            <Trash2 size={18} color={colors.$error} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$error,
              }}>
              {t('addMedication.deleteMedication')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom save button */}
      <View
        style={[
          st.bottomBar,
          {
            backgroundColor: colors.$background,
            borderTopColor: colors.$border,
          },
        ]}>
        <Pressable
          onPress={handleSave}
          style={[
            st.primaryBtn,
            {backgroundColor: colors.$brandActive},
          ]}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.$brandActiveText,
            }}>
            {t('addMedication.saveChanges')}
          </Text>
        </Pressable>
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

const st = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
});

export default EditMedicationScreen;
