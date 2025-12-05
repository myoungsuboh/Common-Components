<script setup>
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
      <VCardSubtitle>
        <VRow>
          <VCol cols="12">type : normal, confirm, delete</VCol>
          <VCol cols="12">width & height : string or number Type</VCol>
          <VCol cols="12">
            variant : tonal, outlined, elevated, flat, text, plain
          </VCol>
        </VRow>
      </VCardSubtitle>
    </VCardItem>
    <VCardText>
      <VRow>
        <VCol cols="12">
          <div class="d-flex justify-space-around">
            <Button name="넓이" width="100px" height="35px" />
            <Button
              type="confirm"
              name="확인"
              :loading="loading"
              @click="handleOnClick"
            />
            <Button type="delete" name="취소" />
            <Button name="테스트">
              <span style="color: blueviolet">슬롯</span>
            </Button>
            <Button color="blue" name="색상" />
            <Button
              style="background-color: red; width: 100px"
              color="blue"
              name="색상2"
            />
            <Button name="미사용" disabled />
            <Button
              name="API CALL"
              :api="api"
              @completed="handleCompleted"
              @error="handleError"
            />
          </div>
        </VCol>
        <VCol cols="12">
          <div class="d-flex justify-space-around">
            <Button name="tonal" variant="tonal" />
            <Button name="outlined" variant="outlined" />
            <Button name="elevated" variant="elevated" />
            <Button name="flat" variant="flat" />
            <Button name="text" variant="text" />
            <Button name="plain" variant="plain" />
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
