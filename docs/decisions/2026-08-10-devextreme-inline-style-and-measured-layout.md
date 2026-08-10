---
description: DevExtreme이 인라인 style을 박는 곳과 자식 폭을 측정해 레이아웃을 정하는 곳을 침범하지 않는 규칙 (컬럼명 정렬·페이저 정렬)
tags: [decision]
---

# ADR-2026-08-10-devextreme-inline-style-and-measured-layout: 인라인 스타일·측정 기반 레이아웃 대응

- 기록일: 2026-08-10 09:45
- 상태: 승인됨
- 단계(Origin): dev (execute-dev)
- 관련 spec: 없음
- 관련 plan: 없음

## 맥락 (Context)

DevExtreme DataGrid에 두 가지 요구를 구현하면서, CSS만으로는 통하지 않거나 오히려 라이브러리 동작을 망가뜨리는 지점을 만났다. 둘 다 **오류 없이 조용히 어긋난다**는 공통점이 있었다.

**(1) 컬럼명 정렬이 전혀 먹지 않았다.**
"셀은 우측정렬이어도 컬럼명은 가운데" 라는 요구에 맞춰 헤더 `td`에 `text-align: center` 규칙을 넣었는데 아무 효과가 없었다. 원인은 셀 팩토리가 헤더 `td`에도 인라인 스타일을 박기 때문이었다.

```js
// grid_core/views/m_columns_view.js  _createCell()
const alignment = column.alignment || getDefaultAlignment(...);
cell.style.textAlign = alignment;          // 헤더·본문·합계 셀 공용
if (column.cssClass) $cell.addClass(column.cssClass);
```

인라인 스타일은 클래스 규칙을 항상 이긴다. 즉 그 CSS는 처음부터 **죽은 코드**였고, `headerAlign` prop은 컬럼 빌더까지 전달되기만 하고 쓰이지도 않았다. 데모에 `headerAlign` 예시가 없어서 드러나지 않았다.

**(2) 페이저 정렬 CSS가 먹지 않았고, 억지로 먹이면 페이저가 compact로 튄다.**
`.dx-pages`에 `margin: auto`를 줬는데 효과가 없었다. 실제 페이저는 flex가 아니라 `display: block` + `float: left/right` 였고, 떠 있는(float) 요소의 auto 마진은 0으로 계산된다. 여기서 "flex로 바꾸고 auto 마진을 쓰자"로 가면 더 큰 문제를 만난다.

```js
// pagination/resizable_container.js
const parentWidth     = getElementContentWidth(parent);
const pageSizesWidth  = getElementWidth(allowedPageSizes);   // .dx-page-sizes
const infoWidth       = getElementWidth(info);               // .dx-info
const pagesHtmlWidth  = getElementWidth(pages);              // .dx-page-indexes  <- .dx-pages 가 아니다
// getElementWidth = computed(marginLeft) + computed(marginRight) + computed(width)
```

이 값들로 "정보 텍스트 숨김 → compact(`dx-light-mode`) 전환"을 결정한다. 측정 대상 세 요소에 `margin: auto`나 `flex-grow`를 주면 computed 값이 부풀어 **멀쩡한 폭에서도 compact로 튀거나**, "정보 숨김 → 폭 줄어듦 → 다시 표시"를 반복하며 깜빡일 수 있다.

## 결정 (Decision)

라이브러리가 **인라인으로 박는 속성**과 **레이아웃 판단에 읽는 속성**을 구분해 다룬다.

1. **인라인 스타일과 겨루는 곳은 클래스 + `!important`로 덮는다.**
   컬럼 빌더가 컬럼 `cssClass`에 `dxg-h-left|center|right`를 심고, theme CSS가 `.dx-datagrid-headers` 안쪽만 골라 `text-align: … !important`로 덮는다. `cssClass`는 헤더·본문·합계 셀에 모두 붙으므로 **셀렉터를 헤더로 한정**해야 본문 정렬이 망가지지 않는다.

2. **측정 대상 요소의 `width`/`margin`은 건드리지 않는다.**
   `.dx-page-sizes` / `.dx-info` / `.dx-page-indexes` 는 `flex: 0 0 auto`(자연 폭)로만 두고, 위치는 **측정 대상이 아닌** `.dx-pages`와 pager의 `justify-content` / `order` / `position` 으로만 제어한다.
   - 왼쪽: `.dx-pages { justify-content: flex-start }` + 정보·페이지크기를 `order: 2`
   - 오른쪽: `.dx-pages { justify-content: flex-end }`
   - 중앙: 좌우 요소를 `position: absolute`로 흐름에서 빼고 번호만 정중앙에 둔다. compact(`dx-light-mode`)로 바뀌면 절대배치를 풀어 겹침을 막는다.

