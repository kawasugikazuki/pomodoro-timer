# ベースイメージ
FROM node:18

# 作業ディレクトリの作成
WORKDIR /app

# package.json と package-lock.json をコピーして依存関係インストール
COPY package*.json ./
RUN npm install

# アプリのソースコードをコピー
COPY . .

# 開発サーバーのポートを解放
EXPOSE 5173

# アプリ起動（開発モード）
CMD ["npm", "start"]
