<script setup>
import { ref, computed, watch, useAttrs } from "vue";
import { DxDataGrid } from "devextreme-vue/data-grid";

import { buildColumns, buildSummaryItems, applyFillColumn, safeUrl } from "./composables/useGridColumns";
import { buildGridOptions, applyKoreanLocale, applyLicense, hasLicense } from "./composables/useGridOptions";

/* ***************************************************************************************************************
DevExtreme 그리드 공통 컴포넌트

기반 : devextreme-vue 26.1.3 (상용 — 평가판은 30일, 미등록 시 화면 메시지 + 콘솔 경고)

SlickGrid 공통 컴포넌트와 "같은 축약 문법 / 같은 4계층 구조 / 같은 이벤트 이름"을 쓴다.
그리드 라이브러리를 바꿔도 사용처 코드를 거의 그대로 옮길 수 있게 하는 것이 목적이다.

--------------------------------------------------------------------------------------------------
커스텀 4계층 (아래로 갈수록 자유도가 높아짐)
--------------------------------------------------------------------------------------------------
1층 축약   :columns="[{ field:'salary', header:'급여', type:'amount' }]"
2층 통과   :options="{ focusedRowEnabled: true }"   DevExtreme 원본 옵션 전체를 deep merge
3층 슬롯   <template #toolbar> / #empty
4층 탈출구 @on-grid-created="inst => inst.instance.xxx()" 또는 ref 로 명령형 API

--------------------------------------------------------------------------------------------------
SlickGrid 래퍼와 다른 점
--------------------------------------------------------------------------------------------------
- 테마 CSS 가 .dx-* 로 잘 스코프되어 있어 Vuetify 와 충돌하지 않는다.
  (SlickGrid full 테마는 전역 .mdi 규칙으로 앱 전체 아이콘을 깨뜨렸다 — 여기서는 그 위험이 없음을 확인했다)
- 한글 문구를 직접 작성하지 않는다. DevExtreme 이 ko.json(854개)을 제공한다.
- 리치 셀(버튼/이미지/첨부)을 DOM API 로 만들지 않고 Vue 템플릿 슬롯으로 만든다.
- 상용 라이선스가 필요하다. 키는 소스에 박지 않고 VITE_DEVEXTREME_LICENSE_KEY 로 주입한다.
******************************************************************************************************************/
import "devextreme/dist/css/dx.fluent.blue.light.css";
import "./theme/devextreme-custom.css";

// 한글화·라이선스는 앱 전체에 한 번만 적용된다 (모듈 내부에서 중복 호출을 막는다)
applyKoreanLocale();
applyLicense();

