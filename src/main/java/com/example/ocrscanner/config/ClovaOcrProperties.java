package com.example.ocrscanner.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * application.yml의 clova.ocr.languages.{lang}.invoke-url / secret-key 값을 언어별로 바인딩한다.
 * YAML 맵은 @Value("#{${...}}")로 통째로 읽을 수 없어 @ConfigurationProperties를 사용한다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "clova.ocr")
public class ClovaOcrProperties {

    private Map<String, Map<String, String>> languages = new HashMap<>();
}
