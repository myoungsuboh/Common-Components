<script setup>
import { ref, computed, watch, nextTick, useAttrs, onBeforeUnmount } from "vue";
import { SlickgridVue } from "slickgrid-vue";

import { buildColumns, createRowNumberColumn, calcSummary } from "./composables/useGridColumns";
import { buildGridOptions } from "./composables/useGridOptions";
import { createBackendServiceApi } from "./composables/useServerData";
import SlickGridPagination from "./SlickGridPagination.vue";

/* ***************************************************************************************************************
SlickGrid 공통 컴포넌트

기반 : slickgrid-vue 10.x (MIT) / slickgrid-universal 위의 Vue 3 래퍼

--------------------------------------------------------------------------------------------------
커스텀 4계층 구조 (아래로 갈수록 자유도가 높아짐)
--------------------------------------------------------------------------------------------------
1층 축약   :columns="[{ field:'empNo', header:'사번', type:'code', codes:[...] }]"
           -> 90% 케이스. type 하나로 포맷터/에디터/필터/정렬이 한번에 잡힌다.

2층 통과   :options="{ rowHeight: 40, frozenColumn: 1 }"
           -> SlickGrid 원본 GridOption 전체를 deep merge로 덮어쓴다. 우리가 예상 못 한 옵션도 먹힌다.

3층 슬롯   <template #header> / <template #footer>
           -> 그리드 위/아래 영역 교체.

4층 탈출구 @on-grid-created="inst => inst.slickGrid.xxx()"  또는  ref로 defineExpose 메서드 호출
           -> 원본 Grid / DataView / 각종 Service 인스턴스를 그대로 꺼내준다.
              래퍼가 절대 병목이 되지 않게 하는 장치. 막히면 여기로 내려가면 된다.
--------------------------------------------------------------------------------------------------

주의 1 : CSS는 전역으로 import 해야 한다.
       SlickGrid은 셀/헤더/스크롤바 등 수많은 DOM을 자체 클래스명으로 렌더하므로
       <style scoped> 안에서 @import 하면 스코프 속성이 붙지 않아 스타일이 대부분 적용되지 않는다.

주의 2 : 반드시 ".lite" 테마를 쓴다. full 테마로 바꾸면 안 된다.
       full 테마(slickgrid-theme-material.css)는 아이콘을 SVG 마스크 방식으로 그리려고
       전역 `.mdi { background-color: currentColor; ... }` 규칙을 깔아버린다.
       Vuetify(@mdi/font)의 폰트 기반 .mdi 아이콘에는 마스크가 없으므로
       앱 전체의 모든 Vuetify 아이콘 자리에 글자색 사각형이 통째로 그려진다. (실제 사고)
       lite 테마는 .mdi 규칙이 0개인, "호스트 앱이 이미 mdi 폰트를 가진 경우"용 공식 변형이다.
       이때 그리드 메뉴의 아이콘(mdi-sort-ascending 등)은 호스트 앱의 @mdi/font 로 렌더되므로
       이 컴포넌트를 쓰는 프로젝트는 @mdi/font 를 함께 설치해야 한다 (가이드 탭 참고).
******************************************************************************************************************/
import "@slickgrid-universal/common/dist/styles/css/slickgrid-theme-material.lite.css";
import "./theme/slickgrid-custom.css";

