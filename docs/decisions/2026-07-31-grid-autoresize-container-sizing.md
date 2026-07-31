---
description: enableAutoResize를 절대 끄지 않고 컨테이너 기준으로 크기를 계산하며 높이 고정은 min/maxHeight로 처리
tags: [decision]
---

# ADR-2026-07-31-grid-autoresize-container-sizing: 그리드 크기 계산은 autoResize를 켠 채 컨테이너 기준으로

- 기록일: 2026-07-31 11:48
- 상태: 승인됨
- 단계(Origin): dev (execute-dev)
- 관련 spec: 없음
- 관련 plan: 없음

## 맥락 (Context)

`height` prop으로 그리드 높이를 고정할 수 있게 만들면서, 자동 리사이즈와 고정 높이가 충돌해 높이가 튈 것을 우려해 `enableAutoResize: false`로 껐다. 그 결과 화면이 심하게 깨졌다. 882px 카드 안에서 그리드 컨테이너가 1282px(브라우저 창 너비)로 그려지고, 캔버스는 180px로 계산되어 컬럼 6개가 각 30px로 찌그러졌다(헤더의 "사번"이 "사"/"번" 두 줄로 깨져 보임).

원인이 두 가지로 드러났다.
1. `autoResize`는 높이만이 아니라 **너비도 함께 담당**한다. 끄면 너비 계산까지 죽는다.
2. `autoResize.calculateAvailableSizeBy`의 라이브러리 기본값이 `'window'`다. 즉 기본 상태에서도 그리드는 부모 컨테이너가 아니라 브라우저 창 크기로 계산하며, 카드·컨테이너 안에 넣으면 밖으로 넘친다.

## 결정 (Decision)

`enableAutoResize`는 어떤 경우에도 끄지 않는다. `autoResize.calculateAvailableSizeBy: 'container'`로 두고 래퍼 `<div>`에 고유 id를 부여해 `autoResize.container`에 그 셀렉터를 넘긴다. 높이·너비 고정은 autoResize를 켠 상태에서 `minHeight/maxHeight`(및 `minWidth/maxWidth`)를 같은 값으로 묶어 해당 축만 고정한다.

## 고려한 대안 (Alternatives)

| 대안 | 장점 | 단점 | 채택 여부 |
|------|------|------|-----------|
| autoResize 유지 + `calculateAvailableSizeBy:'container'` + min/max로 축 고정 | 너비는 컨테이너를 따라가고 높이만 고정됨. 자동/수동 둘 다 성립 | 컨테이너 셀렉터를 넘겨야 해서 래퍼에 id가 필요 | 채택 |
| `height` 지정 시 `enableAutoResize:false` | 높이가 튀지 않을 것이라 기대 | **너비 계산이 함께 죽어 컬럼이 찌그러짐** (실제로 발생) | 기각 |
| `gridHeight`/`gridWidth`만 지정 | 설정이 단순 | `calculateAvailableSizeBy` 기본값이 window라 컨테이너를 넘치는 문제가 남음 | 기각(단독으로는 불충분, 보조로 함께 설정) |
| `resizeDetection:'container'` (ResizeObserver로 컨테이너 감시) | 창 크기 변화 없이 컨테이너만 바뀌어도 반응 | 래퍼 높이가 그리드에 의해 결정되므로 감시→리사이즈→감시 순환으로 `ResizeObserver loop limit exceeded` 위험 | 기각 |

## 근거 (Rationale)

깨짐의 실제 원인은 "높이와 너비의 충돌"이 아니라 "너비 계산 주체를 없앤 것"이었다. autoResize를 켠 채 min/max로 축을 묶으면 두 요구(고정 높이 + 반응형 너비)를 동시에 만족한다. `resizeDetection`은 기본값 `'window'`를 유지했다 — 컨테이너 감시는 무한 루프 위험이 실재하고, 컨테이너만 변하는 경우(사이드바 접힘 등)는 노출한 `resize()` 메서드로 처리할 수 있어 위험 대비 이득이 작다.

수정 후 실측으로 확인했다: wrapper 882px / container 884px(차이 2px = 테두리), 캔버스 867px, 컬럼 7개 정상 렌더.

## 영향 (Consequences)

- 긍정: 카드·탭·컨테이너 어디에 넣어도 부모 폭을 따라간다. `height="auto"`(기본)와 `:height="320"` 모두 동작한다.
- 트레이드오프/비용: 래퍼에 자동 생성 id가 붙는다(`{gridId}-wrap`). 컨테이너만 리사이즈되는 상황은 자동 대응하지 않고 `resize()` 호출이 필요하다.
- 후속으로 따라오는 결정·제약:
  - **`enableAutoResize: false`를 다시 넣지 않는다.** 높이가 튄다고 판단되면 min/maxHeight로 해결한다.
  - `autoResize.container` 셀렉터 전달을 제거하면 window 기준으로 되돌아가 다시 넘친다. 래퍼 id와 셀렉터 전달은 한 쌍으로 유지한다.
  - 높이 값은 `'auto'` | 숫자 | `'300px'`을 모두 받아 내부에서 고정 px 또는 null(자동)로 정규화한다.
