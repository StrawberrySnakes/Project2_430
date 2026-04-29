// app.js - this is the main entry point for our application
require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').RedisStore;
const redis = require('redis');

const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost/LRDCArchive';
mongoose.connect(dbURI).catch((err) => {
    if(err) {
        console.log('Could not connect to database');
        throw err;
    }
});

const redisClient = redis.createClient({
    url: process.env.REDISCLOUD_URL,
});

redisClient.on('err', err => console.log('Redis Client Error', err));

redisClient.connect().then(() => {
    const app = express();

    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'img-src':   ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
            'media-src': ["'self'", 'blob:', 'https://res.cloudinary.com'],
            },
        },
    }));
    app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted`)));
    app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
    app.use(compression());
    app.use(express.urlencoded({extended: true}));
    app.use(express.json());

    app.use(session({
        key: 'sessionid',
        store: new RedisStore({
            client: redisClient,
        }),
        secret: process.env.SESSION_SECRET || 'lrdcArchiveSecret',
        resave: false,
        saveUninitialized: false,
    }));

    app.engine('handlebars', expressHandlebars.engine({ defaultLayout: ''}));
    app.set('view engine', 'handlebars');
    app.set('views', `${__dirname}/../views`);

    router(app);

    app.listen(port, (err) => {
        if(err) { throw err }
        console.log(`Listening on port ${port}`);
    });
});