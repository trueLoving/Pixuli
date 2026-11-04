# PLANS

> **进度以 [GitHub Issues](https://github.com/trueLoving/Pixuli/issues)
> 为准**。  
> 本文只做薄索引，避免与远程双份长表。  
> **最近同步**：2026-11-04

---

## 产品底线

三端维护 · 本地工作区 SSOT · GitHub/Gitee 插件同步 · 复制链接（无「发布」）·
core/provider ↛ UI。  
细则：[docs/product.md](docs/product.md) · [DECISIONS.md](./DECISIONS.md)

---

## 当前 OPEN（远程）

| Issue                                                   | 标题                          | 备注                       |
| ------------------------------------------------------- | ----------------------------- | -------------------------- |
| [#126](https://github.com/trueLoving/Pixuli/issues/126) | 插件体系重设计（Obsidian 式） | P1；勿抢跑挡主路径         |
| [#127](https://github.com/trueLoving/Pixuli/issues/127) | 集成测试体系                  | P2；基线稳后薄做           |
| [#138](https://github.com/trueLoving/Pixuli/issues/138) | 文档中/英策略                 | P2；本次 docs 简化未做英译 |
| [#88](https://github.com/trueLoving/Pixuli/issues/88)   | Desktop 离线同步队列          | P2                         |
| [#89](https://github.com/trueLoving/Pixuli/issues/89)   | Desktop 自动更新              | P2                         |

已关近期主路径相关：Sprint
A～D（#241～#245、#132）、资源库文件夹浏览与处理弹窗等（见 Releases
/ 合并 PR）。

---

## 建议焦点（非 Issue 编号顺序）

1. J0 自测：添加 → 同步公开仓 → 复制链接；记下摩擦再开小 Issue
2. 图片压缩写回处理弹窗（若需要）
3. 集成测试薄切片（#127）
4. 暂缓：#126 全量、#88/#89

---

## Won't Do / 延后

**不做：**
官方 Server；用户向发布；恢复幻灯片/时间线/照片墙；取消任一端；默认 Gitee
Host 代理。

**延后：**
Drive、全员 OAuth、任务抽屉、网格切换、回收站、AI、局域网临时共享、文档全英镜像。

---

## 协作

```bash
gh issue list --state open
```

开 PR：完整关闭 Issue 用
`Fixes #n`；合并后以 GitHub 状态为准更新本表 OPEN 列表即可。
