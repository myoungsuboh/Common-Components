import { describe, it, expect, vi } from 'vitest';

import {
  buildColumns,
  validateColumns,
  buildSummaryItems,
  groupIntoBands,
  flattenColumns,
  formatNumberText,
  safeUrl,
  SUPPORTED_COLUMN_TYPES,
  SUMMARY_TYPES,
} from '@/components/DevExtremeGrid/composables/useGridColumns';

/* ***************************************************************************************************************
축약 컬럼 정의 -> DevExtreme Column 변환 테스트

여기 있는 케이스 대부분은 실제로 발생한 버그에서 나왔다. 지우지 말 것.
DevExtreme 은 잘못된 옵션 이름을 줘도 오류 없이 조용히 무시하기 때문에
"이 키가 정말 이 이름으로 들어갔는지"를 테스트로 못 박아 둔다.
****************************************************************************************************************** */

/** customizeText 호출 헬퍼 (DevExtreme 이 넘기는 인자 모양) */
const text = (column, value) => column.customizeText({ value });

describe('buildColumns - 기본 변환', () => {
  it('field를 dataField로, header를 caption으로 옮긴다', () => {
    const [col] = buildColumns([{ field: 'empNo', header: '사번' }], { warn: false });

    expect(col.dataField).toBe('empNo');
    expect(col.caption).toBe('사번');
  });

  it('type별로 DevExtreme dataType을 맞춘다 (정렬·필터 UI가 이 값으로 결정된다)', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'text' },
        { field: 'b', type: 'amount' },
        { field: 'c', type: 'date' },
        { field: 'd', type: 'datetime' },
        { field: 'e', type: 'checkbox' },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.dataType)).toEqual(['string', 'number', 'date', 'datetime', 'boolean']);
  });

  it('type 기본 정렬을 셀 alignment로 넣고, align으로 덮을 수 있다', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'text' },
        { field: 'b', type: 'amount' },
        { field: 'c', type: 'amount', align: 'left' },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.alignment)).toEqual(['left', 'right', 'left']);
  });

  it('지원하는 type 목록에 리치 셀 타입이 포함된다', () => {
    expect(SUPPORTED_COLUMN_TYPES).toEqual(expect.arrayContaining(['checkbox', 'button', 'image', 'file', 'link']));
  });

  it('모르는 type은 text로 폴백한다', () => {
    const [col] = buildColumns([{ field: 'a', type: '없는타입' }], { warn: false });

    expect(col.dataType).toBe('string');
    expect(col.alignment).toBe('left');
  });

  it('field 없이 name만 있는 컬럼(버튼 전용)을 버리지 않는다', () => {
    const cols = buildColumns([{ name: 'edit', header: '수정', type: 'button' }], { warn: false });

    expect(cols).toHaveLength(1);
    expect(cols[0].caption).toBe('수정');
  });

  it('모르는 DevExtreme 옵션도 그대로 통과시킨다 (2층 탈출구)', () => {
    const [col] = buildColumns([{ field: 'a', fixed: true, editorOptions: { maxLength: 5 } }], { warn: false });

    expect(col.fixed).toBe(true);
    expect(col.editorOptions).toEqual({ maxLength: 5 });
  });

  it('편집은 editable을 준 컬럼만 허용한다', () => {
    const cols = buildColumns(
      [
        { field: 'a' },
        { field: 'b', editable: true },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.allowEditing)).toEqual([false, true]);
  });

  it('UI 전용 컬럼(button/image)은 정렬·필터 대상에서 뺀다', () => {
    const cols = buildColumns(
      [
        { name: 'btn', type: 'button' },
        { field: 'photo', type: 'image' },
        { field: 'a', type: 'text' },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.allowSorting)).toEqual([false, false, true]);
    expect(cols.map((c) => c.allowFiltering)).toEqual([false, false, true]);
  });

  it('헤더 값목록 필터는 filter를 준 컬럼만 켠다', () => {
    const cols = buildColumns(
      [
        { field: 'a' },
        { field: 'b', filter: true },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.allowHeaderFiltering)).toEqual([false, true]);
  });
});

