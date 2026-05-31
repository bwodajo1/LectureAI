import { useState, useRef, useCallback } from "react";

const API_BASE = "/api";

export default function App() {
  const [content, setContent] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [tab, setTab] = useState("upload");
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback((file) => {
    if (file && file.type === "application/pdf") {
      setContent({ type: "pdf", file });
      setFileName(file.name);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  if (content) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 22 }}>📖</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>LectureAI</h1>
        </div>
        <div style={{ padding: "12px 16px", background: "#f5f5f3", borderRadius: 8, border: "0.5px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#666" }}>
            {fileName ? `📄 ${fileName}` : "✏️ Pasted text"}
          </span>
          <button onClick={() => { setContent(null); setFileName(null); }}
            style={{ fontSize: 12, color: "#999", background: "none", border: "none", cursor: "pointer" }}>
            Change ×
          </button>
        </div>
        <p style={{ marginTop: 40, color: "#999", textAlign: "center" }}>Results coming in the next commit...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 1rem" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>📖</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>LectureAI</h1>
          <span style={{ fontSize: 13, color: "#999" }}>AI Study Companion</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
          Upload lecture slides or paste notes to get summaries, flashcards, and quizzes.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["upload", "paste"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 20px", borderRadius: 8, border: tab === t ? "2px solid #3b82f6" : "0.5px solid #ddd", background: tab === t ? "#eff6ff" : "white", color: tab === t ? "#2563eb" : "#555", fontWeight: tab === t ? 500 : 400, cursor: "pointer", fontSize: 14 }}>
            {t === "upload" ? "📄 PDF Upload" : "✏️ Paste Text"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{ border: `2px dashed ${dragging ? "#3b82f6" : "#ccc"}`, borderRadius: 12, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: dragging ? "#eff6ff" : "#fafaf9", transition: "all 0.15s ease" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <p style={{ fontWeight: 500, margin: "0 0 4px" }}>Drop your PDF here or click to browse</p>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Lecture slides, notes, readings — any PDF works</p>
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Paste your lecture notes here..."
            style={{ width: "100%", height: 220, resize: "vertical", padding: "14px 16px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 14, lineHeight: 1.6, fontFamily: "system-ui", boxSizing: "border-box" }} />
          <button onClick={() => text.trim() && setContent({ type: "text", text })}
            disabled={!text.trim()}
            style={{ marginTop: 10, padding: "10px 24px", borderRadius: 8, border: "0.5px solid #ddd", background: text.trim() ? "#eff6ff" : "#f5f5f5", color: text.trim() ? "#2563eb" : "#aaa", cursor: text.trim() ? "pointer" : "not-allowed", fontWeight: 500, fontSize: 14 }}>
            Analyze Text →
          </button>
        </div>
      )}
    </div>
  );
}
