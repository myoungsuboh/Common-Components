<script setup>
import axios from "axios";
import { Button } from "@/components";

const webhookURL = `https://pills-edit-enlargement-gem.trycloudflare.com/webhook/postMail`;

const props = defineProps({
  payload: {
    type: String,
    required: true,
    default: "",
  },
});

const emit = defineEmits(["returnAns"]);

const fnCallHnixChat = async () => {
  try {
    const mySessionId = "user_" + Math.random().toString(36).substr(2, 9);

    const res = await axios.post(
      webhookURL,
      { message: props.payload, sessionId: mySessionId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("AI 답변:", res.data);
    if (res.data && res.data.answer) emit("returnAns", res.data.answer);
  } catch (e) {
    console.error("Error fetching data:", e);
  }
};
</script>

<template>
  <Button @click="fnCallHnixChat">Send Webhook Request</Button>
</template>
