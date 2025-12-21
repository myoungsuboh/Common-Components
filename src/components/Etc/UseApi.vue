<script setup>
import CodeHighlight from "vue-code-highlight/src/CodeHighlight.vue";

const vueCode = `
JWT토큰 전달,갱신방식
전달방식 - headers로 토큰 전달
갱신방식 - Access 토큰이 만료되면 Refresh 토큰을 요청에 같이 전달. 응답으로 갱신된 토큰 받았음.
요청 전 interceptors
access토큰 있으면 JWT 디코딩해서 만료시간 검사
만료됐으면 만료된 access + refresh 토큰 같이 헤더에 담아서 요청
만료안됐으면 access만 요청 전 헤더에 담는 작업 수행
응답 전 interceptors
access 토큰 만료돼서 응답헤더에 새로운 access토큰이 받아지면
만료된 access토큰 localStorage에서 삭제 후 새 토큰으로 교체
이후 요청 헤더에 새 access토큰을 담기
구현코드
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ACCESS_EXP_MESSAGE, CheckJWTExp } from 'utils/CheckJwtExp';
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
} from './localStorage';

axios.defaults.withCredentials = true;

/** 1. 요청 전 - access토큰있는데 만료되면 refresh토큰도 헤더담아서 요청보내기 */
axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const accessToken = getLocalStorage('access_token');
    const refreshToken = getLocalStorage('refresh_token');
    if (accessToken) {
      /** 2. access토큰 있으면 만료됐는지 체크 */
      if (CheckJWTExp() === ACCESS_EXP_MESSAGE) {
        /** 3. 만료되면 만료된 access, refresh 같이 헤더 담아서 요청 */
        config.headers!.Authorization = $accessToken
        config.headers!.Refresh = $refreshToken
      } else {
        config.headers!.Authorization = $accessToken
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** 4. 응답 전 - 새 access토큰받으면 갈아끼기 */
axios.interceptors.response.use(
  async (response: AxiosResponse) => {
    if (response.headers.authorization) {
      const newAccessToken = response?.headers?.authorization;
      removeLocalStorage('access_token'); // 만료된 access토큰 삭제
      setLocalStorage('access_token', newAccessToken); // 새걸로 교체
      response.config.headers = {
        authorization: $newAccessToken,
      };
    }
    return response;
  },
  (error) => {
    //응답 200 아닌 경우 - 디버깅
    return Promise.reject(error);
  }
);
`;
</script>
<template>
  <VCard>
    <VCardItem>
      <VCardTitle> API Setting </VCardTitle>
      <VCardSubtitle> API Setting 가이드입니다. </VCardSubtitle>
    </VCardItem>
    <VCardText class="bg-black">
      <CodeHighlight>
        {{ vueCode }}
      </CodeHighlight>
    </VCardText>
  </VCard>
</template>
<style lang="scss" scoped></style>
