/* 代理端原型交互 v0.2
   切屏 / 门店 / 交易 / 码牌 / 提现 / 实名与进件三态
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

  // ---------------------------------------------------------------- 演示数据
  var DEMO = {
    realname: 'pending',
    realnameStopReason: '账号因风控核查未通过，审核已终止。如有疑问请联系服务商客服。',
    realnameTimeline: [
      { t: '2026-11-11 09:42', text: '提交注册资料', note: '邀请码 YQ-8823-KL' }
    ],
    realnameReasons: ['身份证人像面：照片模糊，证件号码无法识别', '结算卡：照片四角不完整，请重新上传'],
    merchants: [
      {
        id: 'm1', name: '味知香卤味店', short: '味', channel: '银盛', mchNo: 'M8832 4471 0912',
        masked: 'M8832****0912', type: '个人小微', category: '餐饮 / 熟食', rate: 0.38,
        status: 'normal', owner: '云启支付 / 王海涛', limit: '单笔 5 万 / 单日 20 万',
        tx30: 8624000, tx30Count: 412, payMix: ['微信 62%', '支付宝 31%', '云闪付 7%'],
        stoppedReason: '', stoppedAt: '',
        channels: [
          { code: 'ys', name: '银盛', onboarding: 'passed', onboardingAt: '11-09 14:22', sign: 'signed', signAt: '11-09 16:05', report: 'processing', reportAt: '预计 11-12' },
          { code: 'lkl', name: '拉卡拉', onboarding: 'passed', onboardingAt: '11-10 10:08', sign: 'pendingSign', signAt: '待商户扫码', report: 'notStarted', reportAt: '签约后自动发起' },
          { code: 'yspay', name: '易生', onboarding: 'rejected', onboardingAt: '11-10 15:30', sign: 'notStarted', signAt: '—', report: 'notStarted', reportAt: '—', rejectTarget: 'onboarding', rejectTitle: '进件被驳回', rejectReason: '门头照与经营类目不一致：照片中的门店招牌无法对应「餐饮 / 熟食」。请重新上传清晰门头照后提交。' }
        ]
      },
      {
        id: 'm2', name: '悦刻便利店', short: '悦', channel: '拉卡拉', mchNo: 'M7712 3388 0912',
        masked: 'M7712****3388', type: '个体工商户', category: '零售 / 便利店', rate: 0.35,
        status: 'normal', owner: '云启支付 / 王海涛', limit: '单笔 5 万 / 单日 20 万',
        tx30: 13290540, tx30Count: 688, payMix: ['微信 58%', '支付宝 30%', '云闪付 12%'],
        stoppedReason: '', stoppedAt: '',
        channels: [
          { code: 'lkl', name: '拉卡拉', onboarding: 'passed', onboardingAt: '10-21 09:12', sign: 'signed', signAt: '10-21 11:40', report: 'passed', reportAt: '10-22 16:20' }
        ]
      },
      {
        id: 'm3', name: '阿强理发工作室', short: '阿', channel: '易生', mchNo: 'E5521 7702 0912',
        masked: 'E5521****7702', type: '个人小微', category: '生活服务 / 美发', rate: 0.38,
        status: 'rejected', owner: '云启支付 / 王海涛', limit: '单笔 5 万 / 单日 20 万',
        tx30: 0, tx30Count: 0, payMix: [],
        stoppedReason: '', stoppedAt: '',
        channels: [
          { code: 'ys', name: '银盛', onboarding: 'rejected', onboardingAt: '11-09 16:10', sign: 'notStarted', signAt: '—', report: 'notStarted', reportAt: '—', rejectTarget: 'onboarding', rejectTitle: '进件被驳回', rejectReason: '结算账户照片不完整：银行卡正面四角缺失，无法核对卡号。请重新上传后提交。' },
          { code: 'yspay', name: '易生', onboarding: 'passed', onboardingAt: '11-08 09:30', sign: 'signed', signAt: '11-08 10:12', report: 'rejected', reportAt: '11-09 14:20', rejectTarget: 'report', rejectTitle: '报备被驳回', rejectReason: '微信报备驳回：经营场所照片不清晰，无法确认实际经营地址。请重新上传门头照后单独重提报备。' }
        ]
      },
      {
        id: 'm4', name: '老张五金建材', short: '老', channel: '银盛', mchNo: 'M8832 4401 0912',
        masked: 'M8832****4401', type: '个体工商户', category: '零售 / 五金建材', rate: 0.30,
        status: 'stopped', owner: '云启支付 / 王海涛', limit: '单笔 5 万 / 单日 20 万',
        tx30: 1286000, tx30Count: 96, payMix: ['微信 70%', '支付宝 30%'],
        stoppedReason: '风控冻结：连续出现同卡多笔大额退款', stoppedAt: '2026-10-28 16:20',
        channels: [
          { code: 'ys', name: '银盛', onboarding: 'passed', onboardingAt: '09-12 10:20', sign: 'signed', signAt: '09-12 14:10', report: 'stopped', reportAt: '10-28 16:20' }
        ]
      }
    ],
    stores: [
      { id: 's1', merchantId: 'm1', name: '味知香卤味店 · 中山西路店', address: '宁波市海曙区中山西路 188 号 1-3', contact: '王海涛', phone: '138****6621', createdAt: '2026-10-12' },
      { id: 's2', merchantId: 'm1', name: '味知香卤味店 · 鼓楼店', address: '宁波市海曙区公园路 26 号', contact: '李娜', phone: '139****2210', createdAt: '2026-10-18' },
      { id: 's3', merchantId: 'm2', name: '悦刻便利店 · 天一店', address: '宁波市海曙区中山东路 168 号', contact: '周敏', phone: '137****8830', createdAt: '2026-10-21' },
      { id: 's4', merchantId: 'm3', name: '阿强理发工作室 · 鄞州店', address: '宁波市鄞州区四明中路 88 号', contact: '赵强', phone: '136****7712', createdAt: '2026-11-08' },
      { id: 's5', merchantId: 'm4', name: '老张五金建材 · 北仑店', address: '宁波市北仑区明州路 21 号', contact: '张建国', phone: '135****9901', createdAt: '2026-09-12' }
    ],
    txs: [
      { id: 'T20261111094201', time: '2026-11-11 09:42', merchantId: 'm1', storeId: 's1', channel: '银盛', pay: '微信', amount: 12800, fee: 49, rate: 0.38, status: '成功', channelNo: 'YS20261111094201001' },
      { id: 'T20261111101502', time: '2026-11-11 10:15', merchantId: 'm2', storeId: 's3', channel: '拉卡拉', pay: '支付宝', amount: 56800, fee: 199, rate: 0.35, status: '成功', channelNo: 'LKL20261111101502002' },
      { id: 'T20261111083303', time: '2026-11-11 08:33', merchantId: 'm1', storeId: 's2', channel: '银盛', pay: '云闪付', amount: 30600, fee: 116, rate: 0.38, status: '成功', channelNo: 'YS20261111083303003' },
      { id: 'T20261110192104', time: '2026-11-10 19:21', merchantId: 'm1', storeId: 's1', channel: '银盛', pay: '微信', amount: 8800, fee: 33, rate: 0.38, status: '退款', channelNo: 'YS20261110192104004' },
      { id: 'T20261110142205', time: '2026-11-10 14:22', merchantId: 'm2', storeId: 's3', channel: '拉卡拉', pay: '刷卡', amount: 120000, fee: 420, rate: 0.35, status: '成功', channelNo: 'LKL20261110142205005' },
      { id: 'T20261109120306', time: '2026-11-09 12:03', merchantId: 'm3', storeId: 's4', channel: '易生', pay: '支付宝', amount: 4600, fee: 17, rate: 0.38, status: '处理中', channelNo: 'YS20261109120306006' },
      { id: 'T20261108181807', time: '2026-11-08 18:18', merchantId: 'm1', storeId: 's1', channel: '银盛', pay: '支付宝', amount: 24600, fee: 93, rate: 0.38, status: '成功', channelNo: 'YS20261108181807007' },
      { id: 'T20261107101008', time: '2026-11-07 10:10', merchantId: 'm2', storeId: 's3', channel: '拉卡拉', pay: '微信', amount: 19900, fee: 70, rate: 0.35, status: '成功', channelNo: 'LKL20261107101008008' },
      { id: 'T20261028151509', time: '2026-10-28 15:15', merchantId: 'm4', storeId: 's5', channel: '银盛', pay: '微信', amount: 6600, fee: 25, rate: 0.38, status: '成功', channelNo: 'YS20261028151509009' },
      { id: 'T20261020103010', time: '2026-10-20 10:30', merchantId: 'm1', storeId: 's2', channel: '银盛', pay: '云闪付', amount: 15800, fee: 60, rate: 0.38, status: '成功', channelNo: 'YS20261020103010010' }
    ],
    qrRecords: [
      { id: 'QR20261109142201', time: '2026-11-09 14:22', merchantId: 'm1', storeId: 's1', template: 'lipai' },
      { id: 'QR20261108103002', time: '2026-11-08 10:30', merchantId: 'm1', storeId: 's2', template: 'zhuotie' },
      { id: 'QR20261107164503', time: '2026-11-07 16:45', merchantId: 'm2', storeId: 's3', template: 'tiezhi' }
    ],
    subjects: [
      { code: 'dailyProfit', name: '日结分润', icon: '日', desc: 'T+1 日终结算', balance: 6218020, enabled: true, badge: '可提现' },
      { code: 'monthlyProfit', name: '月结分润', icon: '月', desc: '按自然月结算', balance: 3890210, enabled: true, badge: '可提现' },
      { code: 'dailyBonus', name: '日结奖励', icon: '奖', desc: '按政策日结', balance: 964000, enabled: true, badge: '可提现' },
      { code: 'monthlyBonus', name: '月结奖励', icon: '奖', desc: '按政策月结', balance: 1230820, enabled: true, badge: '可提现' },
      { code: 'shareBonus', name: '分成奖励', icon: '分', desc: '下级交易分成', balance: 540000, enabled: true, badge: '可提现' },
      { code: 'valueAdded', name: '增值收益', icon: '增', desc: '首版是否纳入待甲方确认', balance: 0, enabled: false, badge: '待确认' }
    ],
    account: {
      type: 'private', bank: '招商银行', cardNo: '6225 **** **** 8899', name: '王海涛',
      company: '', account: '', opening: '', branch: '', phone: ''
    },
    wdRecords: [
      { no: 'WD20261108001', time: '2026-11-08 14:10', amount: 300000, fee: 24300, net: 275700, subject: 'dailyProfit', status: '已到账' },
      { no: 'WD20261110002', time: '2026-11-10 09:20', amount: 120000, fee: 9900, net: 110100, subject: 'monthlyProfit', status: '审批中' },
      { no: 'WD20261106003', time: '2026-11-06 16:40', amount: 80000, fee: 6700, net: 73300, subject: 'shareBonus', status: '打款失败', reason: '收款账户状态异常，通道退回。可重试或联系客服。' },
      { no: 'WD20261104004', time: '2026-11-04 11:05', amount: 200000, fee: 16300, net: 183700, subject: 'dailyBonus', status: '已驳回', reason: '账户与实名信息不一致，请修改结算账户后重新提交。' }
    ]
  };

  var MERCHANT_STATUS = {
    normal: ['ok', '正常'], review: ['warn', '审核中'], rejected: ['danger', '已驳回'],
    stopped: ['line', '已停用'], incomplete: ['warn', '待完善']
  };
  var TX_STATUS = { '成功': ['ok', '成功'], '退款': ['danger', '退款'], '处理中': ['warn', '处理中'] };
  var WD_STATUS = { '审批中': ['warn', '审批中'], '已到账': ['ok', '已到账'], '打款失败': ['danger', '打款失败'], '已驳回': ['danger', '已驳回'], '结果未知': ['warn', '结果未知'] };
  var TRI_LABEL = {
    onboarding: { notStarted: '未开始', processing: '进件中', passed: '已通过', rejected: '已驳回', stopped: '已停用' },
    sign: { notStarted: '未开始', pendingSign: '待商户签约', processing: '签约中', signed: '已签约', failed: '签约失败' },
    report: { notStarted: '未开始', processing: '报备中', passed: '已通过', rejected: '报备失败', stopped: '已停用' }
  };

  var QR_TEMPLATES = {
    lipai: { key: 'lipai', name: '立牌', size: '105 × 148 mm · A6', ratio: '3 / 4', use: '收银台立牌', note: '底部留 10mm 安全区' },
    zhuotie: { key: 'zhuotie', name: '桌贴', size: '90 mm 圆', ratio: '1 / 1', use: '餐桌 / 吧台', note: '圆形裁切线，QR 居中' },
    tiezhi: { key: 'tiezhi', name: '贴纸', size: '70 × 70 mm', ratio: '1 / 1', use: '门贴 / 窗口', note: '最小字号不低于 9pt' }
  };

  // ---------------------------------------------------------------- 运行时状态
  var screens = $$('.mscreen');
  var navbar = $('#navbar');
  var navTitle = $('#navTitle');
  var backBtn = $('#backBtn');
  var tabbar = $('#tabbar');
  var toastEl = $('#toast');
  var sheetMask = $('#sheetMask');
  var sheet = $('#sheet');

  var stack = ['m-splash'];
  var pageState = { 'm-stores': 'default', 'm-tx': 'default', 'm-qr': 'default' };
  var activeMerchantId = 'm1';
  var activeChannel = 'ys';
  var activeMchTab = 'all';
  var mchKeyword = '';
  var storeKeyword = '';
  var storeFilterMerchant = 'all';
  var editingStoreId = null;
  var txFilters = { range: '7d', merchant: 'all', store: 'all', channel: 'all', pay: 'all', status: 'all', keyword: '' };
  var txSelectsReady = false;
  var resubmit = null;           // { merchantId, channel, target }
  var regRejectedMode = false;
  var WD = {
    subject: 'dailyProfit',
    account: DEMO.account,
    unknown: null,
    demoMode: 'normal',
    submitting: false
  };
  var QR = { merchantId: null, storeId: null, template: 'lipai', generating: false };

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  function merchant(id) {
    for (var i = 0; i < DEMO.merchants.length; i++) if (DEMO.merchants[i].id === id) return DEMO.merchants[i];
    return null;
  }
  function subject(code) {
    for (var i = 0; i < DEMO.subjects.length; i++) if (DEMO.subjects[i].code === code) return DEMO.subjects[i];
    return DEMO.subjects[0];
  }
  function storesFor(mid) {
    return DEMO.stores.filter(function (s) { return s.merchantId === mid; });
  }
  function store(id) {
    for (var i = 0; i < DEMO.stores.length; i++) if (DEMO.stores[i].id === id) return DEMO.stores[i];
    return null;
  }
  function chip(kind, text) {
    return '<span class="chip ' + kind + '">' + esc(text) + '</span>';
  }
  function merchantChip(m) {
    var s = MERCHANT_STATUS[m.status] || ['line', m.status];
    return chip(s[0], s[1]);
  }

  // ---------------------------------------------------------------- 抽屉 / 弹窗
  function openSheet(html, opts) {
    opts = opts || {};
    clearTimeout(closeSheet._t);
    sheet.className = 'sheet' + (opts.wide ? ' wide' : '');
    sheet.innerHTML =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head"><h3 id="sheetTitle">' + esc(opts.title || '') + '</h3>' +
      '<button type="button" class="sheet-close" data-act="sheet-close" aria-label="关闭">×</button></div>' +
      '<div class="sheet-body">' + html + '</div>' +
      (opts.footer ? '<div class="sheet-foot">' + opts.footer + '</div>' : '');
    sheetMask.hidden = false;
    requestAnimationFrame(function () { sheetMask.classList.add('show'); });
    var first = sheet.querySelector('input,select,textarea,button');
    if (first && opts.focus !== false) setTimeout(function () { try { first.focus(); } catch (e) {} }, 120);
  }
  function closeSheet() {
    sheetMask.classList.remove('show');
    clearTimeout(closeSheet._t);
    closeSheet._t = setTimeout(function () { sheetMask.hidden = true; sheet.innerHTML = ''; }, 190);
  }

  // ---------------------------------------------------------------- 路由
  function go(id, params) {
    if (!document.getElementById(id)) return;
    params = params || {};

    if (id === 'm-mchdetail' && params.merchant) {
      activeMerchantId = params.merchant;
      activeChannel = null;
    }
    if (id === 'm-qr' && params.merchant) {
      QR.merchantId = params.merchant;
      QR.storeId = params.store || null;
    }
    if (id === 'm-stores' && params.merchant) storeFilterMerchant = params.merchant;
    if (id === 'm-tx' && params.merchant) {
      txFilters.merchant = params.merchant;
      txFilters.store = 'all';
    }
    if (id === 'm-mchnew' && !params.resubmit) clearResubmit();

    var top = stack[stack.length - 1];
    if (params.replaceTop) {
      stack[stack.length - 1] = id;
    } else if (params.replace) {
      stack = [id];
    } else if (top !== id) {
      stack.push(id);
    }
    paint(id);
  }

  function paint(id) {
    var target = document.getElementById(id);
    if (!target) return;
    screens.forEach(function (s) { s.classList.toggle('active', s === target); });
    target.scrollTop = 0;

    var title = target.dataset.title || '';
    var navOn = target.dataset.nav !== 'off';
    navbar.style.display = navOn ? 'flex' : 'none';
    navTitle.textContent = title;
    backBtn.style.visibility = navOn ? 'visible' : 'hidden';

    var tab = target.dataset.tab || '';
    tabbar.style.display = tab ? 'grid' : 'none';
    $$('a', tabbar).forEach(function (a) { a.classList.toggle('on', a.dataset.tab === tab); });

    onEnter(id);
  }

  function back() {
    if (stack.length <= 1) return;
    stack.pop();
    paint(stack[stack.length - 1] || 'm-home');
  }

  function onEnter(id) {
    if (id === 'm-merchants') renderMerchants();
    if (id === 'm-mchdetail') renderMerchantDetail();
    if (id === 'm-mchnew') applyMchNewState();
    if (id === 'm-stores') { initStoreFilter(); renderStores(); }
    if (id === 'm-tx') { initTxSelects(); if (!txSelectsReady) { txSelectsReady = true; syncTxSelects(); } renderTx(); }
    if (id === 'm-qr') { ensureQrSelection(); renderQr(); }
    if (id === 'm-pending') renderPending();
    if (id === 'm-revenue') renderRevenue();
    if (id === 'm-withdraw') renderWithdraw();
    if (id === 'm-register') applyRegState();
  }

  // ---------------------------------------------------------------- 通用状态块
  function skeletonCards(n) {
    var rows = '';
    for (var i = 0; i < (n || 3); i++) {
      rows += '<div class="sk-card"><div class="sk sk-avatar"></div><div class="sk-main">' +
        '<div class="sk sk-line w60"></div><div class="sk sk-line w40"></div></div></div>';
    }
    return '<div class="sk-list">' + rows + '</div>';
  }
  function stateError(text, act) {
    return '<div class="state-box error"><div class="state-ico">!</div><b>' + esc(text) + '</b>' +
      '<p>请检查网络后重试；这是一份演示数据，刷新不会丢失配置。</p>' +
      '<button type="button" class="btn sm ghost" data-act="' + act + '">重试</button></div>';
  }
  function stateEmpty(icon, title, desc, action) {
    return '<div class="state-box"><div class="state-ico">' + icon + '</div><b>' + esc(title) + '</b>' +
      '<p>' + esc(desc) + '</p>' + (action || '') + '</div>';
  }

  // ---------------------------------------------------------------- 商户列表
  function renderMerchants() {
    var list = $('#mchList');
    if (!list) return;
    var counts = { all: DEMO.merchants.length, review: 0, rejected: 0, stopped: 0 };
    DEMO.merchants.forEach(function (m) {
      if (m.status === 'review' || m.status === 'incomplete') counts.review++;
      if (m.status === 'rejected') counts.rejected++;
      if (m.status === 'stopped') counts.stopped++;
    });
    var tabs = $('#mchTabs');
    tabs.querySelector('[data-status="all"]').textContent = '全部 ' + counts.all;
    tabs.querySelector('[data-status="review"]').textContent = '审核中 ' + counts.review;
    tabs.querySelector('[data-status="rejected"]').textContent = '已驳回 ' + counts.rejected;
    tabs.querySelector('[data-status="stopped"]').textContent = '已停用 ' + counts.stopped;

    var kw = mchKeyword.trim().toLowerCase();
    var rows = DEMO.merchants.filter(function (m) {
      if (activeMchTab === 'review' && !(m.status === 'review' || m.status === 'incomplete')) return false;
      if (activeMchTab === 'rejected' && m.status !== 'rejected') return false;
      if (activeMchTab === 'stopped' && m.status !== 'stopped') return false;
      if (!kw) return true;
      return (m.name + ' ' + m.mchNo + ' ' + m.masked).toLowerCase().indexOf(kw) >= 0;
    });

    if (!rows.length) {
      list.innerHTML = kw
        ? stateEmpty('⌕', '没有找到匹配的商户', '换个关键词，或清除筛选条件再试。', '<button type="button" class="btn sm ghost" data-act="mch-clear">清除筛选</button>')
        : stateEmpty('▤', '还没有商户', '新增第一个商户，开始产生交易和收益。', '<button type="button" class="btn sm" data-go="m-mchnew">新增商户</button>');
      return;
    }

    list.innerHTML = rows.map(function (m) {
      var rejected = m.status === 'rejected';
      var rejCh = rejected ? m.channels.filter(function (c) { return c.rejectReason; })[0] : null;
      var extra = '';
      if (rejected && rejCh) {
        extra = '<div class="mch-reject">驳回：' + esc(rejCh.rejectReason) +
          ' <button type="button" class="link-quiet red" data-act="mch-resubmit" data-id="' + m.id + '" data-ch="' + rejCh.code + '">去重提</button></div>';
      } else if (m.status === 'stopped') {
        extra = '<div class="mch-reject gray">停用：' + esc(m.stoppedReason || '风控冻结') + '</div>';
      } else if (m.status === 'review') {
        extra = '<div class="mch-reject gray">通道审核中，预计 1 个工作日</div>';
      }
      return '<div class="mch ' + (m.status === 'stopped' ? 'is-off' : '') + '" data-go="m-mchdetail" data-merchant="' + m.id + '">' +
        '<div class="thumb">' + esc(m.short) + '</div>' +
        '<div class="info"><div class="nm">' + esc(m.name) + ' ' + merchantChip(m) + '</div>' +
        '<div class="sub">' + esc(m.channel) + ' · ' + esc(m.masked) + ' · 费率 ' + m.rate.toFixed(2) + '%</div>' + extra + '</div>' +
        '<span class="arrow">›</span></div>';
    }).join('') +
      '<div class="list-foot">已显示全部 ' + rows.length + ' 条演示数据</div>';
  }

  // ---------------------------------------------------------------- 商户详情
  function triClass(value) {
    if (value === 'passed' || value === 'signed') return 'done';
    if (value === 'processing' || value === 'pendingSign') return 'wait';
    if (value === 'rejected' || value === 'failed' || value === 'stopped') return 'bad';
    return '';
  }
  function triText(kind, value) {
    var label = TRI_LABEL[kind][value] || value;
    if (value === 'passed' || value === 'signed') return '✓ ' + label;
    if (value === 'rejected' || value === 'failed' || value === 'stopped') return '✕ ' + label;
    if (value === 'notStarted') return '— ' + label;
    return '● ' + label;
  }
  function triBlock(label, kind, value, time) {
    return '<div class="step ' + triClass(value) + '"><div class="st">' + label + '</div>' +
      '<div class="sv">' + triText(kind, value) + '</div>' +
      '<div class="stime">' + esc(time || '') + '</div></div>';
  }

  function renderMerchantDetail() {
    var body = $('#mchDetailBody');
    var m = merchant(activeMerchantId) || DEMO.merchants[0];
    if (!m) {
      body.innerHTML = stateEmpty('▤', '没有找到这个商户', '请返回商户列表重新选择。', '<button class="btn sm" data-go="m-merchants">返回列表</button>');
      return;
    }
    activeMerchantId = m.id;
    var ch = null;
    for (var i = 0; i < m.channels.length; i++) if (m.channels[i].code === activeChannel) ch = m.channels[i];
    if (!ch) ch = m.channels[0];
    activeChannel = ch.code;

    var banner = '';
    if (m.status === 'stopped') {
      banner = '<div class="banner gray"><b>商户已停用</b><p>' + esc(m.stoppedReason) + ' · 操作人 ' +
        esc(m.stoppedBy || '王海涛（当前账号）') + ' · ' + esc(m.stoppedAt) +
        '</p><p>存量交易与分润照常结算，不再产生新交易。请联系上级代理申请恢复。</p></div>';
    }
    if (m._resubmitUnknown) {
      banner += '<div class="banner warn"><b>重提结果确认中，请勿重复提交</b><p>通道：' + esc(m._resubmitUnknown.channelName || '—') + ' · 提交时间 ' +
        esc(m._resubmitUnknown.at) + '。通道处理结果可能延迟返回，页面不会显示成功状态。</p>' +
        '<div class="banner-actions"><button type="button" class="btn sm" data-act="mch-resubmit-query">查询进度</button></div></div>';
    }

    var channelTabs = m.channels.length > 1
      ? '<div class="tabs channel-tabs">' + m.channels.map(function (c) {
        return '<button class="' + (c.code === ch.code ? 'on' : '') + '" data-act="mch-channel" data-ch="' + c.code + '">' +
          esc(c.name) + (c.rejectReason ? ' <i class="dot-red"></i>' : '') + '</button>';
      }).join('') + '</div>'
      : '';

    var reject = '';
    if (ch.rejectReason) {
      var targetLabel = ch.rejectTarget === 'onboarding' ? '进件' : '报备';
      reject = '<div class="banner danger"><b>' + esc(ch.rejectTitle || (targetLabel + '被驳回')) + '</b>' +
        '<p>' + esc(ch.rejectReason) + '</p>' +
        '<p class="banner-note">仅重提被驳回的通道，不影响其他通道。</p>' +
        '<button type="button" class="btn sm danger-solid" data-act="mch-resubmit" data-id="' + m.id + '" data-ch="' + ch.code + '">重新提交' + targetLabel + '</button></div>';
    }

    var actions = '';
    if (m.status === 'stopped') {
      actions = '<div class="action-row"><button class="btn ghost" data-locked="演示环境请联系上级代理">联系上级</button></div>';
    } else if (m.status === 'rejected') {
      var rc = m.channels.filter(function (c) { return c.rejectReason; })[0] || ch;
      actions = '<div class="action-row"><button class="btn" data-act="mch-resubmit" data-id="' + m.id + '" data-ch="' + rc.code + '">重新提交资料</button>' +
        '<button class="btn ghost" data-locked="演示环境请联系上级代理">联系上级</button></div>';
    } else {
      actions = '<div class="action-row"><button class="btn ghost" data-act="mch-qr" data-id="' + m.id + '">查看收款码</button>' +
        '<button class="btn line danger-text" data-act="mch-stop" data-id="' + m.id + '">停用商户</button></div>';
    }

    var logs = (m.logs && m.logs.length)
      ? '<div class="sec-title"><h3>操作记录</h3><span>最近 5 条</span></div>' +
        '<div class="card card-pad"><div class="timeline">' +
        m.logs.slice(-5).map(function (r) {
          return '<div class="tl-item done"><span class="tl-dot"></span><div><div class="tl-t">' + esc(r.text) +
            '</div><div class="tl-d">' + esc(r.t) + ' · ' + esc(r.by || '王海涛（当前账号）') + '</div></div></div>';
        }).join('') + '</div></div>'
      : '';

    body.innerHTML = banner +
      '<div class="card card-pad">' +
      '<div class="detail-head"><div class="thumb big">' + esc(m.short) + '</div>' +
      '<div><div class="detail-name">' + esc(m.name) + '</div><div class="detail-sub">' + esc(m.channel) + ' · ' + esc(m.masked) + '</div></div>' +
      merchantChip(m) + '</div>' +
      '<div class="chip-row"><span class="chip line">' + esc(m.type) + '</span><span class="chip line">' + esc(m.category) +
      '</span><span class="chip line">费率 ' + m.rate.toFixed(2) + '%</span></div></div>' +

      channelTabs +
      '<div class="sec-title"><h3>三态看板</h3><span>以通道回调为准，可能不同步</span></div>' +
      '<div class="tri">' + triBlock('进件', 'onboarding', ch.onboarding, ch.onboardingAt) +
      triBlock('签约', 'sign', ch.sign, ch.signAt) + triBlock('报备', 'report', ch.report, ch.reportAt) + '</div>' +
      reject +

      '<div class="sec-title"><h3>关键信息</h3></div>' +
      '<div class="card card-pad">' +
      '<div class="subj"><div><div class="sn">商户号</div></div><div class="sv mono">' + esc(m.mchNo) + '</div></div>' +
      '<div class="subj"><div><div class="sn">结算账户</div></div><div class="sv">招商银行 **** 6621</div></div>' +
      '<div class="subj"><div><div class="sn">归属代理</div></div><div class="sv">' + esc(m.owner) + '</div></div>' +
      '<button type="button" class="subj subj-btn" data-act="mch-stores" data-id="' + m.id + '"><div><div class="sn">门店数</div></div>' +
      '<div class="sv">' + storesFor(m.id).length + ' 家 <span class="chev">›</span></div></button>' +
      '<div class="subj"><div><div class="sn">费率 / 限额</div></div><div class="sv">' + m.rate.toFixed(2) + '% · ' + esc(m.limit) + '</div></div>' +
      '</div>' +

      '<div class="sec-title"><h3>近 30 天交易</h3><button class="more link-quiet" data-act="mch-tx" data-id="' + m.id + '">全部 ›</button></div>' +
      '<div class="card card-pad"><div class="tx-sum"><div><div class="tx-sum-k">交易金额</div>' +
      '<div class="tx-sum-v">' + fmt(m.tx30) + '<small> 元</small></div></div>' +
      '<div class="tx-sum-r"><div class="tx-sum-k">笔数</div><div class="tx-sum-c">' + m.tx30Count + '</div></div></div>' +
      '<div class="chip-row" style="margin-top:12px">' + (m.payMix.length ? m.payMix.map(function (p) { return '<span class="chip">' + esc(p) + '</span>'; }).join('') : '<span class="chip line">近 30 天无交易</span>') + '</div></div>' +
      logs +
      actions;
  }

  function setMchFormLock(allowFields) {
    var locked = !!allowFields;
    $$('#m-mchnew input').forEach(function (el) {
      var field = el.dataset.mchField;
      var lock = locked && (!field || allowFields.indexOf(field) < 0);
      el.disabled = lock;
      var wrap = el.closest('.field');
      if (wrap) wrap.classList.toggle('is-locked', lock);
    });
    $$('#m-mchnew button.upload').forEach(function (el) {
      var field = el.dataset.mchField;
      var lock = locked && (!field || allowFields.indexOf(field) < 0);
      el.disabled = lock;
      el.classList.toggle('is-locked', lock);
    });
    $$('#m-mchnew .ch-card[data-ch]').forEach(function (el) {
      el.classList.toggle('is-locked', locked && el.dataset.ch !== resubmit.channel);
    });
  }

  function applyMchNewState() {
    var banner = $('#mchnewBanner');
    var nameInput = $('input[name="mchName"]');
    var shopChip = $('#shopPhotoReject');
    var demoWrap = $('#mchDemoWrap');
    if (resubmit) {
      var m = merchant(resubmit.merchantId);
      var ch = m && m.channels.filter(function (c) { return c.code === resubmit.channel; })[0];
      banner.hidden = false;
      banner.innerHTML = '<b>' + esc(ch ? (ch.rejectTitle || '资料被驳回') : '资料被驳回') + '</b>' +
        '<p>' + esc(ch ? ch.rejectReason : '') + '</p>' +
        '<p class="banner-note">已预填原资料，仅被驳回项可修改；重提通道：' + esc(ch ? ch.name : '—') +
        ' · ' + (resubmit.target === 'onboarding' ? '进件' : '报备') + '。</p>';
      if (nameInput && m) nameInput.value = m.name;
      if (shopChip) shopChip.hidden = false;
      $$('#mchChannelList .ch-card').forEach(function (c) {
        c.classList.toggle('on', c.dataset.ch === resubmit.channel);
      });
      setMchFormLock(resubmit.target === 'onboarding' ? ['shopPhoto'] : ['address', 'shopPhoto']);
      if (demoWrap) demoWrap.hidden = false;
      var demoSelect = $('#mchDemoMode');
      if (demoSelect) demoSelect.value = 'normal';
      $('#submitMch').textContent = '重新提交' + (resubmit.target === 'onboarding' ? '进件' : '报备');
    } else {
      banner.hidden = true;
      banner.innerHTML = '';
      if (shopChip) shopChip.hidden = true;
      setMchFormLock(null);
      if (demoWrap) demoWrap.hidden = true;
      $('#submitMch').textContent = '提交进件';
    }
  }

  function clearResubmit() {
    resubmit = null;
    var banner = $('#mchnewBanner');
    if (banner) { banner.hidden = true; banner.innerHTML = ''; }
    var chipEl = $('#shopPhotoReject');
    if (chipEl) chipEl.hidden = true;
    var demoWrap = $('#mchDemoWrap');
    if (demoWrap) demoWrap.hidden = true;
    setMchFormLock(null);
    var btn = $('#submitMch');
    if (btn) btn.textContent = '提交进件';
  }

  // ---------------------------------------------------------------- 实名 / 审核
  function applyRegState() {
    var banner = $('#regBanner');
    var reasons = $('#regReasons');
    if (regRejectedMode) {
      banner.hidden = false;
      reasons.innerHTML = DEMO.realnameReasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
      $$('#regForm [data-lock]').forEach(function (input) { input.disabled = true; });
      $('#idPhotoReject').hidden = false;
      $('#cardPhotoReject').hidden = false;
      $('#regSubmit').textContent = '重新提交资料';
      $('#regHint').textContent = '仅被驳回项可修改，其余字段已锁定';
      $$('#regForm [data-rejected-field]').forEach(function (f) { f.classList.add('rejected'); });
    } else {
      banner.hidden = true;
      $$('#regForm [data-lock]').forEach(function (input) { input.disabled = false; });
      $('#idPhotoReject').hidden = true;
      $('#cardPhotoReject').hidden = true;
      $('#regSubmit').textContent = '提交审核';
      $('#regHint').textContent = '提交后进入实名审核，预计 1 个工作日';
      $$('#regForm [data-rejected-field]').forEach(function (f) { f.classList.remove('rejected'); });
    }
  }

  function renderPending() {
    var body = $('#pendingBody');
    var state = DEMO.realname;
    var demo = '<div class="demo-state demo-state-center"><span>演示状态</span>' +
      '<button data-act="pending-state" data-val="pending" class="' + (state === 'pending' ? 'on' : '') + '">审核中</button>' +
      '<button data-act="pending-state" data-val="approved" class="' + (state === 'approved' ? 'on' : '') + '">已通过</button>' +
      '<button data-act="pending-state" data-val="rejected" class="' + (state === 'rejected' ? 'on' : '') + '">已驳回</button>' +
      '<button data-act="pending-state" data-val="stopped" class="' + (state === 'stopped' ? 'on' : '') + '">已停用</button></div>';

    if (state === 'stopped') {
      body.innerHTML = '<div class="pending-state"><div class="state-circle gray">⛔</div>' +
        '<h3>审核已终止</h3><p>该账号未通过风控核查，无法继续使用代理业务功能。</p></div>' +
        '<div class="banner gray"><b>终止原因</b><p>' + esc(DEMO.realnameStopReason) + '</p></div>' +
        '<button class="btn ghost" data-locked="演示环境请联系客服">联系客服</button>' + demo;
      return;
    }
    if (state === 'approved') {
      body.innerHTML = '<div class="pending-state approved"><div class="state-circle green">✓</div>' +
        '<h3>审核已通过</h3><p>实名资料已通过服务商审核，全部业务功能已解锁。正在进入首页…</p>' +
        '<button class="btn" data-go="m-home">立即进入首页</button>' + demo + '</div>';
      return;
    }
    if (state === 'rejected') {
      body.innerHTML = '<div class="pending-state"><div class="state-circle red">✕</div>' +
        '<h3>资料未通过审核</h3><p>请按下列原因修改被驳回项后重新提交。</p></div>' +
        '<div class="banner danger"><b>驳回原因</b><ul>' +
        DEMO.realnameReasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
        '</ul></div>' +
        '<button class="btn" data-act="pending-resubmit">重新提交资料</button>' +
        '<button class="btn ghost" style="margin-top:10px" data-locked="演示环境请联系客服">联系客服</button>' + demo;
      return;
    }
    var timeline = DEMO.realnameTimeline.map(function (r) {
      return '<div class="tl-item done"><span class="tl-dot"></span><div><div class="tl-t">' + esc(r.text) +
        '</div><div class="tl-d">' + esc(r.t) + ' · ' + esc(r.note || '') + '</div></div></div>';
    }).join('');
    body.innerHTML = '<div class="pending-state"><div class="state-circle amber">⏳</div>' +
      '<h3>资料已提交，等待审核</h3><p>预计 1 个工作日内完成。审核期间仅可查看进度，不可使用业务功能。</p></div>' +
      '<div class="card card-pad" style="margin-top:22px;text-align:left"><div class="timeline">' +
      timeline +
      '<div class="tl-item now"><span class="tl-dot"></span><div><div class="tl-t">服务商实名审核</div><div class="tl-d">审核中 · 预计 11-12 前完成</div></div></div>' +
      '<div class="tl-item"><span class="tl-dot"></span><div><div class="tl-t">解锁全部功能</div><div class="tl-d">审核通过后自动生效</div></div></div>' +
      '</div></div>' +
      '<button class="btn ghost" style="margin-top:18px" data-act="pending-refresh">刷新状态</button>' +
      '<button class="btn" style="margin-top:10px" data-act="pending-approve">模拟审核通过（演示）</button>' +
      '<p class="tiny-center">演示用：真实环境需后台运营审核</p>' + demo;
  }

  // ---------------------------------------------------------------- 门店
  function initStoreFilter() {
    var sel = $('#storeMerchantFilter');
    if (!sel) return;
    if (!sel.dataset.ready) {
      sel.innerHTML = '<option value="all">全部商户</option>' + DEMO.merchants.map(function (m) {
        return '<option value="' + m.id + '">' + esc(m.name) + '</option>';
      }).join('');
      sel.dataset.ready = '1';
      sel.addEventListener('change', function () {
        storeFilterMerchant = sel.value;
        renderStores();
      });
    }
    sel.value = storeFilterMerchant;
  }

  function renderStores() {
    var list = $('#storeList');
    var state = pageState['m-stores'];
    if (state === 'loading') { list.innerHTML = skeletonCards(4); return; }
    if (state === 'error') { list.innerHTML = stateError('门店列表加载失败', 'store-retry'); return; }
    if (state === 'empty') {
      list.innerHTML = stateEmpty('▤', '还没有门店', '新增第一家门店后，就能为它生成收款码牌。', '<button class="btn sm" data-act="store-add">新增门店</button>');
      return;
    }
    var kw = storeKeyword.trim().toLowerCase();
    var rows = DEMO.stores.filter(function (s) {
      if (storeFilterMerchant !== 'all' && s.merchantId !== storeFilterMerchant) return false;
      if (!kw) return true;
      return (s.name + ' ' + s.address + ' ' + s.contact).toLowerCase().indexOf(kw) >= 0;
    });
    if (!rows.length) {
      list.innerHTML = stateEmpty('⌕', '没有找到匹配的门店', '换个关键词，或清除筛选条件再试。', '<button class="btn sm ghost" data-act="store-clear">清除筛选</button>');
      return;
    }
    list.innerHTML = rows.map(function (s) {
      var m = merchant(s.merchantId);
      var blocked = m && m.status !== 'normal';
      return '<div class="store-card"><div class="store-top"><div class="thumb">' + esc(s.name.slice(0, 1)) + '</div>' +
        '<div class="store-main"><div class="store-name">' + esc(s.name) + '</div>' +
        '<div class="store-sub">' + esc(m ? m.name : '') + ' · ' + esc(s.createdAt) + '</div></div>' +
        (m ? merchantChip(m) : '') + '</div>' +
        '<div class="store-addr">📍 ' + esc(s.address) + '</div>' +
        '<div class="store-sub">联系人 ' + esc(s.contact) + ' · ' + esc(s.phone) + '</div>' +
        '<div class="store-actions"><button class="link-quiet" data-act="store-edit" data-id="' + s.id + '">编辑</button>' +
        '<button class="link-quiet green" data-act="store-goto-qr" data-id="' + s.id + '" ' + (blocked ? 'data-locked="该商户当前不可生成码牌"' : '') + '>去出码 ›</button></div></div>';
    }).join('') + '<div class="list-foot">已显示全部 ' + rows.length + ' 家门店</div>';
  }

  function openStoreSheet(id) {
    var s = id ? store(id) : null;
    editingStoreId = id || null;
    var merchantOptions = DEMO.merchants.map(function (m) {
      return '<option value="' + m.id + '" ' + (s && s.merchantId === m.id ? 'selected' : '') + '>' + esc(m.name) + '</option>';
    }).join('');
    openSheet(
      '<div class="form-grid">' +
      '<div class="field"><label>所属商户 <span class="req">*</span></label><select class="select" id="stMerchant">' + merchantOptions + '</select></div>' +
      '<div class="field"><label>门店名称 <span class="req">*</span></label><input class="input" id="stName" value="' + esc(s ? s.name : '') + '" placeholder="如：味知香卤味店 · 中山西路店" /></div>' +
      '<div class="field"><label>门店地址 <span class="req">*</span></label><input class="input" id="stAddress" value="' + esc(s ? s.address : '') + '" placeholder="省市区 + 详细地址" /></div>' +
      '<div class="row-2"><div class="field"><label>联系人 <span class="req">*</span></label><input class="input" id="stContact" value="' + esc(s ? s.contact : '') + '" /></div>' +
      '<div class="field"><label>联系电话 <span class="req">*</span></label><input class="input" id="stPhone" inputmode="tel" value="' + esc(s ? s.phone : '') + '" placeholder="11 位手机号" /></div></div>' +
      '<div class="field"><label>门头照 <span class="req">*</span></label><button type="button" class="upload compact" data-act="upload-demo">上传门头照</button><p class="field-hint">演示环境不上传真实图片，仅校验必填。</p></div>' +
      '<p class="field-err" id="stErr"></p></div>',
      {
        title: s ? '编辑门店' : '新增门店',
        footer: '<button class="btn ghost" data-act="sheet-close">取消</button><button class="btn" data-act="store-save">' + (s ? '保存门店' : '新增门店') + '</button>'
      }
    );
  }

  function saveStore() {
    var name = $('#stName').value.trim();
    var address = $('#stAddress').value.trim();
    var contact = $('#stContact').value.trim();
    var phone = $('#stPhone').value.replace(/\s/g, '');
    var merchantId = $('#stMerchant').value;
    var err = $('#stErr');
    if (!name) return (err.textContent = '请填写门店名称。');
    if (!address) return (err.textContent = '请填写门店地址，便于用户找到门店。');
    if (!contact) return (err.textContent = '请填写门店联系人。');
    if (!/^1\d{10}$/.test(phone)) return (err.textContent = '请输入 11 位手机号，作为门店联系电话。');
    if (editingStoreId) {
      var s = store(editingStoreId);
      s.name = name; s.address = address; s.contact = contact; s.phone = phone; s.merchantId = merchantId;
      toast('门店已保存');
    } else {
      DEMO.stores.unshift({
        id: 's' + Date.now(), merchantId: merchantId, name: name, address: address,
        contact: contact, phone: phone, createdAt: nowText().slice(0, 10)
      });
      toast('门店已新增，可为它生成码牌');
    }
    closeSheet();
    renderStores();
  }

  // ---------------------------------------------------------------- 交易
  function initTxSelects() {
    var msel = $('#txMerchant');
    if (!msel.dataset.ready) {
      msel.innerHTML = '<option value="all">全部商户</option>' + DEMO.merchants.map(function (m) {
        return '<option value="' + m.id + '">' + esc(m.name) + '</option>';
      }).join('');
      msel.dataset.ready = '1';
    }
    rebuildTxStores();
    msel.value = txFilters.merchant;
    $('#txStore').value = txFilters.store;
  }
  function rebuildTxStores() {
    var msel = $('#txMerchant');
    var ssel = $('#txStore');
    var mid = msel.value;
    var rows = DEMO.stores.filter(function (s) { return mid === 'all' || s.merchantId === mid; });
    var current = ssel.value;
    ssel.innerHTML = '<option value="all">全部门店</option>' + rows.map(function (s) {
      return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
    }).join('');
    if (rows.some(function (s) { return s.id === current; })) ssel.value = current;
  }
  function syncTxSelects() {
    $('#txRange').value = txFilters.range;
    $('#txMerchant').value = txFilters.merchant;
    rebuildTxStores();
    $('#txStore').value = txFilters.store;
    $('#txChannel').value = txFilters.channel;
    $('#txPay').value = txFilters.pay;
    $('#txStatus').value = txFilters.status;
    $('#txKeyword').value = txFilters.keyword;
  }
  function readTxFilters() {
    txFilters.range = $('#txRange').value;
    txFilters.merchant = $('#txMerchant').value;
    txFilters.store = $('#txStore').value;
    txFilters.channel = $('#txChannel').value;
    txFilters.pay = $('#txPay').value;
    txFilters.status = $('#txStatus').value;
    txFilters.keyword = $('#txKeyword').value.trim();
  }
  function txRangeStart() {
    if (txFilters.range === 'today') return '2026-11-11';
    if (txFilters.range === '30d') return '2026-10-12';
    return '2026-11-05';
  }
  function filteredTx() {
    var from = txRangeStart();
    var kw = txFilters.keyword.toLowerCase();
    return DEMO.txs.filter(function (t) {
      if (t.time.slice(0, 10) < from) return false;
      if (txFilters.merchant !== 'all' && t.merchantId !== txFilters.merchant) return false;
      if (txFilters.store !== 'all' && t.storeId !== txFilters.store) return false;
      if (txFilters.channel !== 'all' && t.channel !== txFilters.channel) return false;
      if (txFilters.pay !== 'all' && t.pay !== txFilters.pay) return false;
      if (txFilters.status !== 'all' && t.status !== txFilters.status) return false;
      if (!kw) return true;
      var m = merchant(t.merchantId);
      return (t.id + ' ' + t.channelNo + ' ' + (m ? m.mchNo : '')).toLowerCase().indexOf(kw) >= 0;
    });
  }
  function renderTx() {
    var list = $('#txList');
    var summary = $('#txSummary');
    var state = pageState['m-tx'];
    if (state === 'loading') {
      summary.innerHTML = '<div class="sk sk-line w50"></div>';
      list.innerHTML = skeletonCards(4);
      return;
    }
    if (state === 'error') {
      summary.innerHTML = '';
      list.innerHTML = stateError('交易流水加载失败', 'tx-retry');
      return;
    }
    if (state === 'empty') {
      summary.innerHTML = '<span>共 0 笔</span><b>合计 ¥0.00</b>';
      list.innerHTML = stateEmpty('▤', '当前范围没有交易', '切换日期或清除筛选条件，再试一次。', '<button class="btn sm ghost" data-act="tx-clear">清除筛选</button>');
      return;
    }
    var rows = filteredTx();
    var total = rows.reduce(function (sum, t) { return sum + t.amount; }, 0);
    summary.innerHTML = '<span>共 ' + rows.length + ' 笔</span><b>合计 ' + yuan(total) + '</b>';
    if (!rows.length) {
      list.innerHTML = stateEmpty('⌕', '没有找到匹配的交易', '换个关键词，或清除筛选条件再试。', '<button class="btn sm ghost" data-act="tx-clear">清除筛选</button>');
      return;
    }
    list.innerHTML = rows.map(function (t) {
      var m = merchant(t.merchantId);
      var s = store(t.storeId);
      var st = TX_STATUS[t.status] || ['line', t.status];
      return '<button type="button" class="tx-row" data-act="tx-open" data-id="' + t.id + '">' +
        '<div class="tx-row-top"><span class="tx-time">' + esc(t.time.slice(5, 16)) + '</span>' +
        chip(st[0], st[1]) + '<span class="tx-amt">' + yuan(t.amount) + '</span></div>' +
        '<div class="tx-row-sub">' + esc(m ? m.name : '') + ' · ' + esc(s ? s.name : '—') + '</div>' +
        '<div class="tx-row-sub">' + esc(t.channel) + ' · ' + esc(t.pay) + ' · 手续费 ' + yuan(t.fee) + '</div>' +
        '</button>';
    }).join('');
  }

  function openTxDetail(id) {
    var t = null;
    DEMO.txs.forEach(function (x) { if (x.id === id) t = x; });
    if (!t) return;
    var m = merchant(t.merchantId);
    var s = store(t.storeId);
    var st = TX_STATUS[t.status] || ['line', t.status];
    var profit = [
      { name: '王海涛', level: 'L2', rate: '0.10%', cents: Math.round(t.amount * 0.001) },
      { name: '云启支付', level: 'L1', rate: '0.08%', cents: Math.round(t.amount * 0.0008) }
    ];
    openSheet(
      '<div class="detail-status">' + chip(st[0], st[1]) + '<span class="mono">' + esc(t.id) + '</span></div>' +
      '<div class="kv-list">' +
      kv('订单号', t.id, true) + kv('通道流水号', t.channelNo, true) +
      kv('交易金额', yuan(t.amount)) + kv('商户费率', t.rate.toFixed(2) + '%') +
      kv('手续费', yuan(t.fee)) + kv('交易时间', t.time) +
      kv('商户 / 门店', (m ? m.name : '') + ' · ' + (s ? s.name : '—')) +
      kv('通道 / 支付方式', t.channel + ' · ' + t.pay) +
      '</div>' +
      '<div class="sec-title" style="margin-top:18px"><h3>分润明细</h3><span>演示数据</span></div>' +
      '<div class="profit-list">' + profit.map(function (p) {
        return '<div class="profit-row"><div><b>' + esc(p.name) + '</b><span class="chip line">' + p.level + '</span><div class="store-sub">分成比例 ' + p.rate + '</div></div>' +
          '<b class="mono">' + yuan(p.cents) + '</b></div>';
      }).join('') + '</div>' +
      '<p class="field-hint" style="margin-top:12px">分润金额为演示数据，实际以后台分润引擎计算结果为准。</p>',
      { title: '交易详情', wide: true }
    );
  }
  function kv(label, value, copy) {
    return '<div class="kv"><span>' + esc(label) + '</span><b class="mono">' + esc(value) + '</b>' +
      (copy ? '<button type="button" class="copy" data-act="copy" data-val="' + esc(value) + '">复制</button>' : '') + '</div>';
  }
  function copyText(text) {
    var done = function () { toast('已复制'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // ---------------------------------------------------------------- 码牌
  function ensureQrSelection() {
    if (QR.merchantId) {
      if (!merchant(QR.merchantId)) QR.merchantId = null;
      return;
    }
    var first = null;
    DEMO.merchants.forEach(function (m) { if (!first && m.status === 'normal') first = m; });
    if (first) {
      QR.merchantId = first.id;
      var s = storesFor(first.id)[0];
      QR.storeId = s ? s.id : null;
    }
  }
  function qrSvg(seedText) {
    var size = 25;
    var seed = 0;
    for (var i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
    var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var grid = [];
    for (var y = 0; y < size; y++) {
      grid[y] = [];
      for (var x = 0; x < size; x++) grid[y][x] = rnd() > 0.52;
    }
    var finder = function (ox, oy) {
      for (var yy = -1; yy <= 7; yy++) {
        for (var xx = -1; xx <= 7; xx++) {
          var x2 = ox + xx, y2 = oy + yy;
          if (x2 < 0 || y2 < 0 || x2 >= size || y2 >= size) continue;
          var border = xx === -1 || xx === 7 || yy === -1 || yy === 7;
          var outer = xx >= 0 && xx <= 6 && yy >= 0 && yy <= 6;
          var middle = xx >= 1 && xx <= 5 && yy >= 1 && yy <= 5;
          var core = xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4;
          grid[y2][x2] = !border && outer && (!middle || core);
        }
      }
    };
    finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
    var quiet = 4;
    var rects = '';
    for (var yy = 0; yy < size; yy++) {
      for (var xx = 0; xx < size; xx++) {
        if (grid[yy][xx]) rects += '<rect x="' + (xx + quiet) + '" y="' + (yy + quiet) + '" width="1" height="1"/>';
      }
    }
    return '<svg viewBox="0 0 ' + (size + quiet * 2) + ' ' + (size + quiet * 2) + '" role="img" aria-label="演示二维码">' +
      '<rect width="' + (size + quiet * 2) + '" height="' + (size + quiet * 2) + '" fill="#fff"/>' +
      '<g fill="#111827">' + rects + '</g></svg>';
  }

  function qrMerchant() { return merchant(QR.merchantId); }
  function qrStore() { return store(QR.storeId); }
  function qrBlockedReason() {
    var m = qrMerchant();
    if (!m) return '请先选择商户';
    if (m.status === 'stopped') return '该商户已停用，不能生成码牌';
    if (m.status === 'rejected') return '该商户尚未完成进件/报备，暂不能生成码牌';
    if (!qrStore()) return '请选择门店后再生成码牌';
    return '';
  }

  function renderQr() {
    var state = pageState['m-qr'];
    var box = $('#qrStateBox');
    var body = $('#qrBody');
    if (!box || !body) return;
    if (state === 'loading') {
      box.innerHTML = skeletonCards(3);
      body.hidden = true;
      return;
    }
    if (state === 'error') {
      box.innerHTML = stateError('码牌数据加载失败', 'qr-retry');
      body.hidden = true;
      return;
    }
    if (state === 'empty') {
      box.innerHTML = stateEmpty('▣', '还没有可出码的商户', '先新增商户并完成进件，才能生成收款码牌。', '<button class="btn sm" data-go="m-mchnew">去新增商户</button>');
      body.hidden = true;
      return;
    }
    box.innerHTML = '';
    body.hidden = false;

    var m = qrMerchant();
    var s = qrStore();
    var tpl = QR_TEMPLATES[QR.template] || QR_TEMPLATES.lipai;
    var blocked = qrBlockedReason();

    $('#qrMerchantCard').innerHTML = '<div class="pick-row">' +
      '<div class="thumb">' + esc(m ? m.short : '?') + '</div>' +
      '<div class="pick-main"><div class="pick-name">' + (m ? esc(m.name) : '未选择商户') + ' ' + (m ? merchantChip(m) : '') + '</div>' +
      '<div class="pick-sub">' + (m ? esc(m.channel) + ' · ' + esc(m.masked) + ' · ' + storesFor(m.id).length + ' 家门店' : '请选择正常状态的商户') + '</div></div>' +
      '<button type="button" class="btn sm ghost" data-act="qr-pick-merchant">切换</button></div>';

    $('#qrStoreCard').innerHTML = '<div class="pick-row">' +
      '<div class="thumb small">📍</div>' +
      '<div class="pick-main"><div class="pick-name">' + (s ? esc(s.name) : '未选择门店') + '</div>' +
      '<div class="pick-sub">' + (s ? esc(s.address) : '生成码牌前必须选择门店') + '</div></div>' +
      '<button type="button" class="btn sm ghost" data-act="qr-pick-store">' + (s ? '切换' : '选择门店') + '</button></div>' +
      (blocked ? '<p class="qr-block">' + esc(blocked) + (blocked.indexOf('尚未') >= 0 || blocked.indexOf('已停用') >= 0 ? ' <button class="link-quiet" data-go="m-mchdetail" data-merchant="' + QR.merchantId + '">去商户详情</button>' : '') + '</p>' : '');

    $('#qrTemplates').innerHTML = Object.keys(QR_TEMPLATES).map(function (key) {
      var t = QR_TEMPLATES[key];
      return '<button type="button" class="qr-tpl ' + (key === QR.template ? 'on' : '') + '" data-act="qr-template" data-val="' + key + '">' +
        '<span class="qr-tpl-thumb ' + key + '"><i></i></span>' +
        '<b>' + t.name + '</b><small>' + t.size + '</small>' +
        (key === QR.template ? '<span class="tick">✓</span>' : '') + '</button>';
    }).join('');

    $('#qrPreviewMeta').textContent = tpl.name + ' · ' + tpl.size;
    var preview = $('#qrPreview');
    preview.style.aspectRatio = tpl.ratio;
    preview.innerHTML = '<div class="qr-card-inner ' + tpl.key + '">' +
      '<div class="qr-preview-name">' + esc(m ? m.name : '请选择商户') + '</div>' +
      '<div class="qr-preview-store">' + esc(s ? s.name : '请选择门店') + '</div>' +
      '<div class="qr-preview-code">' + qrSvg((m ? m.id : 'none') + (s ? s.id : 'none') + tpl.key) +
      '<span class="demo-mark">演示码</span></div>' +
      '<div class="qr-preview-pay">微信 · 支付宝 · 云闪付</div>' +
      '<div class="qr-preview-foot">聚合支付 · 扫码付款</div></div>';

    var steps = $$('#qrSteps .step');
    steps[0].className = 'step ' + (m ? 'done' : 'on');
    steps[1].className = 'step ' + (m && s && QR.template ? 'done' : (m ? 'on' : ''));
    steps[2].className = 'step ' + (!blocked ? 'on' : '');

    var recent = DEMO.qrRecords.slice(0, 3);
    $('#qrRecords').innerHTML = recent.length ? recent.map(function (r) {
      var mm = merchant(r.merchantId);
      var ss = store(r.storeId);
      var tt = QR_TEMPLATES[r.template] || QR_TEMPLATES.lipai;
      return '<div class="record-row"><div><div class="record-title">' + esc(mm ? mm.name : '—') + ' · ' + tt.name + '</div>' +
        '<div class="store-sub">' + esc(ss ? ss.name : '') + ' · ' + esc(r.time) + '</div></div>' +
        '<button class="link-quiet green" data-act="qr-again" data-id="' + r.id + '">再次生成</button></div>';
    }).join('') : stateEmpty('▣', '还没有生成记录', '生成第一张码牌后，可在这里再次下载。', '');
  }

  function openQrMerchantPicker() {
    var rows = DEMO.merchants.map(function (m) {
      var disabled = m.status !== 'normal';
      var reason = m.status === 'stopped' ? '已停用商户不能生成码牌' : '未完成进件/报备，暂不能生成';
      return '<button type="button" class="pick-item ' + (disabled ? 'is-off' : '') + '" ' +
        (disabled ? 'data-locked="' + reason + '"' : 'data-act="qr-choose-merchant" data-id="' + m.id + '"') + '>' +
        '<div class="thumb">' + esc(m.short) + '</div><div class="pick-main"><div class="pick-name">' + esc(m.name) + ' ' + merchantChip(m) + '</div>' +
        '<div class="pick-sub">' + esc(m.channel) + ' · ' + esc(m.masked) + '</div></div>' +
        (disabled ? '<span class="chip line">不可选</span>' : '<span class="chev">›</span>') + '</button>';
    }).join('');
    openSheet(rows, { title: '选择商户', wide: true });
  }
  function openQrStorePicker() {
    var m = qrMerchant();
    var rows = m ? storesFor(m.id) : [];
    var content = rows.length ? rows.map(function (s) {
      return '<button type="button" class="pick-item" data-act="qr-choose-store" data-id="' + s.id + '">' +
        '<div class="thumb small">📍</div><div class="pick-main"><div class="pick-name">' + esc(s.name) + '</div>' +
        '<div class="pick-sub">' + esc(s.address) + '</div></div><span class="chev">›</span></button>';
    }).join('') : stateEmpty('▤', '该商户还没有门店', '先新增门店，才能为门店生成码牌。', '<button class="btn sm" data-act="qr-add-store" data-id="' + (m ? m.id : '') + '">新增门店</button>');
    openSheet(content, { title: '选择门店', wide: true });
  }

  function openQrRecords() {
    var rows = DEMO.qrRecords.map(function (r) {
      var m = merchant(r.merchantId);
      var s = store(r.storeId);
      var t = QR_TEMPLATES[r.template] || QR_TEMPLATES.lipai;
      return '<div class="record-row"><div><div class="record-title">' + esc(m ? m.name : '—') + ' · ' + t.name + '</div>' +
        '<div class="store-sub">' + esc(s ? s.name : '') + ' · ' + esc(r.time) + ' · ' + esc(r.id) + '</div></div>' +
        '<button class="link-quiet green" data-act="qr-again" data-id="' + r.id + '">再次生成</button></div>';
    }).join('');
    openSheet(rows || stateEmpty('▣', '还没有生成记录', '生成第一张码牌后，可在这里再次下载。', ''), { title: '生成记录', wide: true });
  }

  function qrAddRecord() {
    if (!QR.merchantId || !QR.storeId) return;
    DEMO.qrRecords.unshift({
      id: 'QR' + todayCode() + String(DEMO.qrRecords.length + 1).padStart(4, '0'),
      time: nowText(), merchantId: QR.merchantId, storeId: QR.storeId, template: QR.template
    });
  }

  function downloadQrPng() {
    var blocked = qrBlockedReason();
    if (blocked) { toast(blocked); return; }
    if (QR.generating) return;
    QR.generating = true;
    var save = $('#qrSaveBtn');
    var dl = $('#qrDownloadBtn');
    save.disabled = true; dl.disabled = true; dl.textContent = '生成中…';
    var preview = $('#qrPreview');
    preview.classList.add('generating');

    setTimeout(function () {
      var m = qrMerchant();
      var s = qrStore();
      var tpl = QR_TEMPLATES[QR.template];
      var lipai = QR.template === 'lipai';
      var W = lipai ? 1500 : 2000;
      var H = 2000;
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#07c160';
      ctx.lineWidth = 20;
      ctx.strokeRect(50, 50, W - 100, H - 100);

      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.font = '700 74px "PingFang SC", "Microsoft YaHei", sans-serif';
      wrapText(ctx, m.name, W / 2, 250, W - 240, 88, 2);
      ctx.fillStyle = '#5b6678';
      ctx.font = '400 38px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(s.name, W / 2, 430);

      var size = 25, quiet = 4, total = size + quiet * 2;
      var module = Math.floor(Math.min(W - 380, H * 0.56) / total);
      var codeSize = module * total;
      var ox = (W - codeSize) / 2;
      var oy = 540;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox - 16, oy - 16, codeSize + 32, codeSize + 32);
      var seed = 0;
      var seedText = m.id + s.id + tpl.key;
      for (var i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
      var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      var grid = [];
      for (var y = 0; y < size; y++) { grid[y] = []; for (var x = 0; x < size; x++) grid[y][x] = rnd() > 0.52; }
      var finder = function (fx, fy) {
        for (var yy = -1; yy <= 7; yy++) for (var xx = -1; xx <= 7; xx++) {
          var x2 = fx + xx, y2 = fy + yy;
          if (x2 < 0 || y2 < 0 || x2 >= size || y2 >= size) continue;
          var border = xx === -1 || xx === 7 || yy === -1 || yy === 7;
          var outer = xx >= 0 && xx <= 6 && yy >= 0 && yy <= 6;
          var middle = xx >= 1 && xx <= 5 && yy >= 1 && yy <= 5;
          var core = xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4;
          grid[y2][x2] = !border && outer && (!middle || core);
        }
      };
      finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
      ctx.fillStyle = '#111827';
      for (var yy2 = 0; yy2 < size; yy2++) {
        for (var xx2 = 0; xx2 < size; xx2++) {
          if (grid[yy2][xx2]) ctx.fillRect(ox + (xx2 + quiet) * module, oy + (yy2 + quiet) * module, module, module);
        }
      }

      ctx.fillStyle = '#8a94a6';
      ctx.font = '400 30px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('微信支付 · 支付宝 · 云闪付', W / 2, oy + codeSize + 110);
      ctx.fillStyle = '#b3bbc8';
      ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('演示码 · 仅用于原型演示，不可真实收款', W / 2, oy + codeSize + 170);
      ctx.fillStyle = '#07c160';
      ctx.font = '600 30px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(tpl.name + ' · ' + tpl.size, W / 2, H - 90);

      var filename = '码牌_' + m.name + '_' + tpl.name + '_' + todayCode() + '.png';
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        qrAddRecord();
        QR.generating = false;
        preview.classList.remove('generating');
        save.disabled = false; dl.disabled = false;
        dl.textContent = '下载 PNG';
        renderQr();
        toast('PNG 已下载：' + filename);
      }, 'image/png');
    }, 850);
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    var chars = String(text).split('');
    var line = '', lines = [];
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = chars[i];
        if (lines.length === maxLines - 1) break;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lineHeight); });
  }

  // ---------------------------------------------------------------- 收益
  function renderRevenue() {
    var total = DEMO.subjects.reduce(function (sum, s) { return sum + (s.enabled ? s.balance : 0); }, 0);
    $('#revTotal').innerHTML = fmt(total) + '<small> 元</small>';
    $('#revSubjects').innerHTML = DEMO.subjects.map(function (s) {
      return '<button type="button" class="subj subj-btn ' + (s.enabled ? '' : 'is-off') + '" data-act="rev-subject" data-val="' + s.code + '">' +
        '<div class="si">' + s.icon + '</div><div><div class="sn">' + esc(s.name) +
        (s.enabled ? '' : ' <span class="chip line">' + esc(s.badge) + '</span>') + '</div>' +
        '<div class="sd">' + esc(s.desc) + '</div></div>' +
        '<div class="sv">' + (s.enabled ? fmt(s.balance) : '—') + '<small>' + (s.enabled ? '可提现' : '未开通') + '</small></div></button>';
    }).join('');
  }

  // ---------------------------------------------------------------- 提现
  function accountIsPublic() { return WD.account.type === 'public'; }
  function accountReady() {
    var a = WD.account;
    if (!a) return false;
    if (a.type === 'private') return !!(a.bank && a.cardNo && a.name);
    return !!(a.company && a.account && a.opening && a.branch && a.phone);
  }
  function accountLabel() {
    var a = WD.account;
    if (a.type === 'public') {
      return { title: '对公账户 · ' + (a.opening || '开户行待补'), sub: (a.company || '企业名称待补') + ' · ' + (a.account ? '**** ' + a.account.slice(-4) : '账号待补') + ' · 对公' };
    }
    return { title: (a.bank || '结算银行') + ' · 储蓄卡', sub: (a.name || '户名待补') + ' · ' + (a.cardNo ? '**** ' + a.cardNo.slice(-4) : '卡号待补') + ' · 对私' };
  }

  function renderWithdraw() {
    var s = subject(WD.subject);
    if (!s.enabled) WD.subject = 'dailyProfit';
    s = subject(WD.subject);

    $('#wdSubjects').innerHTML = DEMO.subjects.map(function (x) {
      return '<button type="button" class="wd-subject ' + (x.code === WD.subject ? 'on' : '') + ' ' + (x.enabled ? '' : 'is-off') + '" ' +
        (x.enabled ? 'data-act="wd-subject" data-val="' + x.code + '"' : 'data-locked="增值收益待甲方确认，暂不可提现"') + '>' +
        esc(x.name) + (x.enabled ? '' : '<i>待确认</i>') + '</button>';
    }).join('');

    $('#wdAvail').textContent = '可提现 ' + fmt(s.balance) + ' 元';
    var noBalance = s.balance <= 0;
    $('#wdAccountCard').innerHTML = (function () {
      var l = accountLabel();
      return '<div class="account-row"><div class="thumb">' + (accountIsPublic() ? '企' : '💳') + '</div>' +
        '<div><div class="account-title">' + esc(l.title) + '</div><div class="account-sub">' + esc(l.sub) + '</div></div>' +
        '<button type="button" class="chip blue chip-btn" data-act="wd-account">切换</button></div>' +
        (!accountReady() ? '<p class="field-err">对公账户信息未填完整，补全后才能提交。</p>' : '');
    })();
    $('#wdAccountHint').textContent = accountIsPublic() ? '对公需填写企业信息' : '对私 · 本人储蓄卡';
    $('#wdUnknown').innerHTML = WD.unknown
      ? '<div class="banner warn"><b>提现结果暂未确认，请勿重复提交</b><p>单号 ' + esc(WD.unknown.no) + ' · 提交时间 ' + esc(WD.unknown.time) +
        '</p><div class="banner-actions"><button class="btn sm" data-act="wd-query">查询进度</button>' +
        '<button class="btn sm ghost" data-act="wd-dismiss">返回提现记录</button></div></div>'
      : '';
    var submitBtn = $('#wdSubmit');
    if (submitBtn) {
      submitBtn.disabled = !!WD.unknown || noBalance;
      submitBtn.textContent = WD.unknown ? '结果确认中，暂不可再次提交'
        : (noBalance ? '该科目暂无可提现余额' : '提交提现申请');
    }
    var allBtn = $('#wdAll');
    if (allBtn) allBtn.disabled = !!WD.unknown || noBalance;
    if (noBalance) setWdError('该科目暂无可提现余额，请切换其他科目。', 'info');
    else if ($('#wdErr').classList.contains('info')) setWdError('');

    renderWdRecords();
    calcWd();
  }

  function renderWdRecords() {
    var rows = DEMO.wdRecords;
    $('#wdRecords').innerHTML = rows.length ? rows.map(function (r) {
      var st = WD_STATUS[r.status] || ['line', r.status];
      var s = subject(r.subject);
      return '<button type="button" class="wd-record" data-act="wd-record" data-id="' + r.no + '">' +
        '<div class="wd-record-top"><span class="wd-record-amt">' + yuan(r.amount) + '</span>' + chip(st[0], st[1]) + '</div>' +
        '<div class="store-sub">' + esc(r.time.slice(5, 16)) + ' · ' + esc(s.name) + ' · 到账 ' + yuan(r.net) + '</div>' +
        (r.reason ? '<div class="wd-reason">' + esc(r.reason) + '</div>' : '') + '</button>';
    }).join('') : stateEmpty('▤', '还没有提现记录', '提交第一笔提现后，可在这里查看进度。', '');
  }

  function calcWd() {
    var input = $('#wdAmount');
    var feeEl = $('#wdFee');
    var netEl = $('#wdNet');
    if (!input || !feeEl) return;
    var parsed = M.parse(input.value);
    var s = subject(WD.subject);
    if (!parsed.ok || parsed.cents < M.MIN_WITHDRAW_CENTS ||
      parsed.cents > s.balance || parsed.cents > M.MAX_WITHDRAW_CENTS) {
      feeEl.textContent = '—';
      netEl.textContent = '—';
      return;
    }
    feeEl.textContent = fmt(M.fee(parsed.cents));
    netEl.textContent = fmt(M.net(parsed.cents));
  }

  function setWdError(msg, type) {
    var el = $('#wdErr');
    el.textContent = msg || '';
    el.className = 'field-err' + (type ? ' ' + type : '');
  }

  function submitWithdraw() {
    var s = subject(WD.subject);
    if (!s.enabled) { setWdError('该科目暂不可提现，请切换其他科目。'); return; }
    if (s.balance <= 0) { setWdError('该科目暂无可提现余额，请切换其他科目。', 'info'); return; }
    var res = M.validateWithdraw($('#wdAmount').value, s.balance);
    if (!res.ok) {
      setWdError(res.message);
      $('#wdAmount').classList.add('err');
      return;
    }
    if (!accountReady()) {
      setWdError('对公账户信息未填完整，请补全企业名称、账号、开户行、支行和预留手机。');
      openAccountSheet();
      return;
    }
    setWdError('');
    $('#wdAmount').classList.remove('err');
    var a = accountLabel();
    openSheet(
      '<div class="confirm-amount">' + yuan(res.cents) + '</div>' +
      '<div class="confirm-rows">' +
      '<div class="r"><span>提现手续费</span><b>' + yuan(res.feeCents) + '</b></div>' +
      '<div class="r"><span>预计到账</span><b class="green">' + yuan(res.netCents) + '</b></div>' +
      '<div class="r"><span>提现科目</span><b>' + esc(s.name) + '</b></div>' +
      '<div class="r"><span>收款账户</span><b>' + esc(a.sub) + '</b></div>' +
      '<div class="r"><span>到账时间</span><b>预计 T+1（以通道为准）</b></div>' +
      '</div>' +
      '<p class="field-hint" style="margin-top:12px">提交后进入运营审批；请确认金额和账户无误。</p>',
      {
        title: '确认提现 ' + yuan(res.cents) + '？',
        footer: '<button class="btn ghost" data-act="sheet-close">取消</button>' +
          '<button class="btn" data-act="wd-confirm" data-cents="' + res.cents + '">确认提交 ' + yuan(res.cents) + '</button>'
      }
    );
  }

  function doConfirmWithdraw(btn) {
    if (WD.submitting) return;
    WD.submitting = true;
    btn.disabled = true;
    btn.textContent = '提交中…';
    var cents = Number(btn.dataset.cents);
    var feeCents = M.fee(cents);
    var netCents = M.net(cents);

    setTimeout(function () {
      var no = 'WD' + todayCode() + String(DEMO.wdRecords.length + 1).padStart(3, '0');
      if (WD.demoMode === 'timeout') {
        DEMO.wdRecords.unshift({
          no: no, time: nowText(), amount: cents, fee: feeCents, net: netCents,
          subject: WD.subject, status: '结果未知', reason: '请求等待超时，结果暂未确认。请勿重复提交，稍后查询进度。'
        });
        WD.unknown = { no: no, time: nowText() };
        WD.submitting = false;
        closeSheet();
        renderWithdraw();
        toast('提现结果暂未确认，请勿重复提交');
      } else {
        DEMO.wdRecords.unshift({
          no: no, time: nowText(), amount: cents, fee: feeCents, net: netCents,
          subject: WD.subject, status: '审批中'
        });
        WD.submitting = false;
        closeSheet();
        renderWithdraw();
        toast('提现申请已提交，等待运营审批');
      }
    }, 950);
  }

  function openAccountSheet() {
    var a = WD.account;
    var pub = a.type === 'public';
    openSheet(
      '<div class="account-types">' +
      '<button type="button" class="account-option ' + (!pub ? 'on' : '') + '" data-act="acc-type" data-val="private"><b>对私</b><small>本人储蓄卡，到账快</small></button>' +
      '<button type="button" class="account-option ' + (pub ? 'on' : '') + '" data-act="acc-type" data-val="public"><b>对公</b><small>企业账户，需补全信息</small></button>' +
      '</div>' +
      '<div id="accPrivate" class="form-grid" ' + (pub ? 'hidden' : '') + '>' +
      '<div class="field"><label>开户银行</label><input class="input" id="accBank" value="' + esc(a.bank) + '" /></div>' +
      '<div class="field"><label>银行卡号</label><input class="input" id="accCard" value="' + esc(a.cardNo) + '" /></div>' +
      '<div class="field"><label>户名</label><input class="input" id="accName" value="' + esc(a.name) + '" /></div>' +
      '</div>' +
      '<div id="accPublic" class="form-grid" ' + (!pub ? 'hidden' : '') + '>' +
      '<div class="field"><label>企业名称 <span class="req">*</span></label><input class="input" id="accCompany" value="' + esc(a.company) + '" /></div>' +
      '<div class="field"><label>对公账号 <span class="req">*</span></label><input class="input" id="accAccount" value="' + esc(a.account) + '" inputmode="numeric" /></div>' +
      '<div class="row-2"><div class="field"><label>开户行 <span class="req">*</span></label><input class="input" id="accOpening" value="' + esc(a.opening) + '" /></div>' +
      '<div class="field"><label>开户支行 <span class="req">*</span></label><input class="input" id="accBranch" value="' + esc(a.branch) + '" /></div></div>' +
      '<div class="field"><label>预留手机 <span class="req">*</span></label><input class="input" id="accPhone" value="' + esc(a.phone) + '" inputmode="tel" /></div>' +
      '</div>' +
      '<p class="field-err" id="accErr"></p>',
      {
        title: '选择提现账户',
        footer: '<button class="btn ghost" data-act="sheet-close">取消</button><button class="btn" data-act="acc-save">保存账户</button>'
      }
    );
  }

  function switchAccType(type) {
    $$('.account-option').forEach(function (b) { b.classList.toggle('on', b.dataset.val === type); });
    $('#accPrivate').hidden = type !== 'private';
    $('#accPublic').hidden = type !== 'public';
  }

  function saveAccount() {
    var type = $('.account-option.on').dataset.val;
    var err = $('#accErr');
    if (type === 'private') {
      var bank = $('#accBank').value.trim();
      var cardNo = $('#accCard').value.trim();
      var name = $('#accName').value.trim();
      if (!bank) return (err.textContent = '请填写开户银行。');
      if (cardNo.replace(/\s/g, '').length < 8) return (err.textContent = '请填写完整的银行卡号。');
      if (!name) return (err.textContent = '请填写银行卡户名。');
      WD.account = { type: 'private', bank: bank, cardNo: cardNo, name: name, company: '', account: '', opening: '', branch: '', phone: '' };
    } else {
      var company = $('#accCompany').value.trim();
      var account = $('#accAccount').value.trim();
      var opening = $('#accOpening').value.trim();
      var branch = $('#accBranch').value.trim();
      var phone = $('#accPhone').value.replace(/\s/g, '');
      if (!company) return (err.textContent = '请填写企业名称，需与营业执照一致。');
      if (!/^\d{8,30}$/.test(account)) return (err.textContent = '请填写 8–30 位对公账号。');
      if (!opening) return (err.textContent = '请填写开户行。');
      if (!branch) return (err.textContent = '请填写开户支行。');
      if (!/^1\d{10}$/.test(phone)) return (err.textContent = '请输入 11 位预留手机号。');
      WD.account = { type: 'public', bank: '', cardNo: '', name: '', company: company, account: account, opening: opening, branch: branch, phone: phone };
    }
    closeSheet();
    renderWithdraw();
    toast('收款账户已切换');
  }

  function openWdRecord(no) {
    var r = null;
    DEMO.wdRecords.forEach(function (x) { if (x.no === no) r = x; });
    if (!r) return;
    var st = WD_STATUS[r.status] || ['line', r.status];
    var s = subject(r.subject);
    var action = '';
    if (r.status === '已驳回') action = '<button class="btn" data-act="wd-reuse" data-id="' + r.no + '">重新发起</button>';
    if (r.status === '打款失败') action = '<button class="btn" data-act="wd-retry" data-id="' + r.no + '">重试打款</button>';
    if (r.status === '结果未知') action = '<button class="btn" data-act="wd-query">查询进度</button>';
    openSheet(
      '<div class="detail-status">' + chip(st[0], st[1]) + '<span class="mono">' + esc(r.no) + '</span></div>' +
      '<div class="kv-list">' + kv('提现金额', yuan(r.amount)) + kv('手续费', yuan(r.fee)) +
      kv('到账金额', yuan(r.net)) + kv('提现科目', s.name) + kv('提交时间', r.time) +
      (r.reason ? '<div class="banner danger" style="margin-top:12px">' + esc(r.reason) + '</div>' : '') +
      '</div>' + (action ? '<div style="margin-top:16px">' + action + '</div>' : ''),
      { title: '提现记录' }
    );
  }

  // ---------------------------------------------------------------- 事件委托
  document.addEventListener('click', function (e) {
    var locked = e.target.closest('[data-locked]');
    if (locked) {
      e.preventDefault();
      toast(locked.dataset.locked || '该功能将在后续版本开放，当前可体验已上线流程。');
      return;
    }

    var actEl = e.target.closest('[data-act]');
    if (actEl) {
      e.preventDefault();
      handleAct(actEl);
      return;
    }

    var goEl = e.target.closest('[data-go]');
    if (goEl) {
      e.preventDefault();
      var params = {};
      if (goEl.dataset.merchant) params.merchant = goEl.dataset.merchant;
      if (goEl.dataset.store) params.store = goEl.dataset.store;
      go(goEl.dataset.go, params);
      return;
    }

    var stateBtn = e.target.closest('.demo-state [data-state]');
    if (stateBtn) {
      var wrap = stateBtn.closest('.demo-state');
      var forId = wrap.dataset.stateFor;
      pageState[forId] = stateBtn.dataset.state;
      $$('button', wrap).forEach(function (b) { b.classList.toggle('on', b === stateBtn); });
      if (forId === 'm-stores') renderStores();
      if (forId === 'm-tx') renderTx();
      if (forId === 'm-qr') renderQr();
      return;
    }

    var tab = e.target.closest('#mchTabs button');
    if (tab) {
      activeMchTab = tab.dataset.status;
      $$('#mchTabs button').forEach(function (b) { b.classList.toggle('on', b === tab); });
      renderMerchants();
      return;
    }

    var rangeBtn = e.target.closest('.range button');
    if (rangeBtn) {
      $$('.range button').forEach(function (b) { b.classList.toggle('on', b === rangeBtn); });
      return;
    }

    var chCard = e.target.closest('#mchChannelList .ch-card[data-ch]');
    if (chCard) {
      if (resubmit && chCard.dataset.ch !== resubmit.channel) {
        toast('重提只针对被驳回的通道，其他通道的三态与时间不受影响');
        return;
      }
      $$('#mchChannelList .ch-card').forEach(function (c) { c.classList.toggle('on', c === chCard); });
      var name = chCard.querySelector('.cn').textContent.trim().split(' ')[0];
      toast('已选择进件通道：' + name);
    }
  });

  function handleAct(el) {
    var act = el.dataset.act;

    if (act === 'sheet-close') { closeSheet(); return; }
    if (act === 'copy') { copyText(el.dataset.val || ''); return; }
    if (act === 'upload-demo') { el.textContent = '已上传 ✓'; el.classList.add('done'); toast('演示环境已模拟上传'); return; }

    if (act === 'mch-clear') { mchKeyword = ''; $('#mchSearch').value = ''; activeMchTab = 'all'; $$('#mchTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.status === 'all'); }); renderMerchants(); return; }
    if (act === 'mch-channel') { activeChannel = el.dataset.ch; renderMerchantDetail(); return; }
    if (act === 'mch-qr') { go('m-qr', { merchant: el.dataset.id }); return; }
    if (act === 'mch-stores') { go('m-stores', { merchant: el.dataset.id }); return; }
    if (act === 'mch-tx') { go('m-tx', { merchant: el.dataset.id }); return; }
    if (act === 'mch-stop') { openStopSheet(el.dataset.id); return; }
    if (act === 'mch-stop-confirm') { confirmStop(); return; }
    if (act === 'mch-resubmit') { startResubmit(el.dataset.id, el.dataset.ch); return; }
    if (act === 'mch-resubmit-query') { toast('该笔重提仍在通道处理中，请 1 个工作日后再查看；请勿重复提交'); return; }

    if (act === 'pending-state') { DEMO.realname = el.dataset.val; renderPending(); return; }
    if (act === 'pending-refresh') { toast('正在获取审核进度…'); setTimeout(function () { toast('审核仍在进行中，预计 11-12 前完成'); }, 700); return; }
    if (act === 'pending-approve') {
      DEMO.realname = 'approved';
      renderPending();
      toast('演示：审核已通过');
      setTimeout(function () { go('m-home', { replace: true }); }, 1500);
      return;
    }
    if (act === 'pending-resubmit') { regRejectedMode = true; DEMO.realname = 'rejected'; go('m-register'); return; }

    if (act === 'store-add') { openStoreSheet(null); return; }
    if (act === 'store-edit') { openStoreSheet(el.dataset.id); return; }
    if (act === 'store-save') { saveStore(); return; }
    if (act === 'store-clear') { storeKeyword = ''; $('#storeSearch').value = ''; storeFilterMerchant = 'all'; $('#storeMerchantFilter').value = 'all'; renderStores(); return; }
    if (act === 'store-retry') { pageState['m-stores'] = 'default'; $$('.demo-state[data-state-for="m-stores"] button').forEach(function (b) { b.classList.toggle('on', b.dataset.state === 'default'); }); renderStores(); return; }
    if (act === 'store-goto-qr') { var s = store(el.dataset.id); if (s) go('m-qr', { merchant: s.merchantId, store: s.id }); return; }

    if (act === 'tx-open') { openTxDetail(el.dataset.id); return; }
    if (act === 'tx-retry') { pageState['m-tx'] = 'default'; $$('.demo-state[data-state-for="m-tx"] button').forEach(function (b) { b.classList.toggle('on', b.dataset.state === 'default'); }); renderTx(); return; }
    if (act === 'tx-clear') { txFilters = { range: '7d', merchant: 'all', store: 'all', channel: 'all', pay: 'all', status: 'all', keyword: '' }; syncTxSelects(); renderTx(); return; }

    if (act === 'qr-pick-merchant') { openQrMerchantPicker(); return; }
    if (act === 'qr-pick-store') { openQrStorePicker(); return; }
    if (act === 'qr-choose-merchant') {
      QR.merchantId = el.dataset.id;
      QR.storeId = storesFor(el.dataset.id)[0] ? storesFor(el.dataset.id)[0].id : null;
      closeSheet(); renderQr(); return;
    }
    if (act === 'qr-choose-store') { QR.storeId = el.dataset.id; closeSheet(); renderQr(); return; }
    if (act === 'qr-template') { QR.template = el.dataset.val; renderQr(); return; }
    if (act === 'qr-download') { closeSheet(); downloadQrPng(); return; }
    if (act === 'qr-save') { openAlbumSheet(); return; }
    if (act === 'qr-records') { openQrRecords(); return; }
    if (act === 'qr-again') {
      var rec = null;
      DEMO.qrRecords.forEach(function (r) { if (r.id === el.dataset.id) rec = r; });
      if (rec) {
        QR.merchantId = rec.merchantId; QR.storeId = rec.storeId; QR.template = rec.template;
        closeSheet(); renderQr(); setTimeout(downloadQrPng, 220);
      }
      return;
    }
    if (act === 'qr-add-store') { closeSheet(); go('m-stores', { merchant: el.dataset.id }); return; }
    if (act === 'qr-retry') { pageState['m-qr'] = 'default'; $$('.demo-state[data-state-for="m-qr"] button').forEach(function (b) { b.classList.toggle('on', b.dataset.state === 'default'); }); renderQr(); return; }

    if (act === 'rev-subject') {
      var sub = subject(el.dataset.val);
      if (!sub.enabled) { toast('增值收益是否纳入提现待甲方确认'); return; }
      WD.subject = sub.code;
      go('m-withdraw');
      return;
    }

    if (act === 'wd-subject') { WD.subject = el.dataset.val; setWdError(''); $('#wdAmount').classList.remove('err'); renderWithdraw(); return; }
    if (act === 'wd-account') { openAccountSheet(); return; }
    if (act === 'acc-type') { switchAccType(el.dataset.val); return; }
    if (act === 'acc-save') { saveAccount(); return; }
    if (act === 'wd-confirm') { doConfirmWithdraw(el); return; }
    if (act === 'wd-record') { openWdRecord(el.dataset.id); return; }
    if (act === 'wd-query') { toast('该笔仍在处理中，请 5 分钟后刷新；请勿重复提交'); return; }
    if (act === 'wd-dismiss') { WD.unknown = null; renderWithdraw(); return; }
    if (act === 'wd-reuse') {
      var rr = null;
      DEMO.wdRecords.forEach(function (x) { if (x.no === el.dataset.id) rr = x; });
      if (rr) {
        WD.subject = rr.subject;
        $('#wdAmount').value = fmt(rr.amount);
        closeSheet(); renderWithdraw(); toast('已填入上次金额，请修改后重新提交');
      }
      return;
    }
    if (act === 'wd-retry') { closeSheet(); toast('已提交重试，仅重试失败笔'); return; }

    if (act === 'logout-confirm') { closeSheet(); go('m-splash', { replace: true }); return; }
  }

  function stopReasonLen(value) {
    return Array.from(String(value || '').trim()).length;
  }

  function updateStopReason() {
    var ta = $('#stopReason');
    var err = $('#stopErr');
    var btn = $('[data-act="mch-stop-confirm"]');
    if (!ta || !err || !btn) return;
    var len = stopReasonLen(ta.value);
    if (len === 0) {
      err.textContent = '';
      btn.disabled = true;
      return;
    }
    if (len < 2) {
      err.textContent = '停用原因至少 2 个字，便于后续审计。';
      btn.disabled = true;
      return;
    }
    if (len > 50) {
      err.textContent = '停用原因最多 50 个字，请精简后提交。';
      btn.disabled = true;
      return;
    }
    err.textContent = '';
    btn.disabled = false;
  }

  function openStopSheet(id) {
    var m = merchant(id);
    if (!m) return;
    openSheet(
      '<p class="sheet-lead">停用后该商户将无法收款，存量交易与分润照常结算。请填写原因，操作会记录操作人和时间。</p>' +
      '<div class="field"><label>停用原因 <span class="req">*</span></label><textarea class="textarea" id="stopReason" rows="3" placeholder="例如：风控核查，商户经营异常"></textarea></div>' +
      '<p class="field-hint">必填 2–50 字，便于后续审计和恢复。</p>' +
      '<p class="field-err" id="stopErr"></p>',
      {
        title: '停用「' + m.name + '」？',
        footer: '<button class="btn ghost" data-act="sheet-close">取消</button><button class="btn danger-solid" data-act="mch-stop-confirm" disabled>确认停用商户</button>'
      }
    );
    var ta = $('#stopReason');
    if (ta) {
      ta.addEventListener('input', updateStopReason);
      ta.addEventListener('compositionend', updateStopReason);
    }
  }

  function confirmStop() {
    var reason = $('#stopReason').value.trim();
    var len = stopReasonLen(reason);
    var err = $('#stopErr');
    if (len < 2 || len > 50) {
      if (err) err.textContent = len < 2 ? '停用原因至少 2 个字，便于后续审计。' : '停用原因最多 50 个字，请精简后提交。';
      return;
    }
    var m = merchant(activeMerchantId);
    if (!m) return;
    m.status = 'stopped';
    m.stoppedReason = reason;
    m.stoppedBy = '王海涛（当前账号）';
    m.stoppedAt = nowText();
    m.channels.forEach(function (c) { if (c.report === 'processing') c.report = 'stopped'; });
    closeSheet();
    renderMerchantDetail();
    renderMerchants();
    toast('商户已停用，状态已回写到商户列表');
  }

  function startResubmit(id, chCode) {
    var m = merchant(id);
    if (!m) return;
    var ch = m.channels.filter(function (c) { return c.code === chCode; })[0] || m.channels[0];
    var target = ch.onboarding === 'rejected' ? 'onboarding' : 'report';
    resubmit = { merchantId: id, channel: ch.code, target: target };
    activeMerchantId = id;
    activeChannel = ch.code;
    go('m-mchnew', { resubmit: true });
  }

  function submitMch() {
    var btn = $('#submitMch');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '提交中…';
    setTimeout(function () {
      btn.disabled = false;
      if (resubmit) {
        var m = merchant(resubmit.merchantId);
        var ch = m.channels.filter(function (c) { return c.code === resubmit.channel; })[0];
        var demoMode = $('#mchDemoMode');
        var isTimeout = demoMode && demoMode.value === 'timeout';
        if (isTimeout) {
          m._resubmitUnknown = { channel: ch ? ch.code : resubmit.channel, channelName: ch ? ch.name : '—', at: nowText() };
          toast('重提结果确认中，请勿重复提交');
          resubmit = null;
          if (stack[stack.length - 1] === 'm-mchnew') stack.pop();
          paint('m-mchdetail');
          return;
        }
        if (ch) {
          var targetText = resubmit.target === 'onboarding' ? '进件' : '报备';
          if (resubmit.target === 'onboarding') { ch.onboarding = 'processing'; ch.onboardingAt = nowText().slice(5, 16); }
          else { ch.report = 'processing'; ch.reportAt = '预计 1–2 个工作日'; }
          ch.rejectReason = '';
          ch.rejectTitle = '';
          if (!m.logs) m.logs = [];
          m.logs.push({ t: nowText(), text: '重新提交' + targetText + ' · ' + ch.name, by: '王海涛（当前账号）' });
        }
        m._resubmitUnknown = null;
        // 其他通道仍被驳回时，商户整体保持「已驳回」，避免误从驳回列表消失
        m.status = m.channels.filter(function (c) { return !!c.rejectReason; }).length ? 'rejected' : 'review';
        toast('已重新提交，等待通道审核');
        resubmit = null;
        if (stack[stack.length - 1] === 'm-mchnew') stack.pop();
        paint('m-mchdetail');
      } else {
        var nameInput = $('input[name="mchName"]');
        var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '新商户（演示）';
        var nm = {
          id: 'm' + Date.now(), name: name, short: name.slice(0, 1), channel: '银盛',
          mchNo: 'M8833 0000 ' + String(DEMO.merchants.length + 1).padStart(2, '0'),
          masked: 'M8833****00' + String(DEMO.merchants.length + 1).padStart(2, '0'),
          type: '个人小微', category: '餐饮 / 熟食', rate: 0.38, status: 'review',
          owner: '云启支付 / 王海涛', limit: '单笔 5 万 / 单日 20 万',
          tx30: 0, tx30Count: 0, payMix: [], stoppedReason: '', stoppedAt: '',
          channels: [{ code: 'ys', name: '银盛', onboarding: 'processing', onboardingAt: nowText().slice(5, 16), sign: 'notStarted', signAt: '—', report: 'notStarted', reportAt: '—' }]
        };
        DEMO.merchants.unshift(nm);
        activeMerchantId = nm.id;
        activeChannel = 'ys';
        toast('进件资料已提交，进入三态流程');
        renderMerchantDetail();
        go('m-mchdetail', { replaceTop: true });
      }
    }, 850);
  }

  function openAlbumSheet() {
    openSheet(
      '<p class="sheet-lead">演示环境无法写入相册。真实环境需先获得相册权限，被拒绝时可去设置开启，或直接下载 PNG。</p>',
      {
        title: '保存到相册',
        footer: '<button class="btn ghost" data-act="sheet-close">取消</button><button class="btn" data-act="qr-download">下载 PNG</button>'
      }
    );
  }

  // ---------------------------------------------------------------- 表单与筛选事件
  var regForm = $('#regForm');
  if (regForm) {
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('#regSubmit');
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = '提交中…';
      setTimeout(function () {
        var wasRejected = regRejectedMode;
        DEMO.realname = 'pending';
        regRejectedMode = false;
        DEMO.realnameTimeline.push({
          t: nowText(),
          text: wasRejected ? '重新提交实名资料' : '提交注册资料',
          note: wasRejected ? '仅修改被驳回项' : '邀请码 YQ-8823-KL'
        });
        btn.disabled = false;
        btn.textContent = '提交审核';
        toast('资料已提交，进入实名审核');
        go('m-pending', { replaceTop: true });
      }, 800);
    });
    $$('#regForm [data-upload]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.textContent = btn.dataset.upload + ' 已上传 ✓';
        btn.classList.add('done');
        toast('演示环境已模拟上传');
      });
    });
  }

  var mchSearch = $('#mchSearch');
  if (mchSearch) mchSearch.addEventListener('input', function () { mchKeyword = mchSearch.value; renderMerchants(); });

  var storeSearch = $('#storeSearch');
  if (storeSearch) storeSearch.addEventListener('input', function () { storeKeyword = storeSearch.value; renderStores(); });

  ['txRange', 'txMerchant', 'txChannel', 'txPay', 'txStatus'].forEach(function (id) {
    var el = $('#' + id);
    if (el) el.addEventListener('change', function () {
      if (id === 'txMerchant') { rebuildTxStores(); }
      readTxFilters();
      renderTx();
    });
  });
  var txStore = $('#txStore');
  if (txStore) txStore.addEventListener('change', function () { readTxFilters(); renderTx(); });
  var txKeyword = $('#txKeyword');
  if (txKeyword) txKeyword.addEventListener('input', function () { readTxFilters(); renderTx(); });
  var txReset = $('#txReset');
  if (txReset) txReset.addEventListener('click', function () {
    txFilters = { range: '7d', merchant: 'all', store: 'all', channel: 'all', pay: 'all', status: 'all', keyword: '' };
    syncTxSelects(); renderTx();
  });

  var wdAmount = $('#wdAmount');
  if (wdAmount) {
    wdAmount.addEventListener('input', function () {
      setWdError('');
      wdAmount.classList.remove('err');
      calcWd();
    });
    wdAmount.addEventListener('blur', function () {
      var res = M.parse(wdAmount.value);
      if (!res.ok && wdAmount.value.trim()) setWdError(res.message);
    });
  }
  var wdAll = $('#wdAll');
  if (wdAll) wdAll.addEventListener('click', function () {
    var s = subject(WD.subject);
    var cents = Math.min(s.balance, M.MAX_WITHDRAW_CENTS);
    if (cents <= 0) { setWdError('暂无可提现余额，先去收益页看看。'); return; }
    $('#wdAmount').value = fmt(cents);
    $('#wdAmount').classList.remove('err');
    calcWd();
    if (s.balance > M.MAX_WITHDRAW_CENTS) {
      setWdError('已填入单笔上限 ' + yuan(cents) + '；剩余 ' + yuan(s.balance - cents) + ' 可再发起一笔。', 'info');
    } else {
      setWdError('');
    }
  });
  var wdSubmit = $('#wdSubmit');
  if (wdSubmit) wdSubmit.addEventListener('click', submitWithdraw);
  var wdDemoMode = $('#wdDemoMode');
  if (wdDemoMode) wdDemoMode.addEventListener('change', function () {
    if (wdDemoMode.value === 'zero') {
      subject('shareBonus').balance = 0;
      WD.subject = 'shareBonus';
      WD.demoMode = 'normal';
      wdDemoMode.value = 'normal';
      renderWithdraw();
      toast('演示：已将「分成奖励」余额置 0');
      return;
    }
    WD.demoMode = wdDemoMode.value;
  });

  var revDetail = $('#revDetailBtn');
  if (revDetail) revDetail.addEventListener('click', function () {
    var target = $('#revFlowTitle');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 1200);
    toast('已定位到最近流水');
  });

  var submitMchBtn = $('#submitMch');
  if (submitMchBtn) submitMchBtn.addEventListener('click', submitMch);

  var logoutBtn = $('#logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', function () {
    openSheet('<p class="sheet-lead">退出后需重新输入手机号和密码。当前演示数据不会丢失。</p>', {
      title: '退出登录？',
      footer: '<button class="btn ghost" data-act="sheet-close">取消</button><button class="btn" data-act="logout-confirm">退出登录</button>'
    });
  });

  backBtn.addEventListener('click', back);
  if (sheetMask) sheetMask.addEventListener('click', function (e) { if (e.target === sheetMask) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheetMask.hidden) closeSheet(); });

  if (document.readyState !== 'loading') paint('m-splash');
  else window.addEventListener('DOMContentLoaded', function () { paint('m-splash'); });
})();
