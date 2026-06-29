import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {useCallback} from 'react';
import ManufacturersHorizontalListItem from './item';
import {Dimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  data: Manufacturer.Item[];
}

const windowWidth = Dimensions.get('window').width;

const ManufacturersHorizontalList = ({data}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Home'>>();

  const keyExtractor = useCallback((item: Manufacturer.Item) => item._id, []);

  const renderItem: ListRenderItem<Manufacturer.Item> = useCallback(
    ({item}) => (
      <ManufacturersHorizontalListItem
        data={item}
        width={windowWidth / 3}
        onPress={() =>
          navigation.navigate('Drugs', {
            title: item.title,
            queries: {manufacturer_id: item._id},
          })
        }
      />
    ),
    [],
  );

  return (
    <FlashList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      horizontal
      contentContainerStyle={{paddingHorizontal: 12}}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default ManufacturersHorizontalList;
