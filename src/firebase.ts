// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

//JS firebase
//const firebaseConfig = {
 // apiKey: "AIzaSyAGll87M9w54GzXXskNnEyxfkaMmxXiQ9o",
 // authDomain: "grit-scrum.firebaseapp.com",
 //  databaseURL: "https://grit-scrum-default-rtdb.europe-west1.firebasedatabase.app",
  // projectId: "grit-scrum",
 // storageBucket: "grit-scrum.firebasestorage.app",
  // messagingSenderId: "452280630222",
  // appId: "1:452280630222:web:257bb0352c438d04e4899f"
// };

//Joanna Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqOzxAMGj2Uuiv60IYd0WP6Pju9uhnH-I",
  authDomain: "be26-js2-slutprojekt-grupp3.firebaseapp.com",
  databaseURL: "https://be26-js2-slutprojekt-grupp3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "be26-js2-slutprojekt-grupp3",
  storageBucket: "be26-js2-slutprojekt-grupp3.firebasestorage.app",
  messagingSenderId: "1009949352941",
  appId: "1:1009949352941:web:339422539d1d2aeae6bde4",
  measurementId: "G-VQRKXX191N"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
