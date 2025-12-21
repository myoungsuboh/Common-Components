<script setup>
import InputBox from '@/components/TextBox/InputBox.vue';
import PCol from '../PCol.vue';
    
</script>
<template> 
    <VRow>
        <VCol cols="4" :style="{minWidth: '150px'}">
            <InputBox value="VCol :: cols=4  :style={minWidth='150px'}" readonly/>
        </VCol>
        <VCol cols="4" sm="3">
            <InputBox value="VCol :: cols=4 sm=3" readonly/>
        </VCol>    
        <VCol cols="4" sm="3" md="5">
            <InputBox value="VCol :: cols=4 sm=3 md=5" readonly/>
        </VCol>        
    </VRow>
    <VRow>
        <PCol cols="4" minWidth="150px">
            <InputBox value="PCol :: cols=4 minWidth=150px" readonly/>
        </PCol>    
        <PCol cols="4" sm="3">
            <InputBox value="PCol :: cols=4 sm=3" readonly/>
        </PCol>    
        <PCol cols="4" sm="3" md="5">
            <InputBox value="PCol :: cols=4 sm=3 md=5" readonly/>
        </PCol>                
    </VRow>
    <VRow>
        <PCol cols="3.9" min-width="150px">
            <InputBox value="PCol :: cols=3.9 minWidth=150px" readonly/>
        </PCol>    
        <PCol cols="4.1" sm="3.1"> 
            <InputBox value="PCol :: cols=4.1 sm=3.1" readonly/>  
        </PCol>    
        <PCol cols="4" sm="3" md="5">
            <InputBox value="PCol :: cols=4 sm=3 md=5" readonly/>
        </PCol>                
    </VRow>    
</template>