// 부모의 class/style이 최상위 div에 정상적으로 붙도록 자동 상속을 끄고 수동으로 상속한다.
// (그리드는 여러 노드를 렌더하므로 자동 상속 시 "Extraneous non-props attributes" 경고가 발생한다)
defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** <pre>
   * 컬럼 정의 (축약 형식 / SlickGrid 원본 형식 혼용 가능)
   *
   * { field, header, type, width, align, sortable, filter, editable, codes, ...SlickGrid 원본옵션 }
   *
   * type : text | longText | number | decimal | amount | date | datetime | yn | code | button | image | file | link
   *
   * 숫자 단위    : unit('원'/'%'/'개') , prefix('$') , scale(1000 -> 천원 단위로 축약)
   * 말줄임       : ellipsis (기본 true, 컬럼별로 끌 수 있음)
   * 정렬         : align(셀) / headerAlign(컬럼명, 기본 center)
   * 버튼         : buttonText , action , buttonDisabled(fn) , buttonHidden(fn)
   * 이미지       : imageHeight , imageAlt
   * </pre> */
  columns: { type: Array, required: true },
  /** SlickGrid GridOption 원본. 여기에 넣은 값이 모든 기본값을 이깁니다. (2층) */
  options: { type: Object, default: () => ({}) },
  /** 그리드 DOM id. 미지정 시 자동 생성 */
  gridId: { type: String, default: null },
  /** <pre>
   * 각 행을 구분하는 고유 키 필드명 (기본 'id')
   *
   * 행 선택 / 행 갱신 / 트리 데이터가 이 값을 기준으로 동작합니다.
   * 데이터에 id가 없고 empNo 같은 다른 키를 쓴다면 반드시 지정해야 합니다.
   * </pre> */
  idField: { type: String, default: "id" },

  // ----- 기능 플래그 -----
  /** 맨 앞에 행번호(No) 컬럼 추가. 정렬/필터를 걸어도 화면 순서대로 1부터 다시 매겨집니다. */
  rowNumber: { type: Boolean, default: false },
  /** 행번호 컬럼 헤더명 */
  rowNumberHeader: { type: String, default: "No" },
  /** 행번호 컬럼 너비(px) */
  rowNumberWidth: { type: Number, default: 60 },
  /** 컬럼 필터 행 표시 */
  filterable: { type: Boolean, default: false },
  /** <pre>
   * 그리드 밖 입력창으로만 필터 사용 (필터 행은 숨김)
   *
   * 상단에 조회조건을 두고 [조회] 버튼을 누르는 국내 업무화면 형태에 사용합니다.
   * applyFilters() 는 필터 기능이 켜져 있어야 동작하므로,
   * 필터 행을 보여주지 않고 쓰려면 filterable 대신 이 옵션을 켜야 합니다.
   * </pre> */
  externalFilter: { type: Boolean, default: false },
  /** 인라인 셀 편집 */
  editable: { type: Boolean, default: false },
  /** 셀 클릭 즉시 편집 모드 진입 (false면 더블클릭/엔터) */
  autoEdit: { type: Boolean, default: false },
  /** 행 선택 */
  selectable: { type: Boolean, default: false },
  /** 다중 선택 (selectable과 함께 사용) */
  multiSelect: { type: Boolean, default: true },
  /** 좌측 체크박스 선택 컬럼 표시 (selectable과 함께 사용) */
  checkboxSelector: { type: Boolean, default: false },
  /** 페이지네이션 */
  pageable: { type: Boolean, default: false },
  /** 페이지당 건수 */
  pageSize: { type: Number, default: 20 },
  /** 페이지당 건수 선택 목록 */
  pageSizes: { type: Array, default: () => [20, 50, 100, 500] },
  /** 페이지네이션 정렬 위치 : left | center | right */
  paginationAlign: {
    type: String,
    default: "right",
    validator: (value) => ["left", "center", "right"].includes(value),
  },
  /** 페이지당 건수 셀렉터 표시 여부 */
  paginationShowPageSize: { type: Boolean, default: true },
  /** <pre>
   * 우측 상단 그리드 메뉴(☰) + 컬럼 헤더 메뉴
   *
   * 컬럼 헤더 메뉴(정렬 / 컬럼 숨기기 / 컬럼 고정)는 컬럼 헤더를 우클릭하면 열립니다.
   * (컬럼마다 뜨는 ∨ 버튼은 맨 오른쪽에서 ☰ 와 겹치므로 숨겨두었습니다)
   *
   * [참고] 이 두 메뉴는 라이브러리 기본값(enableGridMenu / enableHeaderMenu)이 true라서
   * 이 prop을 주지 않아도 나타납니다. 완전히 감추려면 2층에서 직접 꺼야 합니다.
   *   :options="{ enableGridMenu: false, enableHeaderMenu: false }"
   * </pre> */
  gridMenu: { type: Boolean, default: false },
  /** <pre>
   * 헤더를 상단 패널로 드래그해서 그룹핑
   *
   * 컬럼에 group(2단 헤더)을 함께 쓰면 안 됩니다.
   * 둘 다 그리드 위쪽 pre-header 패널 하나를 사용해서 서로 덮어씁니다.
   * </pre> */
  groupable: { type: Boolean, default: false },
  /** <pre>
   * 하단 합계 행 표시
   *
   * 컬럼에 summary 를 지정한 것만 값이 나옵니다.
   *   { field: 'salary', type: 'amount', summary: 'sum' }
   *   summary : sum | avg | count | min | max | (items, column) => 값
   *
   * 필터를 걸면 걸러진 결과 기준으로 다시 계산됩니다.
   * </pre> */
  showSummary: { type: Boolean, default: false },
  /** 합계 행 맨 앞에 표시할 라벨 */
  summaryLabel: { type: String, default: "합계" },
  /** 조회 중 오버레이 표시 (서버 모드에서는 자동으로 켜집니다) */
  loading: { type: Boolean, default: false },
  /** 엑셀 내보내기 (그리드 메뉴에 항목 추가 + exportToExcel() 사용 가능) */
  excelExport: { type: Boolean, default: false },
  /** 엑셀 파일명 (확장자 제외). 한글 파일명도 사용 가능합니다. */
  exportFilename: { type: String, default: "export" },
  /** 엑셀 시트명 */
  exportSheetName: { type: String, default: "Sheet1" },
  /** 트리 데이터 옵션. 지정하면 트리 모드로 동작 ({ columnId, parentPropName, ... }) */
  treeDataOptions: { type: Object, default: null },

  // ----- 서버 사이드 모드 -----
  /** <pre>
   * 서버 조회 함수. 지정하면 서버 사이드 모드로 동작합니다.
   *
   * 페이징 / 정렬 / 필터가 전부 서버에 위임되므로 로컬에서 잘못 정렬되는 문제가 없습니다.
   * (클라이언트 모드에서 한 페이지만 로드하면 그 페이지 안에서만 정렬되어 결과가 틀립니다)
   *
   * async ({ page, pageSize, sorters, filters, signal }) => ({ items, totalCount })
   *
   *   page      : 1부터 시작하는 페이지 번호
   *   pageSize  : 페이지당 건수
   *   sorters   : [{ field, direction: 'ASC' | 'DESC' }]
   *   filters   : [{ field, operator, value, values }]
   *   signal    : AbortSignal (빠른 연속 조회 시 이전 요청 취소용)
   *
   * 반환값의 totalCount가 없으면 전체 페이지 수를 계산할 수 없어 1페이지만 표시됩니다.
   * </pre> */
  fetchData: { type: Function, default: null },

  // ----- 크기 (자동 / 수동) -----
  /** <pre>
   * 그리드 높이
   *
   * 'auto' (기본) : 부모 컨테이너 크기에 맞춰 자동
   * 숫자 / '300px' : 해당 px로 고정
   * </pre> */
  height: { type: [Number, String], default: "auto" },
  /** <pre>
   * 그리드 너비
   *
   * 'auto' (기본) : 부모 컨테이너 폭에 맞춰 자동
   * 숫자 / '800px' : 해당 px로 고정
   * </pre> */
  width: { type: [Number, String], default: "auto" },
  /** 데이터 건수에 맞춰 높이를 늘림 (height가 'auto'일 때만 적용) */
  autoHeight: { type: Boolean, default: false },
  /** 컬럼 너비 합이 그리드보다 좁을 때 남는 여백 없이 꽉 채움 (forceFitColumns) */
  fitColumns: { type: Boolean, default: false },
  /** 다크 모드 */
  dark: { type: Boolean, default: false },

  // ----- 표시 -----
  /** <pre>
   * 컬럼명(헤더) 기본 정렬 : left | center | right
   *
   * 셀 정렬과 독립적입니다. 기본값 center라서 급여 컬럼의 셀이 우측정렬이어도 컬럼명은 중앙에 옵니다.
   * 컬럼별로 headerAlign을 주면 그 컬럼만 달라집니다.
   * </pre> */
  headerAlign: {
    type: String,
    default: "center",
    validator: (value) => ["left", "center", "right"].includes(value),
  },
  /** 셀 내용이 컬럼 너비보다 길 때 ... 으로 줄임 (마우스를 올리면 전체 내용 표시) */
  ellipsis: { type: Boolean, default: true },
  /** 데이터 행 높이(px) */
  rowHeight: { type: Number, default: 34 },
  /** <pre>
   * 헤더(컬럼명) 텍스트 영역 높이(px). 실제 헤더 높이는 여기에 상하 패딩 16px이 더해집니다.
   *
   * 기본값 20은 컬럼명 한 줄 높이와 같습니다. 남는 공간이 없어 글자가 세로 가운데에 옵니다.
   * (라이브러리 기본값은 2줄 기준 34px이라 1줄 컬럼명이 위로 쏠려 보입니다)
   *
   * 컬럼명을 2줄로 쓰려면 이 값을 40 정도로 올리고 --slick-header-row-count 를 2로 되돌리세요.
   * </pre> */
  headerHeight: { type: Number, default: 20 },

  /** <pre>
   * 행/셀 단위 제어 (비활성 · 스타일)
   *
   * (item, row) => {
   *   rowClass : 행 전체에 붙일 CSS 클래스
   *   disabled : 행 전체 편집 잠금 (회색 처리 + 편집 불가)
   *   cells    : { 필드명: { disabled, class } }  개별 셀 제어
   * }
   *
   * 예) 마감된 행은 편집 못 하게 :
   *   :row-meta="(item) => item.closeYn === 'Y' ? { disabled: true } : null"
   *
   * 예) 특정 셀만 잠그기 :
   *   :row-meta="(item) => ({ cells: { salary: { disabled: item.grade !== 'G4' } } })"
   * </pre> */
  rowMeta: { type: Function, default: null },

  /** 개발 중 컬럼 정의 오타를 콘솔 경고로 알림 */
  warnInvalidColumns: { type: Boolean, default: true },
});

