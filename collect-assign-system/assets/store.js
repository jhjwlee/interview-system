/* ============================================================
   VM 인터뷰 배정 — 수집·배정형 데모 공유 저장소
   실제로는 Excel 워크북 5개 시트(①슬롯마스터~⑤헬프데스크)가 하는 역할을
   브라우저 localStorage로 흉내 냅니다. "배정 실행" 버튼은
   scripts/assignment-office-script.ts와 동일한 로직을 자바스크립트로 옮긴 것입니다.
   ※ 실제 Excel Office Script가 아닌 시연용 시뮬레이션입니다.
   ============================================================ */
window.CAStore = (function () {
  var KEY = "vm2027_collectassign_demo_v1";
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];

  function seedSlots() {
    var days = ["2026-10-06", "2026-10-07", "2026-10-08"];
    var times = ["10:00", "10:30", "11:00", "14:00"];
    var slots = [];
    days.forEach(function (d) {
      times.forEach(function (t) {
        var mmdd = d.slice(0, 4) + d.slice(5, 7) + d.slice(8, 10);
        slots.push({ id: mmdd + "_" + t.replace(":", ""), date: d, time: t, cap: 3, booked: 0, interviewer: "", status: "배정검토중" });
      });
    });
    return slots;
  }

  function seedFaq() {
    return [
      { id: "F-1", q: "희망 부서와 다른 부서를 추천받을 수 있습니까?", a: "네. 인터뷰 중 형제자매의 은사와 필요를 함께 살펴보고, 더 적합한 부서가 있다면 담당자가 제안드릴 수 있습니다. 최종 배치는 본인과의 상의를 거쳐 결정됩니다.", at: nowLabel() },
      { id: "F-2", q: "1순위 희망만 기록해도 됩니까?", a: "가능합니다. 다만 2~3순위까지 함께 알려주시면 일정 조율이 더 수월합니다.", at: nowLabel() },
      { id: "F-3", q: "제출한 가능 시간이 왜 바로 확정되지 않나요?", a: "이 시스템은 예약형이 아니라 수집·배정형입니다. 여러 사람이 제출한 가능 시간을 담당자가 모아서 한 번에 배정하기 때문에, 제출 즉시가 아니라 배정 실행 이후에 결과가 정해집니다.", at: nowLabel() },
      { id: "F-4", q: "언제 배정 결과를 알 수 있나요?", a: "담당자가 배정을 실행하고 최종 확인을 마친 뒤 개별 연락(이메일 또는 JW Hub 공식 채널)으로 안내드립니다. 자동 발송은 사용하지 않습니다.", at: nowLabel() },
      { id: "F-5", q: "가족(부부)이 함께 인터뷰를 받고 싶습니다.", a: "제출 화면에서 \"부부가 함께 받습니다\"를 선택해 주세요. 담당자가 배정 시 함께 진행되도록 조율합니다.", at: nowLabel() },
      { id: "F-6", q: "제출 후 내용을 수정하고 싶습니다.", a: "이 화면에서는 직접 수정할 수 없습니다. 문의하기 화면으로 변경 내용을 남겨 주시면 담당자가 반영해 드립니다.", at: nowLabel() }
    ];
  }

  function seed() {
    return {
      slots: seedSlots(),
      availability: [], // 인터뷰어 제출 원본 (②시트)
      applicants: [],   // 지원자 제출 원본 (③시트)
      helpdesk: [],     // ⑤시트
      faq: seedFaq(),   // 자주 묻는 질문 (수작업 등록/삭제 가능)
      log: [],
      lastRun: null
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (!parsed.faq) parsed.faq = seedFaq(); // 이전 버전 데모 데이터와의 호환
        return parsed;
      }
    } catch (e) {}
    var s = seed();
    save(s);
    return s;
  }
  function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} var s = seed(); save(s); return s; }

  function nowLabel() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return p(d.getMonth() + 1) + "." + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function addLog(state, msg) {
    state.log.unshift({ msg: msg, at: nowLabel() });
    if (state.log.length > 40) state.log.length = 40;
  }
  function fmtDateShort(dstr) {
    var d = new Date(dstr + "T00:00:00");
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return p(d.getMonth() + 1) + "." + p(d.getDate()) + "(" + DOW[d.getDay()] + ")";
  }

  /* ---------- 배정 실행 — assignment-office-script.ts 와 동일 로직 ---------- */
  function runAssignment(state) {
    var slotByKey = {};
    state.slots.forEach(function (s) { slotByKey[s.date + "_" + s.time] = s; });

    // 1) 인터뷰어 가용시간 -> 슬롯 배정
    var dailyCount = {};
    state.availability.forEach(function (a) {
      a.dates.forEach(function (d) {
        var dayKey = a.email + "|" + d;
        a.times.forEach(function (t) {
          var already = dailyCount[dayKey] || 0;
          if (already >= (a.maxDay || 99)) return;
          var slot = slotByKey[d + "_" + t];
          if (!slot) return;
          if (slot.interviewer) return;
          slot.interviewer = a.name;
          slot.status = "모집중";
          dailyCount[dayKey] = already + 1;
        });
      });
    });

    // 2) 지원자 배정 (가능시간 적은 순)
    var order = state.applicants
      .map(function (row, i) { return { row: row, count: (row.times || []).length }; })
      .sort(function (a, b) { return a.count - b.count; });

    order.forEach(function (o) {
      var row = o.row;
      if (row.slotId) return;
      var assigned = false;
      (row.times || []).some(function (w) {
        var spaceIdx = w.indexOf(" ");
        if (spaceIdx === -1) return false;
        var d = w.slice(0, spaceIdx), t = w.slice(spaceIdx + 1);
        var slot = slotByKey[d + "_" + t];
        if (!slot) return false;
        if (!slot.interviewer) return false;
        if (slot.booked >= slot.cap) return false;
        slot.booked += 1;
        var remain = slot.cap - slot.booked;
        slot.status = remain <= 0 ? "마감" : (remain / slot.cap <= 0.34 ? "마감임박" : "모집중");
        row.slotId = slot.id;
        row.status = "배정완료";
        assigned = true;
        return true;
      });
      if (!assigned) row.status = "수동조율필요";
    });

    var successCount = state.applicants.filter(function (r) { return r.status === "배정완료"; }).length;
    var manualCount = state.applicants.filter(function (r) { return r.status === "수동조율필요"; }).length;
    state.lastRun = nowLabel();
    addLog(state, "배정 실행 — 배정완료 " + successCount + "건 · 수동조율필요 " + manualCount + "건");
    return { successCount: successCount, manualCount: manualCount };
  }

  return { load: load, save: save, reset: reset, seed: seed, addLog: addLog, nowLabel: nowLabel, fmtDateShort: fmtDateShort, runAssignment: runAssignment, DOW: DOW };
})();
