<script setup>
import Card from '@/components/Card/Card.vue';
import List from '@/components/List/List.vue';

const testData = ref([
  {
    name: 'Dashboard',
    child: [],
  },
  {
    name: 'Products',
    child: [
      {
        name: 'Electronics',
        child: [
          { name: 'Phones', child: [] },
          { name: 'Laptops', child: [] },
        ],
      },
      {
        name: 'Clothing',
        child: [
          { name: 'Men', child: [] },
          {
            name: 'Women',
            child: [{ name: 'Dresses', child: [] }],
          },
        ],
      },
    ],
  },
  {
    name: 'Settings',
    child: [],
  },
]);

const expandAll = ref('collapse');

const handleItemSelected = (dt) => {
  console.log('handleItemSelected', dt);
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
                @selectItem="handleItemSelected"
              />
            </VCardText>
          </Card>
        </VCol>
        <VCol cols="12">
          <Card class="pa-4">
            <VCardTitle class="d-flex justify-space-between">
              <h5>고정</h5>
            </VCardTitle>
            <VCardText>
              <List
                :data="testData"
                openAll
                :openStrategy="'multiple'"
                @selectItem="handleItemSelected"
              />
            </VCardText>
          </Card>
        </VCol>
      </VRow>
    </VCardText>
  </Card>
</template>
<style lang=""></style>
