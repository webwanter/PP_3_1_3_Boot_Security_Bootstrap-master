package ru.kata.spring.boot_security.demo.controllers;

import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import ru.kata.spring.boot_security.demo.models.User;
import ru.kata.spring.boot_security.demo.repositories.UserRepository;

import java.security.Principal;
import java.util.Optional;

@Controller
public class UserController  {

    private final UserRepository userRepository;

    @Autowired
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/user")
    public String userProfile(Model model, Principal principal) {
        Optional<User> currentUser = userRepository.findByEmail(principal.getName());
        if (currentUser.isPresent()) {
            model.addAttribute("currentUser", currentUser.get());
        } else {
            // Обработайте случай, когда пользователь не найден
            model.addAttribute("error", "User not found");
        }
        if (currentUser.isEmpty()) {
            return "redirect:/error"; // Перенаправление на страницу ошибки
        }

        return "user";
    }
}
