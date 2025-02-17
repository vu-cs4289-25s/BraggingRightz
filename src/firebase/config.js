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
  apiKey: 'AIzaSyCSixS0TPhJ8AplsJG-YCjK7pkPzTK8iIg',
  authDomain: 'bragging-rightz.firebaseapp.com',
  projectId: 'bragging-rightz',
  storageBucket: 'bragging-rightz.firebasestorage.app',
  messagingSenderId: '983478005100',
  appId: '1:983478005100:web:53d6b5a42a6c92c4795749',
  measurementId: 'G-E1C4ELL8D0',
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
