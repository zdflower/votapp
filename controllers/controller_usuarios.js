const async = require('async');
const Usuario = require('../models/usuario.js');
const Encuesta = require('../models/encuesta.js');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const debug = require('debug')('ControllerUsuario');

/* Ver cómo y dónde conviene hacer la validación de username y password */
const Joi = require('joi');
/* Ver cómo sería chequear cada item por separado sin agrupar username, password, etc. */
const schema = Joi.object().keys({
  "username": Joi.string().alphanum().trim().min(4).max(50).required().error(() => 'Username debe ser una cadena de letras y/o números de entre 4 y 50 caracteres'),
  "password": Joi.string().trim().min(8).required(),
  "passwordRe": Joi.string().trim().min(8).required()
})

exports.obtenerUsuarios = function (req, res, next){
  Usuario.find({}, function(err, usuarios){
    if (err){
      console.error(err);
      return next(err);
    } else {
      // si hay un usuario logueado pasar el nombre
      if (req.user){
        res.render('usuarios', {title: 'Usuarios', usuario: req.user, usuarios: usuarios});
      } else {
        res.render('usuarios', {title: 'Usuarios', usuarios: usuarios});
      }
    }
  });
};

// Ver tutorial https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website
exports.perfilUsuario = function (req, res, next){
  console.log("Perfil usuario.");
  async.parallel({
    usuario: function(callback) {
      Usuario.findOne({'local.username': req.params.username}).exec(callback)
    },
    encuestas_usuario: function(callback) {
      Encuesta.find({ 'creador': req.params.username }).sort({fecha: -1}).exec(callback)
    }
  }, function(err, results) {
    if (err) { return next(err); } // Error in API usage.
    if (results.usuario == null) { // No results.
      const err = new Error('Página no encontrada'); // Usuario no encontrado
      err.status = 404;
      return next(err);
    }
    if (results.encuestas_usuario == null){
      debug("Ninguna encuesta");
      const err = new Error('Página no encontrada'); // Encuesta no encontrada
      err.status = 404;
      return next(err);
    }
    // OK
    debug("Encontramos al usuario.");
    if (req.user) {
      res.render('usuario', {title: 'Usuario', usuario_nombre: results.usuario.local.username, encuestas: results.encuestas_usuario, usuario: req.user});
    } else {
      res.render('usuario', {title: 'Usuario', usuario_nombre: results.usuario.local.username, encuestas: results.encuestas_usuario});
    }
  });
};

// Reescribir para mejorar legibilidad y mantenimiento.
exports.signup_post = function (req, res, next) {
  const nombre = req.body.username.trim();
  const pwd = req.body.password.trim();
  const pwdRe = req.body.passwordRe.trim();

  const result = Joi.validate({
    'username': nombre,
    'password': pwd,
    'passwordRe': pwdRe
  }, schema, {abortEarly: true});
  // chequear que coinciden password y passwordRe
  let pwdsCoinciden = pwd === pwdRe;

  debug('Resultado:');
  debug(result.error);
  if (result.error || !pwdsCoinciden) {
    // Agrupo todos los mensajes de error y los muestro en la página.
    let errors = [];
    result.error.details.forEach(function(error){
      errors.push(error.message);
    })
    if (!pwdsCoinciden) {
      errors.push('Los passwords no coinciden.');
    }
    debug('errors:');
    debug(errors)
    res.render('signup', {errors: errors});
  } else { /* Si no hay result.error y password y passwordRe coinciden entonces proceder con la registración. */
    Usuario.findOne({'local.username': nombre},
      function (err, user) {
        if (err){
          debug("ERROR: Problema con la base de datos: " + err);
          req.flash('error', 'Problema con la base de datos.');
          res.redirect('/signup');
        }
        if (user) {
          req.flash('error', "Ya existe un usuario con ese nombre.");
          res.redirect('/signup');
        } else {
          const newUser = new Usuario();
          newUser.local.username = nombre;
          newUser.local.password = pwd;

          // Encriptación del password
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(newUser.local.password, salt);

          // Guardo el hash
          newUser.local.password = hash;

          newUser.save(function(err) {
            if (err) {
              debug("ERROR: Problema al intentar guardar el nuevo usuario en la base de datos ");
              req.flash('error', 'Problema con la base de datos.');
              res.redirect('/signup');
            } else {
              debug("Nuevo usuario creado.");
              req.flash('success', "Ya está registrado. Ahora por favor ingrese mediante login");
              res.redirect('/login');
            }
          }); // save
        } // nuevo usuario
      }); // Usuario.findOne
  } // No hay errores en el formulario
}; // signup_post

exports.locallogin_get = function (req, res, next) {
  res.render('login');
}

exports.locallogin_post = function(req, res, next){
  console.log("Login authentication.");
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    successFlash: '¡Hola!',
    failureFlash: true
  })(req, res, next);
};

exports.borrarCuenta = function(req, res, next){
  res.send("NO IMPLEMENTADO AÚN: Borrar cuenta de usuario");
}

// Al principio también seguí parte del tutorial de Clementine.js

// Para el passport local me fue útil la documentación de passport y el Node.js & Express Tutorial from Scratch.

// En la reformulación de los modelos y de los controllers fue muy útil el tutorial https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website
