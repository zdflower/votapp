function esValida(opcion){
  // opción debe ser una cadena de caracteres no vacía de más de 1 carácter y no tener espacios extra
  // sería bueno que no hubiera otra opción igual a la que se quiere agregar.
  // Completar:
  return opcion.trim() !== '';
}

$(document).ready(function(){
  $('#otraOpcion').click(function(){
    let nuevaOpcion = $('input[name="otraOp"]').val();
    if (esValida(nuevaOpcion)){
      // Sacar cualquier mensaje de error que hubiera habido.
      $('#errorVota').empty();
      $('#votarOpciones').append(
        '<div class="form-check">'
          + '<input class="form-check-input" name="op" type="radio" value="' + nuevaOpcion + '">'
          + '<label class="form-check-label">' + nuevaOpcion + '</label>'
        + '</div>'
      );
    } else {
      /* mostrar un mensaje de error */
      $('#errorVota').append(
      '<div class="alert alert-dismissable alert-warning">'
      + '<button type="button" class="close" data-dismiss="alert">&times</button>'
        + '<p>'
        + 'La nueva opción debe tener 2 o más caracteres y menos de 100.'
        +'</p></div>'
      );
    }
    // Me gustaría que se limpiara el texto ingresado
    // $('input[name="otraOp"]').text = '';
  }); // botón #otraOpcion
}); // document.ready
