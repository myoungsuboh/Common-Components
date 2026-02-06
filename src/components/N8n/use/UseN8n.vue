<script setup>
import N8n from "@/components/N8n/N8n.vue";
import TextInputBox from "@/components/TextBox/TextInputBox.vue";
const textValue = ref("");
const answer = ref("");

const handleReturnAns = (ans) => {
  answer.value = ans;
};
</script>
<template>
  <Card variant="elevated" class="pa-4">
    <VCardTitle>
      <h3>N8N 사용 예제</h3>
    </VCardTitle>
    <VCardText class="pa-4">
      <VRow>
        <VCol cols="12">
          <Card class="pa-4">
            <VCardText>
              <TextInputBox v-model:value="textValue" />
              <N8n :payload="textValue" @returnAns="handleReturnAns" />
              <br />
              <br />
              <br />
              <br />
              AI 대답 : {{ answer }}
            </VCardText>
          </Card>
        </VCol>
      </VRow>
    </VCardText>
  </Card>
</template>
<style lang="scss" scoped></style>