// 부모의 class/style 이 최상위 div 에 정상적으로 붙도록 자동 상속을 끄고 수동으로 상속한다
defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** <pre>
   * 컬럼 정의 (축약 형식 / DevExtreme 원본 형식 혼용 가능)
   *
   * { field, header, type, width, align, filter, editable, codes, ...DevExtreme 원본옵션 }
   *
   * type : text | longText | number | decimal | amount | date | datetime | yn | code
   *        | checkbox | button | image | file | link
   *
   * 숫자 단위 : unit('원'/'%') , prefix('$') , scale(1000 -> 천원 단위로 축약)
   * 2단 헤더  : group('기본 정보')  — 연속된 같은 이름끼리 묶인다
   * 합계      : summary('sum'|'avg'|'count'|'min'|'max')
   * 검증      : required , requiredMessage , pattern , patternMessage , validator , validatorMessage
   * 버튼      : buttonText , action , buttonDisabled(fn) , buttonHidden(fn)
   * </pre> */
  columns: { type: Array, required: true },
  /** DevExtreme 원본 옵션. 여기에 넣은 값이 모든 기본값을 이깁니다. (2층) */
  options: { type: Object, default: () => ({}) },
  /** 각 행을 구분하는 고유 키 필드명 */
  idField: { type: String, default: "id" },

  // ----- 기능 플래그 -----
  /** 맨 앞에 행번호(No) 컬럼 추가 */
  rowNumber: { type: Boolean, default: false },
  /** 행번호 컬럼 헤더명 */
  rowNumberHeader: { type: String, default: "No" },
  /** 행번호 컬럼 너비(px) */
  rowNumberWidth: { type: Number, default: 60 },
  /** 컬럼별 필터 행 + 헤더 값목록 필터 */
  filterable: { type: Boolean, default: false },
  /** 우측 상단 전체 검색창 */
  searchable: { type: Boolean, default: false },
  /** 인라인 편집 */
  editable: { type: Boolean, default: false },
  /** 편집 방식 : cell | row | batch | form | popup */
  editMode: {
    type: String,
    default: "cell",
    validator: (v) => ["cell", "row", "batch", "form", "popup"].includes(v),
  },
  /** 행 추가 허용 (editable과 함께) */
  allowAdding: { type: Boolean, default: false },
  /** 행 삭제 허용 (editable과 함께) */
  allowDeleting: { type: Boolean, default: false },
  /** 행 선택 */
  selectable: { type: Boolean, default: false },
  /** 다중 선택 */
  multiSelect: { type: Boolean, default: true },
  /** 좌측 체크박스 컬럼 + 좌측 상단 전체선택 */
  checkboxSelector: { type: Boolean, default: false },
  /** 페이지네이션 (끄면 가상 스크롤로 대용량 처리) */
  pageable: { type: Boolean, default: false },
  /** 페이지당 건수 */
  pageSize: { type: Number, default: 20 },
  /** 페이지당 건수 선택 목록 */
  pageSizes: { type: Array, default: () => [20, 50, 100, 500] },
  /** <pre>
   * 페이지네이션 정렬 위치 : left | center | right
   *
   * DevExtreme 에는 pager 정렬 옵션이 없어 CSS 로 처리합니다.
   * </pre> */
  paginationAlign: {
    type: String,
    default: "right",
    validator: (v) => ["left", "center", "right"].includes(v),
  },
  /** 페이지당 건수 선택 표시 */
  paginationShowPageSize: { type: Boolean, default: true },
  /** <pre>
   * 페이지당 건수를 고르는 방식 : input | buttons
   *
   * input   : 목록에서 고르거나 직접 숫자를 입력할 수 있는 입력창 (기본)
   * buttons : DevExtreme 기본 방식인 [20][50][100][500] 버튼
   * </pre> */
  paginationPageSizeMode: {
    type: String,
    default: "input",
    validator: (v) => ["input", "buttons"].includes(v),
  },
  /** 페이지당 건수 입력창 라벨 (paginationPageSizeMode: 'input' 일 때) */
  paginationPageSizeLabel: { type: String, default: "페이지당" },
  /** 페이지당 건수 직접 입력 허용 범위 */
  paginationPageSizeMin: { type: Number, default: 1 },
  paginationPageSizeMax: { type: Number, default: 1000 },
  /** "N페이지 중 M페이지 (전체 K개 항목)" 안내 표시 */
  paginationShowInfo: { type: Boolean, default: true },
  /** 페이지 번호 버튼(1 2 3 …) 표시 */
  paginationShowPages: { type: Boolean, default: true },
  /** 이전/다음 이동 버튼 표시 */
  paginationShowNavigation: { type: Boolean, default: true },
  /** <pre>
   * 표를 컨테이너 가로 폭에 꽉 채웁니다.
   *
   * true (기본) : 남는 공간까지 컬럼이 늘어나 표가 컨테이너를 꽉 채웁니다.
   * false       : 컬럼을 내용 크기에 맞춥니다. 합계가 컨테이너보다 좁으면 표도 좁게 남습니다.
   * </pre> */
  fitWidth: { type: Boolean, default: true },
  /** 헤더를 상단 패널로 드래그해서 그룹핑 */
  groupable: { type: Boolean, default: false },
  /** 컬럼 표시/숨김 선택기 */
  columnChooser: { type: Boolean, default: false },
  /** 컬럼 고정(좌/우) 메뉴 */
  columnFixing: { type: Boolean, default: false },
  /** 하단 합계 행 (컬럼에 summary 를 지정한 것만 값이 나옵니다) */
  showSummary: { type: Boolean, default: false },
  /** 엑셀 내보내기 (툴바 버튼 + exportToExcel() 사용 가능) */
  excelExport: { type: Boolean, default: false },
  /** 엑셀 파일명 (확장자 제외). 한글 가능 */
  exportFilename: { type: String, default: "export" },
  /** 엑셀 시트명 */
  exportSheetName: { type: String, default: "Sheet1" },
  /** <pre>
   * 컬럼 폭·순서·필터·정렬을 localStorage 에 저장/복원할 키
   *
   * 지정하면 사용자별 그리드 레이아웃이 기억됩니다. (미지정 시 저장 안 함)
   * </pre> */
  stateKey: { type: String, default: null },

  // ----- 크기 -----
  /** 높이 — 'auto'(기본) 또는 숫자/'300px' */
  height: { type: [Number, String], default: "auto" },
  /** 너비 — 'auto'(기본) 또는 숫자/'800px' */
  width: { type: [Number, String], default: "auto" },

  // ----- 표시 -----
  /** 컬럼명 기본 정렬 (셀 정렬과 독립) */
  headerAlign: {
    type: String,
    default: "center",
    validator: (v) => ["left", "center", "right"].includes(v),
  },
  /** 셀 내용이 길 때 ... 으로 줄임 */
  ellipsis: { type: Boolean, default: true },
  /** 조회 중 오버레이 */
  loading: { type: Boolean, default: false },

  /** 개발 중 컬럼 정의 오타를 콘솔 경고로 알림 */
  warnInvalidColumns: { type: Boolean, default: true },
});

