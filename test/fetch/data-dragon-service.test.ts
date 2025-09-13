import { DataDragonService } from '../../src/apis/lol/dataDragon/DataDragonService';
import { DataDragonEnum } from '../../src/constants/dataDragon';
import { RealmServers } from '../../src/constants/realmServers';
import { Champions, getChampionNameCapital } from '../../src/constants/champions';
import { RealmDTO, ChampionsDataDragon, QueuesDataDragonDTO, GameModesDataDragonDTO } from '../../src/models-dto';
import { MapsDataDragonDTO } from '../../src/models-dto/data-dragon/maps.datadragon.dto';
import { GameTypesDataDragonDTO } from '../../src/models-dto/data-dragon/game-types.datadragon.dto';
import { RunesReforgedDTO } from '../../src/models-dto/data-dragon/runes-reforged.dto';

// Set a long timeout for integration tests
jest.setTimeout(60000); // 60 seconds per test

// Simple delay function
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('DataDragonService (Integration Tests)', () => {
  let service: DataDragonService;

  beforeEach(() => {
    service = new DataDragonService();
  });

  // Add a small delay between tests to be safe with potential rate limits
  afterEach(async () => {
    await delay(1000); // 1 second delay
  });

  it('should get versions from the real API', async () => {
    const result = await service.getVersions();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]).toBe('string');
  });

  it('should get realms for EUW from the real API', async () => {
    const result = await service.getRealms(RealmServers.EU_WEST);
    expect(result).toHaveProperty('cdn');
    expect(typeof result.cdn).toBe('string');
    expect(result).toHaveProperty('n');
    expect(typeof result.n).toBe('object');
  });

  it('should get languages from the real API', async () => {
    const result = await service.getLanguages();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]).toBe('string');
  });

  it('should get runes reforged from the real API', async () => {
    const result = await service.getRunesReforged('en_US');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('key');
  });

  it('should get champion list from the real API', async () => {
    const result = await service.getChampionList('en_US');
    expect(result).toHaveProperty('type');
    expect(result.type).toBe('champion');
    expect(result).toHaveProperty('data');
    expect(typeof result.data).toBe('object');
  });

  it('should get all champions (overload 1) from the real API', async () => {
    const result = await service.getChampion();
    expect(result).toHaveProperty('type');
    expect(result.type).toBe('champion');
    expect(result).toHaveProperty('data');
    expect(typeof result.data).toBe('object');
  });

  it('should get a specific champion by ID (overload 2) from the real API', async () => {
    const result = await service.getChampion(Champions.AATROX, 'en_US');
    expect(result).toHaveProperty('id');
    expect(result.id).toBe('Aatrox');
    expect(result).toHaveProperty('key');
    expect(result.key).toBe('266');
  });

  it('should get queues from the real API', async () => {
    const result = await service.getQueues();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('queueId');
  });

  it('should get seasons from the real API', async () => {
    const result = await service.getSeasons();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
  });

  it('should get maps from the real API', async () => {
    const result = await service.getMaps();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('mapId');
  });

  it('should get game modes from the real API', async () => {
    const result = await service.getGameModes();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('gameMode');
  });

  it('should get game types from the real API', async () => {
    const result = await service.getGameTypes();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('gametype');
  });
});
