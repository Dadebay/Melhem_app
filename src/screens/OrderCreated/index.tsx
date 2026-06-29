import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Check, Info, Package} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import {OrderStatus} from '../../lib/store/orderStore';
import orderApi from '../../lib/api/orderApi';
import getImageUrl from '../../lib/getImageUrl';

type Props = NativeStackScreenProps<Nav.Home, 'OrderCreated'>;

interface TimelineStep {
  title: string;
  completed: boolean;
}

const OrderCreatedScreen = ({navigation, route}: Props) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {orderId} = route.params;

  const {data: order, isLoading} = orderApi.useGet(orderId);

  const getTimelineSteps = (
    status: OrderStatus,
    deliveryMethod: 'pickup' | 'delivery',
  ): TimelineStep[] => {
    const stepIndex = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      delivering: 3,
      completed: 4,
      cancelled: -1,
    }[status];

    const step4Title =
      deliveryMethod === 'delivery'
        ? t('orderDetail.stepDelivering')
        : t('orderDetail.stepReady');

    return [
      {title: t('orderDetail.stepAccepted'), completed: stepIndex >= 0},
      {title: t('orderDetail.stepConfirmed'), completed: stepIndex >= 1},
      {title: t('orderDetail.stepPreparing'), completed: stepIndex >= 2},
      {title: step4Title, completed: stepIndex >= 3},
      {title: t('orderDetail.stepCompleted'), completed: stepIndex >= 4},
    ];
  };

  const formatDeliveryDate = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const months = t('checkout.months', {returnObjects: true}) as string[];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color={colors.$textSecondary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text style={{color: colors.$textPrimary}}>
          {t('orderDetail.orderNotFound')}
        </Text>
      </View>
    );
  }

  const steps = getTimelineSteps(order.status, order.deliveryMethod);

  const handleGoHome = () => {
    // Reset the cart stack to its root, then switch to the Home tab.
    // (popToTop alone would land on the Cart screen, not the home screen.)
    navigation.popToTop();
    navigation.getParent()?.navigate('HomeStack');
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}>
        {/* Success Icon */}
        <View style={{alignItems: 'center', marginBottom: 16}}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.$success,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Check size={32} color={colors.$brandActiveText} strokeWidth={2.5} />
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.$textPrimary,
            textAlign: 'center',
            marginBottom: 4,
          }}>
          {t('orderDetail.orderAccepted')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.$textSecondary,
            textAlign: 'center',
            marginBottom: 24,
          }}>
          {t('orderDetail.orderNumber', {id: orderId.slice(0, 8)})}
        </Text>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}>
          {/* Pharmacy */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}>
            {order.pharmacyLogo ? (
              <Image
                source={{uri: getImageUrl('pharmacies', order.pharmacyLogo, 256)}}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  marginRight: 10,
                  backgroundColor: colors.$border,
                }}
              />
            ) : (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  marginRight: 10,
                  backgroundColor: colors.$border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Package size={18} color={colors.$textSecondary} />
              </View>
            )}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.$textPrimary,
                flex: 1,
              }}>
              {order.pharmacyName}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.$border,
              marginBottom: 12,
            }}
          />

          {/* Delivery Method */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <Text style={{fontSize: 14, color: colors.$textSecondary}}>
              {t('orderDetail.deliveryLabel')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.$textPrimary,
              }}>
              {order.deliveryMethod === 'delivery'
                ? t('orderDetail.deliveryDelivery')
                : t('orderDetail.deliveryPickup')}
            </Text>
          </View>

          {/* Delivery Date */}
          {order.deliveryDate && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <Text style={{fontSize: 14, color: colors.$textSecondary}}>
                {order.deliveryMethod === 'delivery'
                  ? t('orderDetail.deliveryDateLabel')
                  : t('orderDetail.pickupDateLabel')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}>
                {formatDeliveryDate(order.deliveryDate)}
              </Text>
            </View>
          )}

          {/* Recipient Phone */}
          {order.recipientPhone && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <Text style={{fontSize: 14, color: colors.$textSecondary}}>
                {t('orderDetail.recipientPhone')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}>
                {order.recipientPhone}
              </Text>
            </View>
          )}

          {/* Payment Method */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <Text style={{fontSize: 14, color: colors.$textSecondary}}>
              {t('orderDetail.payment')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.$textPrimary,
              }}>
              {order.paymentMethod === 'cash'
                ? t('orderDetail.paymentCash')
                : t('orderDetail.paymentCard')}
            </Text>
          </View>

          {/* Delivery Fee (hidden for pickup — no delivery charge applies) */}
          {order.deliveryMethod === 'delivery' && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <Text style={{fontSize: 14, color: colors.$textSecondary}}>
                {t('orderDetail.deliveryFee')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: order.deliveryFee > 0 ? colors.$textPrimary : colors.$discount,
                }}>
                {order.deliveryFee > 0
                  ? `${order.deliveryFee.toFixed(2)} ${t('cart.currency')}`
                  : t('orderDetail.free')}
              </Text>
            </View>
          )}

          {/* Discount */}
          {order.discount > 0 && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <Text style={{fontSize: 14, color: colors.$discount}}>
                {t('orderDetail.discount')} {order.promoCode && `(${order.promoCode})`}
              </Text>
              <Text style={{fontSize: 14, fontWeight: '500', color: colors.$discount}}>
                −{order.discount.toFixed(2)} {t('cart.currency')}
              </Text>
            </View>
          )}

          {/* Total */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 14, color: colors.$textSecondary}}>
              {t('orderDetail.total')}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.$textPrimary,
              }}>
              {order.total.toFixed(2)} {t('cart.currency')}
            </Text>
          </View>
        </View>

        {/* Comment */}
        {order.comment && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: colors.$surface,
              borderRadius: 12,
              padding: 14,
              marginBottom: 24,
            }}>
            <Info
              size={18}
              color={colors.$textSecondary}
              style={{marginRight: 10, marginTop: 1}}
            />
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.$textPrimary,
                  marginBottom: 2,
                }}>
                {t('orderDetail.comment')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.$textSecondary,
                  lineHeight: 18,
                }}>
                {order.comment}
              </Text>
            </View>
          </View>
        )}

        {/* Vertical Timeline */}
        <View style={{marginBottom: 24}}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <View key={index} style={{flexDirection: 'row'}}>
                {/* Circle and Line */}
                <View style={{alignItems: 'center', width: 24}}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: step.completed
                        ? colors.$success
                        : 'transparent',
                      borderWidth: step.completed ? 0 : 2,
                      borderColor: colors.$border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {step.completed && (
                      <Check size={10} color={colors.$brandActiveText} strokeWidth={3} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={{
                        width: 2,
                        height: 28,
                        backgroundColor: step.completed
                          ? colors.$success
                          : colors.$border,
                      }}
                    />
                  )}
                </View>

                {/* Step Title */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: step.completed ? '600' : '400',
                    color: step.completed
                      ? colors.$textPrimary
                      : colors.$textSecondary,
                    marginLeft: 12,
                    marginTop: -1,
                  }}>
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Contact Note */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: colors.$surface,
            borderRadius: 12,
            padding: 14,
            marginBottom: 24,
          }}>
          <Info
            size={18}
            color={colors.$textSecondary}
            style={{marginRight: 10, marginTop: 1}}
          />
          <Text
            style={{
              fontSize: 13,
              color: colors.$textSecondary,
              flex: 1,
              lineHeight: 18,
            }}>
            {t('orderDetail.contactNote')}
          </Text>
        </View>

        {/* Items List */}
        <View
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 12,
            padding: 16,
          }}>
          {order.items.map((item, index) => (
            <View
              key={item.drugId}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.$border,
              }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textPrimary,
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}>
                {item.drugName}{' '}
                <Text style={{color: colors.$textSecondary}}>
                  x{item.quantity}
                </Text>
              </Text>
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
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.$background,
          borderTopWidth: 1,
          borderTopColor: colors.$border,
        }}>
        <Pressable
          onPress={handleGoHome}
          style={{
            backgroundColor: colors.$brandActive,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}>
          <Text style={{color: colors.$brandActiveText, fontSize: 16, fontWeight: '600'}}>
            {t('orderDetail.goHome')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OrderCreatedScreen;
