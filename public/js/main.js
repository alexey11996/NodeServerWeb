$(document).ready(function () {
    $('.delete-cat').on('click', function () {
        var id = $(this).data('id');
        var url = '/delete/' + id;
        if (confirm('Delete Cat?')) {
            $.ajax({
                url: url,
                type: 'DELETE',
                success: function (result) {
                    console.log('Deleting cat..');
                    window.location.href = "/";
                },
                error: function (err) {
                    console.log(err);
            }
            });
        };
    });

    $('.edit-cat').on('click', function () {
        $('#edit-form-name').val($(this).attr('data-name'));
        $('#edit-form-photo').val($(this).attr('data-photo'));
        $('#edit-form-description').val($(this).attr('data-description'));
        $('#edit-form-price').val($(this).attr('data-price'));
        $('#edit-form-id').val($(this).attr('data-id'));   
    });

    $('.makingOrder').on('click', function () {
            alert('Ваш заказ поступил в обработку! Ожидайте звонка менеджера!')
            window.location.href = "/";

    });

    $('.add-to-order').on('click', function () {
        var id = $(this).data('id');
        var petname = $(this).data('petname');
        var url = '/addToOrder/' + id + '/' + petname;
        if (confirm('Add this cat to Order?')) {
            $.ajax({
                url: url,
                type: 'POST',
                success: function (result) {
                    //alert('Added To Order.')
                },
                error: function (err) {
                    console.log(err);
                }
            });
        };
    });

    $('.delete-cat-from-order').on('click', function () {
        var petname = $(this).data('petname');
        var url = '/deleteFromOrder/' + petname;
        if (confirm('Delete Cat From your Order?')) {
            $.ajax({
                url: url,
                type: 'DELETE',
                success: function (result) {
                    window.location.href = "/shoppingCart";
                },
                error: function (err) {
                    console.log(err);
                }
            });
        };
    });

});