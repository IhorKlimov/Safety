const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
var request = require("request");
const dotenv = require('dotenv');
const http = require('http');
const logger = require('morgan');
const { auth } = require('express-openid-connect');

dotenv.load();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const config = {
    authRequired: false,
    auth0Logout: true
};
const port = process.env.PORT || 3000;
if (!config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
    config.baseURL = `http://localhost:${port}`;
}


app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function (req, res, next) {
    res.locals.user = req.oidc.user;
    next();
});


app.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Auth0 Webapp sample Nodejs',
        isAuthenticated: req.oidc.isAuthenticated()
    });
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: process.env.NODE_ENV !== 'production' ? err : {}
    });
});


const clientSecret = "DGZzYm0Q6FjKX7SSgg259oaktZ69xfMcH_b2_s1nFbqjz4l8S0IJUgoK4fsly0sB";
const clientId = "XKJpftAxA1wf4rd41rTlcCYlfKj0I3uS";
const audience = 'https://dev-6kko8irjnrz18yn5.us.auth0.com/api/v2/';

app.get('/getToken', (req, res) => {
    var options = {
        method: 'POST',
        url: 'https://dev-6kko8irjnrz18yn5.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form:
        {
            grant_type: 'password',
            username: 'iklimov2@gmail.com',
            password: 'M23n2gm23t(m1',
            audience: audience,
            scope: 'offline_access',
            client_id: clientId,
            client_secret: clientSecret
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        res.send(body);
    });
});

app.get('/refreshToken', (req, res) => {
    var options = {
        method: 'POST',
        url: 'https://dev-6kko8irjnrz18yn5.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form:
        {
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: '9FOCx17w2H-Pxxtien-G4N13vyHuP_dPSzte21EjqQAq1'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        res.send(body)
    });
});

app.get('/logout', (req, res) => {
    sessions.destroy(req, res);
    res.redirect('/');
});

const users = [
    {
        login: 'Login',
        password: 'Password',
        username: 'Username',
    },
    {
        login: 'iklimov2@gmail.com',
        password: 'Password1',
        username: 'Username1',
    }
]

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    var options = {
        method: 'POST',
        url: 'https://dev-6kko8irjnrz18yn5.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form:
        {
            grant_type: 'password',
            username: login,
            password: password,
            audience: audience,
            scope: 'offline_access',
            client_id: clientId,
            client_secret: clientSecret
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        body = JSON.parse(body);
        token = body.access_token;
        console.log(token);
        if (body.error) {
            res.status(401).send();
            return false;
        }

        const user = users.find((user) => {
            if (user.login == login) {
                return true;
            }
            return false
        });

        if (user) {
            sessions.init(token);
            req.session = sessions.get(token);
            req.session.username = user.username;
            req.session.login = user.login;

            res.json({ token: token });
        }

        res.status(401).send();
    });
});

http.createServer(app)
    .listen(port, () => {
        console.log(`Listening on ${config.baseURL}`);
    });