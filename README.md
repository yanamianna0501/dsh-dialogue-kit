# dsh-dialogue-kit (对话增强)

[![GitHub License](https://img.shields.io/github/license/yanamianna0501/dsh-dialogue-kit)](https://github.com/yanamianna0501/dsh-dialogue-kit/blob/main/LICENSE)
[![Tests](https://img.shields.io/badge/tests-11%20passed-brightgreen)]()

参考 MiniMax Code 的原位选文评论交互，为 DeepSeek Harness (DSH) 提供高质量的原位批注与原生引用卡片支持。

## 核心特性

### 1. 选文原位评论与引用
* **原位批注**：选中聊天记录中的任意文本 → 弹出浮动工具栏「加入本会话」→ 原位直接输入评论 → 点击 ✓ 保存。
* **原生卡片**：原文与批注自动转为 DSH **原生引用卡片**，无需手动剪贴或覆盖草稿区。
* **纯引用模式**：如果只需引用无需批注，在浮条中点击「引用」即可快速引用选区。

### 2. 回复动作栏快捷批注
* 已完成的 AI 回复底部动作栏提供「引用 / 批注回复」按钮。
* 自动区分「引用原文」与「我的批注」，允许多次对不同片段连续添加批注。
* 引用卡片的预览、删除与草稿恢复完全遵循 DSH 宿主生命周期。

### 3. 旧版未发送批注恢复
* 若历史会话中存在未发送的旧版批注草稿，输入框左侧将展示轻量「恢复未发送批注」入口，可一键转换为原生卡片。

### 4. 零劫持与宿主原生保障
* 完全基于 DSH 规范的 React 插槽（`dsh-client-ui-conversation` / `dsh-client-ui-chat`）扩展。
* **绝不劫持或模拟宿主发送键与停止生成键**，回合状态与取消调度完全交还宿主原生管理。

---

## 安装方法

### 方式一：DSH 客户端安装
在你的 DSH Profile 目录（如 `~/.dsh/profiles/desktop/`）中添加依赖：

```bash
# 进入 profile 目录
cd ~/.dsh/profiles/desktop

# 安装插件
npm install dsh-dialogue-kit
```

并在该 profile 的 `package.json` 中的 `dsh.profile.bundles` 添加 `"dsh-dialogue-kit"`：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "dsh-dialogue-kit"
      ]
    }
  }
}
```

### 方式二：本地开发直链 (Link)
克隆本项目后，在 profile 目录下通过 link 安装：

```bash
cd path/to/dsh-dialogue-kit
npm run build

cd ~/.dsh/profiles/desktop
npm install link:path/to/dsh-dialogue-kit
```

> **提示**：安装或更新前端插件后，需**重启 DSH 客户端**以生效。

---

## 本地开发与测试

无需任何外部构建工具或打包器：

```bash
# 检查语法并构建客户端单文件 bundle
npm run build

# 运行自动化单元测试
npm test

# 打包发布为 npm tarball
npm run package
```

---

## 文档索引

* [设计规范 (DESIGN.md)](./DESIGN.md)
* [技术决策与架构演进 (DECISIONS.md)](./DECISIONS.md)
* [实机与单元测试验证记录 (VERIFICATION.md)](./VERIFICATION.md)

## 开源协议

本项目基于 [MIT 协议](./package.json) 开源。
