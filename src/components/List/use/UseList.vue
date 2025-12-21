<script setup>
import Card from "@/components/Card/Card.vue";
import List from "@/components/List/List.vue";

const testData = ref([
  {
    name: "Dashboard",
    child: [],
  },
  {
    name: "Products",
    child: [
      {
        name: "Electronics",
        child: [
          { name: "Phones", child: [] },
          { name: "Laptops", child: [] },
        ],
      },
      {
        name: "Clothing",
        child: [
          { name: "Men", child: [] },
          {
            name: "Women",
            child: [{ name: "Dresses", child: [] }],
          },
        ],
      },
    ],
  },
  {
    name: "Settings",
    child: [],
  },
]);

const items = [
  {
    id: 1,
    title: "Applications :",
    children: [
      { id: 2, title: "Calendar : app" },
      { id: 3, title: "Chrome : app" },
      { id: 4, title: "Webstorm : app" },
    ],
  },
  {
    id: 5,
    title: "Documents :",
    children: [
      {
        id: 6,
        title: "vuetify :",
        children: [
          {
            id: 7,
            title: "src :",
            children: [
              { id: 8, title: "index : ts" },
              { id: 9, title: "bootstrap : ts" },
            ],
          },
        ],
      },
      {
        id: 10,
        title: "material2 :",
        children: [
          {
            id: 11,
            title: "src :",
            children: [
              { id: 12, title: "v-btn : ts" },
              { id: 13, title: "v-card : ts" },
              { id: 14, title: "v-window : ts" },
            ],
          },
        ],
      },
    ],
  },
];

const expandAll = ref("collapse");

const handleItemSelected = (dt) => {
  console.log("handleItemSelected", dt);
};
</script>
<template>
  <Card variant="elevated" class="pa-4">
    <VCardTitle>
      <h3>List 사용 예제</h3>
    </VCardTitle>
    <VCardText class="pa-4">
      <VRow>
        <VCol cols="12">
          <Card class="pa-4">
            <VCardTitle>
              <h5>기본 기능</h5>
            </VCardTitle>
            <VCardText>
              <List :data="testData" @selectItem="handleItemSelected" />
            </VCardText>
          </Card>
        </VCol>
        <VCol cols="12">
          <Card class="pa-4">
            <VCardTitle class="d-flex justify-space-between">
              <h5>전체 펼치기</h5>
              <div>
                <VRadioGroup v-model="expandAll" inline>
                  <VRadio label="펼치기" value="expand" />
                  <VRadio label="접기" value="collapse" />
                </VRadioGroup>
              </div>
            </VCardTitle>
            <VCardText>
              <List
                :data="testData"
                :openAll="expandAll === 'expand'"
                :openStrategy="expandAll === 'expand' ? 'multiple' : 'single'"
                @selectItem="handleItemSelected"
              />
            </VCardText>
          </Card>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <Card class="pa-4">
            <VCardTitle> TreeView 사용 예제 </VCardTitle>
            <VCardText>
              <VTreeview :items="items" item-value="id" open-on-click :openAll="expandAll === 'expand'" />
            </VCardText>
          </Card>
        </VCol>
      </VRow>
    </VCardText>
  </Card>
</template>
<style lang="scss" scoped></style>
