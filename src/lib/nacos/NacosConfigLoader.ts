import { ClientOptions, NacosConfigClient } from 'nacos';
import BaseLoader from "../BaseLoader.js";

export default class NacosConfigLoader extends BaseLoader {

    private readonly group: string;
    private client: NacosConfigClient;

    /**
     * Create a new NacosConfigLoader instance with configuration from environment variables
     */
    constructor() {
        super();
        let options: ClientOptions = {
            endpoint: process.env['NACOS_ENDPOINT'],
            namespace: process.env['NACOS_NAMESPACE']
        };
        this.group = process.env['NACOS_GROUP'] ?? 'default';
        const endpoint = options.endpoint;
        if (!endpoint) {
            throw new Error('NACOS_ENDPOINT environment variable is required');
        }
        const isSSL = endpoint.toLowerCase().startsWith('https://');
        const port: string | undefined = process.env['NACOS_PORT'];
        options.serverPort = port != null ? parseInt(port, 10) : (isSSL ? 443 : 80);
        this.client = new NacosConfigClient(options);
    }

    /**
     * Load configuration file content from Nacos configuration center
     * @param fileName - The data ID of the configuration in Nacos
     * @returns Promise that resolves to the configuration content as string
     * @protected
     */
    protected async loadFile(fileName: string): Promise<string> {
        return await this.client.getConfig(fileName, this.group);
    }
}
