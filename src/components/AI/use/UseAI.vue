<script setup>
import MailAI from "@/components/AI/MailAI.vue";
import ImgMailAI from "@/components/AI/ImgMailAI.vue";
import WelfareAI from "@/components/AI/WelfareAI.vue";
import Card from "@/components/Card/Card.vue";
import TextInputBox from "@/components/TextBox/TextInputBox.vue";
const welfareTextValue = ref("칠순에 얼마 받아");
const mailTextValue = ref("");
const imgMailTextValue = ref("메일을 보낼 거야 아래 내용 참고해서 메일 전달해줘  1 귀여운 동물이 일하는 이미지를 첨부 2 제목은 오늘 하루도 열일하세요 3 업무에 집중하라는 내용 4 업무 시간은 오전 8시  오후 5시");

const mailAns = ref("");
const imgMailAns = ref("");
const welfareAns = ref("");

const handleWelfareAns = (ans) => {
  welfareAns.value = ans;
};

const handleMailAns = (ans) => {
  mailAns.value = ans;
};

const handleImgMailAns = (ans) => {
  imgMailAns.value = ans;
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
            <h4>복지 답변 AI Boot</h4>
            <VCardText>
              <TextInputBox v-model:value="welfareTextValue" />
              <WelfareAI :payload="welfareTextValue" @returnAns="handleWelfareAns" />
              <br />
              <br />
              <br />
              <br />
              AI 대답 : {{ welfareAns }}
            </VCardText>
          </Card>
        </VCol>
        <VCol cols="12">
          <Card class="pa-4">
            <h4>메일 전달 AI Boot</h4>
            <VCardText>
              <TextInputBox v-model:value="mailTextValue" />
              <MailAI :payload="mailTextValue" @returnAns="handleMailAns" />
              <br />
              <br />
              <br />
              <br />
              AI 대답 : {{ mailAns }}
            </VCardText>
          </Card>
        </VCol>
        <VCol cols="12">
          <Card class="pa-4">
            <h4>이미지 메일 전달 AI Boot</h4>
            <VCardText>
              <TextInputBox v-model:value="imgMailTextValue" />
              <ImgMailAI :payload="imgMailTextValue" @returnAns="handleImgMailAns" />
              <br />
              <br />
              <br />
              <br />
              AI 대답 : {{ imgMailAns }}
            </VCardText>
          </Card>
        </VCol>
      </VRow>
    </VCardText>
  </Card>
</template>
<style lang="scss" scoped></style>
