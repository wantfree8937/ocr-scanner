import { useEffect, useState } from 'react'
import './App.css'
import { API } from './api'
import UploadCard from './components/UploadCard'
import DocumentList from './components/DocumentList'
import DocumentModal from './components/DocumentModal'

const PAGE_SIZE = 12 // 한 페이지당 문서 수

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
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')      // 알림 메시지
  const [detail, setDetail] = useState(null)  // 상세보기 문서
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark') // 다크 모드 여부
  const [activeTag, setActiveTag] = useState(null) // 선택된 태그 필터 (null이면 전체)
  const [page, setPage] = useState(1) // 현재 페이지

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

  // 네이버 CLOVA OCR API 호출 (백엔드에서 이미지 → 텍스트 추출)
  const runOcr = async () => {
    if (!file) return
    setOcrRunning(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/ocr`, { method: 'POST', body: form })
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
    setPage(1)
    if (!query.trim()) return loadDocs()
    const res = await fetch(`${API}/documents/search?q=${encodeURIComponent(query)}`)
    if (res.ok) setDocs(await res.json())
  }

  // 상세 모달에서 삭제 완료 시 호출
  const onDocDeleted = () => {
    showToast('삭제 완료')
    setDetail(null)
    loadDocs()
  }

  // 상세 모달에서 수정 완료 시 호출
  const onDocUpdated = (updated) => {
    setDetail(updated)
    loadDocs()
    showToast('수정 완료 ✏️')
  }

  // 전체 태그 목록 (중복 제거)
  const allTags = [...new Set(
    docs.flatMap((d) => (d.tags ? d.tags.split(',').map((t) => t.trim()) : []).filter(Boolean))
  )]

  // 태그 필터가 적용된 문서 목록
  const visibleDocs = activeTag
    ? docs.filter((d) => d.tags && d.tags.split(',').map((t) => t.trim()).includes(activeTag))
    : docs

  // 페이지네이션: 전체 페이지 수 계산 + 현재 페이지에 보여줄 문서만 잘라내기
  const totalPages = Math.max(1, Math.ceil(visibleDocs.length / PAGE_SIZE))
  const pagedDocs = visibleDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 필터링 결과로 페이지 범위를 벗어나면 마지막 페이지로 자동 조정
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

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
        <UploadCard
          file={file} setFile={setFile}
          preview={preview} setPreview={setPreview}
          title={title} setTitle={setTitle}
          tags={tags} setTags={setTags}
          ocrText={ocrText} setOcrText={setOcrText}
          ocrRunning={ocrRunning} runOcr={runOcr}
          saveDoc={saveDoc} saving={saving}
        />

        <DocumentList
          visibleDocs={visibleDocs} pagedDocs={pagedDocs}
          allTags={allTags} activeTag={activeTag} setActiveTag={setActiveTag}
          query={query} setQuery={setQuery} onSearch={search}
          page={page} totalPages={totalPages} setPage={setPage}
          onOpenDetail={setDetail}
        />
      </main>

      {detail && (
        <DocumentModal
          detail={detail}
          onClose={() => setDetail(null)}
          onDeleted={onDocDeleted}
          onUpdated={onDocUpdated}
        />
      )}
    </div>
  )
}

export default App