const emit = defineEmits([
  /** 그리드 생성 완료. payload는 SlickgridVueInstance (4층 탈출구) */
  "on-grid-created",
  /** 행 클릭 */
  "on-row-click",
  /** 행 더블클릭 */
  "on-row-dblclick",
  /** 셀 값 변경 (편집 확정) */
  "on-cell-change",
  /** 선택 행 변경. payload { rows, items } */
  "on-selection-change",
  /** 컬럼폭/순서/숨김/필터/정렬 등 그리드 상태 변경 (레이아웃 저장용) */
  "on-grid-state-changed",
  /** 편집 유효성 실패 */
  "on-validation-error",
  /** 표시 건수 변경 (필터 적용 후 건수 등) */
  "on-row-count-changed",
  /** 엑셀 내보내기 완료 */
  "on-export-complete",
  /** 셀 안의 버튼/커스텀 요소 클릭. payload { action, row, item, column, target } */
  "on-cell-action",
  /** 셀 안의 체크박스 토글. payload { field, checked, value, row, item, column } */
  "on-cell-toggle",
  /** 서버 조회 로딩 상태 변화. payload boolean */
  "on-loading",
  /** 서버 조회 실패. payload Error */
  "on-error",
  /** 변경행 목록이 바뀔 때. payload { rows, count } */
  "on-dirty-change",
]);

/** 데이터셋 (v-model). 편집/행추가 시 양방향으로 반영됩니다. */
const dataset = defineModel({ type: Array, default: () => [] });

// DOM id로 쓰이므로 반드시 문자로 시작해야 한다 (숫자로 시작하면 CSS 셀렉터에서 문제가 됨)
const resolvedGridId = props.gridId ?? `sg-grid-${Math.random().toString(36).slice(2, 10)}`;

// autoResize가 "이 요소" 기준으로 크기를 계산하도록 래퍼에 고유 id를 부여한다.
// 이게 없으면 window 기준으로 계산해서 그리드가 부모 밖으로 넘치고 컬럼이 찌그러진다.
const wrapperId = `${resolvedGridId}-wrap`;

/** SlickgridVue 인스턴스 (원본 Grid/DataView/Service 접근용) */
const instance = ref(null);

/* ---------------------------------------------------------------------------------------------------------------
변경행 추적 (dirty rows)

편집 가능한 그리드에서 "바뀐 행만" 서버로 보내야 하는 요구가 거의 항상 생긴다.
셀 단위 이벤트(on-cell-change)만으로는 호출한 쪽에서 직접 누적해야 하므로 여기서 모아둔다.

idField를 키로 쓴다. 데이터에 그 키가 없으면 행을 구분할 수 없으므로
행 참조 자체를 키로 쓰는 Map을 함께 두어 id 없는 데이터에서도 동작하게 한다.
--------------------------------------------------------------------------------------------------------------- */

/** 변경된 행: key(id 또는 행 객체) -> { item, fields: Set<변경된 필드명> } */
const dirtyMap = new Map();
/** 변경행 수 (템플릿/외부 노출용 반응형 값) */
const dirtyCount = ref(0);

/** 행을 구분할 키. id가 있으면 id, 없으면 객체 참조 */
const dirtyKeyOf = (item) => item?.[props.idField] ?? item;

const emitDirtyChange = () => {
  dirtyCount.value = dirtyMap.size;
  emit("on-dirty-change", { rows: getDirtyRows(), count: dirtyMap.size });
};

/**
 * 변경 행 목록
 *
 * @returns {Array<{item: Object, fields: Array<string>}>}
 */
const getDirtyRows = () => [...dirtyMap.values()].map(({ item, fields }) => ({ item, fields: [...fields] }));

const markDirty = (item, field) => {
  if (!item) return;

  const key = dirtyKeyOf(item);
  const entry = dirtyMap.get(key) ?? { item, fields: new Set() };
  if (field) entry.fields.add(field);
  dirtyMap.set(key, entry);

  emitDirtyChange();
};

const clearDirty = () => {
  if (dirtyMap.size === 0) {
    dirtyCount.value = 0;
    return;
  }

  dirtyMap.clear();
  emitDirtyChange();
};

/* ---------------------------------------------------------------------------------------------------------------
서버 사이드 모드

fetchData prop이 있으면 backendServiceApi를 구성한다.
setup에서 한 번만 만든다 (그리드 생성 시점 설정이므로).
--------------------------------------------------------------------------------------------------------------- */
/** 서버 모드에서 조회된 전체 건수 */
const serverTotalCount = ref(0);
/** 서버 조회 진행 여부 (로딩 오버레이용) */
const serverLoading = ref(false);

/**
 * 서버가 준 전체 건수를 페이지네이션에 반영
 *
 * 전체 건수를 넣지 않으면 페이지 수를 계산할 수 없어 "0건"으로 표시되고 페이지 이동도 안 된다.
 *
 * 첫 조회는 그리드 생성(onVueGridCreated)보다 먼저 끝날 수 있어서 그 시점에는 instance가 아직 null이다.
 * 그래서 값을 serverTotalCount에 보관해 두고, 생성 완료 후에도 한 번 더 이 함수를 호출한다.
 */
const applyServerTotalCount = async () => {
  const total = serverTotalCount.value;

  /*
   * paginationService.updateTotalItems()는 내부 _paginationOptions가 초기화된 뒤에만 동작한다.
   * 첫 조회가 그리드 초기화보다 빨리 끝나는 경우가 있어 그때 호출하면 조용히 무시된다.
   * 그래서 옵션 객체에도 직접 반영해 초기화 시점에 집히도록 하고, 한 틱 뒤 한 번 더 호출한다.
   */
  /*
   * 두번째 인자(triggerChangedEvent)는 반드시 false 여야 한다.
   * true로 주면 페이지 변경 이벤트가 발행되어 processOnPaginationChanged -> process 로 이어져
   * "조회가 또 조회를 유발"한다. 매 조회마다 요청이 두 번 나가고 그리드가 깜빡인다.
   * 전체 건수 표시를 갱신하는 것은 데이터 재조회 사유가 아니다.
   */
  if (gridOptions.value?.pagination) gridOptions.value.pagination.totalItems = total;
  instance.value?.paginationService?.updateTotalItems?.(total, false);

  await nextTick();
  instance.value?.paginationService?.updateTotalItems?.(total, false);
};

/**
 * 행번호 오프셋 — 현재 페이지 앞에 몇 건이 있는지
 *
 * 포맷터의 row 인자는 현재 페이지 안에서의 순번이라, 이 값을 더해야 페이지를 넘겨도 번호가 이어진다.
 *
 * paginationService.dataFrom 은 "현재 페이지의 첫 항목 번호(1부터)" 다.
 *   dataFrom = (pageNumber - 1) * itemsPerPage + 1
 * PaginationService.recalculateFromToIndexes() 가 로컬 페이징과 서버 페이징 모두에서
 * 페이지가 바뀔 때 갱신하고, 그 뒤에 그리드가 다시 그려지므로 포맷터가 읽는 시점에는 최신값이다.
 *
 * dataView.getPagingInfo() 를 쓰지 않는 이유:
 *   서버 페이징에서는 PaginationService 가 dataView.setPagingOptions() 를 호출하지 않아
 *   pageNum/pageSize 가 0 으로 남는다 (pagination.service.js processOnPageChanged 의 분기).
 *
 * 페이지네이션을 쓰지 않으면 dataFrom 이 1 이라 오프셋 0 이 된다.
 */
