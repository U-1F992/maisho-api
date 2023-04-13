# maisho-api

毎日小学生新聞の連載「[毎小ニュース](https://mainichi.jp/maisho/ch170361626i/%E6%AF%8E%E5%B0%8F%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9)」をAPI風に提供する。

## Usage

`/api/v1/articles?count=5&ruby=embed`

| オプション | 概要                                       |
| ---------- | ------------------------------------------ |
| count      | 取得する記事数（default:5, min:0, max:20） |
| ruby       | ルビの表示方法（default:embed）            |

| ruby    | 表示方法             |
| ------- | -------------------- |
| embed   | 括弧で囲んで埋め込む |
| replace | ルビ内容で置き換える |
| remove  | ルビを削除する       |
