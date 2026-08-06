package com.example.ocrscanner.dto.document;

import java.time.LocalDateTime;

/** 문서 조회/응답용 DTO. Entity를 그대로 노출하지 않기 위해 사용한다. */
public record DocumentResponse(
        Long id,
        String title,
        String tags,
        String ocrText,
        LocalDateTime createdAt,
        long fileSize
) {
}
