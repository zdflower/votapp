$(document).ready(function(){
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
      $(this).parent().parent().parent().remove();
      // console.log("cantOpciones: " + cantOpciones);
    });
  });
});
