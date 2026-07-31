import { Editors, Filters, Formatters } from 'slickgrid-vue';

/* ***************************************************************************************************************
축약 컬럼 정의를 SlickGrid Column 객체로 변환하는 레이어 (커스텀 4계층 중 1층)

SlickGrid 원본 컬럼 정의는 장황합니다. 예를 들어 "금액을 3자리 콤마 + 원 단위로 우측정렬, 헤더는 중앙정렬" 하려면
formatter / params / cssClass / headerCssClass / type / editor.model / filter.model 을 매번 직접 써야 합니다.

이 프로젝트는 순수 JS(jsconfig)라서 컬럼 정의에 타입 안전성이 붙지 않습니다.
따라서 축약 정의 + 런타임 검증이 단순 편의가 아니라 오타를 잡아주는 실질적 방어선 역할을 합니다.

--------------------------------------------------------------------------------------------------
사용 예
--------------------------------------------------------------------------------------------------
  [
    { field: 'empNo'  , header: '사번'  , type: 'text'  , width: 100 },
    { field: 'name'   , header: '이름'  , type: 'text'  , ellipsis: true },          // 길면 ... 처리
    { field: 'salary' , header: '급여'  , type: 'amount', unit: '원' },
    { field: 'budget' , header: '예산'  , type: 'number', unit: '천원', scale: 1000 }, // 1,234,000 -> 1,234 천원
    { field: 'rate'   , header: '비율'  , type: 'decimal', unit: '%' },
    { field: 'hireDt' , header: '입사일', type: 'date' },
    { field: 'deptCd' , header: '부서'  , type: 'code'  , codes: [{ value: 'D1', label: '개발팀' }] },
    { field: 'photo'  , header: '사진'  , type: 'image' , imageHeight: 28 },
    { field: 'attach' , header: '첨부'  , type: 'file' },
    { id: 'edit', header: '관리', type: 'button', buttonText: '수정', action: 'edit' },
  ]

정렬 규칙
  align       : 셀 내용 정렬. type별 기본값이 있음 (문자=좌, 숫자=우, 날짜/코드=중앙)
  headerAlign : 컬럼명 정렬. 기본값은 항상 'center' (셀 정렬과 무관하게 헤더는 중앙)
--------------------------------------------------------------------------------------------------
****************************************************************************************************************** */

/** 정렬 클래스 (theme/slickgrid-custom.css 에 정의) */
const ALIGN_CLASS = {
  left: 'sg-align-left',
  center: 'sg-align-center',
  right: 'sg-align-right',
};

/** 헤더 정렬 클래스 */
const HEADER_ALIGN_CLASS = {
  left: 'sg-head-left',
  center: 'sg-head-center',
  right: 'sg-head-right',
};

/** 내용이 길 때 ... 로 줄이는 클래스 */
const ELLIPSIS_CLASS = 'sg-ellipsis';

/** 정렬 값이 유효한지 */
const isAlign = (value) => value === 'left' || value === 'center' || value === 'right';

/* ---------------------------------------------------------------------------------------------------------------
URL 안전 처리

그리드 데이터는 서버/사용자 입력에서 오는 경우가 많다.
값을 그대로 href/src에 넣으면 javascript: 같은 스킴으로 스크립트가 실행될 수 있으므로
http(s) / 상대경로 / data:image / mailto 만 허용한다.
--------------------------------------------------------------------------------------------------------------- */
const safeUrl = (value) => {
  if (typeof value !== 'string') return '';

  const url = value.trim();
  if (url === '') return '';

  // 상대경로는 허용 (스킴이 없고 // 로 시작하지 않는 경우)
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) && !url.startsWith('//')) return url;

  return /^(https?:|mailto:|data:image\/)/i.test(url) ? url : '';
};

/* ---------------------------------------------------------------------------------------------------------------
숫자 포맷터

단위(unit) / 접두사(prefix) / 단위 축약(scale) 을 한번에 처리한다.
scale은 "표시용 나눗셈"이다. 예) scale: 1000, unit: '천원' -> 1,234,000 을 "1,234 천원" 으로 표시
--------------------------------------------------------------------------------------------------------------- */
const makeNumberFormatter = (defaultMaxDecimal = 0) => {
  return (row, cell, value, columnDef) => {
    if (value === null || value === undefined || value === '') return '';

    const p = columnDef?.params ?? {};
    const num = Number(value);

    // 숫자가 아니면 원본을 그대로 보여준다 (데이터 오류를 숨기지 않기 위해)
    if (!Number.isFinite(num)) return String(value);

    const scale = Number(p.scale);
    const scaled = Number.isFinite(scale) && scale > 0 ? num / scale : num;

    const text = scaled.toLocaleString('ko-KR', {
      minimumFractionDigits: p.minDecimal ?? 0,
      maximumFractionDigits: p.maxDecimal ?? defaultMaxDecimal,
    });

    return `${p.prefix ?? ''}${text}${p.unit ? ` ${p.unit}` : ''}`;
  };
};