/* ---------------------------------------------------------------------------------------------------------------
컬럼명 정렬

실제 버그: headerAlign prop이 toDxColumn까지 전달되기만 하고 쓰이지 않아
컬럼명이 셀 정렬을 그대로 따라갔다. DevExtreme 이 헤더 td에 style.textAlign을 인라인으로 박기 때문에
CSS 클래스만으로는 이길 수 없어서, 래퍼가 cssClass에 dxg-h-* 를 심고 theme CSS가 !important로 덮는다.
--------------------------------------------------------------------------------------------------------------- */
describe('buildColumns - 컬럼명 정렬 (headerAlign)', () => {
  it('기본값은 중앙이다 (사용자 요구사항: 컬럼명 중앙 정렬 필수)', () => {
    const [col] = buildColumns([{ field: 'a', type: 'amount' }], { warn: false });

    expect(col.cssClass).toContain('dxg-h-center');
  });

  it('셀 정렬과 독립이다 — 셀은 우측, 컬럼명은 중앙', () => {
    const [col] = buildColumns([{ field: 'salary', type: 'amount' }], { warn: false });

    expect(col.alignment).toBe('right');
    expect(col.cssClass).toContain('dxg-h-center');
  });

  it('컬럼별 headerAlign이 그리드 기본값을 덮는다', () => {
    const cols = buildColumns(
      [
        { field: 'a', headerAlign: 'left' },
        { field: 'b' },
        { field: 'c', headerAlign: 'right' },
      ],
      { warn: false, headerAlign: 'center' },
    );

    expect(cols[0].cssClass).toContain('dxg-h-left');
    expect(cols[1].cssClass).toContain('dxg-h-center');
    expect(cols[2].cssClass).toContain('dxg-h-right');
  });

  it('그리드 레벨 headerAlign이 기본값이 된다', () => {
    const [col] = buildColumns([{ field: 'a' }], { warn: false, headerAlign: 'left' });

    expect(col.cssClass).toContain('dxg-h-left');
  });

  it('잘못된 headerAlign은 무시하고 중앙으로 둔다', () => {
    const [col] = buildColumns([{ field: 'a', headerAlign: '가운데' }], { warn: false });

    expect(col.cssClass).toContain('dxg-h-center');
  });

  it('축약 키 headerAlign이 DevExtreme Column에 남지 않는다', () => {
    const [col] = buildColumns([{ field: 'a', headerAlign: 'left' }], { warn: false });

    expect(col.headerAlign).toBeUndefined();
  });
});

/* ---------------------------------------------------------------------------------------------------------------
cssClass 병합

실제 버그: 사용자가 cssClass를 직접 주면 통과 루프가 우리 클래스를 통째로 덮어써서
말줄임(dxg-no-ellipsis)과 헤더 정렬이 조용히 사라졌다.
--------------------------------------------------------------------------------------------------------------- */
describe('buildColumns - cssClass 병합', () => {
  it('사용자 cssClass를 살리면서 우리 클래스를 덧붙인다', () => {
    const [col] = buildColumns([{ field: 'a', cssClass: 'my-cell' }], { warn: false });

    expect(col.cssClass).toContain('my-cell');
    expect(col.cssClass).toContain('dxg-h-center');
  });

  it('ellipsis: false면 dxg-no-ellipsis를 붙인다', () => {
    const [col] = buildColumns([{ field: 'a', ellipsis: false }], { warn: false });

    expect(col.cssClass).toContain('dxg-no-ellipsis');
  });

  it('사용자 cssClass가 있어도 말줄임 해제 클래스가 사라지지 않는다', () => {
    const [col] = buildColumns([{ field: 'a', ellipsis: false, cssClass: 'my-cell' }], { warn: false });

    expect(col.cssClass).toContain('my-cell');
    expect(col.cssClass).toContain('dxg-no-ellipsis');
    expect(col.cssClass).toContain('dxg-h-center');
  });

  it('그리드 기본 ellipsis: false를 컬럼에서 되돌릴 수 있다', () => {
    const [col] = buildColumns([{ field: 'a', ellipsis: true }], { warn: false, ellipsis: false });

    expect(col.cssClass).not.toContain('dxg-no-ellipsis');
  });
});

