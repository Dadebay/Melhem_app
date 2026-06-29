import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TurboImage from 'react-native-turbo-image';
import {useTranslation} from 'react-i18next';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ChevronRight,
  Store,
} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
import cartStore, {CartItem} from '../../lib/store/cartStore';
import authStore from '../../lib/store/authStore';
import getImageUrl from '../../lib/getImageUrl';

type Props = NativeStackScreenProps<Nav.Home, 'Cart'>;

const CartScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const items = cartStore(state => state.items);
  const removeItem = cartStore(state => state.removeItem);
  const updateQuantity = cartStore(state => state.updateQuantity);
  const getItemsByPharmacy = cartStore(state => state.getItemsByPharmacy);

  const pharmacyGroups = useMemo(() => {
    const map = getItemsByPharmacy();
    return Array.from(map.entries());
  }, [items, getItemsByPharmacy]);

  const getSubtotal = useCallback((groupItems: CartItem[]) => {
    return groupItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }, []);

  const handleDecrement = useCallback(
    (drugId: string, pharmacyId: string, currentQty: number) => {
      if (currentQty <= 1) {
        removeItem(drugId, pharmacyId);
      } else {
        updateQuantity(drugId, pharmacyId, currentQty - 1);
      }
    },
    [removeItem, updateQuantity],
  );

  const handleIncrement = useCallback(
    (drugId: string, pharmacyId: string, currentQty: number) => {
      if (currentQty < 99) {
        updateQuantity(drugId, pharmacyId, currentQty + 1);
      }
    },
    [updateQuantity],
  );

  const isAuthenticated = authStore(state => state.isAuthenticated);

  const handleCheckout = useCallback(
    (pharmacyId: string) => {
      if (!isAuthenticated) {
        navigation.navigate('Auth' as any, {
          redirectTo: 'Checkout',
          pharmacyId,
        });
        return;
      }
      navigation.navigate('Checkout', {pharmacyId});
    },
    [navigation, isAuthenticated],
  );

  if (items.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {backgroundColor: colors.$background},
        ]}>
        <ShoppingCart size={48} color={colors.$textSecondary} strokeWidth={1} />
        <Text
          style={[
            styles.emptyTitle,
            {color: colors.$textPrimary, marginTop: 16},
          ]}>
          {t('cart.empty')}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {color: colors.$textSecondary, marginTop: 4},
          ]}>
          {t('cart.emptyHint')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.$background}]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}>
        {pharmacyGroups.map(([pharmacyId, groupItems]) => {
          const subtotal = getSubtotal(groupItems);
          const firstItem = groupItems[0];

          return (
            <View
              key={pharmacyId}
              style={[
                styles.pharmacyCard,
                {
                  backgroundColor: colors.$background,
                  borderColor: colors.$border,
                },
              ]}>
              {/* Pharmacy header */}
              <View style={styles.pharmacyHeader}>
                {firstItem.pharmacyLogo ? (
                  <TurboImage
                    source={{
                      uri: getImageUrl(
                        'pharmacies',
                        firstItem.pharmacyLogo,
                        256,
                      ),
                    }}
                    style={styles.pharmacyLogo}
                  />
                ) : (
                  <View
                    style={[
                      styles.pharmacyLogoPlaceholder,
                      {backgroundColor: colors.$surface},
                    ]}>
                    <Store
                      size={16}
                      color={colors.$textSecondary}
                      strokeWidth={1.5}
                    />
                  </View>
                )}
                <Text
                  style={[styles.pharmacyName, {color: colors.$textPrimary}]}
                  numberOfLines={1}>
                  {firstItem.pharmacyName}
                </Text>
              </View>

              {/* Cart items */}
              {groupItems.map((item, index) => (
                <View
                  key={item.drugId}
                  style={[
                    styles.itemRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.$border,
                    },
                  ]}>
                  <TurboImage
                    source={{
                      uri: getImageUrl('drugs', item.drugImage, 256),
                    }}
                    style={styles.drugImage}
                  />

                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        styles.drugName,
                        {color: colors.$textPrimary},
                      ]}
                      numberOfLines={2}>
                      {item.drugName}
                    </Text>
                    <Text
                      style={[
                        styles.formulation,
                        {color: colors.$textSecondary},
                      ]}
                      numberOfLines={1}>
                      {item.formulation}
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    <Text
                      style={[
                        styles.itemPrice,
                        {color: colors.$textPrimary},
                      ]}>
                      {(item.price * item.quantity).toFixed(2)}{' '}
                      <Text
                        style={[
                          styles.itemCurrency,
                          {color: colors.$textSecondary},
                        ]}>
                        {t('cart.currency')}
                      </Text>
                    </Text>

                    <View style={styles.quantityRow}>
                      <Pressable
                        onPress={() =>
                          handleDecrement(
                            item.drugId,
                            item.pharmacyId,
                            item.quantity,
                          )
                        }
                        style={[
                          styles.qtyButton,
                          {borderColor: colors.$border},
                        ]}
                        hitSlop={4}>
                        {item.quantity <= 1 ? (
                          <Trash2
                            size={12}
                            color={colors.$textSecondary}
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Minus
                            size={12}
                            color={colors.$textPrimary}
                            strokeWidth={1.5}
                          />
                        )}
                      </Pressable>

                      <Text
                        style={[
                          styles.qtyText,
                          {color: colors.$textPrimary},
                        ]}>
                        {item.quantity}
                      </Text>

                      <Pressable
                        onPress={() =>
                          handleIncrement(
                            item.drugId,
                            item.pharmacyId,
                            item.quantity,
                          )
                        }
                        style={[
                          styles.qtyButton,
                          {borderColor: colors.$border},
                        ]}
                        hitSlop={4}>
                        <Plus
                          size={12}
                          color={colors.$textPrimary}
                          strokeWidth={1.5}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}

              {/* Subtotal + checkout */}
              <View
                style={[
                  styles.footerSection,
                  {borderTopColor: colors.$border},
                ]}>
                <View style={styles.subtotalRow}>
                  <Text
                    style={[
                      styles.subtotalLabel,
                      {color: colors.$textSecondary},
                    ]}>
                    {t('cart.total')}
                  </Text>
                  <Text
                    style={[
                      styles.subtotalValue,
                      {color: colors.$textPrimary},
                    ]}>
                    {subtotal.toFixed(2)} {t('cart.currency')}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleCheckout(pharmacyId)}
                  style={[
                    styles.checkoutButton,
                    {backgroundColor: colors.$brandActive},
                  ]}>
                  <Text
                    style={[
                      styles.checkoutText,
                      {color: colors.$brandActiveText},
                    ]}>
                    {t('cart.placeOrder')}
                  </Text>
                  <ChevronRight
                    size={18}
                    color={colors.$background}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  pharmacyCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pharmacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  pharmacyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pharmacyLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  drugImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  drugName: {
    fontSize: 14,
    fontWeight: '500',
  },
  formulation: {
    fontSize: 12,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCurrency: {
    fontSize: 11,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 18,
    textAlign: 'center',
  },
  footerSection: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 14,
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  checkoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CartScreen;
