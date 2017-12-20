'use strict';

(function () {
	var addButton_op1 = document.querySelector('.btn-add_op1');
	var addButton_op2 = document.querySelector('.btn-add_op2');
	var deleteButton = document.querySelector('.btn-delete');
	var click_op1 = document.querySelector('#click-op1');
	var click_op2 = document.querySelector('#click-op2');
	var apiUrl = 'http://localhost:4000/api/clicks';

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
		var clicksObject = JSON.parse(data);
		click_op1.innerHTML = clicksObject.clicks;
		//click_op1.innerHTML = clicksObject.clicks_op2;
	}

	ready(ajaxRequest('GET', apiUrl, updateClickCount));

	addButton_op1.addEventListener('click', function() {
		ajaxRequest('POST', apiUrl, function() {
			ajaxRequest('GET', apiUrl, updateClickCount)
		});

	}, false);

})();