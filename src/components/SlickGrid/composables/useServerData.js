/* ***************************************************************************************************************
서버 사이드 페이징 / 정렬 / 필터

--------------------------------------------------------------------------------------------------
왜 backendServiceApi를 써야 하는가
--------------------------------------------------------------------------------------------------
"현재 페이지 데이터만 받아와서 v-model에 넣는" 방식으로는 안 된다.
그렇게 하면 SlickGrid이 정렬/필터를 "받아온 한 페이지 안에서만" 수행해서 결과가 틀린다.
(1000건 중 20건만 로드된 상태에서 정렬하면 그 20건만 정렬됨)

backendServiceApi를 지정하면 SlickGrid이 정렬/필터/페이징을 로컬에서 처리하지 않고
매번 서버에 위임한다. 그래서 이 경로를 쓴다.

--------------------------------------------------------------------------------------------------
호출 흐름 (라이브러리 내부 구현을 확인한 결과)
--------------------------------------------------------------------------------------------------
사용자가 페이지 이동 / 정렬 / 필터를 바꾸면

  1. service.processOnPaginationChanged / processOnSortChanged / processOnFilterChanged 가 호출되고
     각각 "쿼리 문자열"을 반환한다.
  2. backendServiceApi.process(쿼리문자열, { signal }) 이 호출된다. Promise를 반환해야 한다.
  3. 결과가 service.postProcess -> backendServiceApi.postProcess 순으로 전달된다.
  4. 에러는 backendServiceApi.onError 로 간다 (없으면 throw).

BackendService 인터페이스에서 실제로 필수인 메서드는 6개뿐이다.
  buildQuery / resetPaginationOptions / updateOptions /
  processOnFilterChanged / processOnPaginationChanged / processOnSortChanged
나머지는 optional 이라 필요한 것만 구현한다.

--------------------------------------------------------------------------------------------------
API 모양에 종속되지 않게 만든 방법
--------------------------------------------------------------------------------------------------
프로젝트마다 API 응답 규격이 다르므로(`content/totalElements`, `list/totalCount`, ...)
이 컴포넌트는 URL을 직접 만들지 않는다.
대신 사용자가 fetchData 함수를 넘기고, 그 안에서 자기 API를 호출해
{ items, totalCount } 로만 돌려주면 된다.
****************************************************************************************************************** */

/**
 * SlickGrid이 요구하는 최소 BackendService 구현
 *
 * 쿼리 문자열을 직접 만들지 않고, 현재 상태(page/pageSize/sorters/filters)를
 * JSON 문자열로 직렬화해서 넘긴다. process()에서 다시 파싱해 사용한다.
 */
class RestBackendService {
  constructor() {
    this.options = {};
    this._pagination = { pageNumber: 1, pageSize: 20 };
    this._sorters = [];
    this._filters = [];
  }

  /** 현재 상태를 쿼리 문자열(JSON)로 직렬화. process()가 이 문자열을 받는다. */
  buildQuery() {
    return JSON.stringify({
      page: this._pagination.pageNumber,
      pageSize: this._pagination.pageSize,
      sorters: this._sorters,
      filters: this._filters,
    });
  }

  init(serviceOptions, pagination) {
    this.options = serviceOptions ?? {};
    if (pagination) {
      this._pagination = {
        pageNumber: pagination.pageNumber ?? 1,
        pageSize: pagination.pageSize ?? this._pagination.pageSize,
      };
    }
  }

  updateOptions(serviceOptions) {
    this.options = { ...this.options, ...(serviceOptions ?? {}) };
  }

  resetPaginationOptions() {
    this._pagination.pageNumber = 1;
  }

  getCurrentPagination() {
    return { pageNumber: this._pagination.pageNumber, pageSize: this._pagination.pageSize };
  }

  getCurrentSorters() {
    return this._sorters;
  }

  getCurrentFilters() {
    return this._filters;
  }

  clearSorters() {
    this._sorters = [];
  }

  clearFilters() {
    this._filters = [];
  }

  updatePagination(newPage, pageSize) {
    this._pagination = { pageNumber: newPage, pageSize };
  }

  updateSorters(sortColumns, presetSorters) {
    this._sorters = presetSorters ?? normalizeSorters(sortColumns);
  }

  updateFilters(columnFilters) {
    this._filters = normalizeFilters(columnFilters);
  }

  processOnPaginationChanged(event, args) {
    this._pagination = { pageNumber: args?.newPage ?? 1, pageSize: args?.pageSize ?? this._pagination.pageSize };
    return this.buildQuery();
  }

