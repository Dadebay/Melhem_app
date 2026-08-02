import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import TurboImage from 'react-native-turbo-image';
import {useTranslation} from 'react-i18next';
import {useHeaderHeight} from '@react-navigation/elements';

import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Phone,
  Pill,
  Plus,
  Search,
  Store,
  X,
} from 'lucide-react-native';

import useColors from '../../lib/hooks/useColors';
import usePullToRefresh from '../../lib/hooks/usePullToRefresh';
import usePharmacyLayout from './useLayout';
import pharmacyApi from '../../lib/api/pharmacyApi';
import drugApi from '../../lib/api/drugApi';
import getImageUrl from '../../lib/getImageUrl';
import isPharmacyOpen from '../../utils/isPharmacyOpen';
import PharmacyTodayWorkingHours from '../../utils/PharmacyTodayWorkingHours';
import cartStore from '../../lib/store/cartStore';
import categoryApi from '../../lib/api/categoryApi';
import PharmacyMap from '../../components/PharmacyMap';

type Props = NativeStackScreenProps<Nav.Home, 'Pharmacy'>;

// --- Layout constants ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 20;
const GRID_GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GRID_GAP) / 2;

const WEEKDAY_ORDER: WeekDays[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_NAMES: Record<WeekDays, {tm: string; ru: string}> = {
  monday: {tm: 'Duşenbe', ru: 'Понедельник'},
  tuesday: {tm: 'Sişenbe', ru: 'Вторник'},
  wednesday: {tm: 'Çarşenbe', ru: 'Среда'},
  thursday: {tm: 'Penşenbe', ru: 'Четверг'},
  friday: {tm: 'Anna', ru: 'Пятница'},
  saturday: {tm: 'Şenbe', ru: 'Суббота'},
  sunday: {tm: 'Ýekşenbe', ru: 'Воскресенье'},
};

// Trim seconds from a backend time string ("09:00:00" → "09:00").
const hm = (time?: string | null): string => (time ? time.slice(0, 5) : '');

// --- Product Card ---
const ProductCard = ({
  item,
  colors,
  onPress,
  onCartPress,
  isInCart,
}: {
  item: Drug.ListItem;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  onCartPress: () => void;
  isInCart: boolean;
}) => {
  const imageKey = item.images?.[0];
  // `price` is this pharmacy's price (list is filtered by pharmacy_id);
  // fall back to min_price just in case it is missing.
  const price = Number(item.price ?? item.min_price ?? 0);
  return (
    <Pressable onPress={onPress} style={{width: ITEM_WIDTH}}>
      <View
        style={{
          backgroundColor: colors.$card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.$border,
          overflow: 'hidden',
        }}>
        {imageKey ? (
          <TurboImage
            source={{uri: getImageUrl('drugs', imageKey, 256)}}
            style={{width: '100%', aspectRatio: 1}}
          />
        ) : (
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              backgroundColor: colors.$surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Pill size={40} color={colors.$textPlaceholder} strokeWidth={1.5} />
          </View>
        )}
      </View>
      <View style={{paddingTop: 10, gap: 3}}>
        <Text
          style={{fontSize: 14, fontWeight: '600', color: colors.$textPrimary}}
          numberOfLines={2}>
          {item.name}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
          }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.$textPrimary,
            }}>
            {price.toFixed(2)}{' '}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '400',
                color: colors.$textSecondary,
              }}>
              TMT
            </Text>
          </Text>
          <Pressable
            onPress={onCartPress}
            hitSlop={6}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isInCart ? colors.$brandActive : colors.$surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {isInCart ? (
              <Check size={16} color={colors.$brandActiveText} strokeWidth={2.5} />
            ) : (
              <Plus size={16} color={colors.$textPrimary} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

// --- Main Screen ---
const PharmacyScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const lang = t('key') as ContentLanguage;
  const colors = useColors();
  const {refreshing, onRefresh} = usePullToRefresh();
  const headerHeight = useHeaderHeight();
  const scrollY = useSharedValue(0);
  const nameThreshold = useSharedValue(200); // default, updated by onLayout
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [showSchedule, setShowSchedule] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  usePharmacyLayout({navigation});

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // Animated header: transparent → solid when name scrolls out
  const TRANSITION = 30; // px for smooth fade
  const headerBgStyle = useAnimatedStyle(() => {
    const start = nameThreshold.value;
    const end = start + TRANSITION;
    return {
      backgroundColor: interpolateColor(
        scrollY.value,
        [start, end],
        ['transparent', colors.$surface],
      ),
    };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const start = nameThreshold.value;
    const end = start + TRANSITION;
    return {
      opacity: interpolate(
        scrollY.value,
        [start, end],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [start, end],
            [6, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  // --- Data ---
  const pharmacyQuery = pharmacyApi.useGet({pharmacyId: route.params.id});
  const categoriesQuery = categoryApi.useGetAll();

  // Debounce the search box so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Pharmacy products come from the shared drugs list, filtered to this
  // pharmacy via `pharmacy_id`. Category + search filtering happen server-side.
  const drugsQuery = drugApi.useGetAllInfiniteList({
    page: 1,
    size: 20,
    pharmacy_id: route.params.id,
    ...(selectedCategory !== 'all' ? {category_id: selectedCategory} : {}),
    ...(debouncedSearch.length >= 2 ? {search: debouncedSearch} : {}),
  });

  const pharmacy = pharmacyQuery.data;

  const drugs = useMemo(
    () => drugsQuery.data?.pages.flatMap(p => p.drugs) || [],
    [drugsQuery.data],
  );

  // --- Cart ---
  const addItem = cartStore(state => state.addItem);
  const removeItem = cartStore(state => state.removeItem);
  const cartItems = cartStore(state => state.items);

  const handleCartPress = useCallback(
    (item: Drug.ListItem) => {
      if (!pharmacy) return;
      const drugId = String(item.id);
      const pharmacyId = String(pharmacy.id);
      const alreadyInCart = cartItems.some(
        i => i.drugId === drugId && i.pharmacyId === pharmacyId,
      );
      if (alreadyInCart) {
        removeItem(drugId, pharmacyId);
      } else {
        addItem({
          drugId,
          drugName: item.name || '',
          drugImage: item.images?.[0] || '',
          formulation: '',
          pharmacyId,
          pharmacyName: pharmacy.name,
          pharmacyLogo: pharmacy.image,
          price: Number(item.price) || 0,
        });
      }
    },
    [cartItems, addItem, removeItem, pharmacy],
  );

  const handleProductPress = useCallback(
    (item: Drug.ListItem) => {
      if (!pharmacy) return;
      navigation.push('Drug', {
        id: String(item.id),
        price: item.price != null ? Number(item.price) : undefined,
        pharmacy: {
          _id: String(pharmacy.id),
          name: pharmacy.name,
          logo: pharmacy.image,
        },
      });
    },
    [navigation, pharmacy],
  );

  const handleEndReached = useCallback(() => {
    if (drugsQuery.hasNextPage && !drugsQuery.isFetchingNextPage) {
      drugsQuery.fetchNextPage();
    }
  }, [drugsQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.clear();
  }, []);

  // --- Pharmacy info ---
  const isOpen = pharmacy ? isPharmacyOpen(pharmacy.operatingHours) : false;
  const todayHours = pharmacy
    ? PharmacyTodayWorkingHours(pharmacy.operatingHours)
    : null;
  const todayDayName = new Date()
    .toLocaleDateString('en-US', {weekday: 'long'})
    .toLowerCase() as WeekDays;

  // --- Render ---
  const renderItem = useCallback(
    ({item}: {item: Drug.ListItem}) => (
      <ProductCard
        item={item}
        colors={colors}
        onPress={() => handleProductPress(item)}
        onCartPress={() => handleCartPress(item)}
        isInCart={cartItems.some(
          i =>
            i.drugId === String(item.id) &&
            i.pharmacyId === String(pharmacy?.id),
        )}
      />
    ),
    [colors, handleProductPress, handleCartPress, cartItems, pharmacy],
  );

  const keyExtractor = useCallback((item: Drug.ListItem) => String(item.id), []);

  // --- Header ---
  const ListHeader = useMemo(() => {
    if (!pharmacy) return null;

    const address = pharmacy.address;
    const phoneNumber = pharmacy.contact.phoneNumbers?.[0];

    return (
      <View style={{gap: 20, paddingBottom: 16}}>
        {/* Hero */}
        <View
          style={{
            alignItems: 'center',
            gap: 12,
            paddingTop: headerHeight + 24,
            paddingHorizontal: H_PADDING,
          }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.$border,
              backgroundColor: colors.$card,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {logoFailed || !pharmacy.image ? (
              <Store
                size={32}
                color={colors.$textPlaceholder}
                strokeWidth={1.5}
              />
            ) : (
              <TurboImage
                source={{
                  uri: getImageUrl('pharmacies', pharmacy.image, 256),
                }}
                style={{width: 64, height: 64, borderRadius: 10}}
                resizeMode="contain"
                onFailure={() => setLogoFailed(true)}
              />
            )}
          </View>
          <Text
            onLayout={e => {
              // trigger = when bottom of name text reaches header bottom
              const y = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
              nameThreshold.value = y - headerHeight;
            }}
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.$textPrimary,
              letterSpacing: -0.4,
              textAlign: 'center',
            }}>
            {pharmacy.name}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isOpen ? colors.$serviceOpenBg : colors.$serviceClosedBg,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isOpen ? colors.$serviceOpen : colors.$serviceClosed,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isOpen ? colors.$serviceOpen : colors.$serviceClosed,
              }}>
              {isOpen ? t('pharmacy.open') : t('pharmacy.closed')}
            </Text>
            {todayHours && (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: isOpen ? colors.$serviceOpen : colors.$serviceClosed,
                }}>
                · {hm(todayHours.open)} — {hm(todayHours.close)}
              </Text>
            )}
          </View>
        </View>

        {/* Quick action buttons */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: H_PADDING,
            gap: 10,
          }}>
          {phoneNumber && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${phoneNumber}`)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 48,
                borderRadius: 14,
                backgroundColor: colors.$brandActive,
              }}>
              <Phone size={17} color={colors.$brandActiveText} strokeWidth={2} />
              <Text
                style={{fontSize: 14, fontWeight: '600', color: colors.$brandActiveText}}>
                {t('pharmacy.call')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Info card: address + schedule */}
        <View
          style={{
            marginHorizontal: H_PADDING,
            backgroundColor: colors.$surface,
            borderRadius: 16,
            overflow: 'hidden',
          }}>
          {/* Address */}
          {address && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <MapPin
                size={16}
                color={colors.$textSecondary}
                strokeWidth={1.5}
                style={{marginTop: 2}}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textPrimary,
                  flex: 1,
                  lineHeight: 20,
                }}
                numberOfLines={2}>
                {address}
              </Text>
            </View>
          )}

          {/* Schedule */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.$border,
            }}>
            <Pressable
              onPress={() => setShowSchedule(prev => !prev)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <Clock
                size={16}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.$textPrimary,
                  flex: 1,
                }}>
                {todayHours
                  ? `${hm(todayHours.open)} — ${hm(todayHours.close)}`
                  : t('pharmacy.dayOff')}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.$textSecondary,
                  marginRight: 4,
                }}>
                {t('pharmacy.schedule')}
              </Text>
              {showSchedule ? (
                <ChevronUp
                  size={14}
                  color={colors.$textSecondary}
                  strokeWidth={2}
                />
              ) : (
                <ChevronDown
                  size={14}
                  color={colors.$textSecondary}
                  strokeWidth={2}
                />
              )}
            </Pressable>
            {showSchedule && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 14,
                  paddingTop: 2,
                  gap: 8,
                  marginLeft: 26,
                }}>
                {WEEKDAY_ORDER.map(day => {
                  const hours = pharmacy.operatingHours[day];
                  const isToday = day === todayDayName;
                  return (
                    <View
                      key={day}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isToday ? '600' : '400',
                          color: isToday
                            ? colors.$textPrimary
                            : colors.$textSecondary,
                        }}>
                        {DAY_NAMES[day][lang]}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isToday ? '600' : '400',
                          color: isToday
                            ? colors.$textPrimary
                            : colors.$textSecondary,
                        }}>
                        {hours
                          ? `${hm(hours.open)} — ${hm(hours.close)}`
                          : t('pharmacy.dayOff')}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
            )}
          </View>
        </View>

        {/* Map: pharmacy location pin (tap → external maps for directions) */}
        {pharmacy.position && (
          <View style={{paddingHorizontal: H_PADDING}}>
            <PharmacyMap
              center={pharmacy.position}
              colors={colors}
              label={pharmacy.name}
            />
          </View>
        )}

        {/* Search */}
        <View style={{paddingHorizontal: H_PADDING}}>
          <View
            style={{
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.$surface,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
            }}>
            <Search
              size={18}
              color={
                searchQuery
                  ? colors.$textPrimary
                  : colors.$textPlaceholder
              }
              strokeWidth={2}
            />
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('pharmacy.searchDrugs')}
              placeholderTextColor={colors.$textPlaceholder}
              returnKeyType="search"
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 14,
                color: colors.$textPrimary,
                paddingVertical: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <X
                  size={16}
                  color={colors.$textSecondary}
                  strokeWidth={2}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Categories — ScrollView to avoid VirtualizedList nesting */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: H_PADDING, gap: 8}}>
          <Pressable
            onPress={() => setSelectedCategory('all')}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor:
                selectedCategory === 'all'
                  ? colors.$brandActive
                  : colors.$surface,
            }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color:
                  selectedCategory === 'all'
                    ? colors.$brandActiveText
                    : colors.$textPrimary,
              }}>
              {t('common.all')}
            </Text>
          </Pressable>
          {(categoriesQuery.data || []).map(item => {
            const isSelected = selectedCategory === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedCategory(item.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? colors.$brandActive
                    : colors.$surface,
                }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isSelected
                      ? colors.$brandActiveText
                      : colors.$textPrimary,
                  }}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section title */}
        <View style={{paddingHorizontal: H_PADDING}}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.$textPrimary,
              letterSpacing: -0.3,
            }}>
            {t('pharmacy.goods')}
          </Text>
        </View>
      </View>
    );
  }, [
    pharmacy,
    colors,
    t,
    lang,
    isOpen,
    todayHours,
    searchQuery,
    selectedCategory,
    categoriesQuery.data,
    showSchedule,
    todayDayName,
    headerHeight,
    handleClearSearch,
  ]);

  // --- Loading ---
  if (pharmacyQuery.isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={colors.$textSecondary} />
      </View>
    );
  }

  if (!pharmacy) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 40,
        }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '500',
            color: colors.$textSecondary,
            textAlign: 'center',
          }}>
          {t('pharmacy.loadError')}
        </Text>
      </View>
    );
  }

  const EmptyProducts = () => (
    <View style={{alignItems: 'center', paddingTop: 40, paddingBottom: 40, gap: 12}}>
      {searchQuery.length >= 2 ? (
        <>
          <Search
            size={36}
            color={colors.$textPlaceholder}
            strokeWidth={1.2}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.$textSecondary,
              textAlign: 'center',
            }}>
            "{searchQuery}"{' '}
            {t('pharmacy.noResults')}
          </Text>
        </>
      ) : (
        <>
          <Pill
            size={36}
            color={colors.$textPlaceholder}
            strokeWidth={1.2}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.$textSecondary,
              textAlign: 'center',
            }}>
            {t('pharmacy.noProducts')}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      {/* Custom animated header */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99,
            height: headerHeight,
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 10,
          },
          headerBgStyle,
        ]}>
        <Animated.Text
          style={[
            {
              fontSize: 17,
              fontWeight: '600',
              color: colors.$textPrimary,
            },
            headerTitleStyle,
          ]}
          numberOfLines={1}>
          {pharmacy.name}
        </Animated.Text>
      </Animated.View>

      <Animated.FlatList
        data={drugs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          drugsQuery.isLoading ? (
            <View style={{paddingTop: 40, alignItems: 'center'}}>
              <ActivityIndicator color={colors.$textSecondary} />
            </View>
          ) : (
            <EmptyProducts />
          )
        }
        ListFooterComponent={
          drugsQuery.isFetchingNextPage ? (
            <View style={{paddingVertical: 20, alignItems: 'center'}}>
              <ActivityIndicator color={colors.$textSecondary} />
            </View>
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{paddingBottom: 40}}
        columnWrapperStyle={{
          paddingHorizontal: H_PADDING,
          gap: GRID_GAP,
          marginBottom: 16,
        }}
      />
    </View>
  );
};

export default PharmacyScreen;
