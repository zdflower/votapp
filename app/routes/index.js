'use strict';

var VoteHandler = require(process.cwd() + '/app/controllers/voteHandler.server.js');

module.exports = function (app, db) {

	var voteHandler = new VoteHandler(db);

	app.route('/').get(function (req, res) {
		res.sendFile(process.cwd() + '/public/index.html');
	});

	app.route('/api/clicks')
						.get(voteHandler.getClicks)
						.post(voteHandler.addClick)
						.delete(voteHandler.resetClicks);

	app.route('/votaEncuesta').get(function (req, res) {
		res.sendFile(process.cwd() + '/public/votaEncuesta.html');
	});

};