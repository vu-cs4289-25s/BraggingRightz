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

// Put your personal firebase config here
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { app, auth, db, storage };
