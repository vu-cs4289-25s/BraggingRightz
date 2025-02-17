# Bragging Rightz

This is a betting app where friends can make personalized bets with each other and interact via reactions, chat, and leaderboad features.

<center><img src="assets/images/illustration.png"/></center>

## Local development

### To run locally

1. Clone repo and go into directory
2. Install dependencies

   `npm install`

3. Run application on Expo Go

   `npx expo start`

### To connect to your own firebase project

1. Go to https://console.firebase.google.com/

2. Create an account if you don't already have one

3. Create a new project (don't need to select google analytics)

4. Go into your new Firebase Project home page

5. Set up Firestore database

   - Click on **Build** on the left side of screen
   - Select **Firestore database**
   - Click on the Firestore Database under Project Shortcuts
   - Select **create database**
   - Select **start in test mode**
   - Then click **create**

6. Set up authentication

   - Click on **Build** on the left side of screen
   - Click **Authentication**
   - Then, **Get Started**
   - Click **Email/Password** under native providers
   - Enable the first option (email/password)

7. Set up config locally

   - Go to **Project Settings** by clicking the gear icon in the top left
   - Select Project Settings
   - Scroll to the bottom and click on the **</>** icon under the "your apps" section
   - Add a name, then click **register app**
   - Copy the **firebaseConfig** object
   - Go to your src/firebase/config.js file and replace the existing firebaseConfig object with the new one you just copied

8. To run the project

   - `npx expo start`
   - Open app on Expo Go
   - Try registering as a new user
   - In you firebase project, go into **Firestore database** on left side of screen
   - Should be able to see new user information

9. Set up index
   - When you try to add entities in the Home screen, you will get an error
     "[FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/bragging-rightz-local/firestore/indexes?create_composite=ClZwcm9qZWN0cy9icmFnZ2luZy1yaWdodHotbG9jYWwvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2VudGl0aWVzL2luZGV4ZXMvXxABGgwKCGF1dGhvcklEEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg]"
   - Click on the url in the error message you got
   - An index will pop up, all you need to do is click **save**

### Errors & respective solutions

#### Fix `npm install` error

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
- Migrate to eas builds (for development then produciton)
