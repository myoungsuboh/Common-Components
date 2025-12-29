<script setup>
import AbstractSelect from '../AbstractSelect.vue';

const props = defineProps({
    user: {
        type: String
    }
})

const value = defineModel({ type: String });

const items = ref()
  
const call = userId => {
    return new Promise(resolve => {
        setTimeout(() => {
            if(props.user === '1') resolve([ {name:'제주도', value: 'J'}, {name:'독도', value: 'D'} ]);
            else if(props.user === '2') resolve([ {name:'한라산', value: 'H'}, {name:'설악산', value: 'S'} ]);
            else if(props.user === '3') resolve([ {name:'경상도', value: 'K'}, {name:'전라도', value: 'G'} ]);
        }, 1000)
    })
}

watch(() => props.user, nv => {
    items.value = call(nv);
}, { immediate: true })
</script>
<template>
    <AbstractSelect
        v-model="value" 
        :items="items"
        item-value="value"
        item-title="name"
    />

</template>