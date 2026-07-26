/* 화면을 단독으로 열었을 때만 상단에 "전체 화면 목록" 바를 붙입니다.
   허브(index.html)의 iframe 안에서는 아무것도 하지 않습니다.
   index.html과 동일한 Augen Pro 스타일(오프화이트·시그널 블루)을 사용합니다. */
(function () {
  try { if (window.parent && window.parent !== window) return; } catch (e) { return; }

  var SCREENS = [
    { id: '00-workflow', t: '전체 워크플로우' },
    { id: '01-applicant-form', t: '예약하기 · 문의하기 (신청자)' },
    { id: '03-interviewer-availability', t: '가능한 시간 알려주기 (인터뷰어)' },
    { id: '04-interviewer-approval', t: '배정 시간 확인 (인터뷰어)' },
    { id: '06-teams-approval', t: 'Teams 확인 요청 (인터뷰어)' },
    { id: '02-admin-booking', t: '예약시스템 (관리자)' },
    { id: '09-weekly-dashboard', t: '주간 수급 현황 (관리자)' },
    { id: '05-admin-helpdesk', t: '헬프데스크 (관리자)' },
    { id: '07-teams-reassign', t: 'Teams 재배정 알림' },
    { id: '08-teams-tab', t: 'Teams 탭 내장 화면' }
  ];

  var file = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var cur = decodeURIComponent(file);

  var FONT = "'Pretendard Variable','Pretendard',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";

  var link = document.createElement('link');
  link.rel = 'stylesheet'; link.crossOrigin = 'anonymous';
  link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css';
  document.head.appendChild(link);

  var bar = document.createElement('div');
  bar.setAttribute('data-shell-nav', '1');
  bar.style.cssText = [
    'position:sticky', 'top:0', 'z-index:99998',
    'background:rgba(253,253,253,0.92)', 'backdrop-filter:saturate(180%) blur(14px)',
    '-webkit-backdrop-filter:saturate(180%) blur(14px)',
    'color:#0f1012', 'border-bottom:0.5px solid rgba(0,0,0,0.08)',
    'font-family:' + FONT, 'font-weight:350', 'letter-spacing:-0.02em',
    'font-size:12.5px', 'display:flex', 'align-items:center', 'flex-wrap:wrap', 'gap:8px',
    'padding:10px 14px'
  ].join(';');

  var back = document.createElement('a');
  back.href = '../index.html#' + cur;
  back.textContent = '← 전체 화면 목록';
  back.style.cssText = 'color:#0f1012;text-decoration:none;font-weight:400;background:rgba(0,113,227,0.08);border-radius:9999px;padding:7px 14px;white-space:nowrap;';

  var sel = document.createElement('select');
  sel.style.cssText = 'margin-left:auto;background:#fdfdfd;color:#0f1012;border:0.5px solid rgba(0,0,0,0.14);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:400;font-family:' + FONT + ';max-width:60vw;';
  SCREENS.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.t;
    o.style.color = '#0f1012';
    if (s.id === cur) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', function () { location.href = sel.value + '.html'; });

  bar.appendChild(back);
  bar.appendChild(sel);

  function mount() {
    if (document.body.firstChild) document.body.insertBefore(bar, document.body.firstChild);
    else document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
