# Sensitive Lexicon MCP Server

[![MCP Badge](https://lobehub.com/badge/mcp/zephyrpersonal-sensitive-lexicon-mcp)](https://lobehub.com/mcp/zephyrpersonal-sensitive-lexicon-mcp)

一个基于 [Sensitive-lexicon](https://github.com/konsheng/Sensitive-lexicon) 敏感词库的 MCP (Model Context Protocol) 服务器，为LLM提供敏感词检测和过滤功能。

## 功能特性

- **敏感词检测**: 检测文本中的敏感词汇
- **敏感词过滤**: 替换文本中的敏感词汇
- **多分类支持**: 支持政治、色情、暴力、广告等多种敏感词分类
- **实时更新**: 从GitHub仓库实时获取最新的敏感词库
- **易于集成**: 标准MCP协议，易于与各种LLM集成

## 快速开始

### 方式一：NPM安装（推荐）

```bash
# 全局安装
npm install -g sensitive-lexicon-mcp

# 或项目本地安装
npm install sensitive-lexicon-mcp
```

### 方式二：源码安装

```bash
# 克隆项目
git clone https://github.com/zephyrpersonal/sensitive-lexicon-mcp.git
cd sensitive-lexicon-mcp

# 安装依赖
npm install

# 构建项目
npm run build
```

## 集成配置

### Claude Desktop

在 Claude Desktop 的配置文件中添加：

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sensitive-lexicon": {
      "command": "npx",
      "args": ["sensitive-lexicon-mcp"]
    }
  }
}
```

如果是本地安装：
```json
{
  "mcpServers": {
    "sensitive-lexicon": {
      "command": "node",
      "args": ["./path/to/sensitive-lexicon-mcp/dist/index.js"]
    }
  }
}
```

### Continue.dev

在 `config.json` 中添加：

```json
{
  "mcpServers": [
    {
      "name": "sensitive-lexicon",
      "command": "npx",
      "args": ["sensitive-lexicon-mcp"]
    }
  ]
}
```

### Cline (VSCode Extension)

在 VSCode 设置中添加：

```json
{
  "cline.mcpServers": {
    "sensitive-lexicon": {
      "command": "npx",
      "args": ["sensitive-lexicon-mcp"]
    }
  }
}
```

### Zed Editor

在 Zed 的 `settings.json` 中添加：

```json
{
  "language_models": {
    "anthropic": {
      "version": "1",
      "api_url": "https://api.anthropic.com",
      "mcp_servers": {
        "sensitive-lexicon": {
          "command": "npx",
          "args": ["sensitive-lexicon-mcp"]
        }
      }
    }
  }
}
```

### Cursor IDE

在 Cursor 的设置中添加：

```json
{
  "mcp.servers": {
    "sensitive-lexicon": {
      "command": "npx",
      "args": ["sensitive-lexicon-mcp"]
    }
  }
}
```

### Custom MCP Client

如果您使用自定义的MCP客户端，可以这样连接：

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['sensitive-lexicon-mcp']
});

const client = new Client({
  name: "sensitive-lexicon-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);
```

