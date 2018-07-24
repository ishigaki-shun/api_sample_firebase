const functions = require('firebase-functions');
const admin = require('firebase-admin');
const storage = require('@google-cloud/storage')({keyFilename: "./etc/serviceAccountKey.json"});
const bucket = storage.bucket('fir-sample-12daf.appspot.com');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const serviceAccount = require("./etc/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fir-sample-12daf.firebaseio.com'
});

// var config = {
//   apikey: "AIzaSyBcM1FZZNmhWF51WoV6h_lpU7I5pvIQAxs",
//   authDomain: "fir-sample-12daf.firebaseapp.com",
//   databaseURL: "https://fir-sample-12daf.firebaseio.com",
//   projectId: "fir-sample-12daf",
//   storageBucket: "fir-sample-12daf.appspot.com",
//   messagingSenderId: "1019794557290"
// };

// admin.initializeApp(config);

const DEFAULT_NUMBER = "000";
const BUCKET_FOLDER = "sample_folder/";

exports.example = functions.https.onRequest((request, response) => {
 console.log(firebase);
});
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
  const uuid = req.query.uuid;
  admin.database().ref('/users/' + uuid + '/videos').on('value', (snapshot, prevChildKey) => {
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
  console.log('/sex/' + number);
  admin.database().ref('/sex/' + number).on('value', (snapshot, prevChildKey) => {
    res.json(snapshot.val());
  });
});

exports.videoInformation = functions.https.onRequest((req, res) => {
  const userName = req.body.name || "";
  const userImage = req.body.image || "";
  const uid = req.body.uid || "";
  const filename = req.body.filename || "";
  const tryVideoId = req.body.try_video_id || "";
  const timestamp = req.body.timestamp || "";
  const file = bucket.file(BUCKET_FOLDER + filename);

  var videoUrl = "";

  file.getSignedUrl({
  action: 'read',
  expires: '03-09-2491'
  }).then(signedUrls => {
  	// signedUrls[0] contains the file's public URL
    console.log('URL: ' + signedUrls[0]);
  	videoUrl = signedUrls[0];

  	if (tryVideoId !== null && tryVideoId !== "") {
    	admin.database().ref('/videos/' + tryVideoId + "/try_users/" + uid).set({name: userName, image: userImage, video_url: videoUrl});
  	}

  	var key = admin.database().ref().push().key;
  	admin.database().ref('/videos/' + key).set({upload_user: {name: userName, image: userImage, uid: uid}, timestamp: timestamp, video_url: videoUrl});
    admin.database().ref('/users/' + key + '/videos/').set(tryVideoId).then(() => {
    	return res.status(200).send('success');
    });
  });
});

exports.register = functions.https.onRequest((req, res) => {
  const userName = req.body.name || "";
  const userImage = req.body.image || "";
  const uid = req.body.uid || "";

  return admin.database().ref('/users/' + uid).set({name: userName, image: userImage}).then((snapshot) => {
     return res.status(200).send('success');
  });
});

// TODO: 動画投稿API
exports.fileupload = functions.https.onRequest((req, res) => {
  // ↓ CORS
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.status(200).end();
    return;
  }
  // ↑ CORS
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const busboy = new Busboy({ headers: req.headers });
  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads = {};
  const allowMimeTypes = ['video/mp4'];
  var videoFileName = "";

  // This callback will be invoked for each file uploaded.
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (!allowMimeTypes.includes(mimetype.toLocaleLowerCase())) {
      console.warn('disallow mimetype: ' + mimetype);
      return;
    }
    // Note that os.tmpdir() is an in-memory file system, so should
    // only be used for files small enough to fit in memory.
    const tmpdir = os.tmpdir();
    const filepath = path.join(tmpdir, filename);
    videoFileName = filename;
    file.pipe(fs.createWriteStream(filepath));

    file.on('end', () => {
      console.log('upload file: ' + filepath + ' metadata: ' + mimetype);
      uploads[fieldname] = { filepath, mimetype };
      bucket.upload(filepath, { destination: `sample_folder/${path.parse(filepath).base}`, metadata: { contentType: mimetype } })
        .then(() => {
          console.log('file upload success: ' + filepath);
          return new Promise((resolve, reject) => {
            fs.unlink(filepath, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        })
        .catch(err => {
          console.error(err);
        });
    });
  });

  // This callback will be invoked after all uploaded files are saved.
  busboy.on('finish', () => {
    if (Object.keys(uploads).length === 0) {
      res.status(200).send('success: 0 file upload');
      return;
    }

    res.status(200).send(JSON.stringify(uploads));
  });

  // The raw bytes of the upload will be in req.rawBody. Send it to
  // busboy, and get a callback when it's finished.
  busboy.end(req.rawBody);
});

exports.getDownloadURL = functions.https.onRequest((req, res) => {
  const filename = req.query.filename;

  const file = bucket.file(BUCKET_FOLDER + filename);
  return file.getSignedUrl({
  action: 'read',
  expires: '03-09-2491'
}).then(signedUrls => {
  // signedUrls[0] contains the file's public URL
    console.log('URL: ' + signedUrls[0]);
  	return res.json(signedUrls[0]);
  });
});