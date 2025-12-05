<script setup>
import { Tab, TabContent } from '@/components';
import UseCard from '@/components/Card/use/UseCard.vue';
import UseButton from '@/components/Button/use/UseButton.vue';
import UseTab from '@/components/Tab/use/UseTab.vue';
import UseTextBox from '@/components/TextBox/use/UseTextBox.vue';
import UseTodo from '@/components/Etc/UseTodo.vue';
import UseApi from '@/components/Etc/UseApi.vue';
import UseTechnical from '@/components/Etc/UseTechnical.vue';

const initialTabData = [
  { key: 'ToDo', label: 'To Do List' },
  { key: 'Card', label: 'Card' },
  { key: 'Button', label: 'Button' },
  { key: 'Tab', label: 'Tab' },
  { key: 'TextBox', label: 'TextBox' },
  { key: 'UseApi', label: 'API Setting' },
  { key: 'Technical', label: 'Technical Notes' },
];

const tab = ref(Object.keys(initialTabData)[0]);
</script>
<template>
  <VContainer fluid class="bg-surface-variant">
    <Tab v-model="tab" :data="initialTabData" :direction="'vertical'">
      <TabContent :tabValue="`ToDo`">
        <UseTodo />
      </TabContent>
      <TabContent :tabValue="'Card'">
        <UseCard />
      </TabContent>
      <TabContent :tabValue="'Button'">
        <UseButton />
      </TabContent>
      <TabContent :tabValue="`Tab`">
        <UseTab />
      </TabContent>
      <TabContent :tabValue="`TextBox`">
        <UseTextBox />
      </TabContent>
      <TabContent :tabValue="`UseApi`">
        <UseApi />
      </TabContent>
      <TabContent :tabValue="`Technical`">
        <UseTechnical />
      </TabContent>
    </Tab>
  </VContainer>
</template>
<style lang="sass" scoped></style>
