<template>
  <div class="excel-uploader">
    <div @click="triggerFileSelect" class="trigger-wrapper">
      <slot>
        엑셀 파일 선택
      </slot>
    </div>

    <input
      ref="fileInput"
      v-show="false"
      type="file"
      accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as XLSX from 'xlsx';
/* *************************************************************************************************************** 
만약 한글이 깨진다면 전체 언어팩(cpexcel) import (빌드과정에서 번들러가 언어 변환 사전(Codepage Table)"을 제외했기 때문)
import 'xlsx/dist/cpexcel'; 
******************************************************************************************************************/

const props = defineProps({
    /**
     * 읽혀진 데이터의 json key 
     * 
     * 숫자인경우 행번호헤 해당하는 데이터를 key로 사용. 예) 0 
     * 
     * 배열인경우 컬럼인덱스에 맞춰 해당 배열의 요소를 key로 사용. 예 ['empNo', null, 'deptCd'] (null로 지정된 인덱스는 무시)
     * 
     * 오브젝트인경우 열 매칭. 예) {A: 'empNo', C: 'deptCd'}
     */
    header: { 
        default: null,
    },
    /** <pre>
     * 데이터가 시작하는 행 
     * 
     * 헤더행과 무관한 엑셀에서의 행번호 절대값
     * 
     * 디폴트는 1
     * </pre>
     * */
    start: {
        type: Number,
        default: 1,
    },
});

const emit = defineEmits(['on-success', 'on-error']);
const fileInput = ref(null);

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const getSheetRange = worksheet => {

    const sheetRange = XLSX.utils.decode_range(worksheet['!ref']);
  
    const sheetRangeInfo = {
        header: 'A',
        startRow: props.start,
        endRow: sheetRange.e.r,
        startCol: sheetRange.s.c, 
        endCol: sheetRange.e.c,
    }
  
    //헤더설정이 number이면 해당 행을 헤더로 사용
    if(typeof props.header === 'number' ) {
      const headerRowIndex = props.header; 
        
      const headerValues = [];
      let col = sheetRange.s.c; // A열부터 시작
      
      // 엑셀 범위 끝까지 순회하며 헤더 값을 추출
      while (col <= sheetRange.e.c) {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
          headerValues.push(worksheet[cellAddress]?.v || null);
          col++;
      }
      
      // 생성된 배열에서 null이 아닌 값의 최소/최대 인덱스를 찾아 범위 조정
      const minIdx = headerValues.findIndex(v => v !== null);
      const maxIdx = headerValues.findLastIndex(v => v !== null);
        
      if (minIdx !== -1) {
          sheetRangeInfo.startCol = sheetRange.s.c + minIdx; // 시작 열 인덱스 조정
          sheetRangeInfo.endCol = sheetRange.s.c + maxIdx;   // 끝 열 인덱스 조정
          sheetRangeInfo.header = headerValues.slice(minIdx, maxIdx + 1);
      }  
    }
    //헤더설정이 Array이면
    else if(Array.isArray(props.header) && props.header.length > 0) {
      sheetRangeInfo.startCol = props.header.findIndex(el => el !== null);
      sheetRangeInfo.endCol = props.header.findLastIndex(el => el !== null);
      sheetRangeInfo.header = props.header.slice(sheetRangeInfo.startCol);
    }
    //헤더설정이 Object이면
    else if(props.header?.constructor === Object ) {
      const headerKeys = Object.keys(props.header).filter(k => k.length > 0);

      //속성이 없는 빈 Object가 아니면
      if (headerKeys.length > 0) {
        //열 알파벳 -> 열 인덱스 (A=0, B=1, F=5)
        const colIndices = headerKeys.map(col => XLSX.utils.decode_col(col)); 
        const maxColIndex = Math.max(...colIndices);
        
        //headerArray 생성
        const arr = Array(maxColIndex + 1).fill(null); 
  
        for (const [excelCol, jsonKey] of Object.entries(props.header)) {
            const index = XLSX.utils.decode_col(excelCol);
            if (index <= maxColIndex) arr[index] = jsonKey;
        }
  
        sheetRangeInfo.startCol = Math.min(...colIndices);
        sheetRangeInfo.endCol = maxColIndex;
        sheetRangeInfo.header = arr.slice(sheetRangeInfo.startCol);
      }
    }

    return sheetRangeInfo;
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      
      // XLSX.read는 .xlsx, .xls, .csv 모두 자동으로 감지하여 파싱합니다.
      const workbook = XLSX.read(data, { 
        type: 'array',
        codepage: 949, // .xlsx 파일은 무시하고, .xls 파일 중 인코딩이 불명확한 경우 한국어로 해석'
        cellText: true,
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const sheetRange = getSheetRange(worksheet);

      // raw: false로 설정하면 엑셀에 보이는 텍스트 그대로(날짜 등 포맷 포함) 가져옵니다.
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: sheetRange.header,
        range: {  
            s: { r: sheetRange.startRow, c: sheetRange.startCol },
            e: { r: sheetRange.endRow  , c: sheetRange.endCol   },
        }
      }); 

      emit('on-success', jsonData);

    } catch (error) {
      console.error('Excel Parsing Error:', error);
      emit('on-error', error);
    } finally {
        fileInput.value.value = '';
    }
  };

  reader.onerror = (error) => {
    emit('on-error', error);
  };

  reader.readAsArrayBuffer(file);
};
</script>

<style scoped>
.trigger-wrapper {
  display: inline-block;
  cursor: pointer;
}
</style>