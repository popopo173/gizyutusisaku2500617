/*
ImageGrid.tsx
役割：画像表示エリア＋プレビューボタン
各パターン（A, B, C）の画像をグリッド表示
プレビューボタンを画像ごとに配置
各画像にラベル表示（例：タイトルスライドなど）
*/
import clsx from "clsx";

type Props = {
  images: string[];
  labels: string[];
  onPreview: (idx: number) => void;
  loading: boolean;
  previewEnabled: boolean;
};

const ImageGrid = ({ images, labels, onPreview, loading, previewEnabled }: Props) => {
  return (
    <div className="flex-grow flex items-center justify-center px-6 pt-24 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="flex flex-col items-center border border-gray-300 rounded-md relative bg-white p-2">
            <button
              className="absolute top-2 right-2 bg-white border border-gray-400 px-3 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-50"
              onClick={() => onPreview(idx)}
              disabled={!previewEnabled || loading}
            >
              プレビュー
            </button>

            {images[idx] ? (
              <img src={images[idx]} alt={`Pattern ${String.fromCharCode(65 + idx)}`} className="w-full aspect-[16/9] object-cover" />
            ) : (
              <div className="w-full aspect-[16/9] border-2 border-dashed border-gray-300 bg-white" />
            )}

            <div className={clsx("mt-2 mb-4 font-medium transition-opacity duration-500 ease-in-out", loading ? "opacity-0" : "opacity-100")}>{labels[idx]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;