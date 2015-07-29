$(document).ready(function () {
    $('input[name="birthDate"]').on('focus, hover', function () {
        $('input[name="birthDate"]').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            format: 'DD/MM/YYYY'
        });
    });
});
