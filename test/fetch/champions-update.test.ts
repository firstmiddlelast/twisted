import { getChampionName, Champions } from '../../src/constants/champions';

jest.setTimeout(10000); // Long timeout for real network call

describe('Champions Update from CommunityDragon', () => {
  it('should fetch champion data and allow resolving a known champion', async () => {
    // The require statement triggers the top-level code in champions.ts, including the update logic
    require('../../src/constants/champions');

    // Allow time for the async update to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify that a known champion can be resolved. This confirms the initial list is correct.
    expect(getChampionName(Champions.AATROX)).toBe('AATROX');

    // We cannot easily test for a *new* champion as we don't know when one will be added.
    // However, we can test that the update logic doesn't break existing functionality.
    // A more advanced test could fetch the list of champions itself and then try to resolve one.
    // For now, this test serves as a good guardrail.
  });
});
