'use strict';

let mongoose = require('mongoose');

let EncuestaSchema = mongoose.Schema({
  pregunta : { type: String, required: true, min: 2, max: 100 },
  opciones : [ {
    op: {type: String, required: true, min: 2, max: 100},
    votos: {type: Number}
  }],
  creador : {type: String, required: true, min: 2, max: 100}
});

// El nombre de usuario debe ser único.

EncuestaSchema.virtual('url').get(function(){
  return '/' + this.creador + '/' + this.pregunta;
});

EncuestaSchema.virtual('opMasVotada').get(function(){
  // Buscar la opción con más votos.
  // Va a devolver una copia de la opción o una referencia a la opción
  let opciones = this.opciones;
  let masVotada = opciones[0];
  masVotada = opciones.reduce(function(masVotada, actual){
    return (masVotada.votos < actual.votos)? actual : masVotada ;
  });
  return masVotada;
});

EncuestaSchema.virtual('totalVotos').get(function(){
  let resultado = 0;
  this.opciones.forEach(function(op){
    resultado += op.votos;
  });
  return resultado;
});

module.exports = mongoose.model('Encuesta', EncuestaSchema);
