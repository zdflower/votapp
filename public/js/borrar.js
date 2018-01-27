$(document).ready(function(){
  // A todos los botones de la clase borrar_encuesta le agrego el manejo de evento de click:
  $('.borrar_encuesta').on('click', function(e){
    //e.target va a ser el botón que se cliqueó.
    var boton = $(e.target);
    // Si tiene éxito vuelve a la página del usuario
    $.ajax({
      type:'DELETE',
      url: boton.attr('data-id'),
      success: function(res){
        window.location.href= window.location.origin + window.location.pathname;
      },
      error: function(err){
        console.log(err);
        window.location.href='/';
      }
    });
  });
});
// Ver tutorial Node.js & Express from Scratch
// Ver también https://github.com/bocoup/jqfundamentals.com
