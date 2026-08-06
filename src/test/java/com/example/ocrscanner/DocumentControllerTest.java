package com.example.ocrscanner;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Base64;

import static org.hamcrest.Matchers.hasEntry;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * DocumentController API 통합 테스트.
 * CLOVA OCR은 @MockitoBean으로 대체해 실제 과금 호출을 막는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentControllerTest {

    // 1x1 투명 PNG 원본 바이트
    private static final byte[] SAMPLE_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ClovaOcrService clovaOcrService;

    private MockMultipartFile sampleFile() {
        return new MockMultipartFile("file", "test.png", "image/png", SAMPLE_PNG);
    }

    /** 문서 하나를 업로드하고 응답 JSON을 반환하는 헬퍼 */
    private JsonNode uploadDocument(String title, String tags) throws Exception {
        String body = mockMvc.perform(multipart("/api/documents")
                        .file(sampleFile())
                        .param("title", title)
                        .param("tags", tags))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    // ① 문서 업로드: 요청한 title이 응답에 그대로 반영되는지 확인
    @Test
    void uploadDocumentTest() throws Exception {
        mockMvc.perform(multipart("/api/documents")
                        .file(sampleFile())
                        .param("title", "업로드테스트")
                        .param("tags", "테스트"))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.title").value("업로드테스트"));
    }

    // ② 전체 목록: 업로드한 문서가 목록에 포함되는지 확인
    @Test
    void listDocumentsTest() throws Exception {
        JsonNode uploaded = uploadDocument("목록테스트", "태그");

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem(hasEntry("id", uploaded.get("id").asInt()))));
    }

    // ③ 상세 조회: 업로드한 문서의 id로 조회했을 때 동일한 id가 반환되는지 확인
    @Test
    void getDocumentDetailTest() throws Exception {
        JsonNode uploaded = uploadDocument("상세조회테스트", "태그");
        long id = uploaded.get("id").asLong();

        mockMvc.perform(get("/api/documents/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    // ④ 검색: 제목에 포함된 키워드로 검색했을 때 해당 문서가 결과에 포함되는지 확인
    @Test
    void searchDocumentsTest() throws Exception {
        String keyword = "고유키워드검색";
        JsonNode uploaded = uploadDocument(keyword + "문서", "태그");

        mockMvc.perform(get("/api/documents/search").param("q", keyword))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem(hasEntry("id", uploaded.get("id").asInt()))));
    }

    // ⑤ 수정: PATCH 요청으로 title/tags를 수정하면 응답에 수정된 값이 반영되는지 확인
    @Test
    void updateDocumentTest() throws Exception {
        JsonNode uploaded = uploadDocument("수정전제목", "수정전태그");
        long id = uploaded.get("id").asLong();

        String patchBody = objectMapper.writeValueAsString(
                new DocumentController.UpdateRequest("수정후제목", "수정후태그", null));

        mockMvc.perform(patch("/api/documents/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patchBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정후제목"))
                .andExpect(jsonPath("$.tags").value("수정후태그"));
    }

    // ⑥ 삭제: DELETE 후 204를 반환하고, 이후 상세 조회는 404를 반환하는지 확인
    @Test
    void deleteDocumentTest() throws Exception {
        JsonNode uploaded = uploadDocument("삭제테스트", "태그");
        long id = uploaded.get("id").asLong();

        mockMvc.perform(delete("/api/documents/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/documents/{id}", id))
                .andExpect(status().isNotFound());
    }
}
