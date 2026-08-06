import { API } from '../api'

const fmtDate = (s) => {
  if (!s) return ''
  return new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

// ── 검색 + 태그필터 + 목록 + 페이지네이션 영역 ──
function DocumentList({
  visibleDocs, pagedDocs, allTags, activeTag, setActiveTag,
  query, setQuery, onSearch, page, totalPages, setPage, onOpenDetail,
}) {
  return (
    <section className="list-section">
      <p className="doc-count">📄 총 {visibleDocs.length}개 문서</p>
      <div className="search-row">
        <input
          className="input search-input"
          placeholder="🔎 제목·태그·내용 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        <button className="btn btn-primary" onClick={onSearch}>검색</button>
      </div>
      {allTags.length > 0 && (
        <div className="tag-filter">
          {allTags.map((t) => (
            <button
              key={t}
              className={`filter-chip${activeTag === t ? ' active' : ''}`}
              onClick={() => { setActiveTag((cur) => (cur === t ? null : t)); setPage(1) }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="doc-grid">
        {visibleDocs.length === 0 && <p className="empty">저장된 문서가 없어요. 첫 문서를 업로드해보세요! 📄</p>}
        {pagedDocs.map((d) => (
          <div key={d.id} className="doc-card" onClick={() => onOpenDetail(d)}>
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
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>◀ 이전</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn${p === page ? ' active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>다음 ▶</button>
        </div>
      )}
    </section>
  )
}

export default DocumentList
