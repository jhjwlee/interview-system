/**
 * VM 인터뷰 배정 자동화 — Excel Office Script
 * ------------------------------------------------------------
 * 실행 방법: Excel Online에서 워크북(VM_인터뷰_배정관리.xlsx)을 열고
 * 상단 "자동화" 탭 → "새 스크립트"에 이 파일 내용을 그대로 붙여넣은 뒤 저장합니다.
 * 이후에는 "자동화" 탭에서 이 스크립트를 클릭 한 번으로 실행할 수 있습니다.
 * (Power Automate 예약 실행 없이, 담당자가 필요할 때 직접 실행하는 방식입니다 —
 *  베델 계정 없이도 사용 가능합니다. 자세한 설계 배경은
 *  2026.07.26_인터뷰시스템_베델계정불가_재구성안.docx 2-3절을 참고하세요.)
 *
 * 전제 — 워크북 시트 구성 (5개, 시트명이 정확히 일치해야 합니다)
 *   ①슬롯마스터   : 슬롯ID | 날짜 | 시간 | 정원 | 현재예약 | 배정인터뷰어 | 상태
 *   ②인터뷰어가용시간 : 이름 | 이메일 | 1일최대건수 | 가능날짜 | 가능시간
 *     - 가능날짜·가능시간은 세미콜론(;)으로 구분된 여러 값입니다. 예: "2026-08-03;2026-08-04"
 *     - 두 목록의 모든 조합(날짜 × 시간)을 가능한 것으로 간주합니다. Forms 응답을
 *       그대로 붙여넣으면 되도록 이렇게 설계했습니다(날짜별로 다른 시간을 받는
 *       세밀한 조합은 지원하지 않습니다 — 필요하면 응답을 여러 행으로 나눠 붙여넣으세요).
 *   ③지원자접수   : 접수ID | 이름 | 이메일 | 구분 | 가능시간 | 배정슬롯ID | 상태
 *     - 가능시간은 세미콜론으로 구분된 "YYYY-MM-DD HH:MM" 값들입니다.
 *       예: "2026-08-03 10:00;2026-08-04 14:00"
 *     - 이 세미콜론 구분 형식은 Forms 다중 선택 응답이 Excel로 내보내질 때 실제로
 *       저장되는 형식과 일치함을 테크팀이 확인했습니다(2026.07.27). 코드 변경 불필요.
 *
 * 실행 시 주의사항 — 테크팀 답변(2026.07.27) 반영
 *   - 처리 속도: 약 20행에 30초 소요(상한선은 없음). 한 번에 몰아서 실행하기보다
 *     자주(소량씩) 실행하는 것을 권장합니다.
 *   - 동시 접근: 실행 중 워크북을 "보는" 것은 안전하지만, 같은 시간에 데이터를
 *     "수정·추가"하면 예기치 않은 문제가 생길 수 있습니다. 실행 직전 다른 담당자에게
 *     잠시 편집을 멈춰 달라고 안내하세요.
 *   - 실행 권한: 베델 계정 보유자는 이 화면(자동화 탭)에서 직접 실행할 수 있습니다.
 *     그 외 계정은 Power Automate와 연결된 목록(List)에 항목을 추가하는 방식으로
 *     실행을 트리거할 수 있습니다(별도 설정 필요).
 *   ④배정결과     : 스크립트가 실행할 때마다 다시 만드는 요약표(수식 없음, 값만)
 *   ⑤헬프데스크   : 이 스크립트가 다루지 않는 시트입니다(그대로 둡니다)
 *
 * 배정 로직 — 2026.07.26 대응 전략 문서 3-2절의 보완안 반영
 *   1) 인터뷰어 가용시간을 슬롯마스터의 빈 슬롯에 채웁니다(1일 최대건수를 넘기지 않음).
 *   2) 지원자는 "가능시간 개수가 적은 사람"부터 먼저 배정합니다(테크팀 제안 로직).
 *   3) 이미 다른 인터뷰어가 배정된 슬롯, 정원이 찬 슬롯은 건너뜁니다.
 *   4) 끝까지 배정받지 못한 지원자는 "수동조율필요"로 표시해 담당자가 4단계에서
 *      우선 처리하도록 합니다.
 *   5) 재실행해도 이미 배정된 지원자·인터뷰어는 건드리지 않습니다(안전하게 여러 번 실행 가능).
 */

