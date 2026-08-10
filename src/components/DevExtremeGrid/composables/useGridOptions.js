import { locale, loadMessages } from 'devextreme/localization';
import koMessages from 'devextreme/localization/messages/ko.json';
import config from 'devextreme/core/config';

/* ***************************************************************************************************************
DevExtreme 그리드 옵션 + 한글화 + 라이선스

핵심 규칙 : 사용자가 넘긴 options는 "항상" 기본값을 이긴다.
우리가 예상하지 못한 DevExtreme 옵션도 그대로 먹혀야 하므로 화이트리스트를 두지 않고 deep merge 한다.

우선순위 :  DevExtreme 기본값  <  BASE_OPTIONS  <  기능 플래그(props)  <  사용자 options
****************************************************************************************************************** */

/* ---------------------------------------------------------------------------------------------------------------
한글화

DevExtreme 은 자체 localization 모듈을 쓴다. SlickGrid 처럼 locales 객체를 옵션에 넣는 방식이 아니라
앱 시작 시 loadMessages() + locale() 을 한 번 호출하는 방식이다.

ko.json 에 854개 문구가 들어 있어 별도 번역이 필요 없다.
(SlickGrid 은 한글 문구가 없어 73개를 직접 작성해야 했다)
--------------------------------------------------------------------------------------------------------------- */
let localeApplied = false;

/** 한글 로케일 적용 (여러 그리드가 있어도 한 번만 수행) */
export const applyKoreanLocale = () => {
  if (localeApplied) return;

  loadMessages(koMessages);
  locale('ko');
  localeApplied = true;
};

/* ---------------------------------------------------------------------------------------------------------------
라이선스

평가판(30일)은 키 없이도 동작하지만 화면 메시지 + 콘솔 경고가 표시된다.
운영에 쓰려면 상용 라이선스를 구매하고 런타임 키를 등록해야 한다.

키는 소스에 하드코딩하지 않는다. 환경변수(VITE_DEVEXTREME_LICENSE_KEY)로 주입한다.
  - 이 저장소의 RealGrid 은 라이선스 키가 소스에 박혀 있는데, 그 방식을 반복하지 않기 위함.
  - .env 파일은 .gitignore 에 등록되어 있어야 한다.
--------------------------------------------------------------------------------------------------------------- */
let licenseApplied = false;

/** 라이선스 키 등록. 키가 없으면 평가판으로 동작한다(경고 표시). */
export const applyLicense = () => {
  if (licenseApplied) return;
  licenseApplied = true;

  const key = import.meta.env?.VITE_DEVEXTREME_LICENSE_KEY;
  if (!key) return; // 평가판 모드

  config({ licenseKey: key });
};

/** 라이선스 키가 등록되어 있는지 (데모에서 평가판 안내를 띄우는 데 사용) */
export const hasLicense = () => !!import.meta.env?.VITE_DEVEXTREME_LICENSE_KEY;

/* ---------------------------------------------------------------------------------------------------------------
기본 옵션
--------------------------------------------------------------------------------------------------------------- */
const BASE_OPTIONS = {
  // ----- 항상 켜두는 것 (그리드의 기본값이지 선택사항이 아님) -----
  showBorders: true,
  // columnAutoWidth 는 fitWidth 기능 플래그가 정한다 (featuresToOptions 참고)
  // 컬럼 순서 변경 / 폭 조절
  allowColumnReordering: true,
  allowColumnResizing: true,
  columnResizingMode: 'widget',
  // 행 구분선
  rowAlternationEnabled: true,
  showRowLines: true,
  showColumnLines: true,
  // 여러 컬럼 정렬
  sorting: { mode: 'multiple' },
  // 빈 데이터 안내 (ko.json 의 '데이터 없음' 대신 업무 화면에 맞는 문구)
  noDataText: '조회된 데이터가 없습니다.',
  // 마우스 오버 강조는 hoverStateEnabled 가 아니다 (DataGrid 에는 그 옵션이 없음 — 타입에서 확인).
  // 행 강조는 theme/devextreme-custom.css 에서 .dx-row:hover 로 처리한다.
};

/**
 * 배열은 병합하지 않고 교체하는 deep merge
 *
 * columns / summary.totalItems 같은 배열 옵션을 병합해버리면 항목이 중복되므로
 * 배열은 항상 사용자 값으로 통째로 교체한다.
 *
 * @param {Object} target 기본값
 * @param {Object} source 덮어쓸 값 (우선순위 높음)
 * @returns {Object} 새 객체 (target/source 모두 변경하지 않음)
 */
