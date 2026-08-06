import { useEffect, useState } from 'react'
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
  const [lang, setLang] = useState('ko')      // OCR 언어 (ko/ja/zh)
  const [ocrRunning, setOcrRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')      // 알림 메시지
  const [detail, setDetail] = useState(null)  // 상세보기 문서
  const [editing, setEditing] = useState(false)   // 상세 모달 편집 모드 여부
  const [editTitle, setEditTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editOcr, setEditOcr] = useState('')
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark') // 다크 모드 여부

  // 화면 시작 시 문서 목록 불러오기
  const loadDocs = async () => {
    const res = await fetch(`${API}/documents`)
    if (res.ok) setDocs(await res.json())
  }
  useEffect(() => { loadDocs() }, [])

  // 다크 모드 상태 변경 시 body에 반영 + 저장 (마운트 시에도 초기 테마 적용)
  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

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
  }

  // 네이버 CLOVA OCR API 호출 (백엔드에서 이미지 → 텍스트 추출)
  const runOcr = async () => {
    if (!file) return
    setOcrRunning(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/ocr?lang=${lang}`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('OCR 요청이 실패했습니다')
      const text = await res.text()
      setOcrText(text)
      if (!text.trim()) showToast('텍스트가 인식되지 않았어요 😢')
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
        setFile(null); setPreview(null); setTitle(''); setTags(''); setOcrText('')
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

  // 편집 시작: 현재 상세 문서 값으로 입력값 채우기
  const startEdit = () => {
    setEditTitle(detail.title || '')
    setEditTags(detail.tags || '')
    setEditOcr(detail.ocrText || '')
    setEditing(true)
  }

  // 편집 저장
  const saveEdit = async () => {
    const res = await fetch(`${API}/documents/${detail.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, tags: editTags, ocrText: editOcr }),
    })
    if (res.ok) {
      const updated = await res.json()
      setDetail(updated)
      setEditing(false)
      loadDocs()
      showToast('수정 완료 ✏️')
    }
  }

  const fmtDate = (s) => {
    if (!s) return ''
    return new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="app">
      <header className="header">
        <button className="theme-toggle" onClick={() => setDark((d) => !d)}>
          {dark ? '☀️' : '🌙'}
        </button>
        <h1>📄 OCR 문서 스캐너</h1>
        <p>이미지를 업로드하면 텍스트를 자동 추출해서 저장하고 검색할 수 있어요</p>
        <p className="lang-hint">🇰🇷 한국어 · 🇺🇸 영어 인식 지원</p>
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
              <select className="input lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="ko">한국어</option>
              </select>
              <button className="btn btn-primary" onClick={runOcr} disabled={ocrRunning}>
                {ocrRunning ? 'CLOVA OCR 처리 중...' : '🔍 OCR 실행'}
              </button>
              {ocrRunning && <progress max="100" />}
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
        <div className="modal-overlay" onClick={() => { setDetail(null); setEditing(false) }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {editing ? (
              <input className="input edit-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            ) : (
              <h2>{detail.title}</h2>
            )}
            <img src={`${API}/documents/${detail.id}/image`} alt={detail.title} className="modal-img" />
            <div className="modal-meta">{fmtDate(detail.createdAt)} · {detail.fileSize} bytes</div>
            {editing ? (
              <input className="input edit-input" placeholder="태그 (콤마 구분)" value={editTags} onChange={(e) => setEditTags(e.target.value)} />
            ) : (
              detail.tags && (
                <div className="doc-tags">
                  {detail.tags.split(',').map((t) => <span key={t} className="tag">{t.trim()}</span>)}
                </div>
              )
            )}
            <h3>📝 OCR 텍스트</h3>
            {editing ? (
              <textarea className="edit-textarea" rows="8" value={editOcr} onChange={(e) => setEditOcr(e.target.value)} />
            ) : (
              <pre className="ocr-full">{detail.ocrText || '(OCR 텍스트 없음)'}</pre>
            )}
            <div className="modal-actions">
              {editing ? (
                <>
                  <button className="btn btn-save" onClick={saveEdit}>💾 저장</button>
                  <button className="btn" onClick={() => setEditing(false)}>취소</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={startEdit}>✏️ 편집</button>
                  <button className="btn btn-danger" onClick={() => removeDoc(detail.id)}>🗑 삭제</button>
                  <button className="btn" onClick={() => setDetail(null)}>닫기</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
