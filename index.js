/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import {handleNotificationAction} from './src/lib/notifications/actionHandler';

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
    await handleNotificationAction(detail);
  }
});

AppRegistry.registerComponent(appName, () => App);
