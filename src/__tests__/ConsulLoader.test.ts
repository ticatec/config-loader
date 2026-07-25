import ConsulLoader from '../lib/consul/ConsulLoader';
import Consul from 'consul';

// Mock Consul module
jest.mock('consul');
const MockedConsul = Consul as jest.MockedClass<typeof Consul>;

describe('ConsulLoader', () => {
    let loader: ConsulLoader;
    let mockConsul: any;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        originalEnv = { ...process.env };
        for (const key of Object.keys(process.env)) {
            delete process.env[key];
        }

        // Create a mock Consul instance
        mockConsul = {
            kv: {
                get: jest.fn()
            }
        };

        MockedConsul.mockImplementation(() => mockConsul);
    });

    afterEach(() => {
        for (const key of Object.keys(process.env)) {
            delete process.env[key];
        }
        Object.assign(process.env, originalEnv);
    });

    describe('constructor', () => {
        it('should create instance with default configuration when no env vars set', () => {
            loader = new ConsulLoader();
            expect(MockedConsul).toHaveBeenCalled();
            expect(mockConsul).toBeDefined();
        });

        it('should use CONSUL_HOST from environment', () => {
            process.env.CONSUL_HOST = 'consul.example.com';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.host).toBe('consul.example.com');
        });

        it('should use CONSUL_PORT from environment', () => {
            process.env.CONSUL_PORT = '8500';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.port).toBe(8500);
        });

        it('should use SSL=true from environment', () => {
            process.env.SSL = 'true';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.secure).toBe(true);
            expect(config.port).toBe(443);
        });

        it('should use SSL=false from environment', () => {
            process.env.SSL = 'false';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.secure).toBe(false);
            expect(config.port).toBe(80);
        });

        it('should prioritize CONSUL_PORT over default SSL port', () => {
            process.env.SSL = 'true';
            process.env.CONSUL_PORT = '8443';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.port).toBe(8443);
            expect(config.secure).toBe(true);
        });

        it('should use CONSUL_TOKEN from environment', () => {
            process.env.CONSUL_TOKEN = 'test-token-12345';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.defaults?.token).toBe('test-token-12345');
        });

        it('should parse CONSUL_PORT as integer', () => {
            process.env.CONSUL_PORT = '8500';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(typeof config.port).toBe('number');
            expect(config.port).toBe(8500);
        });

        it('should handle SSL with any case variation', () => {
            process.env.SSL = 'TRUE';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.secure).toBe(true);
        });

        it('should set default port to 80 when SSL is false and no port specified', () => {
            process.env.SSL = 'false';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.port).toBe(80);
        });

        it('should set default port to 443 when SSL is true and no port specified', () => {
            process.env.SSL = 'true';
            loader = new ConsulLoader();

            const config = MockedConsul.mock.calls[0][0];
            expect(config.port).toBe(443);
        });
    });

    describe('loadFile', () => {
        beforeEach(() => {
            loader = new ConsulLoader();
        });

        it('should successfully load a key from Consul KV store', async () => {
            const mockValue = 'database:\n  host: localhost\n  port: 5432';
            mockConsul.kv.get.mockResolvedValue({ Value: mockValue });

            const result = await (loader as any).loadFile('config/database');
            expect(result).toBe(mockValue);
            expect(mockConsul.kv.get).toHaveBeenCalledWith('config/database');
        });

        it('should return null when key does not exist', async () => {
            mockConsul.kv.get.mockResolvedValue(null);

            const result = await (loader as any).loadFile('nonexistent');
            expect(result).toBeNull();
        });

        it('should return undefined when Value field is missing', async () => {
            mockConsul.kv.get.mockResolvedValue({});

            const result = await (loader as any).loadFile('config/test');
            expect(result).toBeUndefined();
        });

        it('should handle Consul KV errors', async () => {
            const error = new Error('Consul connection failed');
            mockConsul.kv.get.mockRejectedValue(error);

            await expect((loader as any).loadFile('config/test')).rejects.toThrow(error);
        });

        it('should load empty values', async () => {
            mockConsul.kv.get.mockResolvedValue({ Value: '' });

            const result = await (loader as any).loadFile('config/empty');
            expect(result).toBe('');
        });

        it('should load values with special characters', async () => {
            const mockValue = 'config:\n  password: "p@ssw0rd!"\n  path: "/usr/local/bin"';
            mockConsul.kv.get.mockResolvedValue({ Value: mockValue });

            const result = await (loader as any).loadFile('config/special');
            expect(result).toBe(mockValue);
        });
    });

    describe('load integration', () => {
        beforeEach(() => {
            loader = new ConsulLoader();
        });

        it('should load and parse YAML from Consul KV', async () => {
            const yamlContent = `
app:
  name: test-app
  port: 3000
database:
  host: localhost
  port: 5432
            `.trim();

            mockConsul.kv.get.mockResolvedValue({ Value: yamlContent });

            const result = await loader.load('config/app', null);
            expect(result).toEqual({
                app: {
                    name: 'test-app',
                    port: 3000
                },
                database: {
                    host: 'localhost',
                    port: 5432
                }
            });
        });

        it('should apply postLoader to Consul KV content', async () => {
            const yamlContent = 'name: #{service-name}\nport: 3000';
            mockConsul.kv.get.mockResolvedValue({ Value: yamlContent });

            const postLoader = (content: string) => content.replace('#{service-name}', 'my-service');
            const result = await loader.load('config/app', postLoader);

            expect(result).toEqual({
                name: 'my-service',
                port: 3000
            });
        });

        it('should handle YAML parse errors', async () => {
            const invalidYaml = 'invalid: [unclosed bracket';
            mockConsul.kv.get.mockResolvedValue({ Value: invalidYaml });

            await expect(loader.load('config/invalid', null)).rejects.toThrow(
                "Failed to parse YAML configuration file 'config/invalid'"
            );
        });

        it('should handle null Value from Consul', async () => {
            mockConsul.kv.get.mockResolvedValue({ Value: null });

            const result = await loader.load('config/null', null);
            expect(result).toBeNull();
        });
    });

    describe('load with includes', () => {
        beforeEach(() => {
            loader = new ConsulLoader();
        });

        it('should load included configurations from Consul KV', async () => {
            const mainConfig = `
includes:
  - file: config/database
    key: database
app:
  name: test-app
            `.trim();

            const dbConfig = `
host: localhost
port: 5432
            `.trim();

            mockConsul.kv.get.mockImplementation((key: string) => {
                if (key === 'config/database') {
                    return Promise.resolve({ Value: dbConfig });
                }
                return Promise.resolve({ Value: mainConfig });
            });

            const result = await loader.load('config/main', null);
            expect(result).toEqual({
                app: { name: 'test-app' },
                database: { host: 'localhost', port: 5432 }
            });
        });

        it('should handle multiple includes from Consul KV', async () => {
            const mainConfig = `
includes:
  - file: config/db
    key: database
  - file: config/cache
    key: cache
app:
  name: multi-include
            `.trim();

            mockConsul.kv.get.mockImplementation((key: string) => {
                if (key === 'config/db') {
                    return Promise.resolve({ Value: 'host: localhost\nport: 5432' });
                }
                if (key === 'config/cache') {
                    return Promise.resolve({ Value: 'enabled: true\nttl: 3600' });
                }
                return Promise.resolve({ Value: mainConfig });
            });

            const result = await loader.load('config/main', null);
            expect(result).toEqual({
                app: { name: 'multi-include' },
                database: { host: 'localhost', port: 5432 },
                cache: { enabled: true, ttl: 3600 }
            });
        });
    });

    describe('edge cases', () => {
        beforeEach(() => {
            loader = new ConsulLoader();
        });

        it('should handle very large configuration files', async () => {
            const largeConfig = Array(1000).fill(0).map((_, i) => `key${i}: value${i}`).join('\n');
            mockConsul.kv.get.mockResolvedValue({ Value: largeConfig });

            const result = await loader.load('config/large', null);
            expect(result).toBeDefined();
            expect(Object.keys(result).length).toBe(1000);
        });

        it('should handle configuration with arrays', async () => {
            const arrayConfig = `
servers:
  - server1.example.com
  - server2.example.com
  - server3.example.com
ports: [80, 443, 8080]
            `.trim();

            mockConsul.kv.get.mockResolvedValue({ Value: arrayConfig });

            const result = await loader.load('config/arrays', null);
            expect(result.servers).toHaveLength(3);
            expect(result.ports).toHaveLength(3);
        });

        it('should handle configuration with special YAML features', async () => {
            const specialConfig = `
anchors:
  - &default
    enabled: true
    timeout: 30

features:
  - <<: *default
    name: feature1
  - <<: *default
    name: feature2
            `.trim();

            mockConsul.kv.get.mockResolvedValue({ Value: specialConfig });

            const result = await loader.load('config/special', null);
            expect(result.features).toBeDefined();
            expect(result.features).toHaveLength(2);
        });
    });
});