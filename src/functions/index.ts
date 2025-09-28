/**
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { TranslationServiceClient } from "@google-cloud/translate";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();
const translationClient = new TranslationServiceClient();

const TARGET_LANGUAGES = [
  "hi", // Hindi
  "mr", // Marathi
  "ta", // Tamil
  "te", // Telugu
  "bn", // Bengali
  "gu", // Gujarati
  "kn", // Kannada
  "ml", // Malayalam
  "pa", // Punjabi
];

// This Cloud Function triggers when a new alert is created.
// It translates the alert content into multiple languages and stores them in a subcollection.
// It also contains placeholder logic for sending language-specific push notifications.
export const translateAndNotify = onDocumentCreated("alerts/{alertId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }

  const alertId = event.params.alertId;
  const alertData = snapshot.data();
  const { title, description } = alertData;

  logger.log(`New alert created with ID: ${alertId}. Starting translation.`);

  const translations: { [key: string]: { title: string; description: string } } = {};

  // The parent resource project name for the translation API.
  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
    logger.error("Google Cloud Project ID is not set.");
    return;
  }
  const location = "global";
  const parent = `projects/${projectId}/locations/${location}`;

  // Run all translation requests in parallel.
  const translationPromises = TARGET_LANGUAGES.map(async (lang) => {
    try {
      const [response] = await translationClient.translateText({
        parent: parent,
        contents: [title, description],
        mimeType: "text/plain",
        targetLanguageCode: lang,
      });

      if (response.translations && response.translations.length >= 2) {
        const translatedTitle = response.translations[0].translatedText;
        const translatedDescription = response.translations[1].translatedText;
        
        if (translatedTitle && translatedDescription) {
            translations[lang] = {
                title: translatedTitle,
                description: translatedDescription,
            };
            logger.log(`Successfully translated to ${lang}.`);
        }
      }
    } catch (error) {
      logger.error(`Error translating to ${lang}:`, error);
    }
  });

  await Promise.all(translationPromises);

  // Store the completed translations in a subcollection.
  const translationStoragePromises = Object.entries(translations).map(([lang, content]) => {
      return db
        .collection("alerts")
        .doc(alertId)
        .collection("translations")
        .doc(lang)
        .set(content);
    }
  );

  await Promise.all(translationStoragePromises);
  logger.log(`All translations stored for alert ${alertId}.`);

  // --- Placeholder for Language-Specific Push Notifications ---
  // A real implementation would:
  // 1. Query your 'users' collection to find users in the 'affectedAreas'.
  // 2. For each user, get their preferred language and FCM token.
  // 3. Send a notification using the appropriate translation from the subcollection.
  
  // Example: Send a general notification in English for now.
  const topic = "all_users"; 
  const message = {
    notification: {
      title: `🚨 ${alertData.severity} Alert: ${title}`,
      body: description,
    },
    topic: topic,
  };

  try {
    const response = await messaging.send(message);
    logger.log("Successfully sent general notification:", response);
  } catch (error) {
    logger.error("Error sending general notification:", error);
  }
});
