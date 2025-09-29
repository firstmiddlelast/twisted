import { getChampionName, Champions, startChampionUpdates, stopChampionUpdates } from '../../src/constants/champions';

jest.setTimeout(20000); // Long timeout for real network call

describe('Champions Update from CommunityDragon', () => {
  it('should fetch champion data and allow resolving a known champion', async () => {
    // Verify that a known champion can be resolved. This confirms the initial list is correct.
    expect(getChampionName(Champions.AATROX)).toBe('AATROX');

    try {
      getChampionName(-1);
      fail("There shoud be no champion for id -1");
    }
    catch (e) {
      // expected exception : success
    }
  });

  it('start/stop auto-updating champions list', async () => {
    await startChampionUpdates(3).then(async (interval) => {
      expect(interval).toBe(3)
      // We check the update has been done using the fact that CDragon has a "NONE" champion
      // that is not included in champions.ts
      expect(getChampionName(-1)).toBe("NONE")
      delete (Champions as any)['NONE']
      await new Promise((resolve) => setTimeout(resolve, 1000 * 4))
      expect(getChampionName(-1)).toBe("NONE")
      stopChampionUpdates()
      delete (Champions as any)['NONE']
      delete (Champions as any)['-1']
      await new Promise((resolve) => setTimeout(resolve, 1000 * 4))
      try {
        getChampionName(-1);
        fail("there should be no champion for id -1")
      } catch (e) {
        // expected exception : success
      }
    })
  });
});
