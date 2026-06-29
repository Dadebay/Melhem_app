import {Pressable, Text, View} from 'react-native';
import TurboImage from 'react-native-turbo-image';
import getImageUrl from '../../lib/getImageUrl';
import utils from '../../lib/utils';
import useColors from '../../lib/hooks/useColors';

interface Props {
  data: Inventory.ListItem;
  currentLanguage: ContentLanguage;
  windowWidth: number;
  onPress: () => void;
}

const InventoriesListItem = ({
  data,
  currentLanguage,
  windowWidth,
  onPress,
}: Props) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: windowWidth / 2 - 18,
        backgroundColor: colors.$surface,
        padding: 8,
        borderRadius: 12,
        marginBottom: 12,
        flex: 1,
        gap: 12,
      }}>
      <TurboImage
        source={{uri: getImageUrl('drugs', data.drug.imageUrls[0], 256)}}
        style={{
          width: '100%',
          height: undefined,
          aspectRatio: 1,
          borderRadius: 8,
          backgroundColor: colors.$card,
        }}
      />
      <View
        style={{borderRadius: 8, backgroundColor: colors.$background, height: 30}}
        className="flex-row items-center">
        <Text
          style={{
            fontSize: 10,
            fontWeight: '500',
            color: colors.$success,
            textAlign: 'center',
            flex: 1,
          }}>
          {data.price} TMT
        </Text>
        <View style={{height: '100%', width: 1, backgroundColor: colors.$border}} />
        <Text
          style={{
            fontSize: 10,
            fontWeight: '500',
            color: data.stockCount > 0 ? colors.$success : colors.$error,
            textAlign: 'center',
            flex: 1,
          }}>
          {data.stockCount > 0 ? 'Satuwda' : 'Satuwda däl'}
        </Text>
      </View>
      <Text style={{fontSize: 14, fontWeight: '500', color: colors.$textPrimary}} numberOfLines={2}>
        {data.drug.translations[currentLanguage].name}
      </Text>
      <Text
        style={{fontSize: 12, fontWeight: '500', color: colors.$secondary}}
        numberOfLines={2}>
        {utils.getPrettyFormulation(data.drug.formulation)}
      </Text>
      <View
        style={{
          borderRadius: 8,
          backgroundColor: colors.$background,
          height: 30,
          flexDirection: 'row',
        }}
        className="justify-center items-center">
        <Text style={{textAlign: 'center', fontSize: 10, color: colors.$textPrimary}}>
          {data.drug.manufacturer.title}
        </Text>
        <Text style={{textAlign: 'center', fontSize: 10, color: colors.$textPrimary}}>
          , {data.drug.country.translations[currentLanguage].name}
        </Text>
      </View>
    </Pressable>
  );
};

export default InventoriesListItem;
