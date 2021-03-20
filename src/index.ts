import fetch from "node-fetch";

interface Props {
  baseUrl: string;
  authKey?: string;
  token?: string;
}

export class Rest<T> {
  private readonly baseUrl: string;
  private readonly authKey: string;
  private readonly token?: string;
  constructor({ baseUrl, token, authKey = "Bearer" }: Props) {
    this.baseUrl = baseUrl;
    this.authKey = authKey;
    this.token = token;
  }
  public request<
    P extends T,
    PATH extends keyof P,
    METHOD extends keyof P[PATH],
    RET extends P[PATH][METHOD] extends { responses: infer res }
      ? {
          [P in keyof res]: {
            code: P;
            headers: Headers;
            body: res[P] extends { schema: infer R }
              ? R
              : res[P] extends { content: { "application/json": infer R2 } }
              ? R2
              : Blob;
          };
        } extends {
          [P in string]: infer R;
        }
        ? R
        : never
      : never
  >({
    method,
    path,
    params,
    headers,
    query,
    body,
    token,
  }: {
    method: METHOD;
    path: PATH;
    params?: P[PATH][METHOD] extends { parameters: { path: infer R } }
      ? R extends { [M in keyof R]: R[M] }
        ? R
        : never
      : P[PATH] extends { parameters: { path: infer R } }
      ? R extends { [M in keyof R]: R[M] }
        ? R
        : never
      : never;
    headers?: P[PATH][METHOD] extends { parameters: { header: infer R } }
      ? R extends { [_ in string]: unknown }
        ? R
        : never
      : never;
    query?: P[PATH][METHOD] extends { parameters: { query: infer R } }
      ? R extends { [_ in string]: unknown }
        ? R
        : never
      : never;
    body?: P[PATH][METHOD] extends {
      requestBody: { content: { [key: string]: infer R } };
    }
      ? R
      : never;
    token?: string;
  }): Promise<RET> {
    const regularParam = params
      ? Object.entries(params).reduce(
          (p, [key, value]) =>
            p.replace(new RegExp(`\\{${key}\\}`), String(value)),
          path as string
        )
      : path;
    const queryParam = query
      ? Object.entries(query)
          .reduce((a, [key, value]) => `${a}${key}=${value}&`, "?")
          .trimEnd()
      : "";
    return fetch(this.baseUrl + regularParam + queryParam, {
      method: (method as string).toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...(typeof headers === "object" ? headers : {}),
        ...(token || this.token
          ? { Authorization: `${this.authKey} ${token || this.token}` }
          : {}),
      },
      body: body && JSON.stringify(body),
    }).then(
      async (res) =>
        ({
          code: res.status,
          headers: res.headers,
          body: await res.json().catch(async () => await res.blob()),
        } as RET)
    );
  }
}
