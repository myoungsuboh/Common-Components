import { ExcelExportService } from '@slickgrid-universal/excel-export';

/* ***************************************************************************************************************
그리드 옵션 기본값 + 병합 레이어 (커스텀 4계층 중 2층)

핵심 규칙 : 사용자가 넘긴 options는 "항상" 기본값을 이긴다.
우리가 예상하지 못한 SlickGrid 옵션도 그대로 먹혀야 하므로 화이트리스트를 두지 않고 deep merge 한다.

우선순위 :  SlickGrid 라이브러리 기본값  <  이 파일의 BASE_OPTIONS  <  기능 플래그(props)  <  사용자 options
******************************************************************************************************************/

/**
 * SlickGrid 내장 UI의 한글 텍스트
 *
 * enableTranslate: false 인 경우 이 locales 값이 사용됩니다.
 * (i18next를 붙이면 enableTranslate: true 로 바꾸고 이 값 대신 번역 키가 사용됨)
 */
export const KO_LOCALES = {
  TEXT_ALL_SELECTED: '전체 선택됨',
  TEXT_ALL_X_RECORDS_SELECTED: '전체 {{x}} 건이 선택되었습니다',
  TEXT_APPLY_MASS_UPDATE: '일괄 수정 적용',
  TEXT_APPLY_TO_SELECTION: '선택 항목에 적용',
  TEXT_CANCEL: '취소',
  TEXT_CLEAR_ALL_FILTERS: '필터 전체 해제',
  TEXT_CLEAR_ALL_GROUPING: '그룹 전체 해제',
  TEXT_CLEAR_ALL_SORTING: '정렬 전체 해제',
  TEXT_CLEAR_PINNING: '고정 해제',
  TEXT_CLONE: '복제',
  TEXT_COLLAPSE_ALL_GROUPS: '그룹 전체 접기',
  TEXT_COLUMNS: '컬럼',
  TEXT_COLUMN_RESIZE_BY_CONTENT: '내용에 맞춰 컬럼 너비 조정',
  TEXT_COMMANDS: '기능',
  TEXT_CONTAINS: '포함',
  TEXT_COPY: '복사',
  TEXT_DROP_COLUMN_HEADER_TO_GROUP_BY: '컬럼 헤더를 여기로 끌어다 놓으면 그룹이 됩니다',
  TEXT_ENDS_WITH: '~로 끝남',
  TEXT_EQUALS: '같음',
  TEXT_EQUAL_TO: '같음',
  TEXT_ERROR_EDITABLE_GRID_REQUIRED: '편집 가능한 그리드가 필요합니다.',
  TEXT_ERROR_ENABLE_CELL_NAVIGATION_REQUIRED: '셀 이동(enableCellNavigation) 옵션이 필요합니다.',
  TEXT_ERROR_NO_CHANGES_DETECTED: '변경된 내용이 없습니다.',
  TEXT_ERROR_NO_EDITOR_FOUND: '해당 셀에 에디터가 없습니다.',
  TEXT_ERROR_NO_RECORD_FOUND: '조회된 데이터가 없습니다.',
  TEXT_ERROR_ROW_NOT_EDITABLE: '수정할 수 없는 행입니다.',
  TEXT_ERROR_ROW_SELECTION_REQUIRED: '행을 먼저 선택해 주세요.',
  TEXT_EXPAND_ALL_GROUPS: '그룹 전체 펼치기',
  TEXT_EXPORT_TO_CSV: 'CSV로 내보내기',
  TEXT_EXPORT_TO_EXCEL: '엑셀로 내보내기',
  TEXT_EXPORT_TO_PDF: 'PDF로 내보내기',
  TEXT_EXPORT_TO_TAB_DELIMITED: '탭 구분 파일로 내보내기',
  TEXT_EXPORT_TO_TEXT_FORMAT: '텍스트로 내보내기',
  TEXT_FILTER_SHORTCUTS: '필터 바로가기',
  TEXT_FORCE_FIT_COLUMNS: '컬럼 너비 자동 맞춤',
  TEXT_FREEZE_COLUMNS: '컬럼 고정',
  TEXT_GREATER_THAN: '초과',
  TEXT_GREATER_THAN_OR_EQUAL_TO: '이상',
  TEXT_GROUP_BY: '그룹 기준',
  TEXT_HIDE_COLUMN: '컬럼 숨기기',
  TEXT_ITEMS: '건',
  TEXT_ITEMS_PER_PAGE: '페이지당 건수',
  TEXT_ITEMS_SELECTED: '건 선택됨',
  TEXT_LAST_UPDATE: '최근 갱신',
  TEXT_LESS_THAN: '미만',
  TEXT_LESS_THAN_OR_EQUAL_TO: '이하',
  TEXT_LOADING: '조회 중...',
  TEXT_NOT_CONTAINS: '포함하지 않음',
  TEXT_NOT_EQUAL_TO: '같지 않음',
  TEXT_NO_ELEMENTS_FOUND: '항목이 없습니다',
  TEXT_NO_MATCHES_FOUND: '검색 결과가 없습니다',
  TEXT_OF: '/',
  TEXT_OK: '확인',
  TEXT_OPTIONS: '옵션',
  TEXT_PAGE: '페이지',
  TEXT_RECORDS_SELECTED: '건 선택됨',
  TEXT_REFRESH_DATASET: '새로 조회',
  TEXT_REMOVE_FILTER: '필터 해제',
  TEXT_REMOVE_SORT: '정렬 해제',
  TEXT_RESET_FORM: '초기화',
  TEXT_RESET_INPUT_VALUE: '입력값 초기화',
  TEXT_SAVE: '저장',
  TEXT_SELECT_ALL: '전체 선택',
  TEXT_SORT_ASCENDING: '오름차순 정렬',
  TEXT_SORT_DESCENDING: '내림차순 정렬',
  TEXT_STARTS_WITH: '~로 시작',
  TEXT_SYNCHRONOUS_RESIZE: '즉시 리사이즈',
  TEXT_TOGGLE_ALL_GROUPS: '그룹 전체 토글',
  TEXT_TOGGLE_DARK_MODE: '다크 모드 토글',
  TEXT_TOGGLE_FILTER_ROW: '필터 행 토글',
  TEXT_TOGGLE_PRE_HEADER_ROW: '상단 헤더 행 토글',
  TEXT_UNFREEZE_COLUMNS: '컬럼 고정 해제',
  TEXT_X_OF_Y_MASS_SELECTED: '{{x}}/{{y}} 건 선택됨',
  TEXT_X_OF_Y_SELECTED: '{{x}}/{{y}} 건 선택됨',
};

