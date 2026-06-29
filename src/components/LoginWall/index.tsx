import {PropsWithChildren} from 'react';
import {Pressable, Text, View} from 'react-native';
import {LogIn} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import useColors from '../../lib/hooks/useColors';
import authStore from '../../lib/store/authStore';

const LoginWall = ({children}: PropsWithChildren) => {
  const isAuthenticated = authStore(state => state.isAuthenticated);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <LoginWallScreen />;
};

const LoginWallScreen = () => {
  const {t} = useTranslation();
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.$background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
      }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.$surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 4,
        }}>
        <LogIn size={28} color={colors.$textSecondary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.$textPrimary,
          textAlign: 'center',
        }}>
        {t('auth.loginWallTitle')}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.$textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        }}>
        {t('auth.loginWallHint')}
      </Text>
      <Pressable
        onPress={() => navigation.navigate('Auth' as any)}
        style={{
          backgroundColor: colors.$brandActive,
          paddingVertical: 14,
          paddingHorizontal: 40,
          borderRadius: 14,
          marginTop: 8,
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.$brandActiveText,
          }}>
          {t('auth.loginWallButton')}
        </Text>
      </Pressable>
    </View>
  );
};

export default LoginWall;
