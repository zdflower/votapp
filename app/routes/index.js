'use strict';

var VoteHandler = require(process.cwd() + '/app/controllers/voteHandler.server.js');

module.exports = function (app, db) {

	var voteHandler = new VoteHandler(db);

	app.route('/').get(function (req, res) {
		res.sendFile(process.cwd() + '/public/index.html');
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