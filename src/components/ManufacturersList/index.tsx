import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {View} from 'react-native';
import {useCallback} from 'react';
import ManufacturersListItem from './item';
import {Dimensions} from 'react-native';

interface Props {
  data: Manufacturer.Item[];
}

const windowWidth = Dimensions.get('window').width;

const ManufacturersList = ({data}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Manufacturers'>>();

  const keyExtractor = useCallback((item: Manufacturer.Item) => item._id, []);

  const renderItem: ListRenderItem<Manufacturer.Item> = useCallback(
    ({item}) => (
      <ManufacturersListItem
        data={item}
        width={windowWidth / 2}
        onPress={() =>
          navigation.navigate('Drugs', {
            title: item.title,
            queries: {manufacturer_id: item._id},
          })
        }
      />
    ),
    [windowWidth],
  );

  const itemSeparator = useCallback(() => <View style={{height: 12}} />, []);

  return (
    <FlashList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingTop: 12, paddingLeft: 12}}
      ItemSeparatorComponent={itemSeparator}
      numColumns={2}
    />
  );
};

export default ManufacturersList;
