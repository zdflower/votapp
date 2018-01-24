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
    No sé por qué después de crear la encuesta no se redirige a otra página.
    No entiendo por qué funciona en el caso de borrar una encuesta y acá no.
    Inmediatamente después de mostrar una de las alertas vuelve a la misma página de crear encuesta y sí aparece el mensaje flash de que la encuesta fue creada.
    PARECERÍA SOLUCIONADO:
    Cambios que realicé:
    - en vez del evento submit del formulario usé el evento click del botón de submit
    - después del ajax request usé event.preventDefault()
    Entonces, después de haberse creado con éxito una encuesta, se redirige a la página indicada en la función correspondiente a success.
     */
    $.ajax({
      type: 'POST',
      url: appUrl + '/' + usuario + '/crearEncuesta' ,
      data: datos,
      success: function(data, status){
        alert('¡Encuesta creada, ' + usuario + '!');
        window.location.href= appUrl + '/' + usuario;
      },
      error:  function(data) {
        alert('Status: ' + data.status);
        window.location.href= '/';
      }
    }); // ajax post

    /*$.post(appUrl + '/' + usuario + '/crearEncuesta', datos, function(data, status){
        //alert('Status: ' + status);
        $.get(appUrl + '/' + usuario, function(data) {
          alert('¡Encuesta creada, ' + usuario + '!');
        });
    }); // ajax post*/
    event.preventDefault();
  }); // form

/*
  $('form').on('submit', function(event){
    // Obtengo la pregunta
    let pregunta = $('input[name="pregunta"]').val();
    let usuario = $('input[name="usuario"]').val();
    // Obtengo las opciones
    let opciones = $('input').filter('.opcion').toArray();
    opciones = opciones.map(function(op) { return op.value; });
    let datos = {pregunta: pregunta, opciones: opciones};
    // Hago un pedido post
    // Uso window.location.pathname porque el formulario está en /:username/crearEncuesta y es ahí, con :username reemplazado por el usuario logueado que tenés que ir
    $.ajax(appUrl + '/' + usuario + '/crearEncuesta', {
      type: 'POST',
      data: datos,
      success: function(data, status){
        if (status === 'error') {
          window.location.href='/horror';
        } else {
        // Ir a la página de encuestas
        alert('Voy a la página de encuestas')
          window.location.href='/';
        }
      },
      error:  function(data) {
        // alert('Error en el pedido post. ');
        // alert(data);
        // Volver a la página de crear encuestas
        //window.location.href= appUrl + window.location.pathname;
        alert('Status: ' + data.status);
        window.location.href= appUrl + '/' + usuario
      }
    }); // ajax post
  }); // form
*/
});
