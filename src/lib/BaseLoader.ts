import YAML from "yaml";

export type PostLoader = (content: string) => string;

export default abstract class BaseLoader {

    private set: Map<string, number> = new Map();


    protected constructor() {

    }

    /**
     * Load configuration file content
     * @param fileName - The name of the configuration file to load
     * @returns Promise that resolves to the file content as string
     * @protected
     */
    protected abstract loadFile(fileName: string): Promise<string>;

    /**
     * Load and parse configuration file with optional post-processing
     * @param fileName - The name of the configuration file to load
     * @param postLoader - Optional function to process the file content before parsing
     * @returns Promise that resolves to the parsed configuration object
     * @protected
     */
    protected async loadConfig(fileName: string, postLoader: PostLoader): Promise<any> {
        let text = await this.loadFile(fileName);
        if (postLoader) {
            text = postLoader(text);
        }
        console.log('解析文本', text);
        return YAML.parse(text);
    }


    /**
     * Load a configuration file with support for nested includes
     * @param fileName - The name of the configuration file to load
     * @param postLoader - Optional function to process the file content before parsing
     * @returns Promise that resolves to the complete configuration object with includes merged
     */
    async load(fileName: string, postLoader: PostLoader = null): Promise<any> {
        let config = await this.loadConfig(fileName, postLoader);
        if (config.includes != null) {
            let includeFiles:any = Array.isArray(config.includes) ? config.includes : [config.includes];
            delete config.includes;
            for (let includeFile of includeFiles) {
                let file = includeFile.file;
                let key = includeFile.key;
                let nestConfig:any = {};
                nestConfig[key] = {...await this.loadConfig(file, postLoader), ...includeFile.params};
                config = this.deepMerge(nestConfig, config);
            }
        }
        return config;
    }

    /**
     * Recursively merge two objects, combining arrays and nested objects
     * @param obj1 - The first object to merge
     * @param obj2 - The second object to merge (takes precedence)
     * @returns The merged object
     * @protected
     */
    protected deepMerge(obj1: any, obj2: any): any {
        const result = {...obj1};
        for (const key in obj2) {
            if (Array.isArray(obj2[key])) {
                result[key] = [...(obj1[key] || []), ...obj2[key]]; // 合并数组
            } else if (obj2[key] instanceof Object && !Array.isArray(obj2[key]) && obj1[key] instanceof Object) {
                result[key] = this.deepMerge(obj1[key], obj2[key]); // 递归合并对象
            } else {
                result[key] = obj2[key]; // 覆盖非对象或数组属性
            }
        }
        return result;
    }
}

/**
 * Get configuration loader instance based on type
 * @param type - The type of loader ('nacos', 'consul', or default 'local')
 * @returns Promise that resolves to a BaseLoader instance
 */
const getLoader = async (type: string): Promise<BaseLoader> => {
    switch (type) {
        case 'nacos':
            let NacosLoader = (await import('./nacos/NacosConfigLoader')).default;
            return new NacosLoader();
        case 'consul':
            let ConsulLoader = (await import('./consul/ConsulLoader')).default;
            return new ConsulLoader();
        default:
            let LocalFileLoader = (await import('./local-file/LocalFileLoader')).default;
            return new LocalFileLoader();
    }
}

/**
 * Load both application configuration and logger configuration
 * @param configMode - The configuration mode ('nacos', 'consul', or 'local')
 * @param configFile - The path to the application configuration file
 * @param logFile - The path to the logger configuration file
 * @param loggerPostLoader - Function to process logger configuration content
 * @returns Promise that resolves to an object containing appConf and loggerConf
 */
const loadConfig = async (configMode: string, configFile: string, logFile: string, loggerPostLoader: PostLoader): Promise<any> => {
    let loader = await getLoader(configMode);
    let loggerConf = await loader.load(logFile, loggerPostLoader);
    let appConf = await loader.load(configFile)
    return {appConf, loggerConf}
}

export {
    getLoader,
    loadConfig
}
