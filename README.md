# React Native Firebase

This is a React Native Firebase Starter Project with login, registration, persisted login, database reads and writes. You can use this project as boilerplate for bootstrapping any new React Native app that uses Firebase as its backend.

<center><img src="https://www.instamobile.io/wp-content/uploads/2020/05/react-native-firebase.png" alt="react native firebase"/></center>

This React Native Firebase starter contains a few key features that all apps backed by Fireabase support:

* Registration with E-mail & Password
* Login with E-mail and Password
* Handling persisted login credentials
* Navigation (react-native-navigation)
* Writing to Firestore Database
* Reading from Firestore Database
* Creating Firestore indices (for performance)

## Getting Started (with Expo)

```
git clone https://github.com/instamobile/react-native-firebase.git
cd react-native-firebase
npm install
npx expo start
```

## Getting Started (without Expo)

If you prefer using React Native CLI, you'll need to eject from Expo first:

```
git clone https://github.com/instamobile/react-native-firebase.git
cd react-native-firebase
npx expo prebuild
npm install
react-native run-android // react-native run-ios
```

This React Native Firebase starter is built with Firebase Web SDK, which makes it compatible with both Expo CLI and React Native CLI.

***
# Local development

## To run locally
1. Clone repo and go into directory
2. Install dependencies

    `npm install`

3. Run application on Expo Go

    `npx expo start`

## To connect to your own firebase project
1. Go to https://console.firebase.google.com/ 

2. Create an account if you don't already have one

3. Create a new project (don't need to select google analytics)

4. Go into your new Firebase Project home page

5. Set up Firestore database
    a. Click on **Build** on the left side of screen
    b. Select **Firestore database**
    c. Click on the Firestore Database under Project Shortcuts
    d. Select **create database**
    e. Select **start in test mode**
    f. Then click **create**

6. Set up authentication
    a. Click on **Build** on the left side of screen
    b. Click **Authentication**
    c. Then, **Get Started**
    d. Click **Email/Password** under native providers
    e. Enable the first option (email/password)

7. Set up config locally
    a. Go to **Project Settings** by clicking the gear icon in the top left
    b. Select Project Settings
    c. Scroll to the bottom and click on the **</>** icon under the "your apps" section
    d. Add a name, then click **register app**
    e. Copy the **firebaseConfig** object
    f. Go to your src/firebase/config.js file and replace the existing firebaseConfig object with the new one you just copied

8. To run the project
    a. `npx expo start`
    b. Open app on Expo Go
    c. Try registering as a new user
    d. In you firebase project, go into **Firestore database** on left side of screen
    e. Should be able to see new user information

## Errors I ran into
### Fix `npm install` error
1. **Uninstall the existing version:**

    `npm uninstall react-native-screens`

2. **Install the latest version:**

    `npm install react-native-screens@latest`

3. **Try installing everything again:**

    `npm install`

### Fix "Project is incompatible" on Expo Go

https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

1. **Upgrade the Expo SDK**

    `npx expo install expo@latest`

2. **Upgrade dependencies**

    `npx expo install --fix`


## TODO:
* Fix "Console Error: The action 'NAVIGATE' with payload {...} was not handled by any navigator"
    * Occurs when trying registering new user
* Make sure entities show up on Home screen
    * Create an index???