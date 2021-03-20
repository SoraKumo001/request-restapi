# request-restapi

## 用途

openapi-typescriptで出力したOpenAPIv3形式のTypeScript定義を元にして、強固な型チェックを提供します

## 使い方

```ts
import { paths } from "openapi-typescriptで出力した型情報";
const rest = new Rest<paths>({ baseUrl: "基本となるURL", token:"Bearerアクセスtoken(省略可能)" });
const result = await rest.request({
    path: "エンドポイントpath",
    params: "pathパラメータ"
    method: "get,postなどのメソッド",
    headers: "ヘッダ",
    body: "bodyで要求されるパラメータ"
});

//result.code 返却ステータス
//result.body 返却データ
//result.headers 返却ヘッダ
```

## 使用例

```.ts
//openapi-typescript https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.yaml > github.d.ts

import { paths } from "./github";
import env from "dotenv";

env.config(); // '.env'ファイルにTOKENを設定してください
const token = process.env.TOKEN;
const rest = new Rest<paths>({ baseUrl: "https://api.github.com", token });

//ユーザ名の表示
(async () => {
  const resultUser = await rest.request({
    path: "/user",
    method: "get",
  });
  // codeを識別した時点でbodyが確定する
  if (resultUser.code === 200) {
    const { body } = resultUser;
    console.log(`UserName: ${body.name}`);
  } else {
    console.error(resultUser);
  }
  console.log("---------");
  //リポジトリ一覧の表示
  for (let page = 1; page < 100; page++) {
    const result = await rest.request({
      path: "/user/repos",
      method: "get",
      query: { page },
    });
    if (result.code === 200) {
      const { body } = result;
      if (body.length === 0) break;
      body.forEach((value) => {
        console.log(value.name);
      });
    } else {
      console.error(result);
      break;
    }
  }
  console.log("---------");
  //特定のリポジトリ情報を表示
  const resultRepo = await rest.request({
    path: "/repos/{owner}/{repo}",
    params: { owner: "SoraKumo001", repo: "request-restapi" },
    method: "get",
  });
  if (resultRepo.code === 200) {
    const { body, headers } = resultRepo;
    console.log(body);
    console.log(headers);
  } else {
    console.error(resultRepo);
  }
})();
```
