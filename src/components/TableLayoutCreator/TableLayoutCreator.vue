<script setup>
import RealGrid from "realgrid"; 
import { RealGridVue, RGDataColumn, RGDataField } from "realgrid-vue";  
import ExcelUploader from "../ExcelUploader/ExcelUploader.vue";  
import JSZipLocal from 'jszip'; 

if (typeof window !== 'undefined') window.JSZip = JSZipLocal
else globalThis.JSZip = JSZipLocal

const projName = ref('프로젝트명')
const fileName = ref('Table 정의서')
const sheetPerFile = ref(100)
const realgridLicense = ref('upVcPE+wPOmtLjqyBIh9RkM/nBOseBrflwxYpzGZyYm9cY8amGDkiMnVeQKUHJDjW2y71jtk+wte7L7C4dZzvNXYAqakByTtH3gSNyedP2895QMPfk524MuXaPMiwUi5seuxZlH00cb24/pnD9YCHg==')
const isInitGird = ref(false)

const refGrid = reactive([]);
const indices = ref();
  
const columns = [
    {
        header: { "text": "No" },
        name: "no",
        width: 50,
        isColumn: true,
        editable: false,
        exportStyleName: "extb-contents",
    },
    {
        header: { "text": "Field ID" },
        name: "columnName",
        width: 180,
        isColumn: true,
        editable: false,
        exportStyleName: 'extb-left extb-contents'
    },
    {
        header: { "text": "Key" },
        name: "pkFlag",
        width: 50,
        isColumn: true,
        editable: false,
        exportStyleName: 'extb-contents'
    },
    {
        header: { "text": "Data Type" },
        name: "columnDataType",
        width: 140,
        isColumn: true,
        editable: false,
        exportStyleName: 'extb-left extb-contents'
    },
    {
        header: { "text": "Null" },
        name: "nullFlag",
        width: 50,
        isColumn: true,
        editable: false,
        exportStyleName: 'extb-contents'
    },
    {
        header: { "text": "Default" },
        name: "dataDefault",
        width: 140,
        isColumn: true,
        editable: false,
        exportStyleName: "extb-contents"
    },
    {
        header: { "text": "Field Description" },
        name: "columnComments",
        width: 250,
        isColumn: true,
        editable: false,
        exportStyleName: "extb-left extb-contents"
    },
    {
        header: { "text": "Remark" },
        name: "remark",
        width: 180,
        isColumn: true,
        editable: false,
        exportStyleName: "extb-left extb-contents"
    }
];

const initGrid = () => {
    if(!isInitGird.value){
        indices.value = Array.from({ length: sheetPerFile.value }, (_, index) => index)
        RealGrid.setLicenseKey(realgridLicense.value);
        isInitGird.value = true;
    }
}

const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const tableGroups = []
let tables = []

const success = rows => {
    //console.log("success  ", rows)

    const today = getToday()

    let tableName = ''
    let no = 0

    rows.forEach(row => {
        if(row.tableName !== tableName){

            if(no != 0 && tables.length % sheetPerFile.value === 0) {
                tableGroups.push(tables)
                tables = []
            }

            tableName = row.tableName
            tables.push({
                tableName: row.tableName,
                tablespaceName: row.tablespaceName,
                tableComments: row.tableComments,
                constraintDesc: row.constraintDesc,
                today: today,
                rows: [],
            })
            no = 1
        }
        const tableRows = tables[tables.length-1].rows
        tableRows.push({
            no: no++,
            columnName: row.columnName,
            pkFlag: row.pkFlag,
            columnDataType: row.columnDataType,
            nullFlag: row.nullFlag,
            dataDefault: row.dataDefault,
            columnComments: row.columnComments,
            remark: row.remark
        })
    })
    tableGroups.push(tables)

    exportExcel()
}

const _exportExcel = (tableGroup, idx) => {

    const exportGridData = []

    let gridIdx = 0

    tableGroup.forEach(table => {

        //console.log("table", table);

        exportGridData.push({
            yOffset: 6,
            sheetName: table.tableName,
            grid: refGrid[gridIdx++].gridView,
            indicator: 'hidden',
            footer: 'hidden',
            userCellsCallback: function(grid, rowCount, colCount, sheetName) {
                return [
                    { row: 0, col: 0, value: `■ 프로젝트명 : ${projName.value}`, mergeCol: colCount, height: 25, styleName: 'extb-title' },
                    { row: 1, col: 0, value: 'Table 정의서', mergeCol: colCount, height: 40, styleName: 'extb-title2 extb-left-line extb-right-line' },

                    { row: 2, col: 0, value: 'Table ID', mergeCol: 2, height: 16.5, styleName: 'extb-head-label extb-left-line' },
                    { row: 2, col: 2, value: table.tableName, mergeCol: 4, height: 16.5, styleName: 'extb-head-value' },
                    { row: 2, col: 6, value: '작성일자', mergeCol: 1, height: 16.5, styleName: 'extb-head-label' },
                    { row: 2, col: 7, value: table.today, mergeCol: 1, height: 16.5, styleName: 'extb-head-label extb-right-line' },

                    { row: 3, col: 0, value: 'Tab Space', mergeCol: 2, height: 16.5, styleName: 'extb-head-label extb-left-line' },
                    { row: 3, col: 2, value: table.tablespaceName, mergeCol: 4, height: 16.5, styleName: 'extb-head-value' },
                    { row: 3, col: 6, value: '수정일자', mergeCol: 1, height: 16.5, styleName: 'extb-head-label' },
                    { row: 3, col: 7, value: table.today, mergeCol: 1, height: 16.5, styleName: 'extb-head-label extb-right-line' },

                    { row: 4, col: 0, value: 'Table Name', mergeCol: 2, height: 16.5, styleName: 'extb-head-label extb-left-line' },
                    { row: 4, col: 2, value: table.tableComments, mergeCol: colCount - 2, height: 16.5, styleName: 'extb-head-value extb-right-line' },

                    { row: 5, col: 0, value: 'INDEX KEY', mergeCol: 2, height: 40, styleName: 'extb-head-label extb-left-line' },
                    { row: 5, col: 2, value: table.constraintDesc, mergeCol: colCount - 2, height: 16.5, styleName: 'extb-head-value extb-no-bold extb-right-line' },
                ]
            },
        })
    });

    RealGrid.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: `${fileName.value}${idx}.xlsx`,
        exportGrids: exportGridData,
    })
}

