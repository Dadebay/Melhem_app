import React, {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {Coffee, Moon, UtensilsCrossed} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import TimePickerModal from '../../components/TimePickerModal';

type Props = NativeStackScreenProps<Nav.Reminder, 'MealTimes'>;

const MEALS = [
  {
    key: 'breakfast' as Reminder.MealSlot,
    icon: Coffee,
    labelKey: 'settings.breakfast',
  },
  {
    key: 'lunch' as Reminder.MealSlot,
    icon: UtensilsCrossed,
    labelKey: 'settings.lunch',
  },
  {key: 'dinner' as Reminder.MealSlot, icon: Moon, labelKey: 'settings.dinner'},
];

const MealTimesScreen = (_: Props) => {
  const colors = useColors();
  const {t} = useTranslation();

  const mealTimes = reminderStore(s => s.mealTimes);
  const setMealTime = reminderStore(s => s.setMealTime);
  const [editingMeal, setEditingMeal] = useState<Reminder.MealSlot | null>(
    null,
  );

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.$background}}
      contentContainerStyle={{padding: 16, gap: 16}}
      showsVerticalScrollIndicator={false}>
      <Text
        style={{fontSize: 14, color: colors.$textSecondary, lineHeight: 20}}>
        {t('mealTimes.intro')}
      </Text>

      <View
        style={{
          backgroundColor: colors.$surface,
          borderRadius: 14,
          padding: 16,
          gap: 12,
        }}>
        {MEALS.map((meal, index) => {
          const MealIcon = meal.icon;
          return (
            <React.Fragment key={meal.key}>
              {index > 0 && (
                <View style={{height: 1, backgroundColor: colors.$border}} />
              )}
              <Pressable
                onPress={() => setEditingMeal(meal.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                }}>
                <MealIcon
                  size={18}
                  color={colors.$textSecondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.$textPrimary,
                    marginLeft: 12,
                  }}>
                  {t(meal.labelKey)}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.$info,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {mealTimes[meal.key]}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      <Text
        style={{fontSize: 12, color: colors.$textSecondary, lineHeight: 18}}>
        {t('settings.mealTimesHint')}
      </Text>

      <TimePickerModal
        visible={editingMeal !== null}
        initialTime={editingMeal ? mealTimes[editingMeal] : '12:00'}
        onConfirm={time => {
          if (editingMeal) {
            setMealTime(editingMeal, time);
          }
          setEditingMeal(null);
        }}
        onCancel={() => setEditingMeal(null)}
      />
    </ScrollView>
  );
};

export default MealTimesScreen;
