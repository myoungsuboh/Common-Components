<script setup>
import Button from '@/components/Button/Button.vue';
import Webeditor from '../Webeditor.vue';

const data = ref(null)
const rd = ref(true)
</script>
<template>
    <input></input>
    <Webeditor v-model="data" height="500px" :readonly="rd"></Webeditor>
    <br></br>
    <Button @click="rd = !rd">Readonly 토글</button>
    {{ data }}
</template>