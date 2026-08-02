import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {useCallback} from 'react';
import DrugsGridItem from './DrugsGridItem';
import {ActivityIndicator, Dimensions, View, Text} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import appStore from '../../lib/store/appStore';
import {showToast} from '../../lib/store/toastStore';
import useColors from '../../lib/hooks/useColors';
import {useShallow} from 'zustand/react/shallow';
import utils from '../../lib/utils';

const windowWidth = Dimensions.get('window').width;

type Data = Drug.ListItem | Inventory.ListItem;

interface Props {
  data: Data[];
  onEndReached?: () => void;
  isNextPageLoading?: boolean;
  shouldLogAsSearch?: boolean;
  navigateWithPrice?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const isInventory = (item: Data): item is Inventory.ListItem =>
  'type' in item && item.type === 'inventory';

const ListEmptyComponent = () => {
  const {t} = useTranslation();
  return (
    <View className="justify-center items-center flex-1">
      <Text style={{fontSize: 14, fontWeight: '500'}}>{t('drug.notFound')}</Text>
    </View>
  );
};

const DrugsGrid = ({
  data,
  shouldLogAsSearch,
  onEndReached,
  isNextPageLoading,
  navigateWithPrice,
  refreshing,
  onRefresh,
}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();
  const lang = t('key') as ContentLanguage;
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Shared, 'Drugs'>>();

  const {bookmarks, toggleBookmark} = appStore(
    useShallow(state => ({
      bookmarks: state.bookmarks,
      toggleBookmark: state.toggleBookmark,
    })),
  );

  const keyExtractor = useCallback(
    (item: Data) => (isInventory(item) ? item.inventoryId : String(item.id)),
    [],
  );

  const logDrugSearch = useCallback((id: number, name: string) => {
    appStore.setState(prev => {
      const index = prev.lastSearchedDrugs.findIndex(item => item.id === id);

      let updated: {id: number; name: string}[] = [];
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

  const renderItem: ListRenderItem<Data> = useCallback(
    ({item}) => {
      if (isInventory(item)) {
        const navId = item.drug._id;
        const priceText = `${item.price.toFixed(2)} TMT`;
        const isOutOfStock = !(item.stockCount > 0);
        const name = item.drug.translations[lang]?.name ?? '';
        const imageKey = item.drug.imageUrls[0] ?? null;
        const formulationText = utils.getPrettyFormulation(
          item.drug.formulation,
        );
        const pharmacy = {name: item.pharmacy.name, logo: item.pharmacy.logo};
        return (
          <DrugsGridItem
            name={name}
            imageKey={imageKey}
            priceText={priceText}
            isOutOfStock={isOutOfStock}
            formulationText={formulationText}
            pharmacy={pharmacy}
            colors={colors}
            windowWidth={windowWidth}
            onPress={() =>
              navigation.push('Drug', {
                id: navId,
                price: navigateWithPrice ? item.price : undefined,
                pharmacy: item.pharmacy,
              })
            }
            isBookmarked={bookmarks.some(b => b.id === navId)}
            onBookmarkPress={() => {
              const added = toggleBookmark({
                id: navId,
                name,
                imageKey,
                priceText,
                isOutOfStock,
                formulationText,
                pharmacy,
                navPrice: navigateWithPrice ? item.price : undefined,
                navPharmacy: item.pharmacy,
              });
              if (added) {
                showToast(t('bookmark.added'));
              }
            }}
          />
        );
      }

      const navId = String(item.id);
      const {priceText, isOutOfStock} = utils.getDrugPriceText(
        item,
        t('drug.fromPrice'),
      );
      const imageKey = item.images?.[0] ?? null;
      return (
        <DrugsGridItem
          name={item.name}
          imageKey={imageKey}
          priceText={priceText}
          isOutOfStock={isOutOfStock}
          colors={colors}
          windowWidth={windowWidth}
          onPress={() => {
            if (shouldLogAsSearch) {
              logDrugSearch(item.id, item.name);
            }
            navigation.push('Drug', {id: navId});
          }}
          isBookmarked={bookmarks.some(b => b.id === navId)}
          onBookmarkPress={() => {
            const added = toggleBookmark({
              id: navId,
              name: item.name,
              imageKey,
              priceText,
              isOutOfStock,
            });
            if (added) {
              showToast(t('bookmark.added'));
            }
          }}
        />
      );
    },
    [
      colors,
      lang,
      bookmarks,
      navigation,
      navigateWithPrice,
      shouldLogAsSearch,
      logDrugSearch,
      toggleBookmark,
      t,
    ],
  );

  const FooterComponent = useCallback(() => {
    if (isNextPageLoading) {
      return (
        <View className="justify-center items-center">
          <ActivityIndicator />
        </View>
      );
    }

    return undefined;
  }, [isNextPageLoading]);

  return (
    <FlashList
      keyExtractor={keyExtractor}
      data={data}
      renderItem={renderItem}
      getItemType={item => (isInventory(item) ? 'inventory' : 'drug')}
      numColumns={2}
      contentContainerStyle={{
        paddingTop: 16,
        paddingLeft: 20,
        paddingBottom: 0,
      }}
      ListEmptyComponent={shouldLogAsSearch ? undefined : ListEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={FooterComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

export default DrugsGrid;