/** 프로젝트 공통 기본 옵션 */
const BASE_OPTIONS = {
  // ----- 항상 켜두는 것 (그리드의 기본값이지 선택사항이 아님) -----
  enableAutoResize: true,
  enableSorting: true,
  enableColumnReorder: true,

  /*
   * autoResize는 높이와 "너비"를 함께 담당한다. 절대 끄면 안 된다.
   *
   * calculateAvailableSizeBy 의 라이브러리 기본값이 'window' 라서 그대로 두면
   * 그리드가 부모 컨테이너가 아니라 브라우저 창 너비로 계산되어 카드/컨테이너 밖으로 넘친다.
   * (실제로 882px 카드 안에서 그리드가 1282px로 그려지는 것을 확인)
   * 그래서 'container' 로 바꾸고 container 셀렉터를 컴포넌트에서 넘겨준다.
   *
   * resizeDetection 은 기본값('window')을 유지한다.
   * 'container' 로 두면 ResizeObserver가 래퍼를 감시하는데, 래퍼 높이가 그리드에 의해 결정되므로
   * 감시 -> 리사이즈 -> 감시 무한루프('ResizeObserver loop limit exceeded')가 발생할 수 있다.
   */
  autoResize: {
    calculateAvailableSizeBy: 'container',
    bottomPadding: 0,
    rightPadding: 0,
    minHeight: 200,
  },

  // ----- 표시 -----
  // rowHeight는 featuresToOptions에서 prop 값으로 덮인다.
  // headerRowHeight는 "필터 행" 높이다. 컬럼명 행 높이가 아니다(그건 CSS 변수 --slick-header-column-height).
  rowHeight: 34,
  headerRowHeight: 36,
  enableTextSelectionOnCells: true,

  /*
   * 셀/헤더 내용이 잘렸을 때(말줄임) 마우스를 올리면 전체 내용을 보여준다.
   * ellipsis 처리만 하고 이걸 안 켜면 사용자가 잘린 값을 확인할 방법이 없다.
   */
  enableAutoTooltip: true,
  autoTooltipOptions: {
    enableForCells: true,
    enableForHeaderCells: true,
    maxToolTipLength: 200,
  },

  // ----- 한글 UI -----
  enableTranslate: false,
  locales: KO_LOCALES,

  /*
   * ----- 검색 필터 -----
   *
   * defaultFilterPlaceholder
   *   라이브러리 기본값이 '🔎︎' 이모지라서 입력칸이 돋보기 하나만 있는 것처럼 보인다.
   *   돋보기는 CSS로 입력칸 "오른쪽"에 붙이고, placeholder는 의미 있는 안내문으로 바꾼다.
   *
   * filterTypingDebounce
   *   라이브러리 기본값이 0이라 한 글자 입력마다 필터가 돌아 대용량에서 버벅인다.
   *   타이핑 중에는 400ms 기다리고, Enter를 누르면 즉시 검색된다.
   *   (inputFilter 내부: eventType === 'keyup' && event.key !== 'Enter' ? debounce : 0)
   *
   * 문자 컬럼의 기본 연산자는 빈 값('')이고 이것이 곧 "포함"(LIKE 검색)이다.
   * 즉 별도 설정 없이 부분일치 검색이 기본이다.
   */
  defaultFilterPlaceholder: '검색',
  filterTypingDebounce: 400,
  // 앞뒤 공백을 제거해서 복사/붙여넣기 검색이 실패하지 않도록
  enableFilterTrimWhiteSpace: true,

  // ----- 빈 데이터 안내 -----
  enableEmptyDataWarningMessage: true,
  emptyDataWarning: { message: '조회된 데이터가 없습니다.' },

  // ----- 정렬 -----
  multiColumnSort: true,

  /*
   * ----- 헤더 우클릭은 컬럼 선택기가 아니라 헤더 메뉴(∨ 메뉴)로 -----
   *
   * 라이브러리 기본값이 enableColumnPicker: true 다 (global-grid-options.js).
   * 즉 아무 것도 지정하지 않으면 컬럼 헤더 우클릭에 ColumnPicker(컬럼 표시/숨김 목록)가 열린다.
   * 우클릭 자리는 컬럼별 헤더 메뉴(정렬 / 컬럼 숨기기 / 컬럼 고정)를 여는 데 쓰므로 이쪽을 끈다.
   * 실제로 우클릭을 헤더 메뉴에 연결하는 코드는 SlickGrid.vue 의 handleHeaderContextMenu 다.
   *
   * 우측 상단 그리드 메뉴(☰) 안의 컬럼 표시/숨김 목록은 그대로 남는다.
   * GridMenu가 자체 섹션으로 직접 그리기 때문이다 (slickGridMenu.js 의 hideColumnPickerSection).
   * 즉 이 옵션을 꺼도 "컬럼 숨기기"에 도달하는 경로는 헤더 메뉴와 ☰ 두 곳이다.
   */
  enableColumnPicker: false,
};

