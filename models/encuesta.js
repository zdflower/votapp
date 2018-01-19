'use strict';

let mongoose = require('mongoose');

var Schema = mongoose.Schema;

let EncuestaSchema = mongoose.Schema({
    pregunta : { type: String,required: true, min: 2, max: 100 },
    opciones : [ {
      op: {type: String, required: true, min: 2, max: 100  },
      votos: {type: Number }
    }],
    creador : {type: String, required: true, min: 2, max: 100}//{type: Schema.ObjectId, ref: 'Usuario', required: true}
});

//el nombre de usuario debe ser único.

EncuestaSchema.virtual('url').get(function(){
  return '/' + this.creador + '/' + this.pregunta;
});

module.exports = mongoose.model('Encuesta', EncuestaSchema);