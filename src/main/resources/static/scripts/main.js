$('#exampleModalLong').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Кнопка, вызвавшая модальное окно
    var id = button.data('id'); // Извлекаем значение data-id
    var firstName = button.data('firstName');
    var lastName = button.data('lastName');
    var email = button.data('email');
    var age = button.data('age');

    var modal = $(this); // Определяем переменную modal здесь

    console.log("ID пользователя: ", id);

    $.ajax({
        type: 'GET',
        url: '/dashboard/edit/' + id,
        success: function (data) {
            console.log("Данные пользователя: ", data);

            modal.find('.modal-body #idEdit').val(data.id);
            modal.find('.modal-body #firstNameEdit').val(data.firstName);
            modal.find('.modal-body #lastNameEdit').val(data.lastName);
            modal.find('.modal-body #emailEdit').val(data.email);
            modal.find('.modal-body #ageEdit').val(data.age);

            var rolesSelect = modal.find('.modal-body #rolesEdit');
            rolesSelect.empty(); // Очищаем текущие значения

            $.each(data.roles, function (index, role) {
                var option = new Option(role.name, role.name);
                rolesSelect.append(option);
            });
        },
        error: function (error) {
            console.error("Ошибка при загрузке данных пользователя:", error);
        }
    });

    // Добавьте обработчик для кнопки "Сохранить" в модальном окне
    modal.find('#saveButton').on('click', function() { // Удалите .modal-footer
        var formData = {
            id: modal.find('.modal-body #idEdit').val(),
            firstName: modal.find('.modal-body #firstNameEdit').val(),
            lastName: modal.find('.modal-body #lastNameEdit').val(),
            age: parseInt(modal.find('.modal-body #ageEdit').val()), // Преобразуйте возраст в число
            email: modal.find('.modal-body #emailEdit').val(),
            password: modal.find('.modal-body #passwordEdit').val(),
        };

        var roles = [];
        modal.find('.modal-body #rolesEdit option:selected').each(function() {
            roles.push($(this).val());
        });
        formData.roles = roles.join(',');

        $.ajax({
            type: 'POST',
            url: '/dashboard/edit',
            data: formData,
            success: function(data) {
                console.log("Данные пользователя обновлены успешно");
                // Закройте модальное окно или обновите страницу
            },
            error: function(error) {
                console.error("Ошибка при обновлении данных пользователя:", error);
            }
        });
    });
});
