import {Pressable, Text, View} from 'react-native';
import useColors from '../../lib/hooks/useColors';
import {getCategoryIcon} from '../../lib/categoryIcons';

interface Props {
  data: Category.Item;
  onPress: () => void;
}
const CategoryListItem = ({data, onPress}: Props) => {
  const colors = useColors();
  const Icon = getCategoryIcon(data.icon);

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        width: 76,
        marginRight: 16,
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.$surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}>
        <Icon size={24} color={colors.$textPrimary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: colors.$textPrimary,
          textAlign: 'center',
        }}
        numberOfLines={2}>
        {data.name}
      </Text>
    </Pressable>
  );
};

export default CategoryListItem;
