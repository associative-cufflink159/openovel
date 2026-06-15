<p align="center">
  <img src="./assets/hero.webp" alt="Openovel" width="760" />
</p>

<p align="center">
  <strong>本地优先的 AI 互动小说：前台叙述器服务读者，后台 Agent 维护故事文件。</strong>
</p>

<p align="center">
  <a href="#下载">下载</a> ·
  <a href="#界面预览">界面预览</a> ·
  <a href="#从源码启动">快速开始</a> ·
  <a href="#为什么是-openovel">为什么是 openovel</a> ·
  <a href="#工作原理">工作原理</a> ·
  <a href="./README.md">English</a>
</p>

openovel 是一个开源桌面应用，用来游玩 AI 互动小说。你输入主角要做什么；前台叙述器流式写出下一拍；更慢的后台 Agent 读取这个回合，把普通 Markdown / JSON 文件更新好，再影响之后回合的叙述上下文。

项目核心是**双循环**运行时。前台循环小、快、对延迟敏感。后台循环异步、可使用工具、以文件为工作基座。默认情况下后台是一支常驻团队：Showrunner 协调者，加上 World Keeper、Director、Card Manager、Memory 等 Agent。关闭 `OPENOVEL_RESIDENT_TEAM` 会回退到较早的单 Storykeeper 路径。

状态：**beta / Demo 阶段**。应用已经可以端到端使用，但内部 API 和故事工作区布局仍可能调整。当前维护的表面是 Electron 桌面应用。macOS 测试最多；Windows 和 Linux 包会产出，但测试较轻。

## 下载

