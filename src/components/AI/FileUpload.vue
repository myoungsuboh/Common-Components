<script setup>
import { ref } from "vue";
import axios from "axios";
import { Button } from "@/components";

// n8n Webhook URL
const webhookURL = `https://exclusively-ron-dialogue-headset.trycloudflare.com/webhook/fileUpload`;

const props = defineProps({
  payload: {
    type: String,
    required: false, // 파일 업로드가 주 목적이라 false로 변경했지만, 필요하면 true 유지
    default: "",
  },
});

const emit = defineEmits(["returnAns"]);

// 선택된 파일을 저장할 변수
const selectedFile = ref(null);

// 파일 선택 시 실행되는 함수
const handleFileChange = (event) => {
  if (event.target.files && event.target.files[0]) {
    selectedFile.value = event.target.files[0];
    console.log("파일 선택됨:", selectedFile.value.name);
  }
};

// n8n으로 파일 및 데이터 전송
const fnCallHnixChat = async () => {
  if (!selectedFile.value) {
    alert("파일을 먼저 선택해주세요!");
    return;
  }

  try {
    const mySessionId = "user_" + Math.random().toString(36).substr(2, 9);

    // 1. FormData 객체 생성 (파일 전송 필수)
    const formData = new FormData();

    // 2. 데이터 추가 (n8n Webhook 노드의 Binary 탭에서 받을 이름이 'data'가 됩니다)
    formData.append("data", selectedFile.value);

    // 3. 추가 정보가 필요하면 같이 보냅니다 (JSON 탭에서 확인 가능)
    formData.append("sessionId", mySessionId);
    if (props.payload) {
      formData.append("message", props.payload);
    }

    // 4. Axios 전송 (multipart/form-data)
    const res = await axios.post(webhookURL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("AI 답변:", res.data);

    if (res.data && res.data.answer) emit("returnAns", res.data.answer);
  } catch (e) {
    console.error("Error uploading file:", e);
    alert("파일 업로드 중 오류가 발생했습니다.");
  }
};
</script>

<template>
  <div class="upload-container">
    <input type="file" @change="handleFileChange" class="mb-2" />

    <Button @click="fnCallHnixChat" :disabled="!selectedFile"> Upload File to n8n </Button>
  </div>
</template>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
</style>