/* ---------------------------------------------------------------------------------------------------------------
버튼 / 이미지 / 첨부파일 / 링크 포맷터

SlickGrid 포맷터는 문자열 대신 HTMLElement를 반환할 수 있다.
HTML 문자열을 만들면 새니타이즈 문제가 생기므로 DOM API로 직접 만든다.

버튼 클릭은 SlickGrid.vue의 클릭 핸들러가 data-sg-action 속성을 보고 on-cell-action 이벤트로 올려준다.
--------------------------------------------------------------------------------------------------------------- */
const buttonFormatter = (row, cell, value, columnDef, dataContext) => {
  const p = columnDef?.params ?? {};

  const button = document.createElement('button');
  button.type = 'button';
  button.className = ['sg-cell-btn', p.buttonClass].filter(Boolean).join(' ');

  // 라벨은 buttonText(문자열 또는 행별 함수) 우선, 없으면 셀 값
  const label = typeof p.buttonText === 'function' ? p.buttonText(dataContext) : (p.buttonText ?? value);
  button.textContent = label ?? '';

  // 클릭 식별자. action이 없으면 컬럼 id를 사용
  button.dataset.sgAction = p.action ?? columnDef?.id ?? '';

  // 행별로 버튼을 숨기거나 비활성화할 수 있게
  if (typeof p.buttonDisabled === 'function' && p.buttonDisabled(dataContext)) button.disabled = true;
  if (typeof p.buttonHidden === 'function' && p.buttonHidden(dataContext)) return '';

  return button;
};

/**
 * 상호작용 가능한 체크박스 셀
 *
 * data-sg-toggle 에 필드명을 심어두면 SlickGrid.vue의 클릭 핸들러가
 *  1) 데이터를 갱신하고 (안 하면 셀이 다시 그려질 때 체크가 원복된다)
 *  2) on-cell-toggle 이벤트로 올려준다.
 *
 * 'Y'/'N' 문자열을 쓰는 화면이 많으므로 checkedValue / uncheckedValue 로 저장값을 지정할 수 있다.
 */
const checkboxFormatter = (row, cell, value, columnDef, dataContext) => {
  const p = columnDef?.params ?? {};
  const checkedValue = p.checkedValue ?? true;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'sg-cell-checkbox';
  // 느슨한 비교로 true/'Y'/1 을 모두 체크로 인식
  input.checked = value === checkedValue || value === true || value === 'Y' || value === 1;
  input.dataset.sgToggle = columnDef?.field ?? '';

  // 행 상태에 따라 비활성 / 숨김
  if (typeof p.checkboxHidden === 'function' && p.checkboxHidden(dataContext)) return '';
  if (typeof p.checkboxDisabled === 'function' && p.checkboxDisabled(dataContext)) input.disabled = true;

  return input;
};

const imageFormatter = (row, cell, value, columnDef) => {
  const url = safeUrl(value);
  if (!url) return '';

  const p = columnDef?.params ?? {};

  const img = document.createElement('img');
  img.src = url;
  img.className = 'sg-cell-img';
  img.alt = p.imageAlt ?? '';
  img.loading = 'lazy';

  const height = p.imageHeight ?? 24;
  img.style.height = typeof height === 'number' ? `${height}px` : height;

  return img;
};

