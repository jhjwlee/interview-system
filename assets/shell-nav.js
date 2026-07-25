/* 화면을 단독으로 열었을 때만 상단에 "전체 화면 목록" 바를 붙입니다.
   허브(index.html)의 iframe 안에서는 아무것도 하지 않습니다. */
(function () {
  try { if (window.parent && window.parent !== window) return; } catch (e) { return; }

  var SCREENS = [
    { id: '00-workflow', t: '전체 워크플로우' },
    { id: '01-applicant-form', t: '입력폼 (신청자)' },
    { id: '03-interviewer-availability', t: '가용시간 등록 (인터뷰어)' },
    { id: '04-interviewer-approval', t: '슬롯 배정 확인 (인터뷰어)' },
    { id: '06-teams-approval', t: 'Teams 배정 확인 카드' },
    { id: '02-admin-booking', t: '예약시스템 (관리자)' },
    { id: '09-weekly-dashboard', t: '주간 수급 현황 (관리자)' },
    { id: '05-admin-helpdesk', t: '헬프데스크 (관리자)' },
    { id: '07-teams-reassign', t: 'Teams 재배정 알림' },
    { id: '08-teams-tab', t: 'Teams 탭 내장 화면' }
  ];

  var file = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var cur = decodeURIComponent(file);

  var bar = document.createElement('div');
  bar.setAttribute('data-shell-nav', '1');
  bar.style.cssText = [
    'position:sticky', 'top:0', 'z-index:99998',
    'background:#00241F', 'color:#fff',
    'font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif',
    'font-size:12px', 'display:flex', 'align-items:center', 'gap:10px',
    'padding:8px 14px', 'box-shadow:0 1px 6px rgba(0,0,0,0.2)'
  ].join(';');

  var back = document.createElement('a');
  back.href = '../index.html#' + cur;
  back.textContent = '← 전체 화면 목록';
  back.style.cssText = 'color:#fff;text-decoration:none;font-weight:700;background:rgba(255,255,255,0.15);border-radius:6px;padding:5px 11px;white-space:nowrap;';

  var sel = document.createElement('select');
  sel.style.cssText = 'margin-left:auto;background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.25);border-radius:6px;padding:5px 8px;font-size:11.5px;font-weight:600;max-width:60vw;';
  SCREENS.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.t;
    o.style.color = '#212121';
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