export const deepMerge = (target, source) => {
  if (source === undefined || source === null) return target;
  if (target === undefined || target === null) return source;

  // 일반 객체가 아니면(배열, Date, 함수, 클래스 인스턴스 등) 그대로 교체
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
 * 300 / '300' / '300px'              -> 300 (고정)
 */
const toFixedPx = (value) => {
  if (value === null || value === undefined || value === '' || value === 'auto') return null;

  const px = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(px) ? px : null;
};

/**
 * 기능 플래그(props) -> DevExtreme 옵션
 *
 * @param {Object} features
 * @returns {Object} DevExtreme 옵션 조각
 */
const featuresToOptions = (features) => {
  const options = {};

  // 가상 스크롤 여부를 먼저 판단해야 하므로 크기를 앞에서 계산한다
  const height = toFixedPx(features.height);
  const width = toFixedPx(features.width);

  /*
   * ----- 가로 폭 채우기 -----
   *
   * columnAutoWidth: true  -> 컬럼을 "내용 크기"에 맞춘다.
   *   컬럼 폭 합계가 컨테이너보다 좁으면 표도 그만큼 좁게 남아 오른쪽에 빈 공간이 생긴다.
   *   (실제로 래퍼 1026px 인데 표가 컬럼 합계인 982px 로 남는 것을 확인했다)
   *
   * columnAutoWidth: false -> 표가 컨테이너 폭을 채우고, 폭을 지정하지 않은 컬럼이 남는 공간을 나눠 갖는다.
   *
   * 업무 화면에서는 표가 카드 폭을 꽉 채우는 쪽이 자연스러워서 fitWidth 기본값을 true 로 둔다.
   */
  options.columnAutoWidth = features.fitWidth === false;

  // ----- 행 고유 키 -----
  // 선택/편집/갱신이 이 필드를 기준으로 동작한다
  if (features.idField) options.keyExpr = features.idField;

  // ----- 행 번호 -----
  // DevExtreme 은 행번호 컬럼 옵션이 없어 DevExtremeGrid.vue 가 컬럼을 직접 만들어 넣는다.

  // ----- 필터 -----
  if (features.filterable) {
    // 컬럼별 필터 입력 행
    options.filterRow = { visible: true, applyFilter: 'auto' };
    // 헤더의 값 목록 필터
    options.headerFilter = { visible: true };
  }

  // 전체 검색창 (그리드 우측 상단)
  if (features.searchable) options.searchPanel = { visible: true, width: 240, placeholder: '검색...' };

  // ----- 편집 -----
  if (features.editable) {
    options.editing = {
      mode: features.editMode,
      allowUpdating: true,
      allowAdding: features.allowAdding,
      allowDeleting: features.allowDeleting,
      // 편집 중인 셀만 저장/취소 버튼이 붙도록
      useIcons: true,
    };
  }

  // ----- 선택 -----
  if (features.selectable) {
    options.selection = {
      mode: features.multiSelect ? 'multiple' : 'single',
      // 체크박스를 항상 표시 (기본값 onClick 은 마우스를 올려야 나타나 발견이 어렵다)
      showCheckBoxesMode: features.checkboxSelector ? 'always' : 'none',
      // 전체 선택 체크박스가 "현재 페이지"가 아니라 "전체 데이터"를 대상으로 하도록
      selectAllMode: 'allPages',
      allowSelectAll: features.multiSelect,
    };
  }

  // ----- 페이지네이션 -----
  if (features.pageable) {
    options.paging = { enabled: true, pageSize: features.pageSize };
    options.pager = {
      visible: true,
      showPageSizeSelector: features.paginationShowPageSize !== false,
      allowedPageSizes: features.pageSizes ?? [20, 50, 100, 500],
      showInfo: features.paginationShowInfo !== false,
      showNavigationButtons: features.paginationShowNavigation !== false,
      // 좌/중앙/우 배치와 "페이지 번호 숨기기"는 CSS 로 처리한다
      // (DevExtreme 에 정렬 옵션이 없고, 번호만 끄는 옵션도 없다)
    };
  } else {
    options.paging = { enabled: false };

    /*
     * 페이징을 끄면 가상 스크롤로 대용량을 처리한다.
     *
     * 단, 높이를 고정하지 않으면 켜지 않는다.
     * 가상 스크롤은 "보이는 영역"을 기준으로 렌더할 행을 고르는데
     * 높이가 auto 면 기준이 되는 영역 자체가 없어서 동작하지 않고,
     * DevExtreme 도 W1025 경고를 띄운다.
     * (높이 없이 켜두면 경고만 쌓이고 이득이 없다)
     */
    if (height !== null) {
      options.scrolling = { mode: 'virtual', rowRenderingMode: 'virtual' };
    }
  }

  // ----- 그룹핑 -----
  if (features.groupable) {
    options.groupPanel = { visible: true, emptyPanelText: '여기로 컬럼 헤더를 끌어다 놓으면 그룹으로 묶입니다' };
    options.grouping = { autoExpandAll: true, contextMenuEnabled: true };
  }

  // ----- 컬럼 선택기 / 고정 -----
  if (features.columnChooser) options.columnChooser = { enabled: true, mode: 'select' };
  if (features.columnFixing) options.columnFixing = { enabled: true };

  // ----- 엑셀 내보내기 -----
  // 실제 내보내기는 DevExtremeGrid.vue 의 onExporting 이 exceljs 로 수행한다.
  if (features.excelExport) {
    options.export = { enabled: true, allowExportSelectedData: features.selectable };
  }

  // ----- 상태 저장 (컬럼 폭/순서/필터/정렬) -----
  if (features.stateKey) {
    options.stateStoring = { enabled: true, type: 'localStorage', storageKey: features.stateKey };
  }

  // ----- 크기 ----- (값은 위에서 미리 계산했다)
  if (height !== null) options.height = height;
  if (width !== null) options.width = width;

  // ----- 로딩 -----
  // 우리가 만든 오버레이를 쓰므로 DevExtreme 자체 로딩 패널은 끈다 (둘이 겹쳐 보이는 것 방지)
  options.loadPanel = { enabled: false };

  return options;
};

/**
 * 최종 DevExtreme 옵션 생성
 *
 * @param {Object} features 컴포넌트 props 에서 넘어온 기능 플래그
 * @param {Object} userOptions 사용자가 직접 넘긴 DevExtreme 옵션 (최우선)
 * @returns {Object}
 */
export const buildGridOptions = (features = {}, userOptions = {}) => {
  const merged = deepMerge(BASE_OPTIONS, featuresToOptions(features));
  return deepMerge(merged, userOptions ?? {});
};

export { BASE_OPTIONS };
