# OCR 문서 스캐너 (OCR Scanner)

이미지로 된 문서(영수증, 메모, 스캔본 등)를 업로드하면 브라우저에서 바로 OCR로 텍스트를 추출하고, 서버에 저장해 나중에 검색할 수 있는 문서 관리 애플리케이션입니다.

## 주요 기능

- **이미지 업로드**: 문서 이미지를 업로드하고 제목/태그를 함께 저장
- **OCR 텍스트 추출**: 업로드 시 브라우저에서 [tesseract.js](https://github.com/naptha/tesseract.js)로 한국어+영어 텍스트를 자동 인식
- **검색**: 제목, OCR로 추출된 텍스트, 태그 중 하나라도 키워드가 포함되면 검색 결과에 노출
- **문서 목록/상세/삭제**: 업로드한 문서를 최신순으로 조회, 상세보기, 삭제 가능

## 기술 스택

- **백엔드**: Spring Boot 4.1.0 (Java 25), Spring Data JPA
- **프론트엔드**: React 19, Vite 8, tesseract.js
- **DB**: PostgreSQL 18

## 실행 방법

### 사전 준비

- Java 25, Node.js, PostgreSQL 18이 설치되어 있어야 합니다.
- PostgreSQL에 `ocr_scanner` 데이터베이스를 생성합니다.

```sql
CREATE DATABASE ocr_scanner;
```

- `src/main/resources/application.yml`에서 DB 접속 정보(username/password)를 환경에 맞게 수정합니다.

### 백엔드 실행

```bash
./mvnw spring-boot:run
```

기본적으로 `http://localhost:8080`에서 API가 실행됩니다.

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173`(Vite 기본 포트)에서 접속할 수 있습니다.
