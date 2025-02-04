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