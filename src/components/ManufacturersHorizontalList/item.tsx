import {Image, Pressable, Text} from 'react-native';
import getImageUrl from '../../lib/getImageUrl';
import Placeholder from '../../../assets/images/placeholder.png';
import useColors from '../../lib/hooks/useColors';

interface Props {
  data: Manufacturer.Item;
  width: number;
  onPress: () => void;
}

const ManufacturersHorizontalListItem = ({data, width, onPress}: Props) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: width,
        borderWidth: 1,
        borderColor: colors.$border,
        marginRight: 12,
        padding: 8,
        borderRadius: 12,
        gap: 8,
      }}>
      <Image
        source={
          data.logo
            ? {uri: getImageUrl('manufacturers', data.logo)}
            : Placeholder
        }
        style={{
          width: width - 18,
          height: (width - 18) * (2 / 3),
          borderRadius: 8,
        }}
      />
      <Text style={{fontSize: 14, fontWeight: '500', color: colors.$textPrimary}}>{data.title}</Text>
      <Text style={{fontSize: 10, color: colors.$textPrimary}}>{data.drugCount} drugs</Text>
    </Pressable>
  );
};

export default ManufacturersHorizontalListItem;
