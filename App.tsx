import './global.css';
import {NavigationContainer, Theme} from '@react-navigation/native';
import Navigation from './src/navigation';
import {HeroUINativeProvider} from 'heroui-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useEffect, useMemo} from 'react';
import {AppState, AppStateStatus, StatusBar} from 'react-native';
// @ts-ignore - moduleResolution mismatch with uniwind types
import {Uniwind} from 'uniwind';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import themeStore from './src/lib/store/themeStore';
import useColors from './src/lib/hooks/useColors';
import NetInfo from '@react-native-community/netinfo';
import {onlineManager, QueryClientProvider} from '@tanstack/react-query';
import notifee, {EventType} from '@notifee/react-native';
import api from './src/lib/api';
import './src/lib/i18n';
import Toast from './src/components/Toast';
import {createNotificationChannels} from './src/lib/notifications/channels';
import {registerIOSCategories} from './src/lib/notifications/categories';
import {handleNotificationAction} from './src/lib/notifications/actionHandler';
import {rescheduleAllNotifications} from './src/lib/notifications/reschedule';
import {detectMissedDoses} from './src/lib/notifications/missedDoseDetector';

onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(!!state.isConnected);
  });
});

const App = () => {
  const theme = themeStore(state => state.theme);
  const colors = useColors();

  // Sync Uniwind (HeroUI styling engine) with app theme
  // Without this, Uniwind follows system colorScheme, causing dark elements on system dark mode
  useEffect(() => {
    Uniwind.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    createNotificationChannels();
    registerIOSCategories();

    // Schedule notifications on cold start
    rescheduleAllNotifications();
    detectMissedDoses();

    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.ACTION_PRESS) {
        handleNotificationAction(detail);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        rescheduleAllNotifications();
        detectMissedDoses();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  const navTheme: Theme = useMemo(
    () => ({
      colors: {
        background: colors.$background,
        border: colors.$border,
        card: colors.$background,
        notification: colors.$error,
        primary: colors.$textPrimary,
        text: colors.$textPrimary,
      },
      dark: colors.$dark === 'true',
      fonts: {
        regular: {
          fontFamily: 'IstokWeb-Regular',
          fontWeight: '400',
        },
        medium: {
          fontFamily: 'IstokWeb-Bold',
          fontWeight: '500',
        },
        bold: {
          fontFamily: 'IstokWeb-Bold',
          fontWeight: '700',
        },
        heavy: {
          fontFamily: 'IstokWeb-Bold',
          fontWeight: '900',
        },
      },
    }),
    [colors],
  );

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{flex: 1}}>
        <QueryClientProvider client={api.queryClient}>
          <HeroUINativeProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar
                backgroundColor={colors.$background}
                barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
              />
              <Navigation />
              <Toast />
            </NavigationContainer>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;
