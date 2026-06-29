import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useEffect} from 'react';

interface Props {
  navigation: NativeStackNavigationProp<Nav.Home, 'Pharmacy'>;
}

const usePharmacyLayout = ({navigation}: Props) => {
  useEffect(() => {
    navigation.setOptions({
      title: '',
    });
  }, [navigation]);
};

export default usePharmacyLayout;
