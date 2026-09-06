# 参考课件资源台账

本目录记录 `E:\人音版小学音乐\软件` 中一至三年级上册资料的索引、去重结果和内容迁移关系。原始目录只读，项目只接入活动实际引用的资源。

## 文件

- `asset-manifest.json`：由 `scripts/reference-courseware-inventory.mjs` 生成的资源索引。
- `content-matrix.md`：知识点、互动方式、当前软件入口和迁移状态。

## 生成索引

在 Windows PowerShell 中运行：

```powershell
$ErrorActionPreference = 'Stop'
node scripts/reference-courseware-inventory.mjs --root 'E:\人音版小学音乐\软件' --out 'docs\reference-courseware'
```

索引状态含义：

- `selected`：扩展名和路径可用于活动，且不是重复导出。
- `excluded`：元数据、备份、重复文件或不应直接迁移的文件。
- `review`：暂时无法根据扩展名判断用途，需要人工确认。

## 迁移约束

- 不把旧 HTML 通过 iframe 嵌入应用。
- 音频、图片和动画必须绑定到稳定的活动 ID。
- 人音版参考内容使用 `renyin-reference` 来源，不覆盖浙江教材同步标签。
- 资源路径必须是项目相对路径，组件不得引用 E 盘绝对路径。
