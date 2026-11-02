# 更新记录

> 每个版本一节，**一条一行**，说用户能感知的变化。
> 格式与规矩见 [UPDATING.md](./UPDATING.md)。

## 0.1.1 — 2026-11-03

- 错误信息不再重复供应商名（magpie 已经在前面加了一次）
- 图片闸补上 Gemini 的 `inlineData` / `fileData` 形状，四种协议一视同仁

## 0.1.0 — 2026-11-03

**首个版本：把 Chatbox AI 接进 magpie**

- 三条登录路：从本机 Chatbox 客户端导入 license（只读）、粘贴 license key、邮箱验证码登录
- 63 个模型的目录跟着平台实时拉取，未登录时用内置快照兜底
- 按模型的 `apiStyle` 分流到四条原生网关：Chat Completions / Responses / Anthropic Messages / Gemini
- 额度卡片：今日 token 用量与上限、重置时间、生图额度；透支如实显示超过 100%
- 收图能力按平台目录先拦：给 text-only 模型发图片直接拒绝，不让上游无边界复读
- 错误语义：登录失效 401、模型不可用（含「需要更高套餐」）404、额度用完 429、网关超时 504
- 流式转发原样透传并在末尾补 `data: [DONE]`；工具调用、思考档按官方协议下发
