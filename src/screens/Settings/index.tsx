import {useState} from 'react';
import {Alert, Linking, Pressable, ScrollView, Text, View} from 'react-native';
import {ListGroup, Select, Separator, Switch} from 'heroui-native';
import {
  Globe,
  MapPin,
  Moon,
  Sun,
  MessageCircleQuestion,
  LogOut,
  Bookmark,
  Package,
  PackageCheck,
  PackageX,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';
import {LEGAL_LINKS} from '../../lib/config/links';
import themeStore from '../../lib/store/themeStore';
import authStore from '../../lib/store/authStore';
import {useShallow} from 'zustand/react/shallow';
import {useTranslation} from 'react-i18next';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<Nav.Settings, 'Settings'>;

const SettingsScreen = ({navigation}: Props) => {
  const colors = useColors();
  const {t, i18n} = useTranslation();
  const {theme, toggleTheme} = themeStore(
    useShallow(state => ({
      theme: state.theme,
      toggleTheme: state.toggleTheme,
    })),
  );

  const isDark = theme === 'dark';
  const user = authStore(state => state.user);
  const isAuthenticated = authStore(state => state.isAuthenticated);
  const logout = authStore(state => state.logout);

  const [langValue, setLangValue] = useState({
    value: i18n.language,
    label:
      i18n.language === 'tm'
        ? t('settings.turkmenLang')
        : t('settings.russianLang'),
  });

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        {text: t('settings.no'), style: 'cancel'},
        {
          text: t('settings.yes'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View
        style={{
          backgroundColor: colors.$surface,
          borderRadius: 16,
          padding: 20,
        }}>
        {isAuthenticated && user ? (
          <>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.$textPrimary,
                marginBottom: 4,
              }}>
              {user.username || t('auth.defaultUser')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.$textSecondary,
              }}>
              {user.phone}
            </Text>
          </>
        ) : (
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: colors.$textSecondary,
            }}>
            {t('settings.notLoggedIn')}
          </Text>
        )}
      </View>

      {/* Orders — auth required */}
      {isAuthenticated && (
        <View style={{gap: 10}}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.$textSecondary,
              marginLeft: 4,
            }}>
            {t('settings.myOrders')}
          </Text>
          <View style={{flexDirection: 'row', gap: 10}}>
            <Pressable
              onPress={() =>
                navigation.navigate('Orders', {initialTab: 'active'})
              }
              style={{
                flex: 1,
                backgroundColor: colors.$surface,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                gap: 8,
              }}>
              <Package
                size={22}
                color={colors.$statusPending}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}>
                {t('settings.active')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                navigation.navigate('Orders', {initialTab: 'completed'})
              }
              style={{
                flex: 1,
                backgroundColor: colors.$surface,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                gap: 8,
              }}>
              <PackageCheck
                size={22}
                color={colors.$statusCompleted}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}>
                {t('settings.completed')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                navigation.navigate('Orders', {initialTab: 'cancelled'})
              }
              style={{
                flex: 1,
                backgroundColor: colors.$surface,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                gap: 8,
              }}>
              <PackageX
                size={22}
                color={colors.$statusCancelled}
                strokeWidth={1.5}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: colors.$textPrimary,
                }}>
                {t('settings.cancelled')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Addresses — auth required */}
      {isAuthenticated && (
        <View style={{gap: 10}}>
          <ListGroup>
            <ListGroup.Item onPress={() => navigation.navigate('Addresses')}>
              <ListGroup.ItemPrefix>
                <MapPin
                  size={20}
                  color={colors.$textPrimary}
                  strokeWidth={1.5}
                />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t('settings.myAddresses')}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t('settings.deliveryAddresses')}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>
        </View>
      )}

      {/* Login CTA for unauthenticated users */}
      {!isAuthenticated && (
        <Pressable
          onPress={() => navigation.navigate('Auth' as any)}
          style={{
            backgroundColor: colors.$brandActive,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.$brandActiveText,
            }}>
            {t('auth.loginWallButton')}
          </Text>
        </Pressable>
      )}

      {/* Bookmarks */}
      <View style={{gap: 10}}>
        <ListGroup>
          <ListGroup.Item onPress={() => navigation.navigate('Bookmark')}>
            <ListGroup.ItemPrefix>
              <Bookmark
                size={20}
                color={colors.$textPrimary}
                strokeWidth={1.5}
              />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t('navbar.bookmarks')}</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>

      {/* Settings */}
      <View style={{gap: 10}}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: colors.$textSecondary,
            marginLeft: 4,
          }}>
          {t('settings.settingsTitle')}
        </Text>
        <ListGroup>
          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <Globe size={20} color={colors.$textPrimary} strokeWidth={1.5} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t('settings.language')}
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Select
                value={langValue}
                onValueChange={v => {
                  if (!v) return;
                  setLangValue(v);
                  i18n.changeLanguage(v.value);
                }}>
                <Select.Trigger
                  variant="unstyled"
                  className="flex-row items-center gap-2">
                  <Text style={{fontSize: 14, color: colors.$textSecondary}}>
                    {langValue.label}
                  </Text>
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal disableFullWindowOverlay>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width={220}>
                    <Select.Item value="tm" label="Türkmen dili">
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text style={{fontSize: 18}}>🇹🇲</Text>
                        <Select.ItemLabel />
                      </View>
                      <Select.ItemIndicator />
                    </Select.Item>
                    <Separator />
                    <Select.Item value="ru" label="Русский">
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text style={{fontSize: 18}}>🇷🇺</Text>
                        <Select.ItemLabel />
                      </View>
                      <Select.ItemIndicator />
                    </Select.Item>
                  </Select.Content>
                </Select.Portal>
              </Select>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item onPress={toggleTheme}>
            <ListGroup.ItemPrefix>
              {isDark ? (
                <Moon size={20} color={colors.$textPrimary} strokeWidth={1.5} />
              ) : (
                <Sun size={20} color={colors.$textPrimary} strokeWidth={1.5} />
              )}
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t('settings.darkTheme')}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {isDark ? t('settings.themeOn') : t('settings.themeOff')}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={isDark}
                onSelectedChange={() => toggleTheme()}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>
      </View>

      {/* Support */}
      <View style={{gap: 10}}>
        <ListGroup>
          <ListGroup.Item>
            <ListGroup.ItemPrefix>
              <MessageCircleQuestion
                size={20}
                color={colors.$textPrimary}
                strokeWidth={1.5}
              />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t('settings.support')}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t('settings.helpAndQuestions')}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>
            <ListGroup.ItemPrefix>
              <FileText
                size={20}
                color={colors.$textPrimary}
                strokeWidth={1.5}
              />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t('settings.termsOfUse')}
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>
            <ListGroup.ItemPrefix>
              <ShieldCheck
                size={20}
                color={colors.$textPrimary}
                strokeWidth={1.5}
              />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t('settings.privacyPolicy')}
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>

      {/* Logout */}
      {isAuthenticated && (
        <ListGroup>
          <ListGroup.Item onPress={handleLogout}>
            <ListGroup.ItemPrefix>
              <LogOut
                size={20}
                color={colors.$statusCancelled}
                strokeWidth={1.5}
              />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                <Text style={{color: colors.$statusCancelled}}>
                  {t('settings.logout')}
                </Text>
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </ListGroup>
      )}
    </ScrollView>
  );
};

export default SettingsScreen;
