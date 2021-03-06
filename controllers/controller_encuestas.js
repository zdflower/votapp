const debug = require('debug')('crearEncuesta');

const Joi = require('joi');
// https://www.npmjs.com/package/joi

const schema = Joi.object().keys({
  "pregunta": Joi.string().min(2).max(100).required(),
  "opciones": Joi.array().items(Joi.string().min(2)).min(2).required()
})

const Encuesta = require('../models/encuesta.js');

/* No veo la forma de evitar el callback hell */

exports.obtenerEncuestas = function (req, res, next){
  Encuesta.find({}).sort({fecha: -1}).exec(
    function renderIndex(err, encuestas) {
      if (err){
        debug(err);
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
  Encuesta.findOne({pregunta: req.params.pregunta, creador: req.params.username}, function renderEncuesta(err, encuesta) {
    if (err) {
      debug(err);
      return next(err);
    } else {
      if (encuesta){
        // si hay un usuario logueado pasar el nombre
        if (req.user){
          res.render('encuesta', {title: 'Encuesta', encuesta: encuesta, usuario: req.user});
        } else {
          res.render('encuesta', {title: 'Encuesta', encuesta: encuesta});
        }
      } else {
        const error = new Error('No existe la página');
        error.status = 404;
        debug(error);
        return next(error); //
      }
    }
  });
};

exports.crearEncuesta_get = function(req, res){
  res.render('crearEncuesta', {usuario: req.user});
};

// No hay que chequear si el usuario está logueado, si no está no llegaría hasta acá.
// Hay que validar los datos enviados por el usuario.
// En req.body tenemos: {'pregunta': "...", 'opciones[]': ["...", "..."]},
// pregunta no debe ser vacía y opciones tiene que tener por lo menos dos elementos,
// además todos los elementos de opciones deben ser no vacíos.
// No permitir que el mismo usuario cree una nueva encuesta con la misma pregunta que otra que ya haya creado (y no borrado).

/*
Casos de error:
  Clickeo el botón de crear encuesta
    1)  sin completar ni la pregunta ni las opciones.
    2) completando la pregunta pero no las opciones
      2.1) la pregunta es nueva
      2.2) la pregunta es repetida
*/

exports.crearEncuesta_post = function (req, res, next) {
  debug("CREA ENCUESTA.");
  let opcionesKeys = Object.keys(req.body).filter(function(opc){
    return (opc !== 'pregunta')
  });
  debug("opcionesKeys:");
  debug(opcionesKeys);
  // Quiero construir un array con req.body[key], donde key está en opcionesKeys
  // Limpio de espacios iniciales y finales, mediante trim() tanto la pregunta como las opciones
  let opciones = opcionesKeys.map(function(key){
    return req.body[key].trim();
  })
  let datosEncuesta = {
    pregunta: descartarSignosInterrogacion(req.body.pregunta).trim(),
    opciones: opciones
  };
  if (formularioCrearEncuestaError(req, res, next, datosEncuesta)){
    req.flash('error', "Debe completar la pregunta y al menos dos opciones.");
    res.redirect(req.user.url + '/crearEncuesta');
  } else {
    // Chequeo si ya existe una encuesta del mismo usuario con la misma pregunta
    chequearEncuesta(req, res, next, datosEncuesta);
  }
}; // fin crearEncuesta_post

function formularioCrearEncuestaError(req, res, next, datosEncuesta){
  /* Validación de los datos */
  debug("Validación.");
  const result = Joi.validate(datosEncuesta, schema, {abortEarly: false});
  debug('result.error:');
  debug(result.error);
  return result.error;
}

/* Para validar el formulario de votación:
- que haya que seleccionar una opción antes de clickear el botón votar
- que sólo se pueda votar una opción
- que cuando se escribe una nueva opción se vote esa y no se pueda tener además otra elegida
*/
exports.votarEncuesta = function(req, res, next) {
  // Antes de proceder hay que chequear que req.body.op sea una cadena con al menos 2 caracteres
  const opt = req.body.op;
  const opcion = Joi.string().min(2).max(100).required()
  const result = Joi.validate(opt, opcion);
  if (result.error){
    req.flash('error', 'Debe seleccionar una opción');
    res.redirect('/' + req.params.username + '/' +req.params.pregunta);
  } else {
    const filtro = {'pregunta': req.params.pregunta, 'creador': req.params.username};
    Encuesta.findOne(filtro).exec(function(err, encuesta){
      if (err) {
        debug(err);
        return next(err);
      } else {
        debug("Opciones:" + encuesta.opciones);
        // no puedo usar directamente indexOf porque opciones es una lista de {op: ..., votos: ...}
        let i = indiceDe(opt, encuesta.opciones);
        debug("índice de " + opt + " (la opción votada): " + i);
        if (i !== -1){
          let query = 'opciones.' + i + '.votos';
          let obj = {[query] : 1};
          Encuesta.findOneAndUpdate(filtro, { $inc: obj }, {new: true}).exec(function(err, enc) {
            if (err) {
              debug(err);
              return next(err);
            } else {
              req.flash('success', 'Voto registrado.');
              res.redirect(enc.url);
            }
          });
        } else {
          // Si no existe la opción agregarla y sumarle 1 voto.
          // ¿Uso encuesta.opciones.push o encuesta.opciones.addToSet? Me parece que como cada opción es única estaría bien usar addToSet.
          encuesta.opciones.addToSet({op: req.body.op, votos: 1});
          debug("¿Se agregó la nueva opción?");
          debug(encuesta.opciones);
          encuesta.save(function(err) {
            if (err) {
              debug(err);
              return next(err);
            } else {
              req.flash('success', 'Voto registrado.');
              res.redirect(encuesta.url);
            }
          }) // guardar la encuesta modificada
        } // else votar nueva opción
      } // else Encontramos la encuesta
    }); // buscar la encuesta en la que se quiere votar
  } // else no hubo error de validación
}; // votarEncuesta

exports.obtenerOpcionesAPI = function(req, res, next) {
  Encuesta.findOne({pregunta: req.params.pregunta}, function(err, encuesta) {
    if (err) {
      debug(err);
      return next(err);
    } else {
      if (encuesta){
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
  // req.user debe existir puesto que para borrar una encuesta tenés que estar logueado.
  let pregunta = req.params.pregunta;
  Encuesta.remove({pregunta: pregunta, creador: req.user.local.username}, function(err) {
    if (err) {
      debug(err);
      return next(err);
    }
    debug("ENCUESTA BORRADA")
    req.flash('success', 'Encuesta borrada.');
    res.send('OK');
  });
};

// datosEncuesta tiene la forma { pregunta: String, opciones: Array of String}
function chequearEncuesta(req, res, next, datosEncuesta){
  let usuario_logueado = req.user;
  let preg = datosEncuesta.pregunta; // Ya está sin signos de interrogación y sin espacios iniciales ni finales.
  debug('Usuario: ' + usuario_logueado.local.username + '\nPregunta: ' + preg);
  Encuesta.findOne({pregunta: preg, creador: usuario_logueado.local.username}, function chequearEncRepetida(err, resultado){
    if (err){
      debug("Error: " + err);
      return next(err);
    }
    // No hubo error en la búsqueda.
    debug('Resultado de la búsqueda de una encuesta repetida: ' + resultado);
    if (resultado) {
      debug('ERROR: Ya existe una encuesta con la pregunta: "' + preg + '"');
      req.flash('error', 'Ya existe una encuesta con la pregunta: "' + preg + '"');
      res.redirect(usuario_logueado.url + '/crearEncuesta');
    } else {
      debug('Aparentemente NO habría una encuesta del mismo usuario con esa pregunta');
      // Llegado acá, se cumplen todas las condiciones para crear la encuesta.
      // Creo la nueva encuesta y la guardo.
      let nueva_encuesta = new Encuesta(nuevaEncuesta(datosEncuesta));
      nueva_encuesta.creador = usuario_logueado.local.username;
      debug("nueva_encuesta: ");
      debug(nueva_encuesta);
      nueva_encuesta.save(function (err) {
        if (err) {
          debug("Error guardando encuesta.");
          debug(err);
          return next(err);
        }
        // si no hubo error llegamos acá, si hubo error, creo que no llegás acá.
        req.flash('success', 'Encuesta creada');
        res.redirect(usuario_logueado.url);
      }); // fin guardado de encuesta
    } // fin else no hay encuesta repetida
  }); // fin búsqueda encuesta
}

// Funciones auxiliares
function descartarSignosInterrogacion(pregunta) {
  debug("Descartando signos de interrogación.");
  let preg = (pregunta.charAt(0) === '¿') ? pregunta.slice(1, pregunta.length) : pregunta;
  preg = (preg.charAt(preg.length - 1) === '?') ? preg.slice(0, preg.length - 1) : preg;
  return preg;
}

// data.pregunta no tiene signos de interrogación ni espacios al comienzo ni al final,
// data.opciones es un array con las opciones.
function nuevaEncuesta(data) {
  debug("Nueva encuesta.");
  let opciones = data.opciones.map(function(opcion){
    return {op : opcion, votos : 0};
  });
  debug('opciones:');
  debug(opciones);
  return {
    pregunta : data.pregunta,
    opciones : opciones
  };
};

/* Re-pensar la búsqueda, ¿de qué otra forma se puede hacer?, la forma actual ¿es suficientemente buena? */
function indiceDe(elem, arrDeObj){
  let indice = 0;
  for (let i = 0; i < arrDeObj.length; i++){
    if (arrDeObj[i].op === elem){
      indice = i;
    }
  }
  // Si elem no está en arrDeObj devolver -1, sino indice.
  let resultado = (arrDeObj[indice].op === elem)? indice : -1;
  return resultado;
};
