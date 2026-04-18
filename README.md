# English-learning

學習英文（React + Vite）。

## 以 Chrome 擴充功能使用

1. 安裝依賴並建置：
   ```bash
   npm install
   npm run build
   ```
2. 打開 Chrome 並前往 `chrome://extensions`。
3. 開啟右上角「開發人員模式」。
4. 點「載入未封裝項目」，選擇此專案的 `dist` 資料夾。
5. 載入後，點工具列中的 `English Learning Helper` 圖示即可打開 popup。

## 功能重點

- 逐句切分文章、前後句切換、語音朗讀（Speak）。
- 在 popup 內直接翻譯「目前句子」與「整段文章」，不用跳轉到翻譯網站。
- 可逐句加入中文註解，並用螢光筆標記重點句。

> 擴充功能設定檔位於 `public/manifest.json`，Vite 建置時會自動複製到 `dist/manifest.json`。
