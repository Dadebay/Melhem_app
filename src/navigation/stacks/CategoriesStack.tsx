import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CategoriesScreen from '../../screens/Categories';
import DrugsScreen from '../../screens/Drugs';
import useDefaultStackOptions from './useDefaultStackOptions';
import DrugScreen from '../../screens/Drug';
import {useTranslation} from 'react-i18next';

const Stack = createNativeStackNavigator<Nav.Categories>();

const CategoriesStack = () => {
  const screenOptions = useDefaultStackOptions();
  const {t} = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{title: t('navigation.categories')}}
      />
      <Stack.Screen name="Drugs" component={DrugsScreen} />
      <Stack.Screen
        name="Drug"
        component={DrugScreen}
        options={{headerShadowVisible: false, headerTitle: ''}}
      />
    </Stack.Navigator>
  );
};

export default CategoriesStack;
