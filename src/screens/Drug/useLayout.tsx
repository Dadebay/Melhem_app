import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TFunction} from 'i18next';
import {useEffect} from 'react';
import HeaderRight from './HeaderRight';
import {useShallow} from 'zustand/react/shallow';
import appStore, {BookmarkItem} from '../../lib/store/appStore';
import {showToast} from '../../lib/store/toastStore';
import utils from '../../lib/utils';

interface Props {
  navigation: NativeStackNavigationProp<Nav.Shared, 'Drug'>;
  data?: Drug.Item;
  t: TFunction;
}

/** Build the favourites snapshot for the drug currently shown on the screen. */
const toBookmark = (data: Drug.Item): BookmarkItem => {
  const {priceText, isOutOfStock} = utils.getDrugPriceText({
    min_price: data.min_price,
    max_price: data.max_price,
    stock_count: data.stock_count,
  });
  return {
    id: String(data.id),
    name: data.name ?? '',
    imageKey: data.images[0] ?? null,
    priceText,
    isOutOfStock,
    formulationText: utils.getPrettyFormulation({
      form: data.form,
      strength: data.strength,
      unit: data.unit,
    }),
  };
};

const useDrugLayout = ({navigation, data, t}: Props) => {
  const {bookmarks, toggleBookmark} = appStore(
    useShallow(state => ({
      bookmarks: state.bookmarks,
      toggleBookmark: state.toggleBookmark,
    })),
  );

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerRight: () =>
        data ? (
          <HeaderRight
            onPress={() => {
              if (toggleBookmark(toBookmark(data))) {
                showToast(t('bookmark.added'));
              }
            }}
            isBookmarked={bookmarks.some(b => b.id === String(data.id))}
          />
        ) : undefined,
    });
  }, [navigation, data, t, toggleBookmark, bookmarks]);
};

export default useDrugLayout;
