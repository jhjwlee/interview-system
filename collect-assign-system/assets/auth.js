/* ============================================================
   VM 인터뷰 배정 시스템 (수집·배정형) — 인터뷰어·관리자 로그인
   실제 인증 서버 없이, VM부가 미리 등록해 둔 이메일 목록과 대조하는
   방식을 흉내 낸 시연용 로그인입니다.
   - 자원봉사자(지원자) 화면: 로그인 없이 누구나 접속
   - 인터뷰어 화면: 등록된 이메일로 로그인해야 접속 가능, 인터뷰어·FAQ만 이용
   - VM 관리자 화면: 등록된 관리자 이메일로 로그인해야 접속 가능, 모든 화면 이용 가능
   - 로그인이 성공하면 접속 로그를 남깁니다 (관리자 워크북의 "최근 활동 로그"에 표시)
   ============================================================ */
window.CAAuth = (function () {
  var SESSION_KEY = "vm2027_ca_session_v1";
  var LOG_KEY = "vm2027_ca_accesslog_v1";

  // VM부가 사전 등록한 인터뷰어·관리자 이메일 목록 (실제 운영 시 관리 화면에서 등록/삭제)
  var WHITELIST = [
    { email: "interviewer1@jw.org", name: "김민수", role: "interviewer" },
    { email: "interviewer2@jw.org", name: "이수진", role: "interviewer" },
    { email: "vm.admin@jw.org", name: "VM 관리자", role: "admin" }
  ];

  function normalize(email) {
    return (email || "").trim().toLowerCase();
  }

  function findAccount(email) {
    var n = normalize(email);
    for (var i = 0; i < WHITELIST.length; i++) {
      if (WHITELIST[i].email.toLowerCase() === n) return WHITELIST[i];
    }
    return null;
  }

  function recordLog(account) {
    // 별도 접속 로그 저장소 (프로그램적으로 조회 가능)
    try {
      var raw = localStorage.getItem(LOG_KEY);
      var logs = raw ? JSON.parse(raw) : [];
      logs.unshift({ email: account.email, name: account.name, role: account.role, at: Date.now() });
      if (logs.length > 200) logs.length = 200;
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (e) {}

    // 관리자 워크북의 "최근 활동 로그"에도 함께 남겨서 관리자가 바로 확인할 수 있게 합니다.
    try {
      if (window.CAStore) {
        var state = window.CAStore.load();
        var roleLabel = account.role === "admin" ? "VM 관리자" : "인터뷰어";
        window.CAStore.addLog(state, "[접속] " + account.name + "(" + roleLabel + ", " + account.email + ")님이 로그인했습니다.");
        window.CAStore.save(state);
      }
    } catch (e) {}
  }

  function login(email) {
    var account = findAccount(email);
    if (!account) return null;
    var session = { email: account.email, name: account.name, role: account.role, at: Date.now() };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    recordLog(account);
    return session;
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function getAccessLogs() {
    try {
      var raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  return {
    WHITELIST: WHITELIST,
    findAccount: findAccount,
    login: login,
    logout: logout,
    getSession: getSession,
    getAccessLogs: getAccessLogs
  };
})();
