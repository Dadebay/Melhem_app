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
import useColors from '../../lib/hooks/useColors';

type Props = {
  selected: Reminder.MedicationForm;
  onSelect: (form: Reminder.MedicationForm) => void;
};

type FormOption = {
  form: Reminder.MedicationForm;
  icon: React.ElementType;
  label: string;
};

const FORM_OPTIONS: FormOption[] = [
  {form: 'tablet', icon: Pill, label: 'Tabletka'},
  {form: 'capsule', icon: CircleDot, label: 'Kapsul'},
  {form: 'liquid', icon: FlaskConical, label: 'Suwuklyk'},
  {form: 'drops', icon: Droplets, label: 'Damja'},
  {form: 'injection', icon: Syringe, label: 'Sanjym'},
  {form: 'inhaler', icon: Wind, label: 'Inhalyator'},
  {form: 'topical', icon: Hand, label: 'Melhem'},
  {form: 'other', icon: MoreHorizontal, label: 'Bashga'},
];

const MedicationFormSelector = ({selected, onSelect}: Props) => {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {FORM_OPTIONS.map(({form, icon: Icon, label}) => {
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
              {label}
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
