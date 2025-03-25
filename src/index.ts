import BaseLoader from "./lib/BaseLoader";

const getLoader = async (type: string): Promise<BaseLoader> => {
    switch (type) {
        case 'nacos':
            let NacosLoader = (await import('./lib/nacos/NacosConfigLoader')).default;
            return new NacosLoader();
        case 'consul':
            let ConsulLoader = (await import('./lib/consul/ConsulLoader')).default;
            return new ConsulLoader();
        default:
            let LocalFileLoader = (await import('./lib/local-file/LocalFileLoader')).default;
            return new LocalFileLoader();
    }
}

export default BaseLoader;
export {getLoader}