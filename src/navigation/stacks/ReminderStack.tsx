import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RemindersScreen from '../../screens/Reminders';
import MedicationsListScreen from '../../screens/MedicationsList';
import AddMedicationScreen from '../../screens/AddMedication';
import EditMedicationScreen from '../../screens/EditMedication';
import MedicationDetailScreen from '../../screens/MedicationDetail';
import CalendarViewScreen from '../../screens/CalendarView';
import StatisticsScreen from '../../screens/Statistics';
import FamilyMembersScreen from '../../screens/FamilyMembers';
import AddFamilyMemberScreen from '../../screens/AddFamilyMember';
import MealTimesScreen from '../../screens/MealTimes';
import useDefaultStackOptions from './useDefaultStackOptions';
import {useTranslation} from 'react-i18next';
import AuthScreen from '../../screens/Auth';

const Stack = createNativeStackNavigator<Nav.Reminder>();

const ReminderStack = () => {
  const screenOptions = useDefaultStackOptions();
  const {t} = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{title: t('navigation.reminders')}}
      />
      <Stack.Screen
        name="MedicationsList"
        component={MedicationsListScreen}
        options={{title: t('navigation.myMedications')}}
      />
      <Stack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{
          title: t('navigation.addMedication'),
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="EditMedication"
        component={EditMedicationScreen}
        options={{
          title: t('navigation.editMedication'),
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{headerTitle: '', headerShadowVisible: false}}
      />
      <Stack.Screen
        name="CalendarView"
        component={CalendarViewScreen}
        options={{title: t('navigation.calendar')}}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{title: t('navigation.statistics')}}
      />
      <Stack.Screen
        name="FamilyMembers"
        component={FamilyMembersScreen}
        options={{title: t('navigation.myFamily')}}
      />
      <Stack.Screen
        name="AddFamilyMember"
        component={AddFamilyMemberScreen}
        options={({route}) => ({
          title: route.params?.memberId
            ? t('navigation.editMember')
            : t('navigation.newMember'),
        })}
      />
      <Stack.Screen
        name="MealTimes"
        component={MealTimesScreen}
        options={{title: t('navigation.mealTimes')}}
      />
      <Stack.Screen
        name={'Auth' as any}
        component={AuthScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default ReminderStack;
