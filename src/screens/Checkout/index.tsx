import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {AxiosError} from 'axios';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {
  MapPin,
  Truck,
  CreditCard,
  Banknote,
  Plus,
  ChevronRight,
  Calendar,
  MessageSquare,
  Phone,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import cartStore from '../../lib/store/cartStore';
import {formatAddress} from '../../lib/store/addressStore';
import {
  DeliveryMethod,
  PaymentMethod,
} from '../../lib/store/orderStore';
import addressApi from '../../lib/api/addressApi';
import orderApi from '../../lib/api/orderApi';
import getImageUrl from '../../lib/getImageUrl';
import checkoutState from '../../lib/store/checkoutState';

type Props = NativeStackScreenProps<Nav.Home, 'Checkout'>;

const MOCK_DELIVERY_FEE = 5.0;

const CheckoutScreen = ({navigation, route}: Props) => {
  const {pharmacyId} = route.params;
  const colors = useColors();
  const {t} = useTranslation();

  const formatDate = useCallback((date: Date): string => {
    const day = date.getDate();
    const months = t('checkout.months', {returnObjects: true}) as string[];
    const weekdays = t('checkout.weekdays', {returnObjects: true}) as string[];
    return `${weekdays[date.getDay()]}, ${day} ${months[date.getMonth()]}`;
  }, [t]);

  const getDeliveryDates = useCallback((): {date: Date; label: string; shortLabel: string}[] => {
    const today = new Date();
    const weekdays = t('checkout.weekdays', {returnObjects: true}) as string[];
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0
        ? t('checkout.today')
        : i === 1
          ? t('checkout.tomorrow')
          : weekdays[d.getDay()];
      dates.push({
        date: d,
        label: formatDate(d),
        shortLabel: dayName,
      });
    }
    return dates;
  }, [formatDate, t]);
  const insets = useSafeAreaInsets();

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const {data: savedAddresses = []} = addressApi.useGetAll();
  const selectedAddressId = checkoutState(state => state.selectedAddressId);
  const setSelectedAddressId = checkoutState(
    state => state.setSelectedAddressId,
  );

  useEffect(() => {
    if (deliveryMethod === 'delivery' && !selectedAddressId) {
      const defaultAddr = savedAddresses.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (savedAddresses.length > 0) {
        setSelectedAddressId(savedAddresses[0].id);
      }
    }
  }, [deliveryMethod, savedAddresses, selectedAddressId, setSelectedAddressId]);

  const selectedAddress = useMemo(
    () => savedAddresses.find(a => a.id === selectedAddressId),
    [savedAddresses, selectedAddressId],
  );

  const deliveryAddress =
    deliveryMethod === 'delivery' && selectedAddress
      ? formatAddress(selectedAddress)
      : undefined;

  const allItems = cartStore(state => state.items);
  const items = useMemo(
    () => allItems.filter(i => i.pharmacyId === pharmacyId),
    [allItems, pharmacyId],
  );
  const removeItem = cartStore(state => state.removeItem);
  const createOrder = orderApi.useCreate();

  const pharmacyName = items[0]?.pharmacyName ?? '';
  const pharmacyLogo = items[0]?.pharmacyLogo ?? '';

  const deliveryDates = useMemo(() => getDeliveryDates(), []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const deliveryFee = deliveryMethod === 'delivery' ? MOCK_DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;

  const canSubmit =
    items.length > 0 &&
    (deliveryMethod === 'pickup' ||
      (deliveryMethod === 'delivery' && !!deliveryAddress));

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || createOrder.isPending) return;

    const selectedDate = deliveryDates[selectedDateIndex].date;

    try {
      const order = await createOrder.mutateAsync({
        pharmacyId: Number(pharmacyId),
        items: items.map(item => ({
          drugId: Number(item.drugId),
          quantity: item.quantity,
        })),
        deliveryMethod,
        paymentMethod,
        addressId:
          deliveryMethod === 'delivery' && selectedAddressId
            ? Number(selectedAddressId)
            : undefined,
        deliveryDate: selectedDate.toISOString(),
        comment: comment.trim() || undefined,
        recipientPhone: recipientPhone.trim()
          ? `+993 ${recipientPhone.trim()}`
          : undefined,
      });

      items.forEach(item => removeItem(item.drugId, item.pharmacyId));
      setSelectedAddressId(null);
      navigation.navigate('OrderCreated' as any, {orderId: order.id});
    } catch (e) {
      const message =
        (e as AxiosError<ApiErrorResponse>)?.response?.data?.message ||
        t('checkout.orderError');
      Alert.alert(t('checkout.orderErrorTitle'), String(message));
    }
  }, [
    canSubmit,
    createOrder,
    pharmacyId,
    items,
    deliveryMethod,
    paymentMethod,
    selectedAddressId,
    deliveryDates,
    selectedDateIndex,
    comment,
    recipientPhone,
    removeItem,
    setSelectedAddressId,
    navigation,
    t,
  ]);

  const SegmentButton = ({
    active,
    onPress,
    icon,
    label,
  }: {
    active: boolean;
    onPress: () => void;
    icon: React.ReactNode;
    label: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: active ? colors.$brandActive : colors.$surface,
      }}>
      {icon}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: active ? colors.$brandActiveText : colors.$textPrimary,
        }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: colors.$background}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Pharmacy Header */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <Image
            source={{uri: getImageUrl('pharmacies', pharmacyLogo, 256)}}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.$border,
            }}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {pharmacyName}
          </Text>
        </View>

        {/* Delivery Method */}
        <View style={{gap: 12}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {t('checkout.deliveryMethod')}
          </Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            <SegmentButton
              active={deliveryMethod === 'pickup'}
              onPress={() => setDeliveryMethod('pickup')}
              icon={
                <MapPin
                  size={16}
                  color={
                    deliveryMethod === 'pickup'
                      ? colors.$brandActiveText
                      : colors.$textSecondary
                  }
                  strokeWidth={1.5}
                />
              }
              label={t('checkout.pickup')}
            />
            <SegmentButton
              active={deliveryMethod === 'delivery'}
              onPress={() => setDeliveryMethod('delivery')}
              icon={
                <Truck
                  size={16}
                  color={
                    deliveryMethod === 'delivery'
                      ? colors.$brandActiveText
                      : colors.$textSecondary
                  }
                  strokeWidth={1.5}
                />
              }
              label={t('checkout.delivery')}
            />
          </View>
        </View>

        {/* Address Selection */}
        {deliveryMethod === 'delivery' && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{gap: 10}}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('checkout.deliveryAddress')}
            </Text>

            {!selectedAddress ? (
              <Pressable
                onPress={() =>
                  (navigation as any).navigate('AddressPicker', {
                    currentAddressId: selectedAddressId,
                  })
                }
                style={{
                  backgroundColor: colors.$surface,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.$background,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Plus
                    size={18}
                    color={colors.$textSecondary}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.$textSecondary,
                    flex: 1,
                  }}>
                  {t('checkout.selectAddress')}
                </Text>
                <ChevronRight
                  size={16}
                  color={colors.$textSecondary}
                  strokeWidth={2}
                />
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  (navigation as any).navigate('AddressPicker', {
                    currentAddressId: selectedAddressId,
                  })
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: colors.$brandActive,
                  backgroundColor: colors.$background,
                }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.$brandActive,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <MapPin size={16} color={colors.$brandActiveText} strokeWidth={1.5} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.$textPrimary,
                    }}>
                    {selectedAddress.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.$textSecondary,
                      marginTop: 2,
                    }}
                    numberOfLines={2}>
                    {formatAddress(selectedAddress)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.$textSecondary,
                  }}>
                  {t('checkout.changeAddress')}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* Delivery Date */}
        {deliveryMethod === 'delivery' && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{gap: 12}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Calendar
                size={16}
                color={colors.$textPrimary}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {t('checkout.deliveryDate')}
              </Text>
            </View>
            <View style={{flexDirection: 'row', gap: 8}}>
              {deliveryDates.map((d, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSelectedDateIndex(i)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    backgroundColor:
                      selectedDateIndex === i ? colors.$brandActive : colors.$surface,
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color:
                        selectedDateIndex === i
                          ? colors.$brandActiveText
                          : colors.$textPrimary,
                    }}>
                    {d.shortLabel}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color:
                        selectedDateIndex === i
                          ? colors.$brandActiveText
                          : colors.$textSecondary,
                      marginTop: 2,
                    }}>
                    {d.date.getDate()}{' '}
                    {(t('checkout.monthsShort', {returnObjects: true}) as string[])[d.date.getMonth()]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Recipient Phone (delivery only) */}
        {deliveryMethod === 'delivery' && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{gap: 10}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Phone
                size={16}
                color={colors.$textPrimary}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {t('checkout.recipientPhone')}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.$textSecondary,
                marginTop: -4,
              }}>
              {t('checkout.recipientPhoneHint')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.$surface,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 8,
              }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: colors.$textSecondary,
                }}>
                +993
              </Text>
              <TextInput
                value={recipientPhone}
                onChangeText={text => {
                  const digits = text.replace(/\D/g, '').slice(0, 8);
                  const formatted =
                    digits.length <= 2
                      ? digits
                      : `${digits.slice(0, 2)} ${digits.slice(2)}`;
                  setRecipientPhone(formatted);
                }}
                placeholder="65 123456"
                placeholderTextColor={colors.$textPlaceholder}
                keyboardType="number-pad"
                maxLength={9}
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                  padding: 0,
                }}
              />
            </View>
          </Animated.View>
        )}

        {/* Payment Method */}
        <View style={{gap: 12}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {t('checkout.paymentMethod')}
          </Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            <SegmentButton
              active={paymentMethod === 'cash'}
              onPress={() => setPaymentMethod('cash')}
              icon={
                <Banknote
                  size={16}
                  color={
                    paymentMethod === 'cash'
                      ? colors.$brandActiveText
                      : colors.$textSecondary
                  }
                  strokeWidth={1.5}
                />
              }
              label={t('checkout.cash')}
            />
            <SegmentButton
              active={paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
              icon={
                <CreditCard
                  size={16}
                  color={
                    paymentMethod === 'card'
                      ? colors.$brandActiveText
                      : colors.$textSecondary
                  }
                  strokeWidth={1.5}
                />
              }
              label={t('checkout.card')}
            />
          </View>
        </View>

        {/* Comment */}
        <View style={{gap: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <MessageSquare
              size={16}
              color={colors.$textPrimary}
              strokeWidth={1.5}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {t('checkout.comment')}
            </Text>
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t(deliveryMethod === 'pickup' ? 'checkout.commentPlaceholderPickup' : 'checkout.commentPlaceholder')}
            placeholderTextColor={colors.$textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.$surface,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              color: colors.$textPrimary,
              minHeight: 80,
            }}
          />
        </View>

        {/* Order Summary */}
        <View style={{gap: 12}}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}>
            {t('checkout.order')}
          </Text>
          <View
            style={{
              backgroundColor: colors.$surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
            }}>
            {items.map(item => (
              <View
                key={item.drugId}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    marginRight: 12,
                  }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      color: colors.$textPrimary,
                      flexShrink: 1,
                    }}>
                    {item.drugName}
                  </Text>
                  <Text style={{fontSize: 13, color: colors.$textSecondary}}>
                    x{item.quantity}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.$textPrimary,
                  }}>
                  {(item.price * item.quantity).toFixed(2)} {t('cart.currency')}
                </Text>
              </View>
            ))}
            <View style={{borderTopWidth: 1, borderColor: colors.$border}} />

            {/* Subtotal */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 14, color: colors.$textSecondary}}>
                {t('checkout.goods')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textPrimary,
                }}>
                {subtotal.toFixed(2)} {t('cart.currency')}
              </Text>
            </View>

            {/* Delivery Fee (only for delivery — pickup has no fee row) */}
            {deliveryMethod === 'delivery' && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={{fontSize: 14, color: colors.$textSecondary}}>
                  {t('checkout.deliveryFee')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color:
                      deliveryFee > 0 ? colors.$textPrimary : colors.$discount,
                  }}>
                  {deliveryFee > 0
                    ? `${deliveryFee.toFixed(2)} ${t('cart.currency')}`
                    : t('checkout.free')}
                </Text>
              </View>
            )}

            <View style={{borderTopWidth: 1, borderColor: colors.$border}} />

            {/* Total */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {t('checkout.total')}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                }}>
                {total.toFixed(2)} {t('cart.currency')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 12 : 8,
          borderTopWidth: 1,
          borderTopColor: colors.$border,
        }}>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || createOrder.isPending}
          style={{
            backgroundColor:
              canSubmit && !createOrder.isPending
                ? colors.$brandActive
                : colors.$border,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}>
          <Text
            style={{
              color:
                canSubmit && !createOrder.isPending
                  ? colors.$brandActiveText
                  : colors.$textSecondary,
              fontSize: 15,
              fontWeight: '600',
            }}>
            {createOrder.isPending
              ? t('checkout.placingOrder')
              : `${t('checkout.placeOrder')} · ${total.toFixed(2)} ${t('cart.currency')}`}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CheckoutScreen;
