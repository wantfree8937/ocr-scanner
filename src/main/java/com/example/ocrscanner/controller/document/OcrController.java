package com.example.ocrscanner.controller.document;

import com.example.ocrscanner.service.clova.ClovaOcrService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/** OCR 실행 전용 컨트롤러. */
@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    private final ClovaOcrService clovaOcrService;

    public OcrController(ClovaOcrService clovaOcrService) {
        this.clovaOcrService = clovaOcrService;
    }

    /** OCR 실행: POST /api/ocr (multipart/form-data, CLOVA OCR API 호출, lang: ko/ja/zh) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String ocr(@RequestParam("file") MultipartFile file,
                       @RequestParam(value = "lang", defaultValue = "ko") String lang) throws IOException {
        return clovaOcrService.extractText(file, lang);
    }
}
