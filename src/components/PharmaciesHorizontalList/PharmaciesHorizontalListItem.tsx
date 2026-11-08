import {Image, Pressable, Text, View} from 'react-native';
import {ColorType} from '../../lib/theme/lightTheme';
import getImageUrl from '../../lib/getImageUrl';
import Placeholder from '../../../assets/images/placeholder.png';

interface Props {
  data: Pharmacy.ListItem;
  windowWidth: number;
  colors: ColorType;
  onPress: () => void;
}
const PharmaciesHorizontalListItem = ({
  data,
  windowWidth,
  colors,
  onPress,
}: Props) => {
  const cardWidth = windowWidth * 0.6;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardWidth,
        marginRight: 12,
        borderRadius: 16,
        backgroundColor: colors.$card,
        borderWidth: 1,
        borderColor: colors.$border,
        overflow: 'hidden',
      }}>
      <Image
        source={
          data.image
            ? {uri: getImageUrl('pharmacies', data.image)}
            : Placeholder
        }
        style={{
          width: cardWidth,
          height: cardWidth * 0.5,
        }}
        resizeMode="cover"
      />
      <View style={{padding: 14, gap: 6}}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: colors.$textPrimary,
          }}
          numberOfLines={1}>
          {data.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.$textSecondary,
          }}
          numberOfLines={1}>
          {data.address}
        </Text>
        {data.location_name ? (
          <Text
            style={{
              fontSize: 11,
              color: colors.$textSecondary,
            }}
            numberOfLines={1}>
            {data.location_name}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export default PharmaciesHorizontalListItem;
