# Configuration Loader

A versatile and extensible configuration loader for Node.js applications that supports loading configurations from multiple sources including local files, Consul, and Nacos, with YAML parsing and advanced merging capabilities.

[中文文档](./README_CN.md) | English

[![Version](https://img.shields.io/npm/v/@ticatec/config-loader)](https://www.npmjs.com/package/@ticatec/config-loader)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **🏗️ Extensible Architecture**: Built with abstract `BaseLoader` class for easy extension to new configuration sources
- **📄 YAML Support**: Native parsing of YAML configuration files with full feature support
- **🔗 Include Mechanism**: Advanced configuration composition through file includes with deep merging
- **🌊 Deep Merge**: Intelligent merging of nested objects and arrays from multiple configuration sources
- **📡 Multiple Sources**: Support for local files, Consul KV store, and Nacos configuration center
- **⚙️ Environment Configuration**: Easy configuration through environment variables
- **🔄 Post-Processing**: Custom content transformation with PostLoader functions

## Installation

```bash
npm install @ticatec/config-loader
```

## Quick Start

```typescript
import { loadConfig } from '@ticatec/config-loader';
import dotenv from 'dotenv';

async function main() {
    dotenv.config();
    
    const config = await loadConfig(
        'local', // or 'consul', 'nacos'
        'app.yaml',
        'logger.yaml',
        (content: string) => content.replace(/#{service-name}/g, 'my-service')
    );
    
    console.log('App Config:', config.appConf);
    console.log('Logger Config:', config.loggerConf);
}

main();
```

## Configuration Sources

### Local Files

The default configuration source loads files from the `./config` directory.

**Environment Variables**: None required

**Example Structure**:
```
config/
├── app.yaml
├── database.yaml
└── logger.yaml
```

### Consul KV Store

Load configurations from HashiCorp Consul's Key-Value store.

**Required Environment Variables**:
- `CONSUL_HOST` - Consul server hostname
- `CONSUL_PORT` - Consul server port
- `CONSUL_TOKEN` - Consul ACL token (if ACLs are enabled)
- `SSL` - Set to "true" for HTTPS connections

**Example**:
```typescript
// Set environment variables
process.env.CONSUL_HOST = 'localhost';
process.env.CONSUL_PORT = '8500';
process.env.CONSUL_TOKEN = 'your-consul-token';

const config = await loadConfig('consul', 'app/config', 'app/logger', null);
```

### Nacos Configuration Center

Load configurations from Alibaba Nacos configuration management platform.

**Required Environment Variables**:
- `NACOS_ENDPOINT` - Nacos server endpoint (e.g., `http://localhost:8848`)
- `NACOS_NAMESPACE` - Nacos namespace ID
- `NACOS_GROUP` - Nacos group (defaults to "default")
- `NACOS_PORT` - Nacos server port (optional, defaults based on endpoint)

**Example**:
```typescript
// Set environment variables
process.env.NACOS_ENDPOINT = 'http://localhost:8848';
process.env.NACOS_NAMESPACE = 'production';
process.env.NACOS_GROUP = 'app-configs';

const config = await loadConfig('nacos', 'app.yaml', 'logger.yaml', null);
```

## Advanced Features

### Configuration Includes

The include mechanism allows you to compose configurations from multiple sources:

```yaml
# main-config.yaml
app:
  name: My Application
  version: 1.0.0

includes:
  - file: database.yaml
    key: database
    params:
      poolSize: 10
  - file: redis.yaml
    key: cache
    params:
      ttl: 3600
```

```yaml
# database.yaml
host: localhost
port: 5432
name: mydb
```

The resulting configuration will be:
```yaml
app:
  name: My Application
  version: 1.0.0
database:
  host: localhost
  port: 5432
  name: mydb
  poolSize: 10
cache:
  # redis.yaml content merged here
  ttl: 3600
```

### Post-Processing

Transform configuration content before parsing:

```typescript
const postProcessor = (content: string): string => {
    return content
        .replace(/#{service-name}/g, 'user-service')
        .replace(/#{environment}/g, process.env.NODE_ENV || 'development');
};

const config = await loadConfig('local', 'app.yaml', 'logger.yaml', postProcessor);
```

## API Reference

### Core Functions

#### `loadConfig(configMode, configFile, logFile, loggerPostLoader)`

Load both application and logger configurations.

- `configMode` - Configuration source type: 'local', 'consul', or 'nacos'
- `configFile` - Path/key to the main configuration file
- `logFile` - Path/key to the logger configuration file  
- `loggerPostLoader` - Optional post-processing function for logger config

**Returns**: `Promise<{appConf: any, loggerConf: any}>`

#### `getLoader(type)`

Factory function to create configuration loaders.

- `type` - Loader type: 'local', 'consul', or 'nacos'

**Returns**: `Promise<BaseLoader>`

### BaseLoader Class

Abstract base class for all configuration loaders.

#### Methods

- `load(fileName, postLoader?)` - Load configuration with includes support
- `loadConfig(fileName, postLoader?)` - Load and parse single configuration file
- `deepMerge(obj1, obj2)` - Deep merge two configuration objects

## Examples

### Basic Local Configuration

```typescript
import { getLoader } from '@ticatec/config-loader';

const loader = await getLoader('local');
const config = await loader.load('app.yaml');
console.log(config);
```

### Consul with Authentication

```typescript
import { loadConfig } from '@ticatec/config-loader';

process.env.CONSUL_HOST = 'consul.example.com';
process.env.CONSUL_PORT = '8500';
process.env.CONSUL_TOKEN = 'secret-token';
process.env.SSL = 'true';

const config = await loadConfig('consul', 'apps/myapp/config', 'apps/myapp/logging', null);
```

### Complex Include Structure

```yaml
# app.yaml
app:
  name: E-commerce API
  version: 2.1.0

includes:
  - file: database/postgres.yaml
    key: database
    params:
      ssl: true
  - file: services/redis.yaml  
    key: cache
  - file: services/elasticsearch.yaml
    key: search
    params:
      index_prefix: ecommerce_v2
```

## Contributing

We welcome contributions! Please see our [contribution guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/ticatec/config-loader.git
cd config-loader
npm install
npm run build
```

### Running Tests

```bash
npm test
```

## License

Copyright © 2023 Ticatec. All rights reserved.

This library is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: huili.f@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ticatec/config-loader/issues)
- 📖 Documentation: [GitHub Pages](https://ticatec.github.io/config-loader)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.