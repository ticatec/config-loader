import BaseLoader, {getLoader} from "../index";
import dotenv from "dotenv"

const main = async (): Promise<any> => {
    dotenv.config();
    let type = process.env['CONFIG_MODE'];
    let loader: BaseLoader = await getLoader(type);
    console.log(await loader.load(process.env['CONFIG_FILE']));

    console.log(await loader.load('dev/common-logger.yaml', /#{service-name}/g, 'my-service'))
}

main().then(()=>{

});

