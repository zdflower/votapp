const debug = require('debug')('crearEncuesta'); // ¿y si querés debuguear otra cosa cambiás acá el nombre?
// ¿ Qué pasa si usás debug en varias partes a la vez, a todas les da el mismo nombre...? Debo estar razonando mal acerca del asunto.

const Joi = require('joi');
// https://www.npmjs.com/package/joi
const schema = Joi.object().keys({
  "pregunta": Joi.string().min(2).max(100).required(),
  "opciones[]": Joi.array().items(Joi.string().min(2)).min(2).required()
})

const Encuesta = require('../models/encuesta.js');

exports.obtenerEncuestas = function (req, res, next){
  Encuesta.find({}).sort({fecha: -1}).exec(function (err, encuestas) {
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
        next(error);
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

exports.crearEncuesta_post =
  (req, res, next) => {
    debug("CREA ENCUESTA.");
    debug("Validación.");
    /* Validación de los datos */
    const result = Joi.validate({ pregunta: req.body.pregunta, "opciones[]": req.body["opciones[]"] }, schema, {abortEarly: false});
    if (result.error){
        debug('Hubo errores de validación:');
        debug(result.error);
        // ¿Cómo uso {error: result.error} del lado del cliente, para mostrar el mensaje?
        // ¿Qué pasa si uso return next(result.error)?
        return res.status(422).json({ error: result.error });
      }
      else {
        // ¿Debería usar result.value.pregunta y result.value[opciones[]]?
        // Los datos son válidos pero falta ver si la pregunta está repetida
        let usuario_logueado = req.user
        let preg = descartarSignosInterrogacion(req.body.pregunta);
        debug('Usuario: ' + usuario_logueado.local.username + '\nPregunta: ' + preg);
        // Chequeo si ya existe una encuesta del mismo usuario con la misma pregunta
        Encuesta.findOne({pregunta: preg, creador: usuario_logueado.local.username}, function(err, resultado){
          if (err){
            debug("Error: " + err);
            req.flash('error', 'Algo salió mal al buscar la encuesta.');
            res.send(err);
          }
          // No hubo error en la búsqueda.
          debug('Resultado de la búsqueda de una encuesta repetida: ' + resultado);
          if (resultado) {
            debug('ERROR: Ya existe una encuesta con la pregunta: "' + preg + '"');
            req.flash('error', 'Ya existe una encuesta con la pregunta: "' + preg + '"');
            const error = new Error('Ya existe una encuesta con la pregunta: "' + preg + '"');
            error.status = 400;
            // quizá en vez de err sea error... Sí, eso lo solucionó.
            return next(error);//res.send(error);
          } else {
            debug('Aparentemente NO habría una encuesta del mismo usuario con esa pregunta');
            // Llegado acá, se cumplen todas las condiciones para crear la encuesta.
            // Creo la nueva encuesta y la guardo.
            // Acá está el problema de los signos de interrogación: como paso req.body, no usa la pregunta sin signos de interrogación, sino la original.
            // Le paso además del body la pregunta sin los signos de interrogación, por lo menos hasta que sepa si se puede (y cómo) modificar req.body.pregunta y así pasarle sólo req.body, o hasta que encuentre una solución mejor.
            let nueva_encuesta = new Encuesta(nuevaEncuesta(preg, req.body));
            // ¿Cómo se manejan posibles errores en nuevaEncuesta() y en new Encuesta()?
            nueva_encuesta.creador = usuario_logueado.local.username;
            debug("nueva_encuesta: ");
            debug(nueva_encuesta);
            nueva_encuesta.save(function (err) {
              if (err) {
                debug("Error guardando encuesta.");
                req.flash('error', 'Algo salió mal al intentar guardar la encuesta.');
                res.send(err);
              }
              // si no hubo error llegamos acá, si hubo error, creo que no llegás acá.
              req.flash('success', 'Encuesta creada');
              res.send('Ok');
            }); // fin guardado de encuesta
          }
      }); // fin búsqueda encuesta
    }
}; // fin crearEncuesta_post

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

// Funciones auxiliares no exportadas

function descartarSignosInterrogacion(pregunta) {
  debug("Descartando signos de interrogación.");
  let preg = (pregunta.charAt(0) === '¿') ? pregunta.slice(1, pregunta.length) : pregunta;
  preg = (preg.charAt(preg.length - 1) === '?') ? preg.slice(0, preg.length - 1) : preg;
  return preg;
}

// data.pregunta es la original,
// pregunta es la que no tiene signos de interrogación
// data.cantidadOpciones es la cantidad de opciones,
// data.opX (donde X es un número de 1 en adelante) es el nombre de la opción.
let nuevaEncuesta = function (pregunta, data) {
  debug("Nueva encuesta.");
  let opciones = data["opciones[]"].map(function(opcion){
      return {op : opcion, votos : 0};
  });
  return {
    pregunta : pregunta,
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
