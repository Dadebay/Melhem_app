import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {View} from 'react-native';
import {useCallback} from 'react';
import CountriesListItem from './item';
import {Dimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  data: Country.Item[];
  currentLanguage: ContentLanguage;
}

const windowWidth = Dimensions.get('window').width;

const CountriesList = ({data, currentLanguage}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Countries'>>();

  const keyExtractor = useCallback((item: Country.Item) => item._id, []);

  const renderItem: ListRenderItem<Country.Item> = useCallback(
    ({item}) => (
      <CountriesListItem
        data={item}
        width={windowWidth / 2}
        currentLanguage={currentLanguage}
        onPress={() =>
          navigation.navigate('Drugs', {
            title: item.translations[currentLanguage].name,
            queries: {country_id: item._id},
          })
        }
      />
    ),
    [currentLanguage, navigation],
  );

  const itemSeparator = useCallback(() => <View style={{height: 12}} />, []);

  return (
    <FlashList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingTop: 12, paddingLeft: 12}}
      ItemSeparatorComponent={itemSeparator}
      numColumns={2}
    />
  );
};

export default CountriesList;
