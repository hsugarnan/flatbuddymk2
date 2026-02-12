const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

admin.initializeApp();
const expo = new Expo();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send a push notification via Expo Push Service
 * Works for both iOS and Android
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
  // Validate the token
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    console.log(`Invalid or missing Expo push token: ${pushToken}`);
    return null;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', tickets);
    return tickets[0];
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
}

/**
 * Send notifications to multiple users
 */
async function sendBatchNotifications(messages) {
  // Filter out invalid tokens
  const validMessages = messages.filter(msg => 
    msg.to && Expo.isExpoPushToken(msg.to)
  );

  if (validMessages.length === 0) {
    console.log('No valid tokens to send to');
    return [];
  }

  try {
    const chunks = expo.chunkPushNotifications(validMessages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log(`Sent ${tickets.length} notifications`);
    return tickets;
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    return [];
  }
}

/**
 * Get user data by username
 */
async function getUserByUsername(username) {
  const snapshot = await admin.firestore()
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get all flatmates' push tokens for a flat
 */
async function getFlatmateTokens(flatNum, excludeUserId = null) {
  const snapshot = await admin.firestore()
    .collection('users')
    .where('flatNum', '==', flatNum)
    .get();

  const tokens = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (doc.id !== excludeUserId && data.expoPushToken && !data.vacated) {
      tokens.push({
        token: data.expoPushToken,
        username: data.username,
        userId: doc.id,
      });
    }
  });
  return tokens;
}

// ============================================
// SCHEDULED FUNCTIONS (Background notifications)
// ============================================

/**
 * DAILY 9:00 AM - Remind users of their chores for today
 * Runs every day at 9am UK time
 */
exports.dailyChoreReminder = functions.pubsub
  .schedule('0 9 * * *')  // Cron: 9:00 AM every day
  .timeZone('Europe/London')
  .onRun(async (context) => {
    console.log('Running daily chore reminder...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get all chores for today
    const choresSnapshot = await admin.firestore()
      .collection('chores')
      .where('date', '==', today)
      .get();

    if (choresSnapshot.empty) {
      console.log('No chores scheduled for today');
      return null;
    }

    // Group chores by user
    const choresByUser = {};
    choresSnapshot.forEach(doc => {
      const chore = doc.data();
      const username = chore.userEmail; // This is actually the username
      if (!choresByUser[username]) {
        choresByUser[username] = [];
      }
      choresByUser[username].push(chore.choreName);
    });

    // Send notification to each user
    const messages = [];
    for (const [username, chores] of Object.entries(choresByUser)) {
      const user = await getUserByUsername(username);
      
      if (user && user.expoPushToken && !user.vacated) {
        const choreList = chores.join(', ');
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: '🧹 Today\'s Chores',
          body: chores.length === 1 
            ? `You have: ${choreList}` 
            : `You have ${chores.length} chores: ${choreList}`,
          data: { type: 'daily_reminder', date: today },
          priority: 'high',
        });
      }
    }

    await sendBatchNotifications(messages);
    console.log(`Sent ${messages.length} daily reminders`);
    return null;
  });

/**
 * DAILY 9:00 AM - Alert users about overdue chores
 */
exports.overdueChoreAlert = functions.pubsub
  .schedule('0 9 * * *')  // Cron: 9:00 AM every day
  .timeZone('Europe/London')
  .onRun(async (context) => {
    console.log('Running overdue chore check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get all overdue chores (date before today)
    const overdueSnapshot = await admin.firestore()
      .collection('chores')
      .where('date', '<', today)
      .get();

    if (overdueSnapshot.empty) {
      console.log('No overdue chores');
      return null;
    }

    // Group overdue chores by user
    const overdueByUser = {};
    overdueSnapshot.forEach(doc => {
      const chore = doc.data();
      const username = chore.userEmail;
      if (!overdueByUser[username]) {
        overdueByUser[username] = [];
      }
      overdueByUser[username].push(chore.choreName);
    });

    // Send alerts
    const messages = [];
    for (const [username, chores] of Object.entries(overdueByUser)) {
      const user = await getUserByUsername(username);
      
      if (user && user.expoPushToken && !user.vacated) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: '⚠️ Overdue Chores',
          body: `You have ${chores.length} overdue chore(s): ${chores.join(', ')}`,
          data: { type: 'overdue_alert' },
          priority: 'high',
        });
      }
    }

    await sendBatchNotifications(messages);
    console.log(`Sent ${messages.length} overdue alerts`);
    return null;
  });

/**
 * DAILY 8:00 PM - Preview tomorrow's chores
 */
exports.tomorrowChorePreview = functions.pubsub
  .schedule('0 20 * * *')  // Cron: 8:00 PM every day
  .timeZone('Europe/London')
  .onRun(async (context) => {
    console.log('Running tomorrow chore preview...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get all chores for tomorrow
    const choresSnapshot = await admin.firestore()
      .collection('chores')
      .where('date', '==', tomorrowStr)
      .get();

    if (choresSnapshot.empty) {
      console.log('No chores scheduled for tomorrow');
      return null;
    }

    // Group by user
    const choresByUser = {};
    choresSnapshot.forEach(doc => {
      const chore = doc.data();
      const username = chore.userEmail;
      if (!choresByUser[username]) {
        choresByUser[username] = [];
      }
      choresByUser[username].push(chore.choreName);
    });

    // Send notifications
    const messages = [];
    for (const [username, chores] of Object.entries(choresByUser)) {
      const user = await getUserByUsername(username);
      
      if (user && user.expoPushToken && !user.vacated) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: '📅 Tomorrow\'s Chores',
          body: `Heads up! Tomorrow you have: ${chores.join(', ')}`,
          data: { type: 'tomorrow_preview', date: tomorrowStr },
          priority: 'default',
        });
      }
    }

    await sendBatchNotifications(messages);
    console.log(`Sent ${messages.length} tomorrow previews`);
    return null;
  });

