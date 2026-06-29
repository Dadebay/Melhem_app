import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {useCallback} from 'react';
import InventoriesListItem from './item';
import {Dimensions} from 'react-native';
import {TFunction} from 'i18next';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

const windowWidth = Dimensions.get('window').width;

interface Props {
  data: Inventory.ListItem[];
  navigation: NativeStackNavigationProp<Nav.Home, 'Pharmacy'>;
  t: TFunction;
}
const InventoriesList = ({data, navigation, t}: Props) => {
  const keyExtractor = useCallback((item: Inventory.ListItem) => item._id, []);

  const renderItem: ListRenderItem<Inventory.ListItem> = useCallback(
    ({item}) => (
      <InventoriesListItem
        data={item}
        windowWidth={windowWidth}
        currentLanguage={t('key') as ContentLanguage}
        onPress={() => navigation.navigate('Drug', {id: item.drug._id})}
      />
    ),
    [navigation, t],
  );

  return (
    <FlashList
      keyExtractor={keyExtractor}
      data={data}
      renderItem={renderItem}
      numColumns={2}
      nestedScrollEnabled
      contentContainerStyle={{
        paddingTop: 12,
        paddingLeft: 12,
        paddingBottom: 0,
      }}
    />
  );
};

export default InventoriesList;
