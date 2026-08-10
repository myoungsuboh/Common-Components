import { describe, it, expect } from 'vitest';

import { buildGridOptions, deepMerge, BASE_OPTIONS } from '@/components/DevExtremeGrid/composables/useGridOptions';

/* ***************************************************************************************************************
DevExtreme 그리드 옵션 생성 테스트

핵심 규칙: 사용자가 넘긴 options는 "항상" 이긴다.
우선순위  DevExtreme 기본값 < BASE_OPTIONS < 기능 플래그(props) < 사용자 options

DevExtreme 은 모르는 옵션 이름을 줘도 오류 없이 조용히 무시한다.
그래서 "우리가 만든 옵션 이름이 실제 DevExtreme 이름과 같은지"를 여기서 못 박아 둔다.
****************************************************************************************************************** */

describe('deepMerge', () => {
  it('중첩 객체를 병합한다', () => {
    expect(deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 9 } })).toEqual({ a: { x: 1, y: 9 } });
  });

  it('배열은 병합하지 않고 통째로 교체한다 (columns/totalItems가 중복되는 것을 막는다)', () => {
    expect(deepMerge({ a: [1, 2, 3] }, { a: [9] })).toEqual({ a: [9] });
  });

  it('source가 없으면 target을 그대로 돌려준다', () => {
    const target = { a: 1 };

    expect(deepMerge(target, undefined)).toBe(target);
    expect(deepMerge(target, null)).toBe(target);
  });

  it('target이 없으면 source를 그대로 돌려준다', () => {
    const source = { a: 1 };

    expect(deepMerge(undefined, source)).toBe(source);
  });

  it('원본을 변경하지 않는다', () => {
    const target = { a: { x: 1 } };
    const source = { a: { y: 2 } };

    deepMerge(target, source);

    expect(target).toEqual({ a: { x: 1 } });
    expect(source).toEqual({ a: { y: 2 } });
  });

  it('함수·Date·클래스 인스턴스는 병합하지 않고 교체한다', () => {
    const fn = () => 1;
    const date = new Date(0);

    expect(deepMerge({ a: { x: 1 } }, { a: fn }).a).toBe(fn);
    expect(deepMerge({ a: { x: 1 } }, { a: date }).a).toBe(date);
  });
});

describe('buildGridOptions - 기본값', () => {
  it('기능 플래그를 안 주면 BASE_OPTIONS가 그대로 살아 있다', () => {
    const options = buildGridOptions();

    expect(options.showBorders).toBe(BASE_OPTIONS.showBorders);
    expect(options.columnAutoWidth).toBe(true);
    expect(options.allowColumnResizing).toBe(true);
    expect(options.sorting).toEqual({ mode: 'multiple' });
  });

  it('빈 데이터 안내 문구가 한글이다', () => {
    expect(buildGridOptions().noDataText).toBe('조회된 데이터가 없습니다.');
  });

  it('DevExtreme 자체 로딩 패널은 끈다 (우리 오버레이와 겹쳐 보이는 것 방지)', () => {
    expect(buildGridOptions().loadPanel).toEqual({ enabled: false });
  });

  it('DataGrid에 없는 옵션(hoverStateEnabled)을 넣지 않는다 — 행 강조는 CSS로 처리한다', () => {
    expect(buildGridOptions()).not.toHaveProperty('hoverStateEnabled');
  });
});

describe('buildGridOptions - 조회 · 필터', () => {
  it('filterable은 컬럼 필터 행과 헤더 필터를 켠다', () => {
    const options = buildGridOptions({ filterable: true });

    expect(options.filterRow).toEqual({ visible: true, applyFilter: 'auto' });
    expect(options.headerFilter).toEqual({ visible: true });
  });

  it('searchable은 전체 검색창을 켠다', () => {
    const options = buildGridOptions({ searchable: true });

    expect(options.searchPanel.visible).toBe(true);
    expect(options.searchPanel.placeholder).toBe('검색...');
  });

  it('아무것도 안 주면 필터/검색 옵션을 만들지 않는다', () => {
    const options = buildGridOptions();

    expect(options.filterRow).toBeUndefined();
    expect(options.searchPanel).toBeUndefined();
  });
});

