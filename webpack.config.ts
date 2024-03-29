import { Configuration } from "webpack";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

const config: Configuration = {
  mode: "production",
  entry: {
    background: path.join(__dirname, "src", "background.ts"),
    content: path.join(__dirname, "src", "content.ts"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /.ts$/,
        use: "ts-loader",
        exclude: "/node_modules/",
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: { url: false },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [new CopyWebpackPlugin({ patterns: [{ from: "public", to: "." }] })],
};

export default config;
