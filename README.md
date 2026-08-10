# GIFinder

一个基于 React + Vite 的 GIF 搜索面试题实现。支持：

- React Router 驱动的横向练习 Tab，每个练习拥有独立 URL
- 输入防抖后自动搜索，不依赖 Submit 按钮
- GIPHY Autocomplete API 搜索联想
- 键盘上下键选择联想词，Enter 确认，Escape 关闭
- 热门 GIF、加载骨架、错误状态和空结果状态
- 响应式瀑布流布局与无障碍属性
- 未配置 API Key 时自动使用内置演示数据

## 添加新的练习页

顶部 Tab 与路由由 `src/PracticeApp.jsx` 中的 `PRACTICE_TABS` 统一生成。新增练习时：

1. 创建新的页面组件。
2. 在 `PRACTICE_TABS` 中添加包含 `path`、`label`、`number` 和 `element` 的配置。

当前路由包括 `/gif-search`、`/practice-02`、`/practice-03` 和 `/practice-04`，后三个暂时是空白画布。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填入从 [GIPHY Developers](https://developers.giphy.com/) 获取的 API Key：

```bash
VITE_GIPHY_API_KEY=你的_api_key
```

> 注意：Vite 的 `VITE_` 环境变量会被打包到浏览器代码中。生产项目应在 GIPHY 控制台限制 Key 的允许来源，并为 Web 端单独创建 Key。

## 可用命令

```bash
npm run dev
npm run lint
npm run build
```
