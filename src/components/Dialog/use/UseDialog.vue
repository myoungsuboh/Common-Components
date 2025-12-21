<script setup>
import Card from "@/components/Card/Card.vue";
import Dialog from "@/components/Dialog/Dialog.vue";
import Button from "@/components/Button/Button.vue";
import CodeHighlight from "vue-code-highlight/src/CodeHighlight.vue";

const FirstDialogOpen = shallowRef(false);
const SecondDialogOpen = shallowRef(false);
const ThirdDialogOpen = shallowRef(false);
const FourthDialogOpen = shallowRef(false);
const MultiDialogOpen = shallowRef(false);
const OrderDialogOpen = shallowRef(false);

const handleFirstOpenModal = () => {
  FirstDialogOpen.value = !FirstDialogOpen.value;
};

const handleSecondOpenModal = () => {
  SecondDialogOpen.value = !SecondDialogOpen.value;
};

const handleThirdOpenModal = () => {
  ThirdDialogOpen.value = !ThirdDialogOpen.value;
};

const handleFourthOpenModal = () => {
  FourthDialogOpen.value = !FourthDialogOpen.value;
};

const handleMultiOpenModal = () => {
  MultiDialogOpen.value = !MultiDialogOpen.value;
};

const handleOtherOpenModal = () => {
  OrderDialogOpen.value = !OrderDialogOpen.value;
};
</script>
<template>
  <Card variant="elevated" class="pa-4">
    <VRow class="mb-4">
      <VCol cols="12">
        <h2>Dialog 사용 예제</h2>
        <p>Dialog 컴포넌트의 다양한 사용 예제를 확인할 수 있습니다.</p>
      </VCol>
      <VCol cols="12">
        <Button name="Used TemplateId Dialog" variant="outlined" @click="handleFirstOpenModal" />
      </VCol>
      <VCol cols="12">
        <Button name="UnUsed TemplateId Dialog" variant="outlined" @click="handleSecondOpenModal" />
      </VCol>
      <VCol cols="12">
        <Button name="Used CardTag Dialog" variant="outlined" @click="handleThirdOpenModal" />
      </VCol>
      <VCol cols="12">
        <Button name="Move Dialog" variant="outlined" @click="handleFourthOpenModal" />
      </VCol>
    </VRow>
    <!-- Used TemplateId Dialog -->
    <Dialog v-model="FirstDialogOpen" persistent maxWidth="800">
      <template #header>
        <div class="pa-1">
          <h3>template id 사용</h3>
        </div>
      </template>
      <template #body>
        <VCardText class="bg-black">
          <CodeHighlight>
            {{ `
            <Dialog>
              <template #header><</template>
              <template #body><</template>
              <template #footer><</template>
            </Dialog>
            ` }}
          </CodeHighlight>
        </VCardText>
      </template>
      <template #footer>
        <Button text="Agree" @click="handleFirstOpenModal" />
      </template>
    </Dialog>
    <!-- UnUsed TemplateId Dialog -->
    <Dialog v-model="SecondDialogOpen" maxWidth="800">
      <Card variant="elevated" class="pa-4">
        <div class="pb-4">
          <h3>template id 미사용(slot으로만 처리)</h3>
        </div>
        <VCardText class="bg-black">
          <CodeHighlight>
            {{ `
            <Dialog>
              <Card> Body 내용 하단 버튼 </Card>
            </Dialog>
            ` }}
          </CodeHighlight>
        </VCardText>
        <div class="d-flex justify-end mt-4">
          <Button name="확인" variant="outlined" @click="handleSecondOpenModal" />
        </div>
      </Card>
    </Dialog>
    <!-- Used CardTag Dialog -->
    <Dialog v-model="ThirdDialogOpen" scrollable>
      <Card variant="elevated">
        <VCardTitle>
          <h3>Card Tag 사용 및 스크롤 확인</h3>
        </VCardTitle>
        <VCardText class="bg-black">
          <h3>내용이 길어지면 스크롤 생깁니다.</h3>
          <br />
          <br />
          <span>
            <div v-for="value in 20">
              <p>Let Google help apps determine location.</p>
              <br />
              <p>This means sending anonymous</p>
              <br />
            </div>
          </span>
        </VCardText>
        <VCardActions>
          <Button name="닫기" variant="outlined" @click="handleThirdOpenModal" />
        </VCardActions>
      </Card>
    </Dialog>
    <!-- Move Dialog -->
    <Dialog v-model="FourthDialogOpen" maxWidth="800">
      <Card variant="elevated" class="pa-4" draggable>
        <VCardTitle>
          <h3>Dialog move</h3>
          <small class="text-caption"> ※ 이 다이얼로그는 마우스로 이동할 수 있습니다 </small>
        </VCardTitle>
        <VCardText class="bg-black">
          <CodeHighlight>
            {{ `
            <Dialog>
              <Card draggable />
            </Dialog>

            Dialog 컴포넌트 바로 아래 Card 컴포넌트가 있어야 Drag 기능이 동작합니다. 즉. v-card-title 태그의 부모 요소가 Dialog 인 경우만 드래그
            핸들로 인식됩니다. ` }}
          </CodeHighlight>
          <br />
          <Card
            prepend-icon="mdi-map-marker"
            text="Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running."
            title="Use Google's location service?"
          />
        </VCardText>
        <VCardActions>
          <Button name="닫기" variant="outlined" @click="handleFourthOpenModal" />
        </VCardActions>
      </Card>
    </Dialog>
  </Card>
</template>
<style lang="scss" scoped></style>
