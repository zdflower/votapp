'use strict';

(function () {
	var addButton_op1 = document.querySelector('.btn-add_op1');
	var addButton_op2 = document.querySelector('.btn-add_op2');
	var deleteButton = document.querySelector('.btn-delete');
	var click_op1 = document.querySelector('#click_op1');
	var click_op2 = document.querySelector('#click_op2');
	var apiUrl1 = 'http://localhost:4000/api/clicks1';
  var apiUrl2 = 'http://localhost:4000/api/clicks2';

	function ready (fn) {
		if (typeof fn !== 'function') {
			return;
		}

		if (document.readyState === 'complete') {
			return fn();
		}

		document.addEventListener('DOMContentLoaded', fn, false);
	}

	function ajaxRequest (method, url ,callback) {
		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
				callback(xmlhttp.response);
			}
		};

		xmlhttp.open(method, url, true);
		xmlhttp.send();
	}

	function updateClickCount (data) {
		// TODO: dependiendo de qué botón se cliqueó me gustaría que se actualizara el resultado correspondiente
		//¿De dónde viene data?
    console.log("update click count");
		var clicksObject = JSON.parse(data);
    //console.log(clicksObject.opciones);
		click_op1.innerHTML = clicksObject.opciones[0].votos;
		click_op2.innerHTML = clicksObject.opciones[1].votos;
	}

	ready(ajaxRequest('GET', apiUrl1, updateClickCount));

	addButton_op1.addEventListener('click', function() {
		ajaxRequest('POST', apiUrl1, function() {
			ajaxRequest('GET', apiUrl1, updateClickCount)
		});

	}, false);

	addButton_op2.addEventListener('click', function() {
		ajaxRequest('POST', apiUrl2, function() {
			ajaxRequest('GET', apiUrl2, updateClickCount)
		});

	}, false);
  
  
  /*
  cuando clickeo el botón 1 o el 2 se actualiza la base de datos pero siempre se llama al manejador del botón 1.
  ¿cómo hago para que cada botón active su correspondiente manejador y no los dos el mismo?
  ¿RESUELTO?: agregué una ruta para ese botón, cada botón postea a una apiUrl distinta.
  */

  /*
  en vez de mostrarse los resultados correspondientes a cada opción, aparece undefined.
  RESUELTO: no accedía a los campos adecuados.
  */
  
})();