const rowNumberOffset = () => {
  const dataFrom = instance.value?.paginationService?.dataFrom;
  return Number.isFinite(dataFrom) && dataFrom > 1 ? dataFrom - 1 : 0;
};

const backendServiceApi = props.fetchData
  ? createBackendServiceApi({
      fetchData: props.fetchData,
      onResult: ({ items, totalCount }) => {
        serverTotalCount.value = totalCount;
        dataset.value = items;
        applyServerTotalCount();
        // 새로 조회했으면 이전 편집 이력은 의미가 없다
        clearDirty();
      },
      onError: (error) => emit("on-error", error),
      onLoadingChange: (loading) => {
        serverLoading.value = loading;
        emit("on-loading", loading);
      },
    })
  : null;

/* ---------------------------------------------------------------------------------------------------------------
로딩 표시

서버 조회 중에는 자동으로 켜지고, loading prop으로 직접 제어할 수도 있다.
(클라이언트 모드에서 사용자가 자기 API를 호출하는 동안 표시하는 용도)
--------------------------------------------------------------------------------------------------------------- */
const isLoading = computed(() => props.loading || serverLoading.value);

/* ---------------------------------------------------------------------------------------------------------------
컬럼

slickgrid-vue는 v-model:columns 로 컬럼을 양방향 바인딩한다 (리사이즈/순서변경 시 되써짐).
따라서 computed(읽기전용)를 바로 넘기면 되쓰기가 실패하므로 ref에 담아 동기화한다.
--------------------------------------------------------------------------------------------------------------- */
const slickColumns = ref([]);

watch(
  () => props.columns,
  (cols) => {
    const built = buildColumns(cols, {
      warn: props.warnInvalidColumns,
      headerAlign: props.headerAlign,
      ellipsis: props.ellipsis,
      // 그리드 밖 입력창으로 필터를 쓰려면 컬럼이 필터 대상이어야 한다 (필터 행은 숨겨진 상태)
      forceFilterable: props.externalFilter,
      // 컬럼에 grouping 정의가 없으면 드래그 그룹핑이 그 컬럼을 무시한다
      groupable: props.groupable,
    });

    // 행번호 컬럼은 맨 앞에 붙인다.
    // 체크박스 선택 컬럼은 slickgrid-universal이 자동으로 그보다 더 앞에 넣으므로
    // 최종 순서는 [체크박스][No][데이터...] 가 된다.
    slickColumns.value = props.rowNumber
      ? [createRowNumberColumn({ header: props.rowNumberHeader, width: props.rowNumberWidth, getOffset: rowNumberOffset }), ...built]
      : built;

    /*
     * 2단 헤더(컬럼 group)와 드래그 그룹핑(groupable)은 둘 다 pre-header 패널 하나를 쓴다.
     * 함께 켜면 한쪽이 조용히 사라져 원인을 찾기 어려우므로 경고한다.
     */
    if (import.meta.env?.DEV && props.groupable && slickColumns.value.some((col) => col.columnGroup)) {
      console.warn("[SlickGrid] groupable(드래그 그룹핑)과 컬럼 group(2단 헤더)은 같은 상단 패널을 사용해 동시에 쓸 수 없습니다. groupable을 우선 적용합니다.");
    }
  },
  { immediate: true, deep: true },
);

/* ---------------------------------------------------------------------------------------------------------------
그리드 옵션

옵션은 "생성 시점 설정"이다. 매번 다시 만들면 externalResources의 ExcelExportService가 중복 등록되므로
setup에서 한 번만 만든다. 런타임에 바꿔야 하면 아래 setOptions()를 사용한다.
--------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------
행/셀 단위 제어

SlickGrid 코어는 dataView.getItemMetadata(row) 로 행 메타데이터를 읽어
행 CSS 클래스 / 셀별 편집기·클래스를 덮어쓴다.
사용자가 쓰기 쉬운 { rowClass, disabled, cells } 형태를 그 형태로 변환해준다.

코어 소스를 확인한 두 가지 규칙 (바꾸면 조용히 동작을 멈춘다):
- 편집 잠금 키는 editor가 아니라 "editorClass" 다.
  (getEditor: columnMetadata[col.id].editorClass !== undefined 이면 그것을 사용 → null이면 편집 불가)
- metadata.columns[colId].cssClass 는 기존 컬럼 cssClass에 "추가로" 붙는다.
  따라서 여기서 col.cssClass를 다시 병합하면 중복될 뿐이다. 추가할 클래스만 넣는다.
--------------------------------------------------------------------------------------------------------------- */
const buildItemMetadata = (row) => {
  const item = instance.value?.dataView?.getItem?.(row);
  if (!item) return null;

  const meta = props.rowMeta(item, row);
  if (!meta) return null;

  const result = {};
  if (meta.rowClass) result.cssClasses = meta.rowClass;

  const columns = {};

  // 행 전체 잠금 : 모든 컬럼의 편집기를 제거 + 회색 처리
  if (meta.disabled) {
    for (const col of slickColumns.value) {
      columns[col.id] = { editorClass: null, cssClass: "sg-cell-disabled" };
    }
  }

  // 셀 개별 지정 (행 전체 설정보다 우선)
  for (const [field, cell] of Object.entries(meta.cells ?? {})) {
    const col = slickColumns.value.find((c) => c.field === field || c.id === field);
    if (!col) continue;

    columns[col.id] = {
      ...(columns[col.id] ?? {}),
      ...(cell.disabled ? { editorClass: null } : {}),
      cssClass: [cell.disabled ? "sg-cell-disabled" : null, cell.class].filter(Boolean).join(" ") || undefined,
    };
  }

  if (Object.keys(columns).length > 0) result.columns = columns;

  return Object.keys(result).length > 0 ? result : null;
};

