import { SeedApi } from '../../src/apis/lol/seed/seed';

jest.setTimeout(10000); // Long timeout for real network call

describe('SeedApi (Integration Tests)', () => {
  let seedApi: SeedApi;

  beforeEach(() => {
    seedApi = new SeedApi();
  });

  it('fetches matches data for a valid ID', async () => {
    // Test with a valid ID (1 to 10)
    const matchId = 1;
    const result = await seedApi.matches(matchId);

    expect(result).toHaveProperty('matches');
    expect(Array.isArray(result.matches)).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);

    // Check structure of a match object
    const firstMatch = result.matches[0];
    expect(firstMatch).toHaveProperty('gameId');
    expect(typeof firstMatch.gameId).toBe('number');
    expect(firstMatch).toHaveProperty('platformId');
    expect(typeof firstMatch.platformId).toBe('string');
  });

  it('throws an error for an invalid match ID', async () => {
    // Test with an invalid ID (outside 1 to 10)
    const invalidMatchId = 0; // Or 11

    await expect(seedApi.matches(invalidMatchId as any)).rejects.toThrow('Invalid index');
  });
});
