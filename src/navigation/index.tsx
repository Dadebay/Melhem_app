import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/HomeStack';
import SettingsStack from './stacks/SettingsStack';
import ReminderStack from './stacks/ReminderStack';
import CategoriesStack from './stacks/CategoriesStack';
import CartStack from './stacks/CartStack';
import {useTranslation} from 'react-i18next';
import {View, Text} from 'react-native';
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Bell,
  UserRound,
} from 'lucide-react-native';
import cartStore from '../lib/store/cartStore';
import authStore from '../lib/store/authStore';
import useColors from '../lib/hooks/useColors';
import OnboardingNavigator from './OnboardingNavigator';

const Tab = createBottomTabNavigator();

const Navigation = () => {
  const {t} = useTranslation();
  const colors = useColors();
  const cartCount = cartStore(state => state.items.length);
  const onboarded = authStore(state => state.onboarded);

  // First run: language + location pick, then a skippable auth step.
  if (!onboarded) {
    return <OnboardingNavigator />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.$selected,
        tabBarInactiveTintColor: colors.$notSelected,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          tabBarIcon: ({color}) => (
            <Home size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabel: t('navbar.home'),
        }}
      />
      <Tab.Screen
        name="CategoriesStack"
        component={CategoriesStack}
        options={{
          tabBarIcon: ({color}) => (
            <LayoutGrid size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabel: t('navbar.categories'),
        }}
      />
      <Tab.Screen
        name="CartStack"
        component={CartStack}
        options={{
          tabBarIcon: ({color}) => (
            <View>
              <ShoppingBag size={22} color={color} strokeWidth={1.5} />
              {cartCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: colors.$brandActive,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 3,
                  }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: colors.$brandActiveText,
                    }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          tabBarLabel: t('navbar.cart'),
        }}
      />
      <Tab.Screen
        name="ReminderStack"
        component={ReminderStack}
        options={{
          tabBarIcon: ({color}) => (
            <Bell size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabel: t('navbar.reminders'),
        }}
      />
      <Tab.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{
          tabBarIcon: ({color}) => (
            <UserRound size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabel: t('navbar.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

export default Navigation;
