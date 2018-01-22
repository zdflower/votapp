const Encuesta = require('../models/encuesta.js');

exports.obtenerEncuestas = function (req, res, next){
  Encuesta.find({}, function (err, encuestas) {
    if (err){
      return next(err);
    } else {
      // no puedo acceder a req.user.username si no hay ningún usuario logueado.
      if (req.user){
        // paso el usuario porque lo usa layout
        res.render('index', {title: 'Encuestas', encuestas: encuestas, usuario: req.user});
      } else {
        // acá si no hay un usuario logueado no va a hacer falta pasar usuario
        res.render('index', {title: 'Encuestas', encuestas: encuestas});
      }
    }
  });
};

exports.obtenerEncuesta = function(req, res, next) {
  Encuesta.findOne({pregunta: req.params.pregunta, creador: req.params.username}, function(err, encuesta) {
    if (err) {
      // console.log(err);
      // res.send(err);
      return next(err);
    } else {
      if (encuesta){
        // console.log('FINDONE: ' + encuesta);
        // si hay un usuario logueado pasar el nombre
        if (req.user){
          res.render('encuesta', {title: 'Encuesta', encuesta: encuesta, usuario: req.user});
        } else {
          res.render('encuesta', {title: 'Encuesta', encuesta: encuesta});
        }
      } else {
        // res.send('No existe la encuesta');
        const error = new Error('No existe la encuesta');
        error.status = 404;
        next(error);
      }
    }
  });
};

exports.crearEncuesta_get = function(req, res){
  res.render('crearEncuesta', {usuario: req.user});
};

// Reescribir esta función:
// No hay que chequear si el usuario está logueado, si no está no llegaría hasta acá.
// Hay que validar los datos enviados por el usuario.
// En req.body tenemos: {'pregunta': "...", 'opciones[]': ["...", "..."]},
// pregunta no debe ser vacía y opciones tiene que tener por lo menos dos elementos,
// además todos los elementos de opciones deben ser no vacíos.

exports.crearEncuesta_post = function(req, res, next) {
  console.log("POST: CREA ENCUESTA.");
  let usuario_logueado = req.user;
  if (req.body.pregunta.length >= 2){
    // Antes de esto hay que validar los datos
    let nueva_encuesta = new Encuesta(nuevaEncuesta(req.body));
    // ¿Cómo se manejan posibles errores en nuevaEncuesta() y en new Encuesta()?
    nueva_encuesta.creador = usuario_logueado.local.username;
    nueva_encuesta.save(function (err) {
      console.log("Guardando encuesta en la base de datos de encuestas.")
      if (err) {
        req.flash('error', 'Algo salió mal al intentar guardar la encuesta.');
        // res.redirect(usuario_logueado.url + '/crearEncuesta');
        res.send(err);
      }
      // si no hubo error llegamos acá, si hubo error, creo que no llegás acá.
      req.flash('success', 'Encuesta creada');
      // res.redirect(nueva_encuesta.url);
      res.send('Ok');
    });
  } else {
    req.flash('error', 'ERROR: La pregunta debe tener al menos 2 caracteres.');
    res.redirect(usuario_logueado.url + '/crearEncuesta');
  }
};

exports.votarEncuesta = function(req, res, next) {
  var filtro = {'pregunta': req.params.pregunta, 'creador': req.params.username};
  Encuesta.findOne(filtro).exec(function(err, encuesta){
    if (err) {
      return next(err);
    } else {
      let opt = req.body.op;
      console.log("Opciones:" + encuesta.opciones);
      // no puedo usar directamente indexOf porque opciones es una lista de {op: ..., votos: ...}
      let i = indiceDe(opt, encuesta.opciones);
      console.log("índice de " + opt + " (la opción votada): " + i);
      if (i !== -1){
        let query = 'opciones.' + i + '.votos';
        let obj = {[query] : 1};
        Encuesta.findOneAndUpdate(filtro, { $inc: obj }, {new: true}).exec(function(err, enc) {
          if (err) {
            return next(err);
          } else {
            req.flash('success', 'Voto registrado.');
            res.redirect(enc.url);
          }
        });
      } else {
        res.send("Parece que no existe esa opción. Algo salió muy mal.");
      }
    }
  });
};

exports.obtenerOpcionesAPI = function(req, res, next) {
  Encuesta.findOne({pregunta: req.params.pregunta}, function(err, encuesta) {
    if (err) {
      // console.log(err);
      // res.send(err);
      return next(err);
    } else {
      if (encuesta){
        // console.log('FINDONE: ' + encuesta);
        res.json(encuesta.opciones);
      } else {
        res.json({'msg': 'No existe la encuesta'});
      }
    }
  });
}

// Revisar
exports.borrarEncuesta = function (req, res, next) {
  // busco si existe una encuesta con la pregunta dada y el usuario logueado
  // en caso de que exista, remove
  let pregunta = req.params.pregunta;
  Encuesta.remove({pregunta: pregunta, creador: req.user.local.username}, function(err) {
    if (err) {
      return next(err);
    }
    console.log("ENCUESTA BORRADA")
    // No muestra el mensaje flash...
    req.flash('success', 'Encuesta borrada.');
    res.redirect('/');
  });
};

// Función auxiliar no exportada
// data =  {'pregunta': "...", 'opciones[]': ["...", "..."]}
let nuevaEncuesta = function (data) {
  console.log("Nueva encuesta.")
  let preg = data.pregunta;
  // lo siguiente ponerlo aparte en una función auxiliar que le saque los signos de interrogación
  preg = (preg.charAt(0) === '¿') ? preg.slice(1, preg.length) : preg;
  preg = (preg.charAt(preg.length - 1) === '?') ? preg.slice(0, preg.length - 1) : preg;

  let opciones = data["opciones[]"].map(function(opcion){
    return {op : opcion, votos : 0};
  });

  return {
    pregunta : preg,
    opciones :  opciones
  };
};

function indiceDe(elem, arrDeObj){
  var indice = 0;
  for (let i = 0; i < arrDeObj.length; i++){
    if (arrDeObj[i].op === elem){
      indice = i;
    }
  }
  return indice;
}
