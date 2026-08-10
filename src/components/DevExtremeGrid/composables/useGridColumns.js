/* ***************************************************************************************************************
축약 컬럼 정의를 DevExtreme Column 설정으로 변환하는 레이어 (커스텀 4계층 중 1층)

SlickGrid 공통 컴포넌트와 "같은 축약 문법"을 쓴다.
그리드 라이브러리를 바꿔도 컬럼 정의를 거의 그대로 옮길 수 있게 하는 것이 목적이다.

  [{ field: 'salary', header: '급여', type: 'amount' }]

DevExtreme은 컬럼을 자식 컴포넌트(<DxColumn />)로 선언하는 방식이 기본이지만,
DxDataGrid 는 `columns` 를 배열 prop 으로도 받는다. 배열 방식을 쓰면
SlickGrid 래퍼와 동일한 "축약 -> 설정 변환" 구조를 그대로 재사용할 수 있어 이쪽을 택했다.

--------------------------------------------------------------------------------------------------
SlickGrid 래퍼와 다른 점 (라이브러리 차이에서 오는 것)
--------------------------------------------------------------------------------------------------
- 정렬     : cssClass 가 아니라 column.alignment ('left'|'center'|'right') 를 쓴다.
- 숫자포맷 : 직접 포맷터를 만들지 않고 column.format 을 쓴다 (DevExtreme 내장 포맷터).
             단위/천원축약처럼 내장 포맷으로 표현할 수 없는 것은 customizeText 로 처리한다.
- 코드값   : params.collection 이 아니라 column.lookup { dataSource, valueExpr, displayExpr } 이다.
- 검증     : editor.validator 가 아니라 column.validationRules 배열이다.
- 말줄임   : DevExtreme 기본 동작이라 별도 처리가 필요 없다 (theme CSS 에서 처리).
****************************************************************************************************************** */

/** 지원하는 축약 type */
export const SUPPORTED_COLUMN_TYPES = [
  'text',
  'longText',
  'number',
  'decimal',
  'amount',
  'date',
  'datetime',
  'yn',
  'code',
  'checkbox',
  'button',
  'image',
  'file',
  'link',
];

/** summary 로 지정할 수 있는 집계 종류 (DevExtreme summaryType 과 이름을 맞췄다) */
export const SUMMARY_TYPES = ['sum', 'avg', 'count', 'min', 'max'];

/** 정렬 값이 유효한지 */
const isAlign = (value) => value === 'left' || value === 'center' || value === 'right';

/**
 * 컬럼명(헤더) 정렬용 클래스
 *
 * DevExtreme 은 컬럼에 headerCssClass 같은 옵션이 없고,
 * 셀 팩토리(_createCell)가 헤더·본문·합계 셀 모두에 cssClass 를 붙인다.
 * 그래서 cssClass 로 클래스를 심고, CSS 쪽에서 `.dx-datagrid-headers` 안쪽만 골라 적용한다.
 *
 * 주의 : 같은 _createCell 이 `cell.style.textAlign = alignment` 를 인라인으로 박기 때문에
 *        클래스 규칙만으로는 절대 이기지 못한다. theme CSS 에서 !important 가 필요하다.
 *        (처음 구현은 인라인 스타일을 모르고 클래스 규칙만 넣어서 헤더가 셀 정렬을 그대로 따라갔다)
 */
const HEADER_ALIGN_CLASS = {
  left: 'dxg-h-left',
  center: 'dxg-h-center',
  right: 'dxg-h-right',
};

/* ---------------------------------------------------------------------------------------------------------------
URL 안전 처리

그리드 데이터는 서버/사용자 입력에서 오는 경우가 많다.
값을 그대로 href/src 에 넣으면 javascript: 같은 스킴으로 스크립트가 실행될 수 있으므로
http(s) / 상대경로 / data:image / mailto 만 허용한다. (SlickGrid 래퍼와 동일한 정책)
--------------------------------------------------------------------------------------------------------------- */
export const safeUrl = (value) => {
  if (typeof value !== 'string') return '';

  const url = value.trim();
  if (url === '') return '';

  // 스킴이 없고 // 로도 시작하지 않으면 상대경로 -> 허용
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) && !url.startsWith('//')) return url;

  return /^(https?:|mailto:|data:image\/)/i.test(url) ? url : '';
};

