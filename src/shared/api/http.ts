/** fetch 기반 HTTP 클라이언트 */
class HttpClient {
  private baseURL: string;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  private async request<T = unknown>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestInit,
  ): Promise<T> {
    const { headers, ...rest } = config || {};

    const response = await fetch(this.baseURL + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...rest,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw {
        status: response.status,
        message: errorData?.message || `요청 실패: ${response.status}`,
      };
    }

    return response.json() as Promise<T>;
  }

  public get<T>(url: string, config?: RequestInit): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  public post<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  public put<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  public patch<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  public delete<T>(url: string, config?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}

/** 내부 Next.js API Route용 클라이언트 */
export const api = new HttpClient();

/** OSRM 경로 엔진 클라이언트 */
export const osrmApi = new HttpClient(process.env.NEXT_PUBLIC_OSRM_BASE_URL!);
