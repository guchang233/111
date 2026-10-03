# 把一首歌拆到只剩数字

一支由代码逐帧渲染的 B站 宣传片：把三首 Animenz 钢琴改编拆成声部、节奏、和弦、音高、音色，直到只剩数字。

- 制作方案：[`docs/plan.md`](docs/plan.md)
- 风格板（关键帧与封面草稿）：[`styleboard/`](styleboard/)

## 渲染静帧

```bash
npm install
node render/render-stills.mjs                       # 渲染 render/frames/ 下全部帧，输出 4K PNG 到 out/stills/
node render/render-stills.mjs render/covers/cover-16x9.html
```

每个帧是一个独立 HTML 页面，用 `<meta name="frame-size">` 声明画幅，绘制完成后设置 `window.__ready = true`。
共享的设计 token 在 `render/lib/base.css`，颗粒、确定性随机数等工具在 `render/lib/frame.js`。
