import {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import {Bell, ChevronDown, MapPin} from 'lucide-react-native';
import authStore from '../../lib/store/authStore';
import LocationPickerModal from '../LocationPickerModal';

interface Props {
  /** Override the location tap (defaults to opening the region picker). */
  onLocationPress?: () => void;
}

const LocationHeader = ({onLocationPress}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();
  const location = authStore(state => state.location);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleLocationPress = onLocationPress ?? (() => setPickerOpen(true));

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 4,
        }}>
        <View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.$textPrimary,
              letterSpacing: -0.5,
            }}>
            Melhem
          </Text>
          <Pressable
            onPress={handleLocationPress}
            hitSlop={6}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginTop: 2,
            }}>
            <MapPin size={13} color={colors.$textSecondary} strokeWidth={2} />
            <Text
              style={{
                fontSize: 13,
                color: colors.$textSecondary,
              }}
              numberOfLines={1}>
              {location?.name || t('onboarding.locationTitle')}
            </Text>
            <ChevronDown
              size={14}
              color={colors.$textSecondary}
              strokeWidth={2}
            />
          </Pressable>
        </View>
        <Pressable
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.$surface,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Bell size={20} color={colors.$textPrimary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <LocationPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
};

export default LocationHeader;
