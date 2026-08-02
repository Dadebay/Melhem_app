import React from 'react';
import {Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {
  Pill,
  Droplets,
  Syringe,
  Wind,
  Hand,
  MoreHorizontal,
  FlaskConical,
  CircleDot,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';

type Props = {
  selected: Reminder.MedicationForm;
  onSelect: (form: Reminder.MedicationForm) => void;
};

type FormOption = {
  form: Reminder.MedicationForm;
  icon: React.ElementType;
  labelKey: string;
};

const FORM_OPTIONS: FormOption[] = [
  {form: 'tablet', icon: Pill, labelKey: 'reminders.formTablet'},
  {form: 'capsule', icon: CircleDot, labelKey: 'reminders.formCapsule'},
  {form: 'liquid', icon: FlaskConical, labelKey: 'reminders.formLiquid'},
  {form: 'drops', icon: Droplets, labelKey: 'reminders.formDrops'},
  {form: 'injection', icon: Syringe, labelKey: 'reminders.formInjection'},
  {form: 'inhaler', icon: Wind, labelKey: 'reminders.formInhaler'},
  {form: 'topical', icon: Hand, labelKey: 'reminders.formTopical'},
  {form: 'other', icon: MoreHorizontal, labelKey: 'reminders.formOther'},
];

const MedicationFormSelector = ({selected, onSelect}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {FORM_OPTIONS.map(({form, icon: Icon, labelKey}) => {
        const isSelected = form === selected;

        return (
          <Pressable
            key={form}
            onPress={() => onSelect(form)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? colors.$brandActive
                  : colors.$surface,
                borderWidth: isSelected ? 0 : 1,
                borderColor: colors.$border,
              },
            ]}>
            <Icon
              size={18}
              color={isSelected ? '#FFFFFF' : colors.$textPrimary}
              strokeWidth={1.5}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? '#FFFFFF' : colors.$textPrimary,
                },
              ]}
              numberOfLines={1}>
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MedicationFormSelector;