/**
 * 숫자 표시 문자열 만들기
 *
 * DevExtreme 내장 format 으로는 "천원 단위로 축약 + 단위 붙이기" 를 표현할 수 없어
 * customizeText 에서 직접 만든다. (SlickGrid 래퍼의 makeNumberFormatter 와 결과가 같아야 한다)
 *
 * @param {number|string} value 원본 값
 * @param {Object} opts { unit, prefix, scale, minDecimal, maxDecimal }
 * @returns {string}
 */
export const formatNumberText = (value, opts = {}) => {
  if (value === null || value === undefined || value === '') return '';

  const num = Number(value);
  // 숫자가 아니면 원본을 그대로 보여준다 (데이터 오류를 숨기지 않기 위해)
  if (!Number.isFinite(num)) return String(value);

  const scale = Number(opts.scale);
  const scaled = Number.isFinite(scale) && scale > 0 ? num / scale : num;

  const text = scaled.toLocaleString('ko-KR', {
    minimumFractionDigits: opts.minDecimal ?? 0,
    maximumFractionDigits: opts.maxDecimal ?? 0,
  });

  return `${opts.prefix ?? ''}${text}${opts.unit ? ` ${opts.unit}` : ''}`;
};

/** Y/N 코드셋 — 편집용(빈 값 없음) */
const YN_EDITOR_CODES = [
  { value: 'Y', label: 'Y' },
  { value: 'N', label: 'N' },
];

/**
 * type별 기본 정의
 *
 * dataType  : DevExtreme 의 컬럼 자료형. 정렬·필터 UI 가 이 값으로 결정된다.
 * alignment : 셀 정렬
 * format    : DevExtreme 내장 포맷 (없으면 customizeText 로 처리)
 * decimals  : customizeText 로 숫자를 그릴 때 쓸 소수 자리
 */
const COLUMN_TYPES = {
  text: { dataType: 'string', alignment: 'left' },
  longText: { dataType: 'string', alignment: 'left' },
  number: { dataType: 'number', alignment: 'right', numeric: true, decimals: 0 },
  decimal: { dataType: 'number', alignment: 'right', numeric: true, decimals: 2 },
  // 금액은 기본 단위가 '원'
  amount: { dataType: 'number', alignment: 'right', numeric: true, decimals: 0, defaultUnit: '원' },
  date: { dataType: 'date', alignment: 'center', format: 'yyyy-MM-dd' },
  datetime: { dataType: 'datetime', alignment: 'center', format: 'yyyy-MM-dd HH:mm' },
  yn: { dataType: 'string', alignment: 'center', ynCodes: true },
  code: { dataType: 'string', alignment: 'center', useLookup: true },
  checkbox: { dataType: 'boolean', alignment: 'center' },
  // 아래 4개는 데이터가 아니라 UI 요소라서 정렬/필터 대상이 아니다
  button: { dataType: 'string', alignment: 'center', uiOnly: true },
  image: { dataType: 'string', alignment: 'center', uiOnly: true },
  file: { dataType: 'string', alignment: 'left', cellRender: 'file' },
  link: { dataType: 'string', alignment: 'left', cellRender: 'link' },
};

/** 축약 정의에서만 쓰는 키 (DevExtreme Column 으로 그대로 넘기면 안 됨) */
const SHORTHAND_KEYS = [
  'header',
  'type',
  'align',
  'headerAlign',
  'editable',
  'filter',
  'codes',
  'required',
  'requiredMessage',
  'validator',
  'validatorMessage',
  'pattern',
  'patternMessage',
  'summary',
  'group',
  'unit',
  'prefix',
  'scale',
  'minDecimal',
  'maxDecimal',
  'buttonText',
  'buttonClass',
  'action',
  'buttonDisabled',
  'buttonHidden',
  'imageHeight',
  'imageAlt',
  'checkedValue',
  'uncheckedValue',
  'ellipsis',
  'fill',
];

