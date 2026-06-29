import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../../screens/Home';
import DrugsScreen from '../../screens/Drugs';
import useDefaultStackOptions from './useDefaultStackOptions';
import PharmaciesScreen from '../../screens/Pharmacies';
import CountriesScreen from '../../screens/Countries';
import ManufacturersScreen from '../../screens/Manufacturers';
import DrugScreen from '../../screens/Drug';
import PharmacyScreen from '../../screens/Pharmacy';
import useColors from '../../lib/hooks/useColors';
import InventoryScreen from '../../screens/Inventory';
import SearchScreen from '../../screens/Search';
import {useTranslation} from 'react-i18next';

const Stack = createNativeStackNavigator<Nav.Home>();

const HomeStack = () => {
  const screenOptions = useDefaultStackOptions();
  const colors = useColors();
  const {t} = useTranslation();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Drugs" component={DrugsScreen} />
      <Stack.Screen
        name="Drug"
        component={DrugScreen}
        options={{
          headerShadowVisible: false,
          headerTitle: '',
        }}
      />
      <Stack.Screen
        name="Pharmacies"
        component={PharmaciesScreen}
        options={{title: t('navigation.pharmacies')}}
      />
      <Stack.Screen
        name="Countries"
        component={CountriesScreen}
        options={{title: t('navigation.countries')}}
      />
      <Stack.Screen
        name="Manufacturers"
        component={ManufacturersScreen}
        options={{title: t('navigation.manufacturers')}}
      />
      <Stack.Screen
        name="Pharmacy"
        component={PharmacyScreen}
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: colors.$textPrimary,
        }}
      />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: false,
          animation: 'fade',
          presentation: 'transparentModal',
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
