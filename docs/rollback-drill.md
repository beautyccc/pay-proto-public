# 回滚演练（Rollback Drill）

- 演练时间：2026-11-11 16:35 (UTC+8)
- 演练人：法拉第（运维）
- 演练目的：验证「发布 → 生效 → revert → 失效」整条链路真实可用，测量线上生效与回滚耗时，作为 `docs/deploy-runbook.md` §7 的实测依据。
- 哨兵字符串：`ROLLBACK-DRILL-20261111-1635`

## 步骤

1. 本文件随 `main` 推送，等待 GitHub Pages 构建完成，访问
   `https://beautyccc.github.io/pay-proto-public/docs/rollback-drill.md` 应返回 200 且包含上面的哨兵字符串。
2. 对本文件所在提交执行 `git revert <sha> --no-edit`，推送 `main`，等待构建完成。
3. 再次访问同一 URL，应返回 404；`index.html` 与 `admin.html` 仍应返回 200。
4. 把两次的 sha、时间戳、HTTP 码与总耗时回填到 `docs/deploy-runbook.md` §7。

## 说明

本文件在演练结束后会被 revert 掉，仓库最终不应存在此文件。若你仍看到它，说明演练未收尾，请检查 `git log` 并执行回滚。