/* ---------------------------------------------------------------------------------------------------------------
하단 합계 행

SlickGrid은 footer row에 "빈 셀"만 만들어준다. 내용은 우리가 직접 채워야 한다.
grid.getFooterRowColumn(컬럼id) 로 해당 셀 DOM을 얻어 텍스트를 넣는다.

집계 대상은 dataView.getFilteredItems() — 필터를 걸면 걸러진 결과 기준으로 다시 계산된다.
(전체 데이터 기준으로 하면 필터를 걸었는데 합계가 그대로라 사용자가 혼란스럽다)
--------------------------------------------------------------------------------------------------------------- */
const renderSummary = () => {
  if (!props.showSummary) return;

  const grid = instance.value?.slickGrid;
  const dataView = instance.value?.dataView;
  if (!grid?.getFooterRowColumn || !dataView) return;

  // 서버 사이드 모드에서는 현재 페이지만 갖고 있으므로 그 범위의 합계다
  const items = dataView.getFilteredItems?.() ?? dataView.getItems?.() ?? [];

  let labelPlaced = false;

  for (const column of slickColumns.value) {
    const cell = grid.getFooterRowColumn(column.id);
    if (!cell) continue;

    /*
     * [주의] cell.className 을 대입해서 덮어쓰면 안 된다.
     * SlickGrid이 붙여둔 slick-footerrow-column / l0 r0 같은 클래스가 지워지는데
     * 그것들이 셀의 위치와 너비를 담당하므로 합계 행 레이아웃이 통째로 깨진다.
     * 우리 클래스만 추가/제거한다.
     */
    cell.classList.add("sg-summary-cell");
    cell.classList.remove("sg-summary-label", "sg-align-left", "sg-align-center", "sg-align-right");

    const text = calcSummary(items, column);

    // 합계 값이 없는 맨 앞 컬럼에 "합계" 라벨을 한 번만 넣는다
    if (!text && !labelPlaced && props.summaryLabel) {
      cell.textContent = props.summaryLabel;
      cell.classList.add("sg-summary-label");
      labelPlaced = true;
      continue;
    }

    cell.textContent = text;

    // 합계 값 정렬은 본문 컬럼과 맞춘다 (금액이면 우측)
    const alignClass = (column.cssClass ?? "").split(" ").find((c) => c.startsWith("sg-align-"));
    if (alignClass) cell.classList.add(alignClass);
  }
};

/* ---------------------------------------------------------------------------------------------------------------
전체 선택 체크박스 (좌측 상단) — 직접 구현

내장 체크박스는 "선택"만 되고 "해제"가 되지 않아(useGridOptions의 checkboxSelector 주석 참고)
hideSelectAllCheckbox로 숨기고 여기서 직접 만든다. 동작이 우리 코드 안에 있어 예측 가능하다.

- 클릭 : 전부 선택된 상태면 해제, 아니면 전체 선택
- 상태 : 선택 변경 시 체크/부분선택(indeterminate)을 갱신
--------------------------------------------------------------------------------------------------------------- */
const CHECKBOX_COLUMN_ID = "_checkbox_selector";

/** 우리가 심은 전체선택 체크박스 */
let selectAllEl = null;

/** 선택 상태에 맞춰 체크박스 표시를 갱신 */
const syncSelectAllCheckbox = () => {
  if (!selectAllEl) return;

  const total = instance.value?.dataView?.getLength?.() ?? 0;
  const selected = instance.value?.slickGrid?.getSelectedRows?.()?.length ?? 0;

  selectAllEl.checked = total > 0 && selected >= total;
  // 일부만 선택된 상태를 시각적으로 구분
  selectAllEl.indeterminate = selected > 0 && selected < total;
};

const wireSelectAllCheckbox = () => {
  const grid = instance.value?.slickGrid;
  if (!grid?.getHeaderColumn || !props.checkboxSelector || !props.multiSelect) return;

  const headerEl = grid.getHeaderColumn(CHECKBOX_COLUMN_ID);
  if (!headerEl) return;

  const nameEl = headerEl.querySelector(".slick-column-name") ?? headerEl;
  // 재생성 시 중복으로 쌓이지 않게 기존 것을 제거
  nameEl.querySelector(".sg-selectall")?.remove();

  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "sg-selectall";
  input.title = "전체 선택 / 해제";
  input.setAttribute("aria-label", "전체 선택 / 해제");

  input.addEventListener("click", (event) => {
    // 헤더 클릭이 정렬 등 다른 동작으로 이어지지 않게 막는다
    event.stopPropagation();

    const total = instance.value?.dataView?.getLength?.() ?? 0;
    const selected = instance.value?.slickGrid?.getSelectedRows?.()?.length ?? 0;

    if (total > 0 && selected >= total) instance.value?.slickGrid?.setSelectedRows([]);
    else instance.value?.slickGrid?.setSelectedRows(Array.from({ length: total }, (_, i) => i));

    syncSelectAllCheckbox();
  });

  nameEl.appendChild(input);
  selectAllEl = input;
  syncSelectAllCheckbox();
};

/**
 * rowMeta를 dataView에 연결
 *
 * gridOptions.getItemMetadata 는 slickgrid-vue가 어디에도 연결하지 않는 죽은 옵션이다 (소스 확인).
 * 코어가 실제로 읽는 곳은 dataView.getItemMetadata 이므로 그리드 생성 후 직접 감싼다.
 *
 * dataView 자체 메타(그룹 헤더/합계 행)가 있으면 그것을 우선한다 — 그런 행은 실데이터가 아니라서
 * rowMeta(item)를 적용할 대상이 아니고, 덮어쓰면 그룹핑 렌더가 깨진다.
 */
const wireRowMeta = () => {
  const dataView = instance.value?.dataView;
  if (!dataView || !props.rowMeta) return;

  const original = dataView.getItemMetadata?.bind(dataView);

  dataView.getItemMetadata = (row) => {
    const base = original ? original(row) : null;
    if (base) return base;
    return buildItemMetadata(row);
  };
};

const gridOptions = ref(
  buildGridOptions(
    {
      filterable: props.filterable,
      externalFilter: props.externalFilter,
      editable: props.editable,
      autoEdit: props.autoEdit,
      selectable: props.selectable,
      multiSelect: props.multiSelect,
      checkboxSelector: props.checkboxSelector,
      pageable: props.pageable,
      pageSize: props.pageSize,
      pageSizes: props.pageSizes,
      // 2단 헤더는 컬럼에 group이 하나라도 있을 때만 켠다 (드래그 그룹핑과 같은 패널을 쓰므로)
      hasColumnGroup: slickColumns.value.some((col) => col.columnGroup),
      headerHeight: props.headerHeight,
      showSummary: props.showSummary,
      // 커스텀 페이지네이션 (왼쪽/중앙/오른쪽 + 반응형)
      paginationComponent: SlickGridPagination,
      paginationAlign: props.paginationAlign,
      paginationShowPageSize: props.paginationShowPageSize,
      gridMenu: props.gridMenu,
      groupable: props.groupable,
      excelExport: props.excelExport,
      exportFilename: props.exportFilename,
      exportSheetName: props.exportSheetName,
      treeDataOptions: props.treeDataOptions,
      idField: props.idField,
      rowHeight: props.rowHeight,
      // 서버 사이드 모드 (fetchData prop이 있을 때만)
      backendServiceApi,
      // autoResize가 window가 아니라 이 래퍼를 기준으로 크기를 계산하게 한다
      containerSelector: `#${wrapperId}`,
      height: props.height,
      width: props.width,
      autoHeight: props.autoHeight,
      fitColumns: props.fitColumns,
      dark: props.dark,
    },
    props.options,
  ),
);

/* ---------------------------------------------------------------------------------------------------------------
이벤트 정규화

slickgrid-vue의 이벤트는 CustomEvent로 전달된다.
 - SlickGrid 원본 이벤트  : e.detail = { eventData, args }
 - 래퍼 자체 이벤트       : e.detail = payload
프로젝트 관례(on- 접두사)에 맞춰 다시 emit하면서 detail을 벗겨준다.
--------------------------------------------------------------------------------------------------------------- */

