/*
役割：状態管理・処理の中継・UI構成
全体の状態（画像、入力、ローディング状態など）を管理
各イベント（画像生成、翻訳、エクスポートなど）を統括
components/ の各コンポーネントに必要な props を渡す
utils/ のロジックを呼び出して結果を反映する 
*/
import { useState } from "react";
import { detectPatternRef } from "./utils/helpers";
import { translateToEnglish, generateImages, exportSlides } from "./utils/api";
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

  // ユーザー入力を翻訳・プロンプトに変換し、画像を生成する処理
  const handleSubmit = async () => {
    // ボタンの無効化（エクスポート・プレビュー）
    setExportEnabled(false);
    setPreviewEnabled(false);

    // A/B/Cパターンのいずれかを検出（複数指定はエラー）
    const pattern = detectPatternRef(inputText);
    let basePrompt = "";
    const translated = await translateToEnglish(inputText);

    // A/B/Cパターン指定があり、以前のプロンプトがある場合はそれに加筆する
    if (pattern && lastPrompts.length === 3) {
      const idx = { A: 0, B: 1, C: 2 }[pattern];
      basePrompt = `${lastPrompts[idx]} Additionally, incorporate the following user request: "${translated}"`;
    } else {
      //新規プロンプトを生成
      basePrompt = `Create a PowerPoint background image based on the following design idea: "${translated}". The design should be clean, visually pleasing, and suitable for use behind text.`;
    }

    // 画像生成APIを実行（3枚）
    const urls = await generateImages(basePrompt, 3, setLoading);

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
    const previewPrompt1 = `${basePrompt} Generate a clean, minimalistic background image for a content slide.`;
    const previewPrompt2 = `${basePrompt} Generate a subtle and abstract background for a section divider slide.`;

    // それぞれ1枚ずつ画像生成
    const [contentImage] = await generateImages(previewPrompt1, 1, setLoading);
    const [dividerImage] = await generateImages(previewPrompt2, 1, setLoading);

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

   //パワーポイントファイルを生成する
  const handleExport = async () => {
    setExporting(true);
    await exportSlides(images);
    setExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative flex flex-col">
      <h1 className="absolute top-4 left-6 text-xl font-bold">パワポデザインレコメンダー</h1>
      {loading && <Loader text="画像を生成中..." offset={"top-20"} />}
      {exporting && <Loader text="ファイルを生成中..." offset={"top-32"} />}
      <ImageGrid images={images} labels={imageUnderLabel} onPreview={handlePreview} loading={loading} previewEnabled={previewEnabled} />
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