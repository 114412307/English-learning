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

function normalizeLang(lang: string) {
  if (lang === "zh-TW") return "zh-TW";
  if (lang === "auto") return "auto";
  return lang;
}

async function translateWithGoogle(text: string, sourceLang: string, targetLang: string) {
  const params = new URLSearchParams({
    client: "gtx",
    dt: "t",
    sl: normalizeLang(sourceLang),
    tl: normalizeLang(targetLang),
    q: text,
  });

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Translate API failed (${response.status})`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Invalid translation response");
  }

  return (data[0] as unknown[])
    .map((item) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
    .join("")
    .trim();
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
  const [highlightedIndexes, setHighlightedIndexes] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isTranslatingSentence, setIsTranslatingSentence] = useState(false);
  const [isTranslatingArticle, setIsTranslatingArticle] = useState(false);

  const sentences = useMemo(() => splitIntoSentences(rawText), [rawText]);
  const current = sentences[currentIndex] ?? "";

  useEffect(() => {
    setSentenceNotes((prev) => {
      const next = sentences.map((_, index) => prev[index] ?? "");
      return next;
    });

    setHighlightedIndexes((prev) => prev.filter((index) => index < sentences.length));
    setCurrentIndex((prev) => Math.min(prev, Math.max(sentences.length - 1, 0)));
  }, [sentences]);

  function speakCurrent() {
    if (!current || typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(current);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function toggleHighlight(index: number) {
    setHighlightedIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index].sort((a, b) => a - b),
    );
  }

  async function handleTranslateSentence() {
    if (!current) return;
    setIsTranslatingSentence(true);
    setStatusMessage("翻譯目前句子中...");
    try {
      const translated = await translateWithGoogle(current, sourceLang, targetLang);
      setSentenceNotes((prev) => prev.map((item, index) => (index === currentIndex ? translated || item : item)));
      setStatusMessage("已完成目前句子翻譯。結果已填入「句子中文說明」。");
    } catch {
      setStatusMessage("句子翻譯失敗，請稍後再試。若網路封鎖 translate.googleapis.com，請改用手動輸入。");
    } finally {
      setIsTranslatingSentence(false);
    }
  }

  async function handleTranslateArticle() {
    const text = rawText.trim();
    if (!text) return;
    setIsTranslatingArticle(true);
    setStatusMessage("翻譯整段文章中...");
    try {
      const translated = await translateWithGoogle(text, sourceLang, targetLang);
      if (translated) {
        setParagraphNote(translated);
      }
      setStatusMessage("已完成整段翻譯。結果已填入「段落中文說明」。");
    } catch {
      setStatusMessage("整段翻譯失敗，請稍後再試。若網路封鎖 translate.googleapis.com，請改用手動輸入。");
    } finally {
      setIsTranslatingArticle(false);
    }
  }

  const currentSentenceNote = sentenceNotes[currentIndex] ?? "";

  return (
    <main className="app popup-layout">
      <header className="card pane">
        <h1>English Learning Helper</h1>
        <p className="subtitle">Chrome 擴充功能版：不用跳轉網頁，直接在 Popup 內逐句翻譯與做筆記。</p>
      </header>

      <section className="card pane">
        <label htmlFor="article">Article</label>
        <textarea
          id="article"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setCurrentIndex(0);
          }}
          rows={7}
        />

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
          <button onClick={handleTranslateSentence} disabled={!current || isTranslatingSentence}>
            {isTranslatingSentence ? "翻譯中..." : "翻譯目前句子"}
          </button>
          <button onClick={handleTranslateArticle} disabled={!rawText.trim() || isTranslatingArticle}>
            {isTranslatingArticle ? "翻譯中..." : "翻譯整段文章"}
          </button>
        </div>

        {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      </section>

      <section className="card pane sentence-card">
        <h2>
          Sentence {sentences.length ? currentIndex + 1 : 0}/{sentences.length}
        </h2>
        <p>{current || "No sentence available."}</p>

        <div className="controls compact-controls">
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

        <p className="sentence-note-preview">
          {currentSentenceNote ? `中文：${currentSentenceNote}` : "中文：尚未填寫這一句的翻譯。"}
        </p>
      </section>

      <section className="card pane highlighter-card">
        <h3>逐句螢光筆</h3>
        <div className="sentence-list" role="list">
          {sentences.map((sentence, index) => {
            const isActive = index === currentIndex;
            const isHighlighted = highlightedIndexes.includes(index);

            return (
              <div
                key={`${sentence}-${index}`}
                className={`sentence-row ${isActive ? "active" : ""} ${isHighlighted ? "highlighted" : ""}`}
                role="listitem"
              >
                <button type="button" className="sentence-select" onClick={() => setCurrentIndex(index)}>
                  {index + 1}. {sentence}
                </button>
                <button type="button" className="highlight-toggle" onClick={() => toggleHighlight(index)}>
                  {isHighlighted ? "取消螢光" : "螢光筆"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card pane">
        <label htmlFor="paragraph-note">段落中文說明</label>
        <textarea
          id="paragraph-note"
          value={paragraphNote}
          onChange={(e) => setParagraphNote(e.target.value)}
          rows={4}
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
      </section>
    </main>
  );
}
