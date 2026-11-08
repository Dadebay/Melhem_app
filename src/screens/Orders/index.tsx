import {useState, useMemo, useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import {Tabs} from 'heroui-native';
import {
  Package,
  PackageCheck,
  PackageX,
  Clock,
  Store,
} from 'lucide-react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import usePullToRefresh from '../../lib/hooks/usePullToRefresh';
import {Order, OrderStatus} from '../../lib/store/orderStore';
import orderApi from '../../lib/api/orderApi';
import getImageUrl from '../../lib/getImageUrl';

type Props = NativeStackScreenProps<Nav.Settings, 'Orders'>;

const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
];

const getStatusLabel = (t: any, status: OrderStatus): string => {
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

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} ${hours}:${minutes}`;
};

const PharmacyLogo = ({
  logo,
  colors,
}: {
  logo: string;
  colors: ReturnType<typeof useColors>;
}) => {
  const [failed, setFailed] = useState(false);

  if (!logo || failed) {
    return (
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: colors.$surface,
          borderWidth: 1,
          borderColor: colors.$border,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Store size={16} color={colors.$textSecondary} strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <Image
      source={{uri: getImageUrl('pharmacies', logo, 256)}}
      onError={() => setFailed(true)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.$border,
        backgroundColor: colors.$surface,
      }}
    />
  );
};

const OrderCard = ({
  order,
  colors,
  onPress,
  t,
}: {
  order: Order;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  t: any;
}) => {
  const statusColors = getStatusColors(colors);
  const statusBgColors = getStatusBgColors(colors);
  const statusColor = statusColors[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.$surface,
        borderRadius: 14,
        padding: 14,
        gap: 12,
      }}>
      {/* Header: Pharmacy + Status */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flex: 1,
          }}>
          <PharmacyLogo logo={order.pharmacyLogo} colors={colors} />
          <View style={{flex: 1}}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.$textPrimary,
              }}>
              {order.pharmacyName}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
              }}>
              <Clock
                size={11}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
              <Text style={{fontSize: 12, color: colors.$textSecondary}}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            backgroundColor: statusBgColors[order.status],
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}>
          <Text style={{fontSize: 11, fontWeight: '600', color: statusColor}}>
            {getStatusLabel(t, order.status)}
          </Text>
        </View>
      </View>

      {/* Footer: Items count + Total */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: colors.$border,
          paddingTop: 10,
        }}>
        <Text style={{fontSize: 13, color: colors.$textSecondary}}>
          {t('orders.items', {count: itemCount})}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: colors.$textPrimary,
          }}>
          {order.total.toFixed(2)} {t('cart.currency')}
        </Text>
      </View>
    </Pressable>
  );
};

const EmptyState = ({
  icon,
  iconBgColor,
  title,
  subtitle,
  colors,
}: {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useColors>;
}) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
      paddingHorizontal: 40,
      gap: 16,
    }}>
    <View
      style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: iconBgColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {icon}
    </View>
    <Text
      style={{
        fontSize: 17,
        fontWeight: '600',
        color: colors.$textPrimary,
        textAlign: 'center',
      }}>
      {title}
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: colors.$textSecondary,
        textAlign: 'center',
        lineHeight: 20,
      }}>
      {subtitle}
    </Text>
  </View>
);

const OrdersScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const initialTab = route.params?.initialTab ?? 'active';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const {refreshing, onRefresh} = usePullToRefresh();

  const {data: orders = [], isLoading} = orderApi.useGetAll();

  const activeOrders = useMemo(
    () => orders.filter(o => ACTIVE_STATUSES.includes(o.status)),
    [orders],
  );
  const completedOrders = useMemo(
    () => orders.filter(o => o.status === 'completed'),
    [orders],
  );
  const cancelledOrders = useMemo(
    () => orders.filter(o => o.status === 'cancelled'),
    [orders],
  );

  const currentOrders =
    activeTab === 'active'
      ? activeOrders
      : activeTab === 'completed'
      ? completedOrders
      : cancelledOrders;

  const handleOrderPress = useCallback(
    (orderId: string) => {
      navigation.navigate('OrderDetail', {orderId});
    },
    [navigation],
  );

  const renderEmptyState = () => {
    if (activeTab === 'active') {
      return (
        <EmptyState
          icon={
            <Package
              size={32}
              color={colors.$statusPending}
              strokeWidth={1.5}
            />
          }
          iconBgColor={colors.$statusPendingBg}
          title={t('orders.noActive')}
          subtitle={t('orders.noActiveHint')}
          colors={colors}
        />
      );
    }
    if (activeTab === 'completed') {
      return (
        <EmptyState
          icon={
            <PackageCheck
              size={32}
              color={colors.$statusCompleted}
              strokeWidth={1.5}
            />
          }
          iconBgColor={colors.$statusCompletedBg}
          title={t('orders.noCompleted')}
          subtitle={t('orders.noCompletedHint')}
          colors={colors}
        />
      );
    }
    return (
      <EmptyState
        icon={
          <PackageX
            size={32}
            color={colors.$statusCancelled}
            strokeWidth={1.5}
          />
        }
        iconBgColor={colors.$statusCancelledBg}
        title={t('orders.noCancelled')}
        subtitle={t('orders.noCancelledHint')}
        colors={colors}
      />
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        variant="primary"
        style={{flex: 1}}>
        <Tabs.List className="self-center mt-3 mb-1">
          <Tabs.Indicator />
          <Tabs.Trigger value="active">
            <Tabs.Label>{t('orders.active')}</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="completed">
            <Tabs.Label>{t('orders.completedTab')}</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="cancelled">
            <Tabs.Label>{t('orders.cancelledTab')}</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value={activeTab} style={{flex: 1}}>
          {isLoading ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator color={colors.$textSecondary} />
            </View>
          ) : currentOrders.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={currentOrders}
              keyExtractor={item => item.id}
              contentContainerStyle={{
                padding: 16,
                gap: 12,
              }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
              renderItem={({item}) => (
                <OrderCard
                  order={item}
                  colors={colors}
                  onPress={() => handleOrderPress(item.id)}
                  t={t}
                />
              )}
            />
          )}
        </Tabs.Content>
      </Tabs>
    </View>
  );
};

import LoginWall from '../../components/LoginWall';

const OrdersScreenWithAuth = (props: Props) => (
  <LoginWall>
    <OrdersScreen {...props} />
  </LoginWall>
);

export default OrdersScreenWithAuth;
