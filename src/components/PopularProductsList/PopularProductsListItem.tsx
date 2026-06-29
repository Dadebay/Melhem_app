import {Dimensions, Image, Pressable, Text, View} from 'react-native';
import TurboImage from 'react-native-turbo-image';
import getImageUrl from '../../lib/getImageUrl';
import useColors from '../../lib/hooks/useColors';
import utils from '../../lib/utils';
import PlaceholderImage from '../../../assets/images/placeholder.png';

const windowWidth = Dimensions.get('window').width;

interface Props {
  data: Drug.ListItem;
  onPress: () => void;
}

const PopularProductsListItem = ({data, onPress}: Props) => {
  const colors = useColors();
  const cardWidth = windowWidth * 0.4;

  const {priceText, isOutOfStock} = utils.getDrugPriceText(data);
  const imageKey = data.images?.[0] ?? null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardWidth,
        marginRight: 12,
      }}>
      <View
        style={{
          aspectRatio: 1,
          backgroundColor: colors.$card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.$border,
          overflow: 'hidden',
          marginBottom: 10,
        }}>
        {imageKey ? (
          <TurboImage
            source={{uri: getImageUrl('drugs', imageKey, 256)}}
            style={{width: '100%', height: '100%'}}
          />
        ) : (
          <Image
            source={PlaceholderImage}
            style={{width: '100%', height: '100%'}}
          />
        )}
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.$textPrimary,
          marginBottom: 3,
        }}
        numberOfLines={2}>
        {data.name}
      </Text>
      {isOutOfStock ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.$error,
          }}>
          Satlykda yok
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.$textPrimary,
          }}>
          {priceText}
        </Text>
      )}
    </Pressable>
  );
};

export default PopularProductsListItem;
