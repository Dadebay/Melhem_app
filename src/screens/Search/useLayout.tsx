import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useEffect} from 'react';
import Header from './Header';
import {TFunction} from 'i18next';
import {ColorType} from '../../lib/theme/lightTheme';

interface Props {
  navigation: NativeStackNavigationProp<Nav.Home, 'Search'>;
  onClear: () => void;
  onChangeText: (text: string) => void;
  t: TFunction;
  colors: ColorType;
}

const useSearchLayout = ({
  navigation,
  onChangeText,
  onClear,
  t,
  colors,
}: Props) => {
  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          colors={colors}
          t={t}
          onChangeText={onChangeText}
          onClear={onClear}
        />
      ),
    });
  });
};

export default useSearchLayout;