const emit = defineEmits([
  /** 그리드 생성 완료. payload는 DxDataGrid 컴포넌트 참조 (4층 탈출구) */
  "on-grid-created",
  /** 행 클릭 */
  "on-row-click",
  /** 행 더블클릭 */
  "on-row-dblclick",
  /** 셀 값 변경 (편집 확정). payload { item, column, field, value } */
  "on-cell-change",
  /** 선택 행 변경. payload { rows, items } */
  "on-selection-change",
  /** 셀 안의 버튼 클릭. payload { action, item, column } */
  "on-cell-action",
  /** 셀 안의 체크박스 토글. payload { field, checked, value, item } */
  "on-cell-toggle",
  /** 변경행 목록 변경. payload { rows, count } */
  "on-dirty-change",
  /** 엑셀 내보내기 완료 */
  "on-export-complete",
  /** 페이지당 건수 변경 */
  "on-page-size-change",
  /** 오류 */
  "on-error",
]);

/** 데이터 (v-model) */
const dataset = defineModel({ type: Array, default: () => [] });

/** DxDataGrid 컴포넌트 참조 */
const gridRef = ref(null);

/** DevExtreme 위젯 인스턴스 (원본 API 접근용) */
const widget = () => gridRef.value?.instance;

/* ---------------------------------------------------------------------------------------------------------------
컬럼

축약 정의 -> DevExtreme Column 배열.
행번호 컬럼은 DevExtreme 에 내장 옵션이 없어 우리가 직접 만들어 맨 앞에 붙인다.
--------------------------------------------------------------------------------------------------------------- */
const dxColumns = ref([]);

/** 행번호 컬럼 — 정렬/필터를 걸어도 화면 순서대로 1부터 다시 매겨진다 */
const createRowNumberColumn = () => ({
  caption: props.rowNumberHeader,
  width: props.rowNumberWidth,
  minWidth: 40,
  alignment: "center",
  // 컬럼명도 중앙 — 다른 컬럼과 같은 방식(dxg-h-*)으로 맞춘다.
  // (DevExtreme 이 헤더 td 에 style.textAlign 을 인라인으로 박으므로 클래스 + !important 가 필요하다)
  cssClass: "dxg-h-center",
  // 데이터 필드가 없는 계산 컬럼
  allowSorting: false,
  allowFiltering: false,
  allowEditing: false,
  allowReordering: false,
  allowHiding: false,
  // rowIndex 는 화면에 보이는 순번이라 정렬/필터 후에도 1부터 다시 매겨진다
  cellTemplate: "sgCell-rowNumber",
  sgCellType: "rowNumber",
});

watch(
  [() => props.columns, () => props.fitWidth],
  ([cols, fitWidth]) => {
    const built = buildColumns(cols, {
      warn: props.warnInvalidColumns,
      headerAlign: props.headerAlign,
      ellipsis: props.ellipsis,
    });

    const all = props.rowNumber ? [createRowNumberColumn(), ...built] : built;

    // 행번호 컬럼까지 포함한 최종 목록에서 폭을 계산해야 비율이 맞는다
    dxColumns.value = fitWidth ? applyFillColumn(all) : all;
  },
  { immediate: true, deep: true },
);

/** 합계 설정 (컬럼의 summary 를 읽어 만든다) */
const summaryConfig = computed(() => {
  if (!props.showSummary) return undefined;

  const totalItems = buildSummaryItems(dxColumns.value);
  return totalItems.length > 0 ? { totalItems } : undefined;
});

