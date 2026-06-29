import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Check} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';

type Props = {
  currentStep: number;
  labels: string[];
};

const StepIndicator = ({currentStep, labels}: Props) => {
  const colors = useColors();

  const getLabelColor = (index: number) => {
    if (index < currentStep) {
      return colors.$success;
    }
    if (index === currentStep) {
      return colors.$brandActive;
    }
    return colors.$textSecondary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {labels.map((label, index) => (
          <React.Fragment key={index}>
            {/* Dot */}
            <View style={styles.dotColumn}>
              <View
                style={[
                  styles.dot,
                  index < currentStep && {
                    backgroundColor: colors.$success,
                  },
                  index === currentStep && {
                    backgroundColor: colors.$brandActive,
                  },
                  index > currentStep && {
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: colors.$border,
                  },
                ]}>
                {index < currentStep && (
                  <Check size={8} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <Text
                style={[styles.label, {color: getLabelColor(index)}]}
                numberOfLines={1}>
                {label}
              </Text>
            </View>

            {/* Connector line */}
            {index < labels.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      index < currentStep ? colors.$success : colors.$border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 280,
  },
  dotColumn: {
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 6,
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 5,
    marginHorizontal: 8,
  },
});

export default StepIndicator;
