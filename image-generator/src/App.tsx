/*
App.tsx
役割：状態管理・処理の中継・UI構成
全体の状態（画像、入力、ローディング状態など）を管理
各イベント（画像生成、翻訳、エクスポートなど）を統括
components/ の各コンポーネントに必要な props を渡す
utils/ のロジックを呼び出して結果を反映する 
*/
import { useState } from "react";
import { detectPatternRef } from "./utils/helpers";
import { translateToEnglish, generateImages, exportSlides, generateTips } from "./utils/api";
import ImageGrid from "./components/ImageGrid";
import Loader from "./components/Loader";
import InputBar from "./components/InputBar";

function App() {
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [lastPrompts, setLastPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageUnderLabel, setImageUnderLabel] = useState<string[]>(["Aパターン", "Bパターン", "Cパターン"]);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [exportEnabled, setExportEnabled] = useState(false);
  const [tipsText, setTipsText] = useState("");

  // ユーザー入力を翻訳・プロンプトに変換し、画像を生成する処理
  const handleSubmit = async () => {
    setExportEnabled(false);
    setPreviewEnabled(false);
    setLoading(true);
    setTipsText("");

    // --- Tips生成 ---
    const hasPurposeKeyword = /.+用/.test(inputText); // ○○用などのキーワード検出
    const prompt = hasPurposeKeyword
      ? `${inputText}の発表資料を作る場合のアドバイスを100文字以内で生成してください`
      : "発表資料作成時の注意点またはアドバイスを100文字以内で生成してください";

    try {
      const tip = await generateTips(prompt);
      setTipsText(tip);
    } catch {
      setTipsText("アドバイスの取得に失敗しました");
    }

    // --- プロンプト生成 ---
    const pattern = detectPatternRef(inputText);
    const translated = await translateToEnglish(inputText);
    let basePrompt = "";

    if (pattern && lastPrompts.length === 3) {
      const idx = { A: 0, B: 1, C: 2 }[pattern];
      basePrompt = `${lastPrompts[idx]} Additionally, incorporate the following user request: "${translated}"`;
    } else {
      basePrompt = `Create a PowerPoint background image based on the following design idea: "${translated}". The design should be clean, visually pleasing, and suitable for use behind text.`;
    }

    const urls = await generateImages(basePrompt, 3, setLoading);
    setImages(urls);
    setLastPrompts([basePrompt, basePrompt, basePrompt]);
    setImageUnderLabel(["Aパターン", "Bパターン", "Cパターン"]);
    if (urls.length === 3) setPreviewEnabled(true);

    setLoading(false);
    setTipsText(""); // 完了後は非表示
  };

  const handlePreview = async (idx: number) => {
    setPreviewEnabled(false);
    setExportEnabled(false);

    if (!images[idx]) {
      alert("先に画像を生成してください");
      return;
    }

    const basePrompt = lastPrompts[idx] || "Create a PowerPoint slide background image.";
    const previewPrompt1 = `${basePrompt} Generate a clean, minimalistic background image for a content slide.`;
    const previewPrompt2 = `${basePrompt} Generate a subtle and abstract background for a section divider slide.`;

    const [contentImage] = await generateImages(previewPrompt1, 1, setLoading);
    const [dividerImage] = await generateImages(previewPrompt2, 1, setLoading);

    if (contentImage && dividerImage) {
      setImages([images[idx], contentImage, dividerImage]);
      setImageUnderLabel(["タイトルスライド", "本文スライド", "章区切りスライド"]);
      setExportEnabled(true);
    } else {
      alert("プレビュー画像の生成に失敗しました");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputText.trim() && !loading) {
      handleSubmit();
    }
  };

  const handleExport = async () => {
    setExporting(true);
    await exportSlides(images);
    setExporting(false);
  };

  // Tipsを改行で3行に分割する
  const formattedTips = tipsText
    ? tipsText.match(/.{1,50}/g)?.slice(0, 3) ?? []
    : [];

  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      <h1 className="absolute top-4 left-6 text-xl font-bold">パワポデザインレコメンダー</h1>

      {loading && (
        <>
          <Loader text="画像を生成中..." offset={"top-20"} />
          {formattedTips.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-2xl shadow-xl text-center z-50 w-[60%]">
              {formattedTips.map((line, idx) => (
                <p key={idx} className="text-gray-800 text-lg mb-1">{line}</p>
              ))}
            </div>
          )}
        </>
      )}

      {exporting && <Loader text="ファイルを生成中..." offset={"top-32"} />}

      <ImageGrid
        images={images}
        labels={imageUnderLabel}
        onPreview={handlePreview}
        loading={loading}
        previewEnabled={previewEnabled}
      />

      <InputBar
        inputText={inputText}
        setInputText={setInputText}
        onKeyPress={handleKeyPress}
        onExport={handleExport}
        exportEnabled={exportEnabled}
        loading={loading || exporting}
      />
    </div>
  );
}

export default App;
