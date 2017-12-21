'use strict';

//Acá tengo que hacer las modificaciones para que en vez de manejar los clicks de un solo botón
//pueda manejar de 2 o más.
//todavía no entiendo
//tal vez primero tenga que cambiar a mongoose y usar schemas...

function voteHandler (db) {
	var clicks = db.collection('clicks');

	this.getClicks = function (req, res) {

		var clickProjection = { '_id': false }; //indica que no incluya el campo _id

    //busca si hay algo en la base de datos
		clicks.findOne({}, clickProjection, function(err, result) {
			if (err) {
				throw err;
			}
      //si hay, lo devuelve
			if (result) {
				res.json(result);
			} else {
        //si no hay inserta uno
				//clicks.insert({'clicks': 0}, function(err) {
        clicks.insert({'opciones': [{'votos': 0}, {'votos': 0}]}, function(err) {
					if (err) {
						throw err;
					}
          //vuelve a buscar
					clicks.findOne({}, clickProjection, function(err, doc) {
						if (err) {
							throw err;
						}
            //lo devuelve
						res.json(doc);
					});
				});
			}
		});
	};

  //ahora que cambié la forma del documento, cómo incremento los votos correspondientes a los eventos de cada botón?
	this.addClickOp1 = function (req, res) {
    console.log('Clickeo botón1');
    //búsqueda: todos los documentos de la colección, incluyendo el _id, sumar 1 al campo clicks
    
    //tengo que cambiar que, dependiendo de qué botón se clickeó se incrementen los votos de la opción correspondiente.
    //CAMBIAR ESTO
		clicks.findAndModify(
					{},
					{ '_id': 1},
					 { $inc : {"opciones.0.votos" : 1}},
					function (err, result) { 
						if (err) { throw err; }
						res.json(result); 
					}
				);
	};
  
  this.addClickOp2 = function (req, res) {
    console.log('Clickeo botón2');
    //búsqueda: todos los documentos de la colección, ordenado por _id, sumar 1 al campo clicks
    
    //tengo que cambiar que, dependiendo de qué botón se clickeó se incrementen los votos de la opción correspondiente.
    //CAMBIAR ESTO
		clicks.findAndModify(
					{},
					{ '_id': 1},
					{ $inc: { "opciones.1.votos" : 1}},
					function (err, result) { 
						if (err) { throw err; }
						res.json(result); 
					}
				);
	};


	this.resetClicks = function (req, res) {
		clicks.update(
				{},
				{ opciones : [{votos : 0}, {votos : 0}] },
				function (err, result) {
					if (err) {throw err;}
					res.json(result);
				}
			);
	}
}

module.exports = voteHandler;