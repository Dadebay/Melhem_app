import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, LinearTransition} from 'react-native-reanimated';
import TurboImage from 'react-native-turbo-image';
import {useTranslation} from 'react-i18next';
import {
  Search,
  X,
  ArrowLeft,
  Pill,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
import appStore from '../../lib/store/appStore';
import {useShallow} from 'zustand/react/shallow';
import drugApi from '../../lib/api/drugApi';
import useLocationId from '../../lib/hooks/useLocationId';
import getImageUrl from '../../lib/getImageUrl';
import utils from '../../lib/utils';

type Props = NativeStackScreenProps<Nav.Home, 'Search'>;

const MIN_QUERY_LENGTH = 2;
const PAGE_SIZE = 20;

// Suggested searches (static — there is no backend trending endpoint yet).
const MOCK_TRENDING = [
  'Parasetamol',
  'Ibuprofen',
  'Analgin',
  'Dimedrol',
  'Aspirin',
  'Nurofen',
  'Deksametazon',
  'Sitramon',
  'Ýod',
];

const SearchScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const locationId = useLocationId();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce keystrokes so we don't hit the API on every character.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const {lastSearchedDrugs, clearLastSearchedDrugs} = appStore(
    useShallow(state => ({
      lastSearchedDrugs: state.lastSearchedDrugs,
      clearLastSearchedDrugs: state.clearLastSearchedDrugs,
    })),
  );

  const searchEnabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const searchQuery = drugApi.useGetAllInfiniteList(
    {
      page: 1,
      size: PAGE_SIZE,
      search: debouncedQuery,
      location_id: locationId,
    },
    {enabled: searchEnabled},
  );

  const results = useMemo(
    () => searchQuery.data?.pages.flatMap(page => page.drugs) ?? [],
    [searchQuery.data],
  );

  const handleEndReached = useCallback(() => {
    if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      searchQuery.fetchNextPage();
    }
  }, [searchQuery]);

  // Persist the tapped drug into the "recently searched" list (max 5).
  const logDrugSearch = useCallback((id: number, name: string) => {
    appStore.setState(prev => {
      const index = prev.lastSearchedDrugs.findIndex(item => item.id === id);
      let updated: {id: number; name: string}[];
      if (index !== -1) {
        updated = [...prev.lastSearchedDrugs];
        const [removed] = updated.splice(index, 1);
        updated.unshift(removed);
      } else {
        updated = [{id, name}, ...prev.lastSearchedDrugs];
      }
      return {lastSearchedDrugs: updated.slice(0, 5)};
    });
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.clear();
    inputRef.current?.focus();
  }, []);

  const handleResultPress = useCallback(
    (id: number, name: string) => {
      logDrugSearch(id, name);
      // Replace the Search overlay (a transparentModal) with the Drug screen
      // instead of pushing on top of it. This lands Drug in the base Home
      // stack as a regular card — the same shared product screen used
      // everywhere else — avoiding the modal-on-top-of-modal stacking that
      // caused freezes / unstable navigation back to the cart.
      navigation.replace('Drug', {id: String(id)});
    },
    [navigation, logDrugSearch],
  );

  const handleTrendingPress = useCallback((term: string) => {
    setQuery(term);
    inputRef.current?.setNativeProps({text: term});
  }, []);

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const showTrending = query.length === 0 && lastSearchedDrugs.length === 0;
  const showRecent = query.length === 0 && lastSearchedDrugs.length > 0;
  // Show a spinner while the debounce is catching up or the request is in flight,
  // so we never flash "no results" before the search has actually run.
  const isDebouncePending = query.trim() !== debouncedQuery;
  const isSearching =
    hasQuery && (isDebouncePending || (searchEnabled && searchQuery.isLoading));

  return (
    <View style={{flex: 1, backgroundColor: 'rgba(255,255,255,0.97)'}}>
      {/* Search Header */}
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ArrowLeft size={20} color={colors.$textPrimary} strokeWidth={2} />
        </Pressable>

        <View
          style={{
            flex: 1,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.$surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}>
          <Search
            size={18}
            color={query ? colors.$textPrimary : colors.$textPlaceholder}
            strokeWidth={2}
          />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.$textPlaceholder}
            autoFocus
            returnKeyType="search"
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: colors.$textPrimary,
              paddingVertical: 0,
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <X size={16} color={colors.$textSecondary} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View
        entering={FadeIn.duration(250).delay(100)}
        style={{flex: 1}}>
        {/* Trending */}
        {showTrending && (
          <View style={{paddingHorizontal: 20, paddingTop: 8}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: 14,
              }}>
              <TrendingUp
                size={16}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.$textSecondary,
                }}>
                {t('search.trending')}
              </Text>
            </View>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {MOCK_TRENDING.map(term => (
                <Pressable
                  key={term}
                  onPress={() => handleTrendingPress(term)}
                  style={{
                    backgroundColor: colors.$surface,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: colors.$textPrimary,
                    }}>
                    {term}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Recent searches */}
        {showRecent && (
          <View style={{paddingHorizontal: 20, paddingTop: 8}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Clock
                  size={16}
                  color={colors.$textSecondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.$textSecondary,
                  }}>
                  {t('search.recent')}
                </Text>
              </View>
              <Pressable onPress={clearLastSearchedDrugs} hitSlop={8}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.$textPlaceholder,
                  }}>
                  {t('search.clear')}
                </Text>
              </Pressable>
            </View>
            {lastSearchedDrugs.map(item => (
              <Pressable
                key={item.id}
                onPress={() => handleResultPress(item.id, item.name)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
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
                  <Clock
                    size={14}
                    color={colors.$textPlaceholder}
                    strokeWidth={1.5}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.$textPrimary,
                    flex: 1,
                  }}
                  numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Search Results */}
        {hasQuery &&
          (isSearching ? (
            <View style={{paddingTop: 60, alignItems: 'center'}}>
              <ActivityIndicator color={colors.$textSecondary} />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={item => String(item.id)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 4,
                paddingBottom: 40,
              }}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <View style={{alignItems: 'center', paddingTop: 60, gap: 12}}>
                  <Search
                    size={36}
                    color={colors.$textPlaceholder}
                    strokeWidth={1.2}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '500',
                      color: colors.$textSecondary,
                      textAlign: 'center',
                    }}>
                    {t('search.noResults', {query: debouncedQuery})}
                  </Text>
                </View>
              }
              ListFooterComponent={
                searchQuery.isFetchingNextPage ? (
                  <View style={{paddingVertical: 16, alignItems: 'center'}}>
                    <ActivityIndicator color={colors.$textSecondary} />
                  </View>
                ) : null
              }
              renderItem={({item, index}) => {
                const {priceText} = utils.getDrugPriceText(
                  item,
                  t('drug.fromPrice'),
                );
                const imageKey = item.images?.[0] ?? null;
                return (
                  <Animated.View
                    entering={FadeIn.duration(150).delay(index * 30)}
                    layout={LinearTransition}>
                    <Pressable
                      onPress={() => handleResultPress(item.id, item.name)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.$border,
                      }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: colors.$surface,
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}>
                        {imageKey ? (
                          <TurboImage
                            source={{uri: getImageUrl('drugs', imageKey, 256)}}
                            style={{width: 40, height: 40}}
                          />
                        ) : (
                          <Pill
                            size={18}
                            color={colors.$textSecondary}
                            strokeWidth={1.5}
                          />
                        )}
                      </View>
                      <View style={{flex: 1}}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '500',
                            color: colors.$textPrimary,
                          }}
                          numberOfLines={2}>
                          {item.name}
                        </Text>
                      </View>
                      {priceText && (
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.$textPrimary,
                          }}>
                          {priceText}
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              }}
            />
          ))}
      </Animated.View>
    </View>
  );
};

export default SearchScreen;
