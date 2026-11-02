// src/license.mjs —— 把 Chatbox 的实时额度翻译成 magpie 的额度窗口
//
// 上游（GET /api/license/detail/realtime）返回的字段（2026-11-03 实测，free 计划）：
//   unified_token_usage / unified_token_limit   今日统一 token 用量与上限（每天 0 点重置）
//   token_next_refresh_time                     下一次重置时间（ISO，带 +08:00）
//   remaining_quota_35 / remaining_quota_4      Chatbox AI 3.5 / 4 的「次」数（free 是 1 / 0）
//   image_total_quota / image_used_count        生图额度和已用
//   expansion_pack_limit / expansion_pack_usage 加量包
//
// 三条规矩（HOOKS 十一）：
//   ① 每条窗口都必须有 used（或能算出来的 amount+limit），否则路由不计入这个号
//   ② 时间一律转 ISO —— 上游给 "+08:00" 是合法 ISO，直接交给 toIso 即可
//   ③ aside 窗口只展示、不参与路由；至少要留一条参与路由的窗口，否则账号在路由里「不存在」

import { usage as buildUsage, usageWindow } from "./quota.mjs"

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const fmt = (n) =>
  Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)

/** 把 detail/realtime 的 data 变成 usage() 的入参 */
export function usageFromDetail(detail) {
  const windows = []
  const used = num(detail?.unified_token_usage)
  const limit = num(detail?.unified_token_limit)
  const resetAt = detail?.token_next_refresh_time || detail?.token_expire_time || undefined

  // ① 今日 token 额度 —— 唯一参与路由的窗口（free 计划每天 10000 点）
  if (used !== undefined && limit !== undefined && limit > 0) {
    windows.push(
      usageWindow({
        name: "今日额度",
        amount: used,
        limit,
        unit: "tokens",
        resetsAt: resetAt,
        span: 86_400,
      }),
    )
  } else {
    // 拿不到上限：交给卡片的 error，不伪造 limit，也不造一条不参与路由的 textOnly 窗口
    return buildUsage({
      plan: String(detail?.name || detail?.plan || "").trim() || undefined,
      error: "上游没有给出今日额度上限（license 详情里缺 unified_token_limit）",
      windows: [],
    })
  }

  // ② 老套餐分类的余量（`remaining_quota_35/4` 是 **0–1 的小数**，不是「次」）。
  //    它只是 `1 - usage/limit` 的旧口径副本，真账本还是上面的 unified_token_* ——
  //    不单独画一行，避免「3.5 剩 1 次」这种误读。

  // ③ 生图额度（free 计划 5 张）
  const imgTotal = num(detail?.image_total_quota)
  const imgUsed = num(detail?.image_used_count) ?? 0
  if (imgTotal !== undefined && imgTotal >= 0) {
    const left = Math.max(0, imgTotal - imgUsed)
    windows.push(usageWindow({ name: "生图额度", used: 0, aside: true, display: `剩 ${fmt(left)} / ${fmt(imgTotal)} 张` }))
  }

  // ④ 加量包（有才算；没有了就不显示一行 0）
  const packLimit = num(detail?.expansion_pack_limit) ?? 0
  const packUsed = num(detail?.expansion_pack_usage) ?? 0
  if (packLimit > 0) {
    windows.push(
      usageWindow({ name: "加量包", used: 0, aside: true, display: `剩 ${fmt(packLimit - packUsed)} / ${fmt(packLimit)}` }),
    )
  }

  const plan = String(detail?.name || detail?.plan || "").trim() || undefined
  return buildUsage({
    plan,
    until: resetAt,
    windows,
  })
}