/* ---------------------------------------------------------------------------------------------------------------
숫자 표기
--------------------------------------------------------------------------------------------------------------- */
describe('formatNumberText - 숫자 표기', () => {
  it('천단위 구분기호를 넣는다', () => {
    expect(formatNumberText(3000000)).toBe('3,000,000');
  });

  it('단위를 뒤에 붙인다', () => {
    expect(formatNumberText(3000000, { unit: '원' })).toBe('3,000,000 원');
  });

  it('scale로 나눈 뒤 단위를 붙인다 (1,234,000 -> 1,234 천원)', () => {
    expect(formatNumberText(1234000, { unit: '천원', scale: 1000 })).toBe('1,234 천원');
  });

  it('접두사를 앞에 붙인다', () => {
    expect(formatNumberText(1500, { prefix: '$' })).toBe('$1,500');
  });

  it('소수 자리를 제한한다', () => {
    expect(formatNumberText(1.23456, { maxDecimal: 2 })).toBe('1.23');
  });

  it('빈 값은 빈 문자열로 둔다 (0을 빈칸으로 만들지 않는다)', () => {
    expect(formatNumberText(null)).toBe('');
    expect(formatNumberText(undefined)).toBe('');
    expect(formatNumberText('')).toBe('');
    expect(formatNumberText(0)).toBe('0');
  });

  it('숫자로 바꿀 수 없는 값은 원본을 그대로 보여준다', () => {
    expect(formatNumberText('미정')).toBe('미정');
  });

  it('amount 타입은 단위 원이 기본이고 unit으로 바꿀 수 있다', () => {
    const [won] = buildColumns([{ field: 'a', type: 'amount' }], { warn: false });
    const [dollar] = buildColumns([{ field: 'b', type: 'amount', unit: 'USD' }], { warn: false });

    expect(text(won, 5000)).toBe('5,000 원');
    expect(text(dollar, 5000)).toBe('5,000 USD');
  });

  it('decimal 타입은 소수 2자리가 기본이다', () => {
    const [col] = buildColumns([{ field: 'a', type: 'decimal' }], { warn: false });

    expect(text(col, 1.005)).toBe('1.01');
  });
});

/* ---------------------------------------------------------------------------------------------------------------
코드값 / Y·N
--------------------------------------------------------------------------------------------------------------- */
describe('buildColumns - 코드값과 Y/N', () => {
  const DEPT = [
    { value: 'D1', label: '개발팀' },
    { value: 'D2', label: '인사팀' },
  ];

  it('code 타입은 lookup으로 변환한다 (DevExtreme의 코드 표시·필터 방식)', () => {
    const [col] = buildColumns([{ field: 'deptCd', type: 'code', codes: DEPT }], { warn: false });

    expect(col.lookup).toEqual({ dataSource: DEPT, valueExpr: 'value', displayExpr: 'label' });
  });

  it('yn 타입은 Y/N 목록을 lookup으로 주고 표시는 체크 표시로 한다', () => {
    const [col] = buildColumns([{ field: 'useYn', type: 'yn' }], { warn: false });

    // 편집 목록에 빈 값이 있으면 빈 문자열이 저장되어 'Y'/'N'이 깨진다
    expect(col.lookup.dataSource).toEqual([
      { value: 'Y', label: 'Y' },
      { value: 'N', label: 'N' },
    ]);
    expect(text(col, 'Y')).toBe('✔');
    expect(text(col, 'N')).toBe('');
    expect(text(col, null)).toBe('');
  });

  it('yn 타입은 boolean true도 체크로 본다', () => {
    const [col] = buildColumns([{ field: 'useYn', type: 'yn' }], { warn: false });

    expect(text(col, true)).toBe('✔');
    expect(text(col, false)).toBe('');
  });
});

/* ---------------------------------------------------------------------------------------------------------------
리치 셀
--------------------------------------------------------------------------------------------------------------- */
describe('buildColumns - 리치 셀', () => {
  it('리치 셀 타입은 cellTemplate 이름과 옵션을 실어 보낸다', () => {
    const cols = buildColumns(
      [
        { name: 'edit', type: 'button', buttonText: '수정', action: 'edit' },
        { field: 'photo', type: 'image', imageHeight: 24 },
        { field: 'attach', type: 'file' },
        { field: 'url', type: 'link' },
        { field: 'ok', type: 'checkbox', checkedValue: 'Y', uncheckedValue: 'N' },
      ],
      { warn: false },
    );

    expect(cols.map((c) => c.cellTemplate)).toEqual(['sgCell-button', 'sgCell-image', 'sgCell-file', 'sgCell-link', 'sgCell-checkbox']);
    expect(cols[0].sgCellOptions.action).toBe('edit');
    expect(cols[0].sgCellOptions.buttonText).toBe('수정');
    expect(cols[1].sgCellOptions.imageHeight).toBe(24);
    expect(cols[4].sgCellOptions.checkedValue).toBe('Y');
  });

  it('action을 생략하면 field(또는 header)를 action으로 쓴다', () => {
    const [byField] = buildColumns([{ field: 'del', type: 'button' }], { warn: false });
    const [byHeader] = buildColumns([{ name: 'x', header: '삭제', type: 'button' }], { warn: false });

    expect(byField.sgCellOptions.action).toBe('del');
    expect(byHeader.sgCellOptions.action).toBe('삭제');
  });
});

