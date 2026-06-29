import {useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {changeLanguage} from 'i18next';
import {useTranslation} from 'react-i18next';
import {Check} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
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
        paddingBottom: insets.bottom + 16,
      }}>
      {/* Bilingual title — the language is not chosen yet */}
      <View style={{gap: 8, marginBottom: 32}}>
        <Text
          style={{fontSize: 26, fontWeight: '700', color: colors.$textPrimary}}>
          Dili saýlaň
        </Text>
        <Text
          style={{fontSize: 26, fontWeight: '700', color: colors.$textPrimary}}>
          Выберите язык
        </Text>
      </View>

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
    </View>
  );
};

export default OnboardingLanguageScreen;
