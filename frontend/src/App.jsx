import { useEffect, useState } from 'react'
import Tesseract from 'tesseract.js'
import './App.css'

// 백엔드(Spring Boot) 주소
const API = 'http://localhost:8080/api'

function App() {
  // ── 상태(state)들: 화면에 표시되는 모든 데이터 ──
  const [docs, setDocs] = useState([])        // 문서 목록
  const [query, setQuery] = useState('')      // 검색어
  const [file, setFile] = useState(null)      // 선택한 파일
  const [preview, setPreview] = useState(null) // 이미지 미리보기 URL
  const [title, setTitle] = useState('')      // 제목 입력
  const [tags, setTags] = useState('')        // 태그 입력
  const [ocrText, setOcrText] = useState('')  // OCR 결과 텍스트
  const [ocrRunning, setOcrRunning] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')      // 알림 메시지
  const [detail, setDetail] = useState(null)  // 상세보기 문서

  // 화면 시작 시 문서 목록 불러오기
  const loadDocs = async () => {
    const res = await fetch(`${API}/documents`)
    if (res.ok) setDocs(await res.json())
  }
  useEffect(() => { loadDocs() }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // 파일 선택 → 미리보기 표시 + 제목 자동 채우기
  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setTitle(f.name.replace(/\.[^.]+$/, ''))
    setOcrText('')
    setOcrProgress(0)
  }

  // Tesseract.js로 OCR 실행 (브라우저에서 이미지 → 텍스트)
  const runOcr = async () => {
    if (!preview) return
    setOcrRunning(true)
    setOcrProgress(0)
    try {
      const { data } = await Tesseract.recognize(preview, 'kor+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100))
        },
      })
      setOcrText(data.text)
      if (!data.text.trim()) showToast('텍스트가 인식되지 않았어요 😢')
    } catch (err) {
      console.error(err)
      showToast('OCR 실행 실패: ' + err.message)
    } finally {
      setOcrRunning(false)
    }
  }

  // 백엔드에 저장 (이미지 + 제목 + 태그 + OCR 텍스트)
  const saveDoc = async () => {
    if (!file) return
    setSaving(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('tags', tags)
      form.append('ocrText', ocrText)
      const res = await fetch(`${API}/documents`, { method: 'POST', body: form })
      if (res.ok) {
        showToast('저장 완료! 🎉')
        setFile(null); setPreview(null); setTitle(''); setTags(''); setOcrText(''); setOcrProgress(0)
        loadDocs()
      }
    } finally {
      setSaving(false)
    }
  }

  // 검색
  const search = async () => {
    if (!query.trim()) return loadDocs()
    const res = await fetch(`${API}/documents/search?q=${encodeURIComponent(query)}`)
    if (res.ok) setDocs(await res.json())
  }

  // 삭제
  const removeDoc = async (id) => {
    if (!window.confirm('이 문서를 삭제할까요?')) return
    const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('삭제 완료')
      setDetail(null)
      loadDocs()
    }
  }

  const fmtDate = (s) => {
    if (!s) return ''
    return new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📄 OCR 문서 스캐너</h1>
        <p>이미지를 업로드하면 텍스트를 자동 추출해서 저장하고 검색할 수 있어요</p>
      </header>

      {toast && <div className="toast">{toast}</div>}

      <main className="main">
        {/* ── 업로드 영역 ── */}
        <section className="upload-card">
          <h2>📤 새 문서 업로드</h2>
          <div className="upload-row">
            <input type="file" accept="image/*" onChange={onFileChange} />
            {preview && <img className="preview" src={preview} alt="미리보기" />}
          </div>
          {preview && (
            <div className="ocr-area">
              <button className="btn btn-primary" onClick={runOcr} disabled={ocrRunning}>
                {ocrRunning ? `OCR 인식 중... ${ocrProgress}%` : '🔍 OCR 실행'}
              </button>
              {ocrRunning && <progress value={ocrProgress} max="100" />}
              <textarea
                className="ocr-result"
                rows="5"
                placeholder="OCR 결과 텍스트가 여기에 표시됩니다"
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
              />
              <div className="field-row">
                <input className="input" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className="input" placeholder="태그 (콤마 구분)" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <button className="btn btn-save" onClick={saveDoc} disabled={saving}>
                {saving ? '저장 중...' : '💾 저장하기'}
              </button>
            </div>
          )}
        </section>

        {/* ── 검색 + 목록 영역 ── */}
        <section className="list-section">
          <div className="search-row">
            <input
              className="input search-input"
              placeholder="🔎 제목·태그·내용 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <button className="btn btn-primary" onClick={search}>검색</button>
          </div>
          <div className="doc-grid">
            {docs.length === 0 && <p className="empty">저장된 문서가 없어요. 첫 문서를 업로드해보세요! 📄</p>}
            {docs.map((d) => (
              <div key={d.id} className="doc-card" onClick={() => setDetail(d)}>
                <img src={`${API}/documents/${d.id}/image`} alt={d.title} className="doc-thumb" />
                <div className="doc-info">
                  <div className="doc-title">{d.title}</div>
                  <div className="doc-meta">{fmtDate(d.createdAt)}</div>
                  {d.tags && (
                    <div className="doc-tags">
                      {d.tags.split(',').map((t) => <span key={t} className="tag">{t.trim()}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── 상세 모달 ── */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{detail.title}</h2>
            <img src={`${API}/documents/${detail.id}/image`} alt={detail.title} className="modal-img" />
            <div className="modal-meta">{fmtDate(detail.createdAt)} · {detail.fileSize} bytes</div>
            {detail.tags && (
              <div className="doc-tags">
                {detail.tags.split(',').map((t) => <span key={t} className="tag">{t.trim()}</span>)}
              </div>
            )}
            <h3>📝 OCR 텍스트</h3>
            <pre className="ocr-full">{detail.ocrText || '(OCR 텍스트 없음)'}</pre>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => removeDoc(detail.id)}>🗑 삭제</button>
              <button className="btn" onClick={() => setDetail(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
