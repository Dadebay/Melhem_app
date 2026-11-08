import {FlashList, ListRenderItem} from '@shopify/flash-list';
import {Image, Pressable, Text, View} from 'react-native';
import {changeLanguage, TFunction} from 'i18next';
import {useCallback} from 'react';
import {ImageSourcePropType} from 'react-native';
import useColors from '../../lib/hooks/useColors';

interface Props {
  data: LanguagesData[];
  t: TFunction;
}

const LanguagesList = ({data, t}: Props) => {
  const colors = useColors();
  const keyExtractor = useCallback((item: LanguagesData) => item.key, []);

  const renderItem: ListRenderItem<LanguagesData> = useCallback(
    ({item}) => (
      <Pressable
        onPress={() => changeLanguage(item.key)}
        className="flex-row items-center"
        style={{
          borderWidth: 1,
          borderColor: colors.$surface,
          borderRadius: 12,
          padding: 12,
          backgroundColor:
            t('key') === item.key ? colors.$surface : colors.$background,
          gap: 10,
        }}>
        <Image source={item.imageSrc as ImageSourcePropType} />
        <Text style={{fontWeight: '700', color: colors.$textPrimary}}>
          {item.title}
        </Text>
      </Pressable>
    ),
    [t, colors],
  );

  const itemSeparator = useCallback(() => <View style={{height: 12}} />, []);

  return (
    <FlashList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{padding: 12}}
      ItemSeparatorComponent={itemSeparator}
    />
  );
};

export default LanguagesList;
