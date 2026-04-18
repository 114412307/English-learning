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
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("zh-TW");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

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

  async function translateText(input: string) {
    if (!input.trim()) {
      setTranslatedText("");
      setTranslateError("");
      return;
    }

    setIsTranslating(true);
    setTranslateError("");

    try {
      const params = new URLSearchParams({
        client: "gtx",
        sl: sourceLang,
        tl: targetLang,
        dt: "t",
        q: input,
      });
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as unknown;
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error("Unexpected translate response");
      }

      const result = data[0]
        .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
        .join("");

      setTranslatedText(result);
    } catch {
      setTranslateError("翻譯失敗，請稍後再試或檢查網路連線。");
    } finally {
      setIsTranslating(false);
    }
  }

  const currentSentenceNote = sentenceNotes[currentIndex] ?? "";

  return (
    <main className="app split-layout">
      <section className="left-pane card pane">
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

        <section className="card sentence-card">
          <h2>
            Sentence {sentences.length ? currentIndex + 1 : 0}/{sentences.length}
          </h2>
          <p>{current || "No sentence available."}</p>
          <p className="sentence-note-preview">
            {currentSentenceNote ? `中文：${currentSentenceNote}` : "中文：尚未填寫這一句的翻譯。"}
          </p>
        </section>
      </section>

      <aside className="right-pane card pane">
        <h2>中文說明</h2>
        <p className="note-help">右側可補上對應段落與句子的中文重點，句子欄位會跟著目前英文句子切換。</p>

        <section className="card translator-card">
          <h3>參考 Google 翻譯的快速翻譯</h3>
          <div className="translator-controls">
            <label htmlFor="source-lang">
              原文語言
              <select id="source-lang" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                <option value="auto">自動偵測</option>
                <option value="en">English</option>
                <option value="zh-TW">繁體中文</option>
                <option value="ja">日本語</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                if (sourceLang === "auto") {
                  setSourceLang(targetLang);
                  setTargetLang("en");
                  return;
                }
                setSourceLang(targetLang);
                setTargetLang(sourceLang);
              }}
            >
              交換語言
            </button>

            <label htmlFor="target-lang">
              目標語言
              <select id="target-lang" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                <option value="zh-TW">繁體中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </label>
          </div>

          <div className="controls">
            <button onClick={() => translateText(current)} disabled={!current || isTranslating}>
              {isTranslating ? "翻譯中..." : "翻譯目前句子"}
            </button>
            <button onClick={() => translateText(rawText)} disabled={!rawText.trim() || isTranslating}>
              {isTranslating ? "翻譯中..." : "翻譯整段文章"}
            </button>
          </div>

          <textarea
            value={translatedText}
            onChange={(e) => setTranslatedText(e.target.value)}
            placeholder="翻譯結果會顯示在這裡，可直接編輯。"
            rows={5}
          />
          {translateError && <p className="translate-error">{translateError}</p>}
        </section>

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
          value={currentSentenceNote}
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
