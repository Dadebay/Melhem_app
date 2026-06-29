import {useCallback} from 'react';
import {Dimensions, Text, View} from 'react-native';
import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useShallow} from 'zustand/react/shallow';
import {useTranslation} from 'react-i18next';
import DrugsGridItem from '../../components/DrugsGrid/DrugsGridItem';
import NotFoundIcon from '../../../assets/icons/Interface/Interface 34 - 24px.svg';
import useColors from '../../lib/hooks/useColors';
import appStore, {BookmarkItem} from '../../lib/store/appStore';

const windowWidth = Dimensions.get('window').width;

const BookmarkScreen = () => {
  const colors = useColors();
  const {t} = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<Nav.Shared>>();

  // Favourites are fully local snapshots — render straight from the store, no
  // network round-trip and no id resolution against the backend.
  const {bookmarks, toggleBookmark} = appStore(
    useShallow(state => ({
      bookmarks: state.bookmarks,
      toggleBookmark: state.toggleBookmark,
    })),
  );

  const renderItem: ListRenderItem<BookmarkItem> = useCallback(
    ({item}) => (
      <DrugsGridItem
        name={item.name}
        imageKey={item.imageKey}
        priceText={item.priceText}
        isOutOfStock={item.isOutOfStock}
        formulationText={item.formulationText}
        pharmacy={item.pharmacy}
        colors={colors}
        windowWidth={windowWidth}
        onPress={() =>
          navigation.push('Drug', {
            id: item.id,
            price: item.navPrice,
            pharmacy: item.navPharmacy,
          })
        }
        isBookmarked
        onBookmarkPress={() => toggleBookmark(item)}
      />
    ),
    [colors, navigation, toggleBookmark],
  );

  if (bookmarks.length === 0) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{gap: 4, paddingHorizontal: 32}}>
        <NotFoundIcon width={64} height={64} color={colors.$textPrimary} />
        <Text className="font-semibold text-center text-app-text-primary">
          {t('bookmark.empty')}
        </Text>
        <Text className="text-sm text-center text-app-text-primary">
          {t('bookmark.emptyHint')}
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      keyExtractor={item => item.id}
      data={bookmarks}
      renderItem={renderItem}
      numColumns={2}
      contentContainerStyle={{
        paddingTop: 16,
        paddingLeft: 20,
        paddingBottom: 0,
      }}
    />
  );
};

export default BookmarkScreen;
