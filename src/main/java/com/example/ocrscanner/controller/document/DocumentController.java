package com.example.ocrscanner.controller.document;

import com.example.ocrscanner.dto.document.DocumentResponse;
import com.example.ocrscanner.service.document.DocumentService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

/**
 * Controller = HTTP 요청의 입구.
 * - 클라이언트(리액트)가 보낸 요청을 받아서 Service에게 일 시키고, 결과를 돌려준다.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    /** ① 문서 업로드: POST /api/documents (multipart/form-data) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentResponse upload(@RequestParam("file") MultipartFile file,
                           @RequestParam(value = "title", required = false) String title,
                           @RequestParam(value = "tags", required = false) String tags,
                           @RequestParam(value = "ocrText", required = false) String ocrText) throws IOException {
        return service.upload(file, title, tags, ocrText);
    }

    /** ② 전체 목록: GET /api/documents */
    @GetMapping
    public List<DocumentResponse> list() {
        return service.findAll();
    }

    /** ②-1 검색: GET /api/documents/search?q=키워드  (목록보다 먼저 선언해야 함) */
    @GetMapping("/search")
    public List<DocumentResponse> search(@RequestParam("q") String q) {
        return service.search(q);
    }

    /** ③ 상세 조회: GET /api/documents/{id} */
    @GetMapping("/{id}")
    public DocumentResponse detail(@PathVariable Long id) {
        return service.findById(id);
    }

    /** ④ 저장된 이미지 보기: GET /api/documents/{id}/image */
    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> image(@PathVariable Long id) throws IOException {
        Path path = service.getFilePath(id);
        Resource resource = new UrlResource(path.toUri());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
    }

    /** ⑤ 삭제: DELETE /api/documents/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws IOException {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** ⑥ 수정: PATCH /api/documents/{id} (JSON body, 필드 전부 선택적) */
    @PatchMapping("/{id}")
    public DocumentResponse update(@PathVariable Long id, @RequestBody UpdateRequest request) {
        return service.update(id, request.title(), request.tags(), request.ocrText());
    }

    /** PATCH 요청 body */
    public record UpdateRequest(String title, String tags, String ocrText) {}
}
