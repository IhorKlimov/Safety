const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const jwt = require('jsonwebtoken');
var request = require("request");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const clientSecret = "DGZzYm0Q6FjKX7SSgg259oaktZ69xfMcH_b2_s1nFbqjz4l8S0IJUgoK4fsly0sB";
const clientId = "XKJpftAxA1wf4rd41rTlcCYlfKj0I3uS";
const audience = 'https://dev-6kko8irjnrz18yn5.us.auth0.com/api/v2/';

const SESSION_KEY = 'Authorization';

class Session {
    #sessions = {}

    constructor() {
        try {
            this.#sessions = fs.readFileSync('./sessions.json', 'utf8');
            this.#sessions = JSON.parse(this.#sessions.trim());

            console.log(this.#sessions);
        } catch (e) {
            this.#sessions = {};
        }
    }

    #storeSessions() {
        fs.writeFileSync('./sessions.json', JSON.stringify(this.#sessions), 'utf-8');
    }

    set(key, value) {
        if (!value) {
            value = {};
        }
        this.#sessions[key] = value;
        this.#storeSessions();
    }

    get(key) {
        return this.#sessions[key];
    }

    init(id) {
        const sessionId = id ? id : jwt.sign({ id: uuid.v4() }, 'shhhhh');
        this.set(sessionId);

        return sessionId;
    }

    destroy(req, res) {
        const sessionId = req.sessionId;
        delete this.#sessions[sessionId];
        this.#storeSessions();
    }
}

const sessions = new Session();

app.use((req, res, next) => {
    let currentSession = {};
    let sessionId = req.get(SESSION_KEY);

    if (sessionId) {
        currentSession = sessions.get(sessionId);
        if (!currentSession) {
            currentSession = {};
            sessionId = sessions.init(sessionId);
        }
    } else {
        sessionId = sessions.init(sessionId);
    }

    req.session = currentSession;
    req.sessionId = sessionId;

    onFinished(req, () => {
        const currentSession = req.session;
        const sessionId = req.sessionId;
        sessions.set(sessionId, currentSession);
    });

    next();
});

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

app.get('/', (req, res) => {
    if (req.session.username) {
        return res.json({
            username: req.session.username,
            logout: 'http://localhost:3000/logout'
        })
    }
    res.sendFile(path.join(__dirname + '/index.html'));
})

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
