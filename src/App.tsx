import { useMemo, useState } from "react";

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

  const sentences = useMemo(() => splitIntoSentences(rawText), [rawText]);
  const current = sentences[currentIndex] ?? "";

  function speakCurrent() {
    if (!current || typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(current);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <main className="app">
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
    </main>
  );
}
