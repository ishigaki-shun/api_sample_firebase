const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require("./etc/flutter_sample_auth.json");

//initialize
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fir-sample-12daf.firebaseio.com'
});

const DEFAULT_NUMBER = "000";

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  admin.database().ref('/messages').on('value', (snapshot, prevChildKey) => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.json(snapshot.val());
  });
});

exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = snapshot.val();
      console.log('Uppercasing', context.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return snapshot.ref.parent.child('uppercase').set(uppercase);
});

exports.getJson = functions.https.onRequest((req, res) => {
   return res.json('sample:{key:value}');
});

exports.init = functions.https.onRequest((req, res) => {
   admin.database().ref('/initializer').on('value', (snapshot, prevChildKey) => {
     res.json(snapshot.val()); 
   });
});

exports.notification = functions.https.onRequest((req, res) => {
  const original = req.query.uuid;
  admin.database().ref('/user/' + original + '/videos').on('value', (snapshot, prevChildKey) => {
    res.json(snapshot.val());
  });
});

exports.videolist = functions.https.onRequest((req, res) => {
  admin.database().ref('/videos').on('value', (snapshot, prevChildKey) => {
    res.json(snapshot.val());
  });
});

exports.samplePost = functions.https.onRequest((req, res) => {
  const number = req.body.number || DEFAULT_NUMBER;
  console.log(number);
  admin.database().ref('/sex/${number}').on('value', (snapshot, prevChildKey) => {
    res.json(snapshot.val());
  });
});

