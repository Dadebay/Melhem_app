import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Pressable, TextInput, View} from 'react-native';
import {Ref, useRef} from 'react';
import {TextInput as RNTextInput} from 'react-native';
import BackIcon from '../../../assets/icons/Arrows/Chevron Left 2 - 24px.svg';
import SearchIcon from '../../../assets/icons/Interface/Interface 52 - 24px.svg';
import XIcon from '../../../assets/icons/Interface/Interface 22 - 24px.svg';
import {ColorType} from '../../lib/theme/lightTheme';
import {TFunction} from 'i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface Props {
  onChangeText: (text: string) => void;
  onClear: () => void;
  colors: ColorType;
  t: TFunction;
}

const Header = ({onChangeText, onClear, colors}: Props) => {
  const statusBarHeight = useSafeAreaInsets().top;
  const inputRef: Ref<RNTextInput> = useRef(null);
  const navigation =
    useNavigation<NativeStackNavigationProp<Nav.Home, 'Search'>>();

  const handleClear = () => {
    onClear();
    inputRef.current?.clear();
  };
  return (
    <View
      style={{
        paddingTop: statusBarHeight,
        padding: 4,
        gap: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Pressable onPress={navigation.goBack}>
        <BackIcon width={22} height={22} color={colors.$primary} />
      </Pressable>
      <View className="flex-1 flex-row items-center">
        <View style={{position: 'absolute', left: 12, zIndex: 2}}>
          <SearchIcon width={20} height={20} color={colors.$textPrimary} />
        </View>
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            backgroundColor: colors.$surface,
            padding: 12,
            paddingLeft: 48,
            borderRadius: 12,
            fontSize: 16,
            fontWeight: '500',
            color: colors.$textPrimary,
          }}
          placeholderTextColor={colors.$textPlaceholder}
          selectionColor={colors.$primary}
          placeholder={'Gözleg'}
          autoFocus
          onChangeText={onChangeText}
        />
        <Pressable
          onPress={handleClear}
          style={{
            position: 'absolute',
            right: 0,
            zIndex: 2,
            height: 42,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <XIcon width={16} height={16} color={colors.$textPlaceholder} />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
