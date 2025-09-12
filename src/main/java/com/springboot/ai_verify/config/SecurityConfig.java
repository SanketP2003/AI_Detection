package com.springboot.ai_verify.config;

import com.springboot.ai_verify.security.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authenticationProvider(authenticationProvider())
            .authorizeHttpRequests(authorize ->
                authorize
                    // Allow public access to static resources, landing pages, and API endpoints needed for UI state
                    .requestMatchers(
                        "/", "/index.html", "/register.html", 
                        "/home.html", 
                        "/css/**", "/js/**", "/img/**",
                        "/api/user/me"
                    ).permitAll()
                    // All other requests must be authenticated
                    .anyRequest().authenticated()
            )
            .formLogin(formLogin ->
                formLogin
                    .loginProcessingUrl("/login")
                    // On success, return 200 OK. The client will handle the redirect.
                    .successHandler((request, response, authentication) -> response.setStatus(HttpStatus.OK.value()))
                    // On failure, return 401 Unauthorized. The client will handle the error message.
                    .failureHandler((request, response, exception) -> response.setStatus(HttpStatus.UNAUTHORIZED.value()))
                    .permitAll()
            )
            .logout(logout ->
                logout
                    .logoutUrl("/logout")
                    .logoutSuccessUrl("/index.html")
                    .permitAll()
            )
            .exceptionHandling(exception -> 
                // For unauthenticated API requests, return 401 instead of redirecting to login page
                exception.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
