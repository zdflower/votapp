/*
Testear si un usuario autenticado puede acceder a la página de otro usuario y crear y borrar encuestas ajenas.
*/

'use strict';

const Encuesta = require('../models/encuesta.js');
const Usuario = require('../models/usuario.js');

function VotingHandler() {

  this.obtenerEncuestas = function (req, res){
    Encuesta.find({}, function (err, encuestas) {
      if (err){
        console.log(err);
      } else {
        //no puedo acceder a req.user.username si no hay ningún usuario logueado.
        if (req.user){ 
          //paso el usuario porque lo usa layout
          res.render('index', { title: 'Encuestas', encuestas: encuestas, usuario: req.user.github.username});
        } else {
          //acá si no hay un usuario logueado no va a hacer falta pasar usuario
          res.render('index', { title: 'Encuestas', encuestas: encuestas}); 
        }
        
      }
    });
  }

  this.obtenerUsuarios = function (req, res){
    Usuario.find({}, function(err, usuarios){
      if (err){
        console.log(err);
      } else {
        //si hay un usuario logueado pasar el nombre
            if (req.user){
              res.render('usuarios', {title: 'Usuarios', usuario: req.user.github.username, usuarios: usuarios});
            } else {
              res.render('usuarios', { title: 'Usuarios', usuarios: usuarios});
            }
      }
    });
  }

  this.obtenerEncuesta = function(req, res) {
    //console.log('GET ' + req.params.pregunta);
    Encuesta.findOne({pregunta: req.params.pregunta, creador: req.params.usuario}, function(err, encuesta) {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
          if (encuesta){
            //console.log('FINDONE: ' + encuesta);
            //si hay un usuario logueado pasar el nombre
            if (req.user){
              res.render('encuesta', {title: 'Encuesta',encuesta: encuesta, usuario: req.user.github.username});
            } else {
              res.render('encuesta', {title: 'Encuesta',encuesta: encuesta});
            }
          } else {
            res.send('No existe la encuesta');
          }
      }
   });
  }

  //Creo que este método no lo uso.
   this.obtenerOpcionesAPI = function(req, res) {
    //console.log('GET ' + req.params.pregunta);
    Encuesta.findOne({pregunta: req.params.pregunta}, function(err, encuesta) {
      if (err) {
        console.log(err);
        res.send(err);
      } else {
          if (encuesta){
            //console.log('FINDONE: ' + encuesta);
            res.json(encuesta.opciones);
          } else {
            res.json({'msg': 'No existe la encuesta'});
          }
      }
   });
  }

  this.votarEncuesta = function(req, res) {
  	//en la ruta con el método post, después de :pregunta le agregué / y recién ahí funcionó el envío de los datos del formulario.
/*¿Cómo hacer para impedir que se pueda votar si no se eligió ninguna opción?, ¿Cómo indicarle al usuario que tiene que seleccionar una opción antes de clickear sobre el botón votar?*/
  Encuesta.findOne({pregunta: req.params.pregunta}).exec(function(err, encuesta){
  	if (err) {
  		throw err;
  	}
  	else {
      let opt = req.body.op;

      for (let i = 0; i < encuesta.opciones.length; i++) {
        //console.log("op " + i +"( " + encuesta.opciones[i].op + ") es igual a " + opt + "?: " + ( encuesta.opciones[i].op === opt));
        if (encuesta.opciones[i].op === opt){
          //Encontré cómo incrementar los votos en el foro de free code camp: "Mongoose: $inc not working [SOLVED]"
          let query = 'opciones.' + i +'.votos';
          let obj = {[query] : 1};
          Encuesta.findOneAndUpdate({pregunta: req.params.pregunta},	{ $inc: obj }
  	       ).exec(function(err, enc) {
  			       if (err) {
  				           throw err;
  			        } else {
  						          res.redirect('/' + enc.creador + '/encuesta/' + enc.pregunta);
  			        }
  		     });
         }
      }
  	}
  });
};