/* ---------------------------------------------------------------------------------------------------------------
그리드 옵션
--------------------------------------------------------------------------------------------------------------- */
const gridOptions = computed(() =>
  buildGridOptions(
    {
      idField: props.idField,
      filterable: props.filterable,
      searchable: props.searchable,
      editable: props.editable,
      editMode: props.editMode,
      allowAdding: props.allowAdding,
      allowDeleting: props.allowDeleting,
      selectable: props.selectable,
      multiSelect: props.multiSelect,
      checkboxSelector: props.checkboxSelector,
      pageable: props.pageable,
      pageSize: props.pageSize,
      pageSizes: props.pageSizes,
      // 입력창 방식일 때는 DevExtreme 기본 버튼을 숨기고 우리 컨트롤을 쓴다
      paginationShowPageSize: props.paginationShowPageSize && props.paginationPageSizeMode === "buttons",
      paginationShowInfo: props.paginationShowInfo,
      paginationShowNavigation: props.paginationShowNavigation,
      fitWidth: props.fitWidth,
      groupable: props.groupable,
      columnChooser: props.columnChooser,
      columnFixing: props.columnFixing,
      excelExport: props.excelExport,
      stateKey: props.stateKey,
      height: props.height,
      width: props.width,
    },
    props.options,
  ),
);

/* ---------------------------------------------------------------------------------------------------------------
변경행 추적 (dirty rows)

편집 가능한 그리드에서 "바뀐 행만" 서버로 보내야 하는 요구가 거의 항상 생긴다.
idField 를 키로 쓰고, 없으면 행 객체 참조를 키로 써서 id 없는 데이터에서도 동작하게 한다.
--------------------------------------------------------------------------------------------------------------- */
const dirtyMap = new Map();

const getDirtyRows = () => [...dirtyMap.values()].map(({ item, fields }) => ({ item, fields: [...fields] }));

const markDirty = (item, field) => {
  if (!item) return;

  const key = item?.[props.idField] ?? item;
  const entry = dirtyMap.get(key) ?? { item, fields: new Set() };
  if (field) entry.fields.add(field);
  dirtyMap.set(key, entry);

  emit("on-dirty-change", { rows: getDirtyRows(), count: dirtyMap.size });
};

const clearDirty = () => {
  if (dirtyMap.size === 0) return;
  dirtyMap.clear();
  emit("on-dirty-change", { rows: [], count: 0 });
};

/* ---------------------------------------------------------------------------------------------------------------
이벤트 정규화

DevExtreme 이벤트를 SlickGrid 래퍼와 같은 on- 접두사 이벤트로 바꿔 올려준다.
--------------------------------------------------------------------------------------------------------------- */

/** 현재 선택된 행 { rows(인덱스), items(데이터) } */
const readSelection = () => {
  const grid = widget();
  if (!grid) return { rows: [], items: [] };

  const items = grid.getSelectedRowsData?.() ?? [];
  const rows = items.map((item) => grid.getRowIndexByKey?.(item?.[props.idField])).filter((i) => i !== undefined && i >= 0);

  return { rows, items };
};

const onRowClick = (e) => {
  // 그룹 행이나 헤더를 눌렀을 때는 행 클릭으로 취급하지 않는다
  if (e.rowType !== "data") return;
  emit("on-row-click", { row: e.rowIndex, item: e.data, column: e.column });
};

const onRowDblClick = (e) => {
  if (e.rowType !== "data") return;
  emit("on-row-dblclick", { row: e.rowIndex, item: e.data, column: e.column });
};

const onSelectionChanged = () => emit("on-selection-change", readSelection());

/**
 * 편집 확정 (변경된 필드까지 알 수 있는 유일한 지점)
 *
 * [주의] onCellValueChanged 는 DataGrid 에 없는 이벤트다.
 * devextreme-vue 의 props 목록에 없어서 @cell-value-changed 로 붙여도
 * 알 수 없는 옵션으로 취급되어 조용히 무시된다. (실제로 그렇게 잘못 작성했다가 발견)
 *
 * onRowUpdating 은 e.newData 에 "바뀐 필드만" 담아주므로 변경 추적에 가장 적합하다.
 *   e.oldData : 변경 전 행 전체
 *   e.newData : 변경된 필드만 담긴 부분 객체
 *   e.key     : 행 키
 */
const onRowUpdating = (e) => {
  const changedFields = Object.keys(e.newData ?? {});
  // oldData 와 newData 를 합쳐 "변경 후 행"을 만든다 (이 시점의 데이터는 아직 반영 전)
  const item = { ...e.oldData, ...e.newData };

  changedFields.forEach((field) => markDirty(item, field));

  changedFields.forEach((field) => {
    emit("on-cell-change", { item, field, value: e.newData[field], oldValue: e.oldData?.[field], key: e.key });
  });
};

