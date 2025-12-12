<script setup>
import { Tab, TabContent, Button } from '@/components';

const initialTabData = {
  type_1: [
    { key: 't1_tab_1', label: '첫번째' },
    { key: 't1_tab_2', label: '두번째' },
  ],
  type_2: [
    { key: 't2_tab_1', label: '첫번째' },
    { key: 't2_tab_2', label: '두번째' },
    { key: 't2_tab_3', label: '세번째' },
  ],
  type_3: [
    { key: 't3_tab_1', label: '첫번째' },
    { key: 't3_tab_2', label: '두번째' },
    { key: 't3_tab_3', label: '세번째' },
  ],
  type_4: [
    { key: 't4_tab_1', label: '첫번째' },
    { key: 't4_tab_2', label: '두번째' },
  ],
}; 

const tab1 = ref(Object.values(initialTabData.type_1)[0].key);
const tab2 = ref(Object.values(initialTabData.type_2)[0].key);
const tab3 = ref(Object.values(initialTabData.type_3)[0].key);
const tab4 = ref(Object.values(initialTabData.type_4)[0].key);

const hide = ref(false);

const handleContentHide = () => {
  hide.value = !hide.value;
};

const handleBeforeChange = (event) => {
  if (!confirm('탭을 정말로 이동하시겠습니까?')) {
    event.preventDefault();
  }
};
</script>
<template>
  <VCard class="pa-4">
    <VCardItem>
      <VCardTitle>
        <h2>Tab</h2>
      </VCardTitle>
      <VCardSubtitle>
        <VRow>
          <VCol cols="12">test</VCol>
        </VRow>
      </VCardSubtitle>
    </VCardItem>
    <VCardText>
      <ul>
        <li>
          <h3>제목이 있는 경우</h3>
          <VCol cols="12">
            <Tab
              v-model="tab1"
              :data="initialTabData.type_1"
              title="제목"
              :title-color="'grey-lighten-2'"
              color="blue"
              bgColor="grey-darken-2"
            >
              <div class="d-flex flex-row">
                <TabContent
                  class="pa-1"
                  bg-color="red"
                  :tabValue="'t1_tab_1'"
                  :hide="hide"
                >
                  <div>Content for Option One</div>
                </TabContent>
                <TabContent
                  class="pa-1"
                  bg-color="red"
                  :tabValue="'t1_tab_2'"
                  :hide="hide"
                >
                  <div>Content for Option Two</div>
                </TabContent>
                <Button name="Hide" @click="handleContentHide" />
              </div>
            </Tab>
          </VCol>
        </li>
        <li>
          <h3>제목이 없는 경우</h3>
          <VCol cols="12">
            <Tab
              v-model="tab2"
              :data="initialTabData.type_2"
              bg-color="grey-darken-2"
              color="red"
            >
              <TabContent class="pa-1" bg-color="red" :tabValue="'t2_tab_1'">
                <div>Content for Option One</div>
              </TabContent>
              <TabContent class="pa-1" bg-color="red" :tabValue="'t2_tab_2'">
                <div>Content for Option Two</div>
              </TabContent>
              <TabContent class="pa-1" bg-color="red" :tabValue="'t2_tab_3'">
                <div>Content for Option Three</div>
              </TabContent>
            </Tab>
          </VCol>
        </li>
        <li>
          <h3>세로 방향</h3>
          <VCol cols="12">
            <Tab
              v-model="tab3"
              :data="initialTabData.type_3"
              direction="vertical"
              color="red"
              bg-color="grey-darken-2"
            >
              <TabContent class="pa-1" bg-color="red" :tabValue="'t3_tab_1'">
                <div v-for="value in 10">Content for Option {{ value }}</div>
              </TabContent>
              <TabContent class="pa-1" bg-color="red" :tabValue="'t3_tab_2'">
                <div v-for="value in 30">Content for Option {{ value }}</div>
              </TabContent>
              <TabContent class="pa-1" bg-color="red" :tabValue="'t3_tab_3'">
                <div v-for="value in 50">Content for Option {{ value }}</div>
              </TabContent>
            </Tab>
          </VCol>
        </li>
        <li>
          <h3>확인 후 이동</h3>
          <VCol cols="12">
            <Tab
              v-model="tab4"
              :data="initialTabData.type_4"
              color="red"
              bg-color="grey-darken-2"
              @before-change="handleBeforeChange"
            >
              <TabContent class="pa-1" bg-color="red" :tabValue="'t4_tab_1'">
                <div>Content for Option1</div>
              </TabContent>
              <TabContent class="pa-1" bg-color="red" :tabValue="'t4_tab_2'">
                <div>Content for Option2</div>
              </TabContent>
            </Tab>
          </VCol>
        </li>
      </ul>
    </VCardText>
  </VCard>
</template>
<style lang="sass" scoped></style>
