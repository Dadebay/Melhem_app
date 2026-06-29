import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {useCallback} from 'react';
import PharmaciesListItem from './item';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  data: Pharmacy.ListItem[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

const PharmaciesList = ({data, refreshing, onRefresh}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Pharmacies'>>();

  const keyExtractor = useCallback(
    (item: Pharmacy.ListItem) => String(item.id),
    [],
  );

  const renderItem: ListRenderItem<Pharmacy.ListItem> = useCallback(
    ({item}) => (
      <PharmaciesListItem
        data={item}
        onPress={() =>
          navigation.navigate('Pharmacy', {
            id: String(item.id),
          })
        }
      />
    ),
    [navigation],
  );

  return (
    <FlashList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      contentContainerStyle={{
        paddingVertical: 12,
        paddingLeft: 12,
      }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

export default PharmaciesList;
