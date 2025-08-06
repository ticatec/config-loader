import BaseLoader from "../BaseLoader";
import Consul from "consul";


export default class ConsulLoader extends BaseLoader {

    private readonly consul: Consul;

    /**
     * Create a new ConsulLoader instance with configuration from environment variables
     */
    constructor() {
        super();
        let config: any = {
            host: process.env['CONSUL_HOST'],
            secure: (process.env['SSL'] ?? 'false').toLowerCase() == 'true',
            defaults: {
                token: process.env['CONSUL_TOKEN']
            }
        }
        let port: string = process.env['CONSUL_PORT'];
        config.port = port != null ? parseInt(port) : (config.secure ? 443 : 80);
        this.consul = new Consul(config)
    }

    /**
     * Load configuration file content from Consul KV store
     * @param fileName - The key name in Consul KV store
     * @returns Promise that resolves to the configuration content as string
     * @protected
     */
    protected async loadFile(fileName: string): Promise<string> {
        let result =await this.consul.kv.get(fileName);
        return result?.Value;
    }

}