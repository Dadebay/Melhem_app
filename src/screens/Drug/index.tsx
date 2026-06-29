import {NativeStackScreenProps} from '@react-navigation/native-stack';
import drugApi from '../../lib/api/drugApi';
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import useDrugLayout from './useLayout';
import {useCallback, useMemo, useRef, useState} from 'react';
import DrugImageCarousel from './ImageCarousel';
import utils from '../../lib/utils';
import TurboImage from 'react-native-turbo-image';
import getImageUrl from '../../lib/getImageUrl';
import useColors from '../../lib/hooks/useColors';
import useLocationId from '../../lib/hooks/useLocationId';
import {Accordion, AccordionLayoutTransition} from 'heroui-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import PopularProductsList from '../../components/PopularProductsList';
import cartStore from '../../lib/store/cartStore';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  Factory,
  Globe,
  Pill,
  Plus,
  ShoppingCart,
  FlaskConical,
  Layers,
  Package,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<Nav.Shared, 'Drug'>;

// --- Spec Row ---
const SpecRow = ({
  icon,
  label,
  value,
  colors,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
}) => {
  if (!value || value.trim() === '') {
    return null;
  }

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
      }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.$surface,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {icon}
      </View>
      <View style={{flex: 1}}>
        <Text style={{fontSize: 12, color: colors.$textSecondary}}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.$textPrimary,
            marginTop: 1,
          }}>
          {value}
        </Text>
      </View>
      {onPress && (
        <ChevronRight
          size={14}
          color={colors.$textSecondary}
          strokeWidth={2}
        />
      )}
    </Wrapper>
  );
};

// --- Pharmacy Price Row ---
const PharmacyPriceRow = ({
  pharmacy,
  price,
  colors,
  onAddToCart,
  isBestPrice,
  isSelected,
  isFirst,
  t,
}: {
  pharmacy: Drug.Pharmacy;
  price: number;
  colors: ReturnType<typeof useColors>;
  onAddToCart: () => void;
  isBestPrice: boolean;
  isSelected: boolean;
  isFirst: boolean;
  t: (key: string, opts?: any) => string;
}) => {
  return (
    <View
      style={{
        paddingVertical: 14,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: colors.$border,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <TurboImage
          source={{uri: getImageUrl('pharmacies', pharmacy.image ?? '', 256)}}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.$surface,
          }}
        />
        <View style={{flex: 1, gap: 4}}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.$textPrimary,
            }}
            numberOfLines={1}>
            {pharmacy.name}
          </Text>
          <View style={{flexDirection: 'row', gap: 6}}>
            {isBestPrice && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: colors.$warningBg,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                <Award size={10} color={colors.$warning} strokeWidth={2} />
                <Text
                  style={{fontSize: 10, color: colors.$warning, fontWeight: '600'}}>
                  {t('drug.bestPrice')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.$textPrimary,
          }}>
          {price.toFixed(2)}
          <Text
            style={{
              fontSize: 12,
              fontWeight: '400',
              color: colors.$textSecondary,
            }}>
            {' '}
            TMT
          </Text>
        </Text>
        <Pressable
          onPress={onAddToCart}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isSelected ? colors.$textPrimary : colors.$surface,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {isSelected ? (
            <Check size={18} color={colors.$brandActiveText} strokeWidth={2.5} />
          ) : (
            <Plus size={18} color={colors.$textPrimary} strokeWidth={2} />
          )}
        </Pressable>
      </View>
    </View>
  );
};

