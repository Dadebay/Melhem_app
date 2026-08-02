import {useState} from 'react';
import {Image, Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {changeLanguage} from 'i18next';
import {useTranslation} from 'react-i18next';
import {Check} from 'lucide-react-native';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';
import useColors from '../../lib/hooks/useColors';
import {LEGAL_LINKS} from '../../lib/config/links';
import Logo from '../../../assets/images/logo.png';
import TmFlag from '../../../assets/images/tm-flag.png';
import RuFlag from '../../../assets/images/ru-flag.png';

type Props = NativeStackScreenProps<Nav.Onboarding, 'OnbLanguage'>;

const LANGUAGES = [
  {key: 'tm', title: 'Türkmen dili', flag: TmFlag},
  {key: 'ru', title: 'Русский', flag: RuFlag},
];

const OnboardingLanguageScreen = ({navigation}: Props) => {
  const {t, i18n} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>(i18n.language || 'tm');

  const handleSelect = (key: string) => {
    setSelected(key);
    changeLanguage(key);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.$background,
        paddingTop: insets.top + 24,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 12,
      }}>
      {/* Decorative brand-tinted glow blobs behind the content */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="welcomeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.$brandActive} stopOpacity={0.2} />
            <Stop offset="70%" stopColor={colors.$brandActive} stopOpacity={0.07} />
            <Stop offset="100%" stopColor={colors.$brandActive} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="18%" cy="9%" r="35%" fill="url(#welcomeGlow)" />
        <Circle cx="94%" cy="30%" r="28%" fill="url(#welcomeGlow)" />
        <Circle cx="6%" cy="88%" r="30%" fill="url(#welcomeGlow)" />
      </Svg>

      {/* Brand header */}
      <View style={{alignItems: 'center', marginTop: 24, marginBottom: 40}}>
        <Image
          source={Logo}
          style={{width: 96, height: 96, borderRadius: 24, marginBottom: 20}}
        />
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: colors.$textPrimary,
            marginBottom: 8,
          }}>
          Melhem
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 22,
            textAlign: 'center',
            color: colors.$textSecondary,
            maxWidth: 300,
          }}>
          {t('onboarding.tagline')}
        </Text>
      </View>

      {/* Language selector */}
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.$textSecondary,
          marginBottom: 12,
          marginLeft: 4,
        }}>
        {t('onboarding.languageTitle')}
      </Text>
      <View style={{gap: 12}}>
        {LANGUAGES.map(lang => {
          const isSelected = selected === lang.key;
          return (
            <Pressable
              key={lang.key}
              onPress={() => handleSelect(lang.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.$brandActive : colors.$border,
                backgroundColor: isSelected ? colors.$surface : colors.$background,
              }}>
              <Image
                source={lang.flag}
                style={{width: 32, height: 32, borderRadius: 16}}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {lang.title}
              </Text>
              {isSelected && (
                <Check size={22} color={colors.$brandActive} strokeWidth={2.5} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{flex: 1}} />

      <Pressable
        onPress={() => navigation.navigate('OnbLocation')}
        style={{
          backgroundColor: colors.$brandActive,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.$brandActiveText,
          }}>
          {t('onboarding.continue')}
        </Text>
      </Pressable>

      {/* Legal consent — links open the documents on melhem.app */}
      <Text
        style={{
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
          color: colors.$textSecondary,
          marginTop: 12,
          paddingHorizontal: 8,
        }}>
        {t('onboarding.agreeStart')}
        <Text
          style={{color: colors.$brandActive, textDecorationLine: 'underline'}}
          onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>
          {t('onboarding.agreeTerms')}
        </Text>
        {t('onboarding.agreeAnd')}
        <Text
          style={{color: colors.$brandActive, textDecorationLine: 'underline'}}
          onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>
          {t('onboarding.agreePrivacy')}
        </Text>
        {t('onboarding.agreeEnd')}
      </Text>
    </View>
  );
};

export default OnboardingLanguageScreen;
