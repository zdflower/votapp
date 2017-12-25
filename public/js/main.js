$(document).ready(function(){
	$('.delete-article').on('click', function(e){
		$target = $(e.target);
		//console.log($target.attr('data-id'));
		const id = $target.attr('data-id');

		//ajax request
		$.ajax({
			type: 'DELETE',
			url: '/article/' + id,
			success: function(){
				alert('Deleting article');
				//redirect to homepage
				window.location.href='/';
			},
			error: function(err){
				console.log(err);
			}
		});
	});
});