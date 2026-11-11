/* 运营后台原型交互 v0.2
   侧边导航 / 代理树 / 提现审批 / 批量代付 / 弹窗抽屉
   全部数据为演示数据，不连接真实通道。 */
(function () {
  'use strict';

  var M = window.Money;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var fmt = M.format;
  var yuan = M.yuan;

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nowText() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function todayCode() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  function wan(cents) { return (cents / 100 / 10000).toFixed(1); }

  function toast(msg) {
    var el = $('#adminToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  // ---------------------------------------------------------------- 代理数据
  var AGENTS = [
    {
      id: 'a1', name: '云启支付', code: 'A0001', level: 1, parent: null, status: 'normal',
      merchants: 36, monthTx: 86200000, cost: 0.20, quote: 0.38, effective: '2026-10-01',
      phone: '138****0001', idNo: '3302**********0001', regTime: '2025-12-18',
      account: '招商银行 **** 8801', invite: 'YQ-0001', children: ['a2', 'a3', 'a4'],
      logs: [
        '2026-10-21 10:12 · 张敏 · 调整费率：0.36% → 0.38%',
        '2026-09-03 14:26 · 张敏 · 新增二级代理「李娜」',
        '2025-12-18 09:10 · 系统 · 代理注册审核通过'
      ]
    },
    {
      id: 'a2', name: '王海涛', code: 'A0182', level: 2, parent: 'a1', status: 'normal',
      merchants: 12, monthTx: 28600000, cost: 0.26, quote: 0.31, effective: '2026-10-01',
      phone: '138****6621', idNo: '3302**********3417', regTime: '2026-03-12',
      account: '招商银行 **** 8899', invite: 'YQ-8823-KL', children: ['a5', 'a6'],
      logs: [
        '2026-10-21 10:20 · 张敏 · 调整费率：0.30% → 0.31%',
        '2026-08-14 16:05 · 张敏 · 新增三级代理「周敏」',
        '2026-03-12 11:40 · 系统 · 代理注册审核通过'
      ]
    },
    {
      id: 'a3', name: '李娜', code: 'A0183', level: 2, parent: 'a1', status: 'normal',
      merchants: 9, monthTx: 18400000, cost: 0.26, quote: 0.33, effective: '2026-10-01',
      phone: '139****2210', idNo: '3302**********8826', regTime: '2026-04-08',
      account: '工商银行 **** 6620', invite: 'YQ-8824-LN', children: ['a7', 'a8'],
      logs: [
        '2026-10-08 09:36 · 张敏 · 调整费率：0.32% → 0.33%',
        '2026-04-08 15:20 · 系统 · 代理注册审核通过'
      ]
    },
    {
      id: 'a4', name: '赵强', code: 'A0184', level: 2, parent: 'a1', status: 'stopped',
      merchants: 4, monthTx: 6200000, cost: 0.26, quote: 0.32, effective: '2026-06-01',
      phone: '136****7712', idNo: '3302**********5519', regTime: '2026-05-19',
      account: '建设银行 **** 3312', invite: 'YQ-8825-ZQ', children: [],
      stoppedReason: '连续 3 个月未达标，且存在跨区展业', stoppedAt: '2026-10-30 15:20',
      logs: [
        '2026-10-30 15:20 · 张敏 · 停用代理：连续 3 个月未达标',
        '2026-05-19 10:00 · 系统 · 代理注册审核通过'
      ]
    },
    {
      id: 'a5', name: '周敏', code: 'A0190', level: 3, parent: 'a2', status: 'normal',
      merchants: 5, monthTx: 8600000, cost: 0.30, quote: 0.33, effective: '2026-09-01',
      phone: '137****8830', idNo: '3302**********1932', regTime: '2026-08-14',
      account: '农业银行 **** 7781', invite: 'YQ-8830-ZM', children: [],
      logs: ['2026-09-01 09:12 · 张敏 · 调整费率：0.32% → 0.33%', '2026-08-14 16:05 · 系统 · 代理注册审核通过']
    },
    {
      id: 'a6', name: '陈晨', code: 'A0191', level: 3, parent: 'a2', status: 'pending',
      merchants: 0, monthTx: 0, cost: 0.30, quote: 0.34, effective: '待审核',
      phone: '138****2201', idNo: '3302**********7723', regTime: '2026-11-11',
      account: '招商银行 **** 2201', invite: 'YQ-8831-CC', children: [], submitted: '2026-11-11 09:20',
      logs: ['2026-11-11 09:20 · 王海涛 · 提交代理注册资料']
    },
    {
      id: 'a7', name: '孙悦', code: 'A0192', level: 3, parent: 'a3', status: 'pending',
      merchants: 0, monthTx: 0, cost: 0.30, quote: 0.35, effective: '待审核',
      phone: '139****5108', idNo: '3302**********6641', regTime: '2026-11-11',
      account: '中国银行 **** 5108', invite: 'YQ-8832-SY', children: [], submitted: '2026-11-10 18:42',
      logs: ['2026-11-10 18:42 · 李娜 · 提交代理注册资料']
    },
    {
      id: 'a8', name: '刘洋', code: 'A0193', level: 3, parent: 'a3', status: 'pending',
      merchants: 0, monthTx: 0, cost: 0.30, quote: 0.36, effective: '待审核',
      phone: '135****9032', idNo: '3302**********2287', regTime: '2026-11-10',
      account: '交通银行 **** 9032', invite: 'YQ-8833-LY', children: [], submitted: '2026-11-10 15:18',
      logs: ['2026-11-10 15:18 · 李娜 · 提交代理注册资料']
    }
  ];

  var AGENT_MERCHANTS = [
    { name: '味知香卤味店', channel: '银盛', status: '正常', tx: 8624000 },
    { name: '悦刻便利店', channel: '拉卡拉', status: '正常', tx: 13290540 },
    { name: '阿强理发工作室', channel: '易生', status: '待完善', tx: 0 },
    { name: '鲜果日记水果店', channel: '拉卡拉', status: '正常', tx: 2418060 },
    { name: '老张五金建材', channel: '银盛', status: '已停用', tx: 1286000 }
  ];
  var AGENT_MONTHS = [
    { month: '2026-11', merchants: 12, tx: 28600000, share: 286000 },
    { month: '2026-10', merchants: 11, tx: 26840000, share: 268400 },
    { month: '2026-09', merchants: 10, tx: 24120000, share: 241200 }
  ];

  var agentState = {
    selected: 'a1',
    expanded: ['a1', 'a2', 'a3'],
    query: '',
    status: 'all',
    tab: 'tree',
    detailTab: 'basic',
    state: 'default'
  };
  var lastTreeRows = [];

  function agent(id) {
    for (var i = 0; i < AGENTS.length; i++) if (AGENTS[i].id === id) return AGENTS[i];
    return null;
  }
  function agentChildren(a) { return a.children || []; }
  function agentShort(name) { return String(name).slice(0, 1); }
  function agentChip(status) {
    if (status === 'normal') return '<span class="chip ok">正常</span>';
    if (status === 'pending') return '<span class="chip warn">审核中</span>';
    if (status === 'rejected') return '<span class="chip danger">已驳回</span>';
    if (status === 'stopped') return '<span class="chip line">已停用</span>';
    return '<span class="chip line">' + esc(status) + '</span>';
  }
  function descendants(id) {
    var out = [];
    var a = agent(id);
    if (!a) return out;
    agentChildren(a).forEach(function (cid) {
      out.push(cid);
      out = out.concat(descendants(cid));
    });
    return out;
  }
  function highlight(text, q) {
    if (!q) return esc(text);
    var i = String(text).toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(String(text).slice(0, i)) + '<mark>' + esc(String(text).slice(i, i + q.length)) + '</mark>' + esc(String(text).slice(i + q.length));
  }

  // ---------------------------------------------------------------- 提现数据
  function priv(bank, last, name) {
    return { type: 'private', bank: bank, last: last, name: name, company: '' };
  }
  function pub(company, bank, last) {
    return { type: 'public', company: company, bank: bank, last: last, name: company };
  }

  var WITHDRAWALS = [
    { no: 'WD20261111001', agent: '王海涛', code: 'A0182', level: 'L2', subject: 'dailyProfit', amount: 500000, account: priv('招商银行', '8899', '王海涛'), channel: '银盛', submitted: '2026-11-11 09:12', status: 'pending', risk: ['大额'] },
    { no: 'WD20261111002', agent: '李娜', code: 'A0183', level: 'L2', subject: 'monthlyProfit', amount: 800000, account: priv('工商银行', '6620', '李娜'), channel: '拉卡拉', submitted: '2026-11-11 08:40', status: 'pending', risk: [] },
    { no: 'WD20261111003', agent: '赵强', code: 'A0184', level: 'L2', subject: 'dailyBonus', amount: 300000, account: priv('建设银行', '3312', '赵强'), channel: '银盛', submitted: '2026-11-11 08:05', status: 'pending', risk: ['账户异常'] },
    { no: 'WD20261111004', agent: '王海涛', code: 'A0182', level: 'L2', subject: 'monthlyBonus', amount: 1200000, account: pub('宁波海曙云拓服务部', '招商银行', '2200'), channel: '银盛', submitted: '2026-11-10 21:18', status: 'pending', risk: ['大额', '新账户'] },
    { no: 'WD20261111005', agent: '周敏', code: 'A0190', level: 'L3', subject: 'shareBonus', amount: 200000, account: priv('农业银行', '7781', '周敏'), channel: '拉卡拉', submitted: '2026-11-10 19:42', status: 'pending', risk: [] },
    { no: 'WD20261111006', agent: '陈晨', code: 'A0191', level: 'L3', subject: 'dailyProfit', amount: 600000, account: priv('招商银行', '2201', '陈晨'), channel: '易生', submitted: '2026-11-10 18:20', status: 'pending', risk: ['频繁提现'] },
    { no: 'WD20261111007', agent: '孙悦', code: 'A0192', level: 'L3', subject: 'monthlyProfit', amount: 360000, account: priv('中国银行', '5108', '孙悦'), channel: '易生', submitted: '2026-11-10 16:08', status: 'pending', risk: [] },
    { no: 'WD20261111008', agent: '刘洋', code: 'A0193', level: 'L3', subject: 'dailyBonus', amount: 300000, account: priv('交通银行', '9032', '刘洋'), channel: '拉卡拉', submitted: '2026-11-10 14:55', status: 'pending', risk: [] },

    { no: 'WD20261111009', agent: '王海涛', code: 'A0182', level: 'L2', subject: 'dailyProfit', amount: 350000, account: priv('招商银行', '8899', '王海涛'), channel: '银盛', submitted: '2026-11-11 07:30', status: 'reviewing', risk: [] },
    { no: 'WD20261111010', agent: '李娜', code: 'A0183', level: 'L2', subject: 'monthlyProfit', amount: 280000, account: priv('工商银行', '6620', '李娜'), channel: '拉卡拉', submitted: '2026-11-10 20:10', status: 'reviewing', risk: [] },
    { no: 'WD20261111011', agent: '周敏', code: 'A0190', level: 'L3', subject: 'shareBonus', amount: 190000, account: priv('农业银行', '7781', '周敏'), channel: '易生', submitted: '2026-11-10 17:05', status: 'reviewing', risk: [] },

    { no: 'WD20261111012', agent: '刘洋', code: 'A0193', level: 'L3', subject: 'dailyProfit', amount: 700000, account: priv('交通银行', '9032', '刘洋'), channel: '银盛', submitted: '2026-11-11 11:20', status: 'approved', risk: [] },
    { no: 'WD20261111013', agent: '孙悦', code: 'A0192', level: 'L3', subject: 'monthlyProfit', amount: 650000, account: priv('中国银行', '5108', '孙悦'), channel: '拉卡拉', submitted: '2026-11-11 11:02', status: 'approved', risk: [] },
    { no: 'WD20261111014', agent: '陈晨', code: 'A0191', level: 'L3', subject: 'dailyBonus', amount: 900000, account: priv('招商银行', '2201', '陈晨'), channel: '易生', submitted: '2026-11-11 10:48', status: 'approved', risk: [] },
    { no: 'WD20261111015', agent: '周敏', code: 'A0190', level: 'L3', subject: 'shareBonus', amount: 550000, account: priv('农业银行', '7781', '周敏'), channel: '银盛', submitted: '2026-11-11 10:32', status: 'approved', risk: [] },
    { no: 'WD20261111016', agent: '李娜', code: 'A0183', level: 'L2', subject: 'monthlyBonus', amount: 800000, account: priv('工商银行', '6620', '李娜'), channel: '拉卡拉', submitted: '2026-11-11 10:18', status: 'approved', risk: [] },
    { no: 'WD20261111017', agent: '王海涛', code: 'A0182', level: 'L2', subject: 'dailyProfit', amount: 600000, account: priv('招商银行', '8899', '王海涛'), channel: '银盛', submitted: '2026-11-11 10:05', status: 'approved', risk: [] },
    { no: 'WD20261111018', agent: '赵强', code: 'A0184', level: 'L2', subject: 'monthlyProfit', amount: 750000, account: priv('建设银行', '3312', '赵强'), channel: '银盛', submitted: '2026-11-11 09:50', status: 'approved', risk: [] },
    { no: 'WD20261111019', agent: '刘洋', code: 'A0193', level: 'L3', subject: 'shareBonus', amount: 850000, account: priv('交通银行', '9032', '刘洋'), channel: '易生', submitted: '2026-11-11 09:36', status: 'approved', risk: [] },
    { no: 'WD20261111020', agent: '孙悦', code: 'A0192', level: 'L3', subject: 'dailyProfit', amount: 620000, account: priv('中国银行', '5108', '孙悦'), channel: '拉卡拉', submitted: '2026-11-11 09:22', status: 'approved', risk: [] },
    { no: 'WD20261111021', agent: '陈晨', code: 'A0191', level: 'L3', subject: 'monthlyProfit', amount: 900000, account: priv('招商银行', '2201', '陈晨'), channel: '易生', submitted: '2026-11-11 09:08', status: 'approved', risk: [] },
    { no: 'WD20261111022', agent: '周敏', code: 'A0190', level: 'L3', subject: 'dailyBonus', amount: 700000, account: priv('农业银行', '7781', '周敏'), channel: '银盛', submitted: '2026-11-11 08:54', status: 'approved', risk: [] },
    { no: 'WD20261111023', agent: '李娜', code: 'A0183', level: 'L2', subject: 'shareBonus', amount: 600000, account: priv('工商银行', '6620', '李娜'), channel: '拉卡拉', submitted: '2026-11-11 08:40', status: 'approved', risk: [] },

    { no: 'WD20261110024', agent: '赵强', code: 'A0184', level: 'L2', subject: 'dailyProfit', amount: 150000, account: priv('建设银行', '3312', '赵强'), channel: '银盛', submitted: '2026-11-10 15:40', status: 'rejected', reason: '收款账户与实名信息不一致，请修改结算账户后重新提交。', reviewedAt: '2026-11-10 16:10' },
    { no: 'WD20261110025', agent: '刘洋', code: 'A0193', level: 'L3', subject: 'monthlyProfit', amount: 220000, account: priv('交通银行', '9032', '刘洋'), channel: '拉卡拉', submitted: '2026-11-10 13:25', status: 'rejected', reason: '当月提现次数超出风控阈值，请补充经营说明。', reviewedAt: '2026-11-10 14:02' },

    { no: 'WD20261111026', agent: '王海涛', code: 'A0182', level: 'L2', subject: 'monthlyBonus', amount: 400000, account: priv('招商银行', '8899', '王海涛'), channel: '银盛', submitted: '2026-11-11 08:10', status: 'failed', reason: '通道返回：收款账户状态异常（ACCT_03），请核对账户后重试。', reviewedAt: '2026-11-11 08:20' }
  ];

  var WD_SUBJECTS = {
    dailyProfit: '日结分润', monthlyProfit: '月结分润', dailyBonus: '日结奖励',
    monthlyBonus: '月结奖励', shareBonus: '分成奖励'
  };
  var WD_STATUS = {
    pending: ['warn', '待审批'], reviewing: ['warn', '审批中'], approved: ['ok', '已通过'],
    rejected: ['danger', '已驳回'], failed: ['danger', '打款失败']
  };
  var wdState = {
    tab: 'pending', filters: { agent: '', subject: 'all', range: 'all', amount: 'all', channel: 'all' },
    selected: {}, state: 'default', approvalClosed: false
  };

  function wd(no) {
    for (var i = 0; i < WITHDRAWALS.length; i++) if (WITHDRAWALS[i].no === no) return WITHDRAWALS[i];
    return null;
  }
  function wdStatus(w) {
    var s = WD_STATUS[w.status] || ['line', w.status];
    return '<span class="chip ' + s[0] + '">' + esc(s[1]) + '</span>';
  }
  function wdAccount(w) {
    var a = w.account;
    if (a.type === 'public') return a.company + ' · ' + a.last + ' · 对公';
    return a.bank + ' · ' + a.last + ' · 对私';
  }
  function wdSum(rows) { return rows.reduce(function (s, w) { return s + w.amount; }, 0); }
  function wdHistory(w) {
    var h = [{ t: w.submitted, text: '代理提交提现申请', by: w.agent }];
    if (w.status === 'reviewing') h.push({ t: w.submitted, text: '运营已接单，审批中', by: '张敏' });
    if (w.status === 'approved') {
      h.push({ t: w.reviewedAt || '2026-11-11 10:00', text: '运营审批通过', by: '张敏' });
      h.push({ t: w.reviewedAt || '2026-11-11 10:02', text: '通道代付成功，已到账', by: '系统' });
    }
    if (w.status === 'rejected') h.push({ t: w.reviewedAt || '2026-11-11 10:00', text: '驳回：' + w.reason, by: '张敏' });
    if (w.status === 'failed') {
      h.push({ t: w.reviewedAt || '2026-11-11 08:15', text: '运营审批通过', by: '张敏' });
      h.push({ t: w.reviewedAt || '2026-11-11 08:20', text: '打款失败：' + w.reason, by: '系统' });
    }
    return h;
  }

  // ---------------------------------------------------------------- 弹窗
  function openModal(html, opts) {
    opts = opts || {};
    clearTimeout(closeModal._t);
    var mask = $('#adminMask');
    var modal = $('#adminModal');
    modal.className = 'admin-modal' + (opts.drawer ? ' drawer' : '') + (opts.wide ? ' wide' : '');
    modal.innerHTML =
      '<div class="modal-head"><h3>' + esc(opts.title || '') + '</h3>' +
      '<button type="button" class="modal-close" data-act="modal-close" aria-label="关闭">×</button></div>' +
      '<div class="modal-body">' + html + '</div>' +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '');
    mask.hidden = false;
    requestAnimationFrame(function () { mask.classList.add('show'); });
  }
  function closeModal() {
    var mask = $('#adminMask');
    mask.classList.remove('show');
    clearTimeout(closeModal._t);
    closeModal._t = setTimeout(function () { mask.hidden = true; $('#adminModal').innerHTML = ''; }, 180);
  }

  // ---------------------------------------------------------------- 后台导航
  var pages = $$('.admin-page');
  var navLinks = $$('.side a[data-page]');
  function go(id) {
    var target = document.getElementById(id);
    if (!target) return;
    pages.forEach(function (p) { p.classList.toggle('active', p === target); });
    $('.main').scrollTop = 0;
    var navId = id === 'p-mchdetail' ? 'p-merchants' : id;
    navLinks.forEach(function (a) { a.classList.toggle('on', a.dataset.page === navId); });
    if (id === 'p-agents') renderAgents();
    if (id === 'p-withdrawals') renderWithdrawals();
    if (id !== 'p-agents') closeAgentDrawer();
  }
  document.addEventListener('click', function (e) {
    var locked = e.target.closest('[data-locked]');
    if (locked) {
      e.preventDefault();
      toast(locked.dataset.locked || '该功能将在后续版本开放');
      return;
    }
    var actEl = e.target.closest('[data-act]');
    if (actEl) {
      e.preventDefault();
      handleAct(actEl);
      return;
    }
    var trigger = e.target.closest('[data-page]');
    if (trigger) {
      e.preventDefault();
      go(trigger.dataset.page);
    }
  });

  // ---------------------------------------------------------------- 代理树
  function isNarrow() { return window.innerWidth < 1280; }
  function openAgentDrawer() {
    if (!isNarrow()) return;
    $('#agentDetail').classList.add('open');
    $('#agentDrawerMask').hidden = false;
    requestAnimationFrame(function () { $('#agentDrawerMask').classList.add('show'); });
  }
  function closeAgentDrawer() {
    $('#agentDetail').classList.remove('open');
    $('#agentDrawerMask').classList.remove('show');
    setTimeout(function () { $('#agentDrawerMask').hidden = true; }, 180);
  }

  function renderAgentStats() {
    var pending = AGENTS.filter(function (a) { return a.status === 'pending'; }).length;
    var badge = $('#agentPendingBadge');
    if (badge) badge.textContent = pending;
    var box = $('#agentStats');
    if (agentState.state === 'loading' || agentState.state === 'error') {
      box.innerHTML = ['代理总数', '本月新增', '待审核', '已停用'].map(function (k) {
        return '<div class="stat"><div class="k">' + k + '</div><div class="v">—</div><div class="d">加载中</div></div>';
      }).join('');
      return;
    }
    box.innerHTML =
      '<div class="stat"><div class="k">代理总数</div><div class="v">36</div><div class="d">覆盖 3 级</div></div>' +
      '<div class="stat"><div class="k">本月新增</div><div class="v">12</div><div class="d">较上月 +3</div></div>' +
      '<div class="stat"><div class="k">待审核</div><div class="v">' + pending + '</div><div class="d" style="color:#a35c05">需运营处理</div></div>' +
      '<div class="stat"><div class="k">已停用</div><div class="v">2</div><div class="d down">1 个本月停用</div></div>';
  }

  function renderAgents() {
    renderAgentStats();
    if (agentState.tab === 'pending') {
      $('#agentTreeWrap').hidden = true;
      $('#agentPendingPanel').hidden = false;
      renderAgentPending();
      return;
    }
    $('#agentTreeWrap').hidden = false;
    $('#agentPendingPanel').hidden = true;
    renderAgentTree();
    renderAgentDetail();
  }

  function agentMatches(a) {
    if (agentState.status !== 'all' && a.status !== agentState.status) return false;
    var q = agentState.query.trim().toLowerCase();
    if (!q) return true;
    return (a.name + ' ' + a.code + ' ' + a.phone).toLowerCase().indexOf(q) >= 0;
  }

  function renderAgentTree() {
    var tree = $('#agentTree');
    var foot = $('#agentTreeFoot');
    if (agentState.state === 'loading') {
      tree.innerHTML = skeletonRows(5);
      foot.textContent = '正在加载代理树…';
      lastTreeRows = [];
      return;
    }
    if (agentState.state === 'error') {
      tree.innerHTML = adminError('代理树加载失败', 'agent-retry');
      foot.textContent = '加载失败，可重试';
      return;
    }
    if (agentState.state === 'empty') {
      tree.innerHTML = adminEmpty('🌳', '还没有代理', '新增代理后，这里会显示层级、商户和业绩。', '<button class="btn-xs primary" data-act="agent-add">＋ 新增代理</button>');
      foot.textContent = '';
      return;
    }

    var filtering = agentState.query.trim() || agentState.status !== 'all';
    var scope = {};
    var forceExpand = {};
    if (filtering) {
      AGENTS.forEach(function (a) {
        if (!agentMatches(a)) return;
        var pid = a.id;
        while (pid) {
          scope[pid] = true;
          forceExpand[pid] = true;
          var p = agent(pid);
          pid = p ? p.parent : null;
        }
      });
    } else {
      AGENTS.forEach(function (a) { scope[a.id] = true; });
    }

    var rows = [];
    function walk(id, depth) {
      var a = agent(id);
      if (!a || !scope[id]) return;
      rows.push({ a: a, depth: depth });
      if (agentChildren(a).length && (agentState.expanded.indexOf(id) >= 0 || forceExpand[id])) {
        agentChildren(a).forEach(function (cid) { walk(cid, depth + 1); });
      }
    }
    walk('a1', 0);

    if (!rows.length) {
      tree.innerHTML = adminEmpty('⌕', '没有找到匹配的代理', '换个关键词，或清除状态筛选再试。', '<button class="btn-xs" data-act="agent-clear">清除筛选</button>');
      foot.textContent = '';
      lastTreeRows = [];
      return;
    }
    if (!rows.some(function (r) { return r.a.id === agentState.selected; })) {
      agentState.selected = rows[0].a.id;
      agentState.detailTab = 'basic';
    }
    lastTreeRows = rows;

    tree.innerHTML = rows.map(function (row) {
      var a = row.a;
      var kids = agentChildren(a);
      var expanded = agentState.expanded.indexOf(a.id) >= 0 || forceExpand[a.id];
      var dot = a.status === 'normal' ? 'ok' : a.status === 'pending' ? 'wait' : a.status === 'stopped' ? 'off' : 'bad';
      return '<div class="tree-row ' + (a.id === agentState.selected ? 'selected' : '') + ' ' + (a.status === 'stopped' ? 'is-stopped' : '') +
        '" data-agent-id="' + a.id + '" role="treeitem" aria-selected="' + (a.id === agentState.selected) + '" tabindex="-1">' +
        '<span class="tree-indent" style="width:' + (row.depth * 20) + 'px"></span>' +
        (kids.length
          ? '<button type="button" class="tree-arrow" data-act="agent-toggle" data-id="' + a.id + '" aria-label="' + (expanded ? '收起' : '展开') + '">' + (expanded ? '▾' : '▸') + '</button>'
          : '<span class="tree-arrow placeholder"></span>') +
        '<span class="tree-avatar">' + esc(agentShort(a.name)) + '</span>' +
        '<span class="tree-main"><span class="tree-name">' + highlight(a.name, agentState.query.trim()) + '</span>' +
        '<span class="tree-level">L' + a.level + '</span><span class="tree-dot ' + dot + '"></span>' +
        '<span class="tree-meta">商户 ' + a.merchants + ' · 月交易 ' + wan(a.monthTx) + ' 万</span></span>' +
        (a.relationPending ? '<span class="chip warn">变更待审批</span>' : '') +
        '</div>';
    }).join('');
    foot.textContent = '最多 3 级（可配）· ↑↓ 移动，→ 展开，← 收起，Enter 打开详情';
  }

  function renderAgentDetail() {
    var box = $('#agentDetail');
    if (agentState.state === 'loading') { box.innerHTML = '<div class="panel-body pad">' + skeletonRows(4) + '</div>'; return; }
    if (agentState.state === 'error') { box.innerHTML = '<div class="panel-body pad">' + adminError('代理详情加载失败', 'agent-retry') + '</div>'; return; }
    if (agentState.state === 'empty') { box.innerHTML = '<div class="panel-body pad">' + adminEmpty('▤', '未选择代理', '在左侧代理树中选择一个代理查看详情。', '') + '</div>'; return; }
    var a = agent(agentState.selected);
    if (!a) { box.innerHTML = '<div class="panel-body pad">' + adminEmpty('▤', '未选择代理', '在左侧代理树中选择一个代理查看详情。', '') + '</div>'; return; }

    var parent = a.parent ? agent(a.parent) : null;
    var tabs = [['basic', '基本信息'], ['fee', '费率'], ['merchants', '名下商户'], ['performance', '业绩'], ['logs', '操作日志']];
    var actionBtns = '';
    if (a.status === 'pending') {
      actionBtns = '<button class="btn-xs primary" data-act="agent-approve" data-id="' + a.id + '">通过审核</button>' +
        '<button class="btn-xs danger-ghost" data-act="agent-reject" data-id="' + a.id + '">驳回</button>';
    } else if (a.status === 'stopped') {
      actionBtns = '<button class="btn-xs primary" data-act="agent-enable" data-id="' + a.id + '">启用代理</button>';
    } else {
      actionBtns = '<button class="btn-xs" data-act="agent-fee" data-id="' + a.id + '">调整费率</button>' +
        '<button class="btn-xs" data-act="agent-relation" data-id="' + a.id + '">调整关系</button>' +
        '<button class="btn-xs danger-ghost" data-act="agent-stop" data-id="' + a.id + '">停用</button>';
    }

    var relationBanner = a.relationPending
      ? '<div class="banner warn">变更待审批：新上级「' + esc(agent(a.relationPending.parentId) ? agent(a.relationPending.parentId).name : '') +
      '」，生效日 ' + esc(a.relationPending.date) + '。审批通过前业绩仍归原上级。</div>'
      : '';
    var stoppedBanner = a.status === 'stopped'
      ? '<div class="banner danger"><b>该代理已停用</b><p>' + esc(a.stoppedReason) + ' · ' + esc(a.stoppedAt) + '</p><p>停用后不能新增商户，存量分润照常结算完毕。</p></div>'
      : '';

    var tabBody = '';
    if (agentState.detailTab === 'fee') {
      var minChild = null;
      agentChildren(a).forEach(function (cid) {
        var c = agent(cid);
        if (c && (minChild === null || c.quote < minChild)) minChild = c.quote;
      });
      tabBody = '<div class="fee-cards">' +
        '<div><span>成本价</span><b>' + a.cost.toFixed(2) + '%</b><small>上级给它的成本</small></div>' +
        '<div><span>对外报价</span><b>' + a.quote.toFixed(2) + '%</b><small>当前生效</small></div>' +
        '<div><span>本层毛利</span><b class="green">' + (a.quote - a.cost).toFixed(2) + '%</b><small>报价 − 成本</small></div>' +
        '</div>' +
        '<div class="kv-list" style="margin-top:14px">' +
        '<div class="kv"><span>生效时间</span><b>' + esc(a.effective) + '</b></div>' +
        '<div class="kv"><span>下级最低报价</span><b>' + (minChild === null ? '—' : minChild.toFixed(2) + '%') + '</b></div>' +
        '<div class="kv"><span>校验规则</span><b>新报价 ≥ 成本价' + (minChild === null ? '' : '，且 ≤ 下级最低报价') + '</b></div>' +
        '</div>' +
        '<p class="field-hint" style="margin-top:12px">子级费率不得低于上级给它的成本；调整本层费率不会自动修改下级报价。</p>' +
        (a.status === 'normal' ? '<button class="btn-xs primary" style="margin-top:12px" data-act="agent-fee" data-id="' + a.id + '">调整费率</button>' : '');
    } else if (agentState.detailTab === 'merchants') {
      tabBody = '<div class="table-scroll"><table class="tbl"><thead><tr><th>商户</th><th>通道</th><th>状态</th><th style="text-align:right">近 30 天交易（元）</th></tr></thead><tbody>' +
        AGENT_MERCHANTS.map(function (m) {
          return '<tr><td><b>' + esc(m.name) + '</b></td><td>' + esc(m.channel) + '</td><td>' +
            (m.status === '正常' ? '<span class="chip ok">正常</span>' : m.status === '已停用' ? '<span class="chip line">已停用</span>' : '<span class="chip warn">待完善</span>') +
            '</td><td class="num" style="text-align:right">' + fmt(m.tx) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="field-hint" style="margin-top:10px">「查看全部」按当前代理筛选进入商户列表（演示环境仅展示 5 行）。</p>';
    } else if (agentState.detailTab === 'performance') {
      tabBody = '<div class="mini-stats">' +
        '<div><span>本月交易额</span><b>' + fmt(a.monthTx) + ' 元</b></div>' +
        '<div><span>名下商户</span><b>' + a.merchants + ' 户</b></div>' +
        '<div><span>本月分成</span><b>' + fmt(Math.round(a.monthTx * 0.001)) + ' 元</b></div>' +
        '</div>' +
        '<div class="table-scroll" style="margin-top:14px"><table class="tbl"><thead><tr><th>账期</th><th>商户数</th><th style="text-align:right">交易额（元）</th><th style="text-align:right">分成金额（元）</th></tr></thead><tbody>' +
        AGENT_MONTHS.map(function (m) {
          return '<tr><td>' + esc(m.month) + '</td><td>' + m.merchants + '</td><td class="num" style="text-align:right">' + fmt(m.tx) + '</td><td class="num" style="text-align:right">' + fmt(m.share) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else if (agentState.detailTab === 'logs') {
      tabBody = '<div class="timeline">' + (a.logs || []).map(function (line, idx) {
        return '<div class="tl-item ' + (idx === 0 ? 'now' : 'done') + '"><span class="tl-dot"></span><div><div class="tl-t">' + esc(line.split(' · ').slice(1).join(' · ')) +
          '</div><div class="tl-d">' + esc(line.split(' · ')[0]) + '</div></div></div>';
      }).join('') + '</div>';
    } else {
      tabBody = '<div class="kv-grid">' +
        kvItem('代理名称', a.name) + kvItem('编号', a.code) + kvItem('姓名', a.name) +
        kvItem('手机号', a.phone) + kvItem('身份证号', a.idNo) + kvItem('上级代理', parent ? parent.name : '—') +
        kvItem('层级', 'L' + a.level) + kvItem('注册时间', a.regTime) + kvItem('结算账户', a.account) +
        kvItem('邀请码', a.invite) + kvItem('名下商户', a.merchants + ' 户') +
        kvItem('本月交易', fmt(a.monthTx) + ' 元') + '</div>';
    }

    box.innerHTML = '<div class="agent-detail-inner">' +
      '<div class="agent-detail-head"><div><div class="agent-title">' + esc(a.name) + ' ' + agentChip(a.status) + '</div>' +
      '<div class="agent-sub">' + esc(a.code) + ' · L' + a.level + ' · 上级 ' + esc(parent ? parent.name : '无') + '</div></div>' +
      '<button type="button" class="drawer-close" data-act="agent-drawer-close" aria-label="关闭">×</button></div>' +
      '<div class="agent-actions">' + actionBtns + '</div>' +
      stoppedBanner + relationBanner +
      '<div class="tabs mini-tabs">' + tabs.map(function (t) {
        return '<button class="' + (agentState.detailTab === t[0] ? 'on' : '') + '" data-act="agent-tab" data-val="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="agent-tab-body">' + tabBody + '</div></div>';
  }
  function kvItem(label, value) {
    return '<div class="kv-item"><span>' + esc(label) + '</span><b>' + esc(value) + '</b></div>';
  }

  function renderAgentPending() {
    var rows = AGENTS.filter(function (a) { return a.status === 'pending'; });
    $('#agentPendingBadge').textContent = rows.length;
    var body = $('#agentPendingBody');
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7">' + adminEmpty('✓', '没有待审核的代理', '新注册代理会出现在这里。', '') + '</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (a) {
      var p = a.parent ? agent(a.parent) : null;
      return '<tr><td><b>' + esc(a.name) + '</b><div class="sub">' + esc(a.code) + ' · 身份证 ' + esc(a.idNo) + '</div></td>' +
        '<td>' + esc(p ? p.name : '—') + '</td><td>L' + a.level + '</td><td>' + esc(a.submitted) + '</td>' +
        '<td><span class="chip ok">资料齐全</span> <span class="chip line">待核验</span></td>' +
        '<td>' + agentChip(a.status) + '</td>' +
        '<td><button class="link" data-act="agent-approve" data-id="' + a.id + '">通过</button> ' +
        '<button class="link danger-link" data-act="agent-reject" data-id="' + a.id + '">驳回</button></td></tr>';
    }).join('');
  }

  // ---------------------------------------------------------------- 代理操作
  function openAgentAdd() {
    var parents = AGENTS.filter(function (a) { return a.level < 3 && a.status === 'normal'; });
    openModal(
      '<div class="form-grid">' +
      '<div class="row-2"><div class="field"><label>代理名称 <span class="req">*</span></label><input class="input" id="agName" placeholder="如：宁波海曙云拓服务部" /></div>' +
      '<div class="field"><label>姓名 <span class="req">*</span></label><input class="input" id="agReal" placeholder="与身份证一致" /></div></div>' +
      '<div class="row-2"><div class="field"><label>手机号 <span class="req">*</span></label><input class="input" id="agPhone" inputmode="tel" placeholder="11 位手机号" /></div>' +
      '<div class="field"><label>身份证号 <span class="req">*</span></label><input class="input" id="agIdNo" placeholder="18 位身份证号" /></div></div>' +
      '<div class="row-2"><div class="field"><label>结算银行 <span class="req">*</span></label><input class="input" id="agBank" value="招商银行" /></div>' +
      '<div class="field"><label>银行卡号 <span class="req">*</span></label><input class="input" id="agCard" inputmode="numeric" placeholder="银行卡号" /></div></div>' +
      '<div class="row-2"><div class="field"><label>上级代理 <span class="req">*</span></label><select class="select" id="agParent">' +
      parents.map(function (p) { return '<option value="' + p.id + '" ' + (p.id === agentState.selected ? 'selected' : '') + '>' + esc(p.name) + '（L' + p.level + '）</option>'; }).join('') +
      '</select></div><div class="field"><label>结算省市</label><input class="input" value="浙江省 / 宁波市" /></div></div>' +
      '<div class="field"><label>身份证 / 银行卡照片</label><button type="button" class="upload compact" data-act="upload-demo">上传资料</button></div>' +
      '<p class="field-hint">提交后进入「审核中」，不是直接生效；审核通过后代理可登录。</p>' +
      '<p class="field-err" id="agErr"></p></div>',
      {
        title: '新增代理', wide: true,
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="agent-add-save">提交审核</button>'
      }
    );
  }

  function saveAgent() {
    var name = $('#agName').value.trim();
    var real = $('#agReal').value.trim();
    var phone = $('#agPhone').value.replace(/\s/g, '');
    var idNo = $('#agIdNo').value.trim();
    var bank = $('#agBank').value.trim();
    var card = $('#agCard').value.trim();
    var parentId = $('#agParent').value;
    var err = $('#agErr');
    if (!name) return (err.textContent = '请填写代理名称。');
    if (!real) return (err.textContent = '请填写姓名，需与身份证一致。');
    if (!/^1\d{10}$/.test(phone)) return (err.textContent = '请输入 11 位手机号。');
    if (!/^\d{17}[\dXx]$/.test(idNo)) return (err.textContent = '请输入 18 位身份证号。');
    if (!bank) return (err.textContent = '请填写结算银行。');
    if (card.replace(/\s/g, '').length < 8) return (err.textContent = '请填写完整的银行卡号。');
    var parent = agent(parentId);
    if (!parent) return (err.textContent = '请选择上级代理。');
    if (parent.level >= 3) return (err.textContent = '上级层级已达上限，不能再新增下级（最多 3 级）。');
    var id = 'a' + Date.now();
    AGENTS.push({
      id: id, name: name, code: 'A0' + String(190 + AGENTS.length), level: parent.level + 1,
      parent: parentId, status: 'pending', merchants: 0, monthTx: 0, cost: 0.30, quote: 0.36,
      effective: '待审核', phone: phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'), idNo: idNo.replace(/^(.{4})\d{10}(.{4})$/, '$1**********$2'),
      regTime: nowText().slice(0, 10), account: bank + ' **** ' + card.slice(-4), invite: 'YQ-' + String(8000 + AGENTS.length),
      children: [], submitted: nowText(), logs: [nowText() + ' · ' + (agent(agentState.selected) ? agent(agentState.selected).name : '运营') + ' · 提交代理注册资料']
    });
    parent.children = parent.children || [];
    parent.children.push(id);
    closeModal();
    agentState.tab = 'pending';
    $$('#agentTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === 'pending'); });
    renderAgents();
    toast('已提交，进入审核中');
  }

  function openAgentFee(id) {
    var a = agent(id);
    if (!a) return;
    var minChild = null;
    agentChildren(a).forEach(function (cid) {
      var c = agent(cid);
      if (c && (minChild === null || c.quote < minChild)) minChild = c.quote;
    });
    openModal(
      '<div class="kv-list">' +
      '<div class="kv"><span>当前成本价</span><b>' + a.cost.toFixed(2) + '%（只读）</b></div>' +
      '<div class="kv"><span>当前对外报价</span><b>' + a.quote.toFixed(2) + '%</b></div>' +
      (minChild !== null ? '<div class="kv"><span>下级最低报价</span><b>' + minChild.toFixed(2) + '%</b></div>' : '') +
      '</div>' +
      '<div class="form-grid" style="margin-top:14px">' +
      '<div class="field"><label>新报价（%） <span class="req">*</span></label><input class="input" id="agFeeNew" inputmode="decimal" value="' + a.quote.toFixed(2) + '" /></div>' +
      '<div class="field"><label>生效时间</label><input class="input" id="agFeeDate" type="date" value="2026-11-12" /></div>' +
      '</div>' +
      '<p class="field-hint">新报价必须 ≥ 成本价' + (minChild !== null ? '，且 ≤ 下级最低报价 ' + minChild.toFixed(2) + '%' : '') + '；保存后不自动修改下级。</p>' +
      '<p class="field-err" id="agFeeErr"></p>',
      {
        title: '调整「' + a.name + '」费率',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="agent-fee-save" data-id="' + id + '">保存费率</button>'
      }
    );
  }

  function saveAgentFee(id) {
    var a = agent(id);
    var raw = $('#agFeeNew').value.replace('%', '').trim();
    var val = parseFloat(raw);
    var err = $('#agFeeErr');
    if (!isFinite(val) || val <= 0) return (err.textContent = '请输入有效费率，例如 0.31。');
    if (val < a.cost) return (err.textContent = '新报价不能低于成本价 ' + a.cost.toFixed(2) + '%，否则每笔亏损。');
    var minChild = null;
    agentChildren(a).forEach(function (cid) {
      var c = agent(cid);
      if (c && (minChild === null || c.quote < minChild)) minChild = c.quote;
    });
    if (minChild !== null && val > minChild) {
      return (err.textContent = '新报价不能高于下级最低报价 ' + minChild.toFixed(2) + '%，否则下级亏本。');
    }
    var old = a.quote;
    a.quote = val;
    a.effective = $('#agFeeDate').value || '2026-11-12';
    a.logs.unshift(nowText() + ' · 张敏 · 调整费率：' + old.toFixed(2) + '% → ' + val.toFixed(2) + '%');
    closeModal();
    renderAgentTree();
    renderAgentDetail();
    toast('费率已更新，生效时间 ' + a.effective);
  }

  function openAgentStop(id) {
    var a = agent(id);
    openModal(
      '<p class="sheet-lead">停用后该代理不能新增商户，存量分润照常结算完毕。请填写原因（至少 5 个字）。</p>' +
      '<div class="field"><label>停用原因 <span class="req">*</span></label><textarea class="textarea" id="agStopReason" rows="3" placeholder="例如：连续 3 个月未达标"></textarea></div>' +
      '<p class="field-err" id="agStopErr"></p>',
      {
        title: '停用「' + a.name + '」？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs danger-solid" data-act="agent-stop-confirm" data-id="' + id + '">确认停用</button>'
      }
    );
  }

  function confirmAgentStop(id) {
    var reason = $('#agStopReason').value.trim();
    if (reason.length < 5) return ($('#agStopErr').textContent = '请填写至少 5 个字的停用原因，便于审计。');
    var a = agent(id);
    a.status = 'stopped';
    a.stoppedReason = reason;
    a.stoppedAt = nowText();
    a.logs.unshift(nowText() + ' · 张敏 · 停用代理：' + reason);
    closeModal();
    renderAgentTree();
    renderAgentDetail();
    toast('代理已停用');
  }

  function openAgentEnable(id) {
    var a = agent(id);
    openModal('<p class="sheet-lead">恢复后该代理可立即登录并开展业务，历史停用记录保留。</p>',
      {
        title: '启用「' + a.name + '」？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="agent-enable-confirm" data-id="' + id + '">确认启用</button>'
      });
  }
  function confirmAgentEnable(id) {
    var a = agent(id);
    a.status = 'normal';
    a.stoppedReason = '';
    a.logs.unshift(nowText() + ' · 张敏 · 启用代理');
    closeModal();
    renderAgentTree();
    renderAgentDetail();
    toast('代理已启用');
  }

  function openAgentRelation(id) {
    var a = agent(id);
    var banned = descendants(id).concat([id]);
    var options = AGENTS.filter(function (p) { return p.level < 3 && p.status === 'normal' && banned.indexOf(p.id) < 0; });
    openModal(
      '<div class="form-grid">' +
      '<div class="field"><label>新上级 <span class="req">*</span></label><select class="select" id="agNewParent">' +
      options.map(function (p) { return '<option value="' + p.id + '" ' + (a.parent === p.id ? 'selected' : '') + '>' + esc(p.name) + '（L' + p.level + '）</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label>生效日期</label><input class="input" type="date" id="agRelDate" value="2026-12-01" /></div></div>' +
      '<p class="field-hint">关系变更需审批留痕，生效日前的业绩仍归原上级；不能把代理挂到自己的下级。</p>' +
      '<p class="field-err" id="agRelErr"></p>',
      {
        title: '调整「' + a.name + '」的上级',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="agent-relation-save" data-id="' + id + '">提交审批</button>'
      });
  }
  function saveAgentRelation(id) {
    var a = agent(id);
    var newParent = $('#agNewParent').value;
    if (newParent === a.parent) return ($('#agRelErr').textContent = '新上级与当前上级相同，请选择其他代理。');
    if (newParent === id || descendants(id).indexOf(newParent) >= 0) {
      return ($('#agRelErr').textContent = '不能选择自己的下级作为上级，会造成循环关系。');
    }
    var p = agent(newParent);
    if (!p || p.level >= 3) return ($('#agRelErr').textContent = '该上级层级已达上限，不能再接收下级。');
    a.relationPending = { parentId: newParent, date: $('#agRelDate').value || '2026-12-01' };
    a.logs.unshift(nowText() + ' · 张敏 · 提交关系变更：上级 ' + (a.parent ? agent(a.parent).name : '—') + ' → ' + p.name);
    closeModal();
    renderAgentTree();
    renderAgentDetail();
    toast('变更已提交审批，状态「变更待审批」');
  }

  function approveAgent(id) {
    var a = agent(id);
    a.status = 'normal';
    a.logs.unshift(nowText() + ' · 张敏 · 注册审核通过');
    renderAgents();
    toast('代理审核已通过');
  }
  function openAgentReject(id) {
    var a = agent(id);
    openModal(
      '<p class="sheet-lead">驳回后代理会看到原因，并可修改资料后重新提交。</p>' +
      '<div class="field"><label>驳回原因 <span class="req">*</span></label><textarea class="textarea" id="agRejectReason" rows="3" placeholder="例如：身份证照片模糊"></textarea></div>' +
      '<p class="field-err" id="agRejectErr"></p>',
      {
        title: '驳回「' + a.name + '」的注册？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs danger-solid" data-act="agent-reject-confirm" data-id="' + id + '">确认驳回</button>'
      });
  }
  function confirmAgentReject(id) {
    var reason = $('#agRejectReason').value.trim();
    if (reason.length < 5) return ($('#agRejectErr').textContent = '请填写至少 5 个字的驳回原因。');
    var a = agent(id);
    a.status = 'rejected';
    a.rejectReason = reason;
    a.logs.unshift(nowText() + ' · 张敏 · 注册驳回：' + reason);
    closeModal();
    renderAgents();
    toast('已驳回，代理可修改后重提');
  }

  // ---------------------------------------------------------------- 提现页
  function renderWithdrawals() {
    renderWdStats();
    renderWdTabs();
    renderWdTable();
    if (wdState.approvalClosed) {
      $('#wdClosedBanner').hidden = false;
      $('#wdApprovalToggle').textContent = '人工审批：关闭';
      $('#wdApprovalToggle').classList.add('off');
    } else {
      $('#wdClosedBanner').hidden = true;
      $('#wdApprovalToggle').textContent = '人工审批：开启';
      $('#wdApprovalToggle').classList.remove('off');
    }
  }

  function renderWdStats() {
    var pending = WITHDRAWALS.filter(function (w) { return w.status === 'pending'; });
    var approvedToday = WITHDRAWALS.filter(function (w) { return w.status === 'approved' && w.submitted.slice(0, 10) === '2026-11-11'; });
    var failed = WITHDRAWALS.filter(function (w) { return w.status === 'failed'; });
    var feeIncome = approvedToday.reduce(function (s, w) { return s + M.fee(w.amount); }, 0);
    var box = $('#wdStats');
    if (wdState.state === 'loading' || wdState.state === 'error') {
      box.innerHTML = ['待审批', '今日已通过', '打款失败', '手续费收入'].map(function (k) {
        return '<div class="stat"><div class="k">' + k + '</div><div class="v">—</div><div class="d">加载中</div></div>';
      }).join('');
      return;
    }
    box.innerHTML =
      '<div class="stat"><div class="k">待审批</div><div class="v">' + pending.length + '<small>笔</small></div><div class="d">合计 ' + yuan(wdSum(pending)) + '</div></div>' +
      '<div class="stat"><div class="k">今日已通过</div><div class="v">' + approvedToday.length + '<small>笔</small></div><div class="d">合计 ' + yuan(wdSum(approvedToday)) + '</div></div>' +
      '<div class="stat"><div class="k">打款失败</div><div class="v">' + failed.length + '<small>笔</small></div><div class="d down">需人工处理</div></div>' +
      '<div class="stat"><div class="k">手续费收入</div><div class="v">' + fmt(feeIncome) + '<small>元</small></div><div class="d">本期 · 费率待确认</div></div>';
  }

  function renderWdTabs() {
    var counts = {
      pending: WITHDRAWALS.filter(function (w) { return w.status === 'pending'; }).length,
      reviewing: WITHDRAWALS.filter(function (w) { return w.status === 'reviewing'; }).length,
      approved: WITHDRAWALS.filter(function (w) { return w.status === 'approved'; }).length,
      rejected: WITHDRAWALS.filter(function (w) { return w.status === 'rejected'; }).length,
      failed: WITHDRAWALS.filter(function (w) { return w.status === 'failed'; }).length
    };
    var tabs = $('#wdTabs');
    tabs.querySelector('[data-status="pending"] .tab-badge').textContent = counts.pending;
    tabs.querySelector('[data-status="reviewing"] .tab-badge').textContent = counts.reviewing;
    tabs.querySelector('[data-status="approved"] .tab-badge').textContent = counts.approved;
    tabs.querySelector('[data-status="rejected"] .tab-badge').textContent = counts.rejected;
    tabs.querySelector('[data-status="failed"] .tab-badge').textContent = counts.failed;
    $$('#wdTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.status === wdState.tab); });
    $('#wdTableHint').textContent = '当前筛选：' + (tabs.querySelector('[data-status="' + wdState.tab + '"]').textContent || '').replace(/\s*\d+\s*$/, '').trim();
  }

  function filteredWds() {
    var f = wdState.filters;
    return WITHDRAWALS.filter(function (w) {
      if (wdState.tab !== 'all' && w.status !== wdState.tab) return false;
      if (f.agent) {
        var q = f.agent.toLowerCase();
        if ((w.agent + ' ' + w.code + ' ' + w.no).toLowerCase().indexOf(q) < 0) return false;
      }
      if (f.subject !== 'all' && w.subject !== f.subject) return false;
      if (f.range === 'today' && w.submitted.slice(0, 10) !== '2026-11-11') return false;
      if (f.range === '7d' && w.submitted.slice(0, 10) < '2026-11-05') return false;
      if (f.amount === 'lt5k' && w.amount >= 500000) return false;
      if (f.amount === '5k-10k' && (w.amount < 500000 || w.amount > 1000000)) return false;
      if (f.amount === 'gt10k' && w.amount <= 1000000) return false;
      if (f.channel !== 'all' && w.channel !== f.channel) return false;
      return true;
    });
  }

  function renderWdTable() {
    var tbody = $('#wdTbody');
    var pager = $('#wdPager');
    var state = wdState.state;
    if (state === 'loading') {
      tbody.innerHTML = Array.from({ length: 6 }).map(function () {
        return '<tr class="sk-tr"><td colspan="11"><div class="sk sk-line w80"></div></td></tr>';
      }).join('');
      pager.innerHTML = '';
      return;
    }
    if (state === 'error') {
      tbody.innerHTML = '<tr><td colspan="11">' + adminError('提现列表加载失败', 'wd-retry-load') + '</td></tr>';
      pager.innerHTML = '';
      return;
    }
    var rows = filteredWds();
    if (state === 'empty' || !rows.length) {
      var pendingTab = wdState.tab === 'pending';
      tbody.innerHTML = '<tr><td colspan="11">' + adminEmpty('▤',
        pendingTab ? '没有待审批的提现' : '当前筛选没有提现记录',
        pendingTab ? '新提交的提现会出现在这里。' : '调整筛选条件，或重置后再试。',
        pendingTab ? '<button class="btn-xs" data-act="wd-show-all">查看全部记录</button>' : '<button class="btn-xs" data-act="wd-reset">重置筛选</button>') + '</td></tr>';
      pager.innerHTML = '<span>共 0 条</span>';
      updateBatchBar();
      return;
    }
    tbody.innerHTML = rows.map(function (w) {
      var selected = !!wdState.selected[w.no];
      var action = '';
      if (w.status === 'pending') action = '<button class="link" data-act="wd-open" data-no="' + w.no + '">' + (wdState.approvalClosed ? '查看' : '审批') + '</button>';
      else if (w.status === 'failed') action = '<button class="link" data-act="wd-retry" data-no="' + w.no + '">重试</button>';
      else if (w.status === 'rejected') action = '<button class="link" data-act="wd-open" data-no="' + w.no + '">查看原因</button>';
      else action = '<button class="link" data-act="wd-open" data-no="' + w.no + '">查看</button>';
      return '<tr class="' + (selected ? 'is-selected' : '') + '">' +
        '<td class="col-check">' + (w.status === 'pending'
          ? '<input type="checkbox" class="wd-check" data-no="' + w.no + '" ' + (selected ? 'checked' : '') + ' aria-label="选择 ' + w.no + '" />'
          : '<span class="check-empty">—</span>') + '</td>' +
        '<td class="num">' + esc(w.no) + '</td>' +
        '<td><b>' + esc(w.agent) + '</b><div class="sub">' + esc(w.code) + ' · ' + w.level + '</div>' +
        (w.risk && w.risk.indexOf('账户异常') >= 0 ? '<div class="sub"><span class="chip warn">账户异常</span></div>' : '') + '</td>' +
        '<td>' + esc(WD_SUBJECTS[w.subject] || w.subject) + '</td>' +
        '<td class="num" style="text-align:right">' + fmt(w.amount) + '</td>' +
        '<td class="num" style="text-align:right">' + fmt(M.fee(w.amount)) + '</td>' +
        '<td class="num" style="text-align:right"><b>' + fmt(M.net(w.amount)) + '</b></td>' +
        '<td>' + esc(wdAccount(w)) + '</td>' +
        '<td>' + esc(w.submitted.slice(5, 16)) + '</td>' +
        '<td>' + wdStatus(w) + '</td>' +
        '<td>' + action + '</td></tr>';
    }).join('');
    pager.innerHTML = '<span>共 ' + rows.length + ' 条</span><span style="margin-left:auto"></span>' +
      '<button class="pg">‹</button><button class="pg on">1</button><button class="pg">›</button>';
    updateBatchBar();
  }

  function updateBatchBar() {
    var selected = Object.keys(wdState.selected).filter(function (no) {
      var w = wd(no);
      return w && w.status === 'pending';
    });
    var bar = $('#wdBatchBar');
    if (!selected.length) {
      bar.hidden = true;
      var all = $('#wdCheckAll');
      if (all) all.checked = false;
      return;
    }
    bar.hidden = false;
    var rows = selected.map(wd);
    $('#wdBatchCount').textContent = selected.length;
    $('#wdBatchSum').textContent = yuan(wdSum(rows));
    var visiblePending = filteredWds().filter(function (w) { return w.status === 'pending'; });
    var allChecked = visiblePending.length > 0 && visiblePending.every(function (w) { return wdState.selected[w.no]; });
    $('#wdCheckAll').checked = allChecked;
  }

  function openApproval(no) {
    var w = wd(no);
    if (!w) return;
    var hist = wdHistory(w);
    var isPending = w.status === 'pending';
    var riskBlocked = !!(w.risk && w.risk.indexOf('账户异常') >= 0);
    var approveDisabled = wdState.approvalClosed || riskBlocked;
    var approveTitle = wdState.approvalClosed ? '人工审批已关闭' : (riskBlocked ? '账户异常，需先核对账户后再通过' : '');
    var footer = isPending
      ? '<button class="btn-xs" data-act="modal-close">取消</button>' +
        '<button class="btn-xs danger-ghost" data-act="wd-reject" data-no="' + w.no + '">驳回申请</button>' +
        '<button class="btn-xs primary" data-act="wd-approve" data-no="' + w.no + '" ' + (approveDisabled ? 'disabled title="' + approveTitle + '"' : '') + '>通过并打款</button>'
      : '<button class="btn-xs" data-act="modal-close">关闭</button>';
    openModal(
      '<div class="approval-applicant"><div class="thumb">' + esc(w.agent.slice(0, 1)) + '</div>' +
      '<div><b>' + esc(w.agent) + '</b><div class="sub">' + esc(w.code) + ' · ' + w.level + ' · ' + esc(w.channel) + '</div></div>' +
      '<span class="chip ' + (w.account.type === 'public' ? 'blue' : 'line') + '">' + (w.account.type === 'public' ? '对公' : '对私') + '</span></div>' +
      '<div class="approval-account"><span>收款账户</span><b>' + esc(wdAccount(w)) + '</b>' +
      (w.account.type === 'public' ? '<div class="sub">' + esc(w.account.company) + ' · ' + esc(w.account.bank) + '</div>' : '<div class="sub">' + esc(w.account.name) + ' · ' + esc(w.account.bank) + '</div>') + '</div>' +
      '<div class="amount-three">' +
      '<div><span>提现金额</span><b>' + yuan(w.amount) + '</b></div>' +
      '<div><span>手续费 <i class="chip line">费率待确认</i></span><b>' + yuan(M.fee(w.amount)) + '</b></div>' +
      '<div><span>到账金额</span><b class="green">' + yuan(M.net(w.amount)) + '</b></div></div>' +
      '<div class="risk-row"><span>风险提示</span>' + (w.risk && w.risk.length ? w.risk.map(function (r) { return '<span class="chip warn">' + esc(r) + '</span>'; }).join('') : '<span class="chip ok">未发现明显风险</span>') + '</div>' +
      '<div class="sec-mini">审批历史</div>' +
      '<div class="timeline">' + hist.map(function (h, i) {
        return '<div class="tl-item ' + (i === hist.length - 1 ? 'now' : 'done') + '"><span class="tl-dot"></span><div><div class="tl-t">' + esc(h.text) + '</div><div class="tl-d">' + esc(h.t) + ' · ' + esc(h.by) + '</div></div></div>';
      }).join('') + '</div>' +
      (w.reason && w.status !== 'rejected' ? '<div class="banner danger" style="margin-top:12px">' + esc(w.reason) + '</div>' : '') +
      (w.status === 'rejected' ? '<div class="banner danger" style="margin-top:12px">驳回原因：' + esc(w.reason) + '</div>' : ''),
      { title: '提现审批 · ' + w.no, drawer: true, footer: footer }
    );
  }

  function openApproveConfirm(no) {
    var w = wd(no);
    openModal(
      '<p class="sheet-lead">请再次核对金额与收款账户。确认后将调通道批量代付，结果异步回填。</p>' +
      '<div class="confirm-box">' +
      '<div class="r"><span>申请单号</span><b>' + esc(w.no) + '</b></div>' +
      '<div class="r"><span>提现金额</span><b>' + yuan(w.amount) + '</b></div>' +
      '<div class="r"><span>手续费</span><b>' + yuan(M.fee(w.amount)) + '</b></div>' +
      '<div class="r"><span>到账金额</span><b class="green">' + yuan(M.net(w.amount)) + '</b></div>' +
      '<div class="r"><span>收款账户</span><b>' + esc(wdAccount(w)) + '</b></div></div>',
      {
        title: '确认通过 ' + yuan(w.amount) + '？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="wd-approve-confirm" data-no="' + w.no + '">确认通过 ' + yuan(w.amount) + '</button>'
      });
  }
  function doApprove(no, btn) {
    var w = wd(no);
    if (!w || w.status !== 'pending') { toast('该笔已被处理，请刷新列表'); closeModal(); renderWithdrawals(); return; }
    btn.disabled = true;
    btn.textContent = '打款中…';
    setTimeout(function () {
      w.status = 'approved';
      w.reviewer = '张敏';
      w.reviewedAt = nowText();
      closeModal();
      renderWithdrawals();
      toast('已通过并提交打款：' + w.no);
    }, 850);
  }

  function openReject(no) {
    var w = wd(no);
    openModal(
      '<p class="sheet-lead">驳回后代理会看到原因，并可修改资料后重新提交。原因至少 5 个字。</p>' +
      '<div class="field"><label>驳回原因 <span class="req">*</span></label><textarea class="textarea" id="wdRejectReason" rows="3" maxlength="50" placeholder="例如：收款账户与实名信息不一致"></textarea></div>' +
      '<p class="field-err" id="wdRejectErr"></p>',
      {
        title: '驳回这笔提现？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs danger-solid" data-act="wd-reject-confirm" data-no="' + w.no + '" disabled>确认驳回</button>'
      });
    var ta = $('#wdRejectReason');
    var err = $('#wdRejectErr');
    var btn = $('[data-act="wd-reject-confirm"]');
    if (ta && btn) {
      ta.addEventListener('input', function () {
        var len = ta.value.trim().length;
        if (len > 0 && len < 5) err.textContent = '请填写至少 5 个字的驳回原因，便于代理修改。';
        else err.textContent = '';
        btn.disabled = len < 5;
      });
    }
  }
  function doReject(no) {
    var reason = $('#wdRejectReason').value.trim();
    if (reason.length < 5) return ($('#wdRejectErr').textContent = '请填写至少 5 个字的驳回原因，便于代理修改。');
    var w = wd(no);
    w.status = 'rejected';
    w.reason = reason;
    w.reviewer = '张敏';
    w.reviewedAt = nowText();
    delete wdState.selected[no];
    closeModal();
    renderWithdrawals();
    toast('已驳回：' + w.no);
  }

  function openRetry(no) {
    var w = wd(no);
    openModal(
      '<p class="sheet-lead">仅重试这笔失败的代付，不重复已成功的笔。通道返回：' + esc(w.reason) + '</p>' +
      '<div class="confirm-box"><div class="r"><span>提现金额</span><b>' + yuan(w.amount) + '</b></div>' +
      '<div class="r"><span>收款账户</span><b>' + esc(wdAccount(w)) + '</b></div></div>',
      {
        title: '重试打款 ' + w.no + '？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="wd-retry-confirm" data-no="' + w.no + '">确认重试</button>'
      });
  }
  function doRetry(no) {
    var w = wd(no);
    w.status = 'reviewing';
    w.reviewedAt = nowText();
    closeModal();
    renderWithdrawals();
    toast('已提交重试，等待通道结果：' + w.no);
  }

  function openBatchConfirm() {
    var rows = Object.keys(wdState.selected).map(wd).filter(function (w) { return w && w.status === 'pending'; });
    if (!rows.length) { toast('请先选择待审批的提现'); return; }
    openModal(
      '<p class="sheet-lead">合计 ' + yuan(wdSum(rows)) + '；将逐笔打款，失败笔会单独标记，不影响其他笔。</p>' +
      '<div class="confirm-list">' + rows.map(function (w) {
        return '<div class="confirm-list-row"><span>' + esc(w.no) + ' · ' + esc(w.agent) + '</span><b>' + yuan(w.amount) + '</b></div>';
      }).join('') + '</div>',
      {
        title: '通过选中的 ' + rows.length + ' 笔提现？',
        footer: '<button class="btn-xs" data-act="modal-close">取消</button><button class="btn-xs primary" data-act="wd-batch-confirm">确认通过 ' + rows.length + ' 笔</button>'
      });
  }

  function doBatchApprove(btn) {
    var nos = Object.keys(wdState.selected).filter(function (no) {
      var w = wd(no); return w && w.status === 'pending';
    });
    if (!nos.length) return;
    btn.disabled = true;
    btn.textContent = '代付中…';
    setTimeout(function () {
      var failNo = nos[nos.length - 1];
      var results = [];
      nos.forEach(function (no) {
        var w = wd(no);
        if (no === failNo) {
          w.status = 'failed';
          w.reason = '通道返回：收款账户状态异常（ACCT_03），请核对账户后重试。';
          w.reviewedAt = nowText();
          results.push({ w: w, ok: false });
        } else {
          w.status = 'approved';
          w.reviewedAt = nowText();
          w.reviewer = '张敏';
          results.push({ w: w, ok: true });
        }
      });
      wdState.selected = {};
      renderWithdrawals();
      var okCount = results.filter(function (r) { return r.ok; }).length;
      openModal(
        '<div class="result-banner ' + (okCount === results.length ? 'ok' : 'warn') + '">' +
        (okCount === results.length ? '全部通过' : '部分失败：成功 ' + okCount + ' 笔，失败 ' + (results.length - okCount) + ' 笔') + '</div>' +
        '<div class="result-list">' + results.map(function (r) {
          return '<div class="result-row ' + (r.ok ? 'ok' : 'bad') + '"><div><b>' + esc(r.w.no) + '</b><div class="sub">' + esc(r.w.agent) + ' · ' + yuan(r.w.amount) + '</div></div>' +
            '<span>' + (r.ok ? '已通过' : '打款失败') + '</span></div>' +
            (r.ok ? '' : '<div class="result-reason">' + esc(r.w.reason) + '</div>');
        }).join('') + '</div>' +
        '<p class="field-hint" style="margin-top:10px">失败笔已单独标记，可在「打款失败」tab 重试；不影响其他笔。</p>',
        { title: '批量代付结果', footer: '<button class="btn-xs primary" data-act="modal-close">关闭</button>' }
      );
    }, 900);
  }

  function openFeeRule() {
    openModal(
      '<div class="rule-grid">' +
      '<div><span>计费方式</span><b>8% + ¥3.00 / 笔</b><small>比例 + 固定额</small></div>' +
      '<div><span>单笔最低</span><b>¥100.00</b><small>起提额</small></div>' +
      '<div><span>单笔最高</span><b>¥20,000.00</b><small>超出需分笔</small></div>' +
      '<div><span>到账时间</span><b>T+1</b><small>以通道为准</small></div>' +
      '</div>' +
      '<div class="banner warn" style="margin-top:14px">费率与固定额仍为 <b>待甲方确认</b> 项（需求 §15.2）。v0.2 只读展示，确认后只改数值和文案，不改页面结构。</div>' +
      '<div class="kv-list" style="margin-top:14px"><div class="kv"><span>配置状态</span><b>待确认（演示常量）</b></div>' +
      '<div class="kv"><span>生效范围</span><b>全部代理 · 全部科目</b></div>' +
      '<div class="kv"><span>人工审批</span><b>' + (wdState.approvalClosed ? '已关闭' : '开启') + '</b></div></div>',
      { title: '手续费规则', footer: '<button class="btn-xs primary" data-act="modal-close">我知道了</button>' }
    );
  }

  function exportWds() {
    var rows = filteredWds();
    var header = ['申请单号', '代理', '编号', '层级', '科目', '提现金额（元）', '手续费（元）', '到账金额（元）', '收款账户', '通道', '提交时间', '状态'];
    var data = [header].concat(rows.map(function (w) {
      return [w.no, w.agent, w.code, w.level, WD_SUBJECTS[w.subject], fmt(w.amount), fmt(M.fee(w.amount)), fmt(M.net(w.amount)), wdAccount(w), w.channel, w.submitted, (WD_STATUS[w.status] || [])[1] || w.status];
    }));
    downloadCsv('提现记录_' + todayCode() + '.csv', data);
    toast('已导出当前筛选 ' + rows.length + ' 条');
  }

  function downloadCsv(filename, rows) {
    var csv = '\uFEFF' + rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------------------------------------------------------------- 通用空/错/骨架
  function skeletonRows(n) {
    return '<div class="sk-list">' + Array.from({ length: n }).map(function () {
      return '<div class="sk-card"><div class="sk sk-avatar"></div><div class="sk-main"><div class="sk sk-line w60"></div><div class="sk sk-line w40"></div></div></div>';
    }).join('') + '</div>';
  }
  function adminError(text, act) {
    return '<div class="state-box error"><div class="state-ico">!</div><b>' + esc(text) + '</b><p>请检查网络后重试；上一份结果仍可查看。</p>' +
      '<button class="btn-xs" data-act="' + act + '">重试</button></div>';
  }
  function adminEmpty(icon, title, desc, action) {
    return '<div class="state-box"><div class="state-ico">' + icon + '</div><b>' + esc(title) + '</b><p>' + esc(desc) + '</p>' + (action || '') + '</div>';
  }

  // ---------------------------------------------------------------- 动作分发
  function handleAct(el) {
    var act = el.dataset.act;
    if (act === 'modal-close') { closeModal(); return; }
    if (act === 'upload-demo') { el.textContent = '已上传 ✓'; el.classList.add('done'); toast('演示环境已模拟上传'); return; }

    // 代理
    if (act === 'agent-toggle') {
      var id = el.dataset.id;
      var idx = agentState.expanded.indexOf(id);
      if (idx >= 0) agentState.expanded.splice(idx, 1);
      else agentState.expanded.push(id);
      renderAgentTree();
      return;
    }
    if (act === 'agent-tab') { agentState.detailTab = el.dataset.val; renderAgentDetail(); return; }
    if (act === 'agent-clear') {
      agentState.query = ''; agentState.status = 'all';
      $('#agentSearch').value = ''; $('#agentStatusFilter').value = 'all';
      renderAgentTree(); renderAgentDetail(); return;
    }
    if (act === 'agent-add') { openAgentAdd(); return; }
    if (act === 'agent-add-save') { saveAgent(); return; }
    if (act === 'agent-fee') { openAgentFee(el.dataset.id); return; }
    if (act === 'agent-fee-save') { saveAgentFee(el.dataset.id); return; }
    if (act === 'agent-stop') { openAgentStop(el.dataset.id); return; }
    if (act === 'agent-stop-confirm') { confirmAgentStop(el.dataset.id); return; }
    if (act === 'agent-enable') { openAgentEnable(el.dataset.id); return; }
    if (act === 'agent-enable-confirm') { confirmAgentEnable(el.dataset.id); return; }
    if (act === 'agent-relation') { openAgentRelation(el.dataset.id); return; }
    if (act === 'agent-relation-save') { saveAgentRelation(el.dataset.id); return; }
    if (act === 'agent-approve') { approveAgent(el.dataset.id); return; }
    if (act === 'agent-reject') { openAgentReject(el.dataset.id); return; }
    if (act === 'agent-reject-confirm') { confirmAgentReject(el.dataset.id); return; }
    if (act === 'agent-drawer-close') { closeAgentDrawer(); return; }
    if (act === 'agent-retry') {
      agentState.state = 'default';
      $$('.demo-state[data-state-for="p-agents"] button').forEach(function (b) { b.classList.toggle('on', b.dataset.state === 'default'); });
      renderAgents(); return;
    }

    // 提现
    if (act === 'wd-open') { openApproval(el.dataset.no); return; }
    if (act === 'wd-approve') { openApproveConfirm(el.dataset.no); return; }
    if (act === 'wd-approve-confirm') { doApprove(el.dataset.no, el); return; }
    if (act === 'wd-reject') { openReject(el.dataset.no); return; }
    if (act === 'wd-reject-confirm') { doReject(el.dataset.no); return; }
    if (act === 'wd-retry') { openRetry(el.dataset.no); return; }
    if (act === 'wd-retry-confirm') { doRetry(el.dataset.no); return; }
    if (act === 'wd-batch-confirm') { doBatchApprove(el); return; }
    if (act === 'wd-show-all') { wdState.tab = 'all'; wdState.selected = {}; renderWithdrawals(); return; }
    if (act === 'wd-reset') {
      wdState.filters = { agent: '', subject: 'all', range: 'all', amount: 'all', channel: 'all' };
      $('#wdFilterAgent').value = ''; $('#wdFilterSubject').value = 'all'; $('#wdFilterRange').value = 'all';
      $('#wdFilterAmount').value = 'all'; $('#wdFilterChannel').value = 'all';
      renderWithdrawals(); return;
    }
    if (act === 'wd-retry-load') {
      wdState.state = 'default';
      $$('.demo-state[data-state-for="p-withdrawals"] button').forEach(function (b) { b.classList.toggle('on', b.dataset.state === 'default'); });
      renderWithdrawals(); return;
    }
  }

  // ---------------------------------------------------------------- 代理事件绑定
  var agentTree = $('#agentTree');
  if (agentTree) {
    agentTree.addEventListener('click', function (e) {
      if (e.target.closest('[data-act]')) return;
      var row = e.target.closest('.tree-row');
      if (!row) return;
      selectAgent(row.dataset.agentId, true);
    });
    agentTree.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'].indexOf(e.key) < 0) return;
      e.preventDefault();
      var ids = lastTreeRows.map(function (r) { return r.a.id; });
      if (!ids.length) return;
      var i = ids.indexOf(agentState.selected);
      if (e.key === 'ArrowDown') selectAgent(ids[Math.min(ids.length - 1, i + 1)], false);
      if (e.key === 'ArrowUp') selectAgent(ids[Math.max(0, i - 1)], false);
      if (e.key === 'Enter') selectAgent(agentState.selected, true);
      if (e.key === 'ArrowRight') {
        var a = agent(agentState.selected);
        if (a && agentChildren(a).length) {
          if (agentState.expanded.indexOf(a.id) < 0) agentState.expanded.push(a.id);
          renderAgentTree();
        }
      }
      if (e.key === 'ArrowLeft') {
        var cur = agent(agentState.selected);
        if (cur && agentState.expanded.indexOf(cur.id) >= 0) {
          agentState.expanded.splice(agentState.expanded.indexOf(cur.id), 1);
          renderAgentTree();
        } else if (cur && cur.parent) selectAgent(cur.parent, false);
      }
    });
  }

  function selectAgent(id, openDrawer) {
    if (!agent(id)) return;
    agentState.selected = id;
    agentState.detailTab = 'basic';
    renderAgentTree();
    renderAgentDetail();
    if (openDrawer) openAgentDrawer();
    if (agentTree) agentTree.focus({ preventScroll: true });
  }

  var agentSearch = $('#agentSearch');
  if (agentSearch) agentSearch.addEventListener('input', function () {
    agentState.query = agentSearch.value;
    renderAgentTree();
    renderAgentDetail();
  });
  var agentStatusFilter = $('#agentStatusFilter');
  if (agentStatusFilter) agentStatusFilter.addEventListener('change', function () {
    agentState.status = agentStatusFilter.value;
    renderAgentTree();
    renderAgentDetail();
  });
  var agentExpandAll = $('#agentExpandAll');
  if (agentExpandAll) agentExpandAll.addEventListener('click', function () {
    agentState.expanded = AGENTS.map(function (a) { return a.id; });
    renderAgentTree();
  });
  var agentCollapseAll = $('#agentCollapseAll');
  if (agentCollapseAll) agentCollapseAll.addEventListener('click', function () {
    agentState.expanded = ['a1'];
    renderAgentTree();
  });
  var agentAdd = $('#agentAdd');
  if (agentAdd) agentAdd.addEventListener('click', openAgentAdd);
  var agentExport = $('#agentExport');
  if (agentExport) agentExport.addEventListener('click', function () {
    var rows = [['编号', '代理名称', '层级', '上级', '状态', '商户数', '月交易（元）', '报价']];
    AGENTS.forEach(function (a) {
      rows.push([a.code, a.name, 'L' + a.level, a.parent ? agent(a.parent).name : '—', (a.status === 'normal' ? '正常' : a.status === 'pending' ? '审核中' : a.status === 'stopped' ? '已停用' : a.status), a.merchants, fmt(a.monthTx), a.quote.toFixed(2) + '%']);
    });
    downloadCsv('代理列表_' + todayCode() + '.csv', rows);
    toast('已导出代理列表');
  });
  $$('#agentTabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      agentState.tab = btn.dataset.tab;
      $$('#agentTabs button').forEach(function (b) { b.classList.toggle('on', b === btn); });
      renderAgents();
    });
  });
  var agentDrawerMask = $('#agentDrawerMask');
  if (agentDrawerMask) agentDrawerMask.addEventListener('click', closeAgentDrawer);

  // ---------------------------------------------------------------- 提现事件绑定
  $$('#wdTabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      wdState.tab = btn.dataset.status;
      wdState.selected = {};
      renderWithdrawals();
    });
  });
  ['wdFilterAgent', 'wdFilterSubject', 'wdFilterRange', 'wdFilterAmount', 'wdFilterChannel'].forEach(function (id) {
    var el = $('#' + id);
    if (!el) return;
    el.addEventListener('input', function () {
      wdState.filters.agent = $('#wdFilterAgent').value.trim();
      wdState.filters.subject = $('#wdFilterSubject').value;
      wdState.filters.range = $('#wdFilterRange').value;
      wdState.filters.amount = $('#wdFilterAmount').value;
      wdState.filters.channel = $('#wdFilterChannel').value;
      wdState.selected = {};
      renderWdTable();
    });
    el.addEventListener('change', function () {
      wdState.filters.agent = $('#wdFilterAgent').value.trim();
      wdState.filters.subject = $('#wdFilterSubject').value;
      wdState.filters.range = $('#wdFilterRange').value;
      wdState.filters.amount = $('#wdFilterAmount').value;
      wdState.filters.channel = $('#wdFilterChannel').value;
      wdState.selected = {};
      renderWdTable();
    });
  });
  var wdFilterReset = $('#wdFilterReset');
  if (wdFilterReset) wdFilterReset.addEventListener('click', function () {
    wdState.filters = { agent: '', subject: 'all', range: 'all', amount: 'all', channel: 'all' };
    $('#wdFilterAgent').value = ''; $('#wdFilterSubject').value = 'all'; $('#wdFilterRange').value = 'all';
    $('#wdFilterAmount').value = 'all'; $('#wdFilterChannel').value = 'all';
    wdState.selected = {};
    renderWdTable();
  });
  var wdTbody = $('#wdTbody');
  if (wdTbody) wdTbody.addEventListener('change', function (e) {
    var cb = e.target.closest('.wd-check');
    if (!cb) return;
    if (cb.checked) wdState.selected[cb.dataset.no] = true;
    else delete wdState.selected[cb.dataset.no];
    updateBatchBar();
    var tr = cb.closest('tr');
    if (tr) tr.classList.toggle('is-selected', cb.checked);
  });
  var wdCheckAll = $('#wdCheckAll');
  if (wdCheckAll) wdCheckAll.addEventListener('change', function () {
    var rows = filteredWds().filter(function (w) { return w.status === 'pending'; });
    rows.forEach(function (w) {
      if (wdCheckAll.checked) wdState.selected[w.no] = true;
      else delete wdState.selected[w.no];
    });
    renderWdTable();
  });
  var wdBatchCancel = $('#wdBatchCancel');
  if (wdBatchCancel) wdBatchCancel.addEventListener('click', function () {
    wdState.selected = {};
    renderWdTable();
  });
  var wdBatchApprove = $('#wdBatchApprove');
  if (wdBatchApprove) wdBatchApprove.addEventListener('click', openBatchConfirm);
  var wdApprovalToggle = $('#wdApprovalToggle');
  if (wdApprovalToggle) wdApprovalToggle.addEventListener('click', function () {
    wdState.approvalClosed = !wdState.approvalClosed;
    if (wdState.approvalClosed) wdState.selected = {};
    renderWithdrawals();
    toast(wdState.approvalClosed ? '人工审批已关闭，通过按钮禁用' : '人工审批已开启');
  });
  var wdRuleBtn = $('#wdRuleBtn');
  if (wdRuleBtn) wdRuleBtn.addEventListener('click', openFeeRule);
  var wdExport = $('#wdExport');
  if (wdExport) wdExport.addEventListener('click', exportWds);
  var wdMask = $('#adminMask');
  if (wdMask) wdMask.addEventListener('click', function (e) { if (e.target === wdMask) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#adminMask').hidden) closeModal(); });

  // ---------------------------------------------------------------- 演示状态
  document.addEventListener('click', function (e) {
    var stateBtn = e.target.closest('.demo-state [data-state]');
    if (!stateBtn) return;
    var wrap = stateBtn.closest('.demo-state');
    var forId = wrap.dataset.stateFor;
    var val = stateBtn.dataset.state;
    $$('button', wrap).forEach(function (b) { b.classList.toggle('on', b === stateBtn); });
    if (forId === 'p-agents') { agentState.state = val; renderAgents(); }
    if (forId === 'p-withdrawals') { wdState.state = val; renderWithdrawals(); }
  });

  // 初始渲染（页面隐藏时也准备好）
  renderAgents();
  renderWithdrawals();
})();
