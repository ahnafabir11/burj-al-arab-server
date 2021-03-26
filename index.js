const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin =  require('firebase-admin');
require('dotenv').config()


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.get('/', (req, res) => {
  res.send('Hello World!')
})


const serviceAccount = require("./config/book-burj-al-arab-firebase-adminsdk-stimj-5ad5af13fc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://book-burj-al-arab.firebaseio.com'
});

const port = process.env.DB_HOST;
const mongoUser = process.env.DB_USER;
const mongoPass = process.env.DB_PASS;
const uri = `mongodb+srv://${mongoUser}:${mongoPass}@cluster0.swwce.mongodb.net/BurjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingcol = client.db("BurjAlArab").collection("bookings");
  
  app.post('/addBooking', (req, res)=> {
    const newBooking = req.body;
    bookingcol.insertOne(newBooking)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
  })

  app.get('/bookings', (req, res)=> {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer')){
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if(tokenEmail === queryEmail){
            bookingcol.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents)
              })
          } else {
            res.status(401).send('Unauthorized Access');
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      res.status(401).send('Unauthorized Access');
    }
  })

});



app.listen(port);