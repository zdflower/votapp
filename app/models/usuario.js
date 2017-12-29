'use strict';

let mongoose = require('mongoose');
let Encuesta = require('./encuesta.js');

let Usuario = mongoose.Schema({
    	id: {
    		type: String,
    		required: true
    	},
    	encuestasCreadas: [ {pregunta : { type: String} }],
      encuestasVotadas: [ {pregunta : { type: String} }]
    });

module.exports = mongoose.model('Usuario', Usuario);
