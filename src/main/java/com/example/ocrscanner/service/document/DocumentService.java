package com.example.ocrscanner.service.document;

import com.example.ocrscanner.dto.document.DocumentResponse;
import com.example.ocrscanner.entity.document.Document;
import com.example.ocrscanner.exception.DocumentNotFoundException;
import com.example.ocrscanner.repository.document.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Service = 비즈니스 로직 담당.
 * Controller(요청 받기)와 Repository(DB 저장) 사이에서 실제 일을 처리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DocumentService {

    private final DocumentRepository repository;

    // application.yml의 app.upload-dir 값을 여기에 주입
    @Value("${app.upload-dir}")
    private String uploadDir;

    /**
     * 이미지 업로드 처리
     * 1) 파일을 uploads 폴더에 저장
     * 2) 파일 정보(메타데이터) + OCR 텍스트를 DB에 저장
     */
    public DocumentResponse upload(MultipartFile file, String title, String tags, String ocrText) throws IOException {
        // 0. 업로드 파일 검증
        if (file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다");
        }

        // 1. uploads 폴더가 없으면 생성
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        // 2. 파일명 충돌 방지: UUID(랜덤 문자열) + 원본 파일명
        String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path targetPath = dir.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // 3. DB에 저장할 Document 객체 생성
        Document doc = new Document();
        doc.setTitle(title != null && !title.isBlank() ? title : file.getOriginalFilename());
        doc.setFileName(storedFileName);
        doc.setContentType(contentType);
        doc.setFileSize(file.getSize());
        doc.setTags(tags);
        doc.setOcrText(ocrText);

        // 4. DB에 저장하고, id가 채워진 결과를 반환
        return toResponse(repository.save(doc));
    }

    /** 전체 문서 목록 (최신순) */
    public List<DocumentResponse> findAll() {
        return repository.findAll().reversed().stream().map(this::toResponse).toList();
    }

    /** id로 문서 1개 조회 */
    public DocumentResponse findById(Long id) {
        return toResponse(findDocumentById(id));
    }

    /** 문서 수정: null이 아닌 필드만 반영 */
    public DocumentResponse update(Long id, String title, String tags, String ocrText) {
        Document doc = findDocumentById(id);
        if (title != null) doc.setTitle(title);
        if (tags != null) doc.setTags(tags);
        if (ocrText != null) doc.setOcrText(ocrText);
        return toResponse(repository.save(doc));
    }

    /** 문서 삭제 (DB + 저장된 파일까지) */
    public void delete(Long id) throws IOException {
        Document doc = findDocumentById(id);

        // 저장된 이미지 파일 삭제
        Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(doc.getFileName());
        Files.deleteIfExists(filePath);

        // DB에서 삭제
        repository.delete(doc);
    }

    /** 저장된 이미지 파일의 실제 경로 반환 */
    public Path getFilePath(Long id) {
        Document doc = findDocumentById(id);
        return Paths.get(uploadDir).toAbsolutePath().normalize().resolve(doc.getFileName());
    }

    /**
     * 검색: 제목 / OCR 텍스트 / 태그 중 하나라도 키워드를 포함하면 반환
     */
    public List<DocumentResponse> search(String keyword) {
        return repository
                .findByTitleContainingIgnoreCaseOrOcrTextContainingIgnoreCaseOrTagsContainingIgnoreCase(
                        keyword, keyword, keyword)
                .reversed().stream().map(this::toResponse).toList();
    }

    /** id로 Document 엔티티를 조회 (내부용) */
    private Document findDocumentById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException("문서를 찾을 수 없습니다: " + id));
    }

    /** Document 엔티티를 응답 DTO로 변환 */
    private DocumentResponse toResponse(Document doc) {
        return new DocumentResponse(
                doc.getId(), doc.getTitle(), doc.getTags(), doc.getOcrText(), doc.getCreatedAt(), doc.getFileSize());
    }
}
