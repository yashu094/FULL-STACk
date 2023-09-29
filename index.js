const express = require('express');
const app = express();
const port = 3000;
const request = require("request");
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./key.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render("begin.ejs");
});
app.get('/main', (req, res) => {
  res.render("main");
});

app.get('/signin', (req, res) => {
  res.render('signin');
});

app.post('/signinsubmit', async (req, res) => {
  const email_id = req.body.email_id;
  const pass = req.body.pass; // Use req.body to access form data

  try {
    // Query Firestore to find a user with the provided email
    const userRef = db.collection('users').where('email', '==', email_id);
    const snapshot = await userRef.get();

    if (snapshot.empty) {
      // No user found with the provided email
      res.send('Login failed: User not found');
      return;
    }

    // Assuming there's only one user with the provided email
    const userData = snapshot.docs[0].data();
    const hashedPassword = userData.pass;

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(pass, hashedPassword);

    if (passwordMatch) {
      // Passwords match, render the main.ejs file
      res.render('weather');
    } else {
      // Passwords do not match
      res.send('Login failed: Incorrect password');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error: ' + error.message);
  }
});
app.get('/signup', (req, res) => {
  res.render('signup');
});
app.post('/signupsubmit', async (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email_id = req.body.email_id;
  const pass = req.body.pass; // Use req.body to access form data

  try {
    const saltRounds = 10; // Adjust the number of rounds as needed
    const hashedPassword = await bcrypt.hash(pass, saltRounds);

    await db.collection('users').add({
      name: first_name + ' ' + last_name,
      email: email_id,
      pass: hashedPassword,
    });

    // Redirect the user to the signin page after successful signup
    res.redirect('/signin');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

app.get('/weathersubmit',(req,res) =>{
  const location = req.query.location;
  request(
    'http://api.weatherapi.com/v1/current.json?key=6e0aa428b81c4fe1bee122706232809&q='+location+'&aqi=no', function (error, response, body){
      if("error" in JSON.parse(body))
      {
        if((JSON.parse(body).error.code.toString()).length > 0)
        {
          res.render("weather");
        }
      }
      else
      {
        const region = JSON.parse(body).location.region;
        const country= JSON.parse(body).location.country;
        const loctime = JSON.parse(body).location.localtime;
        const temp_c = JSON.parse(body).current.temp_c;
        const temp_f = JSON.parse(body).current.temp_f;
        const icon = JSON.parse(body).current.condition.icon;
        const wind_kph = JSON.parse(body).current.wind_kph;
        const humi = JSON.parse(body).current.humidity;
        const feels_c = JSON.parse(body).current.feelslike_c;
        const feels_f = JSON.parse(body).current.feelslike_f;
        const condition = JSON.parse(body).current.condition.text;
        res.render('location',{location:location,region:region,country:country,condition:condition,loctime:loctime,temp_c:temp_c,temp_f:temp_f,icon:icon,wind_kph:wind_kph,feels_c:feels_c,feels_f:feels_f,humi:humi});
      } 
    }
    );
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