3. **사용자가 준 `cssClass`를 덮지 않는다.** 우리 클래스는 통과 루프 **뒤에** 합친다(먼저 넣으면 `cssClass`를 준 컬럼만 헤더 정렬·말줄임이 조용히 사라진다).

## 고려한 대안 (Alternatives)

| 대안 | 장점 | 단점 | 채택 여부 |
|------|------|------|-----------|
| 클래스 + `!important` (헤더 한정) | 인라인 스타일을 확실히 이기고, 컬럼별로 지정 가능 | `!important`가 늘어난다 | 채택 |
| `headerCellTemplate`으로 헤더를 직접 그리기 | `!important` 불필요 | 기본 헤더 내용을 대체하게 되어 정렬 화살표·필터 아이콘 처리를 우리가 떠안는다. 비용 대비 이득이 없다 | 기각 |
| 컬럼 `alignment`를 헤더 기준으로 주고 본문을 CSS로 되돌리기 | 인라인 스타일과 싸우지 않음 | 본문 셀이 훨씬 많고, 편집기·합계까지 영향을 받는다. 방향이 반대다 | 기각 |
| `.dx-pages`에 `display: contents` 를 주고 3요소를 한 flex 행으로 | 진짜 3분할 정렬이 쉬움 | `display: contents`는 박스가 사라져 `getElementWidth`가 0을 읽는다. 적응형 판정이 깨진다 | 기각 |
| `.dx-page-indexes`에 `margin: auto`로 중앙 정렬 | 한 줄로 해결 | 측정 대상의 margin을 부풀려 compact 전환·깜빡임을 유발 | 기각 |
| 페이저 정렬 기능을 포기 | 위험 없음 | 3종 정렬은 명시적 요구사항 | 기각 |

## 근거 (Rationale)

두 사례 모두 "CSS를 넣었는데 화면이 안 바뀐다"에서 출발했고, **원인이 CSS 우선순위가 아니라 라이브러리가 런타임에 하는 일**이었다. 셀렉터 특이도를 올리는 방향으로 계속 갔다면 (1)은 영원히 해결되지 않았고, (2)는 겉보기로 해결된 뒤 좁은 화면에서 페이저가 튀는 재현 어려운 버그가 되었을 것이다.

그래서 `node_modules` 소스에서 **누가 무엇을 읽고 무엇을 쓰는지** 확인한 뒤에야 방식을 정했다. 특히 `pagesRef`가 `.dx-pages`가 아니라 `.dx-page-indexes`에 걸려 있다는 사실이 결정적이었다 — 그 덕분에 `.dx-pages`는 자유롭게 flex 컨테이너로 만들 수 있었고, 중앙 정렬을 오차 0px로 맞출 수 있었다.

## 영향 (Consequences)

- 긍정: 컬럼명 정렬 3종이 셀 정렬과 독립으로 동작하고(기본값 중앙), 페이저 3종 정렬이 오차 0px로 맞으면서 DevExtreme의 반응형(정보 숨김 → compact) 동작을 그대로 살렸다.
- 트레이드오프/비용: DevExtreme 내부 구현(클래스명 `dx-light-mode`, ref가 걸린 요소, `_createCell`의 인라인 스타일)에 의존한다. 메이저 업그레이드 시 재검증이 필요하다.
- 후속으로 따라오는 결정·제약:
  - **`.dx-page-sizes` / `.dx-info` / `.dx-page-indexes` 에 `width`·`margin`·`flex-grow`를 주지 않는다.** 이 셋은 적응형 판정 입력값이다.
  - **컬럼에 내부 클래스를 붙일 때는 사용자 `cssClass`와 합친다.** 대입하지 않는다. (SlickGrid ADR의 "className 대입 금지"와 같은 계열의 규칙)
  - **`cssClass`는 헤더·본문·합계에 모두 붙는다.** 한쪽만 노리는 규칙은 셀렉터로 범위를 좁힌다.
  - 새 시각적 요구가 CSS로 안 먹으면 **먼저 라이브러리가 인라인 스타일을 박는지 확인**한다.
  - `headerAlign` 처럼 prop만 받고 쓰지 않는 실수를 막기 위해, 새 시각 옵션은 **데모에 케이스를 추가하고 단위 테스트로 못 박는다.**
