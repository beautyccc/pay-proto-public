/* 小程序端原型交互：屏幕切换 / 导航栏 / tabbar / 通道选择 / 提现试算 */

(function () {
  const screens = Array.from(document.querySelectorAll('.mscreen'));
  const navbar = document.getElementById('navbar');
  const navTitle = document.getElementById('navTitle');
  const backBtn = document.getElementById('backBtn');
  const tabbar = document.getElementById('tabbar');
  const toastEl = document.getElementById('toast');
  let stack = ['m-splash'];

  const money = (n) =>
    n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function show(id, opts) {
    const target = document.getElementById(id);
    if (!target) return;
    screens.forEach((s) => s.classList.toggle('active', s === target));
    target.scrollTop = 0;

    const title = target.dataset.title || '';
    const navOn = target.dataset.nav !== 'off';
    navbar.style.display = navOn ? 'flex' : 'none';
    navTitle.textContent = title;
    backBtn.style.visibility = navOn ? 'visible' : 'hidden';

    const tab = target.dataset.tab || '';
    tabbar.style.display = tab ? 'grid' : 'none';
    Array.from(tabbar.querySelectorAll('a')).forEach((a) =>
      a.classList.toggle('on', a.dataset.tab === tab)
    );

    if (!opts || !opts.replace) {
      if (stack[stack.length - 1] !== id) stack.push(id);
    } else {
      stack = [id];
    }
  }

  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-go]');
    if (nav) {
      e.preventDefault();
      show(nav.dataset.go);
      return;
    }
    const tabBtn = e.target.closest('.tabs button, .range button');
    if (tabBtn && tabBtn.parentElement) {
      Array.from(tabBtn.parentElement.children).forEach((b) => b.classList.remove('on'));
      tabBtn.classList.add('on');
      return;
    }
  });

  backBtn.addEventListener('click', () => {
    stack.pop();
    const prev = stack[stack.length - 1] || 'm-home';
    stack.pop();
    show(prev);
  });

  // 通道选择
  document.querySelectorAll('.ch-card[data-ch]').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ch-card[data-ch]').forEach((c) => c.classList.remove('on'));
      card.classList.add('on');
      const name = card.querySelector('.cn').textContent.trim().split(' ')[0];
      toast('已选择进件通道：' + name);
    });
  });

  // 提交进件
  const submit = document.getElementById('submitMch');
  if (submit) {
    submit.addEventListener('click', () => {
      submit.disabled = true;
      submit.textContent = '提交中…';
      setTimeout(() => {
        submit.disabled = false;
        submit.textContent = '提交进件';
        toast('进件资料已提交，进入三态流程');
        show('m-mchdetail');
      }, 900);
    });
  }

  // 提现试算
  const amount = document.getElementById('wdAmount');
  const feeEl = document.getElementById('wdFee');
  const netEl = document.getElementById('wdNet');
  const allEl = document.getElementById('wdAll');
  const MAX = 20000;
  const AVAIL = 62180.2;

  function calc() {
    let v = parseFloat(amount.value.replace(/,/g, ''));
    if (isNaN(v) || v < 0) v = 0;
    const fee = v > 0 ? Math.min(v * 0.08 + 3, v) : 0;
    feeEl.textContent = money(fee);
    netEl.textContent = money(Math.max(v - fee, 0));
  }
  if (amount) {
    amount.addEventListener('input', calc);
    allEl.addEventListener('click', () => {
      amount.value = AVAIL.toFixed(2);
      calc();
    });
    calc();

    document.getElementById('wdSubmit').addEventListener('click', () => {
      const v = parseFloat(amount.value.replace(/,/g, '')) || 0;
      if (v < 100) return toast('单笔最低提现 100 元');
      if (v > MAX) return toast('单笔最高提现 ' + money(MAX) + ' 元');
      if (v > AVAIL) return toast('超出该科目可提现余额');
      toast('提现申请已提交，等待运营审批');
    });
  }

  // 首页快捷入口 / 模拟审核通过
  window.addEventListener('DOMContentLoaded', () => show('m-splash', { replace: true }));
})();
