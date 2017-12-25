'use strict';

let mongoose = require('mongoose');
let Encuesta = require('./encuesta.js');

let Usuario = mongoose.Schema({
    	id: {
    		type: String,
    		required: true
    	},
      // me gustaría utilizar encuesta como esquema anidado, pero no sé cómo
    	encuestasCreadas: [ {
          pregunta : { type: String, required: true },
          opciones : [ { op: { type: String }, votos: {type: Number}
          }]
      }],
      encuestasVotadas: [ {
          pregunta : { type: String, required: true },
          opciones : [ { op: { type: String }, votos: {type: Number}
          }]
      }]
    });

module.exports = mongoose.model('Usuario', Usuario);
