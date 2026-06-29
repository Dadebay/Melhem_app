import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle, Text as SvgText} from 'react-native-svg';
import useColors from '../../lib/hooks/useColors';

type Props = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

const AdherenceRing = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
}: Props) => {
  const colors = useColors();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;
  const center = size / 2;

  const getProgressColor = () => {
    if (clampedPercentage >= 90) {
      return colors.$success;
    }
    if (clampedPercentage >= 70) {
      return colors.$warning;
    }
    return colors.$error;
  };

  return (
    <View style={styles.wrapper}>
      <View style={{width: size, height: size}}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.$border}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getProgressColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
          {/* Percentage number */}
          <SvgText
            x={center}
            y={center - 2}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={size * 0.22}
            fontWeight="700"
            fill={colors.$textPrimary}>
            {Math.round(clampedPercentage)}
          </SvgText>
          {/* Percent sign */}
          <SvgText
            x={center}
            y={center + size * 0.14}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={size * 0.12}
            fill={colors.$textSecondary}>
            %
          </SvgText>
        </Svg>
      </View>
      {label ? (
        <Text style={[styles.label, {color: colors.$textSecondary}]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 8,
  },
});

export default AdherenceRing;
