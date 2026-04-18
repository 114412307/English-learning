import { useEffect, useMemo, useState } from "react";

function splitIntoSentences(text: string) {
  return (
    text
      .replace(/\s+/g, " ")
      .trim()
      .match(/[^.!?。！？\n]+[.!?。！？]?/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || []
  );
}

export default function App() {
  const [rawText, setRawText] = useState(
    "Learning English becomes easier when you can connect the content to your own interests. Choose an article you actually want to read. Listen to each sentence slowly, repeat it aloud, and notice how your mouth moves. If you do this every day, your confidence will grow.",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paragraphNote, setParagraphNote] = useState(
    "這段文章在說：把英文學習和自己的興趣連結，會更容易持續；每天慢慢聽、開口跟讀，信心就會提升。",
  );
  const [sentenceNotes, setSentenceNotes] = useState<string[]>([]);

  const sentences = useMemo(() => splitIntoSentences(rawText), [rawText]);
  const current = sentences[currentIndex] ?? "";

  useEffect(() => {
    setSentenceNotes((prev) => {
      const next = sentences.map((_, index) => prev[index] ?? "");
      return next;
    });

    setCurrentIndex((prev) => Math.min(prev, Math.max(sentences.length - 1, 0)));
  }, [sentences]);

  function speakCurrent() {
    if (!current || typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(current);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <main className="app split-layout">
      <section className="left-pane">
        <h1>English Learning</h1>
        <p className="subtitle">Paste text, split to sentences, and practice reading aloud.</p>

        <label htmlFor="article">Article</label>
        <textarea
          id="article"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setCurrentIndex(0);
          }}
          rows={8}
        />

        <div className="controls">
          <button onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))} disabled={currentIndex <= 0}>
            Previous
          </button>
          <button onClick={speakCurrent} disabled={!current}>
            Speak
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, Math.max(sentences.length - 1, 0)))}
            disabled={currentIndex >= sentences.length - 1}
          >
            Next
          </button>
        </div>

        <section className="card">
          <h2>
            Sentence {sentences.length ? currentIndex + 1 : 0}/{sentences.length}
          </h2>
          <p>{current || "No sentence available."}</p>
        </section>
      </section>

      <aside className="right-pane card">
        <h2>中文說明</h2>
        <p className="note-help">右側可補上對應段落與句子的中文重點，方便理解與複習。</p>

        <label htmlFor="paragraph-note">段落中文說明</label>
        <textarea
          id="paragraph-note"
          value={paragraphNote}
          onChange={(e) => setParagraphNote(e.target.value)}
          rows={5}
        />

        <label htmlFor="sentence-note">句子中文說明（目前句）</label>
        <textarea
          id="sentence-note"
          value={sentenceNotes[currentIndex] ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setSentenceNotes((prev) => prev.map((item, index) => (index === currentIndex ? value : item)));
          }}
          rows={4}
          disabled={!current}
          placeholder={current ? "輸入這一句的中文說明..." : "目前沒有可說明的句子"}
        />
      </aside>
    </main>
  );
}
