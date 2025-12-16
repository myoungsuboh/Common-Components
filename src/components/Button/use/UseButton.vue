<script setup>
import CodeHighlight from 'vue-code-highlight/src/CodeHighlight.vue';

import { Button } from '@/components';

const loading = ref(false);

const handleOnClick = () => {
  loading.value = true;

  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const api = {
  url: 'https://fonts.googleapis.com/css2',
  params: {
    family: 'Roboto:wght@100;300;400;500;700;900',
    display: 'swap',
  },
};

const handleCompleted = (data) => {
  console.log('API 호출 성공:', data);
};

const handleError = (error) => {
  console.error('API 호출 실패:', error);
};
</script>
<template>
  <VCard class="pa-4">
    <VCardItem>
      <VCardTitle>
        <h2>Button</h2>
      </VCardTitle>
    </VCardItem>
    <VCardText>
      <ui>
        <li class="mb-5">
          <h3>기본 버튼</h3>
          <VCol cols="12">
            <Button name="넓이" width="100px" height="35px" />
          </VCol>
          <span>속성 : `name="넓이" width="100px" height="35px"` </span>
        </li>
        <li class="mb-5">
          <h3>타입별 버튼</h3>
          <VCol cols="12">
            <Button
              type="confirm"
              name="확인"
              :loading="loading"
              @click="handleOnClick"
            />
            <Button type="delete" name="취소" />
          </VCol>
          <span>
            <p>
              속성 : type="confirm" name="확인" :loading="loading"
              @click="handleOnClick"
            </p>
            <p>type : normal / confirm / delete</p>
          </span>
        </li>
        <li class="mb-5">
          <h3>Slot 버튼</h3>
          <VCol cols="12">
            <Button name="테스트">
              <span style="color: blueviolet">슬롯</span>
            </Button>
          </VCol>
          <CodeHighlight>
            Button name="테스트" span style="color: blueviolet" 슬롯 /span
            /Button type : normal / confirm / delete
          </CodeHighlight>
        </li>
        <li class="mb-5">
          <h3>Color 버튼</h3>
          <VCol cols="12" style="display: flex; gap: 5;">
            <Button color="blue" name="색상" />
            <Button
              style="background-color: red; width: 100px"
              color="blue"
              name="색상2"
            />
          </VCol>
          <span>
            <p>
              style="background-color: red; width: 100px" color="blue"
              name="색상2"
            </p>
          </span>
        </li>
        <li class="mb-5">
          <h3>미사용 버튼</h3>
          <VCol cols="12">
            <Button name="미사용" disabled />
          </VCol>
          <span>
            <p>name="미사용" disabled</p>
          </span>
        </li>
        <li class="mb-5">
          <h3>API 버튼</h3>
          <VCol cols="12">
            <Button
              name="API CALL"
              :api="api"
              @completed="handleCompleted"
              @error="handleError"
            />
          </VCol>
          <span>
            <p>
              name="API CALL" :api="api" @completed="handleCompleted"
              @error="handleError"
            </p>
          </span>
        </li>
        <li class="mb-5">
          <h3>Variant 버튼</h3>
          <VCol cols="12" style="display: flex; justify-content: space-between">
            <Button name="tonal" variant="tonal" />
            <Button name="outlined" variant="outlined" />
            <Button name="elevated" variant="elevated" />
            <Button name="flat" variant="flat" />
            <Button name="text" variant="text" />
            <Button name="plain" variant="plain" />
          </VCol>
          <span>
            <p>variant : tonal, outlined, elevated, flat, text, plain</p>
          </span>
        </li>
      </ui>
    </VCardText>
  </VCard>
</template>
