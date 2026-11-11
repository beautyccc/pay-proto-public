# 发布与回滚 Runbook — 原型站（GitHub Pages）

> 适用仓库：`beautyccc/pay-proto-public`（纯静态高保真原型，无构建、无后端、无真实资金动作）。
> 目标：任何人都能按本文在 5 分钟内完成一次发布，或在 3 分钟内完成一次回滚。
> 维护：法拉第（运维）。发生流程变更时同步更新本文并说明原因。

## 1. 架构与前置条件

| 项 | 取值 |
|---|---|
| 仓库 | `https://github.com/beautyccc/pay-proto-public`（public） |
| 发布分支 | `main` |
| 发布方式 | push 到 `main` 触发 GitHub 内置 workflow `pages build and deployment`（dynamic，无自建 CI、无构建产物） |
| Pages Source | `Deploy from a branch` → `main` / `/(root)` |
| 站点地址 | https://beautyccc.github.io/pay-proto-public/ |
| 静态入口 | `/index.html`（代理端）、`/admin.html`（运营后台） |
| 关键开关 | 仓库根 `.nojekyll` 必须存在，用于关闭 Jekyll；丢失会导致 `_` 开头的文件/目录被忽略 |
| CDN | Fastly。HTML 默认缓存 `max-age=600`，发布后短时间可能读到旧页，验证时需绕过缓存 |

**前置条件（每次发布前 30 秒确认）**

- [ ] 本地 `git push --dry-run origin main` 不报认证错误（凭据仍有效）。
- [ ] 仓库仍是 public（转 private 会关掉免费 Pages）。
- [ ] Settings → Pages 的 Source 仍是 `main / (root)`，没被改成 GitHub Actions。
- [ ] 本地能起静态服务自测（`python3 -m http.server`），不依赖任何构建工具。

## 2. 发布步骤

全程不 force push；不改 Pages 配置与仓库可见性。

**Step 0 · 同步（约 20 s）**

```bash
git fetch origin
git pull --rebase origin main
git status -sb            # 必须干净或只含本次改动
git log --oneline -1      # 记下当前基线 sha
```

**Step 1 · 本地自测（5–10 min）**

```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/ 与 /admin.html
```

逐屏点穿；DevTools Console 无报错；390×844 视口无横向滚动；金额、状态、跳转与本次验收项逐条对照。

**Step 2 · 提交（约 30 s）**

```bash
git add -A
git show --stat HEAD        # 提交后核对：文件清单是否只有预期改动
git commit -m "feat|fix|docs: <一句话说清改了什么>"
git log -1 --format='%H %s' # 记下 sha，发布后要回填
```

**Step 3 · 推送（10–60 s）**

```bash
git push origin main
```

被拒（non-fast-forward）时：`git pull --rebase origin main` 解冲突后再推，**不要** force push。

**Step 4 · 等构建（实测 30 s–2 min）**

```bash
# 方式一：网页看 https://github.com/beautyccc/pay-proto-public/actions 最新 run 是否 success
# 方式二：命令行查（public 仓库无需鉴权）
curl -s "https://api.github.com/repos/beautyccc/pay-proto-public/actions/runs?per_page=1" \
  | python3 -c "import json,sys; r=json.load(sys.stdin)['workflow_runs'][0]; print(r['head_sha'][:7], r['status'], r['conclusion'])"
```

**Step 5 · 线上验证（约 60 s）** — 见 §3，全绿才算发布完成。

**Step 6 · 回填** — 把 sha 与验证结论写回任务/变更记录；失败就按 §4 回滚。

| 阶段 | 实测耗时 |
|---|---|
| 本地自测 | 5–10 min（取决于改动面） |
| push → Pages build success | 30 s–2 min |
| push → 线上新内容可见 | 实测 33 s（2026-11-11 演练，见 §7） |
| 完整回滚（revert + push + 生效） | 实测 53 s；遇并发推送需 rebase 重推，按 3 min 预算（见 §7） |

## 3. 验证命令

**3.1 关键路径状态码**

