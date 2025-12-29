<script setup>
import AbstractSelect from '../AbstractSelect.vue';

const value = defineModel({ type: String });
const name = defineModel('name', { type: String });
const age = defineModel('age', { type: Number });

const data = ref()

watch(data, nv => {
    age.value = nv.age;
    name.value = nv.name;
})
  
const items = ref(new Promise(resolve => {
    setTimeout(() => {
        resolve([
            { name: '홍길동', value: '1', age: 18 },
            { name: '임꺽정', value: '2', age: 30 },
            { name: '이순신', value: '3', age: 40 },
        ])
    }, 10) 
}))

</script>
<template>
    <AbstractSelect
        v-model="value" 
        v-model:data="data" 
        :items="items"
        item-value="value"
        item-title="name"
    />

</template>