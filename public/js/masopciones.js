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

  $('form').on('submit', function(event){
    // Obtengo la pregunta
    let pregunta = $('input[name="pregunta"]').val();
    // Obtengo las opciones
    let opciones = $('input').filter('.opcion').toArray();
    opciones = opciones.map(function(op) { return op.value; });
    let datos = {pregunta: pregunta, opciones: opciones};
    // Hago un pedido post
    $.ajax(appUrl + '/:username/crearEncuesta', {
      type: 'POST',
      data: datos,
      success: function(data, status){
        if (status === 'error') {
          window.location.href='/horror';
        } else {
        // Ir a la página de encuestas
          window.location.href='/';
        }
      },
      error:  function(data) {
        alert('Error en el pedido post. ');
        alert(data);
        // Volver a la página de crear encuestas
        window.location.href= appUrl + '/:username/crearEncuesta';
      }
    }); // ajax post
  }); // form

});
