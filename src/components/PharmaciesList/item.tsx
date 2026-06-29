import {Image, Pressable, Text, View} from 'react-native';
import Placeholder from '../../../assets/images/placeholder.png';
import LocationIcon from '../../../assets/icons/Places/Icon 25 - 24px.svg';
import {Dimensions} from 'react-native';
import useColors from '../../lib/hooks/useColors';
import getImageUrl from '../../lib/getImageUrl';

interface Props {
  data: Pharmacy.ListItem;
  onPress: () => void;
}

const windowWidth = Dimensions.get('window').width;

const PharmaciesListItem = ({data, onPress}: Props) => {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: windowWidth / 2 - 16,
        borderWidth: 1,
        borderColor: colors.$border,
        borderRadius: 12,
        padding: 8,
        gap: 8,
        flex: 1,
      }}>
      <View className="justify-center items-center">
        <Image
          source={
            data.image
              ? {uri: getImageUrl('pharmacies', data.image)}
              : Placeholder
          }
          style={{
            width: windowWidth / 2 - 32,
            height: (windowWidth / 2 - 32) * (9 / 16),
            borderRadius: 8,
          }}
        />
      </View>
      <Text style={{fontSize: 14, fontWeight: '500', color: colors.$textPrimary}}>
        {data.name}
      </Text>
      <View style={{height: 1, backgroundColor: colors.$border}} />
      <View className="flex-row justify-between items-center" style={{gap: 8}}>
        <View className="flex-row items-center" style={{gap: 8, flex: 1}}>
          <LocationIcon width={16} height={16} color={colors.$notSelected} />
          <Text
            style={{fontSize: 10, color: colors.$textSecondary, flex: 1}}
            numberOfLines={2}>
            {data.address}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default PharmaciesListItem;
