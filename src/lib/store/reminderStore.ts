import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import storage from '../storage';

const DEFAULT_SELF_ID = 'self';
const DEFAULT_MEMBER: Reminder.FamilyMember = {
  id: DEFAULT_SELF_ID,
  name: 'Men',
  avatarColor: '#3B82F6',
  relationship: 'self',
  createdAt: new Date().toISOString(),
};

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

interface ReminderStoreState {
  activeMemberId: string;
  familyMembers: Reminder.FamilyMember[];
  medications: Reminder.Medication[];
  schedules: Reminder.Schedule[];
  intakeLogs: Reminder.IntakeLog[];
  mealTimes: Record<Reminder.MealSlot, string>;
  snoozeDelayMinutes: number;

  // Family
  addFamilyMember: (
    member: Omit<Reminder.FamilyMember, 'id' | 'createdAt'>,
  ) => string;
  updateFamilyMember: (
    id: string,
    updates: Partial<
      Pick<Reminder.FamilyMember, 'name' | 'avatarColor' | 'relationship'>
    >,
  ) => void;
  removeFamilyMember: (id: string) => void;
  setActiveMember: (id: string) => void;

  // Medications
  addMedication: (
    med: Omit<Reminder.Medication, 'id' | 'createdAt' | 'isActive'>,
  ) => string;
  updateMedication: (
    id: string,
    updates: Partial<
      Pick<
        Reminder.Medication,
        | 'name'
        | 'dosage'
        | 'form'
        | 'notes'
        | 'color'
        | 'iconName'
        | 'photoUri'
        | 'isActive'
      >
    >,
  ) => void;
  removeMedication: (id: string) => void;
  toggleMedicationActive: (id: string) => void;

  // Schedules
  addSchedule: (
    schedule: Omit<Reminder.Schedule, 'id' | 'notificationIds' | 'isActive'>,
  ) => string;
  updateSchedule: (
    id: string,
    updates: Partial<
      Pick<Reminder.Schedule, 'config' | 'course' | 'daysOfWeek' | 'isActive'>
    >,
  ) => void;
  removeSchedule: (id: string) => void;
  setNotificationIds: (scheduleId: string, ids: string[]) => void;

  // Pills
  decrementPills: (medicationId: string, count?: number) => void;

  // Intake Logs
  logIntake: (log: Omit<Reminder.IntakeLog, 'id'>) => string;
  updateIntakeStatus: (
    logId: string,
    status: Reminder.IntakeStatus,
    actualTime?: string,
  ) => void;
  removeIntakeLog: (logId: string) => void;

  // Settings
  setMealTime: (meal: Reminder.MealSlot, time: string) => void;
  setSnoozeDelay: (minutes: number) => void;
}

const reminderStore = create<ReminderStoreState>()(
  persist(
    (set, _get) => ({
      activeMemberId: DEFAULT_SELF_ID,
      familyMembers: [DEFAULT_MEMBER],
      medications: [],
      schedules: [],
      intakeLogs: [],
      mealTimes: {breakfast: '07:30', lunch: '12:30', dinner: '19:00'},
      snoozeDelayMinutes: 10,

      // Family
      addFamilyMember: member => {
        const id = generateId();
        const newMember: Reminder.FamilyMember = {
          ...member,
          id,
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          familyMembers: [...state.familyMembers, newMember],
        }));
        return id;
      },
      updateFamilyMember: (id, updates) => {
        set(state => ({
          familyMembers: state.familyMembers.map(m =>
            m.id === id ? {...m, ...updates} : m,
          ),
        }));
      },
      removeFamilyMember: id => {
        if (id === DEFAULT_SELF_ID) {
          return;
        }
        set(state => {
          const memberMedIds = state.medications
            .filter(m => m.memberId === id)
            .map(m => m.id);
          return {
            familyMembers: state.familyMembers.filter(m => m.id !== id),
            medications: state.medications.filter(m => m.memberId !== id),
            schedules: state.schedules.filter(
              s => !memberMedIds.includes(s.medicationId),
            ),
            intakeLogs: state.intakeLogs.filter(l => l.memberId !== id),
            activeMemberId:
              state.activeMemberId === id
                ? DEFAULT_SELF_ID
                : state.activeMemberId,
          };
        });
      },
      setActiveMember: id => {
        set({activeMemberId: id});
      },

      // Medications
      addMedication: med => {
        const id = generateId();
        const newMed: Reminder.Medication = {
          ...med,
          id,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          medications: [...state.medications, newMed],
        }));
        return id;
      },
      updateMedication: (id, updates) => {
        set(state => ({
          medications: state.medications.map(m =>
            m.id === id ? {...m, ...updates} : m,
          ),
        }));
      },
      removeMedication: id => {
        set(state => ({
          medications: state.medications.filter(m => m.id !== id),
          schedules: state.schedules.filter(s => s.medicationId !== id),
          intakeLogs: state.intakeLogs.filter(l => l.medicationId !== id),
        }));
      },
      toggleMedicationActive: id => {
        set(state => ({
          medications: state.medications.map(m =>
            m.id === id ? {...m, isActive: !m.isActive} : m,
          ),
        }));
      },

      // Schedules
      addSchedule: schedule => {
        const id = generateId();
        const newSchedule: Reminder.Schedule = {
          ...schedule,
          id,
          notificationIds: [],
          isActive: true,
        };
        set(state => ({
          schedules: [...state.schedules, newSchedule],
        }));
        return id;
      },
      updateSchedule: (id, updates) => {
        set(state => ({
          schedules: state.schedules.map(s =>
            s.id === id ? {...s, ...updates} : s,
          ),
        }));
      },
      removeSchedule: id => {
        set(state => ({
          schedules: state.schedules.filter(s => s.id !== id),
        }));
      },
      setNotificationIds: (scheduleId, ids) => {
        set(state => ({
          schedules: state.schedules.map(s =>
            s.id === scheduleId ? {...s, notificationIds: ids} : s,
          ),
        }));
      },

      // Pills
      decrementPills: (medicationId, count = 1) => {
        set(state => ({
          medications: state.medications.map(m =>
            m.id === medicationId && m.remainingPills !== undefined
              ? {...m, remainingPills: Math.max(0, m.remainingPills - count)}
              : m,
          ),
        }));
      },

      // Intake Logs
      logIntake: log => {
        const id = generateId();
        const newLog: Reminder.IntakeLog = {...log, id};
        set(state => {
          const updatedMeds = log.status === 'taken'
            ? state.medications.map(m =>
                m.id === log.medicationId && m.remainingPills !== undefined
                  ? {...m, remainingPills: Math.max(0, m.remainingPills - 1)}
                  : m,
              )
            : state.medications;
          return {
            intakeLogs: [...state.intakeLogs, newLog],
            medications: updatedMeds,
          };
        });
        return id;
      },
      updateIntakeStatus: (logId, status, actualTime) => {
        set(state => ({
          intakeLogs: state.intakeLogs.map(l =>
            l.id === logId
              ? {...l, status, ...(actualTime !== undefined && {actualTime})}
              : l,
          ),
        }));
      },
      removeIntakeLog: logId => {
        set(state => ({
          intakeLogs: state.intakeLogs.filter(l => l.id !== logId),
        }));
      },

      // Settings
      setMealTime: (meal, time) => {
        set(state => ({
          mealTimes: {...state.mealTimes, [meal]: time},
        }));
      },
      setSnoozeDelay: minutes => {
        set({snoozeDelayMinutes: minutes});
      },
    }),
    {
      name: 'reminder-store',
      storage: createJSONStorage(() => storage.zustandStorage),
    },
  ),
);

export default reminderStore;
