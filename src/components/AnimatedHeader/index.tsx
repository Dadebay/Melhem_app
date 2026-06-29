import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {useHeaderHeight} from '@react-navigation/elements';
import useColors from '../../lib/hooks/useColors';
import {View} from 'react-native';

interface Props {
  translationY: SharedValue<number>;
  title?: string;
}
const AnimatedHeader = ({translationY, title}: Props) => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const colors = useColors();

  const inputRange = [0, headerHeight];

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(translationY.value, inputRange, [
      'transparent',
      colors.$surface,
    ]),
  }));

  const animatedTextStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(translationY.value, inputRange, [0, 1]),
      transform: [
        {
          translateY: interpolate(
            translationY.value,
            inputRange,
            [5, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    }),
    [],
  );

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: '100%',
          zIndex: 99,
          overflow: 'hidden',
        },
        animatedHeaderStyle,
      ]}>
      <View
        style={{
          height: headerHeight + 6,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {title !== undefined && (
          <Animated.Text
            style={[
              {
                fontWeight: '700',
                fontSize: 18,
                color: colors.$textPrimary,
                marginHorizontal: 'auto',
                marginTop: insets.top,
              },
              animatedTextStyle,
            ]}
            numberOfLines={1}>
            {title}
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
};

export default AnimatedHeader;
