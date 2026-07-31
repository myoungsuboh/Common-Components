import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';

/* ***************************************************************************************************************
테스트 설정

vite.config.js를 그대로 재사용하지 않고 분리한 이유:
  vite-plugin-vue-devtools 는 개발 서버용 플러그인이라 테스트 환경에서는 불필요하고 부팅만 느려진다.

환경(happy-dom) 주의:
  SlickGrid 본체는 실제 브라우저의 레이아웃 계산(offsetWidth/스크롤)에 의존하므로
  happy-dom 에서는 정상 렌더되지 않는다.
  그래서 SlickGrid.vue 자체를 마운트하는 테스트는 두지 않고,
  - 순수 로직(composables)
  - SlickGrid에 의존하지 않는 Vue 컴포넌트(SlickGridPagination, CodeCard)
  만 테스트한다. 그리드 렌더링 자체는 브라우저에서 확인한다.
****************************************************************************************************************** */
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/uses': fileURLToPath(new URL('./src/components', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.js'],
    // CSS import(테마 파일)를 실제로 처리하지 않고 넘긴다 — 테스트 대상이 아니다
    css: false,
    globals: true,
  },
});
