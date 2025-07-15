#環境構築手順
1.VSCode のインストール
・下記から自分のマシンにあったインストーラをダウンロード
・https://code.visualstudio.com/download

2.npm のインストール
・下記から v22.17.0 (LTS)(または最新の LTS)をダウンロード
・https://nodejs.org/ja/download

3.python のインストール
・下記から Python 3.11.9(または 3.11)のダウンロード
・https://www.python.org/downloads/

4.React 側ライブラリインストール
・npm install を実行で OK(package.json に依存関係の記載があるため)
・ダメだった場合は下記を実行
npm install
npm install openai clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

5.python 側ライブラリインストール
・以下を実行
pip install flask flask-cors python-pptx requests

6.APIKEY の設定
・image-generator 配下に[.env]ファイルを作成
・中身は以下のように記載する

REACT_APP_OPENAI_API_KEY=YourOpenAPIKEY

7.React と python 環境の実行
・この時点で各ファイルでエラーが発生していないことを確認(import 句でエラーが起きている場合パスを記載しなおせばエラーが消える可能性あり)
・エラーが発生していない場合以下で動作確認
React：npm start
Python：
cd python-server
python app.py
