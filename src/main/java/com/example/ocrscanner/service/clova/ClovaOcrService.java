package com.example.ocrscanner.service.clova;

import com.example.ocrscanner.config.ClovaOcrProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 네이버 CLOVA OCR API를 호출해 이미지에서 텍스트를 추출하는 서비스.
 */
@Service
public class ClovaOcrService {

    private final RestClient restClient = RestClient.builder().build();
    private final ClovaOcrProperties properties;

    public ClovaOcrService(ClovaOcrProperties properties) {
        this.properties = properties;
    }

    /**
     * 이미지 파일을 base64로 인코딩해 CLOVA OCR API에 전달하고,
     * 인식된 텍스트 조각(inferText)들을 공백으로 이어붙여 반환한다.
     * language에 해당하는 도메인이 없으면 'ko'로 폴백한다.
     */
    public String extractText(MultipartFile file, String language) throws IOException {
        Map<String, String> config = properties.getLanguages().get(language);
        if (config == null) {
            config = properties.getLanguages().get("ko");
        }

        String invokeUrl = config.get("invoke-url");
        String secretKey = config.get("secret-key");
        if (secretKey == null || secretKey.isBlank() || invokeUrl == null || invokeUrl.isBlank()) {
            throw new RuntimeException("해당 언어(" + language + ")의 CLOVA OCR API 키가 설정되지 않았습니다");
        }

        String requestId = UUID.randomUUID().toString();
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

        Map<String, Object> image = new LinkedHashMap<>();
        image.put("format", "png");
        image.put("name", requestId);
        image.put("data", base64Image);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("version", "V2");
        requestBody.put("requestId", requestId);
        requestBody.put("timestamp", System.currentTimeMillis());
        requestBody.put("images", List.of(image));

        JsonNode response = restClient.post()
                .uri(invokeUrl)
                .header("X-OCR-SECRET", secretKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(JsonNode.class);

        JsonNode fields = response.path("images").path(0).path("fields");
        List<String> texts = new ArrayList<>();
        for (JsonNode field : fields) {
            texts.add(field.path("inferText").asText());
        }
        return String.join(" ", texts);
    }
}
