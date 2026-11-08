import {Image, Pressable, Text} from 'react-native';
import getImageUrl from '../../lib/getImageUrl';
import Placeholder from '../../../assets/images/placeholder.png';
import useColors from '../../lib/hooks/useColors';

interface Props {
  data: Country.Item;
  width: number;
  currentLanguage: ContentLanguage;
  onPress: () => void;
}

const CountriesListItem = ({data, width, currentLanguage, onPress}: Props) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: width - 18,
        borderWidth: 1,
        borderColor: colors.$border,
        marginRight: 12,
        padding: 8,
        borderRadius: 12,
        gap: 8,
      }}>
      <Image
        source={
          data.flag ? {uri: getImageUrl('countries', data.flag)} : Placeholder
        }
        style={{
          width: width - 36,
          height: (width - 36) * (2 / 3),
          borderRadius: 8,
        }}
      />
      <Text
        style={{fontSize: 14, fontWeight: '500', color: colors.$textPrimary}}>
        {data.translations[currentLanguage].name}
      </Text>
      <Text style={{fontSize: 10, color: colors.$textPrimary}}>
        Drugs: {data.drugCount}
      </Text>
    </Pressable>
  );
};

export default CountriesListItem;
