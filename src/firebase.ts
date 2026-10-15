// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyAGll87M9w54GzXXskNnEyxfkaMmxXiQ9o",
  authDomain: "grit-scrum.firebaseapp.com",
  databaseURL: "https://grit-scrum-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grit-scrum",
  storageBucket: "grit-scrum.firebasestorage.app",
  messagingSenderId: "452280630222",
  appId: "1:452280630222:web:257bb0352c438d04e4899f"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
