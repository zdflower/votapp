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
  // let preg = req.body.pregunta;
  // console.log('Usuario: ' + usuario + '\nPregunta: ' + preg);
  // ¿El problema era intentar acceder a req.body.pregunta y no estaba ese campo completado? ¿?
  // Parece que el problema tenía que ver con eso, porque ahora la ejecución sigue y por consola devuelve
  /*
  No sé cuál es el error ahora.
  */
  let preg = descartarSignosInterrogacion(req.body.pregunta); // Hasta acá todo bien, la siguiente línea no la ejecuta.
  // Voy a ver si en vez de usuario es usuario_logueado.local.username...
  // Parece que tenía que ver con eso porque ahora el funcionamiento es distinto, ya no obtengo error status 500,
  // pero todavía no funciona completamente como debería.
  // Casi funciona, el problema es que aunque encuentra una encuesta repetida responde con 200 al pedido ajax en vez de con error,
  // por lo tanto se ejecuta la función success, lo que sí es que se muestra el mensaje flash de error...
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
        // Redirijo a la página del usuario para que pueda ver la encuesta existente y en todo caso borrarla si quiere hacer una nueva.
        // res.redirect(usuario_logueado.url);
        let error = new Error();
        res.send(error); // Es como si nada..., como si respondiera todo bien!
      } else {
      /*
        Traté de crear una encuesta con la misma pregunta y me lo permitió...
        No debió suceder.
        Voy a explorar qué pasó.
      */
        console.log('Aparentemente NO habría una encuesta del mismo usuario con esa pregunta');
        // Creo la nueva encuesta y la guardo.
        let nueva_encuesta = new Encuesta(nuevaEncuesta(req.body));
        // ¿Cómo se manejan posibles errores en nuevaEncuesta() y en new Encuesta()?
        nueva_encuesta.creador = usuario_logueado.local.username;
        console.log("nueva_encuesta: ");
        console.log(nueva_encuesta);
        // TENGO QUE CHEQUEAR QUE ESTÉN COMPLETOS LOS CAMPOS REQUERIDOS POR EL ESQUEMA DE ENCUESTA, SINO TIRA ERROR.
        nueva_encuesta.save(function (err) {
          if (err) {
            console.log("Error guardando encuesta."); // Otro bug: Cuando no completo las opciones llega hasta acá y después se mostró en el navegador el alert: "Error status: 0" y luego en la consola:
            /*
Resultado de la búsqueda de una encuesta repetida: null
Aparentemente NO habría una encuesta del mismo usuario con esa pregunta
Nueva encuesta.
nueva_encuesta:
{ opciones:
   [ { _id: 5a69142b8d73293edb473ab9, op: '', votos: 0 },
     { _id: 5a69142b8d73293edb473ab8, op: '', votos: 0 } ],
  fecha: 2018-01-24T23:18:03.954Z,
  _id: 5a69142b8d73293edb473ab7,
  pregunta: 'qué carajos pasa',
  creador: 'Florencia' }
Error guardando encuesta.
events.js:136
      throw er; // Unhandled 'error' event
      ^

Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
    at validateHeader (_http_outgoing.js:503:11)
    at ServerResponse.setHeader (_http_outgoing.js:510:3)
    at ServerResponse.header (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/express/lib/response.js:767:10)
    at ServerResponse.send (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/express/lib/response.js:170:12)
    at /home/flor/web-wrkspc/votapp-github/votapp/controllers/controller_encuestas.js:111:15
    at /home/flor/web-wrkspc/votapp-github/votapp/node_modules/mongoose/lib/model.js:3913:16
    at $__save.error (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/mongoose/lib/model.js:340:16)
    at /home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:246:48
    at next (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:167:27)
    at Kareem.execPost (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:217:3)
    at _handleWrapError (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:245:21)
    at /home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:271:14
    at _next (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:94:14)
    at Immediate.setImmediate (/home/flor/web-wrkspc/votapp-github/votapp/node_modules/kareem/index.js:420:34)
    at runCallback (timers.js:773:18)
    at tryOnImmediate (timers.js:734:5)
*/
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
let nuevaEncuesta = function (data) {
  console.log("Nueva encuesta.")
  let preg = data.pregunta;
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
};

/*
Crear encuesta:

el $.ajax() vuelve por el lado del error aunque se haya creado la encuesta

*/


/*
// Así está MAL
// ¿Cómo debo escribir esta pregunta?
function preguntaRepetida(pregunta, username, next) {
  Encuesta.findOne({pregunta: pregunta, creador: username}, function(err, encuesta) {
    if (err) {
      return next(err);
    } else {
      return next(null); //¿?
    }
  });
};
*/
