'use strict';

let mongoose = require('mongoose');

let encuestaSchema = mongoose.Schema({
    pregunta : {
      type: String,
      required: true
    },
    opciones : [ {
      op: {type: String },
      votos: {type: Number }
    }],
    creador : {type: String}
});

module.exports = mongoose.model('encuestaSchema', encuestaSchema);

/*
Si quiero anidar schemas, no tengo que exportar el modelo en los schemas que van anidados si no sólo en el que están anidados.
Además tengo que usar la propiedad ref.
Leer más sobre eso.
*/
