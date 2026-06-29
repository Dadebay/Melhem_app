import {FlatList, ListRenderItem} from 'react-native';
import {useCallback} from 'react';
import CategoryListItem from './CategoryListItem';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  data: Category.Item[];
}
const CategoriesList = ({data}: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<Nav.Home>>();

  const handlePress = useCallback(
    (title: string, id: number) =>
      navigation.navigate('Drugs', {
        title,
        queries: {category_id: String(id)},
      }),
    [navigation],
  );

  const keyExtractor = useCallback(
    (item: Category.Item) => String(item.id),
    [],
  );

  const renderItem: ListRenderItem<Category.Item> = useCallback(
    ({item}) => {
      return (
        <CategoryListItem
          data={item}
          onPress={() => handlePress(item.name, item.id)}
        />
      );
    },
    [handlePress],
  );

  return (
    <FlatList
      keyExtractor={keyExtractor}
      data={data}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{paddingHorizontal: 20}}
    />
  );
};

export default CategoriesList;