/* ---------------------------------------------------------------------------------------------------------------
엑셀 내보내기

DevExtreme 은 exceljs 의 Workbook 객체를 받아 내보낸다 (라이브러리를 번들하지 않는다).
exceljs 는 1MB 가 넘으므로 정적 import 하지 않고 실제로 내보낼 때만 동적 import 한다.

--------------------------------------------------------------------------------------------------
DevExtreme 26 에는 "프로그램으로 내보내기" 메서드가 없다 (소스에서 확인)
--------------------------------------------------------------------------------------------------
예전 버전의 grid.exportToExcel() 은 삭제되었다.
  - dx.all.d.ts 에 DataGrid 메서드로 존재하지 않는다 (PivotGrid 지역화 문구 키만 남아 있음)
  - 내부 exportTo() 는 grids/data_grid/export/m_export.js 에 있지만
    publicMethods() 가 ['getDataProvider'] 만 반환하므로 외부에서 호출할 수 없다

그래서 툴바 버튼(onExporting)과 우리 exportToExcel() 이 같은 함수를 호출하게 만든다.
위젯에 없는 메서드를 부르면 옵셔널 체이닝 때문에 오류도 없이 조용히 아무 일도 일어나지 않는다.

또한 위 exportTo() 는 onExporting 을 부르고 끝이며 e.cancel 을 읽지 않는다.
=> 막아야 할 기본 동작이 애초에 없으므로 e.cancel 을 세우지 않는다.
--------------------------------------------------------------------------------------------------------------- */

/** 실제 내보내기 수행 (툴바 버튼 · exportToExcel() 공용) */
const runExcelExport = async (component) => {
  const grid = component ?? widget();
  if (!grid) return;

  try {
    const [{ Workbook }, { exportDataGrid }] = await Promise.all([import("exceljs"), import("devextreme/excel_exporter")]);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(props.exportSheetName);

    await exportDataGrid({ component: grid, worksheet, autoFilterEnabled: true });

    /*
     * xlsx 로 저장한다.
     * .xlsx 는 ZIP + UTF-8 XML 구조라 한글 파일명·내용이 안전하다.
     * (SlickGrid 래퍼에서도 같은 이유로 xlsx 를 고정했다 — xls 는 인코딩 정보가 없어 깨진다)
     *
     * file-saver 같은 추가 의존성 없이 브라우저 기본 다운로드를 쓴다.
     */
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.exportFilename}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    emit("on-export-complete", { filename: `${props.exportFilename}.xlsx` });
  } catch (error) {
    emit("on-error", error);
  }
};

/** 툴바의 내보내기 버튼 */
const onExporting = (e) => runExcelExport(e.component);

/* ---------------------------------------------------------------------------------------------------------------
리치 셀 헬퍼 (템플릿에서 사용)
--------------------------------------------------------------------------------------------------------------- */

/** 버튼 라벨 (문자열 또는 행별 함수) */
const buttonLabel = (cell) => {
  const opts = cell.column?.sgCellOptions ?? {};
  const text = typeof opts.buttonText === "function" ? opts.buttonText(cell.data) : opts.buttonText;
  return text ?? cell.value ?? "";
};

const isButtonHidden = (cell) => {
  const fn = cell.column?.sgCellOptions?.buttonHidden;
  return typeof fn === "function" && fn(cell.data);
};

const isButtonDisabled = (cell) => {
  const fn = cell.column?.sgCellOptions?.buttonDisabled;
  return typeof fn === "function" && fn(cell.data);
};

const onCellButtonClick = (cell) => {
  emit("on-cell-action", { action: cell.column?.sgCellOptions?.action, item: cell.data, column: cell.column });
};

/** 첨부파일 — 값이 { name, url } 객체이거나 URL 문자열 */
const fileInfo = (value) => {
  const rawUrl = value && value.constructor === Object ? value.url : value;
  const url = safeUrl(rawUrl);
  if (!url) return null;

  const name = (value && value.constructor === Object ? value.name : null) ?? decodeURIComponent(String(url).split("/").pop() ?? "");
  return { url, name };
};

/** 체크박스 셀 — 클릭하면 데이터를 갱신하고 이벤트를 올린다 */
const isCellChecked = (cell) => {
  const checkedValue = cell.column?.sgCellOptions?.checkedValue ?? true;
  return cell.value === checkedValue || cell.value === true || cell.value === "Y" || cell.value === 1;
};

const onCellCheckboxChange = (cell, event) => {
  const opts = cell.column?.sgCellOptions ?? {};
  const checked = !!event.target.checked;
  const value = checked ? (opts.checkedValue ?? true) : (opts.uncheckedValue ?? false);
  const field = cell.column?.dataField;

  if (cell.data && field) {
    /*
     * 데이터를 직접 갱신한다. cell.data 는 dataset 배열 안의 객체와 같은 참조라서
     * v-model 에도 반영된다. (갱신하지 않으면 셀이 다시 그려질 때 체크가 원복된다)
     */
    cell.data[field] = value;
    markDirty(cell.data, field);
    // 셀만 다시 그린다 (전체 refresh 는 스크롤 위치가 튄다)
    widget()?.repaintRows?.([cell.rowIndex]);
  }

  emit("on-cell-toggle", { field, checked, value, item: cell.data });
};