/**
 * 배열은 병합하지 않고 교체하는 deep merge
 *
 * externalResources 같은 배열 옵션을 병합해버리면 서비스 인스턴스가 중복 등록되므로
 * 배열은 항상 사용자 값으로 통째로 교체한다.
 *
 * @param {Object} target 기본값
 * @param {Object} source 덮어쓸 값 (우선순위 높음)
 * @returns {Object} 새 객체 (target/source 모두 변경하지 않음)
 */
export const deepMerge = (target, source) => {
  if (source === undefined || source === null) return target;
  if (target === undefined || target === null) return source;

  // 일반 객체가 아니면(배열, Date, 클래스 인스턴스 등) 그대로 교체
  if (target.constructor !== Object || source.constructor !== Object) return source;

  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    result[key] = key in target ? deepMerge(target[key], value) : value;
  }

  return result;
};

/**
 * 크기 값을 고정 px 숫자로 변환
 *
 * 'auto' / null / undefined / 빈문자 -> null (자동 크기)
 * 300 / '300' / '300px'              -> 300 (고정 크기)
 *
 * @param {number|string|null} value
 * @returns {number|null} 고정 px 값 또는 자동일 때 null
 */
const toFixedPx = (value) => {
  if (value === null || value === undefined || value === '' || value === 'auto') return null;

  const px = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(px) ? px : null;
};