/* ---------------------------------------------------------------------------------------------------------------
검증 규칙
--------------------------------------------------------------------------------------------------------------- */
describe('buildColumns - 검증 규칙', () => {
  it('required는 한글 메시지를 가진 required 규칙이 된다', () => {
    const [col] = buildColumns([{ field: 'name', header: '이름', editable: true, required: true }], { warn: false });

    expect(col.validationRules).toEqual([{ type: 'required', message: '이름은(는) 필수 입력 항목입니다.' }]);
  });

  it('requiredMessage로 문구를 바꿀 수 있다', () => {
    const [col] = buildColumns([{ field: 'name', header: '이름', editable: true, required: true, requiredMessage: '이름 쓰세요' }], { warn: false });

    expect(col.validationRules[0].message).toBe('이름 쓰세요');
  });

  it('pattern은 pattern 규칙이 된다', () => {
    const [col] = buildColumns([{ field: 'empNo', header: '사번', editable: true, pattern: /^E\d{5}$/ }], { warn: false });

    const rule = col.validationRules.find((r) => r.type === 'pattern');
    expect(rule.pattern).toEqual(/^E\d{5}$/);
    expect(rule.message).toBe('사번 형식이 올바르지 않습니다.');
  });

  it('validator는 custom 규칙이 되고 true/false/문자열/객체를 모두 판정한다', () => {
    const [col] = buildColumns([{ field: 'a', header: '값', editable: true, validator: (v) => v }], { warn: false });

    const rule = col.validationRules.find((r) => r.type === 'custom');

    expect(rule.validationCallback({ value: true, data: {} })).toBe(true);
    expect(rule.validationCallback({ value: false, data: {} })).toBe(false);
    // 문자열 반환은 "실패"로만 해석한다 (DevExtreme custom 규칙은 동적 메시지를 지원하지 않는다)
    expect(rule.validationCallback({ value: '틀렸습니다', data: {} })).toBe(false);
    expect(rule.validationCallback({ value: { valid: false }, data: {} })).toBe(false);
    expect(rule.validationCallback({ value: { valid: true }, data: {} })).toBe(true);
  });

  it('validator에 undefined/null 반환은 통과로 본다', () => {
    const [col] = buildColumns([{ field: 'a', editable: true, validator: () => undefined }], { warn: false });

    expect(col.validationRules[0].validationCallback({ value: 1, data: {} })).toBe(true);
  });

  it('validator에 행 데이터가 함께 넘어간다 (다른 컬럼과 비교하는 검증)', () => {
    const spy = vi.fn(() => true);
    const [col] = buildColumns([{ field: 'a', editable: true, validator: spy }], { warn: false });

    col.validationRules[0].validationCallback({ value: 5, data: { b: 3 } });

    expect(spy).toHaveBeenCalledWith(5, { b: 3 });
  });

  it('검증이 없으면 validationRules를 만들지 않는다', () => {
    const [col] = buildColumns([{ field: 'a' }], { warn: false });

    expect(col.validationRules).toBeUndefined();
  });
});

