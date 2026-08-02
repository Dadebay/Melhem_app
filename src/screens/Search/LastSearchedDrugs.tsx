import {Pressable, Text, View} from 'react-native';
import {TFunction} from 'i18next';
import SearchIcon from '../../../assets/icons/Interface/Interface 52 - 24px.svg';
import {useShallow} from 'zustand/react/shallow';
import appStore from '../../lib/store/appStore';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ColorType} from '../../lib/theme/lightTheme';

interface Props {
  t: TFunction;
  currentLanguage: ContentLanguage;
  colors: ColorType;
}

const LastSearchedDrugs = ({colors, t}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Search'>>();
  const {lastSearchedDrugs, clearLastSearchedDrugs} = appStore(
    useShallow(state => ({
      lastSearchedDrugs: state.lastSearchedDrugs,
      clearLastSearchedDrugs: state.clearLastSearchedDrugs,
    })),
  );

  const handlePress = (drugId: string) => {
    navigation.navigate('Drug', {id: drugId});
  };

  return (
    <View style={{padding: 12, gap: 12}}>
      <Text style={{fontWeight: '700'}}>{t('search.recent')}</Text>
      <View style={{gap: 8}}>
        {lastSearchedDrugs.map(item => (
          <Pressable
            key={item.id}
            onPress={() => handlePress(String(item.id))}
            className="flex-row items-center"
            style={{gap: 12}}>
            <View
              className="items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderWidth: 1,
                borderRadius: 12,
                borderColor: colors.$border,
              }}>
              <SearchIcon width={16} height={16} color={colors.$border} />
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
              }}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {lastSearchedDrugs.length > 0 && (
        <View className="flex-row">
          <Pressable
            onPress={clearLastSearchedDrugs}
            style={{
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 8,
              borderColor: colors.$border,
            }}>
            <Text>{t('search.clear')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default LastSearchedDrugs;