/** SlickGrid 원본 이벤트의 args만 꺼낸다 */
const slickArgs = (e) => e?.detail?.args;

/** 현재 선택된 행 인덱스 + 실제 데이터 객체 */
const readSelection = () => {
  const grid = instance.value?.slickGrid;
  const dataView = instance.value?.dataView;
  if (!grid || !dataView) return { rows: [], items: [] };

  const rows = grid.getSelectedRows() ?? [];
  return { rows, items: rows.map((row) => dataView.getItem(row)).filter(Boolean) };
};

const handleGridCreated = (e) => {
  instance.value = e.detail;

  // 행/셀 단위 제어(rowMeta)를 dataView에 연결
  wireRowMeta();

  // 전체 선택 체크박스를 직접 심는다 (헤더 DOM이 만들어진 뒤여야 한다)
  nextTick(wireSelectAllCheckbox);

  // 첫 서버 조회가 그리드 생성보다 먼저 끝난 경우 전체 건수를 여기서 반영한다
  if (serverTotalCount.value > 0) applyServerTotalCount();

  // 합계 행 최초 렌더 (footer row DOM이 만들어진 뒤여야 한다)
  nextTick(renderSummary);

  emit("on-grid-created", e.detail);
};

/* ---------------------------------------------------------------------------------------------------------------
셀 안의 컴포넌트 클릭 처리

셀에는 버튼 / 체크박스 / 링크 / 직접 만든 커스텀 요소가 들어갈 수 있다.
어떤 것을 눌렀는지 구분해서 각각 다른 이벤트로 올려준다.

판별은 클릭 지점에서 위로 올라가며 data 속성을 찾는 방식이다.
  data-sg-toggle="필드명"  -> 체크박스류. 데이터를 갱신하고 on-cell-toggle
  data-sg-action="액션명"  -> 버튼류. on-cell-action

직접 만든 포맷터에서도 data-sg-action 만 붙여주면 그대로 on-cell-action 으로 올라온다.
  formatter: (row, cell, value, col, item) => {
    const el = document.createElement('span');
    el.dataset.sgAction = 'detail';   // <- 이것만 붙이면 됨
    return el;
  }
--------------------------------------------------------------------------------------------------------------- */
const handleClick = (e) => {
  const args = slickArgs(e);
  if (!args) return;

  const grid = instance.value?.slickGrid;
  const item = instance.value?.dataView?.getItem(args.row);
  const column = grid?.getColumns?.()?.[args.cell];
  const target = e?.detail?.eventData?.target;

  // ----- 1. 체크박스 등 토글 요소 -----
  const toggleEl = target?.closest?.("[data-sg-toggle]");

  if (toggleEl) {
    const field = toggleEl.dataset.sgToggle;
    const checked = !!toggleEl.checked;
    const params = column?.params ?? {};

    // 저장값은 checkedValue/uncheckedValue 설정을 따른다 ('Y'/'N' 문자열 데이터 대응)
    const value = checked ? (params.checkedValue ?? true) : (params.uncheckedValue ?? false);

    if (item && field) {
      /*
       * 데이터를 반드시 갱신해야 한다.
       * 갱신하지 않으면 SlickGrid가 셀을 다시 그리는 순간(스크롤/정렬/필터) 체크가 원래대로 돌아간다.
       *
       * item은 dataset 배열 안의 객체와 같은 참조라서 여기서 바꾸면 v-model에도 반영된다.
       * dataView.updateItem()은 id 속성을 요구하므로 id가 없는 데이터에서도 동작하도록
       * 직접 대입 후 해당 행만 다시 그린다.
       */
      item[field] = value;

      // 체크박스 토글도 데이터 변경이므로 변경행에 포함시킨다
      markDirty(item, field);
    }

    /*
     * 이벤트를 먼저 발행하고 다시 그리기는 뒤로 미룬다.
     *
     * grid.render()는 뷰포트를 동기적으로 다시 그리는 무거운 작업이다.
     * 이걸 emit보다 먼저 호출하면 렌더가 끝날 때까지 이벤트 전달이 밀려서
     * 화면(이벤트 로그 등)이 한 박자 늦게 갱신되는 것처럼 보인다.
     *
     * 체크박스는 네이티브 동작으로 이미 표시가 바뀌어 있으므로 즉시 렌더할 필요가 없다.
     * 데이터와 DOM을 맞추기 위한 재렌더는 다음 마이크로태스크에서 처리한다.
     */
    emit("on-cell-toggle", { field, checked, value, row: args.row, item, column });

    if (item && field) {
      queueMicrotask(() => {
        grid?.invalidateRow?.(args.row);
        grid?.render?.();
      });
    }
    return;
  }

  // ----- 2. 버튼 / 커스텀 액션 요소 -----
  const actionEl = target?.closest?.("[data-sg-action]");

  if (actionEl) {
    // 버튼 클릭을 행 클릭으로도 취급하면 "수정 버튼을 눌렀는데 행 상세까지 열리는" 문제가 생긴다.
    // 그래서 여기서 끊는다.
    emit("on-cell-action", { action: actionEl.dataset.sgAction, row: args.row, item, column, target: actionEl });
    return;
  }

  // ----- 3. 일반 행 클릭 -----
  emit("on-row-click", { ...args, item, column });
};

const handleDblClick = (e) => {
  const args = slickArgs(e);
  if (!args) return;
  emit("on-row-dblclick", {
    ...args,
    item: instance.value?.dataView?.getItem(args.row),
    column: instance.value?.slickGrid?.getColumns?.()?.[args.cell],
  });
};

/* ---------------------------------------------------------------------------------------------------------------
컬럼 헤더 우클릭 -> 컬럼별 헤더 메뉴(정렬 / 컬럼 숨기기 / 컬럼 고정)

헤더 메뉴는 원래 컬럼마다 우측에 뜨는 ∨ 버튼으로 열린다.
그런데 그 버튼은 position:absolute 로 컬럼 우측에 떠 있어서, 맨 오른쪽 컬럼에서는
우측 상단 그리드 메뉴(☰)와 같은 자리에 겹친다.
그래서 ∨ 버튼은 CSS로 숨기고(theme/slickgrid-custom.css) 같은 메뉴를 우클릭으로 연다.

숨긴 버튼의 click()을 그대로 호출하는 이유:
 - 라이브러리가 버튼에 걸어둔 핸들러가 disposeAllMenus() 로 열려 있는 메뉴를 먼저 정리한 뒤
   createParentMenu()를 부른다. 직접 createParentMenu()를 부르면 그 정리 단계까지 우리가 재현해야 하고,
   그건 protected 메서드라 버전이 올라가면 조용히 깨진다.
 - 메뉴 위치는 repositionMenu()가 이벤트 target의 getBoundingClientRect()로 계산한다.
   버튼을 target으로 넘기면 위치 계산이 기존(∨ 클릭)과 완전히 같아진다.
   (그래서 CSS는 display:none 이 아니라 visibility:hidden 이어야 한다 — 박스가 남아야 한다)

행번호 컬럼처럼 excludeFromHeaderMenu 인 컬럼에는 버튼이 만들어지지 않으므로 메뉴도 열리지 않는다.
그 경우에도 브라우저 기본 우클릭 메뉴는 막는다 (컬럼마다 우클릭 동작이 달라 보이지 않게).
--------------------------------------------------------------------------------------------------------------- */
const handleHeaderContextMenu = (e) => {
  /*
   * 2층(:options)에서 컬럼 선택기를 되살린 프로젝트라면 우클릭의 주인은 그쪽이다.
   * 그때 우리까지 헤더 메뉴를 열면 메뉴 두 개가 같은 자리에 겹쳐 뜬다.
   * (선택기는 자기 핸들러에서 브라우저 기본 메뉴를 막으므로 여기서는 그냥 빠진다)
   */
  if (gridOptions.value?.enableColumnPicker) return;

  // eventData는 SlickEventData이고 preventDefault()가 원본 마우스 이벤트로 전달된다
  e?.detail?.eventData?.preventDefault?.();

  // 헤더의 빈 여백이나 ☰ 버튼 위를 우클릭하면 column이 없다
  const column = slickArgs(e)?.column;
  if (!column) return;

  const headerEl = instance.value?.slickGrid?.getHeaderColumn?.(column.id);
  headerEl?.querySelector(".slick-header-menu-button")?.click();
};

