import { useState } from "react";
import OpenAI from "openai";
import clsx from "clsx";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [lastPrompts, setLastPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageUnderLabel, setImageUnderLabel] = useState<string[]>(["Aパターン", "Bパターン", "Cパターン"]);

  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  

  // A/B/Cパターンのいずれかを検出（複数指定はエラー）
  const detectPatternRef = (text: string): "A" | "B" | "C" | null => {
    const lower = text.toLowerCase();
    const hasA = lower.includes("aパターン");
    const hasB = lower.includes("bパターン");
    const hasC = lower.includes("cパターン");
    const count = [hasA, hasB, hasC].filter(Boolean).length;
    if (count > 1) {
      alert("A/B/Cパターンは1つだけ指定してください");
      return null;
    }
    if (hasA) return "A";
    if (hasB) return "B";
    if (hasC) return "C";
    return null;
  };

  // 日本語入力を英語に翻訳
  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Translate the following Japanese text into English. Only return the translated English text." },
          { role: "user", content: text }
        ]
      });
      return response.choices[0].message.content?.trim() || text;
    } catch (err) {
      console.error("Translation error:", err);
      alert("翻訳に失敗しました。");
      return text;
    }
  };

  // 画像生成APIを実行
  const generateImages = async (prompt: string, n: number = 3) => {
    setLoading(true);
    try {
      const response = await openai.images.generate({
        prompt,
        n,
        size: "512x512",
        response_format: "url",
      });
      return response?.data?.map((img) => img.url || "") ?? [];
    } catch (err: any) {
      console.error(err);
      alert("画像生成に失敗しました");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ユーザー入力を翻訳・プロンプトに変換し、画像を生成する処理
const handleSubmit = async () => {
  // ボタンの無効化（エクスポート・プレビュー）
  setExportEnabled(false);
  setPreviewEnabled(false);

  // A/B/Cパターンのいずれかを検出（複数指定はエラー）
  const pattern = detectPatternRef(inputText);
  let basePrompt = "";

  // 日本語入力を英語に翻訳
  const translated = await translateToEnglish(inputText);

  // A/B/Cパターン指定があり、以前のプロンプトがある場合はそれに加筆する
  if (pattern && lastPrompts.length === 3) {
    const idx = { A: 0, B: 1, C: 2 }[pattern];
    const originalPrompt = lastPrompts[idx];
    basePrompt = `${originalPrompt} Additionally, incorporate the following user request: "${translated}"`;
  } else {
    // 新規プロンプトを生成
    basePrompt = `Create a PowerPoint background image based on the following design idea: "${translated}". The design should be clean, visually pleasing, and suitable for use behind text.`;
  }

  // 画像生成APIを実行（3枚）
  const urls = await generateImages(basePrompt);

  // 状態更新
  setImages(urls);
  setLastPrompts([basePrompt, basePrompt, basePrompt]);
  setImageUnderLabel(["Aパターン", "Bパターン", "Cパターン"]);

  // 3枚の画像が生成された場合にプレビューボタンを有効にする
  if (urls.length === 3) setPreviewEnabled(true);
};

  // 選択されたパターンに対してプレビュー画像（本文スライド、章区切り）を生成する処理
  const handlePreview = async (idx: number) => {
    // プレビューボタンとエクスポートボタンを一時的に無効化
    setPreviewEnabled(false);
    setExportEnabled(false);

    // 選択された画像が存在しない場合は中断
    if (!images[idx]) {
      alert("先に画像を生成してください");
      return;
    }

    // 元プロンプトを取得（なければ汎用プロンプト）
    const basePrompt = lastPrompts[idx] || "Create a PowerPoint slide background image.";

    // 内容スライド用・章区切り用の詳細プロンプトを追加生成
    const previewPrompt1 = `${basePrompt} Generate a clean, minimalistic background image for a content slide. Avoid identifiable subjects or text. Use abstract shapes or soft gradients.`;
    const previewPrompt2 = `${basePrompt} Generate a subtle and abstract background for a section divider slide. It should use soft colors and no focal subjects or objects.`;

    // それぞれ1枚ずつ画像生成
    const [contentImage] = await generateImages(previewPrompt1, 1);
    const [dividerImage] = await generateImages(previewPrompt2, 1);

    // 正常に2枚生成できた場合、画像とラベルを更新し、エクスポートを有効に
    if (contentImage && dividerImage) {
      setImages([images[idx], contentImage, dividerImage]);
      setImageUnderLabel(["タイトルスライド", "本文スライド", "章区切りスライド"]);
      setExportEnabled(true);
    } else {
      alert("プレビュー画像の生成に失敗しました");
    }
  };

  //入力欄にテキスト入力後Enterキー押下でhandleSubmitを起動するように受付を行う
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputText.trim() && !loading) {
      handleSubmit();
    }
  };

  //パワーポイントファイルを生成します
  const handleExport = async () => {
    setExporting(true); 
    try {
      const response = await fetch("http://localhost:5000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) {
        alert("エクスポートに失敗しました");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "slides.pptx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("エクスポートに失敗しました");
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      <h1 className="absolute top-4 left-6 text-xl font-bold">パワポデザインレコメンダー</h1>

      {loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>画像を生成中...</span>
        </div>
      )}

      {exporting && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>ファイルを生成中...</span>
        </div>
      )}

      <div className="flex-grow flex items-center justify-center px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex flex-col items-center border border-gray-300 rounded-md relative bg-white p-2">
              <button
                className="absolute top-2 right-2 bg-white border border-gray-400 px-3 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50"
                onClick={() => handlePreview(idx)}
                disabled={!previewEnabled || loading}
              >
                プレビュー
              </button>

              {images[idx] ? (
                <img src={images[idx]} alt={`Pattern ${String.fromCharCode(65 + idx)}`} className="w-full aspect-[16/9] object-cover" />
              ) : (
                <div className="w-full aspect-[16/9] border-2 border-dashed border-gray-300 bg-white" />
              )}

              <div
                className={clsx(
                  "mt-2 mb-4 font-medium transition-opacity duration-500 ease-in-out",
                  loading ? "opacity-0" : "opacity-100"
                )}
              >
                {imageUnderLabel[idx]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-6 py-4 flex items-center justify-center gap-4 shadow-md">
        <input
          type="text"
          className="flex-1 max-w-2xl p-3 border border-gray-300 rounded"
          placeholder="例: ハワイ風の明るい雰囲気 または Bパターンを明るく（Enterで生成）"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          onClick={handleExport}
          disabled={!exportEnabled || loading || exporting}
        >
          エクスポート
        </button>
      </div>
    </div>
  );
}

export default App;
