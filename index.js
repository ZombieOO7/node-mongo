const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { App, Database } = require('./src/modules/initializators/index');
const routes = require('./routes/index');
const cors = require("cors");
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static(__dirname + "/public"));
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '100mb'
}))
app.use(bodyParser.json({
    limit: '100mb'
}))
app.use(cookieParser());
app.use(session({
    secret: 'levaApp',
    saveUninitialized: false,
    resave: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images', express.static('images'));
app.use('/public/keys', express.static('keys'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/src/v1/views/html/'));

app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});
const corsOptions = {
    origin: "*",
    credentials: true,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Credentials", true);
    console.log("Req file", req)
    next();
});

// error handler
app.use((err, req, res, next) => {
    const multer = require('multer')
    if (err instanceof multer.MulterError) {
        console.log('err ===>', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            err.message = err.field + ' file size is too large.'
        }
        res.statusCode = 400;
        console.log(res.statusCode);
        err.status = 400;
    }
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    // res.render('error');
    res.json({
        message: err.message,
        status: false,
        code: res.statusCode
    });
});


const database = new Database();
const server = new App({
    app,
    database,
});
const isSSL = process.env.IS_SSL == 'true' ? true : false;
server.run({
    host: process.env.HOST,
    port: process.env.PORT,
    isSSL: isSSL,
    allowedSync: false
}).catch(err => {
    console.error(err);
});

module.exports = app;