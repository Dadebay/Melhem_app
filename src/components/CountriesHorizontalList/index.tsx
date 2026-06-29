import {FlashList, ListRenderItem} from '@shopify/flash-list';
import React, {useCallback} from 'react';
import CountriesHorizontalListItem from './item';
import {Dimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

const windowWidth = Dimensions.get('window').width;

interface Props {
  data: Country.Item[];
  currentLanguage: ContentLanguage;
}
const CountriesHorizontalList = ({data, currentLanguage}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Home'>>();

  const keyExtractor = useCallback((item: Country.Item) => item._id, []);

  const renderItem: ListRenderItem<Country.Item> = useCallback(
    ({item}) => (
      <CountriesHorizontalListItem
        data={item}
        width={windowWidth / 3}
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

  return (
    <FlashList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      horizontal
      contentContainerStyle={{paddingHorizontal: 12}}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default CountriesHorizontalList;
