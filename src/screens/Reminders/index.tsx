import {useLayoutEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Animated, {FadeInDown, FadeIn, Layout} from 'react-native-reanimated';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useShallow} from 'zustand/react/shallow';
import {
  Bell,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  List,
  Pill,
  Plus,
  SkipForward,
  AlertTriangle,
  Undo2,
  Users,
  UtensilsCrossed,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import type {ColorType} from '../../lib/theme/lightTheme';
import reminderStore from '../../lib/store/reminderStore';
import FamilyMemberSelector from '../../components/FamilyMemberSelector';
import AdherenceRing from '../../components/AdherenceRing';
import {
  formatTimeToMinutes,
  getDateStr,
  getTodayDoseTimes,
  computeStreak,
} from './helpers';

type Props = NativeStackScreenProps<Nav.Reminder, 'Reminders'>;

type DoseStatus = 'taken' | 'skipped' | 'missed' | 'upcoming' | 'current';

type FilterTab = 'upcoming' | 'all' | 'taken' | 'missed';


function generateWeekDays(centerDate: Date, weekdayLabels: string[]) {
  const days: {date: Date; dayNum: number; dayLabel: string; isToday: boolean}[] = [];
  const today = new Date();
  const todayStr = getDateStr(today);

  for (let i = -3; i <= 3; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dayNum: d.getDate(),
      dayLabel: weekdayLabels[d.getDay()] ?? '',
      isToday: getDateStr(d) === todayStr,
    });
  }
  return days;
}

type DateCarouselProps = {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  colors: ColorType;
};

