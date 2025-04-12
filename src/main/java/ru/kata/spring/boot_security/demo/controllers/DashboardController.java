package ru.kata.spring.boot_security.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.kata.spring.boot_security.demo.models.Role;
import ru.kata.spring.boot_security.demo.models.User;
import ru.kata.spring.boot_security.demo.services.RoleService;
import ru.kata.spring.boot_security.demo.services.UserService;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@Controller
public class DashboardController {
    private final UserService userService;
    private final RoleService roleService;

    @Autowired
    public DashboardController(UserService userService, RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }


    // Метод для отображения страницы с таблицей пользователей
    @GetMapping("/dashboard")
    public String userList(Model model) {
        model.addAttribute("userForm", new User());
        model.addAttribute("roles", roleService.getAllRoles());
        model.addAttribute("updUser", new User());

        //Получение текущего авторизованного пользователя
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        model.addAttribute("currentUser", currentUser);


        String rolesString = currentUser.getRoles().stream()
                .map(role -> role.getName().substring(5))
                .collect(Collectors.joining(" "));

        List<User> allUsers = userService.allUsers();

        // Обработка ролей для каждого пользователя
        List<User> processedUsers = allUsers.stream()
                .map(user -> {
                    User processedUser = new User();
                    processedUser.setId(user.getId());
                    processedUser.setFirstName(user.getFirstName());
                    processedUser.setLastName(user.getLastName());
                    processedUser.setAge(user.getAge());
                    processedUser.setEmail(user.getEmail());

                    // Обработка ролей
                    Set<Role> processedRoles = user.getRoles().stream()
                            .map(role -> new Role(role.getName().substring(5))) // Удаление префикса ROLE_
                            .collect(Collectors.toSet());
                    processedUser.setRoles(processedRoles);

                    return processedUser;
                })
                .collect(Collectors.toList());

        model.addAttribute("rolesString", rolesString);
        model.addAttribute("allUsers", userService.allUsers());

        return "dashboard";
    }

    // Метод для удаления пользователя
    @PostMapping("/dashboard/delete")
    public String deleteUser(@RequestParam("userId") Long userId, Model model) {
        userService.deleteUser(userId);
        return "redirect:dashboard";
    }

    @GetMapping("/dashboard/new_user")
    public String addUser(Model model) {
        model.addAttribute("userForm", new User());
        model.addAttribute("roles", roleService.getAllRoles());
        return "dashboard";
    }

    // Метод для добавления нового пользователя
    @PostMapping("/dashboard/new_user")
    public String addUser(
            @ModelAttribute("userForm") @Valid User userForm,
            @RequestParam("roles") List<String> roles,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("allUsers", userService.allUsers());
            return "dashboard";
        }

        Set<Role> roleSet = roles.stream()
                .map(roleService::getRoleByName)
                .collect(Collectors.toSet());

        userForm.setRoles(roleSet);

        if (!userService.saveUser(userForm)) {
            model.addAttribute("usernameError", "Пользователь с таким именем уже существует");
            model.addAttribute("allUsers", userService.allUsers());
            return "dashboard";
        }

        return "redirect:/dashboard";
    }

    @GetMapping("/dashboard/edit/{id}")
    @ResponseBody
    public User editUser(@PathVariable Long id) {
        User updUser = userService.findUserById(id);
        if (updUser == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден");
        }
        return updUser;
    }

    // Метод для обновления пользователя (POST-запрос)
    @PostMapping("/dashboard/edit")
    public String updateUser(@RequestParam("id") Long id,
                             @RequestParam("firstName") String firstName,
                             @RequestParam("lastName") String lastName,
                             @RequestParam("age") Integer age,
                             @RequestParam("email") String email,
                             @RequestParam("password") String password,
                             @RequestParam("roles") String roles,
                             Model model) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new AccessDeniedException("Доступ запрещен");
        }


        User updUser = userService.findUserById(id);
        if (updUser == null) {
            model.addAttribute("error", "Пользователь с ID " + id + " не найден");
            return "dashboard";
        }

        updUser.setId(id);
        updUser.setFirstName(firstName);
        updUser.setLastName(lastName);
        updUser.setAge(age);
        updUser.setEmail(email);
        if (password != null && !password.isEmpty()) {
            updUser.setPassword(password);
        }

        // Преобразование строк ролей в объекты Role
        Set<Role> rolesSet = Arrays.stream(roles.split(","))
                .map(roleName -> new Role(roleName.trim())) // Создание объекта Role из строки
                .collect(Collectors.toSet());

        Set<Role> roleSet =  Arrays.stream(roles.split(","))
                .map(roleService::getRoleByName)
                .collect(Collectors.toSet());


        updUser.setRoles(roleSet);


        userService.updateUser(updUser);
        return "redirect:/dashboard";
    }


}

