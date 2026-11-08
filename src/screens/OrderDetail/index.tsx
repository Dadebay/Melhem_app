import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {AxiosError} from 'axios';
import {Check, ChevronRight, Info, Package, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import {OrderStatus} from '../../lib/store/orderStore';
import orderApi from '../../lib/api/orderApi';
import getImageUrl from '../../lib/getImageUrl';

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed'];

type Props = NativeStackScreenProps<Nav.Settings, 'OrderDetail'>;

interface TimelineStep {
  title: string;
  completed: boolean;
}

const getStatusLabel = (
  t: (key: string) => string,
  status: OrderStatus,
): string => {
  const labels: Record<OrderStatus, string> = {
    pending: t('orders.pending'),
    confirmed: t('orders.confirmed'),
    preparing: t('orders.preparing'),
    ready: t('orders.ready'),
    delivering: t('orders.delivering'),
    completed: t('orders.completed'),
    cancelled: t('orders.cancelled'),
  };
  return labels[status];
};

const getStatusColors = (colors: ReturnType<typeof useColors>) => ({
  pending: colors.$statusPending,
  confirmed: colors.$statusConfirmed,
  preparing: colors.$statusPreparing,
  ready: colors.$statusReady,
  delivering: colors.$statusDelivering,
  completed: colors.$statusCompleted,
  cancelled: colors.$statusCancelled,
});

const getStatusBgColors = (colors: ReturnType<typeof useColors>) => ({
  pending: colors.$statusPendingBg,
  confirmed: colors.$statusConfirmedBg,
  preparing: colors.$statusPreparingBg,
  ready: colors.$statusReadyBg,
  delivering: colors.$statusDeliveringBg,
  completed: colors.$statusCompletedBg,
  cancelled: colors.$statusCancelledBg,
});

const formatCreatedAt = (isoString: string): string => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const OrderDetailScreen = ({route, navigation}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();
  const {orderId} = route.params;

  const {data: order, isLoading} = orderApi.useGet(orderId);
  const cancelOrder = orderApi.useCancel();

  const handleCancel = () => {
    Alert.alert(t('orderDetail.cancelTitle'), t('orderDetail.cancelConfirm'), [
      {text: t('orderDetail.cancelDismiss'), style: 'cancel'},
      {
        text: t('orderDetail.cancelAction'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder.mutateAsync(orderId);
          } catch (e) {
            const message =
              (e as AxiosError<ApiErrorResponse>)?.response?.data?.message ||
              t('orderDetail.cancelError');
            Alert.alert(t('checkout.orderErrorTitle'), String(message));
          }
        },
      },
    ]);
  };

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
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={colors.$textSecondary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: colors.$textPrimary}}>
          {t('orderDetail.orderNotFound')}
        </Text>
      </View>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const steps = getTimelineSteps(order.status, order.deliveryMethod);
  const statusColors = getStatusColors(colors);
  const statusBgColors = getStatusBgColors(colors);
  const statusColor = statusColors[order.status];

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Status Badge + Order ID */}
        <View style={{alignItems: 'center', marginBottom: 20, gap: 8}}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isCancelled
                ? colors.$errorBg
                : colors.$successBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {isCancelled ? (
              <X size={28} color={colors.$error} strokeWidth={2} />
            ) : (
              <Check size={28} color={colors.$success} strokeWidth={2.5} />
            )}
          </View>
          <View
            style={{
              backgroundColor: statusBgColors[order.status],
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 8,
            }}>
            <Text style={{fontSize: 13, fontWeight: '600', color: statusColor}}>
              {getStatusLabel(t, order.status)}
            </Text>
          </View>
          <Text style={{fontSize: 13, color: colors.$textSecondary}}>
            {t('orderDetail.orderNumber', {id: orderId.slice(0, 8)})}
          </Text>
          <Text style={{fontSize: 12, color: colors.$textPlaceholder}}>
            {formatCreatedAt(order.createdAt)}
          </Text>
        </View>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
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
                source={{
                  uri: getImageUrl('pharmacies', order.pharmacyLogo, 256),
                }}
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
          <InfoRow
            label={t('orderDetail.deliveryLabel')}
            value={
              order.deliveryMethod === 'delivery'
                ? t('orderDetail.deliveryDelivery')
                : t('orderDetail.deliveryPickup')
            }
            colors={colors}
          />

          {/* Delivery Date */}
          {order.deliveryDate && (
            <InfoRow
              label={
                order.deliveryMethod === 'delivery'
                  ? t('orderDetail.deliveryDateLabel')
                  : t('orderDetail.pickupDateLabel')
              }
              value={formatDeliveryDate(order.deliveryDate)}
              colors={colors}
            />
          )}

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <InfoRow
              label={t('orderDetail.address')}
              value={order.deliveryAddress}
              colors={colors}
            />
          )}

          {/* Recipient Phone */}
          {order.recipientPhone && (
            <InfoRow
              label={t('orderDetail.recipientPhone')}
              value={order.recipientPhone}
              colors={colors}
            />
          )}

          {/* Payment Method */}
          <InfoRow
            label={t('orderDetail.payment')}
            value={
              order.paymentMethod === 'cash'
                ? t('orderDetail.paymentCash')
                : t('orderDetail.paymentCard')
            }
            colors={colors}
          />

          {/* Delivery Fee (hidden for pickup — no delivery charge applies) */}
          {order.deliveryMethod === 'delivery' && (
            <InfoRow
              label={t('orderDetail.deliveryFee')}
              value={
                order.deliveryFee > 0
                  ? `${order.deliveryFee.toFixed(2)} ${t('cart.currency')}`
                  : t('orderDetail.free')
              }
              valueColor={order.deliveryFee > 0 ? undefined : colors.$discount}
              colors={colors}
            />
          )}

          {/* Discount */}
          {order.discount > 0 && (
            <InfoRow
              label={`${t('orderDetail.discount')}${
                order.promoCode ? ` (${order.promoCode})` : ''
              }`}
              value={`−${order.discount.toFixed(2)} ${t('cart.currency')}`}
              labelColor={colors.$discount}
              valueColor={colors.$discount}
              colors={colors}
            />
          )}

          <View
            style={{
              height: 1,
              backgroundColor: colors.$border,
              marginVertical: 4,
            }}
          />

          {/* Total */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 4,
            }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
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
              marginBottom: 16,
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

        {/* Timeline */}
        {!isCancelled && (
          <View
            style={{
              backgroundColor: colors.$surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.$textPrimary,
                marginBottom: 12,
              }}>
              {t('orderDetail.orderStatus')}
            </Text>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <View key={index} style={{flexDirection: 'row'}}>
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
                        <Check
                          size={10}
                          color={colors.$brandActiveText}
                          strokeWidth={3}
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={{
                          width: 2,
                          height: 24,
                          backgroundColor: step.completed
                            ? colors.$success
                            : colors.$border,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: step.completed ? '600' : '400',
                      color: step.completed
                        ? colors.$textPrimary
                        : colors.$textSecondary,
                      marginLeft: 10,
                      marginTop: -1,
                    }}>
                    {step.title}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Cancelled reason */}
        {isCancelled && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: colors.$errorBg,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}>
            <X
              size={18}
              color={colors.$error}
              style={{marginRight: 10, marginTop: 1}}
            />
            <Text
              style={{
                fontSize: 13,
                color: colors.$error,
                flex: 1,
                lineHeight: 18,
              }}>
              {t('orderDetail.orderCancelled')}
            </Text>
          </View>
        )}

        {/* Items List */}
        <View
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 12,
            padding: 16,
          }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.$textPrimary,
              marginBottom: 10,
            }}>
            {t('orderDetail.goods')}
          </Text>
          {order.items.map((item, index) => (
            <Pressable
              key={item.drugId}
              onPress={() => navigation.navigate('Drug', {id: item.drugId})}
              style={({pressed}) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.$border,
                opacity: pressed ? 0.6 : 1,
              })}>
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
              <ChevronRight
                size={16}
                color={colors.$textSecondary}
                strokeWidth={1.5}
                style={{marginLeft: 6}}
              />
            </Pressable>
          ))}
        </View>

        {/* Cancel action */}
        {CANCELLABLE.includes(order.status) && (
          <Pressable
            onPress={handleCancel}
            disabled={cancelOrder.isPending}
            style={{
              marginTop: 16,
              backgroundColor: colors.$errorBg,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text
              style={{fontSize: 15, fontWeight: '600', color: colors.$error}}>
              {cancelOrder.isPending
                ? t('orderDetail.cancelling')
                : t('orderDetail.cancelAction')}
            </Text>
          </Pressable>
        )}

        {/* Contact Note */}
        {!isCancelled && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: colors.$surface,
              borderRadius: 12,
              padding: 14,
              marginTop: 16,
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
        )}
      </ScrollView>
    </View>
  );
};

const InfoRow = ({
  label,
  value,
  labelColor,
  valueColor,
  colors,
}: {
  label: string;
  value: string;
  labelColor?: string;
  valueColor?: string;
  colors: ReturnType<typeof useColors>;
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    }}>
    <Text
      style={{
        fontSize: 13,
        color: labelColor ?? colors.$textSecondary,
        flex: 1,
      }}>
      {label}
    </Text>
    <Text
      style={{
        fontSize: 13,
        fontWeight: '500',
        color: valueColor ?? colors.$textPrimary,
        textAlign: 'right',
        maxWidth: '60%',
      }}>
      {value}
    </Text>
  </View>
);

export default OrderDetailScreen;
