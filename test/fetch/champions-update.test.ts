import { getChampionName, Champions, startChampionUpdates, stopChampionUpdates } from '../../src/constants/champions';

jest.setTimeout(10000); // Long timeout for real network call

describe('Champions Update from CommunityDragon', () => {
  it('should fetch champion data and allow resolving a known champion', async () => {
    // Verify that a known champion can be resolved. This confirms the initial list is correct.
    expect(getChampionName(Champions.AATROX)).toBe('AATROX');

    // We check the update has been done using the fact that CDragon has a "NONE" champion
    // that is not included in champions.ts
    try {
      getChampionName(-1);
      fail("There shoud be no champion for id -1");
    }
    catch (e) { }
    await startChampionUpdates().then(() => {
      stopChampionUpdates()
      expect(getChampionName(-1)).toBe("NONE")
    }
    )

    // We cannot easily test for a *new* champion as we don't know when one will be added.
    // However, we can test that the update logic doesn't break existing functionality.
    // A more advanced test could fetch the list of champions itself and then try to resolve one.
    // For now, this test serves as a good guardrail.
  });
});