```bash
BASE=https://beautyccc.github.io/pay-proto-public
for p in / /admin.html /assets/style.css /assets/mobile.js /assets/admin.js /docs/acceptance.md; do
  printf '%-24s ' "$p"
  curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' "$BASE$p"
done
```

判定：全部 `200`。任一 `404`/`5xx` 视为发布失败。

**3.2 内容校验（防「200 但仍是旧内容」）**

每次发布前定一个**哨兵字符串**：本次改动独有的一段文本，例如新页面的 `id="m-tx"` 或 `<meta name="build" content="<sha7>">`。

```bash
# 哨兵命中次数，期望 >=1
curl -s -H 'Cache-Control: no-cache' "$BASE/?v=$(date +%s)" | grep -c 'm-tx'
# 后台同理
curl -s -H 'Cache-Control: no-cache' "$BASE/admin.html?v=$(date +%s)" | grep -c 'p-withdrawals'
```

**3.3 绕过 CDN 缓存**

HTML 有 10 分钟缓存，`?v=$(date +%s)` 只绕过浏览器缓存、对 Fastly 不一定生效；判定「是否真的部署了」以 `Actions` 最新 run 的 `head_sha` 与 §3.2 为准，必要时等 2–3 分钟重试。

## 4. 回滚

> 关键事实：**GitHub Pages 没有一键回滚**。Settings → Pages 里没有历史版本回退，Deployments 里的历史 artifact 也不能直接重新激活。唯一可靠的止血手段是**用一次新提交把内容改回去**（revert），再走一遍同样的发布流程。

**4.1 单提交回滚（首选，适用于「就是刚推的那个 sha 出问题」）**

```bash
git revert <bad-sha> --no-edit
git push origin main
```

耗时：命令 10 s + 构建 30–90 s ≈ **2 min**。冲突时手工解，解完 `git revert --continue`。

**4.2 按 tag 整体回滚（适用于「整版退回上一个可用版本」）**

当前可用基线：`v0.1`（= `404d4b1` 之前的骨架版本，tag 已推到远端）。

```bash
git fetch --tags
git checkout v0.1 -- index.html admin.html assets/
git commit -m "revert: 整体回滚到 v0.1（原因：<一句话>）"
git push origin main
```

注意：`git checkout <tag> -- <path>` **不会删除**新增文件。若坏版本新增了页面/脚本，要显式 `git rm` 掉，否则旧页面仍可被直接访问（只是没有入口）。所以整版回滚优先用 4.1 对「引入该版本的 merge/提交」做 revert。

耗时：命令 30 s + 构建 30–90 s ≈ **2–3 min**。

**4.3 回滚验证**

重跑 §3.1（全 200）+ §3.2（被回滚的哨兵字符串 `grep -c` 应为 `0`）。

**4.4 回滚四问（发布前必须能答）**

| 问题 | 答案 |
|---|---|
| 怎么发 | §2，push 到 main，30 s–2 min 生效 |
| 怎么验 | §3，状态码 + 哨兵字符串 |
| 怎么回 | §4.1/4.2，一条 revert，约 2 min |
| 出问题找谁 | 仓库 owner `beautyccc`；运维值班 法拉第 |

## 5. 自定义域名（后续方案，暂不实施）

原型站不需要自定义域名：无收益，却引入 DNS + 证书两个额外故障面。若将来确需（如对外演示用 `pay.example.com`）：

1. 仓库根新增 `CNAME` 文件，内容为裸域名（如 `pay.example.com`）。
2. DNS：`pay` 加 CNAME 指向 `beautyccc.github.io`；apex 域名用 A 记录 `185.199.108.153 / .109.153 / .110.153 / .111.153`。
3. Settings → Pages → Custom domain 填写并保存，勾选 **Enforce HTTPS**（证书签发 5 min–24 h）。
4. 验证：`curl -I https://pay.example.com` 返回 200 且 `strict-transport-security` 存在。

注意：配置自定义域名后原 `*.github.io` 地址会 301 跳转；回滚时**不要删 CNAME**，否则 HTTPS 证书会重新签发。

## 6. 故障排查表

