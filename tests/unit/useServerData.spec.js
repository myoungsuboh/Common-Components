import { describe, it, expect, vi } from 'vitest';

import { createBackendServiceApi, normalizeSorters, normalizeFilters, RestBackendService } from '@/components/SlickGrid/composables/useServerData';

/* ***************************************************************************************************************
서버 사이드 조회 테스트

SlickGrid이 요구하는 BackendService 계약(필수 메서드 6개)과
프로젝트 API 모양에 종속되지 않는 { items, totalCount } 변환을 검증한다.
****************************************************************************************************************** */

describe('normalizeSorters', () => {
  it('SlickGrid 정렬 정보를 { field, direction }으로 바꾼다', () => {
    const result = normalizeSorters([
      { sortCol: { field: 'name' }, sortAsc: true },
      { sortCol: { field: 'salary' }, sortAsc: false },
    ]);

    expect(result).toEqual([
      { field: 'name', direction: 'ASC' },
      { field: 'salary', direction: 'DESC' },
    ]);
  });

  it('field가 없으면 컬럼 id로 대체한다', () => {
    expect(normalizeSorters([{ sortCol: { id: 'deptCd' }, sortAsc: true }])).toEqual([{ field: 'deptCd', direction: 'ASC' }]);
  });

  it('식별할 수 없는 항목은 버린다', () => {
    expect(normalizeSorters([{ sortAsc: true }, null])).toEqual([]);
  });

  it('배열이 아니면 빈 배열', () => {
    expect(normalizeSorters(undefined)).toEqual([]);
  });
});

describe('normalizeFilters', () => {
  it('컬럼 필터를 { field, operator, value, values }로 바꾼다', () => {
    const result = normalizeFilters({
      name: { columnDef: { field: 'name' }, operator: 'Contains', searchTerms: ['홍'] },
    });

    expect(result).toEqual([{ field: 'name', operator: 'Contains', value: '홍', values: ['홍'] }]);
  });

  it('빈 연산자는 Contains(LIKE)로 채운다', () => {
    const result = normalizeFilters({ a: { columnDef: { field: 'a' }, operator: '', searchTerms: ['x'] } });

    expect(result[0].operator).toBe('Contains');
  });

  it('검색어가 비어 있으면 그 조건을 제외한다 (빈 문자열로 필터를 걸면 0건이 된다)', () => {
    const result = normalizeFilters({
      a: { columnDef: { field: 'a' }, searchTerms: [''] },
      b: { columnDef: { field: 'b' }, searchTerms: [] },
      c: { columnDef: { field: 'c' }, searchTerms: [null] },
      d: { columnDef: { field: 'd' }, searchTerms: ['ok'] },
    });

    expect(result.map((f) => f.field)).toEqual(['d']);
  });

  it('범위 검색처럼 값이 여러 개면 values로 함께 넘긴다', () => {
    const result = normalizeFilters({ a: { columnDef: { field: 'a' }, operator: 'RangeInclusive', searchTerms: [10, 20] } });

    expect(result[0].values).toEqual([10, 20]);
    expect(result[0].value).toBe(10);
  });

  it('객체가 아니면 빈 배열', () => {
    expect(normalizeFilters(null)).toEqual([]);
  });
});

