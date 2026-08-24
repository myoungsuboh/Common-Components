import { describe, it, expect } from 'vitest';

import { buildGridOptions, deepMerge, KO_LOCALES } from '@/components/SlickGrid/composables/useGridOptions';

/* ***************************************************************************************************************
그리드 옵션 생성/병합 테스트

크기 계산 관련 케이스는 실제로 화면이 깨진 사고에서 나왔다 (컬럼이 30px로 찌그러짐). 지우지 말 것.
****************************************************************************************************************** */

describe('deepMerge', () => {
  it('중첩 객체는 깊게 병합한다', () => {
    const result = deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 9 } });

    expect(result.a.b).toBe(1);
    expect(result.a.c).toBe(9);
  });

  it('배열은 병합하지 않고 교체한다 (externalResources 중복 등록 방지)', () => {
    expect(deepMerge({ arr: [1, 2, 3] }, { arr: [9] }).arr).toEqual([9]);
  });

  it('source가 없으면 target을 유지한다', () => {
    expect(deepMerge({ a: 1 }, undefined).a).toBe(1);
    expect(deepMerge({ a: 1 }, null).a).toBe(1);
  });

  it('원본을 변경하지 않는다', () => {
    const target = { a: { b: 1 } };
    deepMerge(target, { a: { b: 2 } });

    expect(target.a.b).toBe(1);
  });
});