/**
 * 검증 규칙 생성
 *
 * DevExtreme 은 validationRules 배열을 쓴다.
 *   { type: 'required', message }
 *   { type: 'pattern', pattern, message }
 *   { type: 'custom', validationCallback: ({ value, data }) => boolean, message }
 *
 * 사용자 validator 는 SlickGrid 래퍼와 동일하게 true / '메시지' / { valid, msg } 를 모두 허용한다.
 * DevExtreme 의 custom 규칙은 boolean 만 받으므로, 문자열 메시지를 반환하는 경우
 * message 를 동적으로 바꿀 수 없다 -> validatorMessage 로 고정 문구를 쓰도록 안내한다.
 */
const buildValidationRules = (col, header) => {
  const rules = [];

  if (col.required) {
    rules.push({ type: 'required', message: col.requiredMessage ?? `${header}은(는) 필수 입력 항목입니다.` });
  }

  if (col.pattern) {
    rules.push({ type: 'pattern', pattern: col.pattern, message: col.patternMessage ?? `${header} 형식이 올바르지 않습니다.` });
  }

  if (typeof col.validator === 'function') {
    /*
     * DevExtreme 의 custom 규칙은 validationCallback 이 boolean 만 받고
     * message 는 규칙을 만들 때 고정된다. 값에 따라 메시지를 바꿀 수 없다.
     * (SlickGrid 래퍼는 validator 가 돌려준 문자열을 그대로 메시지로 썼지만 여기서는 불가능)
     *
     * 그래서 validator 는 통과/실패 판정만 담당하고, 문구는 validatorMessage 로 고정한다.
     * validator 가 문자열을 돌려주면 "실패"로만 해석한다.
     */
    rules.push({
      type: 'custom',
      validationCallback: ({ value, data }) => {
        const result = col.validator(value, data);

        if (result === true || result === undefined || result === null) return true;
        if (result === false || typeof result === 'string') return false;
        if (result && result.constructor === Object) return !!result.valid;
        return true;
      },
      message: col.validatorMessage ?? `${header} 값이 올바르지 않습니다.`,
    });
  }

  return rules;
};

/**
 * 축약 컬럼 1개 -> DevExtreme Column 설정
 *
 * @param {Object} col 축약 컬럼 정의
 * @param {Object} defaults 그리드 레벨 기본값 { headerAlign, ellipsis }
 * @returns {Object} DevExtreme Column
 */
