package com.example.ocrscanner.repository.document;

import com.example.ocrscanner.entity.document.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository = DB 접근 계층.
 * JpaRepository<Document, Long> 를 상속하면
 * 저장(save), 조회(findAll, findById), 삭제(delete) 등의 기본 메서드를 공짜로 쓸 수 있다.
 */
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // 제목 OR OCR텍스트 OR 태그 중 하나라도 키워드를 포함하면 찾기 (검색 기능)
    List<Document> findByTitleContainingIgnoreCaseOrOcrTextContainingIgnoreCaseOrTagsContainingIgnoreCase(
            String titleKeyword, String ocrKeyword, String tagsKeyword);
}