/* ---------------------------------------------------------------------------------------------------------------
2단 헤더 (밴드)

실제 버그: DevExtreme의 ownerBand는 문자열이 아니라 "밴드 컬럼의 배열 인덱스"다.
문자열을 넣으면 오류 없이 조용히 무시되므로 중첩 columns 구조로 만든다.
--------------------------------------------------------------------------------------------------------------- */
describe('groupIntoBands - 2단 헤더', () => {
  it('group이 같은 연속 컬럼을 하나의 밴드로 묶는다', () => {
    const cols = buildColumns(
      [
        { field: 'a', header: '사번', group: '기본 정보' },
        { field: 'b', header: '이름', group: '기본 정보' },
        { field: 'c', header: '급여', group: '급여 정보' },
      ],
      { warn: false },
    );

    expect(cols).toHaveLength(2);
    expect(cols[0].caption).toBe('기본 정보');
    expect(cols[0].columns.map((c) => c.caption)).toEqual(['사번', '이름']);
    expect(cols[1].columns.map((c) => c.caption)).toEqual(['급여']);
  });

  it('group이 없는 컬럼은 밴드에 넣지 않고 그대로 둔다', () => {
    const cols = buildColumns(
      [
        { field: 'no', header: 'No' },
        { field: 'a', header: '사번', group: '기본 정보' },
      ],
      { warn: false },
    );

    expect(cols[0].caption).toBe('No');
    expect(cols[0].columns).toBeUndefined();
    expect(cols[1].caption).toBe('기본 정보');
  });

  it('떨어져 있는 같은 group 이름은 별도 밴드가 된다 (컬럼 순서를 임의로 바꾸지 않는다)', () => {
    const cols = buildColumns(
      [
        { field: 'a', group: 'G' },
        { field: 'b' },
        { field: 'c', group: 'G' },
      ],
      { warn: false },
    );

    expect(cols).toHaveLength(3);
    expect(cols[0].sgBandName).toBe('G');
    expect(cols[2].sgBandName).toBe('G');
  });

  it('group을 쓴 컬럼이 하나도 없으면 구조를 바꾸지 않는다', () => {
    const input = [{ dataField: 'a' }, { dataField: 'b' }];

    expect(groupIntoBands(input)).toBe(input);
  });

  it('축약 키 group이 DevExtreme Column에 남지 않는다', () => {
    const cols = buildColumns([{ field: 'a', group: 'G' }], { warn: false });

    expect(cols[0].columns[0].sgGroup).toBeUndefined();
    expect(cols[0].columns[0].group).toBeUndefined();
  });

  it('flattenColumns는 밴드 안쪽 데이터 컬럼만 뽑는다', () => {
    const cols = buildColumns(
      [
        { field: 'no' },
        { field: 'a', group: 'G' },
        { field: 'b', group: 'G' },
      ],
      { warn: false },
    );

    expect(flattenColumns(cols).map((c) => c.dataField)).toEqual(['no', 'a', 'b']);
  });
});

/* ---------------------------------------------------------------------------------------------------------------
합계 행
--------------------------------------------------------------------------------------------------------------- */
describe('buildSummaryItems - 합계 행', () => {
  it('summary를 준 컬럼만 totalItems로 만든다', () => {
    const cols = buildColumns(
      [
        { field: 'a', type: 'amount', summary: 'sum' },
        { field: 'b', type: 'text' },
        { field: 'c', type: 'date', summary: 'count' },
      ],
      { warn: false },
    );

    const items = buildSummaryItems(cols);

    expect(items.map((i) => i.column)).toEqual(['a', 'c']);
    expect(items.map((i) => i.summaryType)).toEqual(['sum', 'count']);
  });

  it('합계 표기를 본문 셀과 똑같이 맞춘다 (본문 "1,234 천원" / 합계 "1234000" 불일치 방지)', () => {
    const cols = buildColumns([{ field: 'a', type: 'number', unit: '천원', scale: 1000, summary: 'sum' }], { warn: false });
    const [item] = buildSummaryItems(cols);

    expect(item.customizeText({ value: 5000000 })).toBe('5,000 천원');
  });

  it('count는 "N건"으로 표기한다', () => {
    const cols = buildColumns([{ field: 'a', type: 'date', summary: 'count' }], { warn: false });
    const [item] = buildSummaryItems(cols);

    expect(item.customizeText({ value: 1234 })).toBe('1,234건');
  });

  it('avg는 소수 1자리 이상을 허용한다 (정수로 잘리면 평균이 의미를 잃는다)', () => {
    const cols = buildColumns([{ field: 'a', type: 'number', summary: 'avg' }], { warn: false });
    const [item] = buildSummaryItems(cols);

    expect(item.customizeText({ value: 10.138 })).toBe('10.1');
  });

  it('summary에 함수를 주면 count로 집계하고 표시만 함수에 맡긴다', () => {
    const cols = buildColumns([{ field: 'a', summary: (v) => `총 ${v}개` }], { warn: false });
    const [item] = buildSummaryItems(cols);

    expect(item.summaryType).toBe('count');
    expect(item.customizeText({ value: 7 })).toBe('총 7개');
  });

  it('밴드(2단 헤더) 안쪽 컬럼도 합계 대상으로 찾는다', () => {
    const cols = buildColumns([{ field: 'a', type: 'amount', group: '급여 정보', summary: 'sum' }], { warn: false });

    expect(buildSummaryItems(cols).map((i) => i.column)).toEqual(['a']);
  });

  it('dataField가 없는 컬럼(버튼)은 합계에서 뺀다', () => {
    const cols = buildColumns([{ name: 'btn', type: 'button', summary: 'count' }], { warn: false });

    expect(buildSummaryItems(cols)).toEqual([]);
  });
});