/**
 * 기능 플래그(props) -> SlickGrid 옵션 변환
 *
 * @param {Object} features
 * @returns {Object} SlickGrid GridOption 조각
 */
const featuresToOptions = (features) => {
  const options = {};

  // ----- 행 고유 키 -----
  // 행 선택/갱신/트리가 이 필드를 기준으로 동작한다. 데이터에 id가 없으면 반드시 바꿔줘야 한다.
  if (features.idField) options.datasetIdPropertyName = features.idField;

  // ----- 행 높이 -----
  if (Number.isFinite(features.rowHeight)) options.rowHeight = features.rowHeight;

  /*
   * 참고: 행/셀 단위 제어(rowMeta)는 여기(gridOptions)로 넘기지 않는다.
   * gridOptions.getItemMetadata 는 slickgrid-vue가 어디에도 연결하지 않는 죽은 옵션이다.
   * SlickGrid.vue가 그리드 생성 후 dataView.getItemMetadata 에 직접 연결한다 (wireRowMeta).
   */

  /*
   * ----- 서버 사이드 모드 -----
   *
   * backendServiceApi를 지정하면 SlickGrid이 정렬/필터/페이징을 로컬에서 처리하지 않고
   * 전부 서버에 위임한다. 이게 없으면 현재 페이지 안에서만 정렬/필터가 되어 결과가 틀린다.
   */
  if (features.backendServiceApi) {
    options.backendServiceApi = features.backendServiceApi;
    options.enablePagination = true;
    options.pagination = {
      pageSizes: features.pageSizes ?? [20, 50, 100, 500],
      pageSize: features.pageSize,
      totalItems: 0,
    };
  }

  // ----- 필터 -----
  if (features.filterable) options.enableFiltering = true;

  /*
   * 그리드 밖 입력창으로만 필터를 쓰는 경우.
   *
   * FilterService는 enableFiltering이 켜져 있어야 동작한다.
   * (그래서 applyFilters()도 필터 기능이 꺼져 있으면 아무 일도 하지 않는다)
   * 필터 행은 보여주고 싶지 않으므로 showHeaderRow로 숨긴다.
   */
  if (features.externalFilter && !features.filterable) {
    options.enableFiltering = true;
    options.showHeaderRow = false;
  }

  // ----- 인라인 편집 -----
  if (features.editable) {
    options.editable = true;
    // 셀 이동이 켜져 있지 않으면 편집이 동작하지 않는다
    options.enableCellNavigation = true;
    options.autoEdit = features.autoEdit;
  }

  // ----- 행 선택 / 체크박스 -----
  if (features.selectable) {
    options.enableSelection = true;
    options.enableCellNavigation = true;
    options.multiSelect = features.multiSelect;

    if (features.checkboxSelector) {
      options.enableCheckboxSelector = true;

      /*
       * 전체 선택 체크박스 위치
       *
       * hideInColumnTitleRow  : 기본 false = 컬럼 헤더(좌측 상단)에 표시  <- 우리가 원하는 위치
       * hideInFilterHeaderRow : 기본 true  = 필터 행에는 표시하지 않음
       *
       * 두 옵션 이름이 헷갈리기 쉬워 명시적으로 적어둔다.
       * (hideInFilterHeaderRow를 false로 주면 헤더가 아니라 필터 행에 체크박스가 생긴다)
       */
      /*
       * 내장 전체선택 체크박스는 숨기고 SlickGrid.vue가 직접 심는다.
       *
       * 이유 : 내장 체크박스는 "선택"만 되고 "해제"가 되지 않는다.
       * 플러그인 handleHeaderClick 이 e.target 을 보고 분기하는데
       *   - label을 누르면 e.target이 label이라 `type === 'checkbox'` 검사에서 걸려 그냥 반환
       *   - 헤더 div 경로에서는 forceToggle이 false라 checked를 뒤집지 않고 현재 값을 그대로 읽음
       * 결과적으로 상태가 한 방향(선택)으로만 진행된다.
       * 래퍼에서 onHeaderClick을 받아 보정하는 방법도 실패했다(실제 클릭이 그 이벤트까지 오지 않음).
       * 그래서 우리가 만든 체크박스로 selectAll/clearSelection을 직접 호출한다.
       */
      options.checkboxSelector = {
        hideInColumnTitleRow: false,
        hideInFilterHeaderRow: true,
        hideSelectAllCheckbox: true,
        // 페이지를 넘겨도 선택이 유지되도록
        applySelectOnAllPages: true,
      };
    }
  }

  // ----- 페이지네이션 -----
  if (features.pageable) {
    options.enablePagination = true;
    options.pagination = {
      pageSizes: features.pageSizes ?? [20, 50, 100, 500],
      pageSize: features.pageSize,
    };

    /*
     * 커스텀 페이지네이션 컴포넌트 (왼쪽/중앙/오른쪽 정렬 + 반응형)
     *
     * slickgrid-vue는 이 컴포넌트를 createApp()으로 "별도 앱"에 마운트하므로 props를 넘길 수 없다.
     * 그래서 설정값을 그리드 옵션에 sgPagination* 키로 심어두고
     * 컴포넌트가 init(grid, ...)에서 grid.getOptions()로 읽어가게 한다.
     * (SlickGrid 옵션 객체는 모르는 키를 그대로 보관한다)
     */
    if (features.paginationComponent) {
      options.customPaginationComponent = features.paginationComponent;
      options.sgPaginationAlign = features.paginationAlign ?? 'right';
      options.sgPaginationShowPageSize = features.paginationShowPageSize !== false;
    }
  }

  /*
   * ----- 컬럼 메뉴 / 그리드 메뉴 -----
   *
   * enableColumnPicker(헤더 우클릭 컬럼 선택기)는 여기서 켜지 않는다.
   * 우클릭은 헤더 메뉴를 여는 데 쓰기 때문이다 (BASE_OPTIONS 의 enableColumnPicker 주석 참고).
   */
  if (features.gridMenu) {
    options.enableGridMenu = true;
    options.enableHeaderMenu = true;
  }

  /*
   * ----- 그룹핑 (헤더를 상단 패널로 드래그해서 그룹) -----
   *
   * 드래그를 받을 pre-header 패널을 같이 켜주지 않으면 끌어다 놓을 영역 자체가 없다.
   *
   * [안내 문구가 영어로 나오는 이유]
   * 이 플러그인은 locales(우리가 넣은 KO_LOCALES)를 보지 않는다.
   * dropPlaceHolderTextKey를 번역하는 경로는 enableTranslate가 true일 때만 동작하는데
   * 우리는 i18next 없이 locales로만 한글화하므로 그 경로를 타지 않고 영어 기본값이 남는다.
   * 그래서 dropPlaceHolderText에 한글을 직접 넣어준다.
   *
   * enableColumnReorder는 여기서 true로 둬도 된다.
   * ExtensionService가 enableDraggableGrouping이 켜져 있으면
   * enableColumnReorder를 플러그인의 setupColumnReorder 함수로 자동 교체한다(코어가 함수면 그것을 사용).
   */
  if (features.groupable) {
    options.enableDraggableGrouping = true;
    options.createPreHeaderPanel = true;
    options.showPreHeaderPanel = true;
    options.preHeaderPanelHeight = 34;
    options.draggableGrouping = {
      dropPlaceHolderText: '여기로 컬럼 헤더를 끌어다 놓으면 그룹으로 묶입니다',
      toggleAllPlaceholderText: '전체 그룹 펼치기/접기',
    };
  }

  /*
   * ----- 다중 헤더 (2단 헤더) -----
   *
   * 컬럼의 columnGroup 값이 같은 이웃끼리 위쪽에 묶음 제목이 생긴다.
   * 이것도 pre-header 패널을 쓰므로 드래그 그룹핑(groupable)과 동시에 켤 수 없다.
   * 동시에 지정되면 groupable을 우선하고 경고한다 (조용히 한쪽이 사라지면 원인을 찾기 어렵다).
   */
  if (features.hasColumnGroup && !features.groupable) {
    options.createPreHeaderPanel = true;
    options.showPreHeaderPanel = true;
    options.preHeaderPanelHeight = features.headerHeight ? features.headerHeight + 16 : 36;
  }

  /*
   * ----- 하단 합계 행 -----
   * 값 채우기는 SlickGrid.vue가 getFooterRowColumn()으로 직접 그린다.
   */
  if (features.showSummary) {
    options.createFooterRow = true;
    options.showFooterRow = true;
    options.footerRowHeight = 32;
  }

  /*
   * ----- 엑셀 내보내기 -----
   *
   * externalResources에 서비스 인스턴스를 등록해야 동작한다.
   *
   * [한글 깨짐 주의]
   * format은 반드시 'xlsx'여야 한다.
   *  - 'xlsx' : ZIP + UTF-8 XML 구조라서 한글이 안전하다 (라이브러리 기본값이지만 명시적으로 고정한다)
   *  - 'xls'  : 레거시 포맷이라 인코딩 정보가 없어 한글이 깨진다. 절대 쓰지 말 것.
   * 향후 프로젝트에서 options로 format을 바꾸다가 한글이 깨지는 일을 막기 위해 여기서 명시한다.
   *
   * CSV(.csv)로 내보내려면 @slickgrid-universal/text-export 를 따로 설치해야 하는데,
   * CSV는 UTF-8 BOM이 없으면 엑셀에서 한글이 깨진다 (텍스트 export 옵션의 useUtf8WithBom을 켜야 함).
   * 이 컴포넌트는 한글 안전을 위해 xlsx만 기본 제공한다.
   */
  if (features.excelExport) {
    options.enableExcelExport = true;
    options.externalResources = [new ExcelExportService()];
    options.excelExportOptions = {
      filename: features.exportFilename,
      format: 'xlsx',
      sheetName: features.exportSheetName ?? 'Sheet1',
      sanitizeDataExport: true,
      // 헤더/셀에 한글이 들어가도 그대로 나가도록 화면 포맷 기준으로 내보낸다
      exportWithFormatter: true,
    };
  }

  // ----- 트리 데이터 -----
  if (features.treeDataOptions) {
    options.enableTreeData = true;
    options.treeDataOptions = features.treeDataOptions;
  }

  // ----- 크기 계산 기준 컨테이너 -----
  // 이 셀렉터가 없으면 autoResize가 컨테이너를 못 찾아 window 기준으로 되돌아가고,
  // 그리드가 부모 카드 밖으로 넘치면서 컬럼이 찌그러진다.
  if (features.containerSelector) {
    options.autoResize = { container: features.containerSelector };
  }

  /*
   * ----- 높이 / 너비 (자동 / 수동) -----
   *
   * 'auto'  -> 컨테이너 크기에 맞춰 자동 (기본값)
   * 숫자    -> 해당 px로 고정
   *
   * 고정하더라도 enableAutoResize를 끄면 안 된다.
   * autoResize가 높이와 너비를 함께 담당하므로 끄면 너비 계산까지 죽는다.
   * 따라서 autoResize는 켠 채로 min/max를 같은 값으로 묶어 해당 축만 고정한다.
   */
  const h = toFixedPx(features.height);
  const w = toFixedPx(features.width);

  if (h !== null) {
    options.gridHeight = h;
    options.autoResize = { ...(options.autoResize ?? {}), minHeight: h, maxHeight: h };
  }

  if (w !== null) {
    options.gridWidth = w;
    options.autoResize = { ...(options.autoResize ?? {}), minWidth: w, maxWidth: w };
  }

  // 데이터 건수에 맞춰 높이를 늘림 (height가 'auto'일 때만 의미가 있음)
  if (features.autoHeight && h === null) {
    options.autoResize = { ...(options.autoResize ?? {}), autoHeight: true };
  }

  // ----- 컬럼 너비를 그리드 폭에 꽉 채우기 -----
  // 컬럼 width 합이 그리드보다 좁을 때 남는 여백을 없애준다.
  if (features.fitColumns) options.forceFitColumns = true;

  // ----- 다크모드 -----
  if (features.dark) options.darkMode = true;

  return options;
};

/**
 * 최종 GridOption 생성
 *
 * @param {Object} features 컴포넌트 props에서 넘어온 기능 플래그
 * @param {Object} userOptions 사용자가 직접 넘긴 SlickGrid GridOption (최우선)
 * @returns {Object} SlickGrid GridOption
 */
export const buildGridOptions = (features = {}, userOptions = {}) => {
  const merged = deepMerge(BASE_OPTIONS, featuresToOptions(features));
  return deepMerge(merged, userOptions ?? {});
};

export { BASE_OPTIONS };
