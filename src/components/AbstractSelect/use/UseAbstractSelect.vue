<script setup>
import SampleSelect from './SampleSelect.vue';
import SampleSelect2 from './SampleSelect2.vue';

const userId = ref('3')
const name = ref()
const age = ref()
const sub = ref('G')

</script>
<template>
    <VRow>
        <VCol cols="2">
            <SampleSelect
                v-model="userId"
                v-model:name="name"
                v-model:age="age" 
            />
        </VCol>
        <VCol cols="3">
            <SampleSelect2
                v-model="sub"
                first-item="ALL"
                :user="userId"
            />
        </VCol>
    </VRow>
    {{ userId }} - {{ name }} - {{ age }} - {{ sub }}
</template>