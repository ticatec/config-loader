import YAML from "yaml";

export default abstract class BaseLoader {

    private set: Map<string, number> = new Map();


    protected constructor() {

    }

    /**
     * 读取配置文件
     * @param fileName
     * @protected
     */
    protected abstract loadFile(fileName: string): Promise<string>;

    protected async loadConfig(fileName: string, regexp: RegExp = null, newString: string = null): Promise<any> {
        let text = await this.loadFile(fileName);
        if (regexp && newString) {
            text = text.replace(regexp, newString);
        }
        return YAML.parse(text);
    }


    async load(fileName: string, regexp: RegExp = null, newString: string = null): Promise<any> {
        let config = await this.loadConfig(fileName, regexp, newString);
        if (config.includes != null) {
            let includeFiles:any = Array.isArray(config.includes) ? config.includes : [config.includes];
            delete config.includes;
            for (let includeFile of includeFiles) {
                let file = includeFile.file;
                let key = includeFile.key;
                let nestConfig:any = {};
                nestConfig[key] = {...await this.loadConfig(file, regexp, newString), ...includeFile.params};
                config = this.deepMerge(nestConfig, config);
            }
        }
        return config;
    }

    /**
     * Deep merge two objects
     * @param obj1
     * @param obj2
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