<script setup>
import Button from '@/components/Button/Button.vue';
import ExcelUploader from '../ExcelUploader.vue';


const str = ref();


const onSuccess = data => {
    str.value = JSON.stringify(data, null, 2)
}

</script>

<template>
    <ExcelUploader @on-success="onSuccess" class="mx-2">
        <Button>기본</Button>
    </ExcelUploader>
    <ExcelUploader @on-success="onSuccess" class="mx-2" :header="0">
        <Button>0번째행을 키로</Button>
    </ExcelUploader>
    <ExcelUploader @on-success="onSuccess" class="mx-2" :header="[null, 'testB', null, 'testD', null, 'testF']">
        <Button>키배열 사용  [null, 'testB', null, 'testD', null, 'testF']</Button>
    </ExcelUploader>
    <ExcelUploader @on-success="onSuccess" class="mx-2" :header="{B: 'testBB', E: 'testEE'}">
        <Button>키맵핑오브젝트사용 {B: 'testBB', E: 'testEE'}</Button>
    </ExcelUploader>
    <br/>
    <pre>{{ str }}</pre>
</template>