describe('buildGridOptions - 선택', () => {
  it('multiSelect에 따라 selection.mode가 바뀐다', () => {
    expect(buildGridOptions({ selectable: true, multiSelect: true }).selection.mode).toBe('multiple');
    expect(buildGridOptions({ selectable: true, multiSelect: false }).selection.mode).toBe('single');
  });

  it('체크박스를 항상 표시한다 (기본값 onClick은 마우스를 올려야 나타나 발견이 어렵다)', () => {
    const options = buildGridOptions({ selectable: true, multiSelect: true, checkboxSelector: true });

    expect(options.selection.showCheckBoxesMode).toBe('always');
  });

  it('checkboxSelector를 끄면 체크박스를 숨긴다', () => {
    expect(buildGridOptions({ selectable: true, checkboxSelector: false }).selection.showCheckBoxesMode).toBe('none');
  });

  it('전체 선택은 현재 페이지가 아니라 전체 데이터를 대상으로 한다', () => {
    expect(buildGridOptions({ selectable: true, multiSelect: true }).selection.selectAllMode).toBe('allPages');
  });

  it('단일 선택일 때는 전체 선택 체크박스를 막는다', () => {
    expect(buildGridOptions({ selectable: true, multiSelect: false }).selection.allowSelectAll).toBe(false);
  });
});

describe('buildGridOptions - 페이지네이션 / 가상 스크롤', () => {
  it('pageable은 페이징과 페이저를 켠다', () => {
    const options = buildGridOptions({ pageable: true, pageSize: 30 });

    expect(options.paging).toEqual({ enabled: true, pageSize: 30 });
    expect(options.pager.visible).toBe(true);
    expect(options.pager.showNavigationButtons).toBe(true);
  });

  it('페이지 크기 목록을 바꿀 수 있다', () => {
    expect(buildGridOptions({ pageable: true, pageSizes: [10, 20] }).pager.allowedPageSizes).toEqual([10, 20]);
  });

  it('페이지 크기 선택기를 숨길 수 있다', () => {
    expect(buildGridOptions({ pageable: true, paginationShowPageSize: false }).pager.showPageSizeSelector).toBe(false);
  });

  it('페이징을 끄고 높이를 고정하면 가상 스크롤로 대용량을 처리한다', () => {
    const options = buildGridOptions({ pageable: false, height: 380 });

    expect(options.paging).toEqual({ enabled: false });
    expect(options.scrolling).toEqual({ mode: 'virtual', rowRenderingMode: 'virtual' });
  });

  it('높이가 auto면 가상 스크롤을 켜지 않는다 (기준 영역이 없어 동작하지 않고 W1025 경고만 남는다)', () => {
    const options = buildGridOptions({ pageable: false, height: 'auto' });

    expect(options.paging).toEqual({ enabled: false });
    expect(options.scrolling).toBeUndefined();
  });

  it('페이징을 켜면 높이가 있어도 가상 스크롤을 켜지 않는다', () => {
    expect(buildGridOptions({ pageable: true, pageSize: 20, height: 380 }).scrolling).toBeUndefined();
  });
});

describe('buildGridOptions - 편집', () => {
  it('editable은 editing 옵션을 만들고 editMode를 그대로 쓴다', () => {
    const options = buildGridOptions({ editable: true, editMode: 'cell', allowAdding: true, allowDeleting: false });

    expect(options.editing.mode).toBe('cell');
    expect(options.editing.allowUpdating).toBe(true);
    expect(options.editing.allowAdding).toBe(true);
    expect(options.editing.allowDeleting).toBe(false);
  });

  it('editable이 없으면 editing 옵션을 만들지 않는다', () => {
    expect(buildGridOptions().editing).toBeUndefined();
  });
});