  processOnSortChanged(event, args) {
    // 단일 정렬(SingleColumnSort)과 다중 정렬(MultiColumnSort) 두 형태가 모두 온다
    const sortCols = args?.sortCols ?? (args?.sortCol ? [args] : []);
    this._sorters = normalizeSorters(sortCols);
    return this.buildQuery();
  }

  processOnFilterChanged(event, args) {
    this._filters = normalizeFilters(args?.columnFilters);
    // 필터가 바뀌면 1페이지로 돌아가는 것이 맞다 (3페이지를 보다 필터를 걸면 결과가 1페이지뿐일 수 있음)
    this._pagination.pageNumber = 1;
    return this.buildQuery();
  }
}

/**
 * SlickGrid 정렬 정보 -> { field, direction } 배열
 *
 * @param {Array} sortColumns
 * @returns {Array<{field: string, direction: string}>}
 */
const normalizeSorters = (sortColumns) => {
  if (!Array.isArray(sortColumns)) return [];

  return sortColumns
    .map((sort) => {
      const field = sort?.sortCol?.field ?? sort?.sortCol?.id ?? sort?.columnId;
      if (!field) return null;
      return { field, direction: sort.sortAsc === false ? 'DESC' : 'ASC' };
    })
    .filter(Boolean);
};

/**
 * SlickGrid 필터 정보 -> { field, operator, value, values } 배열
 *
 * @param {Object} columnFilters
 * @returns {Array<{field: string, operator: string, value: any, values: Array}>}
 */
const normalizeFilters = (columnFilters) => {
  if (!columnFilters || columnFilters.constructor !== Object) return [];

  return Object.values(columnFilters)
    .map((filter) => {
      const field = filter?.columnDef?.field ?? filter?.columnId;
      const terms = filter?.searchTerms ?? [];
      if (!field || terms.length === 0 || (terms.length === 1 && (terms[0] === '' || terms[0] === null))) return null;

      return {
        field,
        // 빈 연산자는 문자 컬럼에서 "포함"(LIKE)을 의미한다
        operator: filter.operator || 'Contains',
        value: terms[0],
        values: terms,
      };
    })
    .filter(Boolean);
};

/**
 * 서버 사이드 모드용 backendServiceApi 생성
 *
 * @param {Object} config
 * @param {Function} config.fetchData 사용자가 제공하는 조회 함수.
 *   ({ page, pageSize, sorters, filters, signal }) => Promise<{ items: Array, totalCount: number }>
 * @param {Function} config.onResult 조회 결과를 그리드에 반영하는 콜백 (dataset/totalItems 갱신)
 * @param {Function} config.onError 조회 실패 콜백
 * @param {Function} [config.onLoadingChange] 로딩 상태 변화 콜백
 * @returns {Object} SlickGrid backendServiceApi
 */
export const createBackendServiceApi = ({ fetchData, onResult, onError, onLoadingChange }) => {
  const service = new RestBackendService();

  return {
    service,

    /** 조회 시작 직전 (로딩 표시용) */
    preProcess: () => onLoadingChange?.(true),

    /**
     * 실제 조회. Promise를 반환해야 한다.
     *
     * signal은 라이브러리가 넘겨주는 AbortSignal이다.
     * 사용자가 빠르게 페이지를 넘기면 이전 요청이 취소되므로 fetchData에 그대로 전달한다.
     */
    process: (query, { signal } = {}) => {
      let params;

      try {
        params = JSON.parse(query);
      } catch {
        // buildQuery가 항상 JSON을 만들므로 정상적으로는 도달하지 않는다.
        // 그래도 파싱 실패 시 조회가 멈추지 않도록 현재 상태로 폴백한다.
        params = { page: 1, pageSize: 20, sorters: [], filters: [] };
      }

      return Promise.resolve(fetchData({ ...params, signal }));
    },

    /** 조회 결과를 그리드에 반영 */
    postProcess: (result) => {
      onLoadingChange?.(false);

      const items = result?.items ?? [];
      // totalCount가 없으면 페이지 수를 계산할 수 없어 페이지네이션이 1페이지로만 보인다
      const totalCount = Number.isFinite(result?.totalCount) ? result.totalCount : items.length;

      onResult({ items, totalCount });
    },

    onError: (error) => {
      onLoadingChange?.(false);
      onError?.(error);
    },
  };
};

export { RestBackendService, normalizeSorters, normalizeFilters };