| 现象 | 最可能原因 | 处理 |
|---|---|---|
| push 后 5 min 站点仍是旧内容 | Pages build 未触发或排队；或 CDN 缓存（HTML 10 min） | 看 Actions 最新 run；未触发就空提交 `git commit --allow-empty -m "chore: trigger pages" && git push`；再等 2 min |
| 全站 404 | Pages Source 被改、分支被删、仓库转 private | Settings → Pages 核对 Source = `main / (root)`；确认仓库仍 public |
| 首页 200，某个目录 404（文件明明在） | `.nojekyll` 丢失，Jekyll 忽略 `_` 开头路径 | 补回空文件 `.nojekyll` 再推 |
| HTML 200，但 css/js 404 | 文件名大小写不一致（Linux 大小写敏感，macOS 不敏感） | `git ls-files` 核对真实大小写，改引用 |
| build 报错 | 文件超过 100 MB / 文件名含特殊字符 | 看 run 日志，移除大文件 |
| push 被拒 | 别人先推了 | `git pull --rebase origin main` 后重推，禁止 force |
| 手机端打开是旧版 | 微信/浏览器强缓存 | 加 `?v=<sha7>` 访问确认，属客户端缓存，非发布问题 |

## 7. 回滚演练记录

每次演练后追加一行；演练必须真实执行（建文件 → 上线 200 → revert → 404），不接受「纸面演练」。

| 日期 | 演练人 | 演练内容 | 生效 sha | revert sha | push→200 | push→404 | 总耗时 | 结论 |
|---|---|---|---|---|---|---|---|---|
| 2026-11-11 | 法拉第 | 新增 `docs/rollback-drill.md` 上线后 revert，验证 404 | `0533642` | `8b9202c` | 33 s | 53 s | 117 s | 通过 |

### 2026-11-11 首次演练 · 时间线（UTC）

| 时刻 | 事件 |
|---|---|
| 08:37:30 | `git push origin main`（`404d4b1..0533642`，含 runbook `b5d663f` 与 drill `0533642`），耗时 4 s |
| 08:37:35 | Pages run #6 `completed success`（head `0533642`） |
| 08:38:03 | `GET /docs/rollback-drill.md` 返回 200，哨兵 `ROLLBACK-DRILL-20261111-1635` 命中 1 次 → **push→200 = 33 s** |
| 08:38:13 | `git revert 0533642 --no-edit` 生成本地提交（1 s），首次 push 被拒——期间张无忌推了 `f7ec4a8`（仅新增 `docs/p0-breakdown.md`） |
| 08:38:31 | `git pull --rebase origin main` 通过，revert 重写为 `8b9202c`，无冲突 |
| 08:38:34 | 重推成功（`f7ec4a8..8b9202c`） |
| 08:39:27 | `GET /docs/rollback-drill.md` 返回 404 → **push→404 = 53 s**；同时 `/` 与 `/admin.html` 均 200 |

### 结论与改进项

1. **回滚可用**：revert 单提交即可让线上文件失效，`/` 与 `/admin.html` 全程未受影响，无停机。总耗时 117 s，满足「3 分钟内回滚」。
2. **并发推送是真实场景**：演练中被队友推送打断一次，`pull --rebase` 后重推，仅多花 ~12 s，无冲突。规则：**回滚时先 `git fetch` 看 `origin/main` 是否领先，再推**，避免临场慌乱。
3. **Pages 无历史回滚**，revert 是唯一可靠手段；`git checkout <tag> -- <path>` 不删除新增文件，整版回滚要显式 `git rm` 或对引入版本做 revert（见 §4.2）。
4. 构建触发稳定：三次 push（含 rebase 后重推）各触发一次 run，均 success，未出现「推了不构建」。


## 8. 上线检查清单

- [ ] 本地逐屏点穿，Console 无报错，390×844 无横向滚动
- [ ] `git show --stat` 文件清单只含预期改动
- [ ] 本次哨兵字符串已确定
- [ ] 回滚目标已明确（要 revert 的 sha 或 tag `v0.1`），命令已复制在手
- [ ] 无 force push、无 Pages 配置变更、无仓库可见性变更
- [ ] 发布后 §3 全绿，sha 已回填
- [ ] 升级路径：`beautyccc`（仓库 owner）→ 法拉第（运维值班）
