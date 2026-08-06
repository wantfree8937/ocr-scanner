package com.example.ocrscanner;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 첫 번째 테스트 컨트롤러.
 * - @RestController : 이 클래스가 HTTP 요청을 처리하는 컨트롤러임을 알려줌
 * - @GetMapping("/api/hello") : GET 방식으로 /api/hello 주소가 오면 이 메서드 실행
 */
@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public String hello() {
        return "안녕하세요! OCR 스캐너 백엔드 서버입니다.";
    }
}
