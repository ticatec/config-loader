# 配置加载器

一个功能强大且可扩展的 Node.js 应用程序配置加载器，支持从多种配置源加载配置，包括本地文件、Consul 和 Nacos，具备 YAML 解析和高级合并功能。

[English](./README.md) | 中文

[![Version](https://img.shields.io/npm/v/@ticatec/config-loader)](https://www.npmjs.com/package/@ticatec/config-loader)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 特性

- **🏗️ 可扩展架构**: 基于抽象 `BaseLoader` 类构建，易于扩展至新的配置源
- **📄 YAML 支持**: 原生解析 YAML 配置文件，支持完整功能特性
- **🔗 包含机制**: 通过文件包含和深度合并实现高级配置组合
- **🌊 深度合并**: 智能合并来自多个配置源的嵌套对象和数组
- **📡 多种配置源**: 支持本地文件、Consul KV 存储和 Nacos 配置中心
- **⚙️ 环境变量配置**: 通过环境变量轻松配置
- **🔄 后处理**: 使用 PostLoader 函数进行自定义内容转换

## 安装

```bash
npm install @ticatec/config-loader
```

## 快速开始

```typescript
import { loadConfig } from '@ticatec/config-loader';
import dotenv from 'dotenv';

async function main() {
    dotenv.config();
    
    const config = await loadConfig(
        'local', // 或 'consul', 'nacos'
        'app.yaml',
        'logger.yaml',
        (content: string) => content.replace(/#{service-name}/g, 'my-service')
    );
    
    console.log('应用配置:', config.appConf);
    console.log('日志配置:', config.loggerConf);
}

main();
```

## 配置源

### 本地文件

默认配置源从 `./config` 目录加载文件。

**环境变量**: 无需配置

**示例结构**:
```
config/
├── app.yaml
├── database.yaml
└── logger.yaml
```

### Consul KV 存储

从 HashiCorp Consul 的键值存储加载配置。

**必需的环境变量**:
- `CONSUL_HOST` - Consul 服务器主机名
- `CONSUL_PORT` - Consul 服务器端口
- `CONSUL_TOKEN` - Consul ACL 令牌（如果启用了 ACL）
- `SSL` - 设置为 "true" 以使用 HTTPS 连接

**示例**:
```typescript
// 设置环境变量
process.env.CONSUL_HOST = 'localhost';
process.env.CONSUL_PORT = '8500';
process.env.CONSUL_TOKEN = 'your-consul-token';

const config = await loadConfig('consul', 'app/config', 'app/logger', null);
```

### Nacos 配置中心

从阿里巴巴 Nacos 配置管理平台加载配置。

**必需的环境变量**:
- `NACOS_ENDPOINT` - Nacos 服务器端点（例如 `http://localhost:8848`）
- `NACOS_NAMESPACE` - Nacos 命名空间 ID
- `NACOS_GROUP` - Nacos 分组（默认为 "default"）
- `NACOS_PORT` - Nacos 服务器端口（可选，基于端点自动判断）

**示例**:
```typescript
// 设置环境变量
process.env.NACOS_ENDPOINT = 'http://localhost:8848';
process.env.NACOS_NAMESPACE = 'production';
process.env.NACOS_GROUP = 'app-configs';

const config = await loadConfig('nacos', 'app.yaml', 'logger.yaml', null);
```

## 高级功能

### 配置包含

包含机制允许您从多个源组合配置：

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

最终配置结果：
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
  # redis.yaml 内容将在此处合并
  ttl: 3600
```

### 后处理

在解析前转换配置内容：

```typescript
const postProcessor = (content: string): string => {
    return content
        .replace(/#{service-name}/g, 'user-service')
        .replace(/#{environment}/g, process.env.NODE_ENV || 'development');
};

const config = await loadConfig('local', 'app.yaml', 'logger.yaml', postProcessor);
```

## API 参考

### 核心函数

#### `loadConfig(configMode, configFile, logFile, loggerPostLoader)`

同时加载应用程序和日志记录器配置。

- `configMode` - 配置源类型：'local'、'consul' 或 'nacos'
- `configFile` - 主配置文件的路径/键
- `logFile` - 日志记录器配置文件的路径/键
- `loggerPostLoader` - 日志记录器配置的可选后处理函数

**返回**: `Promise<{appConf: any, loggerConf: any}>`

#### `getLoader(type)`

创建配置加载器的工厂函数。

- `type` - 加载器类型：'local'、'consul' 或 'nacos'

**返回**: `Promise<BaseLoader>`

### BaseLoader 类

所有配置加载器的抽象基类。

#### 方法

- `load(fileName, postLoader?)` - 支持包含的配置加载
- `loadConfig(fileName, postLoader?)` - 加载和解析单个配置文件
- `deepMerge(obj1, obj2)` - 深度合并两个配置对象

## 示例

### 基本本地配置

```typescript
import { getLoader } from '@ticatec/config-loader';

const loader = await getLoader('local');
const config = await loader.load('app.yaml');
console.log(config);
```

### 带认证的 Consul

```typescript
import { loadConfig } from '@ticatec/config-loader';

process.env.CONSUL_HOST = 'consul.example.com';
process.env.CONSUL_PORT = '8500';
process.env.CONSUL_TOKEN = 'secret-token';
process.env.SSL = 'true';

const config = await loadConfig('consul', 'apps/myapp/config', 'apps/myapp/logging', null);
```

### 复杂包含结构

```yaml
# app.yaml
app:
  name: 电商 API
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

## 贡献

我们欢迎贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

### 开发环境设置

```bash
git clone https://github.com/ticatec/config-loader.git
cd config-loader
npm install
npm run build
```

### 运行测试

```bash
npm test
```

## 许可证

版权所有 © 2023 Ticatec。保留所有权利。

该库根据 MIT 许可证发布。详情请参见 [LICENSE](LICENSE) 文件。

## 支持

- 📧 邮箱: huili.f@gmail.com
- 🐛 问题反馈: [GitHub Issues](https://github.com/ticatec/config-loader/issues)
- 📖 文档: [GitHub Pages](https://ticatec.github.io/config-loader)
