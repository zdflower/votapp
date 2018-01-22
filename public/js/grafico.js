$(document).ready(function(){

  /* Gráfico */
  var ctx = document.getElementById("grafico").getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: '# of Votes',
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 153, 0, 0.2)',
          'rgba(104, 222, 110, 0.2)'
        ],
        borderColor: [
          'rgba(255,99,132,1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 153, 0, 1)',
          'rgba(104, 222, 110, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      }
    }
  });

  function updateChart(opciones) {
    // Los colores se podrían agregar y elegir de algún modo al azar
    // Le podría pasar un array de opciones

    // ¿Hace falta resetear labels y datasets?
    // myChart.data.labels = [];
    // myChart.data.datasets[0].data = [];
    for (let i = 0; i < opciones.length; i++) {
      // ¿Y si uso push?
      myChart.data.datasets[0].data[i] = opciones[i].votos;
      myChart.data.labels[i] = opciones[i].op;
    }
    // console.log("Chart data labels:");
    // console.log(myChart.data.labels);
    myChart.update();
  }

  var pregunta = $('#pregunta').attr('pregunta');
  $.getJSON('/api/opciones/' + pregunta, function(data, status){
    updateChart(data);
  });
});
