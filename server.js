require('dotenv').config();

// express setup
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3001;
app.use(bodyParser.json());

//nexmo client
const Nexmo = require('nexmo');
const nexmo = new Nexmo(
    {
        apiKey: process.env.API_KEY,
        apiSecret: process.env.API_SECRET,
        applicationId: process.env.APP_ID,
        privateKey: __dirname + process.env.PRIVATE_KEY,
    },
    { debug: true }
);

// routes for nexmo user creation
//for JWT stuff see https://developer.nexmo.com/conversation/guides/jwt-acl
app.post('/getJWT', (req, res) => {
    console.log('post to /getJWT with req.body ' + JSON.stringify(req.body));
    const jwt = nexmo.generateJwt({
        application_id: process.env.APP_ID,
        sub: req.body.name,
        exp: Math.round(new Date().getTime() / 1000) + 60 * 60 * 24 * 7,
        acl: {
            paths: {
                '/*/users/**': {},
                '/*/conversations/**': {},
                '/*/sessions/**': {},
                '/*/applications/**': {},
            },
        },
    });
    console.log(
        'in post to /getJWT, nexmo.generateJwt() returned: ' +
            JSON.stringify(jwt)
    );
    res.send({ jwt: jwt });
});

app.post('/createUser', (req, res) => {
    console.log(
        'post to /createUser with req.body ' + JSON.stringify(req.body)
    );
    nexmo.users.create(
        {
            name: req.body.name,
            display_name: req.body.display_name || req.body.name,
        },
        (err, result) => {
            if (err) {
                console.log('error in nexmo.users.create(): ' + err);
                res.sendStatus(500);
            } else {
                console.log(
                    'in call to nexmo.users.create(), result = : ' +
                        JSON.stringify(result)
                );
                res.send({ id: result.id });
            }
        }
    );
});

app.listen(port, () => {
    console.log(`express app listening on port ${port}!`);
});
