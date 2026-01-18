import * as Notifications from 'expo-notifications';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const registerForPushNotificationsAsync = async (userId) => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission not granted for notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    
    // Save token to Firestore
    const firestore = getFirestore();
    await updateDoc(doc(firestore, 'users', userId), {
      expoPushToken: token.data,
      lastTokenUpdate: serverTimestamp(),
    });

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
};

export const setupNotificationListeners = () => {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification received:', notification);
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('User tapped notification with data:', data);
    // Handle navigation based on notification data
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};