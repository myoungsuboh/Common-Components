---
description: SlickGrid 공통 컴포넌트의 기반으로 slickgrid-vue 10.x(MIT)를 채택
tags: [decision]
---

# ADR-2026-07-31-slickgrid-vue-adoption: SlickGrid 기반 패키지로 slickgrid-vue 10.x 채택

- 기록일: 2026-07-31 11:48
- 상태: 승인됨
- 단계(Origin): dev (execute-dev)
- 관련 spec: 없음
- 관련 plan: 없음

## 맥락 (Context)

다른 프로젝트(마이그레이션 대상)에서 SlickGrid 사용이 요구되어, 여러 프로젝트에 재사용할 공통 그리드 컴포넌트를 이 저장소에 먼저 만들기로 했다. SlickGrid은 계보가 갈라져 있어 어느 것을 기반으로 삼는지가 이후 작업량을 결정한다. 원본 `mleibman/SlickGrid`은 2014년 이후 방치되었고, `6pac/SlickGrid`이 코어를 유지보수하며, 그 위에 `@slickgrid-universal/*`이 TypeScript로 재작성되어 있다. 이 저장소는 Vue 3.5.26 + Vuetify 기반이다.

## 결정 (Decision)

Vue 3 래퍼인 `slickgrid-vue@10.8.3`(MIT)을 기반으로 채택하고, 엑셀 내보내기용 `@slickgrid-universal/excel-export`와 CSS 테마 참조용 `@slickgrid-universal/common`을 직접 의존성으로 함께 고정한다.

## 고려한 대안 (Alternatives)

| 대안 | 장점 | 단점 | 채택 여부 |
|------|------|------|-----------|
| `slickgrid-vue` 10.x | 필터·에디터·포맷터·정렬·그룹핑·트리·엑셀이 이미 포함, Vue 3 래퍼 제공, MIT, peer `vue>=3.5` 충족 | v10이 breaking 메이저라 인터넷 예제 대부분(v5~v9)이 그대로 안 돌아감, 번들 증가 | 채택 |
| `6pac/SlickGrid` 코어 직접 사용 | 가장 가벼움, 완전한 제어 | 필터·에디터·포맷터·엑셀을 전부 자체 구현해야 함 → 작업량 과다 | 기각 |
| `@slickgrid-universal/vanilla-bundle` | 프레임워크 중립 | Vue 래퍼를 우리가 작성·유지해야 하고, 그 래퍼는 결국 slickgrid-vue의 재발명 | 기각 |
| 기존 RealGrid 계속 사용 | 이미 프로젝트에 설치되어 있음 | 상용 라이센스 키 필요(소스에 키가 박혀 있음), 마이그레이션 대상이 SlickGrid을 요구함 | 기각 (범위 밖) |

## 근거 (Rationale)

공통 컴포넌트의 가치는 "그리드 기능을 새로 만드는 것"이 아니라 "이미 있는 기능을 프로젝트 관례에 맞춰 쉽게 쓰게 하는 것"이다. 6pac 코어를 직접 쓰면 필터/에디터/포맷터/엑셀을 자체 구현해야 해서 핵심 가치와 무관한 작업량이 폭증한다. vanilla-bundle은 Vue 래퍼를 직접 만들어야 하는데 그것이 곧 slickgrid-vue와 같은 것이므로 재발명이다. MIT라서 RealGrid과 달리 라이센스 비용이 없다는 점도 여러 프로젝트 투입에 유리하다.

## 영향 (Consequences)

- 긍정: 필터/에디터/포맷터/정렬/그룹핑/트리/엑셀을 즉시 사용 가능. 라이센스 비용 0. 가상 스크롤로 대용량(실측 50만행) 처리.
- 트레이드오프/비용: 번들이 커진다(빌드 산출 JS 약 4.1MB / CSS 1.4MB — 다만 이 저장소는 쇼케이스 앱이라 RealGrid·TinyMCE·xlsx·Vuetify가 모두 포함된 수치). v10 breaking 때문에 구버전 예제를 그대로 복사하면 깨진다.
- 후속으로 따라오는 결정·제약:
  - 버전은 반드시 핀 고정하고 세 패키지(`slickgrid-vue`, `@slickgrid-universal/common`, `@slickgrid-universal/excel-export`)의 버전을 일치시킨다.
  - `@slickgrid-universal/common`은 CSS 테마 파일 경로를 import하기 위해 **직접 의존성으로 명시해야 한다.** pnpm의 strict isolation 때문에 전이 의존성으로는 top-level `node_modules`에 없어 CSS import가 실패한다.
  - 문서·예제를 참조할 때는 v10 기준인지 먼저 확인한다. 확실하지 않으면 `node_modules`의 `.d.ts`와 런타임 객체를 직접 확인한다(이번 작업에서 실제로 이 방법으로 API를 확정했다).
