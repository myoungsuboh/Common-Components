<script setup>
import InputBox from '@/components/TextBox/InputBox.vue';
import TextInputBox from '@/components/TextBox/TextInputBox.vue';
import NumberInputBox from '@/components/TextBox/NumberInputBox.vue';
import EmailInputBox from '@/components/TextBox/EmailInputBox.vue';
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
      <ul>
        <li>
          <h3>InputBox</h3>
          <VCol cols="12">
            <InputBox />
          </VCol>
        </li>
        <li>
          <h3>TextInputBox</h3>
          <VCol cols="12">
            <TextInputBox />
          </VCol>
        </li>
        <li>
          <h3>NumberInputBox</h3>
          <VCol cols="12">
            <NumberInputBox />
          </VCol>
        </li>
        <li>
          <h3>EmailInputBox</h3>
          <VCol cols="12">
            <EmailInputBox />
          </VCol>
        </li>
      </ul>
    </template>
  </VCard>
</template>
<style lang="sass" scoped></style>
