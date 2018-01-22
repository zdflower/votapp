$(document).ready(function(){

 var cantOpciones = 2;

	$('#agregaop').click(function(){
		//agregar al formgroup de opciones un
		cantOpciones += 1;
		var opcion = '<div><label>Nueva opción</label><input class="form-control opcion" name="op'+ cantOpciones +'" type="text"> <button class="borrar btn btn-danger">borrar opción</button></div>';
		console.log('Agrego opción');
		$('#opciones').append(opcion);
//		console.log("cantOpciones: " + cantOpciones);
	    $('.borrar').click(function(){
   	 		console.log('Borro opción.');
			$(this).parent().remove();
//			console.log("cantOpciones: " + cantOpciones);
   		});
	});

  $('form').on('submit', function(event){
    // Obtengo la pregunta
    let pregunta = $('input[name="pregunta"]').val();
    // Obtengo las opciones
    let opciones = $('input').filter('.option').toArray();
    opciones = opciones..map(function(op) { return op.value; });
    let datos = {pregunta: pregunta, opciones: opciones};
    // Hago un pedido post
    $.ajax ('/:usuario/crearEncuesta', {
      type: 'POST',
      data: datos,
      success: function(data, status){
        if ( status === 'error' ) {
            console.log("Obtuve un status de error.");
        }
        // Ir a la página de encuestas
        window.location.href='/';
      },
      error:  function(data) {
        console.log('Error en el pedido post. ');
        console.log(data);
        // Volver a la página de crear encuestas
        window.location.href='/:usuario/crearEncuesta';
      }
    }); //ajax post
  }); //form

});
