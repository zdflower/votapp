'use strict';

const express = require('express');
const path = require('path');
const bp = require('body-parser');
const mongoose = require('mongoose');

const routes = require('./routes/index');
const session = require('express-session');
const validator = require('express-validator');
const flash = require('connect-flash');
const passport = require('passport');

const morgan = require('morgan');


//inicializar el módulo dotenv, para poder usar las variables de entorno, ANTES de usarlas
require('dotenv').load();

//esto lo pedía porque mpromise estaba deprecated ¿?
mongoose.Promise = global.Promise;

//mongodb://localhost/votapp
var mdb = process.env.MONGO_URI;
var promise = mongoose.connect(mdb, {
	useMongoClient: true
});

//mongoose.connect(mdb, {useMongoClient: true});

let db = mongoose.connection;

promise.then(function(db){
	console.log('Connected to mongodb');
});



//Esta línea la copié del tutorial https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website
//Después de que obtuviera el error:
/*
$ node app
Server started on port 8080...
(node:9479) UnhandledPromiseRejectionWarning: MongoError: failed to connect to server [localhost:27017] on first connect [MongoError: connect ECONNREFUSED 127.0.0.1:27017]
    at Pool.<anonymous> (/home/flor/fcc/VOTAPP/votapp-pug/node_modules/mongodb-core/lib/topologies/server.js:336:35)
    at Pool.emit (events.js:159:13)
    at Connection.<anonymous> (/home/flor/fcc/VOTAPP/votapp-pug/node_modules/mongodb-core/lib/connection/pool.js:280:12)
    at Object.onceWrapper (events.js:254:19)
    at Connection.emit (events.js:159:13)
    at Socket.<anonymous> (/home/flor/fcc/VOTAPP/votapp-pug/node_modules/mongodb-core/lib/connection/connection.js:187:49)
    at Object.onceWrapper (events.js:254:19)
    at Socket.emit (events.js:159:13)
    at emitErrorNT (internal/streams/destroy.js:64:8)
    at process._tickCallback (internal/process/next_tick.js:152:19)
(node:9479) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
(node:9479) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

*/
//db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('error', function(err) {throw err;});



//init app
const app = express();


//logger
app.use(morgan('dev'));

//load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//body parser middleware
app.use(bp.urlencoded({extended: false}));
app.use(bp.json());

//public folder
app.use(express.static(path.join(__dirname, 'public')));


//configurar passport
require('./config/passportLocal')(passport);

//Configurar session
//no entiendo lo de secret: ...
app.use(session({
	secret: 'secret_apptov',
	resave: false,
	saveUninitialized: true
}));

// Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Validator middleware


app.use(passport.initialize());
app.use(passport.session());


routes(app, passport);

//error handling para not found
//Si llegás acá es porque no se pudo encontrar una ruta que satisficiera el pedido, por eso el estatus del error va a ser 404, not found.
//Ver Handling Errors & Improving the Project Setup | Creating a REST API with Node.js https://www.youtube.com/watch?v=UVAMha41dwo
//Creo un error para que suceda si llegamos acá.
app.use(function(req, res, next){
  const error = new Error('No encontrado');
  error.status = 404;
  next(error);
});

//manejador de todo tipo de errores que  pueden suceder llegado este punto.
app.use(function(err, req, res, next){
  res.status(err.status || 500);

  //res.json({
  //  error: {
  //    message: err.message
  //  }
  //});

  res.render('error', {error: err});

});

//Start server
const port = process.env.PORT || 8080;
app.listen(port, function(){
	console.log('Server started on port ' + port + '...');
});