describe('기본 옵션', () => {
  it('정렬·리사이즈·순서변경은 옵션이 아니라 기본값이다', () => {
    const options = buildGridOptions();

    expect(options.enableSorting).toBe(true);
    expect(options.enableColumnReorder).toBe(true);
    expect(options.enableAutoResize).toBe(true);
  });

  it('한글 locale이 적용된다', () => {
    const options = buildGridOptions();

    expect(options.enableTranslate).toBe(false);
    expect(options.locales.TEXT_ITEMS_PER_PAGE).toBe('페이지당 건수');
    expect(options.locales.TEXT_OK).toBe('확인');
  });

  it('locale 키가 전부 TEXT_ 로 시작하고 중복이 없다', () => {
    const keys = Object.keys(KO_LOCALES);

    expect(keys.every((k) => k.startsWith('TEXT_'))).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('검색 필터 기본값 — placeholder는 문구, 타이핑은 디바운스', () => {
    const options = buildGridOptions();

    // 라이브러리 기본 placeholder가 🔎︎ 이모지라 입력칸으로 안 보인다
    expect(options.defaultFilterPlaceholder).toBe('검색');
    // 기본값 0이면 한 글자마다 필터가 돌아 대용량에서 버벅인다 (Enter는 디바운스를 건너뜀)
    expect(options.filterTypingDebounce).toBeGreaterThan(0);
  });

  it('말줄임된 내용을 볼 수 있도록 자동 툴팁을 켠다', () => {
    const options = buildGridOptions();

    expect(options.enableAutoTooltip).toBe(true);
    expect(options.autoTooltipOptions.enableForCells).toBe(true);
  });
});

describe('크기 계산 (자동 / 수동)', () => {
  it('컨테이너 기준으로 계산한다 (라이브러리 기본 window면 부모 밖으로 넘친다)', () => {
    const options = buildGridOptions({ containerSelector: '#w1' });

    expect(options.autoResize.calculateAvailableSizeBy).toBe('container');
    expect(options.autoResize.container).toBe('#w1');
  });

  it('높이를 고정해도 autoResize를 끄지 않는다 (끄면 너비 계산까지 죽는다)', () => {
    const options = buildGridOptions({ containerSelector: '#w2', height: 400 });

    expect(options.enableAutoResize).toBe(true);
    expect(options.autoResize.minHeight).toBe(400);
    expect(options.autoResize.maxHeight).toBe(400);
    expect(options.autoResize.container).toBe('#w2');
  });

  it("'auto'는 고정하지 않는다", () => {
    const options = buildGridOptions({ height: 'auto', width: 'auto' });

    expect(options.gridHeight).toBeUndefined();
    expect(options.gridWidth).toBeUndefined();
  });

  it("'350px' 같은 문자열도 숫자로 파싱한다", () => {
    const options = buildGridOptions({ height: '350px', width: 900 });

    expect(options.gridHeight).toBe(350);
    expect(options.autoResize.minWidth).toBe(900);
  });

  it('fitColumns는 forceFitColumns로 매핑된다', () => {
    expect(buildGridOptions({ fitColumns: true }).forceFitColumns).toBe(true);
  });
});

describe('기능 플래그', () => {
  it('editable은 셀 이동을 동반해야 편집이 동작한다', () => {
    const options = buildGridOptions({ editable: true, autoEdit: false });

    expect(options.editable).toBe(true);
    expect(options.enableCellNavigation).toBe(true);
  });

  it('externalFilter는 필터를 켜되 필터 행을 숨긴다', () => {
    const options = buildGridOptions({ externalFilter: true });

    // FilterService는 enableFiltering이 켜져 있어야 동작한다
    expect(options.enableFiltering).toBe(true);
    expect(options.showHeaderRow).toBe(false);
  });

  it('filterable이 이미 켜져 있으면 externalFilter가 필터 행을 숨기지 않는다', () => {
    const options = buildGridOptions({ filterable: true, externalFilter: true });

    expect(options.enableFiltering).toBe(true);
    expect(options.showHeaderRow).toBeUndefined();
  });

  it('체크박스 선택 — 내장 전체선택은 숨기고(해제가 안 되는 버그) 헤더 행에 배치한다', () => {
    const options = buildGridOptions({ selectable: true, multiSelect: true, checkboxSelector: true });

    expect(options.enableCheckboxSelector).toBe(true);
    expect(options.checkboxSelector.hideSelectAllCheckbox).toBe(true);
    expect(options.checkboxSelector.hideInColumnTitleRow).toBe(false);
    expect(options.checkboxSelector.hideInFilterHeaderRow).toBe(true);
  });

  it('그룹핑은 드래그를 받을 pre-header 패널과 한글 안내문을 동반한다', () => {
    const options = buildGridOptions({ groupable: true });

    expect(options.enableDraggableGrouping).toBe(true);
    expect(options.createPreHeaderPanel).toBe(true);
    expect(options.showPreHeaderPanel).toBe(true);
    // 이 플러그인은 locales를 보지 않아 텍스트를 직접 넣어야 한다
    expect(options.draggableGrouping.dropPlaceHolderText).toContain('그룹');
  });

  it('2단 헤더는 그룹핑과 같은 패널을 쓰므로 groupable이 켜지면 양보한다', () => {
    const withGroup = buildGridOptions({ hasColumnGroup: true });
    const conflict = buildGridOptions({ hasColumnGroup: true, groupable: true });

    expect(withGroup.createPreHeaderPanel).toBe(true);
    expect(conflict.enableDraggableGrouping).toBe(true);
  });

  it('합계 행은 footer row를 켠다', () => {
    const options = buildGridOptions({ showSummary: true });

    expect(options.createFooterRow).toBe(true);
    expect(options.showFooterRow).toBe(true);
  });

  it('행 고유 키를 지정할 수 있다', () => {
    expect(buildGridOptions({ idField: 'empNo' }).datasetIdPropertyName).toBe('empNo');
  });
});

describe('컬럼 메뉴 (헤더 우클릭)', () => {
  it('헤더 우클릭 컬럼 선택기는 항상 끈다 (라이브러리 기본값이 true라 명시적으로 꺼야 한다)', () => {
    // 우클릭 자리는 컬럼별 헤더 메뉴가 쓴다 (SlickGrid.vue handleHeaderContextMenu)
    expect(buildGridOptions({}).enableColumnPicker).toBe(false);
    expect(buildGridOptions({ gridMenu: true }).enableColumnPicker).toBe(false);
  });

  it('gridMenu는 우측 상단 ☰ 와 컬럼 헤더 메뉴를 켠다', () => {
    const options = buildGridOptions({ gridMenu: true });

    expect(options.enableGridMenu).toBe(true);
    expect(options.enableHeaderMenu).toBe(true);
  });

  it('2층에서 컬럼 선택기를 되살릴 수 있다 (그때는 우클릭을 선택기가 가져간다)', () => {
    expect(buildGridOptions({ gridMenu: true }, { enableColumnPicker: true }).enableColumnPicker).toBe(true);
  });
});

describe('엑셀 내보내기 (한글 안전)', () => {
  it("format을 'xlsx'로 고정한다 (xls는 인코딩 정보가 없어 한글이 깨진다)", () => {
    const options = buildGridOptions({ excelExport: true, exportFilename: '사원목록', exportSheetName: '사원' });

    expect(options.excelExportOptions.format).toBe('xlsx');
    expect(options.excelExportOptions.filename).toBe('사원목록');
    expect(options.excelExportOptions.sheetName).toBe('사원');
    // 코드값이 아니라 화면에 보이는 명칭으로 내보낸다
    expect(options.excelExportOptions.exportWithFormatter).toBe(true);
  });

  it('ExcelExportService 인스턴스를 externalResources에 등록한다', () => {
    const options = buildGridOptions({ excelExport: true });

    expect(Array.isArray(options.externalResources)).toBe(true);
    expect(typeof options.externalResources[0].exportToExcel).toBe('function');
  });
});

describe('서버 사이드 / 페이지네이션', () => {
  it('backendServiceApi가 있으면 페이지네이션을 켠다', () => {
    const api = { service: {}, process: () => {} };
    const options = buildGridOptions({ backendServiceApi: api, pageSize: 20 });

    expect(options.backendServiceApi).toBe(api);
    expect(options.enablePagination).toBe(true);
    expect(options.pagination.totalItems).toBe(0);
  });

  it('커스텀 페이지네이션 설정은 props로 못 넘겨서 그리드 옵션에 심는다', () => {
    const comp = {};
    const options = buildGridOptions({ pageable: true, pageSize: 50, paginationComponent: comp, paginationAlign: 'center' });

    expect(options.customPaginationComponent).toBe(comp);
    expect(options.sgPaginationAlign).toBe('center');
    expect(options.pagination.pageSize).toBe(50);
  });

  it('페이지네이션 정렬 기본값은 right', () => {
    expect(buildGridOptions({ pageable: true, paginationComponent: {} }).sgPaginationAlign).toBe('right');
  });
});

describe('사용자 options 우선순위 (2층)', () => {
  it('사용자 options가 기능 플래그와 기본값을 모두 이긴다', () => {
    const options = buildGridOptions({ filterable: true }, { enableFiltering: false, rowHeight: 99 });

    expect(options.enableFiltering).toBe(false);
    expect(options.rowHeight).toBe(99);
  });

  it('덮어쓰지 않은 기본값은 그대로 남는다', () => {
    const options = buildGridOptions({}, { rowHeight: 99 });

    expect(options.locales.TEXT_OK).toBe('확인');
    expect(options.enableSorting).toBe(true);
  });

  it('중첩 옵션도 일부만 덮을 수 있다', () => {
    const options = buildGridOptions({ containerSelector: '#w' }, { autoResize: { bottomPadding: 50 } });

    expect(options.autoResize.bottomPadding).toBe(50);
    expect(options.autoResize.container).toBe('#w');
  });
});