const toDxColumn = (col, defaults = {}) => {
  const type = COLUMN_TYPES[col.type] ? col.type : 'text';
  const preset = COLUMN_TYPES[type];
  const header = col.header ?? col.field ?? col.name ?? '';

  const column = {
    dataField: col.field,
    caption: header,
    dataType: preset.dataType,
    alignment: isAlign(col.align) ? col.align : preset.alignment,
    // 정렬/필터는 기본 허용. UI 전용 컬럼(버튼/이미지)만 막는다.
    allowSorting: !preset.uiOnly,
    allowFiltering: !preset.uiOnly,
    // filter prop 을 준 컬럼만 헤더 필터(값 목록)를 켠다
    allowHeaderFiltering: !!col.filter && !preset.uiOnly,
    // 편집은 명시한 컬럼만
    allowEditing: !!col.editable,
  };

  if (col.width !== undefined) column.width = col.width;
  if (col.minWidth !== undefined) column.minWidth = col.minWidth;
  // 남는 가로 공간을 이 컬럼이 흡수하게 한다 (fitWidth 와 함께 동작)
  if (col.fill) column.sgFill = true;
  if (col.visible !== undefined) column.visible = col.visible;
  // 2단 헤더용 그룹 이름은 여기서 컬럼에 달아두고, groupIntoBands()가 중첩 구조로 바꾼다.
  // (DevExtreme 의 ownerBand 는 문자열이 아니라 "밴드 컬럼의 배열 인덱스"라서 직접 쓰지 않는다)
  if (col.group) column.sgGroup = col.group;

  // ----- 날짜 -----
  if (preset.format) column.format = preset.format;

  // ----- 숫자 (단위 / 접두사 / 축약) -----
  if (preset.numeric) {
    const numberOptions = {
      unit: col.unit ?? preset.defaultUnit,
      prefix: col.prefix,
      scale: col.scale,
      minDecimal: col.minDecimal,
      maxDecimal: col.maxDecimal ?? preset.decimals,
    };

    // 내장 format 대신 customizeText 를 쓰는 이유:
    // DevExtreme format 으로는 "값을 1000으로 나눈 뒤 '천원' 붙이기" 같은 조합을 표현할 수 없다.
    column.customizeText = ({ value }) => formatNumberText(value, numberOptions);
    // 합계 행에서 같은 표기를 재사용하기 위해 옵션을 컬럼에 실어 보낸다
    column.sgNumberOptions = numberOptions;
  }

  // ----- 코드값 (code) -----
  if (preset.useLookup && Array.isArray(col.codes)) {
    column.lookup = { dataSource: col.codes, valueExpr: 'value', displayExpr: 'label' };
  }

  // ----- Y/N -----
  if (preset.ynCodes) {
    // 편집용 목록에는 빈 값이 없어야 한다 (빈 문자열이 저장되는 것을 막기 위해)
    column.lookup = { dataSource: col.codes ?? YN_EDITOR_CODES, valueExpr: 'value', displayExpr: 'label' };
    // 표시는 체크 표시로 (SlickGrid 래퍼와 동일)
    column.customizeText = ({ value }) => (value === 'Y' || value === true ? '✔' : '');
  }

  // ----- 리치 셀 (버튼/이미지/첨부/링크) -----
  // 실제 DOM 생성은 DevExtremeGrid.vue 의 cellTemplate 이 담당한다.
  // 여기서는 어떤 템플릿을 쓸지와 필요한 설정만 실어 보낸다.
  if (type === 'button' || type === 'image' || type === 'file' || type === 'link' || type === 'checkbox') {
    column.cellTemplate = `sgCell-${type}`;
    column.sgCellType = type;
    column.sgRichCell = true;
    column.sgCellOptions = {
      buttonText: col.buttonText,
      buttonClass: col.buttonClass,
      action: col.action ?? col.field ?? header,
      buttonDisabled: col.buttonDisabled,
      buttonHidden: col.buttonHidden,
      imageHeight: col.imageHeight,
      imageAlt: col.imageAlt,
      checkedValue: col.checkedValue,
      uncheckedValue: col.uncheckedValue,
    };
  }

  // ----- 검증 -----
  const rules = buildValidationRules(col, header);
  if (rules.length > 0) column.validationRules = rules;

  // ----- 합계 -----
  if (col.summary) column.sgSummary = col.summary;

  /*
   * ----- 우리가 심는 클래스 -----
   * 아래 통과 루프에서 사용자가 cssClass 를 직접 주면 통째로 덮이므로,
   * 여기서 바로 넣지 않고 모아 두었다가 루프 뒤에 합친다.
   * (그러지 않으면 cssClass 를 준 컬럼만 말줄임·헤더정렬이 조용히 사라진다)
   */
  const internalClasses = [];

  // 컬럼명 정렬 — 셀 정렬(alignment)과 독립이며 기본값은 중앙
  const headerAlign = isAlign(col.headerAlign) ? col.headerAlign : isAlign(defaults.headerAlign) ? defaults.headerAlign : 'center';
  internalClasses.push(HEADER_ALIGN_CLASS[headerAlign]);

  /*
   * 말줄임
   *
   * 리치 셀(버튼/체크박스/이미지/첨부/링크)은 텍스트가 아니라 UI 요소라서 말줄임 대상이 아니다.
   * 텍스트용 말줄임 규칙을 그대로 두면 버튼 옆에 의미 없는 "..." 이 붙는다.
   * (실제로 폭 70px 컬럼에서 테마 패딩 좌우 21px 때문에 45px 버튼이 넘쳐 "수정 ..." 으로 보였다)
   */
  if (column.sgRichCell) {
    internalClasses.push('dxg-cell--rich');
  } else {
    const useEllipsis = col.ellipsis ?? defaults.ellipsis ?? true;
    if (!useEllipsis) internalClasses.push('dxg-no-ellipsis');
  }

  /*
   * ----- 사용자 정의 우선 적용 (탈출구) -----
   * 축약 전용 키를 뺀 나머지는 DevExtreme 원본 Column 옵션으로 그대로 통과시킨다.
   * 우리가 예상하지 못한 옵션(fixed, calculateCellValue, editorOptions 등)도 그대로 먹힌다.
   */
  for (const [key, value] of Object.entries(col)) {
    if (SHORTHAND_KEYS.includes(key) || key === 'field') continue;
    column[key] = value;
  }

  // 사용자 cssClass 를 살리면서 우리 클래스를 덧붙인다
  column.cssClass = [column.cssClass, ...internalClasses].filter(Boolean).join(' ');

  return column;
};

