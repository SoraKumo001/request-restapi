import { Rest } from "../src";
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
    params: { owner: "SoraKumo001", repo: "jswl-rwindow" },
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
