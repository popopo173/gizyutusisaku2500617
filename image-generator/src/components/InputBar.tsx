/*
役割：入力欄＋エクスポートボタン
入力ボックス（Enter対応あり）
エクスポートボタン
入力値の変更イベントとキーイベントを親に通知
*/
import React from "react";

type Props = {
  inputText: string;
  setInputText: (v: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onExport: () => void;
  exportEnabled: boolean;
  loading: boolean;
};

const InputBar = ({ inputText, setInputText, onKeyPress, onExport, exportEnabled, loading }: Props) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-6 py-4 flex items-center justify-center gap-4 shadow-md">
    <input
      type="text"
      className="flex-1 max-w-2xl p-3 border border-gray-300 rounded"
      placeholder="例: ハワイ風の明るい雰囲気 または Bパターンを明るく（Enterで生成）"
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      onKeyDown={onKeyPress}
    />
    <button
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
      onClick={onExport}
      disabled={!exportEnabled || loading}
    >
      エクスポート
    </button>
  </div>
);

export default InputBar;
