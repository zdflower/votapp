var async = require('async');
const Usuario = require('../models/usuario.js');
const Encuesta = require('../models/encuesta.js');
const passport = require('passport');
const bcrypt = require('bcryptjs');

exports.obtenerUsuarios = function (req, res, next){
  Usuario.find({}, function(err, usuarios){
    if (err){
      console.log(err);
      return next(err);
    } else {
      // si hay un usuario logueado pasar el nombre
      // console.log(usuarios);
      if (req.user){
        res.render('usuarios', {title: 'Usuarios', usuario: req.user, usuarios: usuarios});
      } else {
        res.render('usuarios', {title: 'Usuarios', usuarios: usuarios});
      }
    }
  });
};

// Sólo debería ser accesible por el propio usuario.
// ¿Cómo debería ser si quisiera que un usuario pudiera ver el perfil de otro?
// Porque al renderear la página, habría 2 usuarios uno logueado, el req.user que es el que se mostraría en la barra de navegación, y el del perfil.

// Ver tutorial https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website
exports.perfilUsuario = function (req, res, next){
  console.log("Perfil usuario.");
  async.parallel({
    usuario: function(callback) {
      Usuario.findOne({'local.username': req.params.username}).exec(callback)
    },
    encuestas_usuario: function(callback) {
      Encuesta.find({ 'creador': req.params.username }).exec(callback)
    }
  }, function(err, results) {
    if (err) { return next(err); } // Error in API usage.
    if (results.usuario == null) { // No results.
      var err = new Error('Usuario no encontrado');
      err.status = 404;
      return next(err);
    }
    if (results.encuestas_usuario == null){
      console.log("Ninguna encuesta");
      var err = new Error('Encuesta no encontrada');
      err.status = 404;
      return next(err);
    }
    // OK
    console.log("Encontramos al usuario.");
    // Me parece que hay ue pasar en usuario el req.user, que es el que está logueado y que debería ser el mismo.
    // porque en realidad ningún otro usuario debería poder ir a un perfil que no es el propio.
    // res.render('usuario', { title: 'Usuario', usuario: results.usuario, encuestas: results.encuestas_usuario} );
    // esto está así por ahora.
    if (req.user) {
      res.render('usuario', {title: 'Usuario', usuario_nombre: results.usuario.local.username, encuestas: results.encuestas_usuario, usuario: req.user});
    } else {
      res.render('usuario', {title: 'Usuario', usuario_nombre: results.usuario.local.username, encuestas: results.encuestas_usuario});
    }
  });
};

// Reescribir, porque así es difícil de leer y de mantener.
exports.signup_post = function (req, res, next) {
  var nombre = req.body.username;
  if (nombre.length >= 2){
    Usuario.findOne({'local.username': nombre},
      function (err, user) {
        if (err){
          // throw err;
          console.log("ERROR: Problema con la base de datos: " + err);
          // req.flash('error', 'Problema con la base de datos.');
          // res.redirect('/signup');
        }
        if (user) {
          res.send("Ya existe un usuario con ese nombre.");
        } else {
          var newUser = new Usuario();
          newUser.local.username = nombre;
          newUser.local.password = req.body.password;

          // Encriptación del password
          var salt = bcrypt.genSaltSync(10);
          var hash = bcrypt.hashSync(newUser.local.password, salt);

          // Guardo el hash
          newUser.local.password = hash;

          newUser.save(function(err) {
            if (err) {
              // throw err;
              // req.flash('error', 'Problema con la base de datos al intentar guardar el nuevo usuario.');
              // res.redirect('/signup');
              console.log("ERROR: Problema al intentar guardar el nuevo usuario en la base de datos ");
              res.send(err);
            } else {
              console.log("Nuevo usuario creado.");
              // quizá acá no habría que pasarle new user sino llamar a la función login() de passport
              // res.render('usuario', {usuario: newUser });
              /*  req.login(user, function(err) {
              if (err) { return next(err); }
                return res.redirect(req.user.url);
                */
              req.flash('success', "Ya está registrado. Ahora por favor ingrese mediante login");
              res.redirect('/login');
            }
          }); // save
        }
      });
  } else {
    res.send("El nombre debe tener dos o más caracteres.");
  }
};

exports.locallogin_get = function (req, res, next) {
  res.render('login');
}

exports.locallogin_post = function(req, res, next){
  console.log("Login authentication.");
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
};

exports.borrarCuenta = function(req, res, next){
  res.send("NO IMPLEMENTADO AÚN: Borrar cuenta de usuario");
}

// Al principio también seguí parte del tutorial de Clementine.js

// Para el passport local me fue útil la documentación de passport y el Node.js & Express Tutorial from Scratch.

// En la reformulación de los modelos y de los controllers fue muy útil el tutorial https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website