// --- Main Screen ---
const DrugScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const locationId = useLocationId();
  const bottomInset = useSafeAreaInsets().bottom;

  const drugQuery = drugApi.useGet({drugId: route.params.id});

  useDrugLayout({navigation, data: drugQuery.data, t});

  const scrollRef = useRef<ScrollView>(null);
  const pharmaciesY = useRef(0);

  // Scroll-driven hide/show of the "select pharmacy" CTA.
  const scrollY = useSharedValue(0);
  const viewportH = useSharedValue(0);
  // Absolute Y of the pharmacy list top; huge until measured so the CTA stays visible.
  const listTop = useSharedValue(Number.MAX_SAFE_INTEGER);
  const [ctaInteractive, setCtaInteractive] = useState(true);

  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const scrollToPharmacies = useCallback(() => {
    scrollRef.current?.scrollTo({y: pharmaciesY.current, animated: true});
  }, []);

  // CTA hides once the top of the pharmacy list enters the bottom of the viewport.
  const ctaAnimatedStyle = useAnimatedStyle(() => {
    const hidden = scrollY.value + viewportH.value > listTop.value + 40;
    return {
      opacity: withTiming(hidden ? 0 : 1, {duration: 220}),
      transform: [{translateY: withTiming(hidden ? 40 : 0, {duration: 220})}],
    };
  });

  useAnimatedReaction(
    () => scrollY.value + viewportH.value > listTop.value + 40,
    (hidden, prev) => {
      if (hidden !== prev) {
        runOnJS(setCtaInteractive)(!hidden);
      }
    },
  );

  const drug = useMemo(() => drugQuery.data, [drugQuery.data]);

  const pharmacies = useMemo(
    () => [...(drug?.pharmacies ?? [])].sort((a, b) => a.price - b.price),
    [drug?.pharmacies],
  );

  const bestPrice = pharmacies[0]?.price;

  const isInCart = cartStore(state => state.isInCart(route.params.id));
  const cartPharmacyId = cartStore(state =>
    state.getCartPharmacyId(route.params.id),
  );
  const addItem = cartStore(state => state.addItem);
  const removeItem = cartStore(state => state.removeItem);

  const handleAddToCart = useCallback(
    (pharmacy: Drug.Pharmacy) => {
      if (!drug) return;
      const pharmacyId = String(pharmacy.id);
      const alreadySelected = cartPharmacyId === pharmacyId;
      if (alreadySelected) {
        removeItem(String(drug.id), pharmacyId);
      } else {
        addItem({
          drugId: String(drug.id),
          drugName: drug.name ?? '',
          drugImage: drug.images[0] || '',
          formulation: utils.getPrettyFormulation({
            form: drug.form,
            strength: drug.strength,
            unit: drug.unit,
          }),
          pharmacyId,
          pharmacyName: pharmacy.name,
          pharmacyLogo: pharmacy.image ?? '',
          price: pharmacy.price,
        });
      }
    },
    [drug, cartPharmacyId, addItem, removeItem],
  );

  // CTA: 1 pharmacy → auto-add, multiple → scroll to selection
  const handleCtaPress = useCallback(() => {
    if (pharmacies.length === 1) {
      handleAddToCart(pharmacies[0]);
    } else {
      scrollToPharmacies();
    }
  }, [pharmacies, handleAddToCart, scrollToPharmacies]);

  // Similar drugs
  const firstCategoryId = drug?.category?.id;
  const similarDrugsQuery = drugApi.useGetAll({
    page: 1,
    size: 10,
    category_id: firstCategoryId,
    location_id: locationId,
  });

  const similarDrugs = useMemo(
    () =>
      (similarDrugsQuery.data?.drugs || []).filter(
        d => d.id !== Number(route.params.id),
      ),
    [similarDrugsQuery.data, route.params.id],
  );

  const handleCategoryPress = useCallback(
    (categoryId: number, categoryName: string) => {
      navigation.push('Drugs', {
        title: categoryName,
        queries: {category_id: categoryId},
      });
    },
    [navigation],
  );

  const handleManufacturerPress = useCallback(() => {
    if (drug?.manufacturer) {
      navigation.push('Drugs', {
        title: drug.manufacturer.name ?? '',
        queries: {manufacturer_id: drug.manufacturer.id},
      });
    }
  }, [navigation, drug]);

  const handleCountryPress = useCallback(() => {
    if (drug?.country) {
      navigation.push('Drugs', {
        title: drug.country.name ?? '',
        queries: {country_id: drug.country.id},
      });
    }
  }, [navigation, drug]);

  if (drugQuery.isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={colors.$textSecondary} />
      </View>
    );
  }

  if (!drug) {
    return null;
  }

  const minPrice = drug.min_price;
  const hasMultiplePrices =
    drug.min_price != null && drug.min_price !== drug.max_price;
  const priceLabel =
    route.params.price
      ? `${route.params.price.toFixed(2)} TMT`
      : minPrice != null
        ? `${minPrice.toFixed(2)} TMT`
        : null;

  const isRange = !route.params.price && hasMultiplePrices;

  const prettyFormulation = utils.getPrettyFormulation({
    form: drug.form,
    strength: drug.strength,
    unit: drug.unit,
  });
  const hasPharmacies = pharmacies.length > 0;

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      <Animated.ScrollView
        ref={scrollRef}
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: hasPharmacies ? 90 : 40}}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onLayout={e => {
          viewportH.value = e.nativeEvent.layout.height;
        }}
        showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={{paddingTop: 12}}>
          <DrugImageCarousel data={drug.images} />
        </View>

        {/* Core Info */}
        <View style={{paddingHorizontal: 20, paddingTop: 20, gap: 6}}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.$textPrimary,
              letterSpacing: -0.5,
            }}>
            {drug.name}
          </Text>
          <Text style={{fontSize: 15, color: colors.$textSecondary}}>
            {prettyFormulation}
            {drug.count ? ` · ${t('drug.countValue', {count: drug.count})}` : ''}
          </Text>

          {/* Price inline */}
          {priceLabel && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 4,
                marginTop: 8,
              }}>
              {isRange && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.$textSecondary,
                    fontWeight: '500',
                  }}>
                  {t('drug.fromPrice')}
                </Text>
              )}
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.$textPrimary,
                  letterSpacing: -0.3,
                }}>
                {priceLabel}
              </Text>
            </View>
          )}

          {/* Pharmacy badge (if navigated from specific pharmacy) */}
          {route.params.pharmacy && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
              }}>
              <TurboImage
                source={{
                  uri: getImageUrl(
                    'pharmacies',
                    route.params.pharmacy.logo,
                    256,
                  ),
                }}
                style={{width: 20, height: 20, borderRadius: 5}}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.$textSecondary,
                  fontWeight: '500',
                }}>
                {route.params.pharmacy.name}
              </Text>
            </View>
          )}

          {/* Category */}
          {drug.category && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginTop: 10, marginHorizontal: -20}}
              contentContainerStyle={{paddingHorizontal: 20, gap: 8}}>
              <Pressable
                onPress={() =>
                  drug.category &&
                  handleCategoryPress(drug.category.id, drug.category.name ?? '')
                }
                style={{
                  backgroundColor: colors.$surface,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.$textPrimary,
                  }}>
                  {drug.category.name}
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.$border,
            marginHorizontal: 20,
            marginTop: 20,
          }}
        />

        {/* Specifications */}
        <View style={{paddingHorizontal: 20, paddingTop: 16}}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.$textPrimary,
              letterSpacing: -0.3,
              marginBottom: 4,
            }}>
            {t('drug.specifications')}
          </Text>
          <SpecRow
            icon={
              <Pill size={18} color={colors.$textSecondary} strokeWidth={1.5} />
            }
            label={t('drug.form')}
            value={utils.formTranslations[drug.form]}
            colors={colors}
          />
          <SpecRow
            icon={
              <FlaskConical
                size={18}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
            }
            label={t('drug.dosage')}
            value={
              drug.strength && drug.unit
                ? `${drug.strength} ${drug.unit}`
                : ''
            }
            colors={colors}
          />
          <SpecRow
            icon={
              <Layers
                size={18}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
            }
            label={t('drug.activeSubstance')}
            value={drug.activeSubstances
              .map(substance => substance.name)
              .filter(Boolean)
              .join(', ')}
            colors={colors}
          />
          <SpecRow
            icon={
              <Factory
                size={18}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
            }
            label={t('drug.manufacturer')}
            value={drug.manufacturer?.name || ''}
            colors={colors}
            onPress={drug.manufacturer ? handleManufacturerPress : undefined}
          />
          <SpecRow
            icon={
              <Globe
                size={18}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
            }
            label={t('drug.country')}
            value={drug.country?.name || ''}
            colors={colors}
            onPress={drug.country ? handleCountryPress : undefined}
          />
          <SpecRow
            icon={
              <Package
                size={18}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
            }
            label={t('drug.count')}
            value={
              drug.count ? t('drug.countValue', {count: drug.count}) : ''
            }
            colors={colors}
          />
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.$border,
            marginHorizontal: 20,
            marginTop: 8,
          }}
        />

        {/* Medical Information */}
        <View style={{paddingHorizontal: 20, paddingTop: 16}}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.$textPrimary,
              letterSpacing: -0.3,
              marginBottom: 4,
            }}>
            {t('drug.information')}
          </Text>
          <Accordion selectionMode="multiple" defaultValue={[]}>
            {[
              {
                key: 'ingredients',
                title: t('drug.composition'),
                content: drug.description,
              },
              {
                key: 'indications',
                title: t('drug.indications'),
                content: null,
              },
              {
                key: 'methods',
                title: t('drug.methodsOfUse'),
                content: drug.instructions,
              },
              {
                key: 'sideEffects',
                title: t('drug.sideEffects'),
                content: null,
              },
              {
                key: 'contraindications',
                title: t('drug.contraindications'),
                content: null,
              },
            ]
              .filter(item => !!item.content)
              .map(item => (
                <Accordion.Item key={item.key} value={item.key}>
                  <Accordion.Trigger>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: colors.$textPrimary,
                        flex: 1,
                      }}>
                      {item.title}
                    </Text>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.$textSecondary,
                        lineHeight: 21,
                      }}>
                      {item.content}
                    </Text>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
          </Accordion>
        </View>

        {/* Pharmacy Selection */}
        {hasPharmacies && (
          <Animated.View
            layout={AccordionLayoutTransition}
            onLayout={e => {
              const y = e.nativeEvent.layout.y;
              pharmaciesY.current = y;
              // Only enable scroll-driven hiding when there is a real choice to make.
              listTop.value =
                pharmacies.length > 1 ? y : Number.MAX_SAFE_INTEGER;
            }}>
            <View
              style={{
                height: 8,
                backgroundColor: colors.$surface,
                marginTop: 20,
              }}
            />
            <View style={{paddingHorizontal: 20, paddingTop: 16}}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.$textPrimary,
                  letterSpacing: -0.3,
                  marginBottom: 2,
                }}>
                {t('drug.selectPharmacy')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.$textSecondary,
                  marginBottom: 8,
                }}>
                {t('drug.selectPharmacyHint')}
              </Text>
              {pharmacies.map((pharmacy, index) => (
                <PharmacyPriceRow
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                  price={pharmacy.price}
                  colors={colors}
                  t={t}
                  onAddToCart={() => handleAddToCart(pharmacy)}
                  isFirst={index === 0}
                  isBestPrice={
                    pharmacy.price === bestPrice && pharmacies.length > 1
                  }
                  isSelected={cartPharmacyId === String(pharmacy.id)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Similar Drugs */}
        {similarDrugs.length > 0 && (
          <Animated.View layout={AccordionLayoutTransition}>
            <View
              style={{
                height: 8,
                backgroundColor: colors.$surface,
                marginTop: 20,
              }}
            />
            <View style={{paddingTop: 16, gap: 14}}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.$textPrimary,
                  letterSpacing: -0.3,
                  paddingHorizontal: 20,
                }}>
                {t('drug.similarDrugs')}
              </Text>
              <PopularProductsList data={similarDrugs} />
            </View>
          </Animated.View>
        )}
      </Animated.ScrollView>

      {/* Sticky Bottom CTA */}
      {hasPharmacies &&
        (!isInCart && pharmacies.length > 1 ? (
          // Multiple pharmacies → "select pharmacy" CTA that scrolls to the
          // list and hides itself once the list becomes visible.
          <Animated.View
            pointerEvents={ctaInteractive ? 'auto' : 'none'}
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: Math.max(bottomInset, 14),
                backgroundColor: colors.$background,
                borderTopWidth: 1,
                borderTopColor: colors.$border,
              },
              ctaAnimatedStyle,
            ]}>
            <Pressable
              onPress={scrollToPharmacies}
              style={{
                backgroundColor: colors.$brandActive,
                borderRadius: 12,
                paddingVertical: 13,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}>
              <ChevronDown
                size={18}
                color={colors.$brandActiveText}
                strokeWidth={2}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.$brandActiveText,
                }}>
                {t('drug.choosePharmacy')}
              </Text>
              {priceLabel && (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                  · {t('drug.fromPrice')} {priceLabel}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        ) : (
          // In cart, or a single pharmacy (auto-add) → always-visible bar.
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: Math.max(bottomInset, 14),
              backgroundColor: colors.$background,
              borderTopWidth: 1,
              borderTopColor: colors.$border,
            }}>
            {isInCart ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.$textPrimary,
                    }}>
                    {cartStore.getState().items.find(i => i.drugId === route.params.id)?.pharmacyName}
                  </Text>
                  <Text style={{fontSize: 12, color: colors.$textSecondary}}>
                    {cartStore.getState().items.find(i => i.drugId === route.params.id)?.price.toFixed(2)} TMT
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (cartPharmacyId) {
                      removeItem(route.params.id, cartPharmacyId);
                    }
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.$border,
                  }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.$textSecondary,
                    }}>
                    {t('drug.remove')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    // Switch to the Cart tab FIRST. This hides the whole Home
                    // stack (including a Search transparentModal this product
                    // may have been opened over), so the user lands on the cart
                    // immediately. Only then reset the Home stack — doing it
                    // while the modal is still on screen races react-native-
                    // screens' transparentModal dismissal and freezes touches.
                    navigation
                      .getParent()
                      ?.navigate('CartStack', {screen: 'Cart'});
                    InteractionManager.runAfterInteractions(() => {
                      navigation.popToTop();
                    });
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.$success,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}>
                  <Check size={16} color={colors.$brandActiveText} strokeWidth={2.5} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.$brandActiveText,
                    }}>
                    {t('drug.inCart')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleCtaPress}
                style={{
                  backgroundColor: colors.$brandActive,
                  borderRadius: 12,
                  paddingVertical: 13,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <ShoppingCart size={18} color={colors.$brandActiveText} strokeWidth={2} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.$brandActiveText,
                  }}>
                  {t('drug.addToCart')}
                </Text>
                {priceLabel && (
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.5)',
                    }}>
                    · {isRange ? `${t('drug.fromPrice')} ` : ''}
                    {priceLabel}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        ))}
    </View>
  );
};

export default DrugScreen;
