import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CartScreen from '../../screens/Cart';
import AuthScreen from '../../screens/Auth';
import CheckoutScreen from '../../screens/Checkout';
import OrderCreatedScreen from '../../screens/OrderCreated';
import AddressPickerScreen from '../../screens/AddressPicker';
import AddressDetailScreen from '../../screens/AddressDetail';
import DrugScreen from '../../screens/Drug';
import DrugsScreen from '../../screens/Drugs';
import useDefaultStackOptions from './useDefaultStackOptions';
import {useTranslation} from 'react-i18next';

const Stack = createNativeStackNavigator<Nav.Home & Nav.Settings>();

const CartStack = () => {
  const screenOptions = useDefaultStackOptions();
  const {t} = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{title: t('navigation.cart')}}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{title: t('navigation.checkout')}}
      />
      <Stack.Screen
        name="AddressPicker"
        component={AddressPickerScreen}
        options={{title: t('navigation.selectAddress')}}
      />
      <Stack.Screen
        name="AddressDetail"
        component={AddressDetailScreen}
        options={{title: t('navigation.newAddress')}}
      />
      <Stack.Screen
        name="OrderCreated"
        component={OrderCreatedScreen}
        options={{headerShown: false, gestureEnabled: false}}
      />
      <Stack.Screen
        name="Drug"
        component={DrugScreen}
        options={{
          headerShadowVisible: false,
          headerTitle: '',
        }}
      />
      <Stack.Screen name="Drugs" component={DrugsScreen} />
    </Stack.Navigator>
  );
};

export default CartStack;
