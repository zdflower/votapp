$(document).ready(function(){
  var appUrl = window.location.origin;
  var cantOpciones = 2;
  $('#agregaop').click(function(){
    // agregar al formgroup de opciones un
    cantOpciones += 1;

    var opcion =
    '<div><label>Nueva opción</label>' +
    '<div class="input-group">' +
    '<input class="form-control opcion" name="op' + cantOpciones +'" type="text" autofocus>' +
    '<span class="input-group-btn"><button class="borrar btn btn-danger">borrar opción</button></span>' +
    '</div>' +
    '</div>';
    $('#opciones').append(opcion);
    // console.log("cantOpciones: " + cantOpciones);
    $('.borrar').click(function(){
      $(this).parent().remove();
      // console.log("cantOpciones: " + cantOpciones);
    });
  });

  $('#btnCrearEncuesta').on('click', function(event){
    // Obtengo la pregunta
    let pregunta = $('input[name="pregunta"]').val();
    let usuario = $('input[name="usuario"]').val();
    // Obtengo las opciones

/*
¿De qué otra manera que no estoy viendo se puede considerar este problema?

No sé cómo validar una cantidad de opciones variable con express-validator.
Si no sé cuántas opciones van a haber de antemano, ¿cómo hago la validación?
¿Podría pasar el número de elementos de opciones y que quede en req.body.cantidadOpciones?
Por otro lado el problema podría estar en que los números del nombre de cada campo de opción no necesariamente va a ser consecutivo porque un usuario pudo haber añadido una opción y después haberla borrado.
Podría leer los nombres de campo de las opciones y reemplazarlos por nombres que tengan números consecutivos.
Y después tengo que revisar y cambiar cómo creo la encuesta, porque ahora las opciones no están agrupadas...
*/
    let opciones = $('input').filter('.opcion').toArray();
    opciones = opciones.map(function(op) { return op.value; });
    let datos = {pregunta: pregunta, opciones: opciones};
    // Hago un pedido post
    /*
    - en vez del evento submit del formulario usé el evento click del botón de submit
    - después del ajax request usé event.preventDefault()
    */
    $.ajax({
      type: 'POST',
      url: appUrl + '/' + usuario + '/crearEncuesta',
      data: datos,
      success: function(data, status){
        // Por ahora dejo los alert para ver por qué lado viene la respuesta.
        alert('¡Encuesta creada, ' + usuario + '!');
        window.location.href= appUrl + '/' + usuario;
      },
      error:  function(data) {
        // ¿Podría data ser una lista de errores?
        //alert('Error status: ' + data.status);
        alert('Error status: ' + data.status);
        // window.location.href= appUrl + '/' + usuario + '/crearEncuesta';
        // NO ME GUSTA esta solución (pero es la que hay por ahora):
        data.responseJSON.error.details.forEach(function(error){
          $('#mensajeError').append("<p>" + error.message + "</p>");
        });
      }
    }); // ajax post
    event.preventDefault();
  }); // form
});