// ============================================
// REAL-TIME TRIGGERS (Instant notifications)
// ============================================

/**
 * When a new expense is created, notify the assigned user
 */
exports.onExpenseCreated = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snap, context) => {
    const expense = snap.data();
    console.log('New expense created:', expense);

    // Find the user who needs to pay
    const user = await getUserByUsername(expense.expenseUser);
    
    if (user && user.expoPushToken) {
      await sendPushNotification(
        user.expoPushToken,
        '💰 New Expense',
        `You owe €${expense.price} for "${expense.expenseName}"`,
        { 
          type: 'expense_created', 
          expenseId: context.params.expenseId,
          amount: expense.price,
        }
      );
    }

    return null;
  });

/**
 * When a new FlatBoard post is created, notify all flatmates
 */
exports.onFlatBoardPost = functions.firestore
  .document('flatboards/{flatId}/posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const flatId = context.params.flatId;
    console.log('New FlatBoard post:', post);

    // Get all flatmates except the poster
    const tokens = await getFlatmateTokens(flatId, post.createdBy);

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: '📋 New FlatBoard Post',
      body: `${post.createdByName}: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`,
      data: { 
        type: 'flatboard_post', 
        flatId, 
        postId: context.params.postId,
      },
      priority: 'high',
    }));

    await sendBatchNotifications(messages);
    return null;
  });

/**
 * When a user vacates or returns, notify flatmates
 */
exports.onUserVacateChange = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger if vacated status changed
    if (before.vacated === after.vacated) return null;
    if (!after.flatNum) return null;

    console.log(`User ${after.username} vacated status changed to: ${after.vacated}`);

    // Get flatmates to notify
    const tokens = await getFlatmateTokens(after.flatNum, context.params.userId);

    const title = after.vacated ? '✈️ Flatmate Away' : '🏠 Flatmate Returned';
    const body = after.vacated 
      ? `${after.username} has vacated the flat. Their chores have been redistributed.`
      : `${after.username} is back! Chores have been redistributed.`;

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { 
        type: 'vacate_change', 
        username: after.username,
        vacated: after.vacated,
      },
      priority: 'default',
    }));

    await sendBatchNotifications(messages);
    return null;
  });

/**
 * When a mess/issue is reported, notify the responsible person
 */
exports.onMessReported = functions.firestore
  .document('mess/{messId}')
  .onCreate(async (snap, context) => {
    const mess = snap.data();
    console.log('New mess reported:', mess);

    // Find the responsible user
    const user = await getUserByUsername(mess.messResponsible);
    
    if (user && user.expoPushToken) {
      await sendPushNotification(
        user.expoPushToken,
        '🚨 Issue Reported',
        `"${mess.messName}" - ${mess.messDescription}`,
        { 
          type: 'mess_reported', 
          messId: context.params.messId,
        }
      );
    }

    return null;
  });

/**
 * When a shared product is assigned, notify the user
 */
exports.onProductAssigned = functions.firestore
  .document('sharedProducts/{productId}')
  .onCreate(async (snap, context) => {
    const product = snap.data();
    console.log('New shared product:', product);

    if (product.purchasedBy && product.status === 'to be purchased') {
      const user = await getUserByUsername(product.purchasedBy);
      
      if (user && user.expoPushToken) {
        await sendPushNotification(
          user.expoPushToken,
          '🛒 Product to Purchase',
          `It's your turn to buy: ${product.productName}`,
          { 
            type: 'product_assigned', 
            productId: context.params.productId,
          }
        );
      }
    }

    return null;
  });

// ============================================
// HTTP ENDPOINTS (For testing)
// ============================================

/**
 * Test endpoint to send a notification to a specific user
 * Usage: https://your-project.cloudfunctions.net/testNotification?userId=xxx
 */
exports.testNotification = functions.https.onRequest(async (req, res) => {
  const { userId, token } = req.query;

  let pushToken = token;

  if (userId && !token) {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    pushToken = userDoc.data().expoPushToken;
  }

  if (!pushToken) {
    return res.status(400).json({ error: 'No push token provided or found' });
  }

  const result = await sendPushNotification(
    pushToken,
    '🔔Test Notification',
    'This is a test notification from FlatBuddy!',
    { type: 'test' }
  );

  res.json({ success: true, result });
});

/**
 * Manually trigger the daily reminder (for testing)
 */
exports.triggerDailyReminder = functions.https.onRequest(async (req, res) => {
  // Re-use the daily reminder logic
  const today = new Date().toISOString().split('T')[0];
  
  const choresSnapshot = await admin.firestore()
    .collection('chores')
    .where('date', '==', today)
    .get();

  const count = choresSnapshot.size;
  res.json({ 
    success: true, 
    message: `Found ${count} chores for today (${today})`,
    triggered: true 
  });
});
