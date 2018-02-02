const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Usuario = require('../models/usuario.js');
// const database = process.env.MONGO_URI;

const bcrypt = require('bcryptjs');

module.exports = function (passport) {
  passport.use(new LocalStrategy(function(username, password, done) {
    Usuario.findOne({ 'local.username': username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Nombre de usuario incorrecto.' });
      }
      if (!checkPassword(password, user.local.password)) {
        return done(null, false, { message: 'Password incorrecto.' });
      }
      return done(null, user);
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    Usuario.findById(id, function(err, user) {
      done(err, user);
    });
  });
}

function checkPassword(pass, upass){
  console.log("Checking password");
  // console.log(upass + ' = ' + pass + '? ' + upass === pass);
  // console.log('upass: ' + upass);
  // console.log('pass: ' + pass);
  return bcrypt.compareSync(pass, upass); // upass === pass;
}
