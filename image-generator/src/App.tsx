import { useState } from "react";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [lastPrompts, setLastPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  const generateImages = async (prompt: string) => {
    setLoading(true);
    setImages([]);
    try {
      const response = await openai.images.generate({
        prompt,
        n: 3,
        size: "512x512",
        response_format: "url",
      });
      const urls = response?.data?.map((img) => img.url || "") ?? [];
      setImages(urls);
    } catch (err) {
      console.error(err);
      alert("画像生成に失敗しました");
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
      basePrompt = `Create a  image : "${inputText}".`;
    }

    await generateImages(basePrompt);
    setLastPrompts([basePrompt, basePrompt, basePrompt]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputText.trim() && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      {/* 左上タイトル */}
      <h1 className="absolute top-4 left-6 text-xl font-bold">PowerPoint背景画像ジェネレーター</h1>

      {/* メイン画像エリア */}
      <div className="flex-grow flex items-center justify-center px-6 pt-24 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="flex flex-col items-center border border-gray-300 rounded-md relative bg-white"
            >
              {/* プレビューボタン */}
              <button className="absolute top-2 right-2 bg-white border border-gray-400 px-3 py-1 text-sm rounded hover:bg-gray-100">
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

              {/* パターンラベル */}
              <div className="mt-2 mb-4 font-medium">
                パターン {String.fromCharCode(65 + idx)}
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
          placeholder="例: ハワイ風の明るい雰囲気 または Bパターンを明るく"
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