const DateCarousel = ({selectedDate, onSelectDate, colors}: DateCarouselProps) => {
  const {t} = useTranslation();
  const [center, setCenter] = useState(selectedDate);
  const weekdayLabels = useMemo(
    () => t('reminders.weekdaysShort', {returnObjects: true}) as string[],
    [t],
  );
  const months = useMemo(
    () => t('reminders.months', {returnObjects: true}) as string[],
    [t],
  );
  const days = useMemo(
    () => generateWeekDays(center, weekdayLabels),
    [center, weekdayLabels],
  );
  const selectedStr = getDateStr(selectedDate);

  const shiftWeek = (dir: -1 | 1) => {
    const next = new Date(center);
    next.setDate(next.getDate() + dir * 7);
    setCenter(next);
  };

  const monthLabel = `${months[center.getMonth()] ?? ''} ${center.getFullYear()}`;

  return (
    <View style={dc.root}>
      {/* Month header with nav */}
      <View style={dc.header}>
        <Pressable onPress={() => shiftWeek(-1)} hitSlop={12} style={dc.navBtn}>
          <ChevronLeft size={18} color={colors.$textSecondary} strokeWidth={1.8} />
        </Pressable>
        <Text style={[dc.monthLabel, {color: colors.$textPrimary}]}>
          {monthLabel}
        </Text>
        <Pressable onPress={() => shiftWeek(1)} hitSlop={12} style={dc.navBtn}>
          <ChevronRight size={18} color={colors.$textSecondary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* Days row */}
      <View style={dc.daysRow}>
        {days.map(day => {
          const isSelected = getDateStr(day.date) === selectedStr;
          return (
            <Pressable
              key={day.date.toISOString()}
              onPress={() => onSelectDate(day.date)}
              style={[
                dc.dayItem,
                isSelected && {backgroundColor: colors.$brandActive},
                !isSelected && day.isToday && {
                  borderWidth: 1.5,
                  borderColor: colors.$brandActive,
                },
              ]}>
              <Text
                style={[
                  dc.dayLabel,
                  {color: isSelected ? colors.$brandActiveText : colors.$textSecondary},
                ]}>
                {day.dayLabel}
              </Text>
              <Text
                style={[
                  dc.dayNum,
                  {color: isSelected ? colors.$brandActiveText : colors.$textPrimary},
                ]}>
                {day.dayNum}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const dc = StyleSheet.create({
  root: {gap: 12},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

// ─── Filter Tabs ───────────────────────────────────────────
type FilterTabsProps = {
  active: FilterTab;
  onSelect: (tab: FilterTab) => void;
  counts: Record<FilterTab, number>;
  colors: ColorType;
  t: (key: string) => string;
};

const FilterTabs = ({active, onSelect, counts, colors, t}: FilterTabsProps) => {
  const tabs: {key: FilterTab; label: string}[] = [
    {key: 'upcoming', label: t('reminders.upcoming')},
    {key: 'all', label: t('reminders.all')},
    {key: 'taken', label: t('reminders.takenStatus')},
    {key: 'missed', label: t('reminders.missed')},
  ];

  return (
    <View style={ft.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={ft.scroll}>
        {tabs.map(tab => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={[
                ft.tab,
                {
                  backgroundColor: isActive ? colors.$brandActive : colors.$surface,
                  borderColor: isActive ? colors.$brandActive : colors.$border,
                },
              ]}>
              <Text
                style={[
                  ft.tabLabel,
                  {color: isActive ? colors.$brandActiveText : colors.$textSecondary},
                ]}>
                {tab.label}
              </Text>
              <View
                style={[
                  ft.badge,
                  {
                    backgroundColor: isActive
                      ? colors.$brandActiveText + '25'
                      : colors.$border,
                  },
                ]}>
                <Text
                  style={[
                    ft.badgeText,
                    {color: isActive ? colors.$brandActiveText : colors.$textSecondary},
                  ]}>
                  {counts[tab.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const ft = StyleSheet.create({
  root: {marginTop: 20},
  scroll: {gap: 8},
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

// ─── Dose Card (rich, schedule-02 style) ───────────────────
type DoseCardProps = {
  time: string;
  medicationName: string;
  dosage: string;
  form: string;
  status: DoseStatus;
  actualTime?: string;
  color: string;
  onTake?: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
  colors: ColorType;
  t: (key: string) => string;
  index: number;
};

const DoseCard = ({
  time,
  medicationName,
  dosage,
  form,
  status,
  actualTime,
  color,
  onTake,
  onSkip,
  onUndo,
  colors,
  t,
  index,
}: DoseCardProps) => {

  const statusConfig: Record<
    DoseStatus,
    {label: string; bg: string; fg: string; icon: typeof Check}
  > = {
    taken: {
      label: t('reminders.takenStatus'),
      bg: colors.$successBg,
      fg: colors.$success,
      icon: Check,
    },
    skipped: {
      label: t('reminders.skipped'),
      bg: colors.$errorBg,
      fg: colors.$error,
      icon: SkipForward,
    },
    missed: {
      label: t('reminders.missed'),
      bg: colors.$warningBg,
      fg: colors.$warning,
      icon: AlertTriangle,
    },
    upcoming: {
      label: t('reminders.upcoming'),
      bg: colors.$surface,
      fg: colors.$textSecondary,
      icon: Clock,
    },
    current: {
      label: t('reminders.upcoming'),
      bg: colors.$infoBg,
      fg: colors.$info,
      icon: Clock,
    },
  };

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  const formLabels: Record<string, string> = {
    tablet: t('reminders.formTablet'),
    capsule: t('reminders.formCapsule'),
    liquid: t('reminders.formLiquid'),
    drops: t('reminders.formDrops'),
    injection: t('reminders.formInjection'),
    inhaler: t('reminders.formInhaler'),
    topical: t('reminders.formTopical'),
    other: t('reminders.formOther'),
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(60 * index).duration(350).springify()}
      layout={Layout.springify()}>
      <View
        style={[
          doseS.card,
          {
            backgroundColor: colors.$surface,
            borderColor: status === 'current'
              ? colors.$info + '40'
              : colors.$border + '60',
          },
        ]}>
        {/* Top row: Status badge + Time */}
        <View style={doseS.topRow}>
          <View style={[doseS.statusBadge, {backgroundColor: cfg.bg}]}>
            <StatusIcon size={12} color={cfg.fg} strokeWidth={2.5} />
            <Text style={[doseS.statusLabel, {color: cfg.fg}]}>{cfg.label}</Text>
          </View>
          <View style={doseS.timeRow}>
            <Clock size={12} color={colors.$textSecondary} strokeWidth={1.5} />
            <Text style={[doseS.timeText, {color: colors.$textSecondary}]}>
              {time}
            </Text>
          </View>
        </View>

        {/* Medication title */}
        <Text
          style={[doseS.medName, {color: colors.$textPrimary}]}
          numberOfLines={1}>
          {medicationName}
        </Text>

        {/* Details row: dosage, form, color dot */}
        <View style={doseS.detailsRow}>
          <View style={[doseS.colorDot, {backgroundColor: color}]} />
          <Text style={[doseS.detailText, {color: colors.$textSecondary}]}>
            {dosage}
          </Text>
          <View style={[doseS.detailSep, {backgroundColor: colors.$border}]} />
          <Text style={[doseS.detailText, {color: colors.$textSecondary}]}>
            {formLabels[form] || form}
          </Text>
          {actualTime && (
            <>
              <View style={[doseS.detailSep, {backgroundColor: colors.$border}]} />
              <Text style={[doseS.detailText, {color: colors.$textSecondary}]}>
                {t('reminders.takenAt').replace('{{time}}', actualTime)}
              </Text>
            </>
          )}
        </View>

        {/* Actions */}
        {(status === 'current' || status === 'upcoming') && (
          <View style={doseS.actionsRow}>
            <Pressable
              onPress={onTake}
              style={[doseS.takeBtn, {backgroundColor: colors.$brandActive}]}>
              <Check size={14} color={colors.$brandActiveText} strokeWidth={2.5} />
              <Text style={[doseS.takeBtnText, {color: colors.$brandActiveText}]}>
                {t('reminders.taken')}
              </Text>
            </Pressable>
            {status === 'current' && onSkip && (
              <Pressable
                onPress={onSkip}
                style={[doseS.skipBtn, {borderColor: colors.$border}]}>
                <Text style={[doseS.skipBtnText, {color: colors.$textSecondary}]}>
                  {t('reminders.skipped')}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Undo for taken/skipped */}
        {(status === 'taken' || status === 'skipped') && onUndo && (
          <Pressable onPress={onUndo} style={doseS.undoRow} hitSlop={8}>
            <Undo2 size={13} color={colors.$textSecondary} strokeWidth={1.5} />
            <Text style={[doseS.undoText, {color: colors.$textSecondary}]}>
              {t('reminders.undo')}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const doseS = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  medName: {
    fontSize: 17,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailText: {
    fontSize: 13,
  },
  detailSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  takeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  takeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  undoText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// ─── Main Screen ───────────────────────────────────────────
const RemindersScreen = ({navigation}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<FilterTab>('upcoming');

  const {
    activeMemberId,
    familyMembers,
    medications,
    schedules,
    intakeLogs,
    mealTimes,
    setActiveMember,
    logIntake,
    removeIntakeLog,
  } = reminderStore(
    useShallow(state => ({
      activeMemberId: state.activeMemberId,
      familyMembers: state.familyMembers,
      medications: state.medications,
      schedules: state.schedules,
      intakeLogs: state.intakeLogs,
      mealTimes: state.mealTimes,
      setActiveMember: state.setActiveMember,
      logIntake: state.logIntake,
      removeIntakeLog: state.removeIntakeLog,
    })),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('MealTimes')}
          hitSlop={10}
          accessibilityLabel={t('navigation.mealTimes')}
          style={{padding: 4}}>
          <UtensilsCrossed
            size={22}
            color={colors.$textPrimary}
            strokeWidth={1.75}
          />
        </Pressable>
      ),
    });
  }, [navigation, colors.$textPrimary, t]);

  const memberMeds = useMemo(
    () => medications.filter(m => m.memberId === activeMemberId),
    [medications, activeMemberId],
  );

  const todayDoses = useMemo(
    () => getTodayDoseTimes(memberMeds, schedules, mealTimes),
    [memberMeds, schedules, mealTimes],
  );

  const selectedStr = getDateStr(selectedDate);
  const todayStr = getDateStr(new Date());
  const isToday = selectedStr === todayStr;

  const selectedLogs = useMemo(
    () => intakeLogs.filter(l => l.scheduledTime.slice(0, 10) === selectedStr),
    [intakeLogs, selectedStr],
  );

  const now = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const takenCount = selectedLogs.filter(l => l.status === 'taken').length;
  const totalDoses = todayDoses.length;
  const adherencePercent = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;

  const streak = useMemo(
    () => computeStreak(intakeLogs, schedules, memberMeds, mealTimes),
    [intakeLogs, schedules, memberMeds, mealTimes],
  );

  const handleTake = (medicationId: string, scheduleId: string, time: string) => {
    logIntake({
      medicationId,
      scheduleId,
      memberId: activeMemberId,
      scheduledTime: `${selectedStr}T${time}:00`,
      status: 'taken',
      actualTime: new Date().toISOString(),
    });
  };

  const handleSkip = (medicationId: string, scheduleId: string, time: string) => {
    logIntake({
      medicationId,
      scheduleId,
      memberId: activeMemberId,
      scheduledTime: `${selectedStr}T${time}:00`,
      status: 'skipped',
    });
  };

  const handleUndo = (medicationId: string, scheduleId: string, time: string) => {
    const log = selectedLogs.find(
      l =>
        l.medicationId === medicationId &&
        l.scheduleId === scheduleId &&
        l.scheduledTime.includes(time),
    );
    if (log) {
      removeIntakeLog(log.id);
    }
  };

  // Build timeline items with status
  const timelineItems = useMemo(() => {
    const nowMins = formatTimeToMinutes(now);
    let foundCurrent = false;

    return todayDoses.map(dose => {
      const med = memberMeds.find(m => m.id === dose.medicationId);
      const log = selectedLogs.find(
        l =>
          l.medicationId === dose.medicationId &&
          l.scheduleId === dose.scheduleId &&
          l.scheduledTime.includes(dose.time),
      );

      let status: DoseStatus;
      let actualTime: string | undefined;

      if (log) {
        status = log.status;
        actualTime = log.actualTime?.slice(11, 16);
      } else if (!isToday) {
        status = 'upcoming';
      } else {
        const doseMins = formatTimeToMinutes(dose.time);
        if (doseMins < nowMins - 30) {
          status = 'missed';
        } else if (!foundCurrent && doseMins <= nowMins + 120) {
          status = 'current';
          foundCurrent = true;
        } else {
          status = 'upcoming';
        }
      }

      return {
        ...dose,
        medication: med,
        status,
        actualTime,
      };
    });
  }, [todayDoses, selectedLogs, now, memberMeds, isToday]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {upcoming: 0, all: 0, taken: 0, missed: 0};
    for (const item of timelineItems) {
      counts.all++;
      if (item.status === 'taken') counts.taken++;
      else if (item.status === 'missed') counts.missed++;
      else if (item.status === 'upcoming' || item.status === 'current') counts.upcoming++;
    }
    return counts;
  }, [timelineItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return timelineItems;
    return timelineItems.filter(item => {
      switch (activeFilter) {
        case 'upcoming':
          return item.status === 'upcoming' || item.status === 'current';
        case 'taken':
          return item.status === 'taken';
        case 'missed':
          return item.status === 'missed' || item.status === 'skipped';
        default:
          return true;
      }
    });
  }, [timelineItems, activeFilter]);

  // Empty state — no medications at all
  if (memberMeds.length === 0) {
    const features = [
      {
        icon: Bell,
        color: colors.$info,
        bg: colors.$infoBg,
        title: t('onboarding.featureReminders'),
        desc: t('onboarding.featureRemindersDesc'),
      },
      {
        icon: BarChart3,
        color: colors.$success,
        bg: colors.$successBg,
        title: t('onboarding.featureStats'),
        desc: t('onboarding.featureStatsDesc'),
      },
      {
        icon: Users,
        color: colors.$statusPreparing,
        bg: colors.$statusPreparingBg,
        title: t('onboarding.featureFamily'),
        desc: t('onboarding.featureFamilyDesc'),
      },
    ];

    return (
      <ScrollView
        style={{backgroundColor: colors.$background}}
        contentContainerStyle={s.onboardScroll}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
          <View style={s.onboardHero}>
            <View style={[s.onboardIconWrap, {backgroundColor: colors.$surface}]}>
              <Pill size={36} color={colors.$brandActive} strokeWidth={1.4} />
            </View>
            <Text style={[s.onboardTitle, {color: colors.$textPrimary}]}>
              {t('onboarding.title')}
            </Text>
            <Text style={[s.onboardSubtitle, {color: colors.$textSecondary}]}>
              {t('onboarding.subtitle')}
            </Text>
          </View>
        </Animated.View>

        {/* Feature cards */}
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(160 + i * 80).duration(350).springify()}>
              <View style={[s.featureCard, {backgroundColor: colors.$surface}]}>
                <View style={[s.featureIcon, {backgroundColor: feat.bg}]}>
                  <Icon size={18} color={feat.color} strokeWidth={1.8} />
                </View>
                <View style={s.featureText}>
                  <Text style={[s.featureTitle, {color: colors.$textPrimary}]}>
                    {feat.title}
                  </Text>
                  <Text style={[s.featureDesc, {color: colors.$textSecondary}]}>
                    {feat.desc}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(420).duration(350).springify()}>
          <Pressable
            onPress={() => navigation.navigate('AddMedication', {memberId: activeMemberId})}
            style={[s.onboardCta, {backgroundColor: colors.$brandActive}]}>
            <Plus size={18} color={colors.$brandActiveText} strokeWidth={2.5} />
            <Text style={[s.onboardCtaText, {color: colors.$brandActiveText}]}>
              {t('reminders.addFirstMedication')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      style={{backgroundColor: colors.$background}}>
      {/* Family Member Selector */}
      <View style={s.familySection}>
        <FamilyMemberSelector
          members={familyMembers}
          activeId={activeMemberId}
          onSelect={setActiveMember}
          onAddPress={() => navigation.navigate('FamilyMembers')}
        />
      </View>

      {/* Date Carousel */}
      <Animated.View entering={FadeInDown.delay(60).duration(350).springify()}>
        <DateCarousel
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          colors={colors}
        />
      </Animated.View>

      {/* Quick Stats Strip */}
      <Animated.View entering={FadeInDown.delay(120).duration(350).springify()}>
        <Pressable
          onPress={() => navigation.navigate('Statistics', {memberId: activeMemberId})}
          style={[s.statsStrip, {backgroundColor: colors.$surface}]}>
          <View style={s.statsLeft}>
            <AdherenceRing
              percentage={adherencePercent}
              size={44}
              strokeWidth={4}
            />
          </View>
          <View style={s.statsCenter}>
            <Text style={[s.statsMainText, {color: colors.$textPrimary}]}>
              {takenCount} / {totalDoses}
            </Text>
            <Text style={[s.statsSubText, {color: colors.$textSecondary}]}>
              {t('reminders.todaySchedule')}
            </Text>
          </View>
          <View style={s.statsRight}>
            <View style={s.streakRow}>
              <Flame size={14} color={colors.$warning} strokeWidth={2} />
              <Text style={[s.streakText, {color: colors.$textPrimary}]}>
                {streak} {t('reminders.days')}
              </Text>
            </View>
            <ChevronRight size={14} color={colors.$textSecondary} strokeWidth={1.5} />
          </View>
        </Pressable>
      </Animated.View>

      {/* Filter Tabs */}
      <FilterTabs
        active={activeFilter}
        onSelect={setActiveFilter}
        counts={filterCounts}
        colors={colors}
        t={t}
      />

      {/* Dose Cards */}
      <View style={s.cardsList}>
        {filteredItems.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={s.noItemsWrap}>
            <Text style={[s.noItemsText, {color: colors.$textSecondary}]}>
              {t('reminders.noScheduleForDay')}
            </Text>
          </Animated.View>
        ) : (
          filteredItems.map((item, index) =>
            item.medication ? (
              <DoseCard
                key={`${item.scheduleId}-${item.time}`}
                time={item.time}
                medicationName={item.medication.name}
                dosage={item.medication.dosage}
                form={item.medication.form}
                status={item.status}
                actualTime={item.actualTime}
                color={item.medication.color}
                onTake={() =>
                  handleTake(item.medicationId, item.scheduleId, item.time)
                }
                onSkip={() =>
                  handleSkip(item.medicationId, item.scheduleId, item.time)
                }
                onUndo={
                  item.status === 'taken' || item.status === 'skipped'
                    ? () => handleUndo(item.medicationId, item.scheduleId, item.time)
                    : undefined
                }
                colors={colors}
                t={t}
                index={index}
              />
            ) : null,
          )
        )}
      </View>

      {/* Bottom Actions */}
      <View style={s.bottomActions}>
        <Pressable
          onPress={() =>
            navigation.navigate('AddMedication', {memberId: activeMemberId})
          }
          style={[s.actionBtn, {backgroundColor: colors.$brandActive}]}>
          <Plus size={16} color={colors.$brandActiveText} strokeWidth={2} />
          <Text style={[s.actionBtnText, {color: colors.$brandActiveText}]}>
            {t('reminders.addMedication')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate('MedicationsList', {memberId: activeMemberId})
          }
          style={[
            s.actionBtn,
            s.actionBtnOutline,
            {borderColor: colors.$border},
          ]}>
          <List size={16} color={colors.$textSecondary} strokeWidth={2} />
          <Text style={[s.actionBtnText, {color: colors.$textSecondary}]}>
            {t('reminders.seeAll')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  familySection: {
    marginTop: 12,
    marginBottom: 16,
    marginHorizontal: -16,
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    gap: 12,
  },
  statsLeft: {},
  statsCenter: {
    flex: 1,
    gap: 2,
  },
  statsMainText: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsSubText: {
    fontSize: 12,
    fontWeight: '400',
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Cards list
  cardsList: {
    marginTop: 16,
  },
  noItemsWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noItemsText: {
    fontSize: 14,
  },

  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Onboarding
  onboardScroll: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 12,
  },
  onboardHero: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  onboardIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  onboardTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  onboardSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  onboardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  onboardCtaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

import LoginWall from '../../components/LoginWall';

const RemindersScreenWithAuth = (props: Props) => (
  <LoginWall>
    <RemindersScreen {...props} />
  </LoginWall>
);

export default RemindersScreenWithAuth;
