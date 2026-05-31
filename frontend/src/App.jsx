import { useState, useRef, useCallback } from "react";

const API_BASE = "/api";
const TABS = ["Summary", "Flashcards", "Quiz"];

function LoadingSpinner({ task }) {
  const msgs = { summary: "Summarizing your lecture...", flashcards: "Generating flashcards...", quiz: "Writing quiz questions..." };
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ width: 40, height: 40, margin: "0 auto 16px", border: "3px solid #eee", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{msgs[task]}</p>
    </div>
  );
}

function SummaryView({ data }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 8px" }}>{data.title}</h2>
      <p style={{ color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>{data.overview}</p>
      <div style={{ display: "grid", gap: 10 }}>
        {data.key_points.map((pt, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 16px", background: "#f9f9f8", borderRadius: 8, border: "0.5px solid #eee" }}>
            <span style={{ minWidth: 24, height: 24, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>{pt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlashcardsView({ data }) {
  const [flipped, setFlipped] = useState({});
  const [current, setCurrent] = useState(0);
  const cards = data.flashcards;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#888" }}>Card {current + 1} of {cards.length}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            style={{ padding: "6px 14px", borderRadius: 8, border: "0.5px solid #ddd", background: "white", cursor: current === 0 ? "not-allowed" : "pointer", opacity: current === 0 ? 0.4 : 1 }}>←</button>
          <button onClick={() => setCurrent(c => Math.min(cards.length - 1, c + 1))} disabled={current === cards.length - 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "0.5px solid #ddd", background: "white", cursor: current === cards.length - 1 ? "not-allowed" : "pointer", opacity: current === cards.length - 1 ? 0.4 : 1 }}>→</button>
        </div>
      </div>
      <div onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))}
        style={{ cursor: "pointer", minHeight: 180, padding: "32px 28px", borderRadius: 12, border: `2px solid ${flipped[current] ? "#86efac" : "#ddd"}`, background: flipped[current] ? "#f0fdf4" : "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", transition: "all 0.15s ease" }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "#aaa", marginBottom: 12, textTransform: "uppercase" }}>{flipped[current] ? "Answer" : "Question"}</span>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, fontWeight: flipped[current] ? 400 : 500 }}>{flipped[current] ? cards[current].back : cards[current].front}</p>
        <span style={{ fontSize: 12, color: "#aaa", marginTop: 16 }}>{flipped[current] ? "Click to see question" : "Click to reveal answer"}</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {cards.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            style={{ width: 28, height: 28, borderRadius: "50%", border: i === current ? "2px solid #3b82f6" : "0.5px solid #ddd", background: i === current ? "#eff6ff" : flipped[i] ? "#f0fdf4" : "#f9f9f8", color: i === current ? "#2563eb" : "#888", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizView({ data }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const questions = data.questions;
  const score = Object.entries(answers).filter(([i, a]) => a === questions[i].answer).length;

  return (
    <div>
      {questions.map((q, i) => {
        const selected = answers[i];
        const isCorrect = selected === q.answer;
        return (
          <div key={i} style={{ marginBottom: 24, padding: "16px 20px", borderRadius: 12, border: "0.5px solid #eee", background: "white" }}>
            <p style={{ fontWeight: 500, margin: "0 0 14px", fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: "#aaa", marginRight: 8 }}>Q{i + 1}.</span>{q.question}
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {q.options.map((opt, j) => {
                const letter = ["A", "B", "C", "D"][j];
                const isSelected = selected === letter;
                const isAnswer = showResults && letter === q.answer;
                const isWrong = showResults && isSelected && !isCorrect;
                return (
                  <button key={j} onClick={() => !showResults && setAnswers(a => ({ ...a, [i]: letter }))}
                    style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8, border: isAnswer ? "2px solid #86efac" : isWrong ? "2px solid #fca5a5" : isSelected ? "2px solid #93c5fd" : "0.5px solid #eee", background: isAnswer ? "#f0fdf4" : isWrong ? "#fef2f2" : isSelected ? "#eff6ff" : "#f9f9f8", cursor: showResults ? "default" : "pointer", fontSize: 14, transition: "all 0.1s ease" }}>
                    <span style={{ fontWeight: 500, marginRight: 8 }}>{letter})</span>{opt.slice(3)}
                  </button>
                );
              })}
            </div>
            {showResults && selected && (
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "#666", lineHeight: 1.5 }}>💡 {q.explanation}</p>
            )}
          </div>
        );
      })}

      {!showResults ? (
        <button onClick={() => setShowResults(true)} disabled={Object.keys(answers).length < questions.length}
          style={{ padding: "10px 24px", borderRadius: 8, border: "0.5px solid #ddd", background: Object.keys(answers).length < questions.length ? "#f5f5f5" : "#eff6ff", color: Object.keys(answers).length < questions.length ? "#aaa" : "#2563eb", cursor: Object.keys(answers).length < questions.length ? "not-allowed" : "pointer", fontWeight: 500, fontSize: 14 }}>
          Submit ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      ) : (
        <div style={{ padding: "16px 20px", borderRadius: 8, background: "#f9f9f8", border: "0.5px solid #eee" }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 16 }}>Score: {score}/{questions.length} — {Math.round(score / questions.length * 100)}%</p>
          <button onClick={() => { setAnswers({}); setShowResults(false); }}
            style={{ marginTop: 10, padding: "6px 16px", borderRadius: 8, border: "0.5px solid #ddd", background: "white", cursor: "pointer", fontSize: 13 }}>
            Retake quiz
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [tab, setTab] = useState("upload");
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("Summary");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
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

  const fetchResult = async (tabName) => {
    const task = tabName.toLowerCase();
    if (results[task]) return;
    setLoading(task);
    setError(null);
    try {
      let res;
      if (content.type === "pdf") {
        const formData = new FormData();
        formData.append("pdf", content.file);
        res = await fetch(`${API_BASE}/process?task=${task}`, { method: "POST", body: formData });
      } else {
        res = await fetch(`${API_BASE}/process?task=${task}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content.text }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResults(r => ({ ...r, [task]: data.result }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleTabClick = (t) => {
    setActiveTab(t);
    if (content) fetchResult(t);
  };

  if (content) {
    const currentTask = activeTab.toLowerCase();
    const currentResult = results[currentTask];
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 22 }}>📖</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>LectureAI</h1>
          <span style={{ fontSize: 13, color: "#999" }}>AI Study Companion</span>
        </div>

        <div style={{ padding: "10px 14px", background: "#f5f5f3", borderRadius: 8, border: "0.5px solid #ddd", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: "#666" }}>{fileName ? `📄 ${fileName}` : "✏️ Pasted text"}</span>
          <button onClick={() => { setContent(null); setFileName(null); setResults({}); }}
            style={{ fontSize: 12, color: "#999", background: "none", border: "none", cursor: "pointer" }}>
            Change ×
          </button>
        </div>

        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "0.5px solid #eee" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => handleTabClick(t)}
              style={{ padding: "8px 20px", background: "none", border: "none", borderBottom: activeTab === t ? "2px solid #3b82f6" : "2px solid transparent", color: activeTab === t ? "#2563eb" : "#888", fontWeight: activeTab === t ? 500 : 400, fontSize: 14, cursor: "pointer", marginBottom: -1 }}>
              {t === "Summary" ? "📋 " : t === "Flashcards" ? "🃏 " : "✅ "}{t}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "0.5px solid #fca5a5", borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>⚠️ {error}</p>
          </div>
        )}

        {loading === currentTask ? (
          <LoadingSpinner task={currentTask} />
        ) : currentResult ? (
          <>
            {currentTask === "summary" && <SummaryView data={currentResult} />}
            {currentTask === "flashcards" && <FlashcardsView data={currentResult} />}
            {currentTask === "quiz" && <QuizView data={currentResult} />}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <button onClick={() => fetchResult(activeTab)}
              style={{ padding: "12px 28px", borderRadius: 8, border: "0.5px solid #ddd", background: "#eff6ff", color: "#2563eb", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Generate {activeTab} →
            </button>
          </div>
        )}
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
