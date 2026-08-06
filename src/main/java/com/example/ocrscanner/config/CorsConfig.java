package com.example.ocrscanner.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS 설정.
 * 리액트 개발 서버(http://localhost:5173)에서 오는 요청을 허용한다.
 * (포트가 다른 서버끼리 통신할 때 브라우저가 막는 걸 풀어주는 설정)
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://192.168.45.163:5173")
                .allowedMethods("GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS")
                .allowedHeaders("*");
    }
}
