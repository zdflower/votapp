'use strict';

var VoteHandler = require(process.cwd() + '/app/controllers/voteHandler.server.js');

module.exports = function (app, db) {

  //load view engine
  app.set('views', process.cwd() + '/views');
  app.set('view engine', 'pug');
  
	var voteHandler = new VoteHandler(db);

	app.route('/').get(function (req, res) {
		res.render('index', {title: 'Encuestas', encuestas: []});
	});
  
  app.route('/usuarios').get(function(req, res) {
    res.render('usuarios', {title: 'Usuarios', usuarios: []});
  });
  
  app.route('/login')
    .get(function(req, res) {
      res.render('login', {title: 'Log in'});
  })
    .post(function (req, res) {
      Usuario.findOne({ id: req.body.id}, function (err, usuario) {
			if (err) { throw err;}
			res.render('usuario', {usuario: usuario});
		});
  });

	app.route('/api/clicks1')
						.get(voteHandler.getClicks)
		        .post(voteHandler.addClickOp1)
						.delete(voteHandler.resetClicks);

app.route('/api/clicks2')
              .get(voteHandler.getClicks)
              .post(voteHandler.addClickOp2);
  
	app.route('/votaEncuesta').get(function (req, res) {
		res.sendFile(process.cwd() + '/public/votaEncuesta.html');
	});

};