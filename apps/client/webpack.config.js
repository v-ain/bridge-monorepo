import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- НАЧАЛО ЧТЕНИЯ .ENV БЕЗ ПАКЕТОВ ---
const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  envContent.split('\n').forEach((line) => {
    // Игнорируем пустые строки и комментарии
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    // Находим первую равно и делим строку на ключ/значение
    const firstEquals = trimmedLine.indexOf('=');
    if (firstEquals === -1) return;

    const key = trimmedLine.slice(0, firstEquals).trim();
    let value = trimmedLine.slice(firstEquals + 1).trim();

    // Очищаем кавычки, если они есть (например, API_HOST="localhost")
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Записываем в глобальный процесс
    process.env[key] = value;
  });
}

const isProduction = process.env.NODE_ENV === 'production';

export default {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    clean: true,
  },
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'eval-source-map',

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.module\.scss$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isProduction ? '[hash:base64:5]' : '[name]__[local]__[hash:base64:5]',
                exportLocalsConvention: 'camelCaseOnly',
                exportOnlyLocals: false,
                namedExport: false,
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.scss$/,
        exclude: /\.module\.scss$/,
        use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
          }),
        ]
      : []),
    new webpack.DefinePlugin({
      'process.env.API_HOST': JSON.stringify(process.env.API_HOST || 'localhost'),
      'process.env.API_PORT': JSON.stringify(process.env.API_PORT || '3000'),
    }),
  ],

  devServer: {
    port: Number.parseInt(process.env.DEV_CLIENT_PORT, 10) || 3001,
    host: '0.0.0.0',
    hot: true,
    historyApiFallback: true,
  },
};
