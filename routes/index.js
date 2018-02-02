'use strict';

const ControllerEncuestas = require('../controllers/controller_encuestas.js');
const ControllerUsuarios = require('../controllers/controller_usuarios.js');

module.exports = function(app, passport){
  function isLoggedIn(req, res, next) {
    debug("isLoggedIn");
    debug('req.params: ');
    debug(req.params);
    if (req.isAuthenticated()) {
      if (req.user.local.username === req.params.username){
        debug("Los usuarios coinciden.")
        return next();
      } else {
        // Está logueado pero...
        debug("Intenta acceder a una página de otro usuario.");
        req.flash("warning", 'No puede acceder a esa página.');
        // Lo redirijo a su propia página.
        res.redirect(req.user.url);
      }
    } else {
      req.flash("warning", 'Si ya está registrado, debe loguearse. Si no está registrado, por favor regístrese y luego ingrese mediante login.');
      res.redirect('/login');
    }
  }

  app.route('/').get(ControllerEncuestas.obtenerEncuestas);

  app.route('/login')
    .get(ControllerUsuarios.locallogin_get)
    .post(ControllerUsuarios.locallogin_post);

  /* Github Authentication */
  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', {
      successRedirect: '/',
      failureRedirect: '/login'
    }));

  app.get('/logout', function(req, res){
    req.logout(); // función de passport
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
} // end of index