describe('buildGridOptions - 그룹핑 / 컬럼 도구 / 내보내기 / 상태저장', () => {
  it('groupable은 그룹 패널과 자동 펼침을 켠다', () => {
    const options = buildGridOptions({ groupable: true });

    expect(options.groupPanel.visible).toBe(true);
    expect(options.grouping.autoExpandAll).toBe(true);
  });

  it('groupable을 끄면 그룹 패널을 만들지 않는다', () => {
    expect(buildGridOptions().groupPanel).toBeUndefined();
  });

  it('columnChooser / columnFixing을 켤 수 있다', () => {
    expect(buildGridOptions({ columnChooser: true }).columnChooser).toEqual({ enabled: true, mode: 'select' });
    expect(buildGridOptions({ columnFixing: true }).columnFixing).toEqual({ enabled: true });
  });

  it('excelExport는 내보내기 툴바를 켠다', () => {
    expect(buildGridOptions({ excelExport: true }).export.enabled).toBe(true);
  });

  it('선택 기능이 있으면 "선택 행만 내보내기"도 허용한다', () => {
    expect(buildGridOptions({ excelExport: true, selectable: true }).export.allowExportSelectedData).toBe(true);
    expect(buildGridOptions({ excelExport: true, selectable: false }).export.allowExportSelectedData).toBe(false);
  });

  it('stateKey를 주면 localStorage에 레이아웃을 저장한다', () => {
    const options = buildGridOptions({ stateKey: 'emp-grid' });

    expect(options.stateStoring).toEqual({ enabled: true, type: 'localStorage', storageKey: 'emp-grid' });
  });

  it('stateKey가 없으면 상태 저장을 켜지 않는다', () => {
    expect(buildGridOptions().stateStoring).toBeUndefined();
  });
});

describe('buildGridOptions - 크기', () => {
  it("'auto'/빈 값은 크기를 지정하지 않는다 (자동)", () => {
    for (const value of ['auto', '', null, undefined]) {
      const options = buildGridOptions({ height: value, width: value });

      expect(options.height).toBeUndefined();
      expect(options.width).toBeUndefined();
    }
  });

  it('숫자와 px 문자열을 모두 px 숫자로 받는다', () => {
    expect(buildGridOptions({ height: 300 }).height).toBe(300);
    expect(buildGridOptions({ height: '300' }).height).toBe(300);
    expect(buildGridOptions({ height: '300px' }).height).toBe(300);
  });

  it('숫자로 바꿀 수 없는 값은 자동으로 둔다', () => {
    expect(buildGridOptions({ height: '아무거나' }).height).toBeUndefined();
  });
});

describe('buildGridOptions - 사용자 options 우선 (2층 탈출구)', () => {
  it('사용자 options가 BASE_OPTIONS를 덮는다', () => {
    const options = buildGridOptions({}, { rowAlternationEnabled: false, showColumnLines: false });

    expect(options.rowAlternationEnabled).toBe(false);
    expect(options.showColumnLines).toBe(false);
  });

  it('사용자 options가 기능 플래그 결과도 덮는다', () => {
    const options = buildGridOptions({ pageable: true, pageSize: 20 }, { paging: { pageSize: 100 } });

    expect(options.paging).toEqual({ enabled: true, pageSize: 100 });
  });

  it('래퍼가 모르는 DevExtreme 옵션도 그대로 통과시킨다', () => {
    const options = buildGridOptions({}, { focusedRowEnabled: true, twoWayBindingEnabled: false });

    expect(options.focusedRowEnabled).toBe(true);
    expect(options.twoWayBindingEnabled).toBe(false);
  });

  it('중첩 옵션은 일부만 덮어도 나머지가 살아 있다', () => {
    const options = buildGridOptions({ selectable: true, multiSelect: true }, { selection: { deferred: true } });

    expect(options.selection.mode).toBe('multiple');
    expect(options.selection.selectAllMode).toBe('allPages');
    expect(options.selection.deferred).toBe(true);
  });

  it('BASE_OPTIONS 원본을 오염시키지 않는다 (여러 그리드가 서로 영향을 주면 안 된다)', () => {
    const before = JSON.stringify(BASE_OPTIONS);

    buildGridOptions({ pageable: true }, { showBorders: false, sorting: { mode: 'none' } });

    expect(JSON.stringify(BASE_OPTIONS)).toBe(before);
  });
});
