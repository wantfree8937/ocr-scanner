# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 안내 문서입니다.

## 프로젝트 구조

문서 이미지를 업로드하고 OCR로 텍스트를 추출/검색하는 애플리케이션. 백엔드와 프론트엔드가 분리된 구조입니다.

```
ocr-scanner/
├── src/main/java/com/example/ocrscanner/   # Spring Boot 백엔드
│   ├── OcrScannerApplication.java          # 앱 진입점
│   ├── controller/document/                # Controller (HTTP 요청 처리)
│   │   ├── DocumentController.java         # 문서 CRUD API
│   │   └── OcrController.java              # CLOVA OCR 실행 API
│   ├── service/document/DocumentService.java   # 비즈니스 로직
│   ├── service/clova/ClovaOcrService.java      # CLOVA OCR 연동
│   ├── repository/document/DocumentRepository.java  # Repository (JPA, DB 접근)
│   ├── entity/document/Document.java       # Entity (document 테이블 매핑)
│   ├── dto/document/DocumentResponse.java  # API 응답 DTO
│   ├── config/                             # CORS, CLOVA 설정
│   └── exception/                          # 전역 예외 처리
├── src/main/resources/application.yml      # DB/서버 설정
├── frontend/                               # React + Vite 프론트엔드
│   └── src/
│       ├── App.jsx                         # 상태 관리 + 조립
│       └── components/document/            # UploadCard/DocumentList/DocumentModal
└── uploads/                                # 업로드된 이미지 저장 폴더 (런타임 생성)
```

**기술 스택**
- 백엔드: Spring Boot 4.1.0, Java 25, Spring Data JPA, PostgreSQL 18
- 프론트엔드: React 19 + Vite 8, OCR은 백엔드에서 네이버 CLOVA OCR API로 처리
- lint: oxlint

## 실행 명령어

```bash
# 백엔드 (기본 포트 8080), PostgreSQL이 localhost:5432/ocr_scanner 로 떠 있어야 함
./mvnw spring-boot:run

# 프론트엔드 (Vite dev server)
cd frontend
npm install
npm run dev

# 프론트엔드 lint / build
npm run lint
npm run build
```

DB 접속 정보는 `src/main/resources/application.yml`에 있음 (기본: `postgres`/`postgres`).

## 코드 규칙

- 주석은 한국어로 작성한다 (기존 코드 스타일을 따를 것).
- 백엔드는 3계층 구조를 따른다: **Controller → Service → Repository**
  - Controller: HTTP 요청/응답만 처리, 로직은 Service에 위임
  - Service: 비즈니스 로직 (파일 저장, 검색 조건 등)
  - Repository: Spring Data JPA 인터페이스, DB 접근만 담당
- Entity(`Document`)에 비즈니스 로직을 넣지 않는다.
- 업로드 파일명은 `UUID_원본파일명` 형태로 저장해 충돌을 방지한다 (`DocumentService.upload`).

## API 목록

Base path: `/api/documents`

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/documents` | 문서 업로드 (multipart/form-data: file, title, tags, ocrText) |
| GET | `/api/documents` | 전체 문서 목록 (최신순) |
| GET | `/api/documents/search?q=키워드` | 제목/OCR텍스트/태그 검색 |
| GET | `/api/documents/{id}` | 문서 상세 조회 |
| GET | `/api/documents/{id}/image` | 저장된 원본 이미지 조회 |
| PATCH | `/api/documents/{id}` | 문서 수정 (JSON: title/tags/ocrText, 선택적) |
| DELETE | `/api/documents/{id}` | 문서 삭제 (DB + 저장 파일) |
| POST | `/api/ocr` | CLOVA OCR 실행 (multipart: file, lang 기본 ko) |

OCR 텍스트 추출은 백엔드의 ClovaOcrService가 네이버 CLOVA OCR API를 호출해 수행하고, 결과 텍스트를 업로드/수정 요청에 함께 담아 저장한다.
