/** REF-309：provider 包 API mock 单测共用 fetch 响应构造 */
export function createMockResponse(
  ok: boolean,
  data: unknown = null,
  status: number = 200,
  statusText: string = 'OK',
) {
  return {
    ok,
    status,
    statusText,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  };
}
