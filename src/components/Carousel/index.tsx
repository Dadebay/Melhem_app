import {
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import {useCallback, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import getImageUrl from '../../lib/getImageUrl';
import Placeholder from '../../../assets/images/placeholder.png';
import useColors from '../../lib/hooks/useColors';
import {openLink} from '../../lib/deepLink';

interface Props {
  data: Slider.Item[];
}

const windowWidth = Dimensions.get('window').width;

const Carousel = ({data}: Props) => {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<Nav.Home>>();
  const [selectedSlider, setSelectedSlider] = useState(0);

  const handlePress = useCallback(
    (url: string) => {
      openLink(url, (screen, params) =>
        (navigation.navigate as (s: string, p?: object) => void)(
          screen,
          params,
        ),
      );
    },
    [navigation],
  );

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useCallback(
    (info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>}) => {
      if (
        info.viewableItems[0].index !== undefined &&
        info.viewableItems[0].index !== null
      ) {
        setSelectedSlider(info.viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    {viewabilityConfig, onViewableItemsChanged},
  ]);

  const keyExtractor = useCallback((item: Slider.Item) => {
    return item._id.toString();
  }, []);

  const renderItem: ListRenderItem<Slider.Item> = useCallback(
    ({item}) => (
      <Pressable onPress={() => handlePress(item.url)}>
        <Image
          source={
            item.image
              ? {uri: getImageUrl('sliders', item.image, 1024)}
              : Placeholder
          }
          style={{
            width: windowWidth - 40,
            aspectRatio: 21 / 9,
            borderRadius: 16,
            backgroundColor: colors.$surface,
          }}
          resizeMode="cover"
        />
      </Pressable>
    ),
    [colors, handlePress],
  );

  return (
    <View style={{gap: 10}}>
      <FlatList
        keyExtractor={keyExtractor}
        data={data}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        contentContainerStyle={{paddingHorizontal: 20, gap: 12}}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      />
      <View style={{flexDirection: 'row', justifyContent: 'center', gap: 4}}>
        {data.map((item, index) => (
          <View
            key={item._id}
            style={{
              width: index === selectedSlider ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                index === selectedSlider ? colors.$textPrimary : colors.$border,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default Carousel;
