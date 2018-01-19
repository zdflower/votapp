'use strict';

let mongoose = require('mongoose');

var Schema = mongoose.Schema;

//tendría que encriptar de alguna manera el password
let UsuarioSchema = mongoose.Schema({
      local : { username: String, password: String },
      github : {
        id: String,
        displayName: String,
        username: String
      }
     });

UsuarioSchema.virtual('url').get(function(){
  return '/' + this.local.username;
})

module.exports = mongoose.model('Usuario', UsuarioSchema);
