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
5. 載入後即可從擴充功能工具列打開 `English Learning Helper` popup。

> 擴充功能設定檔位於 `public/manifest.json`，Vite 建置時會自動複製到 `dist/manifest.json`。
