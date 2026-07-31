import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

/*
 * vue-code-highlight 는 prism을 전역에 붙이는 구형 패키지라 테스트 환경에서 임포트가 실패한다
 * ("Cannot set property default of [object Module]").
 * 코드 하이라이팅 자체는 테스트 대상이 아니므로 내용만 그대로 출력하는 스텁으로 대체한다.
 */
vi.mock('vue-code-highlight/src/CodeHighlight.vue', () => ({
  default: {
    name: 'CodeHighlight',
    template: '<pre><slot /></pre>',
  },
}));

import CodeCard from '@/components/SlickGrid/use/CodeCard.vue';

/* ***************************************************************************************************************
데모 페이지의 접이식 사용법 카드 테스트
****************************************************************************************************************** */

const CODE = "const columns = [{ field: 'a' }];";

describe('CodeCard', () => {
  it('기본은 접힌 상태다', () => {
    const wrapper = mount(CodeCard, { props: { code: CODE } });

    expect(wrapper.find('.code-card__body').exists()).toBe(false);
    expect(wrapper.find('.code-card__head').attributes('aria-expanded')).toBe('false');
  });

  it('헤더를 누르면 펼쳐지고 코드가 보인다', async () => {
    const wrapper = mount(CodeCard, { props: { code: CODE } });

    await wrapper.find('.code-card__head').trigger('click');

    expect(wrapper.find('.code-card__body').exists()).toBe(true);
    expect(wrapper.text()).toContain('const columns');
    expect(wrapper.find('.code-card__head').attributes('aria-expanded')).toBe('true');
  });

  it('다시 누르면 접힌다', async () => {
    const wrapper = mount(CodeCard, { props: { code: CODE } });
    const head = wrapper.find('.code-card__head');

    await head.trigger('click');
    await head.trigger('click');

    expect(wrapper.find('.code-card__body').exists()).toBe(false);
  });

  it('open prop으로 처음부터 펼칠 수 있다', () => {
    const wrapper = mount(CodeCard, { props: { code: CODE, open: true } });

    expect(wrapper.find('.code-card__body').exists()).toBe(true);
  });

  it('제목 기본값과 커스텀 제목', () => {
    expect(mount(CodeCard, { props: { code: CODE } }).find('.code-card__title').text()).toBe('사용법 보기');
    expect(mount(CodeCard, { props: { code: CODE, title: '설치 방법' } }).find('.code-card__title').text()).toBe('설치 방법');
  });

  it('접힘/펼침 안내 문구가 상태에 따라 바뀐다', async () => {
    const wrapper = mount(CodeCard, { props: { code: CODE } });

    expect(wrapper.find('.code-card__hint').text()).toBe('펼치기');
    await wrapper.find('.code-card__head').trigger('click');
    expect(wrapper.find('.code-card__hint').text()).toBe('접기');
  });

  it('화살표에 열림 상태 클래스가 붙는다', async () => {
    const wrapper = mount(CodeCard, { props: { code: CODE } });

    expect(wrapper.find('.code-card__arrow').classes()).not.toContain('is-open');
    await wrapper.find('.code-card__head').trigger('click');
    expect(wrapper.find('.code-card__arrow').classes()).toContain('is-open');
  });

  it('헤더는 button 이라 키보드로도 조작된다', () => {
    const wrapper = mount(CodeCard, { props: { code: CODE } });

    expect(wrapper.find('.code-card__head').element.tagName).toBe('BUTTON');
    expect(wrapper.find('.code-card__head').attributes('type')).toBe('button');
  });
});