/* ---------------------------------------------------------------------------------------------------------------
명령형 API (4층 탈출구)
--------------------------------------------------------------------------------------------------------------- */
defineExpose({
  /** DxDataGrid 컴포넌트 참조 */
  getInstance: () => gridRef.value,
  /** DevExtreme 위젯 인스턴스 (원본 API 전체) */
  getGrid: widget,

  // ----- 선택 -----
  /** 선택된 행 { rows, items } */
  getSelection: readSelection,
  /** 선택된 행의 데이터만 */
  getSelectedItems: () => readSelection().items,
  /** 화면에 보이는 전체 선택 */
  selectAll: () => widget()?.selectAll?.(),
  /** 선택 해제 */
  clearSelection: () => widget()?.clearSelection?.(),
  /** 키 배열로 선택 지정 */
  setSelectedKeys: (keys) => widget()?.selectRows?.(keys ?? [], false),

  // ----- 행 추가/수정/삭제 -----
  /** 행 추가 (편집 UI 없이 데이터에 바로 추가) */
  addRows: (items) => {
    const list = Array.isArray(items) ? items : [items];
    dataset.value = [...list, ...dataset.value];
  },
  /** 행 수정 — idField 로 대상을 찾아 병합 */
  updateRows: (items) => {
    const list = Array.isArray(items) ? items : [items];
    dataset.value = dataset.value.map((row) => {
      const found = list.find((item) => item?.[props.idField] === row?.[props.idField]);
      return found ? { ...row, ...found } : row;
    });
  },
  /** 행 삭제 */
  removeRows: (items) => {
    const keys = (Array.isArray(items) ? items : [items]).map((item) => item?.[props.idField]);
    dataset.value = dataset.value.filter((row) => !keys.includes(row?.[props.idField]));
  },
  /** 선택된 행 삭제 */
  removeSelectedRows: () => {
    const keys = readSelection().items.map((item) => item?.[props.idField]);
    if (keys.length === 0) return;
    dataset.value = dataset.value.filter((row) => !keys.includes(row?.[props.idField]));
    widget()?.clearSelection?.();
  },

  // ----- 변경행 추적 -----
  /** 변경된 행 [{ item, fields }] */
  getDirtyRows,
  /** 변경된 행의 데이터만 */
  getDirtyItems: () => getDirtyRows().map((row) => row.item),
  /** 변경행 수 */
  getDirtyCount: () => dirtyMap.size,
  /** 변경 이력 초기화 (저장 성공 후 호출) */
  clearDirty,

  // ----- 필터 -----
  /** <pre>
   * 그리드 밖 입력창으로 필터 적용
   *
   * applyFilters([
   *   { field: 'name', value: keyword },              // 기본 = contains(LIKE)
   *   { field: 'deptCd', value: dept, operator: '=' },
   * ])
   * </pre> */
  applyFilters: (filters) => {
    const grid = widget();
    if (!grid) return;

    const conditions = (Array.isArray(filters) ? filters : [])
      .filter((f) => f && f.field && f.value !== "" && f.value !== null && f.value !== undefined)
      .map((f) => [f.field, f.operator ?? "contains", f.value]);

    if (conditions.length === 0) {
      grid.clearFilter();
      return;
    }

    // DevExtreme 필터 문법: [[a],'and',[b]]
    const expression = conditions.length === 1 ? conditions[0] : conditions.flatMap((c, i) => (i === 0 ? [c] : ["and", c]));
    grid.filter(expression);
  },
  /** 필터 전체 해제 */
  clearFilters: () => widget()?.clearFilter?.(),
  /** 정렬 전체 해제 */
  clearSorting: () => widget()?.clearSorting?.(),

  // ----- 그룹핑 -----
  /** 지정한 필드로 그룹핑 */
  groupBy: (fields) => {
    const grid = widget();
    if (!grid) return;

    grid.clearGrouping();
    (Array.isArray(fields) ? fields : [fields]).forEach((field, index) => {
      grid.columnOption(field, "groupIndex", index);
    });
  },
  /** 그룹핑 해제 */
  clearGrouping: () => widget()?.clearGrouping?.(),

  // ----- 기타 -----
  /** 화면 갱신 */
  refresh: () => widget()?.refresh?.(),
  /** 엑셀 내보내기 */
  exportToExcel: () => runExcelExport(),
  /** 컬럼 폭/순서/필터/정렬 상태 */
  getState: () => widget()?.state?.(),
  /** 상태 복원 */
  setState: (state) => widget()?.state?.(state),
  /** 평가판 여부 (라이선스 키 미등록) */
  isTrial: () => !hasLicense(),
});

