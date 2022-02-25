import fetch from "isomorphic-fetch";
interface Props {
  baseUrl: string;
  authKey?: string;
  token?: string | null;
  headers?: { [key: string]: string };
}

export class Rest<T> {
  private readonly baseUrl: string;
  private readonly authKey: string;
  private readonly token?: string | null;
  private readonly headers?: { [key: string]: string };
  constructor({ baseUrl, token, authKey = "Bearer", headers }: Props) {
    this.baseUrl = baseUrl;
    this.authKey = authKey;
    this.token = token;
    this.headers = headers;
  }
  public request<
    P extends T,
    PATH extends keyof P,
    METHOD extends keyof P[PATH],
    MULTI extends boolean,
    RET extends P[PATH][METHOD] extends { responses: infer RES }
      ? {
          [P in keyof RES]: {
            code: P;
            headers: Headers;
            body: RES[P] extends { schema: infer R }
              ? R
              : RES[P] extends { content: { "application/json": infer R2 } }
              ? R2
              : Blob;
          };
        }[keyof RES]
      : never
  >({
    method,
    path,
    params,
    headers,
    query,
    body,
    token,
    multipart,
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
    body?: MULTI extends true
      ? { [key: string]: string | Blob }
      : P[PATH][METHOD] extends {
          requestBody: { content: { [key: string]: infer R } };
        }
      ? R
      : never;
    token?: string | null;
    multipart?: MULTI;
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
    const createFormData = (params: { [key: string]: string | Blob }) => {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      return formData;
    };
    const requestHeaders = {
      ...(this.headers ? this.headers : {}),
      ...(typeof headers === "object" ? headers : {}),
      ...(!multipart ? { "Content-Type": "application/json" } : {}),
      ...(token || this.token
        ? { Authorization: `${this.authKey} ${token || this.token}` }
        : {}),
    };
    return fetch(this.baseUrl + regularParam + queryParam, {
      method: (method as string).toUpperCase(),
      headers: requestHeaders,
      body:
        body &&
        (multipart === true
          ? createFormData(body as { [key: string]: string | Blob })
          : JSON.stringify(body)),
      credentials: "same-origin",
    }).then(
      async (res) =>
        ({
          code: res.status,
          headers: res.headers,
          body: await res
            .json()
            .catch(async () => await res.blob())
            .catch(async () => await res.text())
            .catch(() => undefined),
        } as RET)
    );
  }
}
