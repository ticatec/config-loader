好的，这是将你提供的 Markdown 文档翻译成中文的结果：

# 配置加载器

这个项目提供了一个灵活且可扩展的配置加载器，支持从各种来源加载配置，包括本地文件、Consul 和 Nacos。

## 特性

* **抽象化：** 使用抽象的 `BaseLoader` 类，允许轻松扩展以支持新的配置源。
* **YAML 支持：** 解析 YAML 格式的配置文件。
* **包含机制：** 支持包含和合并来自其他文件或来源的配置。
* **深度合并：** 实现了一个深度合并函数来组合配置。
* **来源灵活性：** 支持从本地文件、Consul 和 Nacos 加载配置。
* **环境变量配置：** 使用环境变量配置加载器。

## 安装

```bash
npm i @ticatec/config-loade
```

## 用法

### 基本用法

```typescript
import { getLoader } from '@ticatec/config-loade'; // 根据需要调整路径

async function loadConfiguration(type: string, fileName: string, regexp?: RegExp, newString?: string) {
  const loader = await getLoader(type);
  const config = await loader.load(fileName, regexp, newString);
  console.log(config);
  return config;
}

// 本地文件示例用法
loadConfiguration('local', 'config.yaml');

// Consul 示例用法
// 确保设置了 CONSUL_HOST、CONSUL_PORT 和 CONSUL_TOKEN 环境变量
loadConfiguration('consul', 'my-config-key');

// Nacos 示例用法
// 确保设置了 NACOS_ENDPOINT、NACOS_NAMESPACE 和 NACOS_GROUP 环境变量
loadConfiguration('nacos', 'my-data-id');
```

### 从本地文件加载

创建一个 `config.yaml` 文件：

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

创建一个 `include.yaml` 文件：

```yaml
message: Hello, World!
```

### 从 Consul 加载

确保你有一个正在运行且可访问的 Consul 服务器。设置以下环境变量：

* `CONSUL_HOST`：Consul 服务器主机。
* `CONSUL_PORT`：Consul 服务器端口。
* `CONSUL_TOKEN`：Consul 访问令牌（如果需要）。
* `SSL`：`true` 或 `false`，用于指示是否使用 SSL。

然后，将你的配置存储在 Consul KV 存储中，并指定一个键。

### 从 Nacos 加载

确保你有一个正在运行且可访问的 Nacos 服务器。设置以下环境变量：

* `NACOS_ENDPOINT`：Nacos 服务器端点（例如，`http://localhost:8848`）。
* `NACOS_NAMESPACE`：Nacos 命名空间。
* `NACOS_GROUP`：Nacos 组（默认为 `default`）。
* `NACOS_PORT`：Nacos 服务器端口。

然后，使用特定的数据 ID 和组将你的配置存储在 Nacos Config 中。

## API

### `BaseLoader`

* **`load(fileName: string, regexp?: RegExp, newString?: string): Promise<any>`**: 从指定的文件或来源加载配置。可以选择使用正则表达式替换配置中的部分内容。

### `ConsulLoader`

* 从 Consul KV 存储加载配置。
* 需要 `CONSUL_HOST`、`CONSUL_PORT`、`CONSUL_TOKEN`，以及可选的 `SSL` 环境变量。

### `NacosConfigLoader`

* 从 Nacos Config 加载配置。
* 需要 `NACOS_ENDPOINT`、`NACOS_NAMESPACE`、`NACOS_GROUP`，以及可选的 `NACOS_PORT` 环境变量。

### `getLoader(type: string): Promise<BaseLoader>`

* 一个工厂函数，根据 `type` 参数（`'local'`、`'consul'` 或 `'nacos'`）返回相应加载器的实例。

## 包含机制

配置中的 `includes` 键允许你包含和合并来自其他文件或来源的配置。

```yaml
includes:
  - file: include.yaml # 文件或配置的键
    key: nested # 将包含的配置合并到的键
    params: # 要合并到包含配置的任何额外参数
      extra: true
```

## 扩展

要添加对新配置源的支持，请创建一个新的类，该类扩展 `BaseLoader` 并实现 `loadFile` 方法。然后，更新 `getLoader` 函数以返回你的新加载器的实例。


## 贡献

欢迎贡献！请提交问题和拉取请求。

## 许可证

版权所有 © 2023 Ticatec。保留所有权利。

该库根据 MIT 许可证发布。有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

huili.f@gmail.com
