import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import SlickGridPagination from '@/components/SlickGrid/SlickGridPagination.vue';

/* ***************************************************************************************************************
커스텀 페이지네이션 컴포넌트 테스트

이 컴포넌트는 SlickGrid DOM에 의존하지 않고 PaginationService 객체만 쓰기 때문에
happy-dom 에서도 정상적으로 검증할 수 있다.

slickgrid-vue 가 요구하는 계약도 함께 검증한다.
  - init / dispose / renderPagination 노출 (defineExpose)
  - 루트 엘리먼트 1개 (createApp().mount() 후 $el 을 append 하므로)
  - props를 받을 수 없어 설정은 grid.getOptions() 에서 읽어온다
****************************************************************************************************************** */

/** PaginationService 흉내 */
const makeService = (overrides = {}) => ({
  pageNumber: 1,
  pageCount: 7,
  itemsPerPage: 20,
  totalItems: 137,
  dataFrom: 1,
  dataTo: 20,
  availablePageSizes: [20, 50, 100],
  goToFirstPage: vi.fn(),
  goToPreviousPage: vi.fn(),
  goToNextPage: vi.fn(),
  goToLastPage: vi.fn(),
  goToPageNumber: vi.fn(),
  changeItemPerPage: vi.fn(),
  ...overrides,
});

/** EventPubSub 흉내 */
const makePubSub = () => {
  const subs = [];
  return {
    subs,
    subscribe: vi.fn((name, cb) => {
      const sub = { name, cb, unsubscribe: vi.fn() };
      subs.push(sub);
      return sub;
    }),
    fire: (name) => subs.filter((s) => s.name === name).forEach((s) => s.cb()),
  };
};

const makeGrid = (options = {}) => ({ getOptions: () => options });

/** 마운트 + init 까지 수행 */
const setup = async ({ gridOptions = {}, service = makeService() } = {}) => {
  const pubSub = makePubSub();
  const wrapper = mount(SlickGridPagination);

  wrapper.vm.init(makeGrid(gridOptions), service, pubSub);
  await wrapper.vm.$nextTick();

  return { wrapper, service, pubSub };
};

describe('slickgrid-vue 계약', () => {
  it('init / dispose / renderPagination 을 노출한다', () => {
    const wrapper = mount(SlickGridPagination);

    expect(typeof wrapper.vm.init).toBe('function');
    expect(typeof wrapper.vm.dispose).toBe('function');
    expect(typeof wrapper.vm.renderPagination).toBe('function');
  });

  it('루트 엘리먼트가 1개다 (여러 개면 $el이 주석 앵커가 되어 화면에 안 나온다)', () => {
    const wrapper = mount(SlickGridPagination);

    expect(wrapper.element.nodeType).toBe(Node.ELEMENT_NODE);
    expect(wrapper.element.classList.contains('sg-pagination')).toBe(true);
  });

  it('renderPagination은 컨테이너에 아직 붙지 않은 경우에만 append 한다', async () => {
    const { wrapper } = await setup();
    const container = document.createElement('div');

    wrapper.vm.renderPagination(container);
    expect(container.contains(wrapper.element)).toBe(true);

    // 두 번 호출해도 중복 append 되지 않는다
    wrapper.vm.renderPagination(container);
    expect(container.querySelectorAll('.sg-pagination')).toHaveLength(1);
  });
});

describe('설정 읽기 (props를 받을 수 없어 grid 옵션에서 가져온다)', () => {
  it('정렬 위치를 sgPaginationAlign에서 읽는다', async () => {
    const { wrapper } = await setup({ gridOptions: { sgPaginationAlign: 'center' } });

    expect(wrapper.classes()).toContain('sg-pagination--center');
  });

  it('정렬 기본값은 right', async () => {
    const { wrapper } = await setup();

    expect(wrapper.classes()).toContain('sg-pagination--right');
  });

  it('잘못된 정렬 값은 무시하고 기본값을 쓴다', async () => {
    const { wrapper } = await setup({ gridOptions: { sgPaginationAlign: 'top' } });

    expect(wrapper.classes()).toContain('sg-pagination--right');
  });

  it('sgPaginationShowPageSize: false 면 건수 셀렉터를 숨긴다', async () => {
    const { wrapper } = await setup({ gridOptions: { sgPaginationShowPageSize: false } });

    expect(wrapper.find('.sg-pagination__size').exists()).toBe(false);
  });
});

