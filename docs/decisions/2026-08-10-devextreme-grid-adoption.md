---
description: DevExtreme DataGrid(상용, 30일 평가판)을 SlickGrid과 동일한 4계층 구조의 별도 공통 컴포넌트로 추가하고, 라이선스 키는 환경변수로만 주입
tags: [decision]
---

# ADR-2026-08-10-devextreme-grid-adoption: DevExtreme 그리드 공통 컴포넌트 추가

- 기록일: 2026-08-10 09:45
- 상태: 승인됨
- 단계(Origin): dev (execute-dev)
- 관련 spec: 없음
- 관련 plan: 없음

## 맥락 (Context)

다른 프로젝트에서 DevExtreme DataGrid을 써야 한다는 요구가 생겼다. 기존 SlickGrid 공통 컴포넌트를 대체하는 것이 아니라, **여러 프로젝트에 투입할 때 골라 쓸 수 있도록 미리 만들어 두는 신규 컴포넌트**다. RealGrid, SlickGrid과 함께 셋이 공존한다.

DevExtreme은 SlickGrid(MIT)과 달리 **상용 제품**이다. 평가판은 30일이며, 키를 등록하지 않으면 화면 안내 메시지와 콘솔 경고(W0019 / W0021)가 뜨지만 기능은 모두 동작한다.

## 결정 (Decision)

1. `devextreme` + `devextreme-vue` 26.1.3을 평가판으로 설치하고, `src/components/DevExtremeGrid/` 에 SlickGrid과 **같은 4계층 구조**(축약 컬럼 → options 통과 → 슬롯 → 원본 인스턴스 탈출구)로 별도 컴포넌트를 만든다.
2. 축약 컬럼 문법(`field / header / type / align / headerAlign / unit / scale / summary / group / required / codes / …`)을 SlickGrid 래퍼와 **동일하게** 맞춘다. 두 그리드를 오가며 쓸 때 컬럼 정의를 그대로 옮길 수 있어야 한다.
3. **라이선스 키를 소스에 하드코딩하지 않는다.** `import.meta.env.VITE_DEVEXTREME_LICENSE_KEY` 로만 주입하고, 키가 없으면 평가판으로 동작한다. 데모 페이지는 평가판 상태를 `VAlert`로 안내한다.
4. 한글화는 DevExtreme의 `loadMessages(ko.json) + locale('ko')` 를 앱당 한 번만 호출한다.
5. 엑셀 내보내기는 `exceljs`를 **동적 import** 한다(정적 import 시 메인 번들이 약 950KB 늘어난다).

## 고려한 대안 (Alternatives)

| 대안 | 장점 | 단점 | 채택 여부 |
|------|------|------|-----------|
| SlickGrid과 같은 4계층 구조의 별도 컴포넌트 | 두 그리드의 사용법이 같아 학습·이관 비용이 낮다. 프로젝트별로 골라 쓸 수 있다 | 컬럼 변환기·옵션 빌더가 두 벌이 된다 | 채택 |
| SlickGrid 컴포넌트에 어댑터를 끼워 하나로 통합 | 코드 한 벌 | 두 라이브러리의 확장점 모양이 전혀 달라(속성 규약 vs Vue 슬롯, 옵션 이름 체계) 공통 추상화가 최소공배수로 수렴한다. 한쪽 고유 기능이 막힌다 | 기각 |
| DevExtreme 원본을 그대로 쓰고 래퍼를 두지 않음 | 래퍼 유지보수 없음 | 컬럼 정의가 화면마다 장황해지고 한글화·금액 표기·검증 문구가 화면별로 갈린다. 애초에 공통 컴포넌트를 만드는 목적과 배치된다 | 기각 |
| 라이선스 키를 소스에 하드코딩 | 즉시 동작 | 저장소에 키가 남는다. (이 저장소의 RealGrid이 그 방식인데 반복하지 않는다) | 기각 |

## 근거 (Rationale)

축약 문법을 SlickGrid과 같게 맞춘 것이 이 결정의 핵심이다. 두 그리드는 내부 구조가 완전히 달라도(가상 렌더링 vs Vue 템플릿, 밴드 컬럼 구조, 검증 모델) **컬럼 정의라는 입구만 같으면** 화면 코드를 거의 그대로 옮길 수 있다. 실제로 `type` 프리셋, `summary`, `group`(2단 헤더), `required`, `headerAlign` 모두 같은 이름·같은 의미로 동작한다.

통합 대신 분리를 택한 이유는 확장점의 모양 차이다. SlickGrid은 포맷터가 HTMLElement를 직접 만들고 `data-sg-action` 속성으로 클릭을 위로 올려야 했지만, DevExtreme은 `cellTemplate`으로 Vue 슬롯을 그대로 쓸 수 있다. 이를 하나의 추상화로 묶으면 더 나은 쪽(Vue 슬롯)을 포기하게 된다.

## 영향 (Consequences)

- 긍정: 프로젝트마다 SlickGrid / DevExtreme을 골라 쓸 수 있고, 컬럼 정의와 사용법이 같아 이관 비용이 낮다. 단위 테스트 108건이 축약 문법의 동등성을 지킨다.
- 트레이드오프/비용:
  - 메인 번들이 약 2.4MB(gzip 약 0.5MB) 늘었다. 여러 그리드를 한 앱에 담은 데모라서 커진 것이고, 실제 프로젝트는 한쪽만 쓴다.
  - DevExtreme은 상용이므로 **운영 투입 전 라이선스 구매가 필요하다.** 평가 기간 30일.
- 후속으로 따라오는 결정·제약:
  - `.env` 는 `.gitignore` 에 있어야 한다. 라이선스 키를 커밋하지 않는다.
  - DevExtreme 위젯은 Vue HMR로 교체되면 `Cannot read properties of undefined` 오류를 낸다. 컴포넌트를 수정한 뒤에는 **새로 고침**해서 확인한다(개발 편의상 제약이며 런타임 결함은 아니다).
  - 축약 문법을 한쪽에만 추가하지 않는다. 양쪽에 같은 이름으로 넣거나, 넣지 않는 이유를 주석에 남긴다.