const handleInitialized = (e) => emit("on-grid-created", { instance: e.component, component: gridRef.value });

/* ---------------------------------------------------------------------------------------------------------------
페이지당 건수 입력창

DevExtreme 기본 페이지크기 선택기는 [20][50][100][500] 버튼이라
목록에 없는 값을 쓸 수 없고 개수가 늘면 자리를 많이 차지한다.
그래서 "목록에서 고르거나 직접 숫자를 입력할 수 있는" 입력창을 우리가 만든다.

<input list> + <datalist> 를 쓰는 이유
  선택과 자유 입력을 하나의 기본 컨트롤로 처리할 수 있다.
  (select + 별도 입력칸 두 개를 두면 조작이 번거롭고, 커스텀 드롭다운을 만들면
   키보드·접근성을 직접 구현해야 한다)

이 컴포넌트는 Vuetify 에 의존하지 않는다(여러 프로젝트에 그대로 넣기 위한 격리 원칙)에 따라
Vuetify 컴포넌트를 쓰지 않고, 겉모습만 Vuetify 입력창 톤에 맞춰 CSS 로 그린다.

DevExtreme 위젯의 pageSize()/pageIndex() 는 실제 공개 메서드다
(grid_core/data_controller/m_data_controller.js publicMethods() 에 포함).
--------------------------------------------------------------------------------------------------------------- */

/** 화면에 표시하는 페이지당 건수 */
const pageSizeValue = ref(props.pageSize);

/** datalist 는 문서 전체에서 유일한 id 가 필요하다 (한 화면에 그리드가 여러 개 있을 수 있다) */
const pageSizeListId = `dxg-pagesize-${Math.random().toString(36).slice(2, 9)}`;

/** 입력창 방식으로 페이지당 건수를 직접 그릴지 */
const showPageSizeInput = computed(() => props.pageable && props.paginationShowPageSize && props.paginationPageSizeMode === "input");

watch(
  () => props.pageSize,
  (size) => {
    pageSizeValue.value = size;
  },
);

/** 위젯이 스스로 페이지크기를 바꾼 경우(상태 복원 등) 입력창을 따라가게 한다 */
const onOptionChanged = (e) => {
  if (e.fullName === "paging.pageSize" && Number.isFinite(e.value)) pageSizeValue.value = e.value;
};

/**
 * 페이지당 건수 적용
 *
 * 범위를 벗어난 값은 잘라서 되돌려 준다(빈 값으로 두면 그리드가 0건을 그린다).
 * 페이지 크기가 바뀌면 첫 페이지로 돌아가야 한다 — 5페이지를 보다가 500건으로 바꾸면
 * 존재하지 않는 페이지에 남아 빈 화면이 되기 때문이다.
 */
const applyPageSize = (raw, el) => {
  const grid = widget();
  const parsed = Number.parseInt(raw, 10);
  const current = grid?.pageSize?.() ?? props.pageSize;

  const size = Number.isFinite(parsed) ? Math.min(Math.max(parsed, props.paginationPageSizeMin), props.paginationPageSizeMax) : current;

  pageSizeValue.value = size;

  /*
   * 입력창을 항상 확정된 값으로 되돌려 놓는다.
   *
   * :value 바인딩만 믿으면 안 된다 — 거절·보정한 값이 직전 값과 같으면 ref 가 바뀌지 않아
   * Vue 가 DOM 을 다시 그리지 않고, 사용자가 입력한 잘못된 문자열(빈 값 등)이 그대로 남는다.
   * (실제로 빈 값을 넣었을 때 입력창이 비어 있는 상태로 남는 것을 확인했다)
   */
  if (el) el.value = String(size);

  if (!grid) return;
  if (grid.pageSize() !== size) {
    grid.pageSize(size);
    grid.pageIndex(0);
  }

  emit("on-page-size-change", { pageSize: size });
};

