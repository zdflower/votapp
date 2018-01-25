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
    let opciones = $('input').filter('.opcion').toArray();
    opciones = opciones.map(function(op) { return op.value; });
    let datos = {pregunta: pregunta, opciones: opciones};
    // Hago un pedido post
    /*
    - en vez del evento submit del formulario usé el evento click del botón de submit
    - después del ajax request usé event.preventDefault()
    Entonces, después de haberse creado con éxito una encuesta, se redirige a la página indicada en la función correspondiente a success.
    Y si hay un error (como por ejemplo ¿clickear el botón sin haber completado antes el formulario?) entonces vuelve a rearEncuesta.
    ¿Cómo hacer para que se vea un mensaje en la página que haga referencia al error?
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
        alert('Error status: ' + data.status);
        // window.location.href= appUrl + '/' + usuario + '/crearEncuesta';
        // No me gusta esta solución (pero es la que hay por ahora):
        $('#mensajeError').append("<p>SE PRODUJO ALGÚN TIPO DE ERROR y no sé cómo mostrar el mensaje de error correspondiente.</p>");
                                + "<p>Podría ser que la pregunta tiene menos de 2 caracteres.</p>"
                                + "<p>O que ya exista una encuesta con la misma pregunta.</p>"
                                + "<p>O alguna de las opciones tiene menos de 2 caracteres.</p>"
        );
      }
    }); // ajax post
    event.preventDefault();
  }); // form
});
