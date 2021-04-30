import Firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const config = {    
  apiKey: "AIzaSyCKkM6GX92ryGiiXw3oIN-hUOgZQCoGZ50",
  authDomain: "composer-2edb6.firebaseapp.com",
  projectId: "composer-2edb6",
  storageBucket: "composer-2edb6.appspot.com",
  messagingSenderId: "943130194461",
  appId: "1:943130194461:web:1288d2513555baab230cf4",
  measurementId: "G-60KD6S81SN"
};

const firebase = Firebase.initializeApp(config);
const { FieldValue } = Firebase.firestore;


export default {firebase, FieldValue};