declare namespace Reminder {
  type Relationship = 'self' | 'child' | 'parent' | 'spouse' | 'other';

  type FamilyMember = {
    id: string;
    name: string;
    avatarColor: string;
    relationship: Relationship;
    createdAt: string;
  };

  type MedicationForm =
    | 'tablet'
    | 'capsule'
    | 'liquid'
    | 'drops'
    | 'injection'
    | 'inhaler'
    | 'topical'
    | 'suppository'
    | 'patch'
    | 'other';

  type Medication = {
    id: string;
    name: string;
    dosage: string;
    form: MedicationForm;
    notes: string;
    color: string;
    iconName: string;
    photoUri?: string;
    drugId?: string;
    memberId: string;
    isActive: boolean;
    createdAt: string;
    totalPills?: number;
    remainingPills?: number;
  };

  type ScheduleType = 'fixed_times' | 'interval' | 'meal_relative';

  type FixedTimesConfig = {
    times: string[];
  };

  type IntervalConfig = {
    intervalHours: number;
    startTime: string;
  };

  type MealRelation = 'before_meal' | 'after_meal' | 'with_meal';

  type MealRelativeConfig = {
    relation: MealRelation;
    offsetMinutes: number;
    mealsPerDay: number;
  };

  type ScheduleConfig =
    | {type: 'fixed_times'; fixedTimes: FixedTimesConfig}
    | {type: 'interval'; interval: IntervalConfig}
    | {type: 'meal_relative'; mealRelative: MealRelativeConfig};

  type CourseDuration =
    | {kind: 'date_range'; startDate: string; endDate: string}
    | {kind: 'n_days'; startDate: string; days: number}
    | {kind: 'indefinite'; startDate: string};

  type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

  type Schedule = {
    id: string;
    medicationId: string;
    config: ScheduleConfig;
    course: CourseDuration;
    daysOfWeek?: DayOfWeek[];
    notificationIds: string[];
    isActive: boolean;
  };

  type IntakeStatus = 'taken' | 'skipped' | 'missed';

  type IntakeLog = {
    id: string;
    medicationId: string;
    scheduleId: string;
    memberId: string;
    scheduledTime: string;
    status: IntakeStatus;
    actualTime?: string;
  };

  type MealSlot = 'breakfast' | 'lunch' | 'dinner';
}
