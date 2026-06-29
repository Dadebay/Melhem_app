import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BookmarkScreen from '../../screens/Bookmark';
import useDefaultStackOptions from './useDefaultStackOptions';
import DrugScreen from '../../screens/Drug';

const Stack = createNativeStackNavigator<Nav.Bookmark>();

const BookmarkStack = () => {
  const screenOptions = useDefaultStackOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Bookmark"
        component={BookmarkScreen}
        options={{title: 'Bellikler'}}
      />
      <Stack.Screen
        name="Drug"
        component={DrugScreen}
        options={{headerShadowVisible: false, headerTitle: ''}}
      />
    </Stack.Navigator>
  );
};

export default BookmarkStack;