describe('건수 표시', () => {
  it('현재 범위와 전체 건수를 한글로 보여준다', async () => {
    const { wrapper } = await setup();

    expect(wrapper.find('.sg-pagination__info').text()).toBe('1-20 / 총 137건');
  });

  it('데이터가 없으면 0건', async () => {
    const { wrapper } = await setup({ service: makeService({ totalItems: 0, dataFrom: 0, dataTo: 0 }) });

    expect(wrapper.find('.sg-pagination__info').text()).toBe('0건');
  });

  it('천단위 구분기호를 넣는다', async () => {
    const { wrapper } = await setup({ service: makeService({ totalItems: 1234, dataTo: 20 }) });

    expect(wrapper.find('.sg-pagination__info').text()).toContain('1,234');
  });
});

describe('페이지 이동', () => {
  it('첫/이전/다음/마지막 버튼이 서비스 메서드를 호출한다', async () => {
    const { wrapper, service } = await setup({ service: makeService({ pageNumber: 3 }) });
    const buttons = wrapper.findAll('.sg-pagination__btn');

    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    await buttons[2].trigger('click');
    await buttons[3].trigger('click');

    expect(service.goToFirstPage).toHaveBeenCalled();
    expect(service.goToPreviousPage).toHaveBeenCalled();
    expect(service.goToNextPage).toHaveBeenCalled();
    expect(service.goToLastPage).toHaveBeenCalled();
  });

  it('페이지 번호 버튼은 해당 페이지로 이동한다', async () => {
    const { wrapper, service } = await setup();
    const page3 = wrapper.findAll('.sg-pagination__page').find((b) => b.text() === '3');

    await page3.trigger('click');

    expect(service.goToPageNumber).toHaveBeenCalledWith(3);
  });

  it('현재 페이지를 다시 눌러도 이동하지 않는다', async () => {
    const { wrapper, service } = await setup();
    const current = wrapper.find('.sg-pagination__page.is-active');

    await current.trigger('click');

    expect(service.goToPageNumber).not.toHaveBeenCalled();
  });

  it('첫 페이지에서는 첫/이전 버튼이 비활성이다', async () => {
    const { wrapper } = await setup({ service: makeService({ pageNumber: 1 }) });
    const buttons = wrapper.findAll('.sg-pagination__btn');

    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[1].attributes('disabled')).toBeDefined();
    expect(buttons[2].attributes('disabled')).toBeUndefined();
  });

  it('마지막 페이지에서는 다음/마지막 버튼이 비활성이다', async () => {
    const { wrapper } = await setup({ service: makeService({ pageNumber: 7 }) });
    const buttons = wrapper.findAll('.sg-pagination__btn');

    expect(buttons[2].attributes('disabled')).toBeDefined();
    expect(buttons[3].attributes('disabled')).toBeDefined();
  });
});

