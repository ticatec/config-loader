# Configuration Loader

This project provides a flexible and extensible configuration loader that supports loading configurations from various sources, including local files, Consul, and Nacos.

## Features

-   **Abstraction:** Uses an abstract `BaseLoader` class, allowing easy extension for new configuration sources.
-   **YAML Support:** Parses configuration files in YAML format.
-   **Include Mechanism:** Supports including and merging configurations from other files or sources.
-   **Deep Merge:** Implements a deep merge function to combine configurations.
-   **Source Flexibility:** Supports loading configurations from local files, Consul, and Nacos.
-   **Environment Variable Configuration:** Configures loaders using environment variables.

## Installation

```bash
npm i @ticatec/config-loade
```

## Usage

### Basic Usage

```typescript
import { getLoader } from '@ticatec/config-loade'; // Adjust the path as needed

async function loadConfiguration(type: string, fileName: string, regexp?: RegExp, newString?: string) {
  const loader = await getLoader(type);
  const config = await loader.load(fileName, regexp, newString);
  console.log(config);
  return config;
}

// Example usage with a local file
loadConfiguration('local', 'config.yaml');

// Example usage with Consul
// Make sure to set CONSUL_HOST, CONSUL_PORT, and CONSUL_TOKEN environment variables
loadConfiguration('consul', 'my-config-key');

// Example usage with Nacos
// Make sure to set NACOS_ENDPOINT, NACOS_NAMESPACE, and NACOS_GROUP environment variables
loadConfiguration('nacos', 'my-data-id');
```

### Loading from Local Files

Create a `config.yaml` file:

```yaml
app:
  name: My Application
  version: 1.0.0
includes:
  - file: include.yaml
    key: nested
    params:
      extra: true
```

Create an `include.yaml` file:

```yaml
message: Hello, World!
```

### Loading from Consul

Ensure you have a Consul server running and accessible. Set the following environment variables:

-   `CONSUL_HOST`: Consul server host.
-   `CONSUL_PORT`: Consul server port.
-   `CONSUL_TOKEN`: Consul access token (if required).
-   `SSL`: "true" or "false" to indicate if SSL is used.

Then, store your configuration in Consul KV store with a specific key.

### Loading from Nacos

Ensure you have a Nacos server running and accessible. Set the following environment variables:

-   `NACOS_ENDPOINT`: Nacos server endpoint (e.g., `http://localhost:8848`).
-   `NACOS_NAMESPACE`: Nacos namespace.
-   `NACOS_GROUP`: Nacos group (defaults to `default`).
-   `NACOS_PORT`: Nacos server port.

Then, store your configuration in Nacos Config with a specific data ID and group.

## API

### `BaseLoader`

-   **`load(fileName: string, regexp?: RegExp, newString?: string): Promise<any>`**: Loads the configuration from the specified file or source. Optionally, replaces parts of the configuration using a regular expression.


### `ConsulLoader`

-   Loads configurations from Consul KV store.
-   Requires `CONSUL_HOST`, `CONSUL_PORT`, `CONSUL_TOKEN`, and optionally `SSL` environment variables.

### `NacosConfigLoader`

-   Loads configurations from Nacos Config.
-   Requires `NACOS_ENDPOINT`, `NACOS_NAMESPACE`, `NACOS_GROUP`, and optionally `NACOS_PORT` environment variables.

### `getLoader(type: string): Promise<BaseLoader>`

-   A factory function that returns an instance of the appropriate loader based on the `type` parameter (`'local'`, `'consul'`, or `'nacos'`).

## Include Mechanism

The `includes` key in the configuration allows you to include and merge configurations from other files or sources.

```yaml
includes:
  - file: include.yaml # file or key for the config
    key: nested # the key to merge the include config to
    params: # any extra params you want to merge to the include config.
      extra: true
```

## Extending

To add support for a new configuration source, create a new class that extends `BaseLoader` and implements the `loadFile` method. Then, update the `getLoader` function to return an instance of your new loader.


## Contribution

Contributions are welcome! Please submit issues and pull requests.

## License

Copyright © 2023 Ticatec. All rights reserved.

This library is released under the MIT license. For details, see the [LICENSE](LICENSE) file.

## Contact

huili.f@gmail.com