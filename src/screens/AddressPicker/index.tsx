import {ActivityIndicator, Alert, FlatList, Pressable, Text, View} from 'react-native';
import {Check, MapPin, Pencil, Plus, Star, Trash2} from 'lucide-react-native';
import Animated, {FadeIn, FadeOut, LinearTransition} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import {formatAddress, SavedAddress} from '../../lib/store/addressStore';
import addressApi from '../../lib/api/addressApi';
import checkoutState from '../../lib/store/checkoutState';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCallback} from 'react';

interface Props {
  navigation: any;
  route: any;
}

const AddressPickerScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // mode: 'pick' = from checkout (tap = select & go back), 'manage' = from settings (full CRUD)
  const mode: 'pick' | 'manage' = route.params?.mode ?? 'pick';
  const currentId = route.params?.currentAddressId as string | undefined;

  const {data: addresses = [], isLoading} = addressApi.useGetAll();
  const removeAddress = addressApi.useRemove();
  const setDefault = addressApi.useSetDefault();

  const handleSelect = useCallback(
    (id: string) => {
      if (mode === 'pick') {
        checkoutState.getState().setSelectedAddressId(id);
        navigation.goBack();
      } else {
        setDefault.mutate(id);
      }
    },
    [mode, navigation, setDefault],
  );

  const handleDelete = useCallback(
    (id: string, label: string) => {
      Alert.alert(t('address.deleteTitle'), t('address.deleteConfirm', {label}), [
        {text: t('address.deleteCancel'), style: 'cancel'},
        {
          text: t('address.deleteAction'),
          style: 'destructive',
          onPress: () => removeAddress.mutate(id),
        },
      ]);
    },
    [removeAddress, t],
  );

  const renderItem = useCallback(
    ({item}: {item: SavedAddress}) => {
      const isSelected = mode === 'pick' && currentId === item.id;
      const formatted = formatAddress(item);

      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition.duration(200)}>
          <Pressable
            onPress={() => handleSelect(item.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: isSelected ? colors.$brandActive : colors.$border,
              backgroundColor: colors.$background,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isSelected ? colors.$brandActive : colors.$surface,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <MapPin
                size={18}
                color={isSelected ? colors.$brandActiveText : colors.$textSecondary}
                strokeWidth={1.5}
              />
            </View>

            <View style={{flex: 1}}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.$textPrimary,
                  }}>
                  {item.label}
                </Text>
                {item.isDefault && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      backgroundColor: colors.$warningBg,
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                    }}>
                    <Star
                      size={9}
                      color={colors.$warning}
                      fill={colors.$warning}
                      strokeWidth={0}
                    />
                    <Text
                      style={{fontSize: 9, fontWeight: '600', color: colors.$warning}}>
                      {t('address.default')}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.$textSecondary,
                  marginTop: 2,
                }}
                numberOfLines={2}>
                {formatted}
              </Text>

              {/* Actions — only in manage mode */}
              {mode === 'manage' && (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 8,
                  }}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('AddressDetail', {
                        addressId: item.id,
                      })
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor: colors.$surface,
                    }}>
                    <Pencil
                      size={12}
                      color={colors.$textSecondary}
                      strokeWidth={1.5}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: colors.$textSecondary,
                      }}>
                      {t('address.edit')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item.id, item.label)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor: colors.$errorBg,
                    }}>
                    <Trash2 size={12} color={colors.$error} strokeWidth={1.5} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: colors.$error,
                      }}>
                      {t('common.delete')}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Right side: check in pick mode, edit icon in pick mode for non-selected */}
            {mode === 'pick' &&
              (isSelected ? (
                <Check size={20} color={colors.$brandActive} strokeWidth={2.5} />
              ) : (
                <Pressable
                  onPress={() =>
                    navigation.navigate('AddressDetail', {
                      addressId: item.id,
                    })
                  }
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.$surface,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Pencil
                    size={14}
                    color={colors.$textSecondary}
                    strokeWidth={1.5}
                  />
                </Pressable>
              ))}
          </Pressable>
        </Animated.View>
      );
    },
    [colors, currentId, handleDelete, handleSelect, mode, navigation, t],
  );

  const renderEmpty = useCallback(
    () => (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.$surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 14,
          }}>
          <MapPin
            size={24}
            color={colors.$textSecondary}
            strokeWidth={1.5}
          />
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.$textPrimary,
            textAlign: 'center',
          }}>
          {t('address.noAddresses')}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.$textSecondary,
            textAlign: 'center',
            marginTop: 4,
          }}>
          {t('address.noAddressesHint')}
        </Text>
      </View>
    ),
    [colors, t],
  );

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <FlatList
        data={addresses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          isLoading ? (
            <View style={{paddingTop: 80, alignItems: 'center'}}>
              <ActivityIndicator color={colors.$textSecondary} />
            </View>
          ) : (
            renderEmpty
          )
        }
        contentContainerStyle={[
          {padding: 16, gap: 10},
          addresses.length === 0 && {flex: 1},
        ]}
        showsVerticalScrollIndicator={false}
      />

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 12 : 8,
          borderTopWidth: 1,
          borderTopColor: colors.$border,
        }}>
        <Pressable
          onPress={() => navigation.navigate('AddressDetail', {})}
          style={{
            backgroundColor: colors.$brandActive,
            paddingVertical: 14,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
          <Plus size={18} color={colors.$brandActiveText} strokeWidth={2} />
          <Text style={{color: colors.$brandActiveText, fontSize: 15, fontWeight: '600'}}>
            {t('address.addNew')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AddressPickerScreen;