const exportExcel = () => {

    refGrid.forEach(grid => {
        grid.gridView.getDataSource().clearRows()
    });

    let groupIdx = ''
    tableGroups.forEach(tableGroup => {
        let idx = 0

        tableGroup.forEach(table => {
            if(refGrid[idx]) refGrid[idx++].gridView.getDataSource().setRows(table.rows)
        })

        _exportExcel(tableGroup, groupIdx)

        groupIdx = ` ${Number(groupIdx.trim() || 0) + 1}`
    });

    nextTick(() => refGrid.forEach(grid => grid.gridView.getDataSource().clearRows()));
}

const checkMinMax = () => {
    if(sheetPerFile.value < 0) sheetPerFile.value = 0;
    if(sheetPerFile.value > 200) sheetPerFile.value = 200;
}

</script>
<template>
    <div style="display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center;" v-show="!isInitGird">
            <label style="flex: 0 0 150px;">RealGrid2 라이센스</label>
            <input style="flex: 1" type="text" v-model="realgridLicense"/>
        </div>
        <div style="display: flex; align-items: center;" v-show="isInitGird">
            <label style="flex: 0 0 150px;">프로젝트명</label>
            <input style="flex: 1" type="text" v-model="projName"/>
        </div>
        <div style="display: flex; align-items: center;" v-show="isInitGird">
            <label style="flex: 0 0 150px;">파일명</label>
            <input style="flex: 1" type="text" v-model="fileName"/>
        </div>        
    </div>
    <div style="display: flex;">
        <div style="display: flex; align-items: center;" v-show="!isInitGird">
            <label style="flex: 0 0 150px;">파일당 시트 수</label>
            <input style="flex: 0 0 150px;" type="number" min="0" max="200" v-model="sheetPerFile" @input="checkMinMax"/>
            &nbsp;
            <input v-show="!isInitGird" type="button" value="그리드 생성" @click="initGrid"/>
            &nbsp;<label>( 엑셀에서 허용하는 시트 수와 파일의 크기 고려 해서 결정 )</label>
        </div>
        <ExcelUploader
            v-show="isInitGird"  
            :header="{
                A: 'tablespaceName',
                B: 'tableName',
                C: 'tableComments',
                D: 'no',
                E: 'columnName',
                F: 'columnDataType',
                G: 'nullFlag',
                H: 'columnComments',
                I: 'pkFlag',
                J: 'constraintDesc',
                K: 'dataDefault',
                L: 'remark',
            }"
            @on-success="success"
            >
            <input type="button" value="엑셀파일 선택"/>
        </ExcelUploader>    
    </div>

    <div v-if="isInitGird" v-show="false">
        <RealGridVue
            v-for="idx in indices"
            :key="idx"
            :ref="el => { if (el) refGrid.push(el) }"
            :auto-generate-field="false"
        >
            <RGDataField
                v-for="item in columns"
                :key="item.name"
                :field-name="item.name"
            />
            <RGDataColumn
                v-for="item in columns.filter(el => el.isColumn)"
                :key="item.name"
                :field-name="item.name"
                :header="item.header"
                :width="item.width"
                :exportStyleName="item.exportStyleName"
            />
        </RealGridVue>
    </div>
</template>

<style scoped>
div {
    margin-bottom:  5px;
}    

input {
    border: 1px white solid;
    padding: 3px 5px;
    color: white;
}
</style>

<style>
@import "realgrid/realgrid-style.css";

/* .rg-header .rg-table tr td {
    background-color: #178E5F;
    font-family: 'HD Light';
    color: white;
    font-weight: normal;
    border-right: 1px rgba(188,192,200) solid;
} */

.extb-left {
    text-align: left;
}

.extb-title {
    font-size: 12pt;
    font-family: 'HD현대체 Light';
    font-weight: bold;
    border: 1px rgba(110,119,134) solid;
    border-bottom: 1px rgba(188,192,200) solid;
}

.extb-left-line {
    border-left: 1px rgba(110,119,134) solid;
}

.extb-right-line {
    border-right: 1px rgba(110,119,134) solid;
}

.extb-title2 {
    font-family: 'HD Light';
    font-weight: bold;
    font-size: 18pt;
    color: white;
    background-color: #178E5F;
    text-align: center;
    border: 1px rgba(188,192,200) solid;
}

.extb-head-label {
    font-family: 'HD Light';
    font-weight: bold;
    font-size: 10pt;
    text-align: center;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px rgba(188,192,200) solid;
}

.extb-head-value {
    font-size: 10pt;
    font-family: 'HD Light';
    font-weight: bold;
    border: 1px rgba(188,192,200) solid;
    text-align: left;
}

.extb-no-bold {
    font-weight: normal;
}

.extb-contents {
    font-family: 'HD Light';
    font-size: 9pt;
}
</style>