const handleCellChange = (e) => {
  const args = slickArgs(e);
  if (!args) return;

  const item = args.item ?? instance.value?.dataView?.getItem(args.row);

  // 변경행으로 기록. args.column을 쓴다 (cell 인덱스로 찾으면 컬럼 순서변경 시 어긋남)
  markDirty(item, args.column?.field);

  // 값이 바뀌었으니 합계도 다시 계산
  renderSummary();

  emit("on-cell-change", { ...args, item });
};

const handleSelectedRowsChanged = () => {
  // 행을 개별로 선택/해제해도 상단 전체선택 체크박스 상태가 따라가도록
  syncSelectAllCheckbox();
  emit("on-selection-change", readSelection());
};

const handleGridStateChanged = (e) => emit("on-grid-state-changed", e.detail);

const handleValidationError = (e) => emit("on-validation-error", slickArgs(e));

const handleRowCountChanged = (e) => {
  // 데이터 추가/삭제/필터로 행 수가 바뀌면 합계도 다시 계산해야 한다
  renderSummary();
  emit("on-row-count-changed", slickArgs(e));
};

const handleAfterExportToExcel = (e) => emit("on-export-complete", e.detail);

/* ---------------------------------------------------------------------------------------------------------------
명령형 API (4층 탈출구)

<SlickGrid ref="gridRef" ... />  ->  gridRef.value.exportToExcel()
--------------------------------------------------------------------------------------------------------------- */
defineExpose({
  /** SlickgridVueInstance 전체 (slickGrid / dataView / gridService / filterService ... ) */
  getInstance: () => instance.value,
  /** SlickGrid 원본 객체 */
  getGrid: () => instance.value?.slickGrid,
  /** DataView 원본 객체 */
  getDataView: () => instance.value?.dataView,

  /** 선택된 행 { rows, items } */
  getSelection: readSelection,
  /** 선택된 행의 데이터만 [item, ...] */
  getSelectedItems: () => readSelection().items,
  /** 행 인덱스 배열로 선택 지정 */
  setSelectedRows: (rows) => instance.value?.slickGrid?.setSelectedRows(rows ?? []),
  /** 화면에 보이는 전체 행 선택 */
  selectAll: () => {
    const count = instance.value?.dataView?.getLength?.() ?? 0;
    instance.value?.slickGrid?.setSelectedRows(Array.from({ length: count }, (_, i) => i));
  },
  /** 선택 해제 */
  clearSelection: () => instance.value?.slickGrid?.setSelectedRows([]),

  /* -------------------------------------------------------------------------------------------------------------
  행 추가 / 수정 / 삭제

  그리드 밖 버튼으로 CRUD를 처리하는 형태를 위해 gridService를 감싸 노출한다.
  gridService를 쓰면 정렬·필터·페이징 상태를 유지한 채 DataView와 화면이 함께 갱신된다.
  (dataset 배열을 직접 건드리면 정렬/필터가 걸린 상태에서 화면이 어긋날 수 있다)

  삭제는 idField 기준이므로 데이터에 그 키가 있어야 한다.
  ------------------------------------------------------------------------------------------------------------- */
  /** 행 추가. 기본은 맨 위에 추가 (options: { position: 'top' | 'bottom' }) */
  addRows: (items, options) => instance.value?.gridService?.addItems?.(items, options),
  /** 행 수정 (idField로 대상 행을 찾는다) */
  updateRows: (items) => instance.value?.gridService?.updateItems?.(items),
  /** 행 삭제 — 데이터 객체 배열로 지정 */
  removeRows: (items) => {
    const ids = (Array.isArray(items) ? items : [items]).map((item) => item?.[props.idField]).filter((id) => id !== undefined && id !== null);
    if (ids.length === 0) return;
    return instance.value?.gridService?.deleteItemByIds?.(ids);
  },
  /** 선택된 행 삭제 */
  removeSelectedRows: () => {
    const ids = readSelection()
      .items.map((item) => item?.[props.idField])
      .filter((id) => id !== undefined && id !== null);
    if (ids.length === 0) return;
    instance.value?.gridService?.deleteItemByIds?.(ids);
    instance.value?.slickGrid?.setSelectedRows([]);
  },
  /** 특정 행을 잠깐 강조 (저장 직후 어느 행이 바뀌었는지 보여줄 때) */
  highlightRow: (row) => instance.value?.gridService?.highlightRow?.(row),

  /** 화면 갱신 (데이터를 직접 조작한 뒤 호출) */
  refresh: () => {
    instance.value?.slickGrid?.invalidate();
    instance.value?.slickGrid?.render();
    renderSummary();
  },
  /** 하단 합계 행 다시 계산 */
  refreshSummary: renderSummary,
  /** 컨테이너 크기에 맞춰 다시 계산 */
  resize: () => instance.value?.resizerService?.resizeGrid(),
  /** 특정 행으로 스크롤 */
  scrollToRow: (row) => instance.value?.slickGrid?.scrollRowIntoView(row),

  /* -------------------------------------------------------------------------------------------------------------
  그리드 밖 입력창으로 필터 적용

  국내 업무화면에서 가장 흔한 형태 — 상단에 조회조건(텍스트박스/셀렉트)을 두고 [조회] 버튼을 누르는 패턴.
  그리드 내부 필터 행을 쓰지 않고도(filterable 없이도) 외부 입력값으로 필터를 걸 수 있다.

  서버 모드에서는 자동으로 서버 재조회까지 이어진다.

  사용 예)
    gridRef.value.applyFilters([
      { field: 'name',   value: keyword },              // 기본 연산자 = 포함(LIKE)
      { field: 'deptCd', value: dept, operator: 'EQ' }, // 정확히 일치
    ]);
  ------------------------------------------------------------------------------------------------------------- */
  /**
   * @param {Array} filters [{ field, value, operator }] 또는 [{ columnId, searchTerms, operator }]
   * @param {Object} [options]
   * @param {boolean} [options.triggerBackend=true] 서버 모드에서 재조회를 트리거할지
   */
  applyFilters: (filters, { triggerBackend = true } = {}) => {
    const normalized = (Array.isArray(filters) ? filters : [])
      .map((f) => {
        const columnId = f.columnId ?? f.field;
        // 값이 비어 있으면 그 조건은 제외한다 (빈 문자열로 필터를 걸면 결과가 0건이 된다)
        const terms = f.searchTerms ?? (f.value === "" || f.value === null || f.value === undefined ? null : [f.value]);
        if (!columnId || !terms) return null;
        return { columnId, operator: f.operator ?? "Contains", searchTerms: terms };
      })
      .filter(Boolean);

    return instance.value?.filterService?.updateFilters?.(normalized, true, triggerBackend);
  },

  /** 필터 전체 해제 */
  clearFilters: () => instance.value?.filterService?.clearFilters(),
  /** 정렬 전체 해제 */
  clearSorting: () => instance.value?.sortService?.clearSorting(),

  /* -------------------------------------------------------------------------------------------------------------
  그룹핑 (드래그 없이 코드로)

  헤더를 드래그하는 방식 외에, 셀렉트박스나 버튼으로 그룹을 지정하는 화면이 많다.
  groupable prop이 켜져 있어야 동작한다 (플러그인이 그때 생성되므로).
  ------------------------------------------------------------------------------------------------------------- */
  /**
   * 지정한 필드로 그룹핑
   * @param {string|string[]} fields 그룹 기준 필드명 (배열이면 다중 그룹)
   */
  groupBy: (fields) => {
    const plugin = instance.value?.extensionService?.getExtensionInstanceByName?.("draggableGrouping");

    if (!plugin) {
      console.warn("[SlickGrid] groupBy: groupable prop이 켜져 있어야 사용할 수 있습니다.");
      return;
    }

    plugin.setDroppedGroups(fields);
    instance.value?.slickGrid?.invalidate();
  },
  /** 그룹핑 해제 */
  clearGrouping: () => {
    const plugin = instance.value?.extensionService?.getExtensionInstanceByName?.("draggableGrouping");
    plugin?.clearDroppedGroups();
    instance.value?.slickGrid?.invalidate();
  },

  /** 현재 그리드 상태(컬럼폭/순서/숨김/필터/정렬/페이징). 사용자별 레이아웃 저장에 사용 */
  getGridState: () => instance.value?.gridStateService?.getCurrentGridState(),

  // ----- 변경행 추적 -----
  /** 변경된 행 목록 [{ item, fields }] — 저장 API로 보낼 대상 */
  getDirtyRows,
  /** 변경된 행의 데이터 객체만 [item, ...] */
  getDirtyItems: () => getDirtyRows().map((row) => row.item),
  /** 변경행 수 */
  getDirtyCount: () => dirtyMap.size,
  /** 변경 이력 초기화 (저장 성공 후 호출) */
  clearDirty,

  // ----- 서버 사이드 -----
  /**
   * 현재 조건(페이지/정렬/필터)으로 서버 재조회
   *
   * 조회 버튼처럼 "조건은 그대로 두고 다시 불러오기"에 사용한다.
   * 라이브러리 내부 트리거에 기대지 않고 process/postProcess 사이클을 직접 실행한다.
   * (같은 페이지에 머무는 경우 페이지 변경 이벤트가 발생하지 않아 재조회가 안 되는 문제를 피하기 위함)
   */
  reload: async () => {
    if (!backendServiceApi) return;

    const query = backendServiceApi.service.buildQuery();
    backendServiceApi.preProcess?.();

    try {
      const result = await backendServiceApi.process(query, {});
      backendServiceApi.postProcess(result);
    } catch (error) {
      backendServiceApi.onError(error);
    }
  },
  /** 서버가 알려준 전체 건수 */
  getTotalCount: () => serverTotalCount.value,

  /**
   * 엑셀 내보내기. excelExport prop이 true여야 동작합니다.
   *
   * 그리드 메뉴를 쓰지 않고 별도 버튼으로 내보낼 때 사용.
   * externalResources에 등록해둔 ExcelExportService 인스턴스를 직접 찾아 호출합니다.
   */
  exportToExcel: (exportOptions) => {
    const service = gridOptions.value?.externalResources?.find((r) => typeof r?.exportToExcel === "function");

    if (!service) {
      console.warn('[SlickGrid] exportToExcel: excelExport prop이 켜져 있지 않습니다.');
      return;
    }

    return service.exportToExcel(exportOptions);
  },

  /** 런타임 옵션 변경 (생성 후 바꿀 수 있는 옵션에만 유효) */
  setOptions: (partialOptions) => instance.value?.slickGrid?.setOptions(partialOptions),
});

