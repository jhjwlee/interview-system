/* ============================================================
   VM 인터뷰 예약·헬프데스크 — 연동 데모용 공유 저장소
   브라우저 localStorage를 SharePoint 목록 A(타임슬롯)·B(예약)·C(가용시간)를
   흉내 낸 임시 데이터베이스로 사용합니다. 같은 브라우저 안에서 화면을
   옮겨 다니면(허브 사이드바 이동 포함) 여기서 바뀐 내용이 이어서 보입니다.
   ※ 실제 SharePoint·Power Automate가 아닌 시연용 시뮬레이션입니다.
   ============================================================ */
window.DemoStore = (function () {
  var KEY = "vm2027_interview_demo_v1";
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];

  function seed() {
    return {
      slots: [
        { id: "SLOT-0803-01", date: "2026-08-03", time: "10:00", status: "모집중", plannedCap: 3, cap: 3, booked: 3, interviewer: "김민수" },
        { id: "SLOT-0803-02", date: "2026-08-03", time: "10:30", status: "모집중", plannedCap: 3, cap: 3, booked: 2, interviewer: "이수진" },
        { id: "SLOT-0803-03", date: "2026-08-03", time: "11:00", status: "모집중", plannedCap: 3, cap: 3, booked: 1, interviewer: "이수진" },
        { id: "SLOT-0804-02", date: "2026-08-04", time: "10:30", status: "모집중", plannedCap: 3, cap: 3, booked: 3, interviewer: "박지훈" },
        { id: "SLOT-0804-01", date: "2026-08-04", time: "10:00", status: "배정검토중", plannedCap: 3, cap: 0, booked: 0, interviewer: "" }
      ],
      reservations: [
        { id: "R-1001", name: "김OO", email: "applicant01@email.com", kind: "개인", slotId: "SLOT-0803-02", slotLabel: "SLOT-0803-02 · 10:30", status: "확정", zoomSent: true, at: "07.24 21:12" },
        { id: "R-1002", name: "이OO · 박OO", email: "couple02@email.com", kind: "부부", slotId: "SLOT-0803-01", slotLabel: "SLOT-0803-01 · 10:00", status: "확정", zoomSent: true, at: "07.24 20:55" },
        { id: "R-1003", name: "최OO", email: "applicant03@email.com", kind: "개인", slotId: "SLOT-0804-01", slotLabel: "SLOT-0804-01 · 10:00", status: "대기", zoomSent: false, at: "07.25 09:03" },
        { id: "R-1004", name: "정OO", email: "applicant04@email.com", kind: "개인", slotId: "SLOT-0803-03", slotLabel: "SLOT-0803-03 · 11:00", status: "취소", zoomSent: false, at: "07.23 14:20" }
      ],
      availability: [],
      approvals: [
        { date: "08.02(일)", time: "11:00", cap: "3명", result: "approved" },
        { date: "08.02(일)", time: "10:30", cap: "3명", result: "approved" },
        { date: "08.01(토)", time: "14:00", cap: "2명", result: "rejected" }
      ],
      log: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
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

  // 슬롯ID 규칙 — 구축 가이드 1-1과 동일: 날짜+시간을 그대로 ID로 사용
  function slotIdFor(dstr, t) {
    var mmdd = dstr.slice(0, 4) + dstr.slice(5, 7) + dstr.slice(8, 10);
    return mmdd + "_" + t.replace(":", "");
  }

  function findSlot(state, id) {
    for (var i = 0; i < state.slots.length; i++) if (state.slots[i].id === id) return state.slots[i];
    return null;
  }

  return {
    load: load, save: save, reset: reset, seed: seed,
    addLog: addLog, nowLabel: nowLabel,
    fmtDateLabel: fmtDateLabel, fmtDateShort: fmtDateShort,
    slotIdFor: slotIdFor, findSlot: findSlot, DOW: DOW
  };
})();
