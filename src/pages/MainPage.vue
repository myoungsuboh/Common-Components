<script setup>
import { Tab, TabContent } from "@/components";
import UseCard from "@/components/Card/use/UseCard.vue";
import UseButton from "@/components/Button/use/UseButton.vue";
import UseTab from "@/components/Tab/use/UseTab.vue";
import UseTextBox from "@/components/TextBox/use/UseTextBox.vue";
import UseTodo from "@/components/Etc/UseTodo.vue";
import UseApi from "@/components/Etc/UseApi.vue";
import UseTechnical from "@/components/Etc/UseTechnical.vue";
import UseList from "@/components/List/use/UseList.vue";
import UseDialog from "@/components/Dialog/use/UseDialog.vue";
import UseExcelUploader from "@/components/ExcelUploader/use/UseExcelUploader.vue";
import TableLayoutCreator from "@/components/TableLayoutCreator/TableLayoutCreator.vue";
import UseWebeditor from "@/components/Webeditor/use/UseWebeditor.vue";
import UsePCol from "@/components/PCol/use/UsePCol.vue";
import UseDatePicker from "@/components/DatePicker/use/UseDatePicker.vue";
import UseAbstractSelect from "@/components/AbstractSelect/use/UseAbstractSelect.vue";
import UseAI from "@/components/AI/use/UseAI.vue";

const initialTabData = [
  { key: "ToDo", label: "To Do List" },
  { key: "Technical", label: "Technical Notes" },
  { key: "UseApi", label: "API Setting" },
  { key: "Card", label: "Card" },
  { key: "Button", label: "Button" },
  { key: "Tab", label: "Tab" },
  { key: "TextBox", label: "TextBox" },
  { key: "List", label: "List" },
  { key: "Dialog", label: "Dialog" },
  { key: "ExcelUploader", label: "ExcelUploader" },
  { key: "TableLayout", label: "TableLayout" },
  { key: "Webeditor", label: "Webeditor" },
  { key: "PCol", label: "PCol" },
  { key: "DatePicker", label: "DatePicker" },
  { key: "AbstractSelect", label: "AbstractSelect" },
  { key: "AI", label: "AI" },
];

const tab = ref(Object.keys(initialTabData)[0]);
</script>
<template>
  <VContainer fluid class="bg-surface-variant">
    <Tab v-model="tab" :data="initialTabData" :direction="'vertical'">
      <TabContent :tabValue="`ToDo`">
        <UseTodo />
      </TabContent>
      <TabContent :tabValue="`Technical`">
        <UseTechnical />
      </TabContent>
      <TabContent :tabValue="`UseApi`">
        <UseApi />
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
      <TabContent :tabValue="`List`">
        <UseList />
      </TabContent>
      <TabContent :tabValue="`Dialog`">
        <UseDialog />
      </TabContent>
      <TabContent tabValue="ExcelUploader">
        <UseExcelUploader />
      </TabContent>
      <TabContent tabValue="TableLayout">
        <TableLayoutCreator />
      </TabContent>
      <TabContent tabValue="Webeditor">
        <UseWebeditor />
      </TabContent>
      <TabContent tabValue="PCol">
        <UsePCol />
      </TabContent>
      <TabContent tabValue="AbstractSelect">
        <UseAbstractSelect />
      </TabContent>
      <TabContent tabValue="DatePicker">
        <UseDatePicker />
      </TabContent>
      <TabContent tabValue="AI">
        <UseAI />
      </TabContent>
    </Tab>
  </VContainer>
</template>
<style lang="sass" scoped></style>
