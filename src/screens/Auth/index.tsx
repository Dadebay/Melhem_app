import {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, SlideInRight, SlideOutLeft} from 'react-native-reanimated';
import {InputOTP, type InputOTPRef} from 'heroui-native';
import {useTranslation} from 'react-i18next';
import {AxiosError} from 'axios';
import {ArrowLeft, Phone, ChevronRight} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
import authStore from '../../lib/store/authStore';
import authApi from '../../lib/api/authApi';

type Props = NativeStackScreenProps<Nav.Home, 'Auth'>;

type Step = 'phone' | 'otp';

const PHONE_PREFIX = '+993';
const OTP_LENGTH = 4;

const formatPhoneDisplay = (digits: string): string => {
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)}${digits.length > 5 ? digits.slice(5) : ''}`;
};

const getErrorMessage = (error: AxiosError<ApiErrorResponse>) => {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message[0];
  return message;
};

const AuthScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const {redirectTo, pharmacyId, onboarding} = route.params ?? {};
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const otpRef = useRef<InputOTPRef>(null);

  const [step, setStep] = useState<Step>('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const login = authStore(state => state.login);
  const completeOnboarding = authStore(state => state.completeOnboarding);

  const sendCodeMutation = authApi.useSendCode();
  const verifyCodeMutation = authApi.useVerifyCode();
  const verifyLoginMutation = authApi.useVerifyLogin();

  const phoneValid = phoneDigits.length === 8;
  const fullPhone = `${PHONE_PREFIX}${phoneDigits}`;
  const isVerifying =
    verifyCodeMutation.isPending || verifyLoginMutation.isPending;

  const navigateAfterAuth = useCallback(() => {
    // Last onboarding step: flipping the flag swaps the root navigator to the app.
    if (onboarding) {
      completeOnboarding();
      return;
    }
    if (redirectTo === 'Checkout' && pharmacyId) {
      navigation.replace('Checkout' as any, {pharmacyId});
    } else {
      navigation.goBack();
    }
  }, [navigation, redirectTo, pharmacyId, onboarding, completeOnboarding]);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    setPhoneDigits(digits);
    setPhoneError(null);
  };

  const handleSendCode = useCallback(async () => {
    if (!phoneValid || sendCodeMutation.isPending) return;
    setPhoneError(null);
    try {
      await sendCodeMutation.mutateAsync({phone: fullPhone});
      setStep('otp');
      setOtpValue('');
      setOtpError(false);
    } catch (error) {
      setPhoneError(
        getErrorMessage(error as AxiosError<ApiErrorResponse>) ||
          t('auth.otpError'),
      );
    }
  }, [phoneValid, fullPhone, sendCodeMutation, t]);

  const handleOtpComplete = useCallback(
    async (code: string) => {
      if (isVerifying) return;
      const numericCode = Number(code);
      setOtpError(false);
      try {
        await verifyCodeMutation.mutateAsync({
          phone: fullPhone,
          code: numericCode,
        });
        const {user, accessToken} = await verifyLoginMutation.mutateAsync({
          phone: fullPhone,
          code: numericCode,
        });
        login(user, accessToken);
        navigateAfterAuth();
      } catch {
        setOtpError(true);
        setTimeout(() => {
          otpRef.current?.clear();
          setOtpValue('');
        }, 600);
      }
    },
    [
      isVerifying,
      fullPhone,
      verifyCodeMutation,
      verifyLoginMutation,
      login,
      navigateAfterAuth,
    ],
  );

  const handleResend = useCallback(async () => {
    if (sendCodeMutation.isPending) return;
    setOtpError(false);
    setOtpValue('');
    otpRef.current?.clear();
    try {
      await sendCodeMutation.mutateAsync({phone: fullPhone});
    } catch {
      setOtpError(true);
    }
  }, [fullPhone, sendCodeMutation]);

  const handleBack = useCallback(() => {
    if (step === 'otp') {
      setStep('phone');
      setOtpValue('');
      setOtpError(false);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: colors.$background}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
        }}>
        {/* Top bar: back + (onboarding) skip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.$surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ArrowLeft size={20} color={colors.$textPrimary} strokeWidth={1.5} />
          </Pressable>

          {onboarding && (
            <Pressable
              onPress={handleSkip}
              hitSlop={12}
              style={{paddingHorizontal: 12, paddingVertical: 8}}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.$textSecondary,
                }}>
                {t('onboarding.skip')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Phone Step — initial screen content, rendered without a reanimated
            `entering` animation: a FadeIn here races the native-stack push and
            can leave the field stuck at opacity 0 until a back/forward remount. */}
        {step === 'phone' && (
          <View style={{flex: 1}}>
            <View style={{gap: 8, marginBottom: 32}}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '700',
                  color: colors.$textPrimary,
                }}>
                {t('auth.phoneTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.$textSecondary,
                  lineHeight: 22,
                }}>
                {t('auth.phoneHint')}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.$surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 10,
              }}>
              <Phone size={18} color={colors.$textSecondary} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '500',
                  color: colors.$textSecondary,
                }}>
                {PHONE_PREFIX}
              </Text>
              <TextInput
                value={formatPhoneDisplay(phoneDigits)}
                onChangeText={handlePhoneChange}
                placeholder="65 123456"
                placeholderTextColor={colors.$textPlaceholder}
                keyboardType="number-pad"
                autoFocus
                maxLength={11} // "65 123456" formatted
                style={{
                  flex: 1,
                  fontSize: 17,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                  padding: 0,
                }}
              />
            </View>

            {phoneError && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.$error,
                    marginTop: 10,
                  }}>
                  {phoneError}
                </Text>
              </Animated.View>
            )}

            <View style={{flex: 1}} />

            <Pressable
              onPress={handleSendCode}
              disabled={!phoneValid || sendCodeMutation.isPending}
              style={{
                backgroundColor: phoneValid
                  ? colors.$brandActive
                  : colors.$border,
                paddingVertical: 16,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}>
              {sendCodeMutation.isPending ? (
                <ActivityIndicator color={colors.$brandActiveText} />
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: phoneValid
                        ? colors.$brandActiveText
                        : colors.$textSecondary,
                    }}>
                    {t('auth.sendCode')}
                  </Text>
                  <ChevronRight
                    size={18}
                    color={
                      phoneValid
                        ? colors.$brandActiveText
                        : colors.$textSecondary
                    }
                    strokeWidth={2}
                  />
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <Animated.View
            entering={SlideInRight.duration(250)}
            exiting={SlideOutLeft.duration(200)}
            style={{flex: 1}}>
            <View style={{gap: 8, marginBottom: 32}}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '700',
                  color: colors.$textPrimary,
                }}>
                {t('auth.otpTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.$textSecondary,
                  lineHeight: 22,
                }}>
                {t('auth.otpSentTo', {phone: `${PHONE_PREFIX} ${formatPhoneDisplay(phoneDigits)}`})}
              </Text>
            </View>

            <View style={{alignItems: 'center', gap: 16}}>
              <InputOTP
                ref={otpRef}
                maxLength={OTP_LENGTH}
                value={otpValue}
                onChange={setOtpValue}
                onComplete={handleOtpComplete}
                isInvalid={otpError}>
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                  <InputOTP.Slot index={3} />
                </InputOTP.Group>
              </InputOTP>

              {isVerifying && (
                <ActivityIndicator color={colors.$textSecondary} />
              )}

              {otpError && !isVerifying && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.$error,
                      textAlign: 'center',
                    }}>
                    {t('auth.otpError')}
                  </Text>
                </Animated.View>
              )}

              <Pressable
                onPress={handleResend}
                disabled={sendCodeMutation.isPending}
                hitSlop={8}
                style={{marginTop: 8}}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.$brandActive,
                  }}>
                  {t('auth.sendCode')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;
