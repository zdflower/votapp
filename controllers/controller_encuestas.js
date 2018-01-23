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
// No permitir que el mismo usuario cree una nueva encuesta con la misma pregunta que otra que ya haya creado (y no borrado).
exports.crearEncuesta_post = function(req, res, next) {
  console.log("POST: CREA ENCUESTA.");
  let usuario_logueado = req.user;
  if (req.body.pregunta.length >= 2){
    // Antes de esto hay que validar los datos
    // Chequear si ya existe una encuesta del mismo usuario con la misma pregunta
    let nueva_encuesta = new Encuesta(nuevaEncuesta(req.body));
    // ¿Cómo se manejan posibles errores en nuevaEncuesta() y en new Encuesta()?
    nueva_encuesta.creador = usuario_logueado.local.username;
    console.log("nueva_encuesta: ");
    console.log(nueva_encuesta);
    nueva_encuesta.save(function (err) {
      if (err) {
        console.log("Error guardando encuesta.");
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
    console.log('ERROR: La pregunta debe tener al menos 2 caracteres.');
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


/*
POST /:username/crearEncuesta - - ms - -
isLoggedIn
req.params:
{ username: ':username' }
Los usuarios NO coinciden.
POST: CREA ENCUESTA.
Nueva encuesta.
nueva_encuesta:
{ opciones:
   [ { _id: 5a675e1eadd36c1b97954365, op: 'Lunes', votos: 0 },
     { _id: 5a675e1eadd36c1b97954364, op: 'Martes', votos: 0 } ],
  _id: 5a675e1eadd36c1b97954363,
  pregunta: 'Qué día es hoy',
  creador: 'FDZ' }
isLoggedIn
req.params:
{ username: 'Debby' }
Los usuarios NO coinciden.
GET /Debby/crearEncuesta?pregunta=%C2%BFQu%C3%A9+d%C3%ADa+es+hoy%3F&op1=Lunes&op2=Martes 200 93.544 ms - 2120
GET /bower_components/bootstrap/dist/css/bootstrap.css 304 0.826 ms - -
GET /css/font-awesome.min.css 304 2.238 ms - -
GET /css/style.css 304 1.518 ms - -
GET /bower_components/jquery/dist/jquery.js 304 0.931 ms - -
GET /bower_components/bootstrap/dist/js/bootstrap.js 304 0.880 ms - -
GET /js/masopciones.js 304 0.935 ms - -

*/
