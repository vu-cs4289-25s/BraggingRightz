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

const firebaseConfig = {
  apiKey: 'AIzaSyBE3YhVpe2354Ie2nlPNQjIYc8XepMRTXI',
  authDomain: 'bragging-rightz-local.firebaseapp.com',
  projectId: 'bragging-rightz-local',
  storageBucket: 'bragging-rightz-local.firebasestorage.app',
  messagingSenderId: '855992163704',
  appId: '1:855992163704:web:b781bedd655d79882cfc8d',
  measurementId: 'G-LDT9KQ6TDY',
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
