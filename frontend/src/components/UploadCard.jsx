// ── 업로드 + OCR 영역 ──
function UploadCard({
  setFile, preview, setPreview, title, setTitle, tags, setTags,
  ocrText, setOcrText, ocrRunning, runOcr, saveDoc, saving,
}) {
  // 파일 선택 → 미리보기 표시 + 제목 자동 채우기
  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setTitle(f.name.replace(/\.[^.]+$/, ''))
    setOcrText('')
  }

  return (
    <section className="upload-card">
      <h2>📤 새 문서 업로드</h2>
      <div className="upload-row">
        <input type="file" accept="image/*" onChange={onFileChange} />
        {preview && <img className="preview" src={preview} alt="미리보기" />}
      </div>
      {preview && (
        <div className="ocr-area">
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
  )
}

export default UploadCard