/** 부모가 넘긴 class/style 만 최상위 div 로 넘긴다 */
const attrs = useAttrs();
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const passthroughAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div
    class="dxg-wrapper"
    :class="[`dxg-pager--${paginationAlign}`, { 'dxg-pager--no-pages': !paginationShowPages, 'dxg-has-pagesize-input': showPageSizeInput }]"
    v-bind="wrapperAttrs"
  >
    <!-- 3층 : 슬롯 (그리드 위 영역) -->
    <slot name="toolbar" />

    <DxDataGrid
      ref="gridRef"
      :data-source="dataset"
      :columns="dxColumns"
      :summary="summaryConfig"
      v-bind="{ ...gridOptions, ...passthroughAttrs }"
      @initialized="handleInitialized"
      @option-changed="onOptionChanged"
      @row-click="onRowClick"
      @row-dbl-click="onRowDblClick"
      @selection-changed="onSelectionChanged"
      @row-updating="onRowUpdating"
      @exporting="onExporting"
    >
      <!-- ===== 리치 셀 템플릿 ===== -->

      <!-- 행번호 : rowIndex 는 화면 순번이라 정렬/필터 후에도 1부터 다시 매겨진다 -->
      <template #sgCell-rowNumber="{ data: cell }">
        {{ cell.rowIndex + 1 }}
      </template>

      <!-- 버튼 -->
      <template #sgCell-button="{ data: cell }">
        <button
          v-if="!isButtonHidden(cell)"
          type="button"
          class="dxg-cell-btn"
          :class="cell.column?.sgCellOptions?.buttonClass"
          :disabled="isButtonDisabled(cell)"
          @click.stop="onCellButtonClick(cell)"
        >
          {{ buttonLabel(cell) }}
        </button>
      </template>

      <!-- 체크박스 -->
      <template #sgCell-checkbox="{ data: cell }">
        <input type="checkbox" class="dxg-cell-checkbox" :checked="isCellChecked(cell)" @click.stop @change="onCellCheckboxChange(cell, $event)" />
      </template>

      <!-- 이미지 -->
      <template #sgCell-image="{ data: cell }">
        <img
          v-if="safeUrl(cell.value)"
          class="dxg-cell-img"
          :src="safeUrl(cell.value)"
          :alt="cell.column?.sgCellOptions?.imageAlt ?? ''"
          :style="{ height: `${cell.column?.sgCellOptions?.imageHeight ?? 24}px` }"
          loading="lazy"
        />
      </template>

      <!-- 첨부파일 -->
      <template #sgCell-file="{ data: cell }">
        <a v-if="fileInfo(cell.value)" class="dxg-cell-file" :href="fileInfo(cell.value).url" :download="fileInfo(cell.value).name" @click.stop>
          <span aria-hidden="true">📎</span>
          <span class="dxg-cell-file__name">{{ fileInfo(cell.value).name }}</span>
        </a>
      </template>

      <!-- 링크 -->
      <template #sgCell-link="{ data: cell }">
        <a
          v-if="fileInfo(cell.value)"
          class="dxg-cell-link"
          :href="fileInfo(cell.value).url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          {{ fileInfo(cell.value).name }}
        </a>
      </template>
    </DxDataGrid>

    <!--
      페이지당 건수 입력창

      페이저 행의 빈 쪽에 겹쳐 놓는다. DevExtreme 페이저 안에 우리 DOM 을 넣으면
      페이저가 다시 그려질 때(페이지 이동 등) 지워지므로, 우리가 소유한 위치에 둔다.
      좌/우 배치는 페이지 번호와 겹치지 않는 쪽으로 CSS 가 정한다.
    -->
    <div v-if="showPageSizeInput" class="dxg-pagesize">
      <label class="dxg-pagesize__label" :for="pageSizeListId + '-input'">{{ paginationPageSizeLabel }}</label>
      <div class="dxg-pagesize__field">
        <input
          :id="pageSizeListId + '-input'"
          class="dxg-pagesize__input"
          type="number"
          inputmode="numeric"
          :list="pageSizeListId"
          :min="paginationPageSizeMin"
          :max="paginationPageSizeMax"
          :value="pageSizeValue"
          :aria-label="paginationPageSizeLabel + ' 건수'"
          @change="applyPageSize($event.target.value, $event.target)"
          @keyup.enter="applyPageSize($event.target.value, $event.target)"
        />
        <datalist :id="pageSizeListId">
          <option v-for="size in pageSizes" :key="size" :value="size" />
        </datalist>
      </div>
      <span class="dxg-pagesize__unit">건</span>
    </div>

    <!-- 3층 : 슬롯 (그리드 아래 영역) -->
    <slot name="footer" />

    <!-- 조회 중 오버레이 -->
    <div v-if="loading" class="dxg-loading" role="status" aria-live="polite">
      <div class="dxg-loading__box">
        <span class="dxg-loading__spinner" aria-hidden="true"></span>
        <span>조회 중...</span>
      </div>
    </div>
  </div>
</template>
