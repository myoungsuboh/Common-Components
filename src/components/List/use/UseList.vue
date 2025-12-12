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
          { name: 'Phones', child: [] }, // Leaf
          { name: 'Laptops', child: [] }, // Leaf
        ],
      },
      {
        name: 'Clothing',
        child: [
          { name: 'Men', child: [] }, // Leaf
          {
            name: 'Women',
            child: [
              { name: 'Dresses', child: [] }, // Deeper Leaf
            ],
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

const handleItemSelected = (dt) => {
  console.log('handleItemSelected', dt);
};
</script>
<template>
  <Card>
    <List
      :data="testData"
      selected="handleSelected"
      @selectItem="handleItemSelected"
    />
  </Card>
</template>
<style lang=""></style>
