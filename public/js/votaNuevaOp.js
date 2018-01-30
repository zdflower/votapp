$(document).ready(function(){
  $('#otraOpcion').click(function(){
    let nuevaOpcion = $('input[name="otraOp"]').val();
    $('#votarOpciones').append(
      '<div class="form-check">'
        + '<input class="form-check-input" name="op" type="radio" value="' + nuevaOpcion + '">'
        + '<label class="form-check-label">' + nuevaOpcion + '</label>'
      + '</div>'
    );
  });
});
