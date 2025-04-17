const AsyncStorage =
  require('@react-native-async-storage/async-storage').default;
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} = require('firebase/auth');
const {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
} = require('firebase/firestore');
const { getStorage } = require('firebase/storage');
import {
  REACT_APP_API_KEY,
  REACT_APP_AUTH_DOMAIN,
  REACT_APP_PROJECT_ID,
  REACT_APP_STORAGE_BUCKET,
  REACT_APP_MESSAGING_SENDER_ID,
  REACT_APP_APP_ID,
  REACT_APP_MEASUREMENT_ID,
  ENVIRONMENT,
} from '@env';

const firebaseConfig = {
  apiKey: REACT_APP_API_KEY,
  authDomain: REACT_APP_AUTH_DOMAIN,
  projectId: REACT_APP_PROJECT_ID,
  storageBucket: REACT_APP_STORAGE_BUCKET,
  messagingSenderId: REACT_APP_MESSAGING_SENDER_ID,
  appId: REACT_APP_APP_ID,
  measurementId: REACT_APP_MEASUREMENT_ID,
};

console.log(`Using ${ENVIRONMENT} environment for Firebase configuration`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with environment-specific settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
  // Only use SSL in production
  ...(ENVIRONMENT === 'production' && {
    ssl: true,
    host: 'firestore.googleapis.com',
  }),
});

// Connect to Firestore emulator in development
if (ENVIRONMENT === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('Connected to Firestore emulator');
}

const storage = getStorage(app);

module.exports = { app, auth, db, storage };
