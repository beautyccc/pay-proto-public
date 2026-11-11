/* 运营后台原型交互：侧边导航 / 表格行跳转 */

(function () {
  const pages = Array.from(document.querySelectorAll('.admin-page'));
  const navLinks = Array.from(document.querySelectorAll('.side a[data-page]'));

  function go(id) {
    const target = document.getElementById(id);
    if (!target) return;
    pages.forEach((p) => p.classList.toggle('active', p === target));
    document.querySelector('.main').scrollTop = 0;

    // 商户详情归属「商户管理」
    const navId = id === 'p-mchdetail' ? 'p-merchants' : id;
    navLinks.forEach((a) => a.classList.toggle('on', a.dataset.page === navId));
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-page]');
    if (!trigger) return;
    e.preventDefault();
    go(trigger.dataset.page);
  });
})();
