/*
api.ts
役割：OpenAI API とファイル生成APIの通信処理
translateToEnglish(text)：OpenAIで翻訳
generateImages(prompt, n)：画像生成API呼び出し
exportSlides(images)：Flaskサーバー経由でPPTXエクスポート
*/
/* __(1)__ OpenAIを利用する際にはどこからimportするのか考えてみてください */
import OpenAI from "__(1)__";

// APIキー管理
/* __(2)__ OpenAIを利用する際のクラス名について考えてみてください */
/* __(3)__ 環境変数を設定する際に利用したkeyを考えてみてください */
const openai = new __(2)__({
  apiKey: process.env.__(3)__,
  dangerouslyAllowBrowser: true,
});

// 日本語入力を英語に翻訳
/* __(4)__ ChatGPTのAPIには何パターン化種類が存在します。適当なAPIを選んでみてください
           ※費用があまりかからない_miniとついているのがおすすめです */
/* __(5)__ AIに対して「ルールや指示」を設定するroleについて考えてみてください */
/* __(6)__ 実際にAIに「質問やリクエスト」を送るroleについて考えてみてください */
/* __(7)__ responseから情報を取得するやり方について考えてみてください */
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "__(4)__",
      messages: [
        {
          role: "__(5)__",
          content:
            "Translate the following Japanese text into English. Only return the translated English text.",
        },
        { role: "__(6)__", content: text },
      ],
    });
    return response.choices[0].message.__(7)__?.trim() || text;
  } catch (err) {
    console.error("Translation error:", err);
    alert("翻訳に失敗しました。");
    return text;
  }
};

// 画像生成APIを実行
/* __(8)__ 画像生成を行う際のコマンドを考えてみてください */
/* __(9)__ 出力する際のが画像のサイズについて考えてみてください
           設定する際のサイズのルールを資料を見返して考えてみてください */
/* __(10)__responseの際の形式を記載してください、複数の形式が設定できますが今回はリンクを設定してください */
export const generateImages = async (
  prompt: string,
  n: number,
  setLoading: (v: boolean) => void
): Promise<string[]> => {
  setLoading(true);
  try {
    const response = await openai.__(8)__.generate({
      prompt,
      n,
      size: "__(9)__",
      response_format: "__(10)__",
    });
    return response?.data?.map((img) => img.__118)__ || "") ?? [];
  } catch (err) {
    console.error(err);
    alert("画像生成に失敗しました");
    return [];
  } finally {
    setLoading(false);
  }
};

// スライド生成
/* __(11)__ スライド生成の際のメソッドについて考えてみてください※jsonをheaderで設定していることを考慮に入れてください */
/* __(12)__responseからblobを取得する方法を考えてみてください */
/* __(13)__受信したblobデータから一時的なダウンロードURLを生成するコマンドを考えてみてください */
/* __(14)__使い終わった一時URLを開放するコマンドを考えてみてください */
export const exportSlides = async (images: string[]): Promise<void> => {
  try {
    const response = await fetch("http://localhost:5000/export", {
      method: "__(11)__",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });

    if (!response.ok) throw new Error("export failed");

    const blob = await response.__(12)__();
    const url = window.URL.__(13)__(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slides.pptx";
    a.click();
    window.URL.__(14)__(url);
  } catch (err) {
    console.error("Export error:", err);
    alert("エクスポートに失敗しました");
  }
};

// Tips生成API（プロンプトに基づく短文アドバイス）
/* __(15)__ OpenAIに問いかける際のコマンドについて考えてみてください */
/* __(16)__ ChatGPTのAPIには何パターン化種類が存在します。適当なAPIを選んでみてください
           ※費用があまりかからない_miniとついているのがおすすめです */
/* __(15)__ OpenAIに問いかける際のコマンドについて考えてみてください */
/* __(17)__ responseから情報を取得するやり方について考えてみてください */
export const generateTips = async (prompt: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.__(15)__({
      model: "__(16)__",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content?.__(17)__"() || "";
  } catch (err) {
    console.error("Tips生成エラー:", err);
    return "Tipsの生成に失敗しました";
  }
};