// slickgrid-vue가 자체 onBeforeUnmount에서 dispose를 수행하므로 여기서 또 dispose하면 이중 해제가 된다.
// (부모의 onBeforeUnmount가 자식보다 먼저 실행됨) 우리는 참조만 끊는다.
onBeforeUnmount(() => {
  instance.value = null;
});

/** 부모가 넘긴 class/style만 최상위 div로 넘기고, 나머지는 SlickgridVue로 흘린다 */
const attrs = useAttrs();

/**
 * 래퍼에 걸어줄 style
 *
 * 헤더 높이는 CSS 변수로 넘긴다. 그리드 옵션이 아니라 CSS 변수인 이유는
 * 헤더 높이를 정하는 것이 테마 CSS의 --slick-header-column-height 이기 때문이다.
 */
const wrapperAttrs = computed(() => ({
  class: attrs.class,
  style: [{ "--slick-header-column-height": `${props.headerHeight}px` }, attrs.style],
}));
const passthroughAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div :id="wrapperId" class="sg-grid-wrapper" v-bind="wrapperAttrs">
    <SlickgridVue
      :grid-id="resolvedGridId"
      v-model:columns="slickColumns"
      v-model:options="gridOptions"
      v-model:dataset="dataset"
      v-bind="passthroughAttrs"
      @onVueGridCreated="handleGridCreated"
      @onClick="handleClick"
      @onDblClick="handleDblClick"
      @onHeaderContextMenu="handleHeaderContextMenu"
      @onCellChange="handleCellChange"
      @onSelectedRowsChanged="handleSelectedRowsChanged"
      @onGridStateChanged="handleGridStateChanged"
      @onValidationError="handleValidationError"
      @onRowCountChanged="handleRowCountChanged"
      @onAfterExportToExcel="handleAfterExportToExcel"
    >
      <!-- 3층 : 슬롯 통과 -->
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>
      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </SlickgridVue>

    <!-- 조회 중 오버레이. 그리드 위를 덮어 조작을 막고 진행 중임을 알린다 -->
    <div v-if="isLoading" class="sg-loading" role="status" aria-live="polite">
      <div class="sg-loading__box">
        <span class="sg-loading__spinner" aria-hidden="true"></span>
        <span class="sg-loading__text">조회 중...</span>
      </div>
    </div>
  </div>
</template>
