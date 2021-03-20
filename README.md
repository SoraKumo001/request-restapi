# request-restapi

## About

Provides robust type checking based on the OpenAPI v3 format TypeScript definition output by 'openapi-typescript'

## Usage

```ts
import { paths } from "Type information output by openapi-typescript";
const rest = new Rest<paths>({ baseUrl: "Base URL", token:"Bearer access token (optional)" });
const result = await rest.request({
    path: "Endpoint path",
    params: "path parameter"
    method: "methods such as get and post",
    headers: "header",
    body: "Parameters required by body",
    token: "Bearer token (optional, priority is given)"
});

//result.code Return status
//result.body Return data
//result.headers Return headers
```

## Example

```.ts
//openapi-typescript https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.0/ghes-3.0.yaml > github.d.ts
import { Rest } from "request-restapi";
import { paths } from "./github";
import env from "dotenv";

env.config();
const token = process.env.TOKEN;
const rest = new Rest<paths>({ baseUrl: "https://api.github.com", token });

//Display user name
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

  // View repository list
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

  // View specific repository information
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
