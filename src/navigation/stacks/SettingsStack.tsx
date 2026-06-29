import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SettingsScreen from '../../screens/Settings';
import {useTranslation} from 'react-i18next';
import useDefaultStackOptions from './useDefaultStackOptions';
import LanguagesScreen from '../../screens/Languages';
import AddressesScreen from '../../screens/Addresses';
import AddressDetailScreen from '../../screens/AddressDetail';
import OrdersScreen from '../../screens/Orders';
import OrderDetailScreen from '../../screens/OrderDetail';
import AuthScreen from '../../screens/Auth';
import BookmarkScreen from '../../screens/Bookmark';
import DrugScreen from '../../screens/Drug';

const Stack = createNativeStackNavigator<Nav.Settings>();

const SettingsStack = () => {
  const {t} = useTranslation();
  const screenOptions = useDefaultStackOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: t('navigation.profile')}}
      />
      <Stack.Screen
        name="Bookmark"
        component={BookmarkScreen}
        options={{title: t('navbar.bookmarks')}}
      />
      <Stack.Screen
        name="Drug"
        component={DrugScreen}
        options={{headerShadowVisible: false, headerTitle: ''}}
      />
      <Stack.Screen
        name="Languages"
        component={LanguagesScreen}
        options={{title: t('settings.language')}}
      />
      <Stack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{title: t('navigation.myAddresses')}}
        initialParams={{mode: 'manage'}}
      />
      <Stack.Screen
        name="AddressDetail"
        component={AddressDetailScreen}
        options={{title: t('navigation.address')}}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{title: t('navigation.myOrders')}}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{title: t('navigation.order')}}
      />
      <Stack.Screen
        name={'Auth' as any}
        component={AuthScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default SettingsStack;
