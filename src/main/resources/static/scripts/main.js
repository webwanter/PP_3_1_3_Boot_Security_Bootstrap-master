$(document).ready(function() {
    var activeTab = $('#activeTab').val();
    if (activeTab === 'new-user') {
        $('.nav-tabs a[href="#new-user"]').tab('show');
    }
});

$('#editModal').on('show.bs.modal', function (event) {
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
        url: '/admin/edit/' + id,
        success: function (data) {
            console.log("Данные пользователя: ", data);

            modal.find('.modal-body #idEdit').val(data.id);
            modal.find('.modal-body #firstNameEdit').val(data.firstName);
            modal.find('.modal-body #lastNameEdit').val(data.lastName);
            modal.find('.modal-body #emailEdit').val(data.email);
            modal.find('.modal-body #ageEdit').val(data.age);

            var rolesSelect = modal.find('.modal-body #rolesEdit');
            rolesSelect.empty(); // Очищаем текущие значения

            var allRoles = ['ROLE_ADMIN', 'ROLE_USER'];
            $.each(allRoles, function (index, role) {
                var option = new Option(role.replace('ROLE_', ''), role); // Удаляем ROLE_ для вывода роли в представление
                rolesSelect.append(option);
            });

            // Выбираем текущие роли пользователя
            $.each(data.roles, function (index, userRole) {
                rolesSelect.val(userRole.name); // Выбираем текущие роли
            });
        },
        error: function (error) {
            console.error("Ошибка при загрузке данных пользователя:", error);
        }
    });

    modal.find('#saveButton').on('click', function(event) {
        event.preventDefault(); // Предотвращаем отправку формы по умолчанию

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

        // Валидация
        var errors = {};
        if (!formData.firstName || formData.firstName.trim() === '') {
            errors.firstName = "Поле 'Имя' не должно быть пустым.";
        } else if (formData.firstName.length < 2 || formData.firstName.length > 30) {
            errors.firstName = "Имя должно быть от 2 до 30 символов.";
        }

        if (!formData.lastName || formData.lastName.trim() === '') {
            errors.lastName = "Поле 'Фамилия' не должно быть пустым.";
        } else if (formData.lastName.length < 2 || formData.lastName.length > 30) {
            errors.lastName = "Фамилия должна быть от 2 до 30 символов.";
        }

        if (!formData.email || formData.email.trim() === '') {
            errors.email = "Поле 'Email' не должно быть пустым.";
        } else if (!formData.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            errors.email = "Неправильный формат Email.";
        }



        if (isNaN(formData.age) || formData.age < 0) {
            errors.age = "Возраст должен быть положительным числом.";
        }

        if (roles.length === 0) {
            errors.roles = "Выберите хотя бы одну роль.";
        }

        if (formData.password != null && formData.password.length < 3) {
            errors.password = "Пароль должен быть не менее 3 символов.";
        }

        if (Object.keys(errors).length > 0) {
            // Отображение ошибок
            modal.find('.modal-body .alert').remove();
            $.each(errors, function(field, error) {
                var fieldId = field + 'Error';
                if (field === 'roles') {
                    fieldId = 'rolesError';
                }
                $('#' + fieldId).html('<div class="alert alert-danger">' + error + '</div>');
            });
            console.log(errors);
            return;
        }

        console.log(formData);
        console.log(errors);

        // Если ошибок нет, отправляем форму
        $.ajax({
            type: 'POST',
            url: '/admin/edit',
            data: formData,

            success: function(data) {
                console.log("Данные пользователя обновлены успешно");
                location.reload();
            },
            error: function(error) {
                console.error("Ошибка при обновлении данных пользователя:", error);
            }
        });
    });
});

$('#deleteModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var id = button.data('id');
    var modal = $(this);

    $.ajax({
        type: 'GET',
        url: '/admin/delete/' + id,
        success: function (data) {
            modal.find('#idDelete').val(data.id);
            modal.find('#firstNameDelete').val(data.firstName);
            modal.find('#lastNameDelete').val(data.lastName);
            modal.find('#ageDelete').val(data.age);
            modal.find('#emailDelete').val(data.email);

            var rolesSelect = modal.find('#rolesDelete');
            rolesSelect.empty();

            var allRoles = ['ROLE_ADMIN', 'ROLE_USER'];
            $.each(allRoles, function (index, role) {
                var option = new Option(role.replace('ROLE_', ''), role);
                rolesSelect.append(option);
            });

            $.each(data.roles, function (index, userRole) {
                rolesSelect.val(userRole.name);
            });
        },
        error: function (error) {
            console.error("Ошибка при загрузке данных пользователя:", error);
        }
    });
});

// Обработчик кнопки удаления
$('#deleteButton').on('click', function() {
    var modal = $('#deleteModal');
    var userId = modal.find('#idDelete').val();

    $.ajax({
        type: 'POST', // или 'DELETE', если сервер поддерживает
        url: '/admin/delete',
        data: { id: userId },
        success: function() {
            console.log("Пользователь успешно удалён");
            modal.modal('hide');
            location.reload(); // Обновляем страницу, чтобы увидеть изменения
        },
        error: function(err) {
            console.error("Ошибка при удалении пользователя:", err);
        }
    });
});

