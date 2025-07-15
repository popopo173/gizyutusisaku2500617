/*
役割：ローディング中UIの表示（画像生成中／ファイル生成中）
ローディング用のスピナー＋メッセージ
表示位置・文言はpropsで制御可能
状況に応じて App 内で切り替え可能
*/
const Loader = ({ text, offset }: { text: string; offset?: string }) => (
  <div className={`absolute ${offset || "top-20"} left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-600`}>
    <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <span>{text}</span>
  </div>
);

export default Loader;