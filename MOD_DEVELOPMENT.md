## 1. 快速上手

模组是一个 JSON 文件或 ZIP 包。最简单的模组结构如下：

```json
{
  "manifest": {
    "schemaVersion": 1,
    "modId": "my-cool-mod",
    "name": "我的酷炫 Mod",
    "version": "1.0.0",
    "author": "YourName",
    "description": "描述你的模组做了什么。",
    "gameVersionRange": ">=1.0.0",
    "conflictPolicy": "last-write-wins"
  },
  "patches": [
    {
      "model": "items",
      "op": "add",
      "value": {
        "key": "my-cool-mod:magic_dust",
        "name": "神奇尘埃",
        "category": "材料",
        "type": ["material"],
        "description": "通过模组添加的神奇物质。"
      }
    }
  ]
}
```

---

## 2. Manifest 配置 (manifest.json)

| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `modId` | string | **唯一 ID**。全小写，建议用 `kebab-case`。添加新数据时必须以此为前缀（如 `modId:item_key`）。 |
| `name` | string | 模组名称，显示在 UI 中。 |
| `version` | string | 语义化版本号（如 `1.2.3`）。 |
| `conflictPolicy` | enum | `error` (报错), `warn` (警告并跳过), `last-write-wins` (覆盖，推荐)。 |
| `hooksRuntime` | string | 设置为 `"full-trust"` 以启用 JS 脚本支持。 |
| `capabilities` | object | 权限声明：`stores: "all"`, `dom: true`, `network: true`。 |

---

## 3. 数据修补 (Patches)

系统中所有静态数据（物品、行动、配方等）都可以通过补丁进行修改。

### 3.1 支持的模型 (Model)
*   `items`: 物品定义
*   `actions`: 采集/制作行动
*   `formulas`: 实验室配方
*   `labs`: 实验室操作定义
*   `techs`: 科技树
*   `maps`: 地图定义
*   `eras`: 时代配置

### 3.2 操作符 (Operation)
*   `add`: 新增条目。`key` 可以使用 `$` 前缀（详见下方“命名空间”）。
*   `override`: 完全覆盖已有条目。需指定 `targetKey`。
*   `merge`: 深度合并到已有条目。**如果合并的是数组（如奖励列表），会自动执行追加 (Append) 操作。**
*   `remove`: (当前禁用) 删除条目。

### 3.3 命名空间占位符 `$`
为了简化开发并方便修改 `modId`，你可以使用 `$` 字符作为当前模组命名空间的占位符。在载入模组时，系统会自动将所有以 `$` 开头的字符串替换为 `modId:`。

**示例：**
如果你的 `modId` 是 `super-chemistry`：
*   `$magic_liquid` 会被自动扩展为 `super-chemistry:magic_liquid`
*   无论是在定义 `key`，还是在 `required_items` 或 `rewards` 中引用自己模组的物品，都可以使用 `$`。

```json
{
  "op": "add",
  "model": "items",
  "value": {
    "key": "$magic_liquid",
    "name": "超级液体"
  }
}
```

### 3.4 高级合并：`__merge_index__`
在执行 `merge` 操作时，如果目标字段是一个数组（例如 `required_items` 或 `rewards`），你可以通过在一个数组项中添加 `__merge_index__` 属性，来指定将该项合并到原数据的特定索引位置，而不是简单地追加到末尾。

**示例：在“挖掘”行动的第一个工具组（索引 0）中添加替代工具**
```json
{
  "model": "actions",
  "op": "merge",
  "targetKey": "mining",
  "value": {
    "required_items": [
      {
        "__merge_index__": 0,
        "key": ["$new_drill"]
      }
    ]
  }
}
```
*执行结果*：`mining` 行动的 `required_items[0].key` 数组中会多出一个 `mining-expansion:new_drill`（假设 modId 是 mining-expansion），而原有的镐子列表会被保留。

---

## 4. JS 脚本注入 (Hooks)

如果声明了 `"hooksRuntime": "full-trust"`，模组可以包含逻辑脚本。

### 4.1 生命周期事件
```javascript
// main.js
module.exports = {
  // 模组启用时运行
  onEnable(payload, context) {
    context.logger.info("模组已激活！");
  },
  
  // 每秒触发一次 (游戏循环)
  onTick(payload, context) {
    // 逻辑处理
  },

  // 任务完成时触发
  onTaskComplete(task, context) {
    if (task.key === 'mining') {
      context.logger.info("挖掘完成，额外获得经验？");
    }
  }
};
```

### 4.2 运行时上下文 (Context)
*   `context.stores`: 访问所有 Pinia Store (如 `pack`, `state`, `task`)。
*   `context.fetch`: 受控的网络请求。
*   `context.logger`: 输出日志到模组诊断面板。
*   `context.window/document`: 访问 DOM。

---

## 5. 打包与分发

### JSON 文件 (单文件)
直接将上述结构存为 `.json` 文件，用户可通过游戏内的“设置 -> 导入模组”上传。

### ZIP 包 (多文件)
结构建议：
```
my-mod.zip
├── manifest.json
├── patches.json (或者在 manifest 中定义 contentFiles)
└── main.js
```

## 6. 开发者贴士

1.  **命名空间**：为了避免冲突，请始终为新增物品使用 `modId:key` 格式。
2.  **安全模式**：如果模组导致崩溃，刷新页面时引擎会自动进入“安全模式”（禁用所有模组），你可以在设置界面卸载问题模组。
3.  **UI 生成**：推荐使用游戏的 Mod 生成器生成 Mod。