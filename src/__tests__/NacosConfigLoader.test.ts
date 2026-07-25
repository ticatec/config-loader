import NacosConfigLoader from '../lib/nacos/NacosConfigLoader';
import { NacosConfigClient } from 'nacos';

// Mock nacos module
jest.mock('nacos');
const MockedNacosConfigClient = NacosConfigClient as jest.MockedClass<typeof NacosConfigClient>;

describe('NacosConfigLoader', () => {
    let mockClient: any;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        originalEnv = { ...process.env };
        for (const key of Object.keys(process.env)) {
            delete process.env[key];
        }

        // Create a mock NacosConfigClient instance
        mockClient = {
            getConfig: jest.fn()
        };

        MockedNacosConfigClient.mockImplementation(() => mockClient);
    });

    afterEach(() => {
        for (const key of Object.keys(process.env)) {
            delete process.env[key];
        }
        Object.assign(process.env, originalEnv);
    });

    describe('constructor', () => {
        it('should throw error when NACOS_ENDPOINT is not set', () => {
            expect(() => new NacosConfigLoader()).toThrow(
                'NACOS_ENDPOINT environment variable is required'
            );
        });

        it('should use NACOS_ENDPOINT from environment', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.endpoint).toBe('http://nacos.example.com');
        });

        it('should use NACOS_NAMESPACE from environment', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            process.env.NACOS_NAMESPACE = 'test-namespace';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.namespace).toBe('test-namespace');
        });

        it('should use NACOS_GROUP from environment', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            process.env.NACOS_GROUP = 'test-group';
            const loader = new NacosConfigLoader();

            expect((loader as any).group).toBe('test-group');
        });

        it('should use default group when NACOS_GROUP is not set', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            const loader = new NacosConfigLoader();

            expect((loader as any).group).toBe('default');
        });

        it('should detect HTTPS endpoint and use port 443 by default', () => {
            process.env.NACOS_ENDPOINT = 'https://nacos.example.com';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBe(443);
        });

        it('should detect HTTP endpoint and use port 80 by default', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBe(80);
        });

        it('should use NACOS_PORT from environment', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            process.env.NACOS_PORT = '8848';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBe(8848);

            // Cleanup for next tests
            delete process.env.NACOS_PORT;
            delete process.env.NACOS_ENDPOINT;
        });

        it('should prioritize NACOS_PORT over default SSL port', () => {
            process.env.NACOS_ENDPOINT = 'https://nacos.example.com';
            process.env.NACOS_PORT = '8443';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBe(8443);

            // Cleanup for next tests
            delete process.env.NACOS_PORT;
            delete process.env.NACOS_ENDPOINT;
        });

        it('should parse NACOS_PORT as integer', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            process.env.NACOS_PORT = '8848';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(typeof options.serverPort).toBe('number');
            expect(options.serverPort).toBe(8848);

            // Cleanup for next tests
            delete process.env.NACOS_PORT;
            delete process.env.NACOS_ENDPOINT;
        });

        it('should handle uppercase HTTPS endpoint', () => {
            process.env.NACOS_ENDPOINT = 'HTTPS://nacos.example.com';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBe(443);

            // Cleanup for next tests
            delete process.env.NACOS_ENDPOINT;
        });

        it('should handle mixed case HTTPS endpoint', () => {
            process.env.NACOS_ENDPOINT = 'HtTpS://nacos.example.com';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBe(443);

            // Cleanup for next tests
            delete process.env.NACOS_ENDPOINT;
        });

        it('should not use default port when NACOS_PORT is explicitly set to empty string', () => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
            process.env.NACOS_PORT = '';
            const loader = new NacosConfigLoader();

            const options = MockedNacosConfigClient.mock.calls[0][0];
            expect(options.serverPort).toBeNaN();

            // Cleanup for next tests
            delete process.env.NACOS_PORT;
            delete process.env.NACOS_ENDPOINT;
        });
    });

    describe('loadFile', () => {
        beforeEach(() => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
        });

        it('should successfully load configuration from Nacos', async () => {
            mockClient.getConfig.mockResolvedValue('key1: value1\nkey2: value2');
            const loader = new NacosConfigLoader();

            const result = await (loader as any).loadFile('test.yaml');
            expect(result).toBe('key1: value1\nkey2: value2');
            expect(mockClient.getConfig).toHaveBeenCalledWith('test.yaml', 'default');
        });

        it('should use custom group when loading configuration', async () => {
            process.env.NACOS_GROUP = 'custom-group';
            mockClient.getConfig.mockResolvedValue('key: value');
            const loader = new NacosConfigLoader();

            await (loader as any).loadFile('test.yaml');
            expect(mockClient.getConfig).toHaveBeenCalledWith('test.yaml', 'custom-group');
        });

        it('should handle Nacos client errors', async () => {
            const error = new Error('Nacos connection failed');
            mockClient.getConfig.mockRejectedValue(error);
            const loader = new NacosConfigLoader();

            await expect((loader as any).loadFile('test.yaml')).rejects.toThrow(error);
        });

        it('should handle empty configuration', async () => {
            mockClient.getConfig.mockResolvedValue('');
            const loader = new NacosConfigLoader();

            const result = await (loader as any).loadFile('empty.yaml');
            expect(result).toBe('');
        });

        it('should handle configuration with special characters', async () => {
            const specialConfig = 'password: "p@ssw0rd!"\npath: "/usr/local/bin"';
            mockClient.getConfig.mockResolvedValue(specialConfig);
            const loader = new NacosConfigLoader();

            const result = await (loader as any).loadFile('special.yaml');
            expect(result).toBe(specialConfig);
        });

        it('should handle configuration with multiline strings', async () => {
            const multilineConfig = `
description: |
  This is a multiline
  description string
that spans multiple
lines.
            `.trim();
            mockClient.getConfig.mockResolvedValue(multilineConfig);
            const loader = new NacosConfigLoader();

            const result = await (loader as any).loadFile('multiline.yaml');
            expect(result).toBe(multilineConfig);
        });
    });

    describe('load integration', () => {
        beforeEach(() => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
        });

        it('should load and parse YAML from Nacos', async () => {
            const yamlContent = `
app:
  name: test-app
  port: 3000
database:
  host: localhost
  port: 5432
            `.trim();

            mockClient.getConfig.mockResolvedValue(yamlContent);
            const loader = new NacosConfigLoader();

            const result = await loader.load('app.yaml', null);
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

        it('should apply postLoader to Nacos configuration', async () => {
            const yamlContent = 'name: #{service-name}\nport: 3000';
            mockClient.getConfig.mockResolvedValue(yamlContent);
            const loader = new NacosConfigLoader();

            const postLoader = (content: string) => content.replace('#{service-name}', 'my-service');
            const result = await loader.load('app.yaml', postLoader);

            expect(result).toEqual({
                name: 'my-service',
                port: 3000
            });
        });

        it('should handle YAML parse errors', async () => {
            const invalidYaml = 'key: "unclosed string';
            mockClient.getConfig.mockResolvedValue(invalidYaml);
            const loader = new NacosConfigLoader();

            await expect(loader.load('invalid.yaml', null)).rejects.toThrow(
                "Failed to parse YAML configuration file 'invalid.yaml'"
            );
        });

        it('should handle null configuration from Nacos', async () => {
            mockClient.getConfig.mockResolvedValue(null);
            const loader = new NacosConfigLoader();

            const result = await loader.load('null.yaml', null);
            expect(result).toBeNull();
        });
    });

    describe('load with includes', () => {
        beforeEach(() => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
        });

        it('should load included configurations from Nacos', async () => {
            const mainConfig = `
includes:
  - file: database.yaml
    key: database
app:
  name: test-app
            `.trim();

            const dbConfig = `
host: localhost
port: 5432
            `.trim();

            mockClient.getConfig.mockImplementation((dataId: string) => {
                if (dataId === 'database.yaml') {
                    return Promise.resolve(dbConfig);
                }
                return Promise.resolve(mainConfig);
            });

            const loader = new NacosConfigLoader();
            const result = await loader.load('main.yaml', null);

            expect(result).toEqual({
                app: { name: 'test-app' },
                database: { host: 'localhost', port: 5432 }
            });
        });

        it('should handle multiple includes from Nacos', async () => {
            const mainConfig = `
includes:
  - file: db.yaml
    key: database
  - file: cache.yaml
    key: cache
app:
  name: multi-include
            `.trim();

            mockClient.getConfig.mockImplementation((dataId: string) => {
                if (dataId === 'db.yaml') {
                    return Promise.resolve('host: localhost\nport: 5432');
                }
                if (dataId === 'cache.yaml') {
                    return Promise.resolve('enabled: true\nttl: 3600');
                }
                return Promise.resolve(mainConfig);
            });

            const loader = new NacosConfigLoader();
            const result = await loader.load('main.yaml', null);

            expect(result).toEqual({
                app: { name: 'multi-include' },
                database: { host: 'localhost', port: 5432 },
                cache: { enabled: true, ttl: 3600 }
            });
        });

        it('should pass postLoader to included files', async () => {
            const mainConfig = `
includes:
  - file: template.yaml
    key: config
app:
  name: test
            `.trim();

            const templateConfig = 'url: #{api-url}\ntimeout: 30';

            mockClient.getConfig.mockImplementation((dataId: string) => {
                if (dataId === 'template.yaml') {
                    return Promise.resolve(templateConfig);
                }
                return Promise.resolve(mainConfig);
            });

            const postLoader = (content: string) => content.replace('#{api-url}', 'https://api.example.com');
            const loader = new NacosConfigLoader();
            const result = await loader.load('main.yaml', postLoader);

            expect(result).toEqual({
                app: { name: 'test' },
                config: { url: 'https://api.example.com', timeout: 30 }
            });
        });
    });

    describe('edge cases', () => {
        beforeEach(() => {
            process.env.NACOS_ENDPOINT = 'http://nacos.example.com';
        });

        it('should handle very large configuration files', async () => {
            const largeConfig = Array(1000).fill(0).map((_, i) => `key${i}: value${i}`).join('\n');
            mockClient.getConfig.mockResolvedValue(largeConfig);
            const loader = new NacosConfigLoader();

            const result = await loader.load('large.yaml', null);
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

            mockClient.getConfig.mockResolvedValue(arrayConfig);
            const loader = new NacosConfigLoader();

            const result = await loader.load('arrays.yaml', null);
            expect(result.servers).toHaveLength(3);
            expect(result.ports).toHaveLength(3);
        });

        it('should handle configuration with special YAML features', async () => {
            const specialConfig = `
anchors:
  defaults: &default
    enabled: true
    timeout: 30

features:
  - <<: *default
    name: feature1
  - <<: *default
    name: feature2
            `.trim();

            mockClient.getConfig.mockResolvedValue(specialConfig);
            const loader = new NacosConfigLoader();

            const result = await loader.load('special.yaml', null);
            expect(result.features).toBeDefined();
            expect(result.features).toHaveLength(2);
        });

        it('should handle UTF-8 characters in configuration', async () => {
            const utf8Config = 'app:\n  name: 测试应用\n  description: 应用程序描述';
            mockClient.getConfig.mockResolvedValue(utf8Config);
            const loader = new NacosConfigLoader();

            const result = await loader.load('utf8.yaml', null);
            expect(result.app.name).toBe('测试应用');
            expect(result.app.description).toBe('应用程序描述');
        });

        it('should handle configuration with emojis', async () => {
            const emojiConfig = 'app:\n  name: "My App 🚀"\n  status: "✅"';
            mockClient.getConfig.mockResolvedValue(emojiConfig);
            const loader = new NacosConfigLoader();

            const result = await loader.load('emoji.yaml', null);
            expect(result.app.name).toBe('My App 🚀');
            expect(result.app.status).toBe('✅');
        });
    });
});