/* ---------------------------------------------------------------------------------------------------------------
URL 안전 처리
--------------------------------------------------------------------------------------------------------------- */
describe('safeUrl - 허용 프로토콜만 통과', () => {
  it('http/https/상대경로/data 이미지는 통과시킨다', () => {
    expect(safeUrl('https://a.com/x.png')).toBe('https://a.com/x.png');
    expect(safeUrl('http://a.com/x.png')).toBe('http://a.com/x.png');
    expect(safeUrl('/files/a.pdf')).toBe('/files/a.pdf');
    expect(safeUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  });

  it('javascript: 같은 위험한 스킴은 막는다', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('  JavaScript:alert(1)')).toBe('');
    expect(safeUrl('vbscript:msgbox(1)')).toBe('');
  });

  it('빈 값은 빈 문자열로 둔다', () => {
    expect(safeUrl(null)).toBe('');
    expect(safeUrl(undefined)).toBe('');
    expect(safeUrl('')).toBe('');
  });
});

/* ---------------------------------------------------------------------------------------------------------------
컬럼 정의 유효성 경고

순수 JS라 컴파일 타임 체크가 없으므로 개발 중 오타를 콘솔 경고로 잡는다.
--------------------------------------------------------------------------------------------------------------- */
describe('validateColumns - 정의 오류 경고', () => {
  const has = (warnings, keyword) => warnings.some((w) => w.includes(keyword));

  it('배열이 아니면 경고한다', () => {
    expect(validateColumns('아님')).toEqual(['columns는 배열이어야 합니다.']);
  });

  it('식별자가 없으면 경고한다', () => {
    expect(has(validateColumns([{ header: '이름' }]), 'field 또는 name')).toBe(true);
  });

  it('모르는 type을 경고하고 지원 목록을 알려준다', () => {
    const warnings = validateColumns([{ field: 'a', type: '숫자' }]);

    expect(has(warnings, '알 수 없는 type')).toBe(true);
    expect(has(warnings, SUPPORTED_COLUMN_TYPES[0])).toBe(true);
  });

  it('code 타입에 codes가 없으면 경고한다', () => {
    expect(has(validateColumns([{ field: 'a', type: 'code' }]), 'codes')).toBe(true);
  });

  it('codes 항목 모양이 틀리면 경고한다', () => {
    expect(has(validateColumns([{ field: 'a', type: 'code', codes: [{ v: 1 }] }]), '{ value, label }')).toBe(true);
  });

  it('align / headerAlign 오타를 경고한다', () => {
    expect(has(validateColumns([{ field: 'a', align: '왼쪽' }]), 'align은')).toBe(true);
    expect(has(validateColumns([{ field: 'a', headerAlign: '가운데' }]), 'headerAlign은')).toBe(true);
  });

  it('scale이 0 이하이거나 숫자가 아니면 경고한다', () => {
    expect(has(validateColumns([{ field: 'a', scale: 0 }]), 'scale')).toBe(true);
    expect(has(validateColumns([{ field: 'a', scale: '천' }]), 'scale')).toBe(true);
  });

  it('editable 없이 required/validator/pattern을 쓰면 경고한다 (편집 컬럼에서만 동작한다)', () => {
    expect(has(validateColumns([{ field: 'a', required: true }]), 'editable: true')).toBe(true);
  });

  it('validator가 함수가 아니면 경고한다', () => {
    expect(has(validateColumns([{ field: 'a', editable: true, validator: '아님' }]), 'validator 는 함수')).toBe(true);
  });

  it('모르는 summary를 경고하고 지원 목록을 알려준다', () => {
    const warnings = validateColumns([{ field: 'a', summary: '합계' }]);

    expect(has(warnings, 'summary')).toBe(true);
    expect(has(warnings, SUMMARY_TYPES.join(' | '))).toBe(true);
  });

  it('식별자 중복을 경고한다', () => {
    expect(has(validateColumns([{ field: 'a' }, { field: 'a' }]), '중복')).toBe(true);
  });

  it('정상 정의에는 경고가 없다', () => {
    const warnings = validateColumns([
      { field: 'empNo', header: '사번', type: 'text' },
      { field: 'deptCd', header: '부서', type: 'code', codes: [{ value: 'D1', label: '개발팀' }] },
      { field: 'salary', header: '급여', type: 'amount', summary: 'sum', align: 'right', headerAlign: 'center' },
      { field: 'name', header: '이름', editable: true, required: true },
      { name: 'edit', header: '수정', type: 'button' },
    ]);

    expect(warnings).toEqual([]);
  });
});
