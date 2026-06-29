import {NativeStackNavigationOptions} from '@react-navigation/native-stack';
import {useMemo} from 'react';
import {Platform} from 'react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';

const useDefaultStackOptions = () => {
  const {t} = useTranslation();
  const colors = useColors();
  const options = useMemo<NativeStackNavigationOptions>(
    () => ({
      headerTitleStyle: {
        fontSize: 17,
        fontWeight: '600',
        fontFamily:
          t('key') === 'ru'
            ? 'InclusiveSans-SemiBold'
            : 'IBMPlexSans-SemiBold',
      },
      headerBackButtonDisplayMode: 'minimal',
      headerShadowVisible: false,
      animation: 'default',
      ...(Platform.OS === 'ios' && {
        headerLargeStyle: {backgroundColor: colors.$background},
      }),
    }),
    [t, colors],
  );

  return options;
};

export default useDefaultStackOptions;
