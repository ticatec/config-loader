import  { loadConfig} from "../index";
import dotenv from "dotenv"

const main = async (): Promise<any> => {
    dotenv.config();
    let type = process.env['CONFIG_MODE'];
    let config = await loadConfig(type, process.env['CONFIG_FILE'], 'dev/common-logger.yaml', (content: string): string => {
        let s= content.replace(/#{service-name}/g, 'my-service');
        console.log("替换后", s);
        return s;
    });
    console.log(config.appConf, config.loggerConf)
}

main().then(()=>{

});

