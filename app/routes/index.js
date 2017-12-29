'use strict';

let Usuario = require('../models/usuario');

let Encuesta = require('../models/encuesta');

var VoteHandler = require(process.cwd() + '/app/controllers/voteHandler.server.js');

module.exports = function (app) {

  //load view engine
  app.set('views', process.cwd() + '/views');
  app.set('view engine', 'pug');
  
	var voteHandler = new VoteHandler();

	app.route('/').get(
    function (req, res) {
    //acá le tenés que pasar todas las encuestas de la base de datos de encuestas.
    Encuesta.find({}, { '_id': false }, function(err, encuestas) {
      console.log('ENCUESTAS: ' + encuestas);
      res.render('index', {title: 'Encuestas', encuestas: encuestas});
    });
		}
    //voteHandler.getEncuestas
	);
  
  app.route('/usuarios')
    .get(function(req, res) {
      Usuario.find({}, { '_id': false }, function(err, usuarios) {
        if (err) {
          res.send(err);
        } else {
          console.log('USUARIOS: ' + usuarios);
          res.render('usuarios', {title: 'Usuarios', usuarios: usuarios});          
        }
    });
  });
  
  app.route('/signup')
    .get(function(req, res){
	res.render('signup', {title: 'Sign up'});
})
    .post(function(req, res){
    //acá tenés que registrar al usuario 
    	let usuario = new Usuario();
	     usuario.id = req.body.id;
	     usuario.encuestasCreadas = [];
	     usuario.encuestasVotadas = [];

	     usuario.save(function(err){
		      if (err){
            console.log(err);
            res.send('Faltó llenar algún campo.');
		      } else {
			 			res.redirect('/' + usuario.id);
		      }
       });
  });
          
  app.route('/:usuario/crearEncuesta/')
    .get(function(req, res) {
	   Usuario.findOne({id : req.params.usuario}, function(err, usuario) {
	    if (err) {
				console.log(err);
				res.send("Hubo un error.");
			} else {
				res.render('crearEncuesta', {title: 'Crear Encuesta', usuario: usuario});
			}
	   });
    })
    .post(function(req, res) {
    	Usuario.findOne( {id : req.params.usuario}, function(err, usuario) {
			if (err) {
				res.send(err);
			} else {
        //cambiar acá para que si la pregunta empieza y/o termina con ¿? no guarde esos signos, que solo guarde las palabras.
        //usar slice y charAt
        console.log("USUARIO CREANDO ENCUESTA: " + usuario);
				let encuesta = {
					pregunta : req.body.pregunta,
					opciones :  [	{ op : req.body.op1, votos : 0 },	{ op: req.body.op2, votos: 0}	]
				};
        console.log('PREGUNTA DE LA ENCUESTA CREADA: ' + encuesta.pregunta);
				usuario.encuestasCreadas.push({pregunta : encuesta.pregunta});
				usuario.save(function (err) {
					if (err) { res.send(err);}
					else {
						//guardar la encuesta en la base de datos de encuestas
						let paraGuardar = new Encuesta(encuesta);
						paraGuardar.creador = usuario.id;
						paraGuardar.save( function (err) {
							if (err) { res.send(err);}
							else {
								res.render('usuario', {usuario: usuario});
							}
						});
					}
				});
		}
  }); 
  });
         
  app.route('/:usuario')
    .get(function(req, res){    
    Usuario.findOne({id : req.params.usuario}, function(err, usuario){
	    if (err) {
				console.log('ERROR: ' + err);
				res.send(err);
			 } else if (usuario !== null){
					console.log("Encuestas creadas: " + usuario.encuestasCreadas);
					res.render('usuario', {usuario: usuario});
        } else {
					res.send('No existe ese usuario.');
			 }
      });
  });
  
  app.route('/login')
    .get(function(req, res) {
      res.render('login', {title: 'Log in'});
  })
    .post(function (req, res) {
      Usuario.findOne({ id: req.body.id}, function (err, usuario) {
			if (err) { throw err;}
			res.render('usuario', {usuario: usuario});
		});
  });

/* Revisar todo esto*/
  app.route('/api/votar/')
    .get(voteHandler.getEncuestas)
    .post(voteHandler.votar);

  app.route('/encuesta/:pregunta')
    .get(function(req, res) {
      //si está en la base de datos la obtenés y la pasás al template para que se renderee.
    let preg = req.params.pregunta;
    Encuesta.findOne({pregunta: preg} , function(err, encuesta){
      if (err) {
        res.send(err);
      }
      else {
        res.render('encuesta', {title: '¿' + preg + '?', encuesta: encuesta});  
      }
    });
      
  });

/*
  var enc = {pregunta: '?', opciones : [{op: 'op1', votos: 0}, {op: 'op2', votos: 0}]};
  app.route('/encuesta')
    .get(function(req, res) {
      //acá en vez de usar enc, quiero acceder a la base de datos y pasarle la encuesta
      //acá tendría que ir un llamado similar al de voteHandler.getClicks
      res.render('encuesta', {title: 'Encuesta', encuesta: enc});
  })
    .post(function(req, res){
      //acá uno similar a voteHandler.addClick
    res.send(req.body);
  });

  */
/*  
app.route('/api/vota')
						.get(voteHandler.getClicks)
		        .post(voteHandler.addClickOp1);
            
app.route('/api/clicks2')
              .get(voteHandler.getClicks)
            .post(voteHandler.addClickOp2);
*/
	app.route('/votaEncuesta')
    .get(function (req, res) {
		res.sendFile(process.cwd() + '/public/votaEncuesta.html');
	})
    .post(function(req, res){
      //el problema de que no mostraba el body era que había : en vez de = en el atributo method del formulario.
      console.log(req.body);
      res.send(req.body);
  });

};