export interface FetchRequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, any>; // For query parameters
  data?: any; // For request body (POST/PUT)
}
