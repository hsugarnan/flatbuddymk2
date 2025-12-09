const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const EXPO_PUSH_NOTIFICATION_URL = 'https://exp.host/--/api/v2/push/send';

exports.notifyOverdueChores = functions.firestore
    .document('chores/{choreId}')
    .onUpdate(async (change, context) => {
        try {
            const chore = change.after.data();
            const now = new Date();
            const currentChoreDate = new Date(chore.date)
            console.log(chore)

            // Check if the chore is overdue
            if (currentChoreDate < now) {
                const userId = chore.userId;

                if (userId) {
                    const userRef = admin.firestore().collection('users').doc(userId);
                    const userDoc = await userRef.get();

                    if (!userDoc.exists) {
                        console.log('No such user!');
                        return null;
                    }

                    const expoPushToken = userDoc.data().expoPushToken.data;  // Use expoPushToken instead of fcmToken
                    if (expoPushToken) {
                        const message = {
                            to: expoPushToken,
                            sound: 'default',
                            title: 'Overdue Chore Alert',
                            body: `Your chore "${chore.choreName}" is overdue!`,
                        };

                        try {
                            const response = await axios.post(EXPO_PUSH_NOTIFICATION_URL, message, {
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });

                            console.log('Expo notification response:', response.data);
                        } catch (error) {
                            console.error('Error sending Expo notification:', error.response ? error.response.data : error.message);
                        }
                    } else {
                        console.log('User does not have an Expo push token.');
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error processing overdue chores:', error.message, error.stack);
            throw new functions.https.HttpsError('unknown', 'Error processing overdue chores');
        }
    });
