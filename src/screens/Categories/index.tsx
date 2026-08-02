import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  View,
} from 'react-native';
import {useCallback} from 'react';
import {ChevronRight} from 'lucide-react-native';
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
    ({item}) => {
      const Icon = getCategoryIcon(item.icon);

      return (
        <Pressable
          onPress={() => handlePress(item)}
          style={({pressed}) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 10,
            borderRadius: 14,
            backgroundColor: colors.$card,
            borderWidth: 1,
            borderColor: colors.$border,
            paddingVertical: 12,
            paddingHorizontal: 14,
            opacity: pressed ? 0.7 : 1,
          })}>
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
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: '600',
              color: colors.$textPrimary,
              letterSpacing: -0.2,
            }}
            numberOfLines={2}>
            {item.name}
          </Text>
          <ChevronRight
            size={18}
            color={colors.$textSecondary}
            strokeWidth={1.5}
          />
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
      contentContainerStyle={{paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40}}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={{backgroundColor: colors.$background}}
    />
  );
};

export default CategoriesScreen;
