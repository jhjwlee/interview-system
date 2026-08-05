/* ============================================================
   VM 인터뷰 예약 시스템 — 인터뷰어·관리자 로그인 데모
   실제 인증 서버 없이, VM부가 미리 등록해 둔 이메일 목록과 대조하는
   방식을 흉내 낸 시연용 로그인입니다. 신청자 화면은 로그인 없이 누구나
   접속할 수 있고, 인터뷰어·관리자 화면만 이 로그인을 거칩니다.
   ============================================================ */
window.DemoAuth = (function () {
  var SESSION_KEY = "vm2027_session_v1";

  // VM부가 사전 등록한 인터뷰어·관리자 이메일 목록 (실제 운영 시 관리 화면에서 등록/삭제)
  var WHITELIST = [
    { email: "interviewer1@jw.org", name: "김민수", role: "interviewer" },
    { email: "interviewer2@jw.org", name: "이수진", role: "interviewer" },
    { email: "interviewer3@jw.org", name: "박지훈", role: "interviewer" },
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

  function login(email) {
    var account = findAccount(email);
    if (!account) return null;
    var session = { email: account.email, name: account.name, role: account.role, at: Date.now() };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
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

  // 로그인이 안 되어 있거나 역할이 다르면 login.html로 돌려보냅니다.
  // allowedRoles를 생략하면 로그인 여부만 확인합니다.
  function requireRole(allowedRoles) {
    var s = getSession();
    if (!s || (allowedRoles && allowedRoles.indexOf(s.role) === -1)) {
      var back = encodeURIComponent(location.pathname.split('/').pop());
      location.href = "login.html?next=" + back;
      return null;
    }
    return s;
  }

  return {
    WHITELIST: WHITELIST,
    findAccount: findAccount,
    login: login,
    logout: logout,
    getSession: getSession,
    requireRole: requireRole
  };
})();
