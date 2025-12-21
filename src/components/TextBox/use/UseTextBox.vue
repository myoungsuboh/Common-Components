<script setup>
import InputBox from "@/components/TextBox/InputBox.vue";
import TextInputBox from "@/components/TextBox/TextInputBox.vue";
import NumberInputBox from "@/components/TextBox/NumberInputBox.vue";
import EmailInputBox from "@/components/TextBox/EmailInputBox.vue";
import PasswordInputBox from "@/components/TextBox/PasswordInputBox.vue";

const defaultValue = ref("");
const progressTextValue = ref("");
const progress = ref("10");
const textValue = ref("");
const numberValue = ref(1);
const pwdTextValue = ref("password");
</script>
<template>
  <VCard class="pa-4">
    <template #title><h2>TextBox</h2></template>
    <template #subtitle>
      <VRow>
        <VCol cols="12">test</VCol>
      </VRow>
    </template>
    <template #text>
      <VRow>
        <!-- 1/기본 -->
        <VCol cols="12">
          <h3>InputBox</h3>
        </VCol>
        <VCol cols="12">
          <InputBox v-model:value="defaultValue" />
        </VCol>
        <!-- 2.로딩바 -->
        <VCol cols="12">
          <h3>ProgressInputBox</h3>
        </VCol>
        <VCol cols="6">
          <InputBox v-model:value="progressTextValue" v-model:progress-value="progress" />
        </VCol>
        <VCol cols="6">
          <InputBox v-model:value="progressTextValue" progressIndeterminate />
        </VCol>
        <VCol cols="6">
          <InputBox v-model:value="progressTextValue" v-model:progress-value="progress" :progressType="'Linear'" />
        </VCol>
        <VCol cols="6">
          <InputBox v-model:value="progressTextValue" :progressType="'Linear'" progressIndeterminate />
        </VCol>
        <!-- 3.문자 -->
        <VCol cols="12">
          <h3>TextInputBox</h3>
        </VCol>
        <VCol cols="12">
          <TextInputBox v-model:value="textValue" />
        </VCol>
        <!-- 4.숫자 -->
        <VCol cols="12">
          <h3>NumberInputBox</h3>
        </VCol>
        <VCol cols="12">
          <NumberInputBox v-model:value="numberValue" :fixed="2" />
        </VCol>
        <!-- 5.이메일 -->
        <VCol cols="12">
          <h3>EmailInputBox</h3>
        </VCol>
        <VCol cols="12">
          <EmailInputBox />
        </VCol>
        <!-- 6.비밀번호 -->
        <VCol cols="12">
          <h3>PasswordInputBox</h3>
        </VCol>
        <VCol cols="12">
          <PasswordInputBox v-model:value="pwdTextValue" :pInnerIcon="'mdi-lock-outline'" />
        </VCol>
      </VRow>
    </template>
  </VCard>
</template>
<style scoped>
.v-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
