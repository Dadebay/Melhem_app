import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {useCallback} from 'react';
import PopularProductsListItem from './PopularProductsListItem';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  data: Drug.ListItem[];
}

const PopularProductsList = ({data}: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<Nav.Home>>();

  const keyExtractor = useCallback(
    (item: Drug.ListItem) => String(item.id),
    [],
  );

  const renderItem: ListRenderItem<Drug.ListItem> = useCallback(
    ({item}) => {
      return (
        <PopularProductsListItem
          data={item}
          onPress={() =>
            navigation.navigate('Drug', {
              id: String(item.id),
            })
          }
        />
      );
    },
    [navigation],
  );

  return (
    <FlashList
      keyExtractor={keyExtractor}
      data={data}
      renderItem={renderItem}
      horizontal
      contentContainerStyle={{paddingHorizontal: 12}}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default PopularProductsList;