### Python MCP Client

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="npx",
        args=["sensitive-lexicon-mcp"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # 初始化
            await session.initialize()
            
            # 调用工具
            result = await session.call_tool(
                "detect_sensitive_words", 
                {"text": "测试文本"}
            )
            print(result)
```

### Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
```

运行容器：

```bash
docker build -t sensitive-lexicon-mcp .
docker run -p 3000:3000 sensitive-lexicon-mcp
```

### 环境变量配置

您可以通过环境变量自定义配置：

```bash
# 设置敏感词库更新间隔（秒）
export SENSITIVE_UPDATE_INTERVAL=3600

# 设置缓存大小
export SENSITIVE_CACHE_SIZE=10000

# 启用调试日志
export DEBUG=sensitive-lexicon:*
```

## 可用工具

### 1. detect_sensitive_words
检测文本中的敏感词

**参数:**
- `text` (必需): 要检测的文本
- `categories` (可选): 指定检测的分类数组

**示例:**
```json
{
  "text": "这是一段测试文本",
  "categories": ["political", "violence"]
}
```

**返回结果:**
```json
{
  "isSensitive": true,
  "sensitiveWordsCount": 2,
  "sensitiveWords": [
    {"word": "敏感词1", "category": "political"},
    {"word": "敏感词2", "category": "violence"}
  ],
  "summary": "Found 2 sensitive word(s) in the text"
}
```

### 2. filter_sensitive_words
过滤文本中的敏感词

**参数:**
- `text` (必需): 要过滤的文本
- `replacement` (可选): 替换字符串，默认为 "***"
- `categories` (可选): 指定过滤的分类数组

**示例:**
```json
{
  "text": "这是一段测试文本",
  "replacement": "[已屏蔽]",
  "categories": ["political"]
}
```

**返回结果:**
```json
{
  "originalText": "这是一段测试文本",
  "filteredText": "这是一段[已屏蔽]文本",
  "isSensitive": true,
  "sensitiveWordsFound": 1,
  "sensitiveWords": [
    {"word": "测试", "category": "political"}
  ]
}
```

### 3. get_categories
获取可用的敏感词分类列表

**返回结果:**
```json
{
  "categories": [
    "covid19", "gfw", "other", "subversive", 
    "advertisement", "political", "violence", 
    "livelihood", "weapons", "pornography-type", 
    "pornography", "supplementary", "corruption", 
    "tencent", "illegal-urls"
  ],
  "totalCategories": 15
}
```

### 4. get_word_count
获取敏感词库中的词汇数量

**参数:**
- `category` (可选): 指定分类名称

**示例:**
```json
{
  "category": "political"
}
```

**返回结果:**
```json
{
  "category": "political",
  "wordCount": 1500
}
```

## 使用示例

### 在 Claude Desktop 中使用

配置完成后，您可以在 Claude Desktop 中直接使用：

```
请帮我检测这段文本是否包含敏感词："这是一段需要检测的文本内容"
```

```
请帮我过滤这段文本中的敏感词，并用[已屏蔽]替换："这是一段需要过滤的文本内容"
```

### 在 Continue.dev 中使用

在代码注释或文档中检测敏感词：

```
// 检查这个变量名是否包含敏感词
@sensitive-check 检测这个函数名：getUserPoliticalInfo
```

### 在编程中集成

```javascript
// Node.js 示例
const { spawn } = require('child_process');

function detectSensitiveWords(text) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['sensitive-lexicon-mcp']);
    
    child.stdin.write(JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'detect_sensitive_words',
        arguments: { text }
      }
    }));
    
    child.stdout.on('data', (data) => {
      resolve(JSON.parse(data));
    });
    
    child.stderr.on('data', (data) => {
      reject(new Error(data.toString()));
    });
  });
}
```

### 批量处理示例

```python
# Python 批量处理示例
import asyncio
import json
from mcp.client.stdio import stdio_client

async def batch_check_content(texts):
    server_params = StdioServerParameters(
        command="npx",
        args=["sensitive-lexicon-mcp"]
    )
    
    results = []
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            for text in texts:
                result = await session.call_tool(
                    "detect_sensitive_words",
                    {"text": text}
                )
                results.append({
                    "text": text,
                    "result": result
                })
    
    return results

# 使用示例
texts = ["文本1", "文本2", "文本3"]
results = asyncio.run(batch_check_content(texts))
for item in results:
    print(f"文本: {item['text']}")
    print(f"结果: {item['result']}")
```

## 敏感词分类

支持以下敏感词分类：

- `covid19`: COVID-19相关
- `gfw`: GFW补充词库
- `other`: 其他词库
- `subversive`: 反动词库
- `advertisement`: 广告类型
- `political`: 政治类型
- `violence`: 暴恐词库
- `livelihood`: 民生词库
- `weapons`: 涉枪涉爆
- `pornography-type`: 色情类型
- `pornography`: 色情词库
- `supplementary`: 补充词库
- `corruption`: 贪腐词库
- `tencent`: 腾讯相关
- `illegal-urls`: 非法网址

## 开发

```bash
# 开发模式运行
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build
```

## 技术栈

- TypeScript
- Node.js
- Model Context Protocol (MCP) SDK
- Sensitive-lexicon 敏感词库

## 许可证

MIT License

## 免责声明

本项目仅用于学习和研究目的。使用者需要根据当地法律法规和平台政策合规使用。敏感词的定义可能因业务场景而异，请根据具体需求进行调整。