describe('RestBackendService (SlickGrid 계약)', () => {
  it('필수 메서드를 모두 갖는다', () => {
    const service = new RestBackendService();

    for (const method of ['buildQuery', 'resetPaginationOptions', 'updateOptions', 'processOnFilterChanged', 'processOnPaginationChanged', 'processOnSortChanged']) {
      expect(typeof service[method]).toBe('function');
    }
  });

  it('buildQuery는 현재 상태를 JSON으로 직렬화한다', () => {
    const service = new RestBackendService();
    service.updatePagination(3, 50);

    expect(JSON.parse(service.buildQuery())).toEqual({ page: 3, pageSize: 50, sorters: [], filters: [] });
  });

  it('페이지 변경을 반영한다', () => {
    const service = new RestBackendService();
    const query = JSON.parse(service.processOnPaginationChanged(null, { newPage: 2, pageSize: 20 }));

    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(20);
  });

  it('정렬 변경을 반영한다 (단일/다중 형태 모두)', () => {
    const service = new RestBackendService();

    const multi = JSON.parse(service.processOnSortChanged(null, { sortCols: [{ sortCol: { field: 'a' }, sortAsc: false }] }));
    expect(multi.sorters).toEqual([{ field: 'a', direction: 'DESC' }]);

    const single = JSON.parse(service.processOnSortChanged(null, { sortCol: { field: 'b' }, sortAsc: true }));
    expect(single.sorters).toEqual([{ field: 'b', direction: 'ASC' }]);
  });

  it('필터가 바뀌면 1페이지로 돌아간다 (3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있다)', () => {
    const service = new RestBackendService();
    service.updatePagination(3, 20);

    const query = JSON.parse(service.processOnFilterChanged(null, { columnFilters: { a: { columnDef: { field: 'a' }, searchTerms: ['x'] } } }));

    expect(query.page).toBe(1);
    expect(query.filters).toHaveLength(1);
  });

  it('resetPaginationOptions는 1페이지로 되돌린다', () => {
    const service = new RestBackendService();
    service.updatePagination(5, 20);
    service.resetPaginationOptions();

    expect(JSON.parse(service.buildQuery()).page).toBe(1);
  });
});

describe('createBackendServiceApi', () => {
  const makeApi = (overrides = {}) => {
    const calls = { result: null, error: null, loading: [] };
    const api = createBackendServiceApi({
      fetchData: overrides.fetchData ?? (async () => ({ items: [{ id: 1 }], totalCount: 137 })),
      onResult: (r) => (calls.result = r),
      onError: (e) => (calls.error = e),
      onLoadingChange: (v) => calls.loading.push(v),
    });
    return { api, calls };
  };

  it('service와 process를 모두 제공한다 (없으면 라이브러리가 예외를 던진다)', () => {
    const { api } = makeApi();

    expect(api.service).toBeTruthy();
    expect(typeof api.process).toBe('function');
  });

  it('process는 쿼리를 파싱해 fetchData에 넘기고 signal도 전달한다', async () => {
    const fetchData = vi.fn(async () => ({ items: [], totalCount: 0 }));
    const { api } = makeApi({ fetchData });
    const signal = new AbortController().signal;

    await api.process(JSON.stringify({ page: 2, pageSize: 50, sorters: [], filters: [] }), { signal });

    expect(fetchData).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 50, signal }));
  });

  it('process는 인자 없이 호출돼도(초기 조회 경로) 동작한다', async () => {
    const fetchData = vi.fn(async () => ({ items: [], totalCount: 0 }));
    const { api } = makeApi({ fetchData });

    await api.process(api.service.buildQuery());

    expect(fetchData).toHaveBeenCalled();
  });

  it('쿼리 파싱이 실패해도 조회를 멈추지 않는다', async () => {
    const fetchData = vi.fn(async () => ({ items: [], totalCount: 0 }));
    const { api } = makeApi({ fetchData });

    await api.process('깨진 JSON');

    expect(fetchData).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });

  it('postProcess가 결과를 { items, totalCount }로 전달한다', () => {
    const { api, calls } = makeApi();
    api.postProcess({ items: [{ id: 1 }, { id: 2 }], totalCount: 137 });

    expect(calls.result).toEqual({ items: [{ id: 1 }, { id: 2 }], totalCount: 137 });
  });

  it('totalCount가 없으면 받은 건수로 대체한다', () => {
    const { api, calls } = makeApi();
    api.postProcess({ items: [{ id: 1 }, { id: 2 }] });

    expect(calls.result.totalCount).toBe(2);
  });

  it('결과가 비어도 안전하게 처리한다', () => {
    const { api, calls } = makeApi();
    api.postProcess(undefined);

    expect(calls.result).toEqual({ items: [], totalCount: 0 });
  });

  it('로딩 상태를 조회 시작/종료에 맞춰 알린다', () => {
    const { api, calls } = makeApi();

    api.preProcess();
    api.postProcess({ items: [], totalCount: 0 });

    expect(calls.loading).toEqual([true, false]);
  });

  it('에러 시 로딩을 끄고 onError로 넘긴다', () => {
    const { api, calls } = makeApi();
    const error = new Error('실패');

    api.onError(error);

    expect(calls.error).toBe(error);
    expect(calls.loading).toEqual([false]);
  });
});