describe('페이지 번호 축약', () => {
  it('페이지가 적으면 전부 보여준다', async () => {
    const { wrapper } = await setup({ service: makeService({ pageCount: 5 }) });
    const pages = wrapper.findAll('.sg-pagination__page').map((b) => b.text());

    expect(pages).toEqual(['1', '2', '3', '4', '5']);
    expect(pages).not.toContain('...');
  });

  it('페이지가 많으면 ... 으로 줄이고 마지막 페이지는 항상 보여준다', async () => {
    const { wrapper } = await setup({ service: makeService({ pageCount: 62, pageNumber: 1 }) });
    const pages = wrapper.findAll('.sg-pagination__page').map((b) => b.text());

    expect(pages).toContain('...');
    expect(pages).toContain('62');
  });

  it('중간 페이지에서는 앞뒤로 ... 이 붙고 현재 페이지가 포함된다', async () => {
    const { wrapper } = await setup({ service: makeService({ pageCount: 62, pageNumber: 30 }) });
    const pages = wrapper.findAll('.sg-pagination__page').map((b) => b.text());

    expect(pages[0]).toBe('1');
    expect(pages).toContain('30');
    expect(pages.filter((p) => p === '...').length).toBe(2);
  });

  it('... 버튼은 비활성이고 클릭해도 이동하지 않는다', async () => {
    const { wrapper, service } = await setup({ service: makeService({ pageCount: 62, pageNumber: 30 }) });
    const ellipsis = wrapper.findAll('.sg-pagination__page').find((b) => b.text() === '...');

    expect(ellipsis.attributes('disabled')).toBeDefined();
    await ellipsis.trigger('click');
    expect(service.goToPageNumber).not.toHaveBeenCalled();
  });

  it('페이지가 1개면 1만 보여준다', async () => {
    const { wrapper } = await setup({ service: makeService({ pageCount: 1 }) });

    expect(wrapper.findAll('.sg-pagination__page').map((b) => b.text())).toEqual(['1']);
  });
});

describe('페이지당 건수', () => {
  it('서비스가 준 목록을 옵션으로 보여준다', async () => {
    const { wrapper } = await setup();
    const options = wrapper.findAll('.sg-pagination__select option').map((o) => o.text());

    expect(options).toEqual(['20', '50', '100']);
  });

  it('선택을 바꾸면 changeItemPerPage를 호출한다', async () => {
    const { wrapper, service } = await setup();
    const select = wrapper.find('.sg-pagination__select');

    await select.setValue('50');

    expect(service.changeItemPerPage).toHaveBeenCalledWith(50);
  });
});

describe('상태 동기화', () => {
  it('onPaginationRefreshed 이벤트로 표시를 갱신한다', async () => {
    const service = makeService();
    const { wrapper, pubSub } = await setup({ service });

    expect(wrapper.find('.sg-pagination__info').text()).toContain('137');

    // 서비스 상태가 바뀐 뒤 이벤트가 오면 다시 읽어야 한다
    service.totalItems = 500;
    service.dataTo = 50;
    pubSub.fire('onPaginationRefreshed');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.sg-pagination__info').text()).toContain('500');
  });

  it('커서 기반 페이징이면 페이지 번호 버튼을 감춘다 (임의 페이지로 점프 불가)', async () => {
    const { wrapper, pubSub } = await setup();

    pubSub.fire('onPaginationSetCursorBased');
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.sg-pagination__page')).toHaveLength(0);
    expect(wrapper.find('.sg-pagination__cursor-page').exists()).toBe(true);
  });
});

describe('정리 (dispose)', () => {
  it('구독을 해제한다 (그리드를 여러 번 열고 닫으면 콜백이 누적된다)', async () => {
    const { wrapper, pubSub } = await setup();

    wrapper.vm.dispose();

    expect(pubSub.subs.length).toBeGreaterThan(0);
    pubSub.subs.forEach((sub) => expect(sub.unsubscribe).toHaveBeenCalled());
  });

  it('언마운트 시에도 정리된다', async () => {
    const { wrapper, pubSub } = await setup();

    wrapper.unmount();

    pubSub.subs.forEach((sub) => expect(sub.unsubscribe).toHaveBeenCalled());
  });
});

describe('서비스가 없어도 죽지 않는다', () => {
  it('init 전에 렌더해도 예외가 없다', () => {
    expect(() => mount(SlickGridPagination)).not.toThrow();
  });

  it('init 전 버튼 클릭에도 예외가 없다', async () => {
    const wrapper = mount(SlickGridPagination);

    await expect(wrapper.findAll('.sg-pagination__btn')[2].trigger('click')).resolves.not.toThrow();
  });
});
