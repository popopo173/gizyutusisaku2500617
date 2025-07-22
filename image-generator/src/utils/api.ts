/*
api.ts
役割：OpenAI API とファイル生成APIの通信処理
translateToEnglish(text)：OpenAIで翻訳
generateImages(prompt, n)：画像生成API呼び出し
exportSlides(images)：Flaskサーバー経由でPPTXエクスポート
*/

import OpenAI from "openai";

// APIキー管理
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// 日本語入力を英語に翻訳
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Translate the following Japanese text into English. Only return the translated English text.",
        },
        { role: "user", content: text },
      ],
    });
    return response.choices[0].message.content?.trim() || text;
  } catch (err) {
    console.error("Translation error:", err);
    alert("翻訳に失敗しました。");
    return text;
  }
};

// 画像生成APIを実行
export const generateImages = async (
  prompt: string,
  n: number,
  setLoading: (v: boolean) => void
): Promise<string[]> => {
  setLoading(true);
  try {
    const response = await openai.images.generate({
      prompt,
      n,
      size: "512x512",
      response_format: "url",
    });
    return response?.data?.map((img) => img.url || "") ?? [];
  } catch (err) {
    console.error(err);
    alert("画像生成に失敗しました");
    return [];
  } finally {
    setLoading(false);
  }
};

// スライド生成
export const exportSlides = async (images: string[]): Promise<void> => {
  try {
    const response = await fetch("http://localhost:5000/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });

    if (!response.ok) throw new Error("export failed");

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
  }
};

//Tips生成API（プロンプトに基づく短文アドバイス）
export const generateTips = async (prompt: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (err) {
    console.error("Tips生成エラー:", err);
    return "Tipsの生成に失敗しました";
  }
};
