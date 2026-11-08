import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Search} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
import Carousel from '../../components/Carousel';
import CategoriesList from '../../components/CategoriesList';
import categoryApi from '../../lib/api/categoryApi';
import pharmacyApi from '../../lib/api/pharmacyApi';
import PharmaciesHorizontalList from '../../components/PharmaciesHorizontalList';
import sliderApi from '../../lib/api/sliderApi';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import SectionHeader from '../../templates/SectionHeader';
import LocationHeader from '../../components/LocationHeader';
import PopularProductsList from '../../components/PopularProductsList';
import drugApi from '../../lib/api/drugApi';
import useLocationId from '../../lib/hooks/useLocationId';
import usePullToRefresh from '../../lib/hooks/usePullToRefresh';
import {Pressable} from 'react-native';

type Props = NativeStackScreenProps<Nav.Home, 'Home'>;

const HomeScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const statusBarHeight = useSafeAreaInsets().top;
  const colors = useColors();
  const locationId = useLocationId();
  const {refreshing, onRefresh} = usePullToRefresh();

  const slidersQuery = sliderApi.useGetAll({
    page: 0,
    limit: 5,
  });

  const categoriesQuery = categoryApi.useGetAll();

  const pharmaciesQuery = pharmacyApi.useGetAll({
    page: 1,
    size: 10,
    location_id: locationId,
  });

  const popularDrugsQuery = drugApi.useGetAll({
    page: 1,
    size: 10,
    location_id: locationId,
    popular: true,
  });

  return (
    <View style={{flex: 1, backgroundColor: colors.$background}}>
      {/* Fixed header — kept OUTSIDE the ScrollView so the search stays pinned
          AND remains tappable. As a sticky header inside the ScrollView, the
          scrolling content passed under it and swallowed its touches. */}
      <View
        style={{
          paddingTop: statusBarHeight,
          backgroundColor: colors.$background,
          paddingBottom: 8,
        }}>
        <LocationHeader />
        <Pressable
          onPress={() => navigation.navigate('Search')}
          style={{
            marginHorizontal: 20,
            marginTop: 14,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.$surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}>
          <Search size={18} color={colors.$textPlaceholder} strokeWidth={2} />
          <Text
            style={{
              fontSize: 14,
              color: colors.$textPlaceholder,
              marginLeft: 10,
              flex: 1,
            }}>
            {t('search.placeholder', 'Gozleg')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.$textSecondary}
            colors={[colors.$brandActive]}
          />
        }
        style={{backgroundColor: colors.$background}}>
        <View style={{gap: 28, marginTop: 20}}>
          <Carousel data={slidersQuery.data?.sliders || []} />

          <View style={{gap: 14}}>
            <SectionHeader>{t('home.categories')}</SectionHeader>
            {categoriesQuery.isLoading ? (
              <View
                style={{
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator color={colors.$textSecondary} />
              </View>
            ) : (
              <CategoriesList data={(categoriesQuery.data || []).slice(0, 8)} />
            )}
          </View>

          <View style={{gap: 14}}>
            <SectionHeader onPress={() => navigation.navigate('Pharmacies')}>
              {t('home.pharmacies')}
            </SectionHeader>
            {pharmaciesQuery.isLoading ? (
              <View
                style={{
                  height: 120,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator color={colors.$textSecondary} />
              </View>
            ) : (
              <PharmaciesHorizontalList
                data={pharmaciesQuery.data?.pharmacies || []}
              />
            )}
          </View>

          <View style={{gap: 14}}>
            <SectionHeader>{t('home.popularDrugs')}</SectionHeader>
            {popularDrugsQuery.isLoading ? (
              <View
                style={{
                  height: 200,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator color={colors.$textSecondary} />
              </View>
            ) : popularDrugsQuery.data?.drugs ? (
              <PopularProductsList data={popularDrugsQuery.data.drugs} />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
