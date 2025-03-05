const AsyncStorage =
  require('@react-native-async-storage/async-storage').default;
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');
import {
  REACT_APP_API_KEY,
  REACT_APP_AUTH_DOMAIN,
  REACT_APP_PROJECT_ID,
  REACT_APP_STORAGE_BUCKET,
  REACT_APP_MESSAGING_SENDER_ID,
  REACT_APP_APP_ID,
  REACT_APP_MEASUREMENT_ID,
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

// For debugging - remove in production
console.log('Firebase Config:', {
  apiKey: REACT_APP_API_KEY ? '***' : 'missing',
  authDomain: REACT_APP_AUTH_DOMAIN ? '***' : 'missing',
  projectId: REACT_APP_PROJECT_ID ? '***' : 'missing',
  storageBucket: REACT_APP_STORAGE_BUCKET ? '***' : 'missing',
  messagingSenderId: REACT_APP_MESSAGING_SENDER_ID ? '***' : 'missing',
  appId: REACT_APP_APP_ID ? '***' : 'missing',
  measurementId: REACT_APP_MEASUREMENT_ID ? '***' : 'missing',
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { app, auth, db, storage };
