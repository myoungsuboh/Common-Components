<script setup>
import Card from "@/components/Card/Card.vue";
import Button from "@/components/Button/Button.vue";

const isLoading = ref(false);

const handleChangeLoading = () => {
  isLoading.value = !isLoading.value;
};
</script>
<template>
  <VCard class="pa-4">
    <VCardItem>
      <VCardTitle>
        <h2>Card</h2>
      </VCardTitle>
    </VCardItem>
    <VCardText>
      <Button name="로딩 컨트롤" @click="handleChangeLoading" />
      <!-- 1. VCard Tag -->
      <Card :loading="isLoading" class="my-4" :elevation="24">
        <VCardItem>
          <VCardTitle>
            <h3>Use Type 1 : VCard Tag</h3>
          </VCardTitle>
          <VCardSubtitle class="my-5">
            <p>VCard Tag 사용 가이드 입니다.</p>
          </VCardSubtitle>
        </VCardItem>
        <VCardText>
          <span>
            <<VCode>Card</VCode>>
            <br />
            &nbsp;&nbsp; <<VCode>VCardItem</VCode>>
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<<VCode>VCardTitle</VCode>
            />
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<<VCode>VCardSubtitle</VCode>
            />
            <br />
            &nbsp;&nbsp;<<VCode>/VCardItem</VCode>>
            <br />
            &nbsp;&nbsp;<<VCode>VCardText</VCode> />
            <br />
            <<VCode>/Card</VCode>>
          </span>
        </VCardText>
      </Card>
      <VDivider class="border-opacity-100" color="black" />
      <!-- 2. Template Tag -->
      <Card :loading="isLoading" class="my-15" :variant="'outlined'" :draggable="true">
        <template #title>
          <h3>Use Type 2 : Template Tag</h3>
        </template>
        <template #subtitle>
          <div class="my-5">
            <p>Template Tag 사용 가이드 입니다.</p>
          </div>
        </template>
        <template #text>
          <span>
            <<VCode>Card</VCode>>
            <br />
            &nbsp;&nbsp;<<VCode>template #title</VCode>>
            <br />
            &nbsp;&nbsp;<<VCode>template #subtitle</VCode>
            />
            <br />
            &nbsp;&nbsp;<<VCode>template #text</VCode>
            />
            <br />
            <<VCode>/Card</VCode>>
          </span>
        </template>
      </Card>
    </VCardText>
  </VCard>
</template>
<style lang="scss" scoped></style>
