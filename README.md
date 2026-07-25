# 인터뷰 예약 · 헬프데스크 시스템 목업 (2027 서울 국제대회 · VM)

화면 목업 9종을 하나의 사이트로 묶은 것입니다. 왼쪽 목록에서 역할별로 화면을 오가고,
전체 워크플로우 페이지에서 단계별로 각 화면으로 이동할 수 있습니다.

* 작성일: 2026.07.25 (인터뷰어 확인 → 예약 개방 순서 개정 반영)
* 원본 목업 5종 + 신규 4종(Teams 배정 확인 카드 · Teams 재배정 알림 · Teams 탭 내장 화면 · 전체 워크플로우)
  + 주간 수급 현황 대시보드

## 폴더 구조

```
index.html                                 허브 (사이드바 + 화면 표시)
screens/00-workflow.html                   전체 워크플로우 (개요)
screens/01-applicant-form.html             입력폼 — 신청자·문의자
screens/02-admin-booking.html              예약시스템 — VM 관리자
screens/03-interviewer-availability.html   가용시간 등록 — 인터뷰어
screens/04-interviewer-approval.html       슬롯 배정 확인 — 인터뷰어
screens/05-admin-helpdesk.html             헬프데스크 — VM 관리자
screens/06-teams-approval.html             Teams 배정 확인 카드 — 인터뷰어 (신규)
screens/07-teams-reassign.html             Teams 재배정 알림 — VM 관리자 (신규)
screens/08-teams-tab.html                  Teams 탭 내장 화면 (신규)
screens/09-weekly-dashboard.html           주간 인터뷰어·지원자 수급 현황
assets/teams.css                           Teams 화면 공용 스타일
assets/shell-nav.js                        화면을 단독으로 열었을 때의 상단 이동바
docs/design-background-manual.pdf          설계배경 · 사용메뉴얼
robots.txt / .nojekyll                     검색 노출 차단 / GitHub Pages 설정
```

## 어디서나 보게 올리는 방법 — GitHub Pages (약 5분)

브라우저만으로 끝낼 수 있고, 계정만 있으면 비용이 들지 않습니다.

1. **저장소 만들기** — github.com 로그인 → 우측 상단 `+` → **New repository**
   * Repository name: `sic2027-interview-mockup` (원하는 이름)
   * **Public** 선택 (Private은 무료 계정에서 Pages가 동작하지 않습니다)
   * `Create repository`
2. **파일 올리기** — 새 저장소 화면의 `uploading an existing file` 링크 클릭
   → 이 폴더 안의 **`index.html`, `screens`, `assets`, `docs`, `robots.txt`, `.nojekyll`** 을
   폴더째로 드래그&드롭 → 아래 `Commit changes`
   * 폴더 전체를 한 번에 끌어다 놓으면 하위 폴더 구조가 그대로 유지됩니다.
   * `.nojekyll` 이 안 올라가면(숨김 파일) 저장소에서 `Add file → Create new file` 로
     파일명 `.nojekyll` 만 만들고 빈 내용으로 커밋하면 됩니다.
3. **Pages 켜기** — 저장소 상단 `Settings` → 왼쪽 `Pages`
   * Source: **Deploy from a branch**
   * Branch: **main** / 폴더: **/ (root)** → `Save`
4. **1~2분 뒤 주소 확인** — 같은 Pages 화면 상단에 주소가 뜹니다.
   `https://<GitHub아이디>.github.io/sic2027-interview-mockup/`
   이 주소를 TFT·테크팀에 공유하면 PC·모바일 어디서나 열립니다.

### 수정·재배포

파일을 고친 뒤 같은 방법으로 다시 업로드(같은 파일명이면 덮어쓰기)하면 1~2분 안에 반영됩니다.
반영이 안 보이면 강제 새로고침(Windows `Ctrl+F5` / Mac `Cmd+Shift+R`)하세요.

### 공유 범위

* `robots.txt` 와 모든 페이지의 `noindex` 메타로 **검색 노출은 차단**되어 있습니다.
  주소를 아는 사람만 접근하는 형태입니다.
* 주소를 몰라도 못 들어오게 하려면 GitHub Pages로는 부족합니다.
  그 경우 Cloudflare Pages + Cloudflare Access(이메일 인증)로 올리면 지정한 사람만 볼 수 있습니다.

## 다른 배포 방법

| 방법 | 준비물 | 특징 |
| --- | --- | --- |
| GitHub Pages | GitHub 계정 | 무료·영구 주소, 수정 재배포 쉬움 (권장) |
| Cloudflare Pages | Cloudflare 계정 | 폴더 드래그&드롭, 이메일 인증(Access)으로 접근 제한 가능 |
| Netlify Drop | 없음(임시) / 계정(영구) | app.netlify.com/drop 에 폴더를 끌어다 놓으면 즉시 주소 생성 |
| 파일 그대로 공유 | 없음 | 폴더째 압축해 전달. 단, `index.html` 을 파일로 직접 열면 브라우저 보안 정책상 화면 표시가 막힐 수 있어 서버 업로드를 권합니다 |

## 참고

* 모든 화면은 목업입니다. 클릭 동작은 보이지만 실제 데이터는 저장되지 않고,
  새로고침하면 초기 상태로 돌아갑니다.
* 실제 구현은 SharePoint 목록 A(타임슬롯 마스터)·B(예약 접수대장)·C(인터뷰어 가용시간, 신규)와
  Power Automate 흐름으로 연결해야 완성됩니다.
* 테크팀 확인 필요 항목: 인터뷰어 확인 → 슬롯 공개 전환 방식, 동시 접수 시 잔여석 동시성,
  확정 안내·Zoom 링크 발송 시점, 목록 C 컬럼 설계.
