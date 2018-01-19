'use strict';

const ControllerEncuestas = require('../controllers/controller_encuestas.js');
const ControllerUsuarios = require('../controllers/controller_usuarios.js');

module.exports = function(app, passport) {

//REVISAR Y REESCRIBIR ESTA FUNCIÓN:
  //Ver cómo manejar estos errores con next...
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      if (req.user.local.username === req.params.username){
        console.log("Los usuarios coinciden.")
        //console.log("Usuario registrado: " + req.user.local.username);
        //console.log("Parámetro usuario: " + req.params.username);
        //console.log("Params:");
        //console.log(req.params);
        return next();
      } else {
        //req.flash('warning', 'Los usuarios no coinciden. Vuelva a su propio perfil.');

        console.log("Los usuarios NO coinciden.")
        //console.log("Usuario registrado: " + req.user.local.username);
        //console.log("Parámetro usuario: " + req.params.username);
        //console.log("Params:");
        //console.log(req.params);
        res.send("El usuario logueado y el de la página a la que quiere acceder no coinciden.");
        /*const error = new Error("El usuario logueado y el de la página a la que quiere acceder no coinciden.");
        error.status = 404;
        next(error);*/
      }

    } else {
      req.flash("warning", 'Si ya está registrado, debe loguearse. Si no está registrado, por favor regístrese y luego ingrese mediante login.');
      res.redirect('/login');
    }
  }

  app.route('/').get(ControllerEncuestas.obtenerEncuestas);

  app.route('/usuarios').get(ControllerUsuarios.obtenerUsuarios);

  app.route('/login')
    .get(ControllerUsuarios.locallogin_get)
    .post(ControllerUsuarios.locallogin_post);

  app.get('/logout', function(req, res){
    req.logout(); //función de passport
    res.redirect('/login');
  });

 app.route('/signup')
   .get(function(req, res){res.render('signup');})
   .post(ControllerUsuarios.signup_post);

 app.get('/info', function(req, res){
          if (req.user){
            res.render('info', {usuario: req.user});
          } else {
            res.render('info');
          }
  });

 app.get('/api/opciones/:pregunta', ControllerEncuestas.obtenerOpcionesAPI);

 app.route('/:username/crearEncuesta')
     .get(isLoggedIn, ControllerEncuestas.crearEncuesta_get)
     .post(isLoggedIn, ControllerEncuestas.crearEncuesta_post);

 app.route('/:username/:pregunta')
    .get(ControllerEncuestas.obtenerEncuesta)
    .post(ControllerEncuestas.votarEncuesta)
    .delete(isLoggedIn, ControllerEncuestas.borrarEncuesta);

 app.route('/:username')
    .get(isLoggedIn, ControllerUsuarios.perfilUsuario)
    .delete(isLoggedIn, ControllerUsuarios.borrarCuenta);

} //end of index
