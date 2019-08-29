require('dotenv').config();

// express setup
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const expressPort = 3001;
app.use(bodyParser.json());

const fs = require('fs');

// was going to use json-server as a placeholder db, but maybe don't need it
const jsonServer = require('json-server');
app.use('/db', jsonServer.router('db.json'));

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

//opentok
const OpenTok = require('opentok');
const opentok = new OpenTok(
    process.env.OPENTOK_APIKEY,
    process.env.OPENTOK_APISECRET
);

let opentokSession;
opentok.createSession((err, session) => {
    if (err) {
        console.log('error creating opentok session:', err);
    } else {
        // really we want to store the session id in a db, but putting it in memory will do for a placeholder
        opentokSession = session;

        /* writing to a file in lieu of writing to a db...but maybe not needed right now
        * since we have the session in memory
        fs.writeFile(
            'opentok.json',
            `{"sessionId": \"${session.sessionId}\"}`,
            err => {
                if (err) {
                    console.log(
                        'error on saving opentok session id to opentok.json',
                        err
                    );
                } else {
                    console.log(
                        `created opentok session and got id ${session.sessionId}`
                    );
                }
            }
        );*/
    }
});

app.get('/opentokToken', async (req, res) => {
    const token = await opentokSession.generateToken({
        expireTime: new Date().getTime() / 1000 + 7 * 24 * 60 * 60, // in one week
    });
    res.send(token);
});

app.get('/opentokSessionId', async (req, res) => {
    res.send(opentokSession.sessionId);
});

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

app.listen(expressPort, () => {
    console.log(`express app listening on port ${expressPort}!`);
});
