---
description: 페이지네이션을 커스텀 컴포넌트로 만들되 slickgrid-vue가 별도 Vue 앱에 마운트하는 제약에 맞춰 순수 HTML/CSS로 작성하고 설정은 gridOptions로 전달
tags: [decision]
---

# ADR-2026-07-31-custom-pagination-isolated-app: 커스텀 페이지네이션과 격리된 Vue 앱 제약

- 기록일: 2026-07-31 11:48
- 상태: 승인됨
- 단계(Origin): dev (execute-dev)
- 관련 spec: 없음
- 관련 plan: 없음

## 맥락 (Context)

페이지네이션을 하단 왼쪽/중앙/오른쪽 3가지 위치로 배치하고, 중앙은 반응형으로 다듬어야 한다는 요구가 있었다. 내장 `SlickPaginationComponent`는 위치·마크업을 바꿀 수 없다.

`slickgrid-vue`의 `gridOptions.customPaginationComponent` 훅을 쓰기로 하고 내부 구현을 확인했더니 다음과 같았다.

```js
const el = document.createElement('section');
const inst = createApp(customPaginationComponent).mount(el);
container.appendChild(inst.$el);
nextTick(() => { inst.init(grid, paginationService, pubSubService, translater); inst.renderPagination(container); });
```

여기서 세 가지 제약이 따라온다. (1) `createApp()`으로 **별도 Vue 앱**에 마운트되므로 부모 앱의 플러그인이 없다 → Vuetify 컴포넌트를 쓸 수 없다. (2) props를 전달할 방법이 없다. (3) `inst.$el`을 append하므로 **루트 엘리먼트가 1개**여야 한다(여러 개면 `$el`이 주석 앵커가 되어 화면에 아무것도 안 나온다).

## 결정 (Decision)

`SlickGridPagination.vue`를 별도 컴포넌트로 만들어 `customPaginationComponent`로 등록한다. 위 제약에 맞춰 **순수 HTML + CSS로만** 작성하고(단일 루트), `init/dispose/renderPagination`을 `defineExpose`로 노출한다. props를 못 넘기므로 정렬·표시 설정은 그리드 옵션에 `sgPagination*` 커스텀 키로 심고, 컴포넌트가 `init(grid, ...)`에서 `grid.getOptions()`로 읽어간다.

## 고려한 대안 (Alternatives)

| 대안 | 장점 | 단점 | 채택 여부 |
|------|------|------|-----------|
| `customPaginationComponent` + 순수 HTML/CSS + gridOptions로 설정 전달 | 마크업·스타일·반응형을 완전히 제어, 한글 문구 자유, Vuetify 없는 프로젝트에서도 동작 | 제약 3가지를 모르면 디버깅이 어려움, Vuetify 컴포넌트 재사용 불가 | 채택 |
| 내장 페이지네이션을 CSS로만 정렬 | 구현이 거의 없음 | 마크업·문구·반응형 제어 불가. "예쁘게"라는 요구를 만족시키기 어려움 | 기각 |
| 페이지네이션을 그리드 밖에 직접 그리고 `paginationService`를 탈출구로 제어 | Vuetify 사용 가능 | 그리드와 분리되어 사용처마다 배치·연결을 반복해야 함(공통 컴포넌트 가치 상실) | 기각 |

## 근거 (Rationale)

Vuetify를 쓸 수 없다는 제약은 겉보기엔 손해지만, 이 컴포넌트가 **여러 프로젝트에 이식된다는 목표와는 오히려 부합**한다(대상 프로젝트가 Vuetify를 쓰지 않아도 동작). `paginationService`가 `goToFirst/Previous/Next/LastPage`, `goToPageNumber`, `changeItemPerPage`와 `pageNumber/pageCount/itemsPerPage/totalItems/dataFrom/dataTo/availablePageSizes` 게터를 모두 제공하므로 자체 UI를 만드는 데 부족함이 없다.

중앙 정렬은 `justify-content: center`로는 좌우 텍스트 길이가 달라 실제 중앙이 어긋난다. 그래서 `space-between` + 양쪽 요소에 동일한 `flex: 1 1 0`을 주는 방식을 택했다. 실측으로 nav 중심과 컨테이너 중심의 오프셋이 **0px**임을 확인했다(왼쪽 -209px, 오른쪽 +212px).

반응형은 미디어 쿼리 대신 **container query**를 썼다. 그리드는 좁은 컨테이너에 놓이는 일이 많아 화면 폭이 아니라 컨테이너 폭을 기준으로 줄어야 한다.

## 영향 (Consequences)

- 긍정: 위치 3종·한글 문구·반응형·페이지 번호 축약(`1 ... 4 5 [6] 7 ... 20`)을 모두 제어한다. Vuetify 비의존이라 이식성이 유지된다.
- 트레이드오프/비용: 프로젝트 공통 `Button` 등을 재사용하지 못하고 스타일을 중복 작성한다. 정렬을 런타임에 바꾸려면 그리드를 재생성해야 한다(옵션은 생성 시점 설정이므로 데모에서는 `:key`로 remount).
- 후속으로 따라오는 결정·제약:
  - **이 파일에 Vuetify 컴포넌트를 넣지 않는다.** 렌더되지 않는다.
  - **루트 엘리먼트를 1개로 유지한다.** 늘리면 화면에 아무것도 안 나온다.
  - `init/dispose/renderPagination`을 `defineExpose`에서 빼지 않는다.
  - 새 설정을 추가할 때 props가 아니라 `sgPagination*` 그리드 옵션 키로 전달한다.
  - `pubSubService` 구독은 `dispose`에서 반드시 해제한다(그리드를 여러 번 열고 닫으면 콜백이 누적된다).