this.verPaginaCrearEncuesta = function (req, res){
  Usuario.findOne({'github.username' : req.user.github.username}, {'_id': false}).exec(function(err, usuario) {
      if (err) {
        console.log(err);
        res.send("Hubo un error.");
      } else {
        res.render('crearEncuesta', {title: 'Crear Encuesta', usuario: usuario.github.username});
      }
  });
};

  //Tiene que ser req.user.github.username porque para poder crear una encuesta tiene que estar logueado.
  
 this.crearEncuesta = function(req, res) {
     let encuesta = nuevaEncuesta(req.body);
     //Fue útil buscar en stackoverflow y la documentación de mongoose api.
     //{new: true} es para que devuelva el documento modificado.

   /* En vez de los tirar error o enviar el error, en caso de error podría hacer que en la página de destino se muestre un recuadro indicando que hubo un error.
   Y si hubo éxito, que se muestre un recuadro que lo indique, además de destacar la dirección de la nueva encuesta.

   Puedo pasarlo para que se renderee o puedo usar el middleware express-messages.
   */

   if (encuesta.pregunta.length >= 2){
     Usuario.findOneAndUpdate( {'github.username' : req.user.github.username}, 
          { $push : {encuestasCreadas : {'pregunta': encuesta.pregunta}}}, {new: true}, function(err, usuario){
           if (err) {
             throw err;
           } else {
              let paraGuardar = new Encuesta(encuesta);
              paraGuardar.creador = usuario.github.username;
              paraGuardar.save( function (err) {
                console.log("Guardando encuesta en la base de datos de encuestas.")
                if (err) { res.send(err);}
                else {
                  res.render('usuario', {usuario: usuario.github.username, encuestasCreadas: usuario.encuestasCreadas});
                }
              });
           }
      });
   } else {
     res.send("ERROR: La pregunta debe tener al menos 2 caracteres.");
   }
 };

  this.signup = function (req, res) {
    var nombre = req.body.username;
    if (nombre.length >= 2){
      Usuario.findOne({'local.username': nombre},
      function (err, user) {
        if (err){
          throw err;
        }
        if (user) {
          res.send("Ya existe un usuario con ese nombre.");
        }
        else {
          var newUser = new Usuario();
          newUser.local.username = nombre;
          newUser.local.password = req.body.password;
          newUser.save(function(err) {
            if (err) {
              throw err;
            }
            res.send("Nuevo usuario creado.");
          });
        }
      });
    } else {
      res.send("El nombre debe tener dos o más caracteres.")
    }
  };

  this.locallogin = function(req, res){
      passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true });
  };


  //quiero que sólo el propio usuario pueda acceder a su página y para eso tiene que estar autenticado, y no que cualquier usuario autenticado acceda a esa página.
  