/**
 * 축약 컬럼 정의 유효성 검증
 *
 * 순수 JS 프로젝트라 컴파일 타임 체크가 없으므로 개발 중 오타를 콘솔 경고로 잡는다.
 *
 * @param {Array} columns
 * @returns {Array<string>} 경고 메시지 목록
 */
export const validateColumns = (columns) => {
  const warnings = [];

  if (!Array.isArray(columns)) {
    warnings.push('columns는 배열이어야 합니다.');
    return warnings;
  }

  const seen = new Set();

  columns.forEach((col, index) => {
    const label = `columns[${index}]`;

    if (!col || col.constructor !== Object) {
      warnings.push(`${label}: 컬럼 정의는 객체여야 합니다.`);
      return;
    }

    // 데이터 필드가 없는 컬럼(버튼 등)은 name 으로 식별한다
    if (!col.field && !col.name) warnings.push(`${label}: field 또는 name 중 하나는 필수입니다.`);

    const type = col.type ?? 'text';
    if (!COLUMN_TYPES[type]) {
      warnings.push(`${label}: 알 수 없는 type "${type}". 지원 목록 → ${SUPPORTED_COLUMN_TYPES.join(', ')}`);
    }

    if (type === 'code' && !Array.isArray(col.codes)) {
      warnings.push(`${label}: type "code"는 codes(=[{ value, label }]) 가 필요합니다.`);
    }

    if (Array.isArray(col.codes)) {
      const invalid = col.codes.some((c) => c === null || typeof c !== 'object' || !('value' in c) || !('label' in c));
      if (invalid) warnings.push(`${label}: codes의 각 항목은 { value, label } 형태여야 합니다.`);
    }

    if (col.align !== undefined && !isAlign(col.align)) {
      warnings.push(`${label}: align은 left | center | right 중 하나여야 합니다. (받은 값: ${col.align})`);
    }

    if (col.headerAlign !== undefined && !isAlign(col.headerAlign)) {
      warnings.push(`${label}: headerAlign은 left | center | right 중 하나여야 합니다. (받은 값: ${col.headerAlign})`);
    }

    if (col.scale !== undefined && (!Number.isFinite(Number(col.scale)) || Number(col.scale) <= 0)) {
      warnings.push(`${label}: scale은 0보다 큰 숫자여야 합니다. (받은 값: ${col.scale})`);
    }

    if ((col.required || col.validator || col.pattern) && !col.editable) {
      warnings.push(`${label}: required/validator/pattern 은 editable: true 인 컬럼에서만 동작합니다.`);
    }

    if (col.validator !== undefined && typeof col.validator !== 'function') {
      warnings.push(`${label}: validator 는 함수여야 합니다.`);
    }

    if (col.summary !== undefined && typeof col.summary !== 'function' && !SUMMARY_TYPES.includes(col.summary)) {
      warnings.push(`${label}: summary 는 ${SUMMARY_TYPES.join(' | ')} 또는 함수여야 합니다. (받은 값: ${col.summary})`);
    }

    const id = col.field ?? col.name;
    if (id) {
      if (seen.has(id)) warnings.push(`${label}: 컬럼 식별자 "${id}" 가 중복되었습니다.`);
      seen.add(id);
    }
  });

  return warnings;
};

/**
 * 축약 컬럼 정의 배열 -> DevExtreme Column 배열
 *
 * @param {Array} columns
 * @param {Object} [options]
 * @param {boolean} [options.warn=true] 유효성 경고를 콘솔에 출력할지
 * @param {string} [options.headerAlign='center'] 컬럼명 기본 정렬
 * @param {boolean} [options.ellipsis=true] 말줄임 기본값
 * @returns {Array} DevExtreme Column 배열
 */
export const buildColumns = (columns, { warn = true, headerAlign = 'center', ellipsis = true } = {}) => {
  if (!Array.isArray(columns)) return [];

  if (warn && import.meta.env?.DEV) {
    validateColumns(columns).forEach((message) => console.warn(`[DevExtremeGrid] ${message}`));
  }

  const mapped = columns
    // field 가 없어도 name 만 있으면 유효한 컬럼이다 (버튼/액션 전용 컬럼)
    .filter((col) => col && col.constructor === Object && (col.field || col.name))
    .map((col) => toDxColumn(col, { headerAlign, ellipsis }));

  /*
   * 가로 폭 채우기(applyFillColumn)는 여기서 하지 않는다.
   * 행번호 컬럼은 래퍼가 따로 만들어 앞에 붙이므로, 그 컬럼까지 포함한 최종 목록에서 계산해야
   * 폭 비율이 맞는다. (여기서 100% 를 채워 두면 행번호 폭이 더해져 가로 스크롤이 생긴다)
   */
  return groupIntoBands(mapped);
};

/**
 * 표를 컨테이너 가로 폭에 채운다 (fitWidth)
 *
 * ----- 왜 필요한가 -----
 * DevExtreme 은 grid_core/views/m_grid_view.js 에서
 *   "모든 컬럼에 width 가 있고(!hasAutoWidth) 폭 합계가 컨테이너보다 좁으면"
 * 그리드 루트에 인라인 max-width(= 컬럼 폭 합계) 를 박아 표를 그만큼으로 고정한다.
 * 그래서 카드 폭이 1026px 이어도 표가 컬럼 합계인 982px 로 남고 오른쪽에 빈 공간이 생긴다.
 * 인라인 스타일이라 CSS 의 width:100% 로는 덮을 수 없다(max-width 가 이긴다).
 *
 * 같은 조건문에 `&& !hasPercentWidth` 가 붙어 있어서, 폭을 % 로 주면 제한이 걸리지 않는다.
 *
 * ----- 두 가지 방식 -----
 * 1. 비율 유지 (기본)
 *    지정한 px 폭을 그대로 비율로 바꿔(px -> %) 전체가 함께 늘어난다.
 *    컬럼 간 폭 차이가 유지되고 어느 한 컬럼만 기형적으로 넓어지지 않는다.
 *
 * 2. 특정 컬럼이 흡수 (컬럼에 fill: true)
 *    그 컬럼의 width 만 비우면 남는 공간을 전부 가져간다.
 *    긴 텍스트 컬럼 하나만 늘리고 싶을 때 쓴다.
 *
 * 처음에는 2번을 기본으로 삼아 "가장 넓은 컬럼"을 자동 선택했는데,
 * 폭이 비슷한 컬럼들만 있는 화면에서 급여 컬럼이 150px -> 394px 로 부풀어 보기 나빴다.
 * 그래서 기본을 1번으로 바꿨다.
 *
 * 어느 방식이든 지정했던 px 는 minWidth 로 남겨 원래보다 좁아지지 않게 한다
 * (좁은 화면에서는 minWidth 까지 줄어든 뒤 가로 스크롤이 생긴다).
 *
 * @param {Array} dxColumns buildColumns 결과 (밴드 구조 가능)
 * @returns {Array} 같은 배열 (안쪽 컬럼 객체를 직접 수정)
 */
export const applyFillColumn = (dxColumns) => {
  if (!Array.isArray(dxColumns) || dxColumns.length === 0) return dxColumns;

  // 밴드(2단 헤더)의 부모 컬럼은 폭을 갖지 않으므로 실제 데이터 컬럼만 다룬다.
  // flattenColumns 는 같은 객체를 돌려주므로 여기서 수정하면 밴드 구조에도 반영된다.
  const leaves = flattenColumns(dxColumns);
  if (leaves.length === 0) return dxColumns;

  // 폭이 없는 컬럼이 이미 있으면 DevExtreme 이 알아서 그 컬럼을 늘린다
  if (leaves.some((col) => col.width === undefined)) return dxColumns;

  const keepMinWidth = (col, width) => {
    if (col.minWidth === undefined && Number.isFinite(width)) col.minWidth = width;
  };

  // ----- 방식 2 : fill 을 지정한 컬럼이 남는 공간을 흡수 -----
  const target = leaves.find((col) => col.sgFill);
  if (target) {
    keepMinWidth(target, Number(target.width));
    delete target.width;
    return dxColumns;
  }

  // ----- 방식 1 : 비율 유지 (px -> %) -----
  const widths = leaves.map((col) => Number(col.width));

  // px 가 아닌 폭('20%', 'auto' 등)이 섞여 있으면 사용자 의도를 알 수 없으니 손대지 않는다
  if (!widths.every((width) => Number.isFinite(width) && width > 0)) return dxColumns;

  const total = widths.reduce((sum, width) => sum + width, 0);

  leaves.forEach((col, index) => {
    keepMinWidth(col, widths[index]);
    // 소수점을 넉넉히 남겨 합이 100% 에서 어긋나지 않게 한다
    col.width = `${((widths[index] / total) * 100).toFixed(4)}%`;
  });

  return dxColumns;
};

/**
 * group 이 지정된 컬럼들을 밴드(2단 헤더) 구조로 묶는다
 *
 * DevExtreme 의 2단 헤더는 "부모 컬럼 객체가 columns 배열을 갖는" 중첩 구조다.
 *   [{ caption: '기본 정보', columns: [ {...}, {...} ] }, { ... }]
 *
 * 연속된 같은 group 끼리만 묶는다. 떨어져 있는 같은 이름은 별도 밴드가 된다
 * (컬럼 순서를 우리가 임의로 바꾸면 사용자가 지정한 순서가 무너지므로).
 *
 * @param {Array} dxColumns
 * @returns {Array} 밴드가 적용된 컬럼 배열
 */
export const groupIntoBands = (dxColumns) => {
  if (!Array.isArray(dxColumns) || !dxColumns.some((c) => c.sgGroup)) return dxColumns;

  const result = [];

  for (const column of dxColumns) {
    const group = column.sgGroup;
    delete column.sgGroup;

    if (!group) {
      result.push(column);
      continue;
    }

    const last = result[result.length - 1];

    // 직전 항목이 같은 이름의 밴드면 거기에 붙인다
    if (last && last.sgBandName === group) {
      last.columns.push(column);
      continue;
    }

    result.push({ caption: group, sgBandName: group, columns: [column] });
  }

  return result;
};

/**
 * 밴드 구조를 평탄화 (합계 계산 등 실제 데이터 컬럼만 필요할 때)
 *
 * @param {Array} dxColumns
 * @returns {Array} 데이터 컬럼만
 */
export const flattenColumns = (dxColumns) => {
  if (!Array.isArray(dxColumns)) return [];

  return dxColumns.flatMap((col) => (Array.isArray(col.columns) ? flattenColumns(col.columns) : [col]));
};

/**
 * 합계(summary) 설정 생성
 *
 * DevExtreme 은 그리드의 summary.totalItems 로 하단 합계를 그린다.
 * 컬럼의 sgSummary / sgNumberOptions 를 읽어 totalItems 배열을 만든다.
 *
 * @param {Array} dxColumns buildColumns 결과
 * @returns {Array} summary.totalItems
 */
export const buildSummaryItems = (dxColumns) => {
  if (!Array.isArray(dxColumns)) return [];

  // 밴드(2단 헤더) 안쪽 컬럼도 합계 대상이 될 수 있으므로 평탄화해서 찾는다
  return flattenColumns(dxColumns)
    .filter((col) => col.sgSummary && col.dataField)
    .map((col) => {
      const summary = col.sgSummary;

      // 함수를 준 경우는 DevExtreme 집계로 표현할 수 없으므로 count 로 두고 표시만 커스터마이즈한다
      const summaryType = typeof summary === 'function' ? 'count' : summary;

      return {
        column: col.dataField,
        summaryType,
        // 본문 셀과 같은 표기를 쓴다 (본문은 "1,234 천원"인데 합계는 "1234000"으로 나오는 불일치 방지)
        customizeText: ({ value }) => {
          if (typeof summary === 'function') return String(summary(value) ?? '');
          if (summaryType === 'count') return `${Number(value ?? 0).toLocaleString('ko-KR')}건`;

          const options = col.sgNumberOptions ?? {};
          // 평균은 소수점이 필요한 경우가 많아 최소 1자리를 허용한다
          const maxDecimal = summaryType === 'avg' ? Math.max(options.maxDecimal ?? 0, 1) : options.maxDecimal;
          return formatNumberText(value, { ...options, maxDecimal });
        },
      };
    });
};

export { COLUMN_TYPES };
