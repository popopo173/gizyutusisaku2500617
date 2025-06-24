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
  const [imageUnderLabel, setImageUnderLabel] = useState<string[]>(["Aパターン", "Bパターン", "Cパターン"]);

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
      if (err.name === "RateLimitError") {
        alert("リクエストが多すぎます。少し時間を空けて再度お試しください。");
      } else {
        alert("画像生成に失敗しました");
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const pattern = detectPatternRef(inputText);
    let basePrompt = "";

    if (pattern && lastPrompts.length === 3) {
      const idx = { A: 0, B: 1, C: 2 }[pattern];
      const originalPrompt = lastPrompts[idx];
      basePrompt = `${originalPrompt} Additionally, the user requested: "${inputText}"`;
    } else {
      basePrompt = `Create a background image . Design idea: "${inputText}".`;
    }

    const urls = await generateImages(basePrompt);
    setImages(urls);
    setLastPrompts([basePrompt, basePrompt, basePrompt]);
    setImageUnderLabel(["Aパターン", "Bパターン", "Cパターン"]);
  };

  const handlePreview = async (idx: number) => {
    if (!images[idx]) {
      alert("先に画像を生成してください");
      return;
    }

    const basePrompt = lastPrompts[idx] || `Generate a background image based on this example.`;

    const previewPrompt = `${basePrompt} Please generate two background images for a PowerPoint presentation: one for a content slide and one for a section divider. The images should match the theme of the original, be subtle, and use a 16:9 aspect ratio.`;

    const previewImages = await generateImages(previewPrompt, 2);

    if (previewImages.length === 2) {
      const newImages = [
        images[idx],          // タイトルスライド
        previewImages[0],     // 本文スライド
        previewImages[1],     // 章区切りスライド
      ];
      setImages(newImages);
      setImageUnderLabel(["タイトルスライド", "本文スライド", "章区切りスライド"]);
    } else {
      alert("プレビュー画像の生成に失敗しました");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputText.trim() && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      {/* タイトル */}
      <h1 className="absolute top-4 left-6 text-xl font-bold">PowerPoint背景画像ジェネレーター</h1>

      {/* ローディング表示 */}
      {loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>画像を生成中...</span>
        </div>
      )}

      {/* メイン画像エリア */}
      <div className="flex-grow flex items-center justify-center px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="flex flex-col items-center border border-gray-300 rounded-md relative bg-white p-2"
            >
              {/* プレビューボタン */}
              <button
                className="absolute top-2 right-2 bg-white border border-gray-400 px-3 py-1 text-sm rounded hover:bg-gray-100"
                onClick={() => handlePreview(idx)}
                disabled={loading}
              >
                プレビュー
              </button>

              {/* 画像 or プレースホルダー */}
              {images[idx] ? (
                <img
                  src={images[idx]}
                  alt={`Pattern ${String.fromCharCode(65 + idx)}`}
                  className="w-full aspect-[16/9] object-cover"
                />
              ) : (
                <div className="w-full aspect-[16/9] border-2 border-dashed border-gray-300 bg-white" />
              )}

              {/* ラベル（フェードイン付き） */}
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

      {/* 入力欄 & エクスポート（画面下固定） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-6 py-4 flex items-center justify-center gap-4 shadow-md">
        <input
          type="text"
          className="flex-1 max-w-2xl p-3 border border-gray-300 rounded"
          placeholder="例: ハワイ風の明るい雰囲気 または Bパターンを明るく　Enterキーで生成開始！"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          エクスポート
        </button>
      </div>
    </div>
  );
}

export default App;
