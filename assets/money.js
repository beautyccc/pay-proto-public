/* 金额工具：内部一律整数「分」，只在展示层换算为元。
   不依赖任何框架，index.html / admin.html 共用。 */
(function (global) {
  'use strict';

  var FEE_RATE_BPS = 800;          // 8% = 800 基点（演示常量，待甲方确认）
  var FEE_FIXED_CENTS = 300;       // 3 元/笔
  var MIN_WITHDRAW_CENTS = 10000;  // 单笔最低 100.00
  var MAX_WITHDRAW_CENTS = 2000000;// 单笔最高 20,000.00

  var ERROR_TEXT = {
    empty: '请输入提现金额',
    format: '请输入有效金额',
    precision: '最多输入两位小数',
    tooLarge: '金额超出可处理范围，请分笔提交'
  };

  function fail(reason) {
    return { ok: false, cents: 0, reason: reason, message: ERROR_TEXT[reason] };
  }

  /**
   * 解析用户输入的元金额为整数分。
   * 规则：允许千分位逗号与 ¥；拒绝 e/E、+、- 及非数字字符；最多两位小数。
   * @returns {{ok:boolean,cents:number,reason?:string,message?:string}}
   */
  function parse(input) {
    var raw = input === null || input === undefined ? '' : String(input).trim();
    if (!raw) return fail('empty');

    if (/[eE+\-]/.test(raw)) return fail('format');

    var compact = raw.replace(/[¥￥\s]/g, '');
    if (!compact) return fail('empty');

    // 千分位只允许出现在合法位置；纯数字（含 .5 / 5.）也接受
    var commaOk = /^\d{1,3}(,\d{3})*(\.\d*)?$/.test(compact);
    var plainOk = /^\d*(\.\d*)?$/.test(compact);
    if (!commaOk && !plainOk) return fail('format');

    var num = compact.replace(/,/g, '');
    if (num === '' || num === '.') return fail('format');

    if (/^\d*\.\d{3,}$/.test(num)) return fail('precision');
    if (!/^\d*(\.\d{0,2})?$/.test(num)) return fail('format');

    var parts = num.split('.');
    var yuanPart = parts[0] || '0';
    var fenPart = (parts[1] || '') + '00';
    var cents = Number(yuanPart) * 100 + Number(fenPart.slice(0, 2));

    if (!isFinite(cents) || !Number.isSafeInteger(cents)) return fail('tooLarge');
    if (cents < 0) return fail('format');
    return { ok: true, cents: cents };
  }

  /** 整数分 → "1,286,430.00"（无符号） */
  function format(cents) {
    var n = Math.trunc(Number(cents) || 0);
    var sign = n < 0 ? '−' : '';
    n = Math.abs(n);
    var yuan = Math.floor(n / 100);
    var fen = n % 100;
    var yuanText = String(yuan).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + yuanText + '.' + (fen < 10 ? '0' : '') + fen;
  }

  /** 整数分 → "¥1,286,430.00"，负数用 U+2212 */
  function yuan(cents) {
    var n = Math.trunc(Number(cents) || 0);
    if (n < 0) return '−¥' + format(Math.abs(n));
    return '¥' + format(n);
  }

  /** 表格金额：无符号两位小数（负数保留 −） */
  function plain(cents) {
    return format(cents);
  }

  /** 手续费：min(金额, round_half_up(金额 * 8%) + 3 元)；全部整数分运算 */
  function fee(cents) {
    var n = Math.max(0, Math.trunc(Number(cents) || 0));
    var proportional = Math.round((n * FEE_RATE_BPS) / 10000);
    return Math.min(n, proportional + FEE_FIXED_CENTS);
  }

  function net(cents) {
    var n = Math.max(0, Math.trunc(Number(cents) || 0));
    return n - fee(n);
  }

  /** 百分比展示：0.38 → "0.38%" */
  function rate(value) {
    return Number(value).toFixed(2) + '%';
  }

  /** 提现金额校验：格式 → 最低 → 余额 → 最高（顺序固定） */
  function validateWithdraw(input, balanceCents) {
    var parsed = parse(input);
    if (!parsed.ok) return parsed;

    var cents = parsed.cents;
    if (cents === 0) {
      return { ok: false, cents: 0, reason: 'empty', message: ERROR_TEXT.empty };
    }
    if (cents < MIN_WITHDRAW_CENTS) {
      return { ok: false, cents: cents, reason: 'min', message: '单笔最低提现 ¥100.00，请调整金额。' };
    }
    if (cents > balanceCents) {
      return {
        ok: false, cents: cents, reason: 'balance',
        message: '超出可提现余额，当前可提现 ' + yuan(balanceCents) + '。'
      };
    }
    if (cents > MAX_WITHDRAW_CENTS) {
      var msg = '单笔最高提现 ¥20,000.00，请分笔提交。';
      // 用户把「全部余额」一次性填入且余额本身超上限时，给出分笔/全部提现的引导
      if (cents === balanceCents && balanceCents > MAX_WITHDRAW_CENTS) {
        msg = '单笔最高 ¥20,000.00；当前余额 ' + yuan(balanceCents) +
          '，请分笔或使用「全部提现」填入 20,000.00。';
      }
      return { ok: false, cents: cents, reason: 'max', message: msg };
    }
    return { ok: true, cents: cents, feeCents: fee(cents), netCents: net(cents) };
  }

  global.Money = {
    parse: parse,
    format: format,
    yuan: yuan,
    plain: plain,
    fee: fee,
    net: net,
    rate: rate,
    validateWithdraw: validateWithdraw,
    MIN_WITHDRAW_CENTS: MIN_WITHDRAW_CENTS,
    MAX_WITHDRAW_CENTS: MAX_WITHDRAW_CENTS,
    FEE_RATE_BPS: FEE_RATE_BPS,
    FEE_FIXED_CENTS: FEE_FIXED_CENTS,
    ERROR_TEXT: ERROR_TEXT
  };
})(typeof window !== 'undefined' ? window : this);
