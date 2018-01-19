$(document).ready(function(){

 var cantOpciones = 2;

	$('#agregaop').click(function(){
		//agregar al formgroup de opciones un
		cantOpciones += 1;
		var opcion = '<div><label>Opción</label><input class="form-control" name="op'+ cantOpciones +'" type="text"> <button class="borrar btn btn-danger">borrar opción</button></div>';
		console.log('Agrego opción');
		$('#opciones').append(opcion);
//		console.log("cantOpciones: " + cantOpciones);
	    $('.borrar').click(function(){
   	 		console.log('Borro opción.');
			$(this).parent().remove();
//			console.log("cantOpciones: " + cantOpciones);
   		});
	});

});
