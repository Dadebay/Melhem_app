import {Image, View} from 'react-native';
import {useCallback, useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import getImageUrl from '../../lib/getImageUrl';
import PlaceholderImage from '../../../assets/images/placeholder.png';
import useColors from '../../lib/hooks/useColors';

interface Props {
  data: string[];
}

const windowWidth = Dimensions.get('window').width;
const IMAGE_SIZE = windowWidth - 40;

const DrugImageCarousel = ({data}: Props) => {
  const [selectedSlider, setSelectedSlider] = useState(0);
  const colors = useColors();

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useCallback(
    (
      info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>} | null,
    ) => {
      if (
        info?.viewableItems[0]?.index !== undefined &&
        info?.viewableItems[0]?.index !== null
      ) {
        setSelectedSlider(info.viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    {viewabilityConfig, onViewableItemsChanged},
  ]);

  const keyExtractor = useCallback((item: string) => item, []);

  const renderItem: ListRenderItem<string> = useCallback(
    ({item}) => (
      <View
        style={{
          width: IMAGE_SIZE,
          aspectRatio: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.$border,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Image
          source={{uri: getImageUrl('drugs', item, 1024)}}
          style={{
            width: '85%',
            height: '85%',
          }}
          resizeMode="contain"
        />
      </View>
    ),
    [colors],
  );

  const EmptyComponent = (
    <View
      style={{
        width: IMAGE_SIZE,
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.$border,
        overflow: 'hidden',
      }}>
      <Image
        source={PlaceholderImage}
        style={{width: '100%', height: '100%'}}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View style={{gap: 12, paddingHorizontal: 20}}>
      <FlatList
        keyExtractor={keyExtractor}
        data={data}
        renderItem={renderItem}
        ListEmptyComponent={EmptyComponent}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={IMAGE_SIZE + 12}
        decelerationRate="fast"
        contentContainerStyle={{gap: 12}}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      />
      {data.length > 1 && (
        <View style={{flexDirection: 'row', justifyContent: 'center', gap: 4}}>
          {data.map((item, index) => (
            <View
              key={item}
              style={{
                width: index === selectedSlider ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === selectedSlider
                    ? colors.$textPrimary
                    : colors.$border,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default DrugImageCarousel;
