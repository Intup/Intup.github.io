import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB8IvZfa59Qvg_wtB1k90ubdoDtPWq5BA",
  authDomain: "baseaio.firebaseapp.com",
  databaseURL: "https://baseaio.firebaseio.com",
  projectId: "baseaio",
  storageBucket: "baseaio.firebasestorage.app",
  messagingSenderId: "470723267691",
  appId: "1:470723267691:web:9ca87d8836342fc41b752e",
  measurementId: "G-W3W0KGHJLS"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);