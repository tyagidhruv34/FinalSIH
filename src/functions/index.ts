/**
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

// Sends a push notification when a new alert is created.
export const sendAlertNotification = onDocumentCreated("alerts/{alertId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();
  const title = data.title;
  const description = data.description;
  const severity = data.severity;

  logger.log(`New alert created: ${title}`, { structuredData: true, data });

  // This is a placeholder for sending to specific device tokens.
  // A real implementation would query a 'users' collection to find users
  // in the 'affectedAreas' and get their FCM tokens.
  const topic = "all_users"; 

  const message = {
    notification: {
      title: `🚨 ${severity} Alert: ${title}`,
      body: description,
    },
    topic: topic,
  };

  try {
    const response = await getMessaging().send(message);
    logger.log("Successfully sent message:", response);
  } catch (error) {
    logger.error("Error sending message:", error);
  }
});
