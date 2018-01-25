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
exports.crearEncuesta_post = function(req, res, next) {
  console.log("POST: CREA ENCUESTA.");
  let usuario_logueado = req.user;
  let preg = descartarSignosInterrogacion(req.body.pregunta);
  /*
  Casos de error:
    Clickeo el botón de crear encuesta
      1)  sin completar ni la pregunta ni las opciones.
      2) completando la pregunta pero no las opciones
        2.1) la pregunta es nueva
        2.2) la pregunta es repetida

  Lo que sucede:
    2.1) Se interrumpe el servidor después de obtener un error al intentar guardar la encuesta:
          throw er; // Unhandled 'error' event
          ^

    Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client

    1) y 2.2) Sale de crearEncuesta_post y vuelve al ajax por el lado del success, pero muestra el mensaje flash de error correspondiente.
  */

  console.log('Usuario: ' + usuario_logueado.local.username + '\nPregunta: ' + preg);
  if (preg.length >= 2){
    // Antes de esto hay que validar los datos
    // Chequo si ya existe una encuesta del mismo usuario con la misma pregunta
    Encuesta.findOne({pregunta: preg, creador: usuario_logueado.local.username}, function(err, resultado){
      if (err){
        console.log("Error: " + err);
        req.flash('error', 'Algo salió mal al buscar la encuesta.');
        res.send(err);
      }
      console.log('Resultado de la búsqueda de una encuesta repetida: ' + resultado);
      if (resultado) {
        console.log('Aparentemente habría una encuesta del mismo usuario con esa pregunta');
        console.log('ERROR: Ya existe una encuesta con la pregunta: "' + preg + '"');
        req.flash('error', 'Ya existe una encuesta con la pregunta: "' + preg + '"');
        let error = new Error();
        res.send(error); // Es como si nada..., como si respondiera todo bien!
      } else {
        console.log('Aparentemente NO habría una encuesta del mismo usuario con esa pregunta');
        // Creo la nueva encuesta y la guardo.
        // Acá está el problema de los signos de interrogación: como paso req.body, no usa la pregunta sin signos de interrogación, sino la original.
        // Le paso además del body la pregunta sin los signos de interrogación, por lo menos hasta que sepa si se puede (y cómo) modificar req.body.pregunta y así pasarle sólo req.body, o hasta que encuentre una solución mejor.
        let nueva_encuesta = new Encuesta(nuevaEncuesta(preg, req.body));
        // ¿Cómo se manejan posibles errores en nuevaEncuesta() y en new Encuesta()?
        nueva_encuesta.creador = usuario_logueado.local.username;
        console.log("nueva_encuesta: ");
        console.log(nueva_encuesta);
        // TENGO QUE CHEQUEAR QUE ESTÉN COMPLETOS LOS CAMPOS REQUERIDOS POR EL ESQUEMA DE ENCUESTA, SINO TIRA ERROR.
        nueva_encuesta.save(function (err) {
          if (err) {
            console.log("Error guardando encuesta.");
            req.flash('error', 'Algo salió mal al intentar guardar la encuesta.');
            res.send(err);
          }
          // si no hubo error llegamos acá, si hubo error, creo que no llegás acá.
          req.flash('success', 'Encuesta creada');
          res.send('Ok');
        });
      }
    });
  } else {
    console.log('ERROR: La pregunta debe tener al menos 2 caracteres.');
    req.flash('error', 'ERROR: La pregunta debe tener al menos 2 caracteres.');
    // Si hago lo siguiente es como mandarle ok en respuesta al pedido ajax y entonces en vez de redirigirme a crear encuesta ejecuta la función correspondiente a success.
    // En realidad sí se redirige a crearEncuesta, y seguramente muestra el mensaje flash, pero inmediatamente, tan rápido que ni se ve en el navegador, ejecuta la función sucess que te lleva al perfil del usuario.
    // res.redirect(usuario_logueado.url + '/crearEncuesta');
    let err = new Error();
    res.send(err);
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
  // req.user debe existir puesto que para borrar una encuesta tenés que estar logueado.
  let pregunta = req.params.pregunta;
  Encuesta.remove({pregunta: pregunta, creador: req.user.local.username}, function(err) {
    if (err) {
      return next(err);
    }
    console.log("ENCUESTA BORRADA")
    req.flash('success', 'Encuesta borrada.');
    res.send('OK');
  });
};

// Funciones auxiliares no exportadas

function descartarSignosInterrogacion(pregunta) {
  console.log("Descartando signos de interrogación.");
  let preg = (pregunta.charAt(0) === '¿') ? pregunta.slice(1, pregunta.length) : pregunta;
  preg = (preg.charAt(preg.length - 1) === '?') ? preg.slice(0, preg.length - 1) : preg;
  return preg;
}

// data =  {'pregunta': "...", 'opciones[]': ["...", "..."]}
// La pregunta ya viene sin signos de interrogación.
// Por lo menos era lo que yo suponía y parece que me equivoqué.
// data.pregunta es la original
// pregunta es la que no tiene signos de interrogación
let nuevaEncuesta = function (pregunta, data) {
  console.log("Nueva encuesta.")
  let opciones = data["opciones[]"].map(function(opcion){
    return {op : opcion, votos : 0};
  });

  return {
    pregunta : pregunta,
    opciones : opciones
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
};
