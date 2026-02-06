# 基金实时估值 Web 应用

这是一个使用 Vite + React + TailwindCSS 构建的基金实时估值网页应用。

## 功能

- **我的持仓**：展示已添加的基金，计算当日收益、总收益率。
- **自选基金**：关注基金的当日涨跌幅。
- **添加基金**：支持通过代码或名称搜索添加，并设置持仓成本和金额。
- **实时估值**：模拟实时净值波动（由于无公开实时接口，目前使用模拟数据演示）。

## 技术栈

- React 19
- Vite
- TailwindCSS v4
- Zustand (状态管理 + 持久化)
- React Router

## 运行

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 构建：
   ```bash
   npm run build
   ```

## 说明

本项目演示用的基金数据为**模拟数据**。在 `src/services/api.js` 中模拟了 API 请求和随机涨跌幅。如需接入真实数据，请修改该文件中的 `getFundDetails` 方法，对接真实的基金 API。
