package com.example.ocrscanner.entity.document;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 문서 엔티티 = DB 테이블(document)과 1:1로 매핑되는 클래스.
 * Hibernate가 이 클래스 보고 테이블을 자동 생성한다.
 */
@Getter
@Setter
@Entity
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;        // 문서 제목
    private String fileName;     // 저장된 이미지 파일명
    private String contentType;  // MIME 타입 (image/png 등)
    private long fileSize;       // 파일 크기(바이트)

    @Column(columnDefinition = "TEXT")
    private String ocrText;      // OCR로 추출한 텍스트 (길 수 있으므로 TEXT 타입)

    private String tags;         // 태그 (콤마 구분: "공부,영수증")

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