const fileFormatter = (row, cell, value, columnDef) => {
  if (!value) return '';

  const p = columnDef?.params ?? {};

  // 값이 { name, url } 객체일 수도 있고 URL 문자열일 수도 있다
  const rawUrl = typeof value === 'object' ? value.url : value;
  const url = safeUrl(rawUrl);
  if (!url) return '';

  const name = (typeof value === 'object' ? value.name : null) ?? decodeURIComponent(url.split('/').pop() ?? '') ?? '';

  const link = document.createElement('a');
  link.href = url;
  link.className = 'sg-cell-file';
  link.title = name;
  // 같은 출처 파일은 다운로드로 동작, 외부 링크면 새 탭
  if (p.fileDownload !== false) link.download = name;
  else {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  const icon = document.createElement('span');
  icon.className = 'sg-cell-file__icon';
  icon.textContent = '📎';
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'sg-cell-file__name';
  text.textContent = name;

  link.append(icon, text);
  return link;
};

const linkFormatter = (row, cell, value, columnDef) => {
  const url = safeUrl(typeof value === 'object' ? value?.url : value);
  if (!url) return '';

  const p = columnDef?.params ?? {};

  const link = document.createElement('a');
  link.href = url;
  link.className = 'sg-cell-link';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = (typeof value === 'object' ? value?.name : null) ?? p.linkText ?? url;
  link.title = link.textContent;

  return link;
};

/**
 * type별 기본 정의 테이블
 *
 * fieldType : SlickGrid의 column.type. 정렬/필터 비교 로직이 이 값을 보고 동작하므로 반드시 맞춰야 함
 * align     : 셀 내용 정렬 (headerAlign은 별도로 항상 center가 기본)
 * formatter : 표시 포맷터
 * params    : formatter에 넘길 기본 옵션
 * editor    : editable:true 일 때 사용할 에디터
 * filter    : filter:true 일 때 사용할 필터
 */
const COLUMN_TYPES = {
  /** 일반 문자열 */
  text: {
    fieldType: 'string',
    align: 'left',
    editor: Editors.text,
    filter: Filters.compoundInputText,
  },
  /** 여러 줄 문자열 (편집 시 textarea) */
  longText: {
    fieldType: 'string',
    align: 'left',
    editor: Editors.longText,
    filter: Filters.compoundInputText,
  },
  /** 정수 (3자리 콤마). unit / prefix / scale 사용 가능 */
  number: {
    fieldType: 'number',
    align: 'right',
    formatter: makeNumberFormatter(0),
    editor: Editors.integer,
    filter: Filters.compoundInputNumber,
  },
  /** 소수 (소수점 2자리까지). unit / prefix / scale 사용 가능 */
  decimal: {
    fieldType: 'number',
    align: 'right',
    formatter: makeNumberFormatter(2),
    params: { maxDecimal: 2 },
    editor: Editors.float,
    filter: Filters.compoundInputNumber,
  },
  /** 금액 (3자리 콤마 + 기본 단위 '원') */
  amount: {
    fieldType: 'number',
    align: 'right',
    formatter: makeNumberFormatter(0),
    params: { unit: '원' },
    editor: Editors.integer,
    filter: Filters.compoundInputNumber,
  },
  /** 날짜 YYYY-MM-DD */
  date: {
    fieldType: 'dateIso',
    align: 'center',
    formatter: Formatters.dateIso,
    editor: Editors.date,
    filter: Filters.compoundDate,
  },
  /** 일시 YYYY-MM-DD HH:mm */
  datetime: {
    fieldType: 'dateTimeShortIso',
    align: 'center',
    formatter: Formatters.dateTimeShortIso,
    editor: Editors.date,
    filter: Filters.compoundDate,
  },
  /**
   * Y/N -> 체크 아이콘
   *
   * 편집 에디터로 Editors.checkbox를 쓰면 안 된다.
   * checkbox 에디터는 boolean(true/false)을 저장하므로 'Y'/'N' 문자열 필드에 넣으면
   * 저장 후 포맷터가 값을 못 읽고 서버로도 타입이 다른 값이 전송된다.
   * 문자열을 유지하기 위해 singleSelect를 사용한다.
   */
  yn: {
    fieldType: 'string',
    align: 'center',
    formatter: (row, cell, value) => (value === 'Y' || value === true ? '✔' : ''),
    editor: Editors.singleSelect,
    filter: Filters.singleSelect,
    /** 편집용 코드셋 (빈 값 없음) */
    defaultEditorCodes: [
      { value: 'Y', label: 'Y' },
      { value: 'N', label: 'N' },
    ],
    /** 필터용 코드셋 (빈 값 = 전체) */
    defaultFilterCodes: [
      { value: '', label: '전체' },
      { value: 'Y', label: 'Y' },
      { value: 'N', label: 'N' },
    ],
  },
  /** 코드값 -> 명칭 (codes 필요) */
  code: {
    fieldType: 'string',
    align: 'center',
    formatter: Formatters.collection,
    editor: Editors.singleSelect,
    filter: Filters.singleSelect,
  },
  /**
   * 클릭 가능한 체크박스 (checkedValue / uncheckedValue / checkboxDisabled)
   *
   * yn 타입은 "읽기 전용 체크 표시"이고, 이 타입은 "눌러서 바꾸는 체크박스"다.
   * 클릭하면 데이터가 갱신되고 on-cell-toggle 이벤트가 발생한다.
   */
  checkbox: {
    fieldType: 'boolean',
    align: 'center',
    formatter: checkboxFormatter,
  },
  /** 버튼 (buttonText / action / buttonDisabled / buttonHidden) */
  button: {
    fieldType: 'string',
    align: 'center',
    formatter: buttonFormatter,
    sortable: false,
    // 버튼은 데이터가 아니므로 엑셀에서 제외
    excludeFromExport: true,
  },
  /** 이미지 (값 = 이미지 URL, imageHeight로 높이 조절) */
  image: {
    fieldType: 'string',
    align: 'center',
    formatter: imageFormatter,
    sortable: false,
    excludeFromExport: true,
  },
  /** 첨부파일 (값 = URL 문자열 또는 { name, url }) */
  file: {
    fieldType: 'string',
    align: 'left',
    formatter: fileFormatter,
    sortable: false,
  },
  /** 링크 (값 = URL 문자열 또는 { name, url }) */
  link: {
    fieldType: 'string',
    align: 'left',
    formatter: linkFormatter,
    filter: Filters.compoundInputText,
  },
};

/** 축약 정의에서 params로 옮겨줄 키 목록 (사용자가 params를 직접 안 써도 되게) */
const PARAM_SHORTCUTS = [
  'unit',
  'prefix',
  'scale',
  'minDecimal',
  'maxDecimal',
  'buttonText',
  'buttonClass',
  'buttonDisabled',
  'buttonHidden',
  'action',
  'imageHeight',
  'imageAlt',
  'fileDownload',
  'linkText',
  'checkedValue',
  'uncheckedValue',
  'checkboxDisabled',
  'checkboxHidden',
];

/**
 * 그룹핑 기본 정의 생성
 *
 * [중요] 드래그 그룹핑 플러그인은 컬럼에 grouping 객체가 없으면 그 컬럼을 조용히 무시한다.
 * 플러그인 내부 조건:
 *   if (col.id === columnId && col.grouping && !isEmptyObject(col.grouping)) { ... }
 * 즉 grouping이 없으면 헤더를 끌어다 놓아도, setDroppedGroups()를 호출해도 아무 일도 일어나지 않는다.
 * 그래서 groupable이 켜져 있으면 모든 컬럼에 기본 grouping을 자동으로 만들어준다.
 *
 * @param {Object} column 변환이 끝난 SlickGrid Column
 * @param {Array} [codes] 코드 목록 (있으면 그룹 제목에 코드값 대신 명칭을 보여준다)
 * @returns {Object} Grouping 정의
 */
const createGrouping = (column, codes) => ({
  getter: column.field,
  formatter: (g) => {
    // 코드 컬럼이면 'D1' 대신 '개발팀'으로 보여준다
    const label = Array.isArray(codes) ? (codes.find((c) => c.value === g.value)?.label ?? g.value) : g.value;
    const shown = label === null || label === undefined || label === '' ? '(값 없음)' : label;
    // HTML 문자열을 반환하면 새니타이즈 대상이 되므로 순수 텍스트로 만든다
    return `${column.name}: ${shown} (${g.count}건)`;
  },
  collapsed: false,
  aggregateCollapsed: false,
});

/**
 * 필수입력 + 사용자 검증을 하나의 validator로 합성
 *
 * editor.required 를 쓰지 않는 이유:
 *   라이브러리 내장 필수검사 메시지가 Constants.VALIDATION_REQUIRED_FIELD = 'Field is required' 인데
 *   이 값은 locales가 아니라 정적 상수라서 한글로 바꿀 방법이 없다.
 *   (라이브러리 전역 상수를 덮어쓰면 다른 곳까지 영향을 주므로 피했다)
 *   그래서 필수검사도 validator 안에서 직접 수행하고 한글 메시지를 낸다.
 *
 * 사용자 validator는 반환 형태를 셋 다 허용한다.
 *   true / undefined  -> 통과
 *   '문자열'          -> 그 문자열이 오류 메시지
 *   { valid, msg }    -> 라이브러리 원본 형식
 *
 * @returns {Function} EditorValidator
 */
const makeValidator = ({ required, requiredMessage, validator, header }) => {
  return (value, args) => {
    // ----- 1. 필수 입력 -----
    if (required) {
      const empty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
      if (empty) return { valid: false, msg: requiredMessage ?? `${header}은(는) 필수 입력 항목입니다.` };
    }

    // ----- 2. 사용자 검증 -----
    if (typeof validator !== 'function') return { valid: true, msg: null };

    const result = validator(value, args);

    if (result === true || result === undefined || result === null) return { valid: true, msg: null };
    if (typeof result === 'string') return { valid: false, msg: result };
    if (result === false) return { valid: false, msg: '입력값이 올바르지 않습니다.' };

    return result;
  };
};

/** summary 로 지정할 수 있는 집계 종류 */
export const SUMMARY_TYPES = ['sum', 'avg', 'count', 'min', 'max'];

/**
 * 합계 행에 표시할 값 계산
 *
 * 숫자가 아닌 값은 집계에서 제외한다 (빈 셀·문자열이 섞여 있어도 계산이 깨지지 않게).
 * count 만은 "값이 있는 행 수"를 세므로 숫자가 아니어도 포함한다.
 *
 * @param {Array} items 집계 대상 (보통 필터가 적용된 행들)
 * @param {Object} column SlickGrid Column
 * @returns {string} 합계 셀에 표시할 문자열
 */
export const calcSummary = (items, column) => {
  const type = column?.sgSummary;
  if (!type || !Array.isArray(items)) return '';

  // 함수를 직접 준 경우 그대로 사용
  if (typeof type === 'function') return String(type(items, column) ?? '');

  const field = column.field;
  const raw = items.map((item) => item?.[field]);

  if (type === 'count') {
    const count = raw.filter((v) => v !== null && v !== undefined && v !== '').length;
    return `${count.toLocaleString('ko-KR')}건`;
  }

  const nums = raw.map(Number).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return '';

  let value;
  if (type === 'sum') value = nums.reduce((a, b) => a + b, 0);
  else if (type === 'avg') value = nums.reduce((a, b) => a + b, 0) / nums.length;
  else if (type === 'min') value = Math.min(...nums);
  else if (type === 'max') value = Math.max(...nums);
  else return '';

  /*
   * 본문 셀과 같은 표기로 맞춘다.
   * 컬럼의 params(단위/축약/소수자리)를 그대로 재사용해야
   * 본문은 "1,234 천원"인데 합계는 "1234000"으로 나오는 불일치가 생기지 않는다.
   */
  const p = column.params ?? {};
  const scale = Number(p.scale);
  const scaled = Number.isFinite(scale) && scale > 0 ? value / scale : value;

  // 평균은 소수점이 필요한 경우가 많아 최소 1자리를 허용한다
  const maxDecimal = type === 'avg' ? Math.max(p.maxDecimal ?? 0, 1) : (p.maxDecimal ?? 0);

  const text = scaled.toLocaleString('ko-KR', {
    minimumFractionDigits: p.minDecimal ?? 0,
    maximumFractionDigits: maxDecimal,
  });

  return `${p.prefix ?? ''}${text}${p.unit ? ` ${p.unit}` : ''}`;
};

/** 행번호 컬럼의 고정 id. 데이터 필드와 겹치지 않도록 접두사를 붙였다. */
export const ROW_NUMBER_COLUMN_ID = '__sgRowNum';

/**
 * 행번호(No) 컬럼 생성
 *
 * 포맷터의 첫번째 인자 row는 "화면에 보이는 순번"이라서
 * 정렬/필터를 걸어도 항상 1부터 순서대로 다시 매겨진다 (원하는 동작).
 *
 * 체크박스 선택 컬럼은 slickgrid-universal이 자동으로 맨 앞에 붙이므로
 * 최종 컬럼 순서는 [체크박스][No][데이터...] 가 된다.
 *
 * @param {Object} [options]
 * @param {string} [options.header='No'] 헤더 표시명
 * @param {number} [options.width=60] 컬럼 너비
 * @returns {Object} SlickGrid Column
 */
export const createRowNumberColumn = ({ header = 'No', width = 60 } = {}) => ({
  id: ROW_NUMBER_COLUMN_ID,
  field: ROW_NUMBER_COLUMN_ID,
  name: header,
  width,
  minWidth: 40,
  maxWidth: 100,
  formatter: (row) => `${row + 1}`,
  cssClass: ALIGN_CLASS.center,
  headerCssClass: HEADER_ALIGN_CLASS.center,
  // 행번호는 정렬/필터/그룹 대상이 아니다
  sortable: false,
  filterable: false,
  reorderable: false,
  resizable: true,
  // 컬럼 선택기(Column Picker)에서 숨기지 못하게 한다
  excludeFromColumnPicker: true,
  excludeFromGridMenu: true,
  excludeFromHeaderMenu: true,
  // 엑셀로 내보낼 때도 화면과 동일하게 번호가 나가도록
  exportWithFormatter: true,
});

/** 지원하는 type 목록 (경고 메시지용) */
export const SUPPORTED_COLUMN_TYPES = Object.keys(COLUMN_TYPES);

/**
 * 축약 컬럼 1개를 SlickGrid Column으로 변환
 *
 * @param {Object} col 축약 컬럼 정의
 * @param {Object} defaults 그리드 레벨 기본값 { headerAlign, ellipsis }
 * @returns {Object} SlickGrid Column
 */
const toSlickColumn = (col, defaults = {}) => {
  // type을 제외한 나머지는 기본적으로 그대로 통과시킨다 (우리가 예상 못 한 SlickGrid 옵션도 먹히도록)
  const {
    field,
    header,
    type = 'text',
    align,
    headerAlign,
    ellipsis,
    editable = false,
    filter = false,
    codes,
    required = false,
    validator,
    summary,
    group,
    ...rest
  } = col;

  const preset = COLUMN_TYPES[type];

  const column = {
    // id가 따로 없으면 field를 id로 사용 (SlickGrid는 컬럼 id가 필수)
    id: rest.id ?? field,
    field,
    name: header ?? field,
    type: preset.fieldType,
    sortable: preset.sortable ?? true,
    resizable: true,
    reorderable: true,
    // 엑셀 export 시 화면에 보이는 포맷 그대로 나가도록
    exportWithFormatter: true,
  };

  if (preset.excludeFromExport) column.excludeFromExport = true;

  // ----- 포맷터 -----
  // 사용자가 formatter를 직접 준 경우엔 type 기본 포맷터를 덮어쓰지 않는다
  if (!rest.formatter && preset.formatter) column.formatter = preset.formatter;

  // ----- 셀 정렬 + 말줄임 -----
  const alignKey = isAlign(align) ? align : preset.align;
  // 말줄임은 컬럼 설정이 우선, 없으면 그리드 레벨 기본값
  const useEllipsis = ellipsis ?? defaults.ellipsis ?? true;

  column.cssClass = [ALIGN_CLASS[alignKey], useEllipsis ? ELLIPSIS_CLASS : null].filter(Boolean).join(' ');

  // ----- 헤더(컬럼명) 정렬 -----
  // 셀 정렬과 독립. 지정이 없으면 그리드 기본값, 그것도 없으면 'center'
  const headerAlignKey = isAlign(headerAlign) ? headerAlign : isAlign(defaults.headerAlign) ? defaults.headerAlign : 'center';
  column.headerCssClass = HEADER_ALIGN_CLASS[headerAlignKey];

  // ----- 다중 헤더 (2단 헤더) -----
  // 같은 group 문자열을 가진 이웃 컬럼끼리 상단에 묶인 제목이 만들어진다.
  if (group) column.columnGroup = group;

  // ----- 합계 행 -----
  // 실제 합계 계산은 SlickGrid.vue가 footer row에 그린다. 여기서는 설정만 컬럼에 실어 보낸다.
  if (summary) column.sgSummary = summary;

  // ----- 코드 목록 (code / yn 타입) -----
  // 편집용과 필터용 코드셋이 다를 수 있다 (필터는 "전체"에 해당하는 빈 값이 필요하지만 편집엔 없어야 함)
  const displayCodes = codes ?? preset.defaultFilterCodes;
  const editorCodes = codes ?? preset.defaultEditorCodes;
  const filterCodes = codes ?? preset.defaultFilterCodes;

  /*
   * ----- 에디터 + 유효성 검증 -----
   *
   * required : 빈 값이면 저장되지 않고 셀에 오류 표시가 뜬다.
   * validator: (value, args) => true | '오류 메시지' | { valid, msg }
   *            반환 형태를 셋 다 허용해서 간단한 경우엔 문자열만 돌려주면 되게 했다.
   *            (라이브러리 원본 형식은 { valid, msg } 이다)
   *
   * 검증 실패는 on-validation-error 이벤트로도 올라온다.
   */
  if (editable && preset.editor) {
    column.editor = { model: preset.editor };
    if (editorCodes) column.editor.collection = editorCodes;

    if (required || typeof validator === 'function') {
      column.editor.validator = makeValidator({ required, requiredMessage: rest.requiredMessage, validator, header: header ?? field });
    }
  }

  // ----- 필터 -----
  // filter가 객체면 SlickGrid 원본 필터 정의로 취급 (탈출구), boolean이면 type 기본 필터 사용
  if (filter) {
    column.filterable = true;
    if (filter.constructor === Object) {
      column.filter = { ...filter };
    } else if (preset.filter) {
      column.filter = { model: preset.filter };
      if (filterCodes) column.filter.collection = filterCodes;
    }
  }

  // ----- 축약 키를 params로 승격 -----
  // unit / scale / buttonText 등을 최상위에 써도 동작하도록 params로 옮긴다
  const shortcutParams = {};
  for (const key of PARAM_SHORTCUTS) {
    if (key in rest) {
      shortcutParams[key] = rest[key];
      // SlickGrid Column에 없는 키를 남겨두면 혼란스러우니 제거
      delete rest[key];
    }
  }

  // ----- 사용자 정의 우선 적용 (탈출구) -----
  // rest에 남은 모든 SlickGrid 원본 옵션이 위 기본값들을 덮어쓴다
  Object.assign(column, rest);

  // params는 덮어쓰기가 아니라 병합이어야 한다.
  // preset params(포맷 옵션) + collection(코드목록) + 축약키 + 사용자 params 순으로 합친 뒤 마지막에 확정.
  // Object.assign 이후에 대입하지 않으면 rest.params가 앞의 값들을 통째로 날려버린다.
  // (Formatters.collection 은 params.collection 을 참조한다)
  const mergedParams = {
    ...(preset.params ?? {}),
    ...(displayCodes ? { collection: displayCodes } : {}),
    ...shortcutParams,
    ...(rest.params ?? {}),
  };

  if (Object.keys(mergedParams).length > 0) column.params = mergedParams;

  /*
   * 그룹핑 기본 정의
   *
   * groupable 모드에서 컬럼에 grouping이 없으면 플러그인이 그 컬럼을 무시한다(위 createGrouping 주석 참고).
   * 사용자가 직접 grouping을 준 경우(집계 등)에는 건드리지 않는다.
   * 데이터 필드가 없는 컬럼(버튼/이미지)은 그룹 기준이 될 수 없으므로 제외한다.
   */
  if (defaults.groupable && !column.grouping && field && type !== 'button' && type !== 'image') {
    column.grouping = createGrouping(column, displayCodes);
  }

  return column;
};

/**
 * 축약 컬럼 정의 유효성 검증
 *
 * JS 프로젝트라 컴파일 타임 체크가 없으므로 개발 중 오타를 콘솔 경고로 잡는다.
 *
 * @param {Array} columns 축약 컬럼 정의 배열
 * @returns {Array<string>} 경고 메시지 목록
 */
export const validateColumns = (columns) => {
  const warnings = [];

  if (!Array.isArray(columns)) {
    warnings.push('columns는 배열이어야 합니다.');
    return warnings;
  }

  const seenIds = new Set();

  columns.forEach((col, index) => {
    const label = `columns[${index}]`;

    if (!col || col.constructor !== Object) {
      warnings.push(`${label}: 컬럼 정의는 객체여야 합니다.`);
      return;
    }

    // 데이터 필드가 없는 컬럼(버튼/액션 전용)은 id만 있어도 된다
    if (!col.field && !col.id) warnings.push(`${label}: field 또는 id 중 하나는 필수입니다.`);

    const type = col.type ?? 'text';
    if (!COLUMN_TYPES[type]) {
      warnings.push(`${label}: 알 수 없는 type "${type}". 지원 목록 → ${SUPPORTED_COLUMN_TYPES.join(', ')}`);
    }

    // code 타입인데 코드 목록이 없으면 값이 그대로 노출된다
    if (type === 'code' && !Array.isArray(col.codes)) {
      warnings.push(`${label}: type "code"는 codes(=[{ value, label }]) 가 필요합니다.`);
    }

    // 코드 목록 형식 검증
    if (Array.isArray(col.codes)) {
      const invalid = col.codes.some((c) => c === null || typeof c !== 'object' || !('value' in c) || !('label' in c));
      if (invalid) warnings.push(`${label}: codes의 각 항목은 { value, label } 형태여야 합니다.`);
    }

    // 정렬 값 오타
    if (col.align !== undefined && !isAlign(col.align)) {
      warnings.push(`${label}: align은 left | center | right 중 하나여야 합니다. (받은 값: ${col.align})`);
    }
    if (col.headerAlign !== undefined && !isAlign(col.headerAlign)) {
      warnings.push(`${label}: headerAlign은 left | center | right 중 하나여야 합니다. (받은 값: ${col.headerAlign})`);
    }

    // scale은 0이나 음수면 나눗셈이 깨진다
    if (col.scale !== undefined && (!Number.isFinite(Number(col.scale)) || Number(col.scale) <= 0)) {
      warnings.push(`${label}: scale은 0보다 큰 숫자여야 합니다. (받은 값: ${col.scale})`);
    }

    // required/validator 는 편집 가능한 컬럼에서만 의미가 있다 (에디터가 있어야 검증이 동작)
    if ((col.required || col.validator) && !col.editable) {
      warnings.push(`${label}: required/validator 는 editable: true 인 컬럼에서만 동작합니다.`);
    }

    if (col.validator !== undefined && typeof col.validator !== 'function') {
      warnings.push(`${label}: validator 는 함수여야 합니다.`);
    }

    // summary 값 검증
    if (col.summary !== undefined && typeof col.summary !== 'function' && !SUMMARY_TYPES.includes(col.summary)) {
      warnings.push(`${label}: summary 는 ${SUMMARY_TYPES.join(' | ')} 또는 함수여야 합니다. (받은 값: ${col.summary})`);
    }

    // id 중복 시 SlickGrid가 컬럼을 제대로 렌더하지 못한다
    const id = col.id ?? col.field;
    if (id) {
      if (seenIds.has(id)) warnings.push(`${label}: 컬럼 id "${id}" 가 중복되었습니다.`);
      seenIds.add(id);
    }
  });

  return warnings;
};

/**
 * 축약 컬럼 정의 배열 -> SlickGrid Column 배열
 *
 * 이미 SlickGrid 원본 형식(name 사용)으로 작성된 컬럼도 그대로 통과되므로
 * 축약/원본을 섞어 쓸 수 있습니다.
 *
 * @param {Array} columns 축약 컬럼 정의 배열
 * @param {Object} [options]
 * @param {boolean} [options.warn=true] 유효성 경고를 콘솔에 출력할지 여부
 * @param {string} [options.headerAlign='center'] 컬럼명 기본 정렬
 * @param {boolean} [options.ellipsis=true] 내용이 길 때 ... 처리 기본값
 * @param {boolean} [options.forceFilterable=false] 모든 컬럼을 필터 대상으로 만듦 (그리드 밖 입력창 필터용)
 * @param {boolean} [options.groupable=false] 모든 컬럼에 기본 grouping을 부여 (없으면 그룹핑이 동작하지 않음)
 * @returns {Array} SlickGrid Column 배열
 */
export const buildColumns = (columns, { warn = true, headerAlign = 'center', ellipsis = true, forceFilterable = false, groupable = false } = {}) => {
  if (!Array.isArray(columns)) return [];

  if (warn && import.meta.env?.DEV) {
    validateColumns(columns).forEach((message) => console.warn(`[SlickGrid] ${message}`));
  }

  return columns
    // field가 없어도 id만 있으면 유효한 컬럼이다 (버튼/액션 전용 컬럼 등).
    // field로만 걸러내면 그런 컬럼이 조용히 사라진다.
    .filter((col) => col && col.constructor === Object && (col.field || col.id))
    .map((col) => {
      // type이 지원 목록에 없으면 text로 폴백 (경고는 위에서 이미 출력)
      const safeType = COLUMN_TYPES[col.type ?? 'text'] ? col.type : 'text';

      /*
       * 그리드 밖 입력창으로 필터를 쓰는 경우 모든 컬럼을 필터 대상으로 만든다.
       *
       * FilterService.updateFilters()는 내부적으로
       *   "_filtersMetadata.length === 0 이면 에러를 던진다"
       * _filtersMetadata는 filterable: true 인 컬럼에서만 만들어지므로,
       * 컬럼에 filter를 지정하지 않은 상태에서 applyFilters()를 호출하면 예외가 발생하고
       * 필터가 조용히 적용되지 않는다.
       * 필터 행 자체는 showHeaderRow: false 로 숨기므로 화면에는 보이지 않는다.
       */
      const withFilter = forceFilterable && !col.filter ? { ...col, filter: true } : col;

      // 원본 col을 변경하지 않도록 얕은 복사해서 넘긴다 (toSlickColumn 내부에서 delete를 사용)
      return toSlickColumn({ ...withFilter, type: safeType }, { headerAlign, ellipsis, groupable });
    });
};

export { COLUMN_TYPES, ALIGN_CLASS, HEADER_ALIGN_CLASS, safeUrl };
