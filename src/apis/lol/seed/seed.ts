import { DataSeed } from '../../../constants/dataSeed'
import { MatchDto } from '../../../models-dto/matches/match/match.dto'
import { FetchError } from '../../../errors/fetch.error'

export class SeedApi {
  private readonly baseUrl = DataSeed.BASE

  private async request<T> (path: string): Promise<T> {
    const url = `${this.baseUrl}/${path}`
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new FetchError(
        `HTTP error! status: ${response.status}`,
        response.status,
        errorData,
        response.headers,
        undefined,
        undefined
      );
    }
    return await response.json();
  }

  async matches (id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): Promise<{ matches: MatchDto[] }> {
    if (id < 1 || id > 10) {
      throw new Error('Invalid index')
    }
    const path = `matches${id}.json`
    return this.request(path)
  }
}
