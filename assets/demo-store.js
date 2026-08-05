/* ============================================================
   VM 인터뷰 예약·헬프데스크 — 연동 데모용 공유 저장소
   브라우저 localStorage를 실제 저장소(시트·DB)를 흉내낸 임시 데이터베이스로
   사용합니다. 같은 브라우저 안에서 화면을 옮겨 다니면 여기서 바뀐 내용이
   이어서 보입니다.
   ※ 실제 서버·DB가 아닌 시연용 시뮬레이션입니다.
   ============================================================ */
window.DemoStore = (function () {
  var KEY = "vm2027_interview_demo_v2";
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];

  function seed() {
    return {
      slots: [
        { id: "SLOT-0803-01", date: "2026-08-03", time: "10:00", status: "모집중", plannedCap: 3, cap: 3, booked: 3, interviewer: "김민수" },
        { id: "SLOT-0803-02", date: "2026-08-03", time: "10:30", status: "모집중", plannedCap: 3, cap: 3, booked: 2, interviewer: "이수진" },
        { id: "SLOT-0803-03", date: "2026-08-03", time: "11:00", status: "모집중", plannedCap: 3, cap: 3, booked: 1, interviewer: "이수진" },
        { id: "SLOT-0804-02", date: "2026-08-04", time: "10:30", status: "모집중", plannedCap: 3, cap: 3, booked: 3, interviewer: "박지훈" }
      ],
      reservations: [
        { id: "R-1001", name: "김OO", email: "applicant01@email.com", kind: "개인", slotId: "SLOT-0803-02", slotLabel: "SLOT-0803-02 · 10:30", status: "확정", zoomSent: true, at: "07.24 21:12" },
        { id: "R-1002", name: "이OO · 박OO", email: "couple02@email.com", kind: "부부", slotId: "SLOT-0803-01", slotLabel: "SLOT-0803-01 · 10:00", status: "확정", zoomSent: true, at: "07.24 20:55" },
        { id: "R-1004", name: "정OO", email: "applicant04@email.com", kind: "개인", slotId: "SLOT-0803-03", slotLabel: "SLOT-0803-03 · 11:00", status: "취소", zoomSent: false, at: "07.23 14:20" }
      ],
      // 인터뷰어가 등록한 "날짜별 최대 가능 횟수" — 관리자가 이 한도 안에서 실제 시간대(슬롯)를 만듭니다.
      capacity: [
        { id: "CAP-20260805-김민수", date: "2026-08-05", interviewer: "김민수", email: "interviewer1@jw.org", maxCount: 4, used: 0, at: "07.30 10:00" },
        { id: "CAP-20260806-이수진", date: "2026-08-06", interviewer: "이수진", email: "interviewer2@jw.org", maxCount: 3, used: 0, at: "07.30 10:05" }
      ],
      helpdesk: [],
      faq: [
        { id: "F-1", q: "예약 가능한 기간은 언제까지인가요?", a: "오늘로부터 최대 2개월 이내의 날짜만 예약하실 수 있습니다. 그 이후 기간은 아직 준비 중입니다.", at: "" },
        { id: "F-2", q: "제출한 예약을 수정하고 싶습니다.", a: "이 화면에서는 직접 수정할 수 없습니다. 문의하기 화면으로 변경 내용을 남겨 주시면 담당자가 반영해 드립니다.", at: "" },
        { id: "F-3", q: "인터뷰 확정 안내는 어떻게 받나요?", a: "예약이 확정되면 입력하신 이메일 주소로 확정 안내와 접속 링크를 보내드립니다.", at: "" }
      ],
      log: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (!parsed.capacity) parsed.capacity = [];
        if (!parsed.faq) parsed.faq = seed().faq;
        if (!parsed.helpdesk) parsed.helpdesk = [];
        return parsed;
      }
    } catch (e) {}
    var s = seed();
    save(s);
    return s;
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    var s = seed();
    save(s);
    return s;
  }

  function addLog(state, msg) {
    state.log.unshift({ msg: msg, at: nowLabel() });
    if (state.log.length > 40) state.log.length = 40;
  }

  function nowLabel() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return p(d.getMonth() + 1) + "." + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function fmtDateLabel(dstr) {
    var d = new Date(dstr + "T00:00:00");
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일(" + DOW[d.getDay()] + ")";
  }

  function fmtDateShort(dstr) {
    var d = new Date(dstr + "T00:00:00");
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return p(d.getMonth() + 1) + "." + p(d.getDate()) + "(" + DOW[d.getDay()] + ")";
  }

  // 슬롯ID 규칙 — 날짜+시간을 그대로 ID로 사용
  function slotIdFor(dstr, t) {
    var mmdd = dstr.slice(0, 4) + dstr.slice(5, 7) + dstr.slice(8, 10);
    return mmdd + "_" + t.replace(":", "");
  }

  function findSlot(state, id) {
    for (var i = 0; i < state.slots.length; i++) if (state.slots[i].id === id) return state.slots[i];
    return null;
  }

  // 가용성(용량) ID 규칙 — 날짜+인터뷰어이름
  function capacityIdFor(dstr, name) {
    var mmdd = dstr.slice(0, 4) + dstr.slice(5, 7) + dstr.slice(8, 10);
    return "CAP-" + mmdd + "-" + name;
  }

  function findCapacity(state, id) {
    for (var i = 0; i < state.capacity.length; i++) if (state.capacity[i].id === id) return state.capacity[i];
    return null;
  }

  // 오늘부터 최대 N개월 뒤까지의 연·월(YYYYMM 숫자) 범위
  function monthRange(monthsAhead) {
    var now = new Date();
    var minYM = now.getFullYear() * 12 + now.getMonth();
    var future = new Date(now.getFullYear(), now.getMonth() + monthsAhead, now.getDate());
    var maxYM = future.getFullYear() * 12 + future.getMonth();
    return { minYM: minYM, maxYM: maxYM, todayYear: now.getFullYear(), todayMonth: now.getMonth(), todayDate: now.getDate() };
  }

  return {
    load: load, save: save, reset: reset, seed: seed,
    addLog: addLog, nowLabel: nowLabel,
    fmtDateLabel: fmtDateLabel, fmtDateShort: fmtDateShort,
    slotIdFor: slotIdFor, findSlot: findSlot,
    capacityIdFor: capacityIdFor, findCapacity: findCapacity,
    monthRange: monthRange, DOW: DOW
  };
})();