this.obtenerUsuario = function(req, res){
  Usuario.findOne({'github.username': req.user.github.username}, {'_id': false}).exec(function(err, usuario){
        if (err) {
          console.log('ERROR: ' + err);
          res.send(err);
        } else if (usuario !== null){
            //console.log("Encuestas creadas: " + usuario.encuestasCreadas);
            res.render('usuario', {usuario: usuario.github.username, encuestasCreadas: usuario.encuestasCreadas, id: usuario.github.id});
        } else {
          //Esto no debería hacer falta, ya que si sólo un usuario autenticado puede llegar acá, entonces siempre va a encontrarlo en la base de datos...
            res.send('No existe ese usuario.');
        }
    });
  };

  /* Un problema que encontré y tiene que ver con crearEncuesta y eliminarEncuesta:
    en la base de datos de usuario se guarda la pregunta aunque sea una cadena vacía, además también se guarda aunque no se haya guardado en la base de datos de encuesta porque no tenía opciones.

    Tengo que ver cómo manejar este error que se da cuando no se completan los formularios.

    Le voy a poner un mínimo de caracteres para las preguntas y las opciones.
  */

  //chequear que encuesta.creador === req.user.github.username antes de borrar.
  this.eliminarEncuesta = function(req, res) {
    let preg = req.params.pregunta;
    let usuario= req.user.github.username;
    Encuesta.remove({pregunta: preg, creador: usuario}, function(err) {
      if (err) {
        res.send(err);
      } else {
        //¿Qué pasa si la encuesta no existe en la base de datos de encuesta? Si no la encuetra no pasa nada. Continúa.¿?
        console.log("Borrada de la base de datos de encuestas: OK.");
        //Borrarla también de las encuestas creadas por el usuario.
        Usuario.findOne({'github.username': usuario}, function(err, user){
          if (err) {res.send(err);}
          else {
            let encuestas = user.encuestasCreadas;//un alias, así, si modificás encuestas, modificás user.encuestasCreadas

            //tenés que recalcular cada vez la longitud porque cambia la longitud del array si le sacás un elemento.
            for (let i = 0; i < encuestas.length; i++){
              if (encuestas[i].pregunta === preg) {
                encuestas.splice(i, 1); //esta es la forma recomendada en la documentación para borrar un elemento de un array.
                //El primer argumento se refiere a la posición y el segundo a la cantidad de elementos a borrar, y devolver, a partir de esa posicioń, incluída. Modifica el array.
                i -= 1; //si sacaste un elemento tenés que volver a mirar la misma posición porque se corrieron las posiciones. Si no, no chequeás elementos.
              }
            }

    /*VER CÓMO HACER PARA DISTINGUIR ENTRE ENCUESTAS CON LA MISMA PREGUNTA. MIENTRAS LAS MUESTRE POR PREGUNTA SE VAN A BORRAR TODAS LAS QUE TENGAN LA MISMA PREGUNTA.
¿QUÉ PASA SI SON DE DISTINTO USUARIO? NO DEBERÍA PASAR NADA YA QUE SE BORRAN LAS ENCUESTAS CON TAL PREGUNTA Y TAL CREADOR.
SI MANTENGO ESTO DE QUE LAS ENCUESTAS CON LA MISMA PREGUNTA SE BORRAN TODAS SI SE BORRA UNA, DEBERÍA IMPEDIR O AVISAR AL USUARIO QUE NO SE PUEDE CREAR UNA ENCUESTA CON UNA PREGUNTA IGUAL A OTRA EXISTENTE.
CREO QUE TIENE QUE VER CON LA VALIDACIÓN.

AHORA SI UN USUARIO CREA DOS ENCUESTAS CON LA MISMA PREGUNTA SE GUARDAN LAS DOS, SE LISTAN LAS DOS EN LA PÁGINA DE ENCUESTAS Y EN LA PÁGINA DEL USUARIO PERO CUANDO SE ACCEDE MEDIANTE EL LINK SIEMPRE ES UNA SOLA LA QUE SE MUESTRA.

PODRÍA CHEQUEAR SI EXISTE UNA ENCUESTA CON LA MISMA PREGUNTA EN EL USUARIO.

Y PARA ACCEDER A LAS ENCUESTAS PODRÍA AGREGARLE EN LA RUTA EL USUARIO CREADOR: /USUARIO/ENCUESTA/PREGUNTA
Y QUE AL MOSTRARLAS Y GENERAR LOS LINKS EN LA PÁGINA PRINCIPAL DE LAS ENCUESTAS QUE SE DISTINGAN POR LA RUTA... ¿CÓMO DISTINGUIRLAS SI NO?
  */

            user.save(function(err){
              console.log("Voy a guardar cambios luego de eliminar encuesta del usuario.");
              if (err) {
                 res.send(err);
               } else {
               console.log("Borrado OK.");
               res.redirect('/' + usuario);
               }
             });
          }
        });
      }
    });
  };

} //fin VotingHandler

//función auxiliar no exportada
let nuevaEncuesta = function (data) {
  console.log("Nueva encuesta.")
  let preg = data.pregunta;
  //lo siguiente ponerlo aparte en una función auxiliar que le saque los signos de interrogación
  preg = (preg.charAt(0) === '¿') ? preg.slice(1,preg.length) : preg;
  preg = (preg.charAt(preg.length - 1) ==='?') ? preg.slice(0, preg.length - 1) : preg;

  let opciones = [];

  //es importante el let
  for (let item in data) {
    if (item !== 'pregunta') {
      opciones.push({ op : data[item], votos : 0 })
    }
  }

  return {
    pregunta : preg,
    opciones :  opciones
  };
};

module.exports = VotingHandler;
