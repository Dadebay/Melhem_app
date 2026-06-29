import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Check} from 'lucide-react-native';
import {useShallow} from 'zustand/react/shallow';
import useColors from '../../lib/hooks/useColors';
import toastStore from '../../lib/store/toastStore';

const VISIBLE_MS = 1600;
const FADE_IN_MS = 180;
const FADE_OUT_MS = 220;
const OFFSET = 12;

/**
 * App-wide lightweight toast. Mounted once at the root; listens to toastStore
 * and slides a small pill down from the top, then auto-dismisses. Non-blocking
 * (pointerEvents="none") so it never intercepts touches.
 */
const Toast = () => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {message, seq} = toastStore(
    useShallow(state => ({message: state.message, seq: state.seq})),
  );
  const hide = toastStore(state => state.hide);

  // Keep the last text mounted through the fade-out so it doesn't blank out.
  const [rendered, setRendered] = useState<string | null>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-OFFSET);

  useEffect(() => {
    if (!message) {
      return;
    }
    setRendered(message);
    opacity.value = withTiming(1, {duration: FADE_IN_MS});
    translateY.value = withTiming(0, {duration: FADE_IN_MS});

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, {duration: FADE_OUT_MS});
      translateY.value = withTiming(-OFFSET, {duration: FADE_OUT_MS}, finished => {
        if (finished) {
          runOnJS(hide)();
        }
      });
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
    // Re-run on every show(); `seq` changes even for a repeated message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  if (!rendered) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, {top: insets.top + 8}]}>
      <Animated.View
        style={[
          styles.pill,
          {backgroundColor: colors.$textPrimary},
          animatedStyle,
        ]}>
        <Check size={16} color={colors.$background} strokeWidth={2.5} />
        <Text style={[styles.text, {color: colors.$background}]} numberOfLines={1}>
          {rendered}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Toast;
