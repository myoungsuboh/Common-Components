<script setup>
import Button from '@/components/Button.vue';

const loading = ref(false);

const handleOnClick = () => {
  loading.value = true;

  setTimeout(() => {
    loading.value = false;
  }, 1000);
};
</script>
<template>
  <VContainer fluid class="bg-surface-variant">
    <VRow>
      <VCol cols="6" class="my-4">
        <VCard class="pa-4">
          <template #title><h2>Button</h2></template>
          <template #subtitle>
            <VRow>
              <v-col cols="12">type : normal, confirm, delete</v-col>
              <v-col cols="12">width & height : string or number Type</v-col>
              <v-col cols="12">type : normal, confirm, delete</v-col>
              <v-col cols="12">
                variant : tonal, outlined, elevated, flat, text, plain
              </v-col>
            </VRow>
          </template>
          <template #text>
            <div class="d-flex justify-space-around">
              <Button name="기본" height="35px" />
              <Button
                type="confirm"
                name="확인"
                :loading="loading"
                @click="handleOnClick"
              />
              <Button type="delete" name="취소" />
              <Button name="테스트">
                <span style="color: red">커스텀 슬롯</span>
              </Button>
            </div>
          </template>
        </VCard>
      </VCol>
      <VCol cols="6" class="my-4">
        <VCard class="pa-4">
          <template #title><h2>Button</h2></template>
          <template #subtitle>
            <VRow>
              <v-col cols="12">type : normal, confirm, delete</v-col>
              <v-col cols="12">width & height : string or number Type</v-col>
              <v-col cols="12">type : normal, confirm, delete</v-col>
              <v-col cols="12">
                variant : tonal, outlined, elevated, flat, text, plain
              </v-col>
            </VRow>
          </template>
          <template #text>
            <div class="d-flex justify-space-around">
              <Button name="기본" height="35px" />
              <Button
                type="confirm"
                name="확인"
                :loading="loading"
                @click="handleOnClick"
              />
              <Button type="delete" name="취소" />
              <Button name="테스트">
                <span style="color: red">커스텀 슬롯</span>
              </Button>
            </div>
          </template>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>
<style lang="sass" scoped></style>
