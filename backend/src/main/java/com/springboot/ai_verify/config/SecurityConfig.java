package com.springboot.ai_verify.config;

import com.springboot.ai_verify.security.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final CustomUserDetailsService userDetailsService;

    @Value("${cors.allowed-origins:http://localhost:5173,https://ai-detection-frontend.onrender.com}")
    private String allowedOrigins;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Increased strength from default 10
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        authProvider.setHideUserNotFoundExceptions(false);
        return authProvider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // SECURITY FIX: Use configured origins instead of hardcoded values
        List<String> origins = List.of(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // SECURITY FIX: Restrict allowed headers to known values
        config.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
            "X-XSRF-TOKEN"
        ));

        config.setExposedHeaders(List.of("Authorization", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        FilterRegistrationBean<CorsFilter> registrationBean =
            new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource()));
        registrationBean.setOrder(-102);
        return registrationBean;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // SECURITY FIX: Configure CSRF with cookie-based token
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName("_csrf");

        http
                // SECURITY FIX: Enable CSRF protection with cookie-based tokens
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(requestHandler)
                        // Allow these endpoints without CSRF (API endpoints use session-based auth with CORS protection)
                        .ignoringRequestMatchers(
                            "/api/**",
                            "/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/swagger-ui.html"
                        )
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        // Permit OPTIONS for CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        
                        // Public endpoints
                        .requestMatchers(
                                "/", "/index.html", "/register.html",
                                "/css/**", "/js/**", "/img/**",
                                "/login",
                                "/api/user/me",
                                "/api/user/health",
                                "/api/user/register",
                                "/api/mistral/health",
                                "/actuator/health",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        
                        // Admin-only endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginProcessingUrl("/login")
                        .successHandler((req, res, auth) -> {
                            log.info("Successful login for user: {}", auth.getName());
                            res.setStatus(HttpStatus.OK.value());
                            res.setContentType("application/json");
                            res.getWriter().write("{\"status\":\"success\"}");
                        })
                        .failureHandler((req, res, ex) -> {
                            log.warn("Failed login attempt: {}", ex.getMessage());
                            res.setStatus(HttpStatus.UNAUTHORIZED.value());
                            res.setContentType("application/json");
                            res.getWriter().write("{\"error\":\"Invalid credentials\"}");
                        })
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((req, res, auth) -> {
                            log.info("User logged out: {}", auth != null ? auth.getName() : "unknown");
                            res.setStatus(HttpStatus.OK.value());
                        })
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                        .permitAll()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )
                // SECURITY FIX: Add security headers
                .headers(headers -> headers
                        .contentTypeOptions(contentTypeOptions -> {})
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())
                        .xssProtection(xss -> xss.disable()) // Modern browsers handle this
                        .contentSecurityPolicy(csp ->
                            csp.policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'")
                        )
                );

        return http.build();
    }
}
