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
    //data viene del ajaxRequest
    console.log("update click count");
		var clicksObject = JSON.parse(data);
    //console.log(clicksObject.opciones);
    var votos1 = clicksObject.opciones[0].votos;
    var votos2 = clicksObject.opciones[1].votos;
		click_op1.innerHTML = votos1;
		click_op2.innerHTML = votos2;
    //updateChart({votos1, votos2});
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
  
  
  /* Gráfico */
  /*
   var ctx = document.getElementById("grafico").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ["Red", "Purple"],
        datasets: [{
            label: '# of Votes',
            data: [0, 0],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(153, 102, 255, 0.2)',
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
});

  function updateChart(obj) {
    myChart.data.datasets[0].data[0] = obj.votos1;
    myChart.data.datasets[0].data[1] = obj.votos2;
    myChart.update();
  }
  */
})();