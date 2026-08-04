/* 수집·배정형 데모 — 모든 화면 상단에 붙는 공용 이동 바
   "메인으로" 버튼과 5개 화면으로 바로 가는 버튼을 항상 보여줍니다.
   collect-assign-system/index.html(허브)과 collect-assign-system/screens/*.html
   양쪽에서 모두 동작하도록 현재 위치를 스스로 판단해 상대경로를 계산합니다. */
(function () {
  var inScreens = /\/collect-assign-system\/screens\//.test(location.pathname);
  var base = inScreens ? '' : 'screens/'; // 화면 파일들끼리는 같은 폴더, 허브에서는 screens/ 로 들어가야 함
  var home = inScreens ? '../index.html' : 'index.html';

  var file = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var cur = inScreens ? file : 'index';

  var ITEMS = [
    { id: 'index', href: home, label: '메인으로' },
    { id: '00-overview', href: base + '00-overview.html', label: '개요' },
    { id: '01-applicant-submit', href: base + '01-applicant-submit.html', label: '지원자 제출' },
    { id: '02-interviewer-submit', href: base + '02-interviewer-submit.html', label: '인터뷰어 제출' },
    { id: '03-admin-workbook', href: base + '03-admin-workbook.html', label: '관리자 워크북' },
    { id: '04-helpdesk', href: base + '04-helpdesk.html', label: '문의하기' },
    { id: '05-faq', href: base + '05-faq.html', label: 'FAQ' }
  ];

  var FONT = "'Pretendard Variable','Pretendard',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";

  var style = document.createElement('style');
  style.textContent =
    '.ca-nav{position:sticky;top:0;z-index:9999;display:flex;flex-wrap:wrap;gap:6px;' +
    'padding:10px 14px;background:rgba(253,253,253,0.92);backdrop-filter:saturate(180%) blur(14px);' +
    '-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:0.5px solid rgba(0,0,0,0.09);' +
    'font-family:' + FONT + ';}' +
    '.ca-nav a{font-size:11.5px;font-weight:400;color:#5e5e5e;text-decoration:none;' +
    'background:#f2f2f4;border-radius:9999px;padding:6px 12px;white-space:nowrap;letter-spacing:-0.01em;' +
    'display:inline-flex;align-items:center;gap:5px;transition:background .12s;}' +
    '.ca-nav a:hover{background:rgba(15,16,18,0.09);}' +
    '.ca-nav a.active{background:#0f1012;color:#fff;}' +
    '.ca-nav a.home{border:0.5px solid #0071e3;color:#0071e3;background:none;}' +
    '.ca-nav a.home:hover{background:rgba(0,113,227,0.08);}';
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'ca-nav';
  ITEMS.forEach(function (it) {
    var a = document.createElement('a');
    a.href = it.href;
    a.textContent = it.label;
    if (it.id === cur) a.classList.add('active');
    if (it.id === 'index') a.classList.add('home');
    bar.appendChild(a);
  });

  function mount() {
    if (document.body.firstChild) document.body.insertBefore(bar, document.body.firstChild);
    else document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
