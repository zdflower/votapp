const debug = require('debug')('crearEncuesta'); // ¿y si querés debuguear otra cosa cambiás acá el nombre?
// ¿ Qué pasa si usás debug en varias partes a la vez, a todas les da el mismo nombre...? Debo estar razonando mal acerca del asunto.

const Joi = require('joi');
// https://www.npmjs.com/package/joi

// Ojo que así como está permite que la pregunta sea "             " (puro espacio) y sospecho que pasa lo mismo con las opciones.
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
      //debug(err);
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
        return next(error); //
      }
    }
  });
/* Me gustaría poder llamar a renderEncuesta acá y tener definida esa función en otro lado,
pero no logro darme cuenta cómo hacer que funcione, que pueda acceder a req y res y next. */
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

/* Por enésima vez revisar y reescribir esto */
exports.crearEncuesta_post = function (req, res, next) {
    debug("CREA ENCUESTA.");
    // para validar obtengo una lista de las opciones
    if (formularioCrearEncuestaError(req, res, next)){
        // ¿Cómo uso {error: result.error} del lado del cliente, para mostrar el mensaje?
        // ¿Qué pasa si uso return next(result.error)?
        // return res.status(422).json({ error: result.error });
        // return next(result.error);
        req.flash("Errores de validación."); // No muestra este mensaje.
        res.redirect(req.user.url + '/crearEncuesta');
    }
    else {
       // Chequeo si ya existe una encuesta del mismo usuario con la misma pregunta
       chequearEncuesta(req, res, next, datosEncuesta);
    }
}; // fin crearEncuesta_post

function formularioCrearEncuestaError(req, res, next){
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
  /* Validación de los datos */
  debug("Validación.");
  const result = Joi.validate(datosEncuesta, schema, {abortEarly: false});
  debug('result.error:');
  debug(result.error);
  return result.error;
}

exports.votarEncuesta = function(req, res, next) {
  const filtro = {'pregunta': req.params.pregunta, 'creador': req.params.username};
  Encuesta.findOne(filtro).exec(function(err, encuesta){
    if (err) {
      return next(err);
    } else {
      let opt = req.body.op;
      debug("Opciones:" + encuesta.opciones);
      // no puedo usar directamente indexOf porque opciones es una lista de {op: ..., votos: ...}
      let i = indiceDe(opt, encuesta.opciones);
      debug("índice de " + opt + " (la opción votada): " + i);
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
      // debug(err);
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
      req.flash('error', 'Ya existe una encuesta con la pregunta: "' + preg + '"'); // Este sí lo muestra.
      // const error = new Error('Ya existe una encuesta con la pregunta: "' + preg + '"');
      // error.status = 400;
      //return next(error);
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

function indiceDe(elem, arrDeObj){
  let indice = 0;
  for (let i = 0; i < arrDeObj.length; i++){
    if (arrDeObj[i].op === elem){
      indice = i;
    }
  }
  return indice;
};
