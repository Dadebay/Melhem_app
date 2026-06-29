import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  View,
} from 'react-native';
import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import categoryApi from '../../lib/api/categoryApi';
import useColors from '../../lib/hooks/useColors';
import usePullToRefresh from '../../lib/hooks/usePullToRefresh';
import {getCategoryIcon} from '../../lib/categoryIcons';

const CategoriesScreen = () => {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<Nav.Categories>>();
  const {refreshing, onRefresh} = usePullToRefresh();

  const categoriesQuery = categoryApi.useGetAll();

  const handlePress = useCallback(
    (item: Category.Item) => {
      navigation.navigate('Drugs', {
        title: item.name,
        queries: {category_id: String(item.id)},
      });
    },
    [navigation],
  );

  const keyExtractor = useCallback(
    (item: Category.Item) => String(item.id),
    [],
  );

  const renderItem: ListRenderItem<Category.Item> = useCallback(
    ({item, index}) => {
      const Icon = getCategoryIcon(item.icon);
      const isLeft = index % 2 === 0;

      return (
        <Pressable
          onPress={() => handlePress(item)}
          style={{
            flex: 1,
            marginLeft: isLeft ? 0 : 5,
            marginRight: isLeft ? 5 : 0,
            marginBottom: 10,
            borderRadius: 14,
            backgroundColor: colors.$card,
            borderWidth: 1,
            borderColor: colors.$border,
            padding: 14,
            minHeight: 110,
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.$surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon size={20} color={colors.$textPrimary} strokeWidth={1.5} />
          </View>
          <View style={{marginTop: 12, gap: 2}}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.$textPrimary,
                letterSpacing: -0.2,
              }}
              numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        </Pressable>
      );
    },
    [colors, handlePress],
  );

  if (categoriesQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.$background,
        }}>
        <ActivityIndicator size="large" color={colors.$primary} />
      </View>
    );
  }

  return (
    <FlatList
      keyExtractor={keyExtractor}
      data={categoriesQuery.data || []}
      renderItem={renderItem}
      numColumns={2}
      contentContainerStyle={{paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40}}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={{backgroundColor: colors.$background}}
    />
  );
};

export default CategoriesScreen;
