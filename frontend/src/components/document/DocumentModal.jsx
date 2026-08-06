import { useState } from 'react'
import { API } from '../../api'

const fmtDate = (s) => {
  if (!s) return ''
  return new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

// ── 상세 + 편집 모달 ──
function DocumentModal({ detail, onClose, onDeleted, onUpdated }) {
  const [editing, setEditing] = useState(false) // 상세 모달 편집 모드 여부
  const [editTitle, setEditTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editOcr, setEditOcr] = useState('')

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
      setEditing(false)
      onUpdated(updated)
    }
  }

  // 삭제
  const removeDoc = async () => {
    if (!window.confirm('이 문서를 삭제할까요?')) return
    const res = await fetch(`${API}/documents/${detail.id}`, { method: 'DELETE' })
    if (res.ok) onDeleted()
  }

  return (
    <div className="modal-overlay" onClick={() => { onClose(); setEditing(false) }}>
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
              <button className="btn btn-danger" onClick={removeDoc}>🗑 삭제</button>
              <button className="btn" onClick={onClose}>닫기</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentModal
