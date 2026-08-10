import { describe, it, expect, vi } from 'vitest';

import { buildColumns, validateColumns, calcSummary, createRowNumberColumn, safeUrl, SUPPORTED_COLUMN_TYPES } from '@/components/SlickGrid/composables/useGridColumns';

/* ***************************************************************************************************************
컬럼 축약 정의 -> SlickGrid Column 변환 테스트

여기 있는 케이스 대부분은 실제로 발생한 버그에서 나왔다. 지우지 말 것.
****************************************************************************************************************** */

/** 포맷터 호출 헬퍼 (SlickGrid이 넘기는 인자 순서) */
const fmt = (column, value, item = {}) => column.formatter(0, 0, value, column, item, null);

describe('buildColumns - 기본 변환', () => {
  it('field를 id로 쓰고 header를 name으로 옮긴다', () => {
    const [col] = buildColumns([{ field: 'empNo', header: '사번' }], { warn: false });

    expect(col.id).toBe('empNo');
    expect(col.field).toBe('empNo');
    expect(col.name).toBe('사번');
  });

  it('type별로 SlickGrid FieldType을 맞춘다 (정렬·필터 비교 로직이 이 값을 본다)', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'text' },
        { field: 'b', type: 'amount' },
        { field: 'c', type: 'date' },
        { field: 'd', type: 'datetime' },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.type)).toEqual(['string', 'number', 'dateIso', 'dateTimeShortIso']);
  });

  it('지원하는 type 목록에 리치 셀 타입이 포함된다', () => {
    expect(SUPPORTED_COLUMN_TYPES).toEqual(expect.arrayContaining(['checkbox', 'button', 'image', 'file', 'link']));
  });

  it('모르는 SlickGrid 옵션도 그대로 통과시킨다 (2층 탈출구)', () => {
    const [col] = buildColumns([{ field: 'a', frozen: true, colspan: 2 }], { warn: false });

    expect(col.frozen).toBe(true);
    expect(col.colspan).toBe(2);
  });

  it('사용자 지정이 type 기본값을 덮는다', () => {
    const [col] = buildColumns([{ field: 'a', type: 'text', sortable: false, cssClass: 'mine' }], { warn: false });

    expect(col.sortable).toBe(false);
    expect(col.cssClass).toBe('mine');
  });

  it('field 없이 id만 있는 컬럼(액션 버튼용)을 버리지 않는다', () => {
    const cols = buildColumns([{ id: 'actions', header: '관리' }], { warn: false });

    expect(cols).toHaveLength(1);
    expect(cols[0].id).toBe('actions');
  });

  it('입력 객체를 변경하지 않는다 (reactive props 보호)', () => {
    const original = { field: 'a', type: 'amount', unit: '원', buttonText: 'B' };
    buildColumns([original], { warn: false });

    expect(original.unit).toBe('원');
    expect(original.buttonText).toBe('B');
  });
});

describe('buildColumns - 정렬', () => {
  it('셀 정렬은 type 기본값을 따른다 (문자=좌, 숫자=우, 날짜=중앙)', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'text' },
        { field: 'b', type: 'amount' },
        { field: 'c', type: 'date' },
      ],
      { warn: false },
    );

    expect(cols[0].cssClass).toContain('sg-align-left');
    expect(cols[1].cssClass).toContain('sg-align-right');
    expect(cols[2].cssClass).toContain('sg-align-center');
  });

  it('컬럼명 정렬은 셀 정렬과 독립이며 기본이 center다', () => {
    const [col] = buildColumns([{ field: 'salary', type: 'amount' }], { warn: false });

    expect(col.cssClass).toContain('sg-align-right');
    expect(col.headerCssClass).toBe('sg-head-center');
  });

  it('컬럼별 headerAlign이 그리드 기본값을 덮는다', () => {
    const cols = buildColumns([{ field: 'a' }, { field: 'b', headerAlign: 'left' }], { warn: false, headerAlign: 'right' });

    expect(cols[0].headerCssClass).toBe('sg-head-right');
    expect(cols[1].headerCssClass).toBe('sg-head-left');
  });
});

describe('buildColumns - 말줄임', () => {
  it('기본으로 말줄임이 켜진다', () => {
    const [col] = buildColumns([{ field: 'a' }], { warn: false });
    expect(col.cssClass).toContain('sg-ellipsis');
  });

  it('컬럼 설정이 그리드 기본값보다 우선한다', () => {
    const off = buildColumns([{ field: 'a', ellipsis: false }], { warn: false, ellipsis: true });
    const on = buildColumns([{ field: 'a', ellipsis: true }], { warn: false, ellipsis: false });

    expect(off[0].cssClass).not.toContain('sg-ellipsis');
    expect(on[0].cssClass).toContain('sg-ellipsis');
  });
});

describe('숫자 포맷 - 단위 / 접두사 / 축약', () => {
  it('amount는 3자리 콤마와 원 단위를 붙인다', () => {
    const [col] = buildColumns([{ field: 'a', type: 'amount' }], { warn: false });
    expect(fmt(col, 3000000)).toBe('3,000,000 원');
  });

  it('unit / prefix / scale을 적용한다', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'number', unit: '개' },
        { field: 'b', type: 'number', unit: '천원', scale: 1000 },
        { field: 'c', type: 'number', prefix: '$' },
        { field: 'd', type: 'decimal', unit: '%' },
      ],
      { warn: false },
    );

    expect(fmt(cols[0], 1234)).toBe('1,234 개');
    expect(fmt(cols[1], 1234000)).toBe('1,234 천원');
    expect(fmt(cols[2], 5000)).toBe('$5,000');
    expect(fmt(cols[3], 12.345)).toBe('12.35 %');
  });

  it('축약키(unit 등)가 params로 옮겨지고 컬럼 최상위에는 남지 않는다', () => {
    const [col] = buildColumns([{ field: 'a', type: 'number', unit: '개' }], { warn: false });

    expect(col.params.unit).toBe('개');
    expect(col.unit).toBeUndefined();
  });

  it('사용자 params를 줘도 type 기본 params가 유지된다 (과거 Object.assign 버그)', () => {
    const [col] = buildColumns([{ field: 'a', type: 'amount', params: { numberSuffix: ' USD' } }], { warn: false });

    expect(col.params.numberSuffix).toBe(' USD');
    expect(col.params.unit).toBe('원');
  });

  it('빈 값은 빈 문자열, 숫자가 아니면 원본을 그대로 보여준다', () => {
    const [col] = buildColumns([{ field: 'a', type: 'amount' }], { warn: false });

    expect(fmt(col, null)).toBe('');
    expect(fmt(col, '')).toBe('');
    expect(fmt(col, 'abc')).toBe('abc');
  });
});

describe('code / yn 타입', () => {
  const CODES = [
    { value: 'D1', label: '개발팀' },
    { value: 'D2', label: '기획팀' },
  ];

  it('code는 params.collection으로 코드값을 명칭으로 바꾼다', () => {
    const [col] = buildColumns([{ field: 'deptCd', type: 'code', codes: CODES }], { warn: false });

    expect(col.params.collection).toEqual(CODES);
    expect(fmt(col, 'D1')).toBe('개발팀');
  });

  it('yn은 Y를 체크로 표시한다', () => {
    const [col] = buildColumns([{ field: 'useYn', type: 'yn' }], { warn: false });

    expect(fmt(col, 'Y')).toBe('✔');
    expect(fmt(col, 'N')).toBe('');
  });

  it('yn 편집 에디터는 checkbox가 아니어야 한다 (boolean 저장으로 Y/N 문자열이 깨짐)', () => {
    const [col] = buildColumns([{ field: 'useYn', type: 'yn', editable: true, filter: true }], { warn: false });

    // 편집 코드셋에는 빈 값이 없고, 필터 코드셋에는 "전체"용 빈 값이 있다
    expect(col.editor.collection).toHaveLength(2);
    expect(col.editor.collection.some((c) => c.value === '')).toBe(false);
    expect(col.filter.collection).toHaveLength(3);
    expect(col.filter.collection.some((c) => c.value === '')).toBe(true);
  });
});

describe('필터', () => {
  it('filter: true 면 type에 맞는 필터가 붙는다', () => {
    const [col] = buildColumns([{ field: 'a', type: 'text', filter: true }], { warn: false });

    expect(col.filterable).toBe(true);
    expect(col.filter.model).toBeTruthy();
  });

  it('filter에 객체를 주면 원본 필터 정의로 취급한다 (탈출구)', () => {
    const [col] = buildColumns([{ field: 'a', filter: { operator: 'EQ' } }], { warn: false });

    expect(col.filterable).toBe(true);
    expect(col.filter.operator).toBe('EQ');
  });

  it('forceFilterable이면 filter를 안 준 컬럼도 필터 대상이 된다 (그리드 밖 입력창 필터용)', () => {
    const [col] = buildColumns([{ field: 'a', type: 'text' }], { warn: false, forceFilterable: true });

    // FilterService.updateFilters()는 filterable 컬럼이 하나도 없으면 예외를 던진다
    expect(col.filterable).toBe(true);
  });
});

describe('유효성 검증 (required / validator)', () => {
  const validatorOf = (col) => col.editor.validator;

  it('required는 한글 메시지를 낸다 (라이브러리 기본은 영문 정적 상수)', () => {
    const [col] = buildColumns([{ field: 'name', header: '이름', type: 'text', editable: true, required: true }], { warn: false });
    const result = validatorOf(col)('');

    expect(result.valid).toBe(false);
    expect(result.msg).toContain('필수');
    expect(result.msg).toContain('이름');
  });

  it('공백만 입력해도 필수 위반이다', () => {
    const [col] = buildColumns([{ field: 'name', header: '이름', editable: true, required: true }], { warn: false });
    expect(validatorOf(col)('   ').valid).toBe(false);
  });

  it('requiredMessage로 문구를 지정할 수 있다', () => {
    const [col] = buildColumns([{ field: 'a', editable: true, required: true, requiredMessage: '코드를 입력하세요' }], { warn: false });
    expect(validatorOf(col)(null).msg).toBe('코드를 입력하세요');
  });

  it('validator는 true / 문자열 / {valid,msg} 반환을 모두 허용한다', () => {
    const cols = buildColumns(
      [
        { field: 'a', editable: true, validator: () => true },
        { field: 'b', editable: true, validator: () => '오류입니다' },
        { field: 'c', editable: true, validator: () => false },
        { field: 'd', editable: true, validator: () => ({ valid: false, msg: '원본형식' }) },
      ],
      { warn: false },
    );

    expect(validatorOf(cols[0])('x').valid).toBe(true);
    expect(validatorOf(cols[1])('x')).toEqual({ valid: false, msg: '오류입니다' });
    expect(validatorOf(cols[2])('x').valid).toBe(false);
    expect(validatorOf(cols[3])('x').msg).toBe('원본형식');
  });

  it('required가 validator보다 먼저 검사된다', () => {
    const [col] = buildColumns(
      [{ field: 'sal', header: '급여', editable: true, required: true, validator: (v) => (v > 0 ? true : '0보다 커야 합니다') }],
      { warn: false },
    );

    expect(validatorOf(col)('').msg).toContain('필수');
    expect(validatorOf(col)(-1).msg).toBe('0보다 커야 합니다');
    expect(validatorOf(col)(100).valid).toBe(true);
  });

  it('editor.required 는 사용하지 않는다 (영문 메시지 회피)', () => {
    const [col] = buildColumns([{ field: 'a', editable: true, required: true }], { warn: false });
    expect(col.editor.required).toBeUndefined();
  });
});

describe('리치 셀 (버튼 / 체크박스 / 이미지 / 첨부 / 링크)', () => {
  it('버튼은 HTMLElement를 반환하고 data-sg-action을 심는다', () => {
    const [col] = buildColumns([{ id: 'edit', type: 'button', buttonText: '수정', action: 'edit' }], { warn: false });
    const el = fmt(col, null);

    expect(el.tagName).toBe('BUTTON');
    expect(el.textContent).toBe('수정');
    expect(el.dataset.sgAction).toBe('edit');
  });

  it('버튼 컬럼은 정렬 대상이 아니고 엑셀에서 제외된다', () => {
    const [col] = buildColumns([{ id: 'edit', type: 'button' }], { warn: false });

    expect(col.sortable).toBe(false);
    expect(col.excludeFromExport).toBe(true);
  });

  it('buttonDisabled / buttonHidden으로 행별 제어가 된다', () => {
    const [col] = buildColumns([{ id: 'del', type: 'button', buttonDisabled: (r) => r.locked, buttonHidden: (r) => r.gone }], { warn: false });

    expect(fmt(col, null, { locked: true }).disabled).toBe(true);
    expect(fmt(col, null, { gone: true })).toBe('');
  });

  it('체크박스는 data-sg-toggle에 필드명을 심는다', () => {
    const [col] = buildColumns([{ field: 'approveYn', type: 'checkbox', checkedValue: 'Y' }], { warn: false });
    const el = fmt(col, 'Y');

    expect(el.type).toBe('checkbox');
    expect(el.checked).toBe(true);
    expect(el.dataset.sgToggle).toBe('approveYn');
  });

  it('이미지는 imageHeight를 반영한다', () => {
    const [col] = buildColumns([{ field: 'photo', type: 'image', imageHeight: 30 }], { warn: false });
    const el = fmt(col, 'https://x.test/a.png');

    expect(el.tagName).toBe('IMG');
    expect(el.style.height).toBe('30px');
  });

  it('첨부파일은 { name, url } 객체와 URL 문자열을 모두 받는다', () => {
    const [col] = buildColumns([{ field: 'f', type: 'file' }], { warn: false });

    expect(fmt(col, { name: '계약서.pdf', url: '/files/1' }).download).toBe('계약서.pdf');
    expect(fmt(col, '/files/a.pdf').tagName).toBe('A');
  });

  it('링크는 새 탭으로 열고 noopener를 붙인다', () => {
    const [col] = buildColumns([{ field: 'site', type: 'link' }], { warn: false });
    const el = fmt(col, 'https://x.test');

    expect(el.target).toBe('_blank');
    expect(el.rel).toBe('noopener noreferrer');
  });
});

describe('URL 보안 (safeUrl)', () => {
  it('위험한 스킴을 차단한다', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('vbscript:x')).toBe('');
    expect(safeUrl('data:text/html,<b>')).toBe('');
  });

  it('http(s) / 상대경로 / data:image / mailto는 허용한다', () => {
    expect(safeUrl('https://a.test/x')).toBe('https://a.test/x');
    expect(safeUrl('/files/1.pdf')).toBe('/files/1.pdf');
    expect(safeUrl('data:image/png;base64,AAA')).not.toBe('');
    expect(safeUrl('mailto:a@b.c')).not.toBe('');
  });

  it('위험한 URL이면 이미지·링크를 렌더하지 않는다', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'image' },
        { field: 'b', type: 'link' },
      ],
      { warn: false },
    );

    expect(fmt(cols[0], 'javascript:alert(1)')).toBe('');
    expect(fmt(cols[1], 'javascript:alert(1)')).toBe('');
  });
});

describe('행번호 컬럼', () => {
  it('화면 순서대로 1부터 매긴다', () => {
    const col = createRowNumberColumn();

    expect(col.formatter(0)).toBe('1');
    expect(col.formatter(4)).toBe('5');
  });

  /*
   * 페이지를 넘겨도 번호가 이어져야 한다.
   * 포맷터의 row 인자는 현재 페이지 안의 순번이라 앞 페이지 건수를 더해야 한다.
   * 그 값은 래퍼가 paginationService.dataFrom - 1 로 넘겨준다.
   */
  it('getOffset을 주면 페이지를 넘겨도 번호가 이어진다', () => {
    // 20건씩 3페이지 -> 3페이지의 첫 행은 41
    const col = createRowNumberColumn({ getOffset: () => 40 });

    expect(col.formatter(0)).toBe('41');
    expect(col.formatter(19)).toBe('60');
  });

  it('getOffset이 없으면 예전처럼 1부터 매긴다', () => {
    expect(createRowNumberColumn().formatter(0)).toBe('1');
  });

  it('getOffset이 이상한 값을 돌려줘도 번호는 그려진다', () => {
    for (const bad of [undefined, null, NaN, -5, 'abc']) {
      expect(createRowNumberColumn({ getOffset: () => bad }).formatter(0)).toBe('1');
    }
  });

  it('getOffset이 소수를 돌려주면 내림한다', () => {
    expect(createRowNumberColumn({ getOffset: () => 20.7 }).formatter(0)).toBe('21');
  });

  it('엑셀로 내보낼 때도 화면과 같은 번호가 나가도록 포맷터를 쓴다', () => {
    expect(createRowNumberColumn().exportWithFormatter).toBe(true);
  });

  it('정렬 불가 + 컬럼 선택기에서 숨길 수 없다', () => {
    const col = createRowNumberColumn();

    expect(col.sortable).toBe(false);
    expect(col.excludeFromColumnPicker).toBe(true);
  });

  it('헤더명과 너비를 지정할 수 있다', () => {
    const col = createRowNumberColumn({ header: '순번', width: 50 });

    expect(col.name).toBe('순번');
    expect(col.width).toBe(50);
  });
});

describe('그룹핑 기본 정의', () => {
  it('groupable이면 컬럼에 grouping을 자동 생성한다 (없으면 플러그인이 컬럼을 무시함)', () => {
    const [col] = buildColumns([{ field: 'deptCd', header: '부서', type: 'code', codes: [{ value: 'D1', label: '개발팀' }] }], {
      warn: false,
      groupable: true,
    });

    expect(col.grouping).toBeTruthy();
    expect(col.grouping.getter).toBe('deptCd');
  });

  it('그룹 제목에 코드값이 아니라 명칭과 건수를 보여준다', () => {
    const [col] = buildColumns([{ field: 'deptCd', header: '부서', type: 'code', codes: [{ value: 'D1', label: '개발팀' }] }], {
      warn: false,
      groupable: true,
    });

    expect(col.grouping.formatter({ value: 'D1', count: 30 })).toBe('부서: 개발팀 (30건)');
  });

  it('사용자가 직접 준 grouping은 덮어쓰지 않는다', () => {
    const custom = { getter: 'x', aggregators: [] };
    const [col] = buildColumns([{ field: 'a', grouping: custom }], { warn: false, groupable: true });

    expect(col.grouping).toBe(custom);
  });

  it('데이터 필드가 없는 버튼·이미지 컬럼에는 grouping을 넣지 않는다', () => {
    const cols = buildColumns([{ id: 'edit', type: 'button' }, { field: 'p', type: 'image' }], { warn: false, groupable: true });

    expect(cols[0].grouping).toBeUndefined();
    expect(cols[1].grouping).toBeUndefined();
  });
});

describe('합계 계산 (calcSummary)', () => {
  const items = [
    { salary: 1000, budget: 1234000, rate: 10, name: 'a', m: 5 },
    { salary: 2000, budget: 2000000, rate: 20, name: '', m: 9 },
    { salary: 3000, budget: 3000000, rate: 30, name: 'c', m: 1 },
  ];
  const colOf = (def) => buildColumns([def], { warn: false })[0];

  it('sum은 본문 셀과 같은 표기(단위 포함)를 쓴다', () => {
    expect(calcSummary(items, colOf({ field: 'salary', type: 'amount', summary: 'sum' }))).toBe('6,000 원');
  });

  it('scale(천원 축약)이 합계에도 적용된다', () => {
    expect(calcSummary(items, colOf({ field: 'budget', type: 'number', unit: '천원', scale: 1000, summary: 'sum' }))).toBe('6,234 천원');
  });

  it('avg는 소수 1자리 이상을 표시한다', () => {
    expect(calcSummary(items, colOf({ field: 'm', type: 'number', summary: 'avg' }))).toBe('5');
    expect(calcSummary(items, colOf({ field: 'rate', type: 'decimal', unit: '%', summary: 'avg' }))).toBe('20 %');
  });

  it('count는 빈 값을 제외한 건수다', () => {
    expect(calcSummary(items, colOf({ field: 'name', type: 'text', summary: 'count' }))).toBe('2건');
  });

  it('min / max', () => {
    expect(calcSummary(items, colOf({ field: 'm', type: 'number', summary: 'min' }))).toBe('1');
    expect(calcSummary(items, colOf({ field: 'm', type: 'number', summary: 'max' }))).toBe('9');
  });

  it('summary를 함수로 줄 수 있다', () => {
    expect(calcSummary(items, colOf({ field: 'z', summary: (rows) => `${rows.length}행` }))).toBe('3행');
  });

  it('빈 데이터나 숫자가 없으면 빈 문자열', () => {
    const col = colOf({ field: 'salary', type: 'amount', summary: 'sum' });

    expect(calcSummary([], col)).toBe('');
    expect(calcSummary([{ salary: 'abc' }], col)).toBe('');
  });

  it('summary가 없는 컬럼은 빈 문자열', () => {
    expect(calcSummary(items, colOf({ field: 'salary', type: 'amount' }))).toBe('');
  });
});

describe('유효성 경고 (validateColumns)', () => {
  it('field/id 누락, 미지원 type, code의 codes 누락을 잡는다', () => {
    const warnings = validateColumns([{ header: '없음' }, { field: 'a', type: '없는타입' }, { field: 'b', type: 'code' }]);

    expect(warnings.some((m) => m.includes('field 또는 id'))).toBe(true);
    expect(warnings.some((m) => m.includes('없는타입'))).toBe(true);
    expect(warnings.some((m) => m.includes('codes'))).toBe(true);
  });

  it('id 중복을 잡는다 (중복되면 컬럼이 제대로 렌더되지 않는다)', () => {
    const warnings = validateColumns([{ field: 'a' }, { field: 'a' }]);
    expect(warnings.some((m) => m.includes('중복'))).toBe(true);
  });

  it('align / headerAlign / scale / summary 오타를 잡는다', () => {
    const warnings = validateColumns([
      { field: 'a', align: 'middle' },
      { field: 'b', headerAlign: 'top' },
      { field: 'c', scale: 0 },
      { field: 'd', summary: '없는집계' },
    ]);

    expect(warnings.some((m) => m.includes('align은'))).toBe(true);
    expect(warnings.some((m) => m.includes('headerAlign은'))).toBe(true);
    expect(warnings.some((m) => m.includes('scale은'))).toBe(true);
    expect(warnings.some((m) => m.includes('summary'))).toBe(true);
  });

  it('required/validator를 editable 없이 쓰면 경고한다', () => {
    const warnings = validateColumns([{ field: 'a', required: true }]);
    expect(warnings.some((m) => m.includes('editable'))).toBe(true);
  });

  it('배열이 아니면 경고하고 빈 배열을 돌려준다', () => {
    expect(validateColumns('x').length).toBeGreaterThan(0);
    expect(buildColumns(null, { warn: false })).toEqual([]);
  });
});
