import {useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {Check, MapPin} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
import locationApi from '../../lib/api/locationApi';
import authStore from '../../lib/store/authStore';

type Props = NativeStackScreenProps<Nav.Onboarding, 'OnbLocation'>;

const OnboardingLocationScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const setLocation = authStore(state => state.setLocation);

  const locationsQuery = locationApi.useGetTopLevel();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = locationsQuery.data?.find(l => l.id === selectedId) ?? null;

  const handleContinue = () => {
    if (!selected) return;
    setLocation({id: selected.id, name: selected.name});
    navigation.navigate('Auth', {onboarding: true});
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.$background,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 16,
      }}>
      <View style={{gap: 8, marginBottom: 24, paddingHorizontal: 20}}>
        <Text
          style={{fontSize: 26, fontWeight: '700', color: colors.$textPrimary}}>
          {t('onboarding.locationTitle')}
        </Text>
        <Text style={{fontSize: 15, color: colors.$textSecondary, lineHeight: 22}}>
          {t('onboarding.locationSubtitle')}
        </Text>
      </View>

      {locationsQuery.isLoading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator color={colors.$textSecondary} />
        </View>
      ) : locationsQuery.isError ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
            gap: 12,
          }}>
          <Text
            style={{
              fontSize: 14,
              color: colors.$textSecondary,
              textAlign: 'center',
            }}>
            {t('onboarding.locationError')}
          </Text>
          <Pressable
            onPress={() => locationsQuery.refetch()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: colors.$surface,
            }}>
            <Text style={{fontWeight: '600', color: colors.$textPrimary}}>
              {t('onboarding.retry')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 16,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}>
          {(locationsQuery.data ?? []).length === 0 && (
            <Text
              style={{
                fontSize: 14,
                color: colors.$textSecondary,
                textAlign: 'center',
                marginTop: 40,
              }}>
              {t('onboarding.locationEmpty')}
            </Text>
          )}
          {(locationsQuery.data ?? []).map(loc => {
            const isSelected = selectedId === loc.id;
            return (
              <Pressable
                key={loc.id}
                onPress={() => setSelectedId(loc.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: isSelected
                    ? colors.$brandActive
                    : colors.$border,
                  backgroundColor: isSelected
                    ? colors.$surface
                    : colors.$background,
                }}>
                <MapPin
                  size={20}
                  color={isSelected ? colors.$brandActive : colors.$textSecondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.$textPrimary,
                  }}>
                  {loc.name}
                </Text>
                {isSelected && (
                  <Check
                    size={22}
                    color={colors.$brandActive}
                    strokeWidth={2.5}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={{paddingHorizontal: 20, paddingTop: 8}}>
        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          style={{
            backgroundColor: selected ? colors.$brandActive : colors.$border,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: selected ? colors.$brandActiveText : colors.$textSecondary,
            }}>
            {t('onboarding.continue')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingLocationScreen;
