import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

// Initialize Firebase, copied from cloud console
const firebaseConfig = {
  apiKey: "AIzaSyCMsFreESs58-hRxTtiqQrIcimh4i1wbsM",
  authDomain: "postwoman-api.firebaseapp.com",
  databaseURL: "https://postwoman-api.firebaseio.com",
  projectId: "postwoman-api",
  storageBucket: "postwoman-api.appspot.com",
  messagingSenderId: "421993993223",
  appId: "1:421993993223:web:ec0baa8ee8c02ffa1fc6a2",
  measurementId: "G-ERJ6025CEB"
};
firebase.initializeApp(firebaseConfig);

// a reference to the users collection
const usersCollection = firebase.firestore().collection("users");

// the shared state object that any vue component
// can get access to
export const fb = {
  currentUser: {},
  currentFeeds: [],
  currentSettings: [],
  currentHistory: [],
  writeFeeds: async (message, label) => {
    const dt = {
      createdOn: new Date(),
      author: fb.currentUser.uid,
      author_name: fb.currentUser.displayName,
      author_image: fb.currentUser.photoURL,
      message,
      label
    };
    try {
      return usersCollection
        .doc(fb.currentUser.uid)
        .collection("feeds")
        .add(dt);
    } catch (e) {
      return console.error("error inserting", dt, e);
    }
  },
  deleteFeed: id => {
    usersCollection
      .doc(fb.currentUser.uid)
      .collection("feeds")
      .doc(id)
      .delete()
      .catch(e => console.error("error deleting", id, e));
  },
  writeSettings: async (setting, value) => {
    const st = {
      updatedOn: new Date(),
      author: fb.currentUser.uid,
      author_name: fb.currentUser.displayName,
      author_image: fb.currentUser.photoURL,
      name: setting,
      value
    };
    try {
      return usersCollection
        .doc(fb.currentUser.uid)
        .collection("settings")
        .doc(setting)
        .set(st);
    } catch (e) {
      return console.error("error updating", st, e);
    }
  },
  writeHistory: async entry => {
    const hs = entry;
    try {
      return usersCollection
        .doc(fb.currentUser.uid)
        .collection("history")
        .add(hs);
    } catch (e) {
      return console.error("error inserting", hs, e);
    }
  },
  deleteHistory: entry => {
    usersCollection
      .doc(fb.currentUser.uid)
      .collection("history")
      .doc(entry.id)
      .delete()
      .catch(e => console.error("error deleting", entry, e));
  },
  clearHistory: () => {
    usersCollection
      .doc(fb.currentUser.uid)
      .collection("history")
      .get()
      .then(({ docs }) => {
        docs.forEach(e => fb.deleteHistory(e));
      });
  },
  toggleStar: (entry, value) => {
    usersCollection
      .doc(fb.currentUser.uid)
      .collection("history")
      .doc(entry.id)
      .update({ star: value })
      .catch(e => console.error("error deleting", entry, e));
  }
};

// When a user logs in or out, save that in the store
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    fb.currentUser = user;
    fb.currentUser.providerData.forEach(profile => {
      let us = {
        updatedOn: new Date(),
        provider: profile.providerId,
        name: profile.displayName,
        email: profile.email,
        photoUrl: profile.photoURL,
        uid: profile.uid
      };
      try {
        usersCollection.doc(fb.currentUser.uid).set(us);
      } catch (e) {
        console.error("error updating", us, e);
      }
    });

    usersCollection
      .doc(fb.currentUser.uid)
      .collection("feeds")
      .orderBy("createdOn", "desc")
      .onSnapshot(feedsRef => {
        const feeds = [];
        feedsRef.forEach(doc => {
          const feed = doc.data();
          feed.id = doc.id;
          feeds.push(feed);
        });
        fb.currentFeeds = feeds;
      });

    usersCollection
      .doc(fb.currentUser.uid)
      .collection("settings")
      .onSnapshot(settingsRef => {
        const settings = [];
        settingsRef.forEach(doc => {
          const setting = doc.data();
          setting.id = doc.id;
          settings.push(setting);
        });
        fb.currentSettings = settings;
      });

    usersCollection
      .doc(fb.currentUser.uid)
      .collection("history")
      .onSnapshot(historyRef => {
        const history = [];
        historyRef.forEach(doc => {
          const entry = doc.data();
          entry.id = doc.id;
          history.push(entry);
        });
        fb.currentHistory = history;
      });
  } else {
    fb.currentUser = null;
  }
});
