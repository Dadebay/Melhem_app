import {FlatList, ListRenderItem} from 'react-native';
import {useCallback} from 'react';
import PharmaciesHorizontalListItem from './PharmaciesHorizontalListItem';
import {Dimensions} from 'react-native';
import useColors from '../../lib/hooks/useColors';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

const windowWidth = Dimensions.get('window').width;

interface Props {
  data: Pharmacy.ListItem[];
}
const PharmaciesHorizontalList = ({data}: Props) => {
  const colors = useColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Home'>>();

  const keyExtractor = useCallback(
    (item: Pharmacy.ListItem) => String(item.id),
    [],
  );

  const renderItem: ListRenderItem<Pharmacy.ListItem> = useCallback(
    ({item}) => {
      return (
        <PharmaciesHorizontalListItem
          windowWidth={windowWidth}
          data={item}
          colors={colors}
          onPress={() =>
            navigation.navigate('Pharmacy', {
              id: String(item.id),
            })
          }
        />
      );
    },
    [colors, navigation],
  );

  return (
    <FlatList
      keyExtractor={keyExtractor}
      data={data}
      renderItem={renderItem}
      horizontal
      contentContainerStyle={{paddingHorizontal: 20}}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default PharmaciesHorizontalList;
