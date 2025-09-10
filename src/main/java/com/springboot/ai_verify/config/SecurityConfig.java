package com.springboot.ai_verify.config;

import com.springboot.ai_verify.security.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize ->
                authorize
                    // Allow public access to the login page, static resources, etc.
                    .requestMatchers("/", "/index.html", "/register.html", "/css/**", "/js/**", "/img/**").permitAll()
                    // Allow access to register endpoint
                    .requestMatchers("/register").permitAll()
                    // The /login path is for processing the form, not a page view
                    .requestMatchers("/login").permitAll()
                    // Restrict admin pages
                    .requestMatchers("/admin.html", "/users/**").hasRole("ADMIN")
                    // All other requests must be authenticated
                    .anyRequest().authenticated()
            )
            .formLogin(formLogin ->
                formLogin
                    // The login page is served at the root and at /index.html
                    .loginPage("/index.html")
                    // The login form must POST to /login
                    .loginProcessingUrl("/login")
                    // On success, go to the home page
                    .defaultSuccessUrl("/home.html", true)
                    // On failure, go back to the login page with an error flag
                    .failureUrl("/index.html?error=true")
                    .permitAll()
            )
            .logout(logout ->
                logout
                    .logoutUrl("/logout")
                    .logoutSuccessUrl("/index.html?logout=true")
                    .permitAll()
            )
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendRedirect("/index.html?error=" + authException.getMessage());
                })
            );
        return http.build();
    }
}
