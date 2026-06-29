import {memo} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Check, MapPin, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import locationApi from '../../lib/api/locationApi';
import authStore from '../../lib/store/authStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Bottom-sheet to switch the selected region. Saves to authStore.location. */
const LocationPickerModal = ({visible, onClose}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const location = authStore(state => state.location);
  const setLocation = authStore(state => state.setLocation);

  // Only fetch while the sheet is open.
  const query = locationApi.useGetTopLevel({enabled: visible});

  const handleSelect = (loc: Location.Item) => {
    setLocation({id: loc.id, name: loc.name});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            backgroundColor: colors.$background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 12,
            maxHeight: '75%',
          }}>
          {/* Grabber */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.$border,
              marginBottom: 12,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              marginBottom: 12,
            }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.$textPrimary,
              }}>
              {t('onboarding.locationTitle')}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.$surface,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <X size={18} color={colors.$textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Body */}
          {query.isLoading ? (
            <View style={{paddingVertical: 40, alignItems: 'center'}}>
              <ActivityIndicator color={colors.$textSecondary} />
            </View>
          ) : query.isError ? (
            <View
              style={{
                paddingVertical: 30,
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 40,
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
                onPress={() => query.refetch()}
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
                paddingBottom: 8,
                gap: 10,
              }}
              showsVerticalScrollIndicator={false}>
              {(query.data ?? []).length === 0 && (
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.$textSecondary,
                    textAlign: 'center',
                    marginTop: 30,
                  }}>
                  {t('onboarding.locationEmpty')}
                </Text>
              )}
              {(query.data ?? []).map(loc => {
                const selected = location?.id === loc.id;
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => handleSelect(loc)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 16,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: selected
                        ? colors.$brandActive
                        : colors.$border,
                      backgroundColor: selected
                        ? colors.$surface
                        : colors.$background,
                    }}>
                    <MapPin
                      size={20}
                      color={
                        selected ? colors.$brandActive : colors.$textSecondary
                      }
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
                    {selected && (
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
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default memo(LocationPickerModal);
