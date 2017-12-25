'use strict';

var express = require('express'), 
	routes = require('./app/routes/index.js'),
	mongo = require('mongodb').MongoClient;

const bp = require('body-parser');

var app = express();

mongo.connect('mongodb://localhost:27017/vota', function(err, db) {
	if (err) {
		throw new Error('Database failed to connect!');
	} else {
		console.log('MongoDB successfully connected on port 27017.');
	}

//body parser middleware
app.use(bp.urlencoded({extended: false}));
app.use(bp.json());

	app.use('/public', express.static(process.cwd() + '/public'));
	app.use('/controllers', express.static(process.cwd() +'/app/controllers'));

  
  
	routes(app, db);

	app.listen(4000, function () {
		console.log('Listening on port 4000...');
	});

});

