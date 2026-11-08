import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn} from 'react-native-reanimated';
import {Briefcase, Home, MapPinOff, Navigation, Pin} from 'lucide-react-native';
import {AxiosError} from 'axios';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import {AddressInput} from '../../lib/store/addressStore';
import addressApi from '../../lib/api/addressApi';
import MapPicker from '../../components/MapPicker';
import {DEFAULT_CENTER} from '../../lib/config/map';

const ASHGABAT_LAT = DEFAULT_CENTER.latitude;
const ASHGABAT_LON = DEFAULT_CENTER.longitude;

type Props = NativeStackScreenProps<Nav.Settings, 'AddressDetail'>;

const AddressDetailScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();
  const addressId = route.params?.addressId;
  const isEditMode = !!addressId;

  const colors = useColors();
  const insets = useSafeAreaInsets();

  const {data: addresses} = addressApi.useGetAll();
  const existingAddress = addressId
    ? addresses?.find(a => a.id === addressId)
    : undefined;
  const createAddress = addressApi.useCreate();
  const updateMutation = addressApi.useUpdate();
  const isSaving = createAddress.isPending || updateMutation.isPending;

  const [latitude, setLatitude] = useState(
    existingAddress?.coordinates?.latitude ?? ASHGABAT_LAT,
  );
  const [longitude, setLongitude] = useState(
    existingAddress?.coordinates?.longitude ?? ASHGABAT_LON,
  );
  // Camera target — only changes on external events (geolocation / edit load),
  // never on user pan, so the map never fights the gesture.
  const [cameraTarget, setCameraTarget] = useState({
    latitude: existingAddress?.coordinates?.latitude ?? ASHGABAT_LAT,
    longitude: existingAddress?.coordinates?.longitude ?? ASHGABAT_LON,
  });
  const [label, setLabel] = useState(existingAddress?.label ?? '');
  const [city, setCity] = useState(existingAddress?.city ?? '');
  const [district, setDistrict] = useState(existingAddress?.district ?? '');
  const [street, setStreet] = useState(existingAddress?.street ?? '');
  const [house, setHouse] = useState(existingAddress?.house ?? '');
  const [apartment, setApartment] = useState(existingAddress?.apartment ?? '');
  const [isDefault, setIsDefault] = useState(
    existingAddress?.isDefault ?? false,
  );
  const [hasGeo, setHasGeo] = useState(isEditMode);
  const [geoLoading, setGeoLoading] = useState(!isEditMode);
  // Disable page scroll while a finger is on the map so the ScrollView doesn't
  // steal the pan gesture (which makes the map feel stuck / janky).
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // The user pans the map under the pin; we just store the chosen point.
  // City/district are filled in manually below.
  const handleMapChange = useCallback(
    (coordinate: {latitude: number; longitude: number}) => {
      setLatitude(coordinate.latitude);
      setLongitude(coordinate.longitude);
    },
    [],
  );

  useEffect(() => {
    if (isEditMode) return;

    let cancelled = false;

    const fetchLocation = async () => {
      try {
        // Request runtime permission on Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setHasGeo(false);
            setGeoLoading(false);
            return;
          }
        }

        const Geolocation =
          require('@react-native-community/geolocation').default;

        if (Platform.OS === 'ios') {
          Geolocation.requestAuthorization();
        }

        Geolocation.getCurrentPosition(
          (position: any) => {
            if (cancelled) return;
            const {latitude: lat, longitude: lon} = position.coords;
            setLatitude(lat);
            setLongitude(lon);
            setCameraTarget({latitude: lat, longitude: lon});
            setHasGeo(true);
            setGeoLoading(false);
          },
          () => {
            if (cancelled) return;
            setHasGeo(false);
            setGeoLoading(false);
          },
          {enableHighAccuracy: false, timeout: 7000, maximumAge: 60000},
        );
      } catch {
        if (!cancelled) {
          setHasGeo(false);
          setGeoLoading(false);
        }
      }
    };

    fetchLocation();

    return () => {
      cancelled = true;
    };
  }, [isEditMode]);

  const presets = useMemo(
    () => [
      {key: 'home', value: t('address.home'), Icon: Home},
      {key: 'work', value: t('address.work'), Icon: Briefcase},
      {key: 'other', value: t('address.other'), Icon: Pin},
    ],
    [t],
  );

  const selectedPreset = useMemo(
    () => presets.find(p => p.value === label)?.key ?? null,
    [label, presets],
  );

  const isValid = useMemo(
    () =>
      label.trim().length > 0 &&
      street.trim().length > 0 &&
      house.trim().length > 0,
    [label, street, house],
  );

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;

    const input: AddressInput = {
      label: label.trim(),
      city: city.trim(),
      district: district.trim(),
      street: street.trim(),
      house: house.trim(),
      apartment: apartment.trim() || undefined,
      coordinates: {latitude, longitude},
      isDefault,
    };

    try {
      if (isEditMode && addressId) {
        await updateMutation.mutateAsync({id: addressId, input});
      } else {
        await createAddress.mutateAsync(input);
      }
      navigation.goBack();
    } catch (e) {
      const message =
        (e as AxiosError<ApiErrorResponse>)?.response?.data?.message ||
        t('address.saveError');
      Alert.alert(t('checkout.orderErrorTitle'), String(message));
    }
  }, [
    isValid,
    isSaving,
    label,
    city,
    district,
    street,
    house,
    apartment,
    latitude,
    longitude,
    isDefault,
    isEditMode,
    addressId,
    updateMutation,
    createAddress,
    navigation,
    t,
  ]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? t('address.editAddress') : t('address.newAddress'),
    });
  }, [navigation, isEditMode, t]);

  const inputStyle = {
    backgroundColor: colors.$surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.$textPrimary,
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: colors.$background}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}>
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 100,
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* OSM map — pan to drop the pin on the delivery point. */}
        <Animated.View entering={FadeIn.duration(300)}>
          <View
            onTouchStart={() => setScrollEnabled(false)}
            onTouchEnd={() => setScrollEnabled(true)}
            onTouchCancel={() => setScrollEnabled(true)}
            style={{
              height: 180,
              borderRadius: 14,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.$border,
            }}>
            <MapPicker
              center={cameraTarget}
              onChange={handleMapChange}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Geo status messages */}
        {geoLoading && (
          <View
            style={{
              backgroundColor: colors.$surface,
              padding: 12,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <Navigation
              size={16}
              color={colors.$textSecondary}
              strokeWidth={1.5}
            />
            <Text style={{fontSize: 13, color: colors.$textSecondary}}>
              {t('address.geoDetecting')}
            </Text>
          </View>
        )}
        {!geoLoading && !hasGeo && !isEditMode && (
          <View
            style={{
              backgroundColor: colors.$surface,
              padding: 12,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <MapPinOff
              size={16}
              color={colors.$textSecondary}
              strokeWidth={1.5}
            />
            <Text style={{fontSize: 13, color: colors.$textSecondary, flex: 1}}>
              {t('address.geoUnavailable')}
            </Text>
          </View>
        )}

        {/* Label Section */}
        <View style={{gap: 10}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {t('address.labelTitle')}
          </Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            {presets.map(preset => {
              const isSelected = selectedPreset === preset.key;
              return (
                <Pressable
                  key={preset.key}
                  onPress={() => setLabel(preset.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: isSelected
                      ? colors.$brandActive
                      : colors.$surface,
                    alignItems: 'center',
                    gap: 4,
                  }}>
                  <preset.Icon
                    size={20}
                    color={
                      isSelected
                        ? colors.$brandActiveText
                        : colors.$textSecondary
                    }
                    strokeWidth={1.5}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isSelected
                        ? colors.$brandActiveText
                        : colors.$textPrimary,
                    }}>
                    {preset.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!selectedPreset && (
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={t('address.customLabel')}
              placeholderTextColor={colors.$textPlaceholder}
              style={inputStyle}
            />
          )}
        </View>

        {/* Location Fields */}
        <View style={{gap: 14}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {t('address.addressDetails')}
          </Text>

          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1, gap: 4}}>
              <Text style={{fontSize: 13, color: colors.$textSecondary}}>
                {t('address.city')}
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder={t('address.city')}
                placeholderTextColor={colors.$textPlaceholder}
                style={inputStyle}
              />
            </View>
            <View style={{flex: 1, gap: 4}}>
              <Text style={{fontSize: 13, color: colors.$textSecondary}}>
                {t('address.district')}
              </Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder={t('address.district')}
                placeholderTextColor={colors.$textPlaceholder}
                style={inputStyle}
              />
            </View>
          </View>

          <View style={{gap: 4}}>
            <Text style={{fontSize: 13, color: colors.$textSecondary}}>
              {t('address.street')} *
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder={t('address.streetPlaceholder')}
              placeholderTextColor={colors.$textPlaceholder}
              style={inputStyle}
            />
          </View>

          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1, gap: 4}}>
              <Text style={{fontSize: 13, color: colors.$textSecondary}}>
                {t('address.houseNumber')} *
              </Text>
              <TextInput
                value={house}
                onChangeText={setHouse}
                placeholder={t('address.housePlaceholder')}
                placeholderTextColor={colors.$textPlaceholder}
                style={inputStyle}
              />
            </View>
            <View style={{flex: 1, gap: 4}}>
              <Text style={{fontSize: 13, color: colors.$textSecondary}}>
                {t('address.apartment')}
              </Text>
              <TextInput
                value={apartment}
                onChangeText={setApartment}
                placeholder={t('address.optional')}
                placeholderTextColor={colors.$textPlaceholder}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
          </View>
        </View>

        {/* Default Toggle */}
        <Pressable
          onPress={() => setIsDefault(!isDefault)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.$surface,
            padding: 14,
            borderRadius: 10,
          }}>
          <Text
            style={{
              fontSize: 15,
              color: colors.$textPrimary,
              fontWeight: '500',
              flex: 1,
            }}>
            {t('address.setDefault')}
          </Text>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{false: colors.$border, true: colors.$brandActive}}
            thumbColor={colors.$brandActiveText}
          />
        </Pressable>
      </ScrollView>

      {/* Sticky Save */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 12 : 8,
          backgroundColor: colors.$background,
          borderTopWidth: 1,
          borderTopColor: colors.$border,
        }}>
        <Pressable
          onPress={handleSave}
          disabled={!isValid || isSaving}
          style={{
            backgroundColor:
              isValid && !isSaving ? colors.$brandActive : colors.$border,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}>
          <Text
            style={{
              color:
                isValid && !isSaving
                  ? colors.$brandActiveText
                  : colors.$textPlaceholder,
              fontSize: 15,
              fontWeight: '600',
            }}>
            {isSaving
              ? t('address.saving')
              : isEditMode
              ? t('address.edit')
              : t('address.save')}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddressDetailScreen;