function main(workbook: ExcelScript.Workbook) {
  const SHEET_SLOT = "①슬롯마스터";
  const SHEET_AVAIL = "②인터뷰어가용시간";
  const SHEET_APPLICANT = "③지원자접수";
  const SHEET_RESULT = "④배정결과";

  const slotWs = workbook.getWorksheet(SHEET_SLOT);
  const availWs = workbook.getWorksheet(SHEET_AVAIL);
  const applicantWs = workbook.getWorksheet(SHEET_APPLICANT);
  const resultWs = workbook.getWorksheet(SHEET_RESULT);

  const colIndex = (header: string[], name: string): number => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`컬럼을 찾을 수 없습니다: ${name} (시트 헤더를 확인하세요)`);
    return i;
  };
  const splitList = (v: unknown): string[] =>
    String(v ?? "").split(";").map(s => s.trim()).filter(s => s.length > 0);

  // ---------- 1. 슬롯마스터 로드 ----------
  const slotRange = slotWs.getUsedRange();
  const slotValues = slotRange.getValues();
  const slotHeader = slotValues[0] as string[];
  const cSlotId = colIndex(slotHeader, "슬롯ID");
  const cDate = colIndex(slotHeader, "날짜");
  const cTime = colIndex(slotHeader, "시간");
  const cCap = colIndex(slotHeader, "정원");
  const cBooked = colIndex(slotHeader, "현재예약");
  const cInterviewer = colIndex(slotHeader, "배정인터뷰어");
  const cStatus = colIndex(slotHeader, "상태");

  const slots = slotValues.slice(1);
  const slotKey = (d: string, t: string) => `${d}_${t}`;
  const slotIndexByKey = new Map<string, number>();
  slots.forEach((row, i) => slotIndexByKey.set(slotKey(String(row[cDate]), String(row[cTime])), i));

  // ---------- 2. 인터뷰어 가용시간 → 슬롯 배정 ----------
  const availValues = availWs.getUsedRange().getValues();
  const availHeader = availValues[0] as string[];
  const aName = colIndex(availHeader, "이름");
  const aEmail = colIndex(availHeader, "이메일");
  const aMaxDay = colIndex(availHeader, "1일최대건수");
  const aDates = colIndex(availHeader, "가능날짜");
  const aTimes = colIndex(availHeader, "가능시간");

  const dailyCount = new Map<string, number>(); // `${email}|${date}` -> 오늘 배정된 건수

  for (const row of availValues.slice(1)) {
    const name = String(row[aName] ?? "");
    const email = String(row[aEmail] ?? "");
    if (!name || !email) continue;
    const maxDay = Number(row[aMaxDay]) || 99;
    const dates = splitList(row[aDates]);
    const times = splitList(row[aTimes]);

    for (const d of dates) {
      const dayKey = `${email}|${d}`;
      for (const t of times) {
        const already = dailyCount.get(dayKey) ?? 0;
        if (already >= maxDay) continue;
        const idx = slotIndexByKey.get(slotKey(d, t));
        if (idx === undefined) continue; // 슬롯마스터에 미리 정의되지 않은 시간대는 건너뜀
        if (slots[idx][cInterviewer]) continue; // 이미 다른 인터뷰어가 배정된 슬롯
        slots[idx][cInterviewer] = name;
        slots[idx][cStatus] = "모집중";
        dailyCount.set(dayKey, already + 1);
      }
    }
  }

  // ---------- 3. 지원자 배정 (가능시간이 적은 순으로 우선) ----------
  const appValues = applicantWs.getUsedRange().getValues();
  const appHeader = appValues[0] as string[];
  const pName = colIndex(appHeader, "이름");
  const pEmail = colIndex(appHeader, "이메일");
  const pTimes = colIndex(appHeader, "가능시간");
  const pSlotId = colIndex(appHeader, "배정슬롯ID");
  const pStatus = colIndex(appHeader, "상태");

  const applicants = appValues.slice(1);
  const order = applicants
    .map((row, i) => ({ row, i, count: splitList(row[pTimes]).length }))
    .sort((a, b) => a.count - b.count);

  for (const { row } of order) {
    if (row[pSlotId]) continue; // 이미 배정된 건은 재실행 시 건드리지 않음
    const wants = splitList(row[pTimes]);
    let assigned = false;
    for (const w of wants) {
      const spaceIdx = w.indexOf(" ");
      if (spaceIdx === -1) continue;
      const d = w.slice(0, spaceIdx);
      const t = w.slice(spaceIdx + 1);
      const idx = slotIndexByKey.get(slotKey(d, t));
      if (idx === undefined) continue;
      if (!slots[idx][cInterviewer]) continue; // 인터뷰어가 아직 배정되지 않은 슬롯은 열리지 않음
      const cap = Number(slots[idx][cCap]) || 0;
      const booked = Number(slots[idx][cBooked]) || 0;
      if (booked >= cap) continue;

      slots[idx][cBooked] = booked + 1;
      const remain = cap - (booked + 1);
      slots[idx][cStatus] = remain <= 0 ? "마감" : (remain / cap <= 0.34 ? "마감임박" : "모집중");
      row[pSlotId] = String(slots[idx][cSlotId]);
      row[pStatus] = "배정완료";
      assigned = true;
      break;
    }
    if (!assigned) row[pStatus] = "수동조율필요";
  }

  // ---------- 4. 변경사항 저장 ----------
  slotRange.setValues([slotHeader, ...slots]);
  applicantWs.getUsedRange().setValues([appHeader, ...applicants]);

  // ---------- 5. 배정결과 시트 재작성 ----------
  const resultHeader = ["접수ID", "지원자명", "이메일", "배정슬롯ID", "배정날짜", "배정시간", "배정인터뷰어", "통지여부", "확정"];
  const resultRows: (string | number)[][] = [];
  applicants.forEach((row, i) => {
    if (!row[pSlotId]) return;
    const slotRow = slots.find(s => String(s[cSlotId]) === String(row[pSlotId]));
    resultRows.push([
      `A-${i + 1}`,
      String(row[pName]),
      String(row[pEmail]),
      String(row[pSlotId]),
      slotRow ? String(slotRow[cDate]) : "",
      slotRow ? String(slotRow[cTime]) : "",
      slotRow ? String(slotRow[cInterviewer]) : "",
      "",
      ""
    ]);
  });

  const existingResultRange = resultWs.getUsedRange();
  if (existingResultRange) existingResultRange.clear();
  const outRange = resultWs.getRangeByIndexes(0, 0, resultRows.length + 1, resultHeader.length);
  outRange.setValues([resultHeader, ...resultRows]);

  // ---------- 6. 요약 로그 ----------
  const successCount = applicants.filter(r => r[pStatus] === "배정완료").length;
  const manualCount = applicants.filter(r => r[pStatus] === "수동조율필요").length;
  console.log(`배정 완료: ${successCount}건 · 수동 조율 필요: ${manualCount}건 (담당자 확인 후 ④배정결과 시트에서 "확정" 표시를 해 주세요)`);
}
