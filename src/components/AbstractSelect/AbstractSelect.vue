<script setup>
const props = defineProps({
    items: {
        type: [Array, Function, Promise],
        default: () => [],
    },
    firstItem: {
        type: String,
        default: 'NONE',
        validator: value => ['NONE', 'ALL', 'SELECT'].includes(value),
    },
    itemTitle: {
        type: String,
    },
    itemValue: {
        type: [String, Number, Date],
    },
})

//로딩처리
const isLoading = ref(false)

const data = defineModel('data', { type: Object });
const value = defineModel({ type: [String, Number, Date] });

const localItems = ref([])

// props.items를 감지해서 함수이거나 Promise이면 실제 데이터를 가져옴 ( 그동안 로딩 처리 )
watch(() => props.items, async newItems => {
    isLoading.value = true;
    try{
        let resolvedItems = newItems;
        if (typeof newItems === 'function') resolvedItems = newItems(); // items가 함수라면 실행
    
        if (Array.isArray(resolvedItems)) localItems.value = resolvedItems;  // 일반 배열인 경우 즉시 할당
        else if (typeof resolvedItems?.then === 'function') localItems.value = await resolvedItems;  // Promise인 경우 데이터 로딩 대기

    } catch (error) {
        localItems.value = [];
    }finally{
        isLoading.value = false;
    }
}, { immediate: true });

// first item이 포함된 전체 itmes 
const _items = computed(() => {
    const arr = [];
    
    if (props.firstItem !== 'NONE') {
        const firstItem = {};
        firstItem[props.itemValue] = null;

        if (props.firstItem === 'ALL') firstItem[props.itemTitle] = '전체';
        else if (props.firstItem === 'SELECT') firstItem[props.itemTitle] = '선택';
        
        arr.push(firstItem);
    }

    arr.push(...localItems.value);
    
    return arr;
});

let remember = null

//로딩 시작할때 value를 제거했다가 로딩 완료후 설정
//items가 조회되기 전까지 코드값이 노출되다가 이름으로 바뀌는 현상 방지
watch(isLoading, nv => {
    if(nv === true) {  
        remember = value.value;
        value.value = null;
    }
    else if(nv === false) {
        if(_items.value.find(item => item[props.itemValue] === remember)) value.value = remember
        remember = null;
    }
}, { immediate: true })  

watch(value, nv => {
    data.value = _items.value.find(item => item[props.itemValue] === nv) || {};
}, {immediate: true})
  
</script>
<template>
    <VAutocomplete
        v-model="value"
        :items="_items"
        :loading="isLoading" 
        :readonly="isLoading"
        :item-value="props.itemValue"
        :item-title="props.itemTitle"
    />
</template>