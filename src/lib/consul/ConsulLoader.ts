import BaseLoader from "../BaseLoader";
import Consul from "consul";


export default class ConsulLoader extends BaseLoader {

    private readonly consul: Consul;

    constructor() {
        super();
        let config: any = {
            host: process.env['CONSUL_HOST'],
            token: process.env['CONSUL_TOKEN'],
            secure: (process.env['SSL'] ?? 'false').toLowerCase() == 'true'
        }
        let port: string = process.env['CONSUL_PORT'];
        console.log("配置参数：", config, port);
        config.port = port != null ? parseInt(port) : (config.secure ? 443 : 80);
        this.consul = new Consul(config)
    }

    protected async loadFile(fileName: string): Promise<string> {
        let result =await this.consul.kv.get(fileName);
        return result?.Value;
    }

}