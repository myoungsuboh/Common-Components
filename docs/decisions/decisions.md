---
description: 의사결정(ADR) 색인 — 왜 그렇게 했는지. AI 빠른 인덱싱용.
---

# Decisions Index

| ADR ID | Decision | 단계(Origin) | Created At | Status | File |
|--------|----------|--------------|------------|--------|------|
| ADR-2026-07-31-slickgrid-vue-adoption | SlickGrid 기반 패키지로 slickgrid-vue 10.x(MIT) 채택 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-slickgrid-vue-adoption.md](2026-07-31-slickgrid-vue-adoption.md) |
| ADR-2026-07-31-grid-customization-4-layers | 커스터마이징을 축약·통과·슬롯·탈출구 4계층으로 설계하고 컴포넌트 폴더를 Vuetify 비의존으로 격리 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-grid-customization-4-layers.md](2026-07-31-grid-customization-4-layers.md) |
| ADR-2026-07-31-grid-autoresize-container-sizing | enableAutoResize를 끄지 않고 컨테이너 기준으로 크기 계산, 높이 고정은 min/maxHeight로 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-grid-autoresize-container-sizing.md](2026-07-31-grid-autoresize-container-sizing.md) |
| ADR-2026-07-31-slickgrid-theme-css-variable-override | 테마는 CSS 변수 오버라이드로 덮고 변수 실존은 var() 참조로 검증 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-slickgrid-theme-css-variable-override.md](2026-07-31-slickgrid-theme-css-variable-override.md) |
| ADR-2026-07-31-custom-pagination-isolated-app | 커스텀 페이지네이션을 순수 HTML/CSS 단일 루트로 만들고 설정은 gridOptions로 전달 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-custom-pagination-isolated-app.md](2026-07-31-custom-pagination-isolated-app.md) |
| ADR-2026-07-31-grid-cell-interaction-protocol | 셀 안 컴포넌트 클릭을 data-sg-action / data-sg-toggle 규약으로 이벤트화하고 행 클릭과 격리 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-grid-cell-interaction-protocol.md](2026-07-31-grid-cell-interaction-protocol.md) |
| ADR-2026-07-31-grid-korean-data-safety | yn 에디터를 singleSelect로, 엑셀 내보내기 format을 xlsx로 고정 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-grid-korean-data-safety.md](2026-07-31-grid-korean-data-safety.md) |
| ADR-2026-07-31-grid-cell-url-allowlist | 이미지·링크·첨부 셀 URL을 화이트리스트로 검사해 위험 스킴 차단 | dev (execute-dev) | 2026-07-31 11:48 | 승인됨 | [2026-07-31-grid-cell-url-allowlist.md](2026-07-31-grid-cell-url-allowlist.md) |
| ADR-2026-07-31-library-extension-point-workarounds | 라이브러리 확장점이 없거나 동작하지 않을 때의 우회 방식과 3가지 규칙 | dev (execute-dev) | 2026-07-31 14:29 | 승인됨 | [2026-07-31-library-extension-point-workarounds.md](2026-07-31-library-extension-point-workarounds.md) |
| ADR-2026-07-31-avoid-nested-vuetify-tabs | 데모 페이지 섹션 전환에 Vuetify 탭 중첩 대신 자체 버튼바 + v-if 사용 | dev (execute-dev) | 2026-07-31 14:29 | 승인됨 | [2026-07-31-avoid-nested-vuetify-tabs.md](2026-07-31-avoid-nested-vuetify-tabs.md) |
| ADR-2026-08-10-devextreme-grid-adoption | DevExtreme DataGrid을 SlickGrid과 동일한 축약 문법·4계층 구조의 별도 컴포넌트로 추가, 라이선스 키는 환경변수로만 주입 | dev (execute-dev) | 2026-08-10 09:45 | 승인됨 | [2026-08-10-devextreme-grid-adoption.md](2026-08-10-devextreme-grid-adoption.md) |
| ADR-2026-08-10-devextreme-inline-style-and-measured-layout | 인라인 style은 클래스+!important로 덮고, 적응형 판정에 측정되는 요소의 width·margin은 건드리지 않는다 | dev (execute-dev) | 2026-08-10 09:45 | 승인됨 | [2026-08-10-devextreme-inline-style-and-measured-layout.md](2026-08-10-devextreme-inline-style-and-measured-layout.md) |
| ADR-2026-08-10-devextreme-removed-public-api | 사라진 grid.exportToExcel() 대신 내보내기 로직을 함수로 분리해 툴바와 노출 API가 같은 경로를 쓰게 함 | dev (execute-dev) | 2026-08-10 09:45 | 승인됨 | [2026-08-10-devextreme-removed-public-api.md](2026-08-10-devextreme-removed-public-api.md) |
| ADR-2026-08-10-devextreme-fit-width-proportional | 표를 컨테이너 폭에 채우는 fitWidth 를 기본으로 켜고, 한 컬럼 흡수 대신 px→% 비율 유지 방식을 채택 | dev (execute-dev) | 2026-08-10 10:45 | 승인됨 | [2026-08-10-devextreme-fit-width-proportional.md](2026-08-10-devextreme-fit-width-proportional.md) |
| ADR-2026-08-10-custom-control-outside-library-widget | 라이브러리 위젯이 다시 그리는 영역에 우리 DOM 을 넣지 않고 래퍼가 소유한 요소를 겹쳐 놓는다 | dev (execute-dev) | 2026-08-10 10:45 | 승인됨 | [2026-08-10-custom-control-outside-library-widget.md](2026-08-10-custom-control-outside-library-widget.md) |
| ADR-2026-08-10-row-number-continuous-across-pages | 행번호를 페이지·스크롤에 걸쳐 연속되게 바꾸고, 공개 API로 불가능한 값만 비공개 getter를 방어적으로 읽는 조건을 정함 | dev (execute-dev) | 2026-08-10 11:35 | 승인됨 | [2026-08-10-row-number-continuous-across-pages.md](2026-08-10-row-number-continuous-across-pages.md) |
