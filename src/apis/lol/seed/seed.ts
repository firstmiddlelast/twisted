import { DataSeed } from '../../../constants/dataSeed'
import { MatchDto } from '../../../models-dto/matches/match/match.dto'
import { FetchError } from '../../../errors/fetch.error'
export class SeedApi {
  private readonly baseUrl = DataSeed.BASE

  private async request<T> (path: string): Promise<T> {
    return fetch(`${this.baseUrl}/${path}`, { method: 'GET' })
    .then (response => {
      if (!response.ok) {
        throw new FetchError(
          `HTTP error! status: ${response.status}`);
      }
      return response.json().catch(jsonError => {
        throw new FetchError ("Error retrieving JSON object : " + jsonError.message)
      });
    })
  }

  async matches (id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10): Promise<{ matches: MatchDto[] }> {
    if (id < 1 || id > 10) {
      throw new Error('Invalid index')
    }
    const path = `matches${id}.json`
    return this.request(path)
  }
}