最新 beta release 已提供 macOS、Windows、Linux 桌面包：[GitHub Releases](https://github.com/Feed-Scription/openovel/releases)。

macOS 构建目前是 ad-hoc 签名，但没有 notarize，因为项目暂时没有 Apple Developer ID 证书。Gatekeeper 提示是预期现象，处理方式见 [`docs/macos-gatekeeper.md`](./docs/macos-gatekeeper.md)。

维护者发布流程见 [`docs/releases.md`](./docs/releases.md)。

## 界面预览

openovel Electron 桌面端的实际运行截图。

<p align="center">
  <img src="./assets/screenshot.webp" alt="openovel Electron 应用运行互动小说场景的截图" width="860" />
</p>

## 从源码启动

源码运行需要：

- Node.js >= 20
- npm
- 一个受支持的 LLM provider key。桌面端 onboarding 可以帮你填写。

```bash
git clone https://github.com/Feed-Scription/openovel.git
cd openovel
npm install
npm run electron
```

`npm run electron` 会先打包 renderer，再启动桌面应用。首次运行时，onboarding 会询问语言偏好和模型访问方式。如果使用 packaged build，空故事库也可以自动种入内置 starter story，让你先打开一个可玩的示例。

在输入栏试一条动作：

```text
我在废弃的渡轮码头醒来，环顾四周。
```

启用建议选项时，你也可以直接点一个建议行动，或者完全忽略它们，自己输入。

## 为什么是 Openovel

长篇互动小说有两个彼此拉扯的需求：

- 读者需要很快看到正文。
- 世界、记忆、承诺和后果需要跨很多回合稳定存在。

openovel 不让一个大 Agent 循环同时做完所有事，而是把这些工作拆开。

- **前台叙述器**：一个流式模型调用，不带工具，不写文件。它读取编译后的前台 guidance、触发匹配的 context cards、持久记忆和最近 canon。
- **建议选项**：叙述后由单独的模型调用生成 2-4 个下一步行动。选项只是 UI affordance；读者随时可以忽略它们，自己输入。
- **后台维护**：一个回合写完后，运行时记录事件、入队后台工作、把精简回合摘要广播给常驻 Agent，并让 Showrunner / Storykeeper 更新后续叙述会读取的文件。
- **文件原生故事状态**：canon、guidance、context cards、memory、state、research notes、Agent notebooks 都是普通文件。默认运行时没有向量库、RAG 数据库，也没有图数据库。

## 工作原理

<p align="center">
  <img src="./assets/architecture.zh-CN.svg" alt="openovel 双循环架构：前台叙述器、文件原生故事基座、异步后台常驻团队" width="100%" />
</p>

一个读者回合大致是这样走的：

1. 把读者动作记录进 append-only scene log。
2. 触发匹配 context cards，并重组 `story/guidance/FOREGROUND.md`。
3. 从前台 guidance、故事记忆、持久用户偏好、最近 canon 编译叙述器上下文。
4. 流式生成一个前台叙述 beat。
5. 在旁路生成可选行动，并运行 background signal。
6. 把叙述追加进 `story/canon/chapters.md`，记录 foreground turn。
7. 入队后台 inbox 项，把精简回合摘要广播给常驻 Agent，并启动或委托 Showrunner / Storykeeper loop。
8. 后台更新再落回 `story/frontend/*`、`story/guidance/*`、`story/context-cards/*`、`story/memory/*`、`story/state/*` 和各 Agent 自己的内部笔记。

叙述器只读取前台工作集和最近 canon。`story/director/`、`story/worldkeeper/`、`story/state/`、`story/packets/` 以及各 Agent domain 文件夹用于分析、记账和恢复，不会直接组合进叙述器正文。

Context cards 走和前台 section 一样的 `@include` 组合路径。`story/guidance/cards.auto.md` 在叙述器运行前由确定性触发匹配重写；`story/guidance/cards.md` 是后台循环维护的长期精选集合。

## 功能特性

多数面向玩家的开关都在 Settings 里。下面默认值针对全新安装。

**默认开启**

- **桌面故事库**：在 Electron 应用里创建、重命名、导入、重开、删除和导出故事。
- **内置 starter stories**：packaged build 可以向空故事库种入预初始化示例。
- **建议选项**：叙述后生成下一步行动建议（`OPENOVEL_OPTIONS_ENABLED`）。
- **阅读节奏显示**：正文可按本地阅读速度展开，不依赖 provider 流式速度（`OPENOVEL_DISPLAY_PACING`；速度由 `OPENOVEL_DISPLAY_CPM` 控制，默认 720）。
- **常驻后台团队**：默认运行 Showrunner 加专职子 Agent；设 `OPENOVEL_RESIDENT_TEAM=0` 可切回单 Storykeeper。
- **自动 context cards**：当前回合的 cards 由触发匹配自动引入，不跑 selector 模型。
- **重复 / 口癖控制**：增量 n-gram 统计和可选 operator tic patterns 会反馈给后台质量循环。
- **小说导出**：从故事卡片菜单导出 EPUB 或 TXT。

**可选 / 实验性**

- **富渲染**：每个故事可用 `ovl:<kind>` block，由经过清洗的 HTML 模板和 scoped CSS 渲染（`OPENOVEL_ENABLE_FORMAT_CONTRACT`）。
- **媒体内嵌**：当用户开关和故事 contract 都允许时，通过保留的 `ovl:include` fence 嵌入 `story/includes/` 下的文件（`OPENOVEL_ENABLE_STORY_INCLUDES`）。
- **场景背景**：通过保留的 `ovl:bg` fence，把准备好的 `story/includes/bg/` 图片切到阅读界面背景（`OPENOVEL_ENABLE_IMAGE_BACKGROUND`）。
- **故事插图**：Image agent 可以把图片准备到 `story/includes/`；需要图片 provider 设置，并会强制打开富渲染和媒体内嵌（`OPENOVEL_ENABLE_IMAGE_GEN`）。
- **角色视觉表**：启用图像生成时，可以让主要角色的视觉参考约束后续插图（`OPENOVEL_ENABLE_CHARACTER_SHEETS`）。
- **叙述朗读**：配置 TTS provider 后，可以按句朗读叙述，并让文字跟随音频同步展开（`OPENOVEL_ENABLE_TTS`）。
- **漫画模式**：故事级模式，让前台输出 panel script，并在流式过程中生成图像 panel（`OPENOVEL_ENABLE_COMIC_MODE`；完整体验需要图片设置）。
- **快进模式**：故事级 prose 模式，用较短 burst 快速推进到下一个有意义的决定点（`OPENOVEL_ENABLE_FAST_MODE`）。
- **初始化声音预览**：故事初始化时可以先试听叙述器声音，再开始游玩（`OPENOVEL_ENABLE_INIT_NARRATOR_PREVIEW`）。

模型撰写的富内容会经过沙箱边界。HTML block 模板会被清洗为 HAST tree，再由 renderer 作为 React element 遍历渲染；renderer 不使用 `innerHTML`。CSS 会被 scoped 并按属性白名单过滤。Electron 通过特权 asset protocol 提供故事媒体文件前，也会重新校验路径。

## 设置与 Provider

正常使用时，在桌面应用里配置模型即可。首次启动会询问语言和模型访问；之后通过 Settings 修改。

Settings 支持内置 provider，也支持自定义 OpenAI 兼容 / Anthropic 格式端点。高级设置还包括模型路由、按 Agent 路由、模型目录编辑、搜索 provider、图片生成设置和 TTS 设置。

API keys、Behavior 开关、Image 设置、可选服务设置、TTS 设置等桌面端存储会写入 `$OPENOVEL_HOME/settings.local.json`（默认 `~/.openovel/settings.local.json`），并在应用启动时镜像为进程环境变量。

通用 JSONC 配置用于 runtime 和 CLI 风格工具，按以下顺序层叠，后者覆盖前者：

```text
defaults
  -> ~/.openovel/settings.jsonc
    -> .openovel/settings.jsonc
      -> .openovel/settings.local.json
        -> 环境变量
```

支持 JSONC、尾随逗号、`{env:VAR}` 和 `{file:path}` 插值。

常用诊断命令：

```bash
npm run config:doctor       # 显示 settings 层叠和生效配置
npm run provider:doctor     # 显示 provider 和 model 解析
```

## 项目结构

```text
src/
  runtime/       共享引擎：session、job、bus event、tool、permission
  workflows/     initializer、Storykeeper / Showrunner、常驻 Agent、memory review
  lib/           故事文件、叙述、snapshot、路径、富渲染、媒体
  context/       前台 prompt 编译和 context-card 激活
  provider/      provider 注册、model profile、OpenAI 兼容适配
  electron/      桌面应用：main 进程、preload、renderer、IPC 桥
  tools/         后台工具注册
  agents/        常驻 Agent cards（*.agent.yaml）和 subagent 定义
  memory/        文件原生 memory provider
  search/        web search provider 注册
  services/      EPUB / TXT 导出服务
  eval/          smoke、probe、model-player、judge、benchmark adapters
  config/        settings 解析和 doctor
test/            node --test 测试
scripts/         构建、发布、启动和诊断辅助
resources/       内置 starter stories
story/           项目本地运行时故事工作区，通常 gitignored
```

主运行链路：

```text
UI -> SessionViewModel -> SessionProcessor
   -> foreground narrator -> provider
   -> BackgroundJob -> BackgroundAgentRuntime -> ToolLoop -> ToolRegistry
   -> story files
```

## 存储模型

openovel 使用两个根：

```text
~/.openovel/                 用户全局数据
  memory/USER.md             用户自己设置的偏好
  memory/OBSERVED.md         模型观察到的读者笔记
  context-cards/             可复用 cards
  references/                共享 references
  stories/<story-id>/        常规单故事工作区

story/                       项目本地 fallback 故事工作区
  BRIEF.md                   原始故事 brief，初始化时写一次
  canon/                     chapters、最近章节镜像、append-only scene log
  frontend/                  叙述器可见 section 文件
  guidance/                  FG_template.md、FOREGROUND.md、cards.md、cards.auto.md
  director/                  内部 pacing、options、quality、tic notebooks
  worldkeeper/               world-state agent notebook
  state/                     结构化世界状态
  context-cards/             故事级 cards
  inbox/                     后台待办与已解决归档
  memory/                    故事级 memory 和可选偏好覆盖
  format/                    可选富渲染 contract
  includes/                  可选 render-time include 媒体文件
  research/                  搜索日志和可编辑研究笔记
  packets/ profiles/ jobs/   诊断、usage profile、后台 job ledger
```

`story/frontend/`、`story/guidance/` 和 context cards 是叙述器可见的。`story/director/`、`story/worldkeeper/`、`story/state/`、`story/packets/` 和各 Agent 文件夹是后台工作使用的内部或诊断输入。

`OPENOVEL_HOME`、`OPENOVEL_STORY_ID` 和 `OPENOVEL_STORY_ROOT` 控制故事解析位置。旧的 `AI_STORY_*` 变量仍为了兼容而识别。

## 命令速查

```bash
# 交互
npm run electron              # 默认桌面客户端，先打包 renderer
npm run electron:dev          # 带 devtools 的桌面客户端

# 构建 / 打包
npm run build:electron
npm run dist                  # electron-builder package
npm run dist:mac
npm run dist:win
npm run dist:linux

# 测试
npm test
node --test test/sessionViewModel.test.js
node --test --test-name-pattern "<regex>" test/foo.test.js

# 诊断
npm run config:doctor
npm run provider:doctor

# evals
npm run eval:smoke -- --action "..." --expect "..." --wait-background
npm run eval:model-player
npm run eval:judge
npm run eval:ablation
npm run eval:probe
npm run eval:tms:prepare && npm run eval:tms
```

项目没有单独的 lint step。

## 测试

`npm test` 通过 `scripts/run-tests.mjs` 运行 Node 测试套件。测试应保持 hermetic：不访问网络、不真调模型、不写临时目录以外的磁盘。行为变更优先断言持久化文件 patch、scene events 或 `SessionViewModel` 状态，而不是断言生成 prose 的精确文本。

## 参与贡献

欢迎提交 issue 和聚焦的小 PR。开发约定和适合入门的贡献方向见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

## 故障排查

- Provider 路由看起来不对：运行 `npm run provider:doctor`。
- Settings 没生效：运行 `npm run config:doctor` 检查层叠顺序。
- 拉了新代码后 renderer 还是旧的：删除 `dist-electron/` 后运行 `npm run electron`。
- macOS 下载后拦截 app：见 [`docs/macos-gatekeeper.md`](./docs/macos-gatekeeper.md)。
- 想要全新的本地故事工作区：`story/` 是运行时数据，通常已经 gitignored。

## 常见问题

**openovel 是什么？**
openovel 是一个本地优先的 AI 互动小说桌面应用。它为读者流式生成叙述，同时让后台 Agent 用普通文件维护故事基座。

**它是在替代云端 AI 小说工具吗？**
它是一个 bring-your-own-model 的替代选择，适合希望故事文件留在本地、记忆可检查，并且运行时为长篇互动小说设计的人。

**我的数据存在哪里？**
故事数据在 `story/` 或 `$OPENOVEL_HOME/stories/<story-id>/` 下。全局偏好和可复用记忆在 `$OPENOVEL_HOME`，默认是 `~/.openovel/`。模型调用仍会把相关 prompt 上下文发送给你配置的 provider。

**支持哪些模型？**
在 Settings -> AI -> API Keys 中选择内置 provider，或添加自定义 OpenAI 兼容 / Anthropic 格式端点。

**支持哪些平台？**
当前维护的应用是 macOS、Windows、Linux 上的 Electron 桌面端。macOS 测试最多。

**openovel 免费、开源吗？**
是的。项目以 Apache-2.0 许可证发布。

## 致谢

双循环交互模型受 Thinking Machines 关于 interaction models 的写作启发。运行时形态也借鉴了 Claude Code、opencode 和 Hermes Agent 的经验。文件原生 context substrate 是对 AI 小说工具中常见向量-RAG 路线的有意偏离，来自 AI fiction 和本项目前作 `fate-river` 的长期实验。
