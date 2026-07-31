<script setup>
import { ref, computed } from "vue";
import CodeCard from "./CodeCard.vue";

import Button from "@/components/Button/Button.vue";
import ExcelUploader from "@/components/ExcelUploader/ExcelUploader.vue";
import SlickGrid from "../SlickGrid.vue";

/* ---------------------------------------------------------------------------------------------------------------
케이스 그룹

케이스가 많아 유형별로 묶었습니다.
Tab(VTabsWindowItem)은 지연 렌더링이라 선택한 탭의 그리드만 생성됩니다.
숨겨진 컨테이너에서 그리드를 만들면 폭을 0으로 계산해 컬럼이 찌그러지므로 이 편이 안전합니다.
--------------------------------------------------------------------------------------------------------------- */
const SECTIONS = [
  { key: "guide", label: "가이드" },
  { key: "basic", label: "기본" },
  { key: "search", label: "조회 · 필터" },
  { key: "crud", label: "선택 · CRUD" },
  { key: "edit", label: "편집" },
  { key: "cell", label: "셀 표현" },
  { key: "excel", label: "엑셀" },
  { key: "view", label: "표시 · 성능" },
  { key: "extend", label: "확장" },
];

const section = ref("guide");

/* ---------------------------------------------------------------------------------------------------------------
가이드 탭 내용
--------------------------------------------------------------------------------------------------------------- */
const installCode = `# 세 패키지의 버전을 반드시 일치시킵니다
pnpm add slickgrid-vue@10.8.3 @slickgrid-universal/common@10.8.3 @slickgrid-universal/excel-export@10.8.3

# 아이콘 폰트도 필요합니다 (그리드 메뉴의 정렬/숨기기 아이콘이 이 폰트로 그려집니다)
pnpm add @mdi/font
# main.js 에서:  import '@mdi/font/css/materialdesignicons.css';

# @slickgrid-universal/common 을 "직접 의존성"으로 설치하는 이유
#   CSS 테마 파일을 import 하는데, pnpm은 전이 의존성을 top-level node_modules에 두지 않아
#   (strict isolation) 직접 설치하지 않으면 CSS import가 실패합니다.

# [중요] 테마는 반드시 ".lite" 버전을 씁니다 (SlickGrid.vue 가 이미 그렇게 import 함)
#   full 테마는 전역 .mdi 규칙(background-color: currentColor)을 깔아서
#   Vuetify 등 mdi 폰트를 쓰는 앱의 "모든 아이콘"이 사각형으로 깨집니다.
#   lite 는 .mdi 규칙이 없는, 호스트 앱에 mdi 폰트가 있을 때 쓰는 공식 변형입니다.

# 다른 프로젝트로 가져가기
#   src/components/SlickGrid 폴더를 통째로 복사하면 됩니다.
#   폴더 안은 Vuetify / vue-i18n 에 의존하지 않습니다 (이 데모 페이지만 Vuetify 사용).

import { SlickGrid } from '@/components';   // 또는 폴더에서 직접 import`;

const versionGuide = `버전 정보
  slickgrid-vue        10.8.3   (MIT 라이센스 - 비용 없음)
  @slickgrid-universal 10.8.3   (common / excel-export)
  요구사항             vue >= 3.5

[중요] v10은 breaking 메이저 버전입니다.
  인터넷 검색으로 나오는 예제 대부분이 v5~v9 기준이라 그대로 복사하면 동작하지 않습니다.
  공식 문서를 볼 때 v10 기준인지 먼저 확인하세요.
  https://ghiscoding.gitbook.io/slickgrid-vue/

컬럼 type 요약 (1층 축약)
  text      문자열 (좌측정렬)          longText  여러 줄 (편집 시 textarea)
  number    정수 3자리 콤마 (우측)     decimal   소수 2자리 (우측)
  amount    금액 - 기본 단위 '원'      date      YYYY-MM-DD (중앙)
  datetime  YYYY-MM-DD HH:mm          yn        Y/N -> 체크 표시 (읽기용)
  code      코드 -> 명칭 (codes 필요)  checkbox  클릭해서 바꾸는 체크박스
  button    버튼 (action 이벤트)       image     이미지 (imageHeight)
  file      첨부파일 (다운로드)        link      새 탭 링크

숫자 옵션 : unit('원'/'%') prefix('$') scale(1000 -> 천원 축약)
정렬      : align(셀) / headerAlign(컬럼명, 기본 center)
기타      : ellipsis(말줄임, 기본 on) editable filter codes width`;

const styleGuide = `스타일 커스터마이징

1) 프로젝트 톤 변경 - theme/slickgrid-custom.css 상단의 --sg-* 변수만 수정
   --sg-primary        #1867c0   포인트 색 (선택/포커스/링크)
   --sg-border-color   #e0e0e0   테두리
   --sg-header-bg      #f5f5f5   헤더 배경
   --sg-row-hover      #f5f9ff   행 호버
   --sg-font-size      13px      글자 크기
   --sg-font-family    맑은 고딕 우선 (사무 환경 표준, 웹폰트 불필요)

2) 크기
   :height="'auto'"   부모 컨테이너에 맞춤 (기본)
   :height="320"      고정 px  ('320px' 문자열도 가능)
   :row-height="34"   데이터 행 높이
   :header-height="20" 컬럼명 영역 높이 (글자는 항상 세로 중앙)
   fit-columns        컬럼 폭을 그리드에 꽉 채움

3) 새 --slick-* 변수를 추가로 덮을 때
   반드시 테마 CSS에서 var(--이름) 참조가 실제 존재하는지 확인하세요.
   존재하지 않는 이름은 넣어도 아무 일도 일어나지 않습니다.

숫자 컬럼은 tabular-nums가 적용되어 자릿수가 세로로 딱 맞습니다.`;

const apiGuide = `주요 Props
  columns*        컬럼 정의 (축약/원본 혼용)      options        원본 GridOption 통과 (2층)
  v-model         데이터 배열                     id-field       행 고유키 필드명 (기본 'id')
  row-number      No 컬럼                        fit-columns    폭 꽉 채움
  filterable      필터 행                        external-filter 필터 행 숨기고 외부 조회만
  editable        인라인 편집                    auto-edit      클릭 즉시 편집
  selectable      행 선택                        multi-select   다중 선택 (기본 true)
  checkbox-selector 체크박스 컬럼+전체선택       row-meta       행/셀 잠금·스타일 함수
  pageable        페이지네이션                   pagination-align left|center|right
  fetch-data      서버 사이드 조회 함수          excel-export   엑셀 내보내기
  groupable       드래그 그룹핑                  grid-menu      우측 상단 메뉴
  height / width  'auto' | 숫자                  dark           다크 모드

주요 이벤트 (payload는 detail 벗겨서 전달)
  @on-grid-created      원본 인스턴스 (4층)      @on-row-click        행 클릭
  @on-cell-change       셀 편집 확정             @on-selection-change 선택 변경
  @on-cell-action       셀 버튼 클릭             @on-cell-toggle      셀 체크박스
  @on-dirty-change      변경행 수 변경           @on-loading          서버 조회 중
  @on-error             서버 조회 실패           @on-export-complete  엑셀 완료

ref 메서드
  getSelectedItems() selectAll() clearSelection() setSelectedRows()
  addRows() updateRows() removeRows() removeSelectedRows() highlightRow()
  getDirtyItems() getDirtyRows() clearDirty()
  applyFilters() clearFilters() clearSorting()
  exportToExcel() reload() refresh() resize() scrollToRow()
  getGridState()  그리고 getGrid()/getDataView()/getInstance() (4층 탈출구)`;

/* ---------------------------------------------------------------------------------------------------------------
샘플 데이터
--------------------------------------------------------------------------------------------------------------- */
const DEPT_CODES = [
  { value: "D1", label: "개발팀" },
  { value: "D2", label: "기획팀" },
  { value: "D3", label: "영업팀" },
  { value: "D4", label: "인사팀" },
];

const GRADE_CODES = [
  { value: "G1", label: "사원" },
  { value: "G2", label: "대리" },
  { value: "G3", label: "과장" },
  { value: "G4", label: "부장" },
];

/** 결정적(deterministic) 더미 데이터 생성 - 새로고침해도 값이 같아 비교가 쉽습니다 */
const makeRows = (count, offset = 0) =>
  Array.from({ length: count }, (_, i) => {
    const n = i + offset;
    return {
      id: n,
      empNo: `E${String(n + 1).padStart(5, "0")}`,
      name: `홍길동${n + 1}`,
      deptCd: DEPT_CODES[n % DEPT_CODES.length].value,
      gradeCd: GRADE_CODES[n % GRADE_CODES.length].value,
      salary: 3000000 + (n % 40) * 250000,
      rate: ((n % 17) * 1.37) % 100,
      hireDt: `20${String(10 + (n % 15)).padStart(2, "0")}-${String((n % 12) + 1).padStart(2, "0")}-${String((n % 28) + 1).padStart(2, "0")}`,
      useYn: n % 4 === 0 ? "N" : "Y",
    };
  });

/* ---------------------------------------------------------------------------------------------------------------
기본 - 정렬 / 컬럼 리사이즈 / 순서변경은 기본 활성
--------------------------------------------------------------------------------------------------------------- */
const basicColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110 },
  { field: "name", header: "이름", type: "text", width: 120 },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 100 },
  { field: "salary", header: "급여", type: "amount", width: 140 },
  { field: "hireDt", header: "입사일", type: "date", width: 120 },
  { field: "useYn", header: "사용", type: "yn", width: 70 },
];

const basicRows = ref(makeRows(50));

const basicCode = `<SlickGrid v-model="rows" :columns="columns" :height="320" />

const columns = [
  { field: 'empNo' , header: '사번'  , type: 'text'  , width: 110 },
  { field: 'deptCd', header: '부서'  , type: 'code'  , codes: DEPT_CODES },
  { field: 'salary', header: '급여'  , type: 'amount' },
  { field: 'hireDt', header: '입사일', type: 'date' },
  { field: 'useYn' , header: '사용'  , type: 'yn' },
];

// type 하나로 포맷터 / 정렬(좌우) / 에디터 / 필터가 한번에 결정됩니다.
// text | longText | number | decimal | amount | date | datetime | yn | code`;

/* ---------------------------------------------------------------------------------------------------------------
조회·필터 1) 필터 행 + 체크박스 선택 + 그리드 메뉴
--------------------------------------------------------------------------------------------------------------- */
const filterColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110, filter: true },
  { field: "name", header: "이름", type: "text", width: 120, filter: true },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 110, filter: true },
  { field: "gradeCd", header: "직급", type: "code", codes: GRADE_CODES, width: 100, filter: true },
  { field: "salary", header: "급여", type: "amount", width: 140, filter: true },
  { field: "hireDt", header: "입사일", type: "date", width: 130, filter: true },
  { field: "useYn", header: "사용", type: "yn", width: 80, filter: true },
];

const filterRows = ref(makeRows(200));
const selectedInfo = ref("선택된 행이 없습니다.");

// 이름을 전부 나열하지 않고 요약한다.
// 전체 선택(200건) 시 매번 6KB짜리 문자열을 만들어 렌더하면 화면이 버벅인다.
const onSelectionChange = ({ rows, items }) => {
  if (rows.length === 0) {
    selectedInfo.value = "선택된 행이 없습니다.";
    return;
  }

  const preview = items
    .slice(0, 5)
    .map((i) => i.name)
    .join(", ");
  selectedInfo.value = `${rows.length}건 선택 → ${preview}${items.length > 5 ? ` 외 ${items.length - 5}건` : ""}`;
};

/* ---------------------------------------------------------------------------------------------------------------
선택·CRUD) 다중 선택 + 그리드 밖 버튼으로 CRUD / 모달

실무에서 가장 많이 쓰는 형태.
좌측 상단 전체선택 체크박스로 다중 선택하고, 선택한 행을 그리드 밖 버튼으로 처리한다.
행/셀 단위 disable(rowMeta)도 함께 보여준다.
--------------------------------------------------------------------------------------------------------------- */
const crudGrid = ref(null);
let crudSeq = 100;

const crudRows = ref(
  makeRows(12).map((row, i) => ({
    ...row,
    // 마감된 행은 편집·삭제 불가로 취급
    closeYn: i % 5 === 4 ? "Y" : "N",
  })),
);

const crudColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110 },
  { field: "name", header: "이름", type: "text", width: 120, editable: true },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 110, editable: true },
  { field: "salary", header: "급여", type: "amount", width: 140, editable: true },
  { field: "closeYn", header: "마감", type: "yn", width: 70 },
];

const crudSelected = ref([]);
const crudMsg = ref("행을 선택하고 버튼을 눌러보세요.");

// 마감(closeYn === 'Y')된 행은 전체 잠금, 그 외에는 사번 셀만 잠금
const crudRowMeta = (item) => {
  if (item.closeYn === "Y") return { disabled: true, rowClass: "sg-row-closed" };
  return { cells: { empNo: { disabled: true } } };
};

const onCrudSelection = ({ items }) => {
  crudSelected.value = items;
  crudMsg.value = items.length === 0 ? "선택된 행이 없습니다." : `${items.length}건 선택`;
};

const crudAdd = () => {
  crudSeq += 1;
  crudGrid.value?.addRows([
    { id: crudSeq, empNo: `E${String(crudSeq).padStart(5, "0")}`, name: "신규사원", deptCd: "D1", salary: 3000000, closeYn: "N" },
  ]);
  crudMsg.value = "행을 추가했습니다 (맨 위).";
};

const crudDelete = () => {
  const target = crudSelected.value.filter((item) => item.closeYn !== "Y");

  if (target.length === 0) {
    crudMsg.value = crudSelected.value.length ? "마감된 행은 삭제할 수 없습니다." : "삭제할 행을 선택해 주세요.";
    return;
  }

  crudGrid.value?.removeRows(target);
  crudGrid.value?.clearSelection();
  crudMsg.value = `${target.length}건 삭제했습니다.`;
};

// 모달
const crudDialog = ref(false);
const crudEditItem = ref(null);

const crudOpenModal = () => {
  if (crudSelected.value.length !== 1) {
    crudMsg.value = "수정은 1건만 선택해 주세요.";
    return;
  }
  // 원본을 직접 고치지 않도록 복사해서 편집한다 (취소 시 되돌릴 수 있게)
  crudEditItem.value = { ...crudSelected.value[0] };
  crudDialog.value = true;
};

const crudSaveModal = () => {
  crudGrid.value?.updateRows([crudEditItem.value]);
  crudDialog.value = false;
  crudMsg.value = `${crudEditItem.value.empNo} 수정 반영했습니다.`;
};

const crudSelectAll = () => {
  crudGrid.value?.selectAll();
  crudMsg.value = "전체 선택했습니다.";
};

const crudCode = `<!-- 다중 선택 + 그리드 밖 버튼으로 CRUD -->
<Button @click="add">추가</Button>
<Button @click="openModal">수정 (모달)</Button>
<Button @click="remove">삭제</Button>
<Button @click="selectAllRows">전체 선택</Button>

<SlickGrid
  ref="gridRef"
  v-model="rows"
  :columns="columns"
  :row-meta="rowMeta"
  selectable            <!-- 행 선택 -->
  multi-select          <!-- 다중 선택 (기본 true) -->
  checkbox-selector     <!-- 좌측 체크박스 컬럼 + 좌측 상단 전체선택 -->
  editable
  @on-selection-change="onSelection"
/>

// ---- 선택 ----
const onSelection = ({ rows, items }) => selected.value = items;

gridRef.value.getSelectedItems();   // 선택된 데이터만
gridRef.value.selectAll();          // 전체 선택
gridRef.value.clearSelection();
gridRef.value.setSelectedRows([0, 2, 5]);

// ---- CRUD (정렬/필터/페이징 상태를 유지한 채 갱신됨) ----
gridRef.value.addRows([newItem]);              // 추가 (기본: 맨 위)
gridRef.value.updateRows([changedItem]);       // 수정 (idField로 대상 행을 찾음)
gridRef.value.removeRows(items);               // 삭제
gridRef.value.removeSelectedRows();            // 선택 행 삭제
gridRef.value.highlightRow(0);                 // 저장 직후 강조

// ---- 모달 열기 ----
const openModal = () => {
  if (selected.value.length !== 1) return alert('1건만 선택해 주세요');
  editItem.value = { ...selected.value[0] };   // 복사본으로 편집 (취소 대응)
  dialog.value = true;
};
const save = () => {
  gridRef.value.updateRows([editItem.value]);
  dialog.value = false;
};

// ---- 행/셀 단위 disable ----
const rowMeta = (item) => {
  // 마감된 행은 전체 잠금
  if (item.closeYn === 'Y') return { disabled: true, rowClass: 'my-closed-row' };
  // 그 외엔 사번 셀만 잠금
  return { cells: { empNo: { disabled: true } } };
};

/* 버튼 / 체크박스는 행 상태로 개별 제어도 됩니다
   { type: 'button'  , buttonDisabled: r => r.locked, buttonHidden: r => r.hidden }
   { type: 'checkbox', checkboxDisabled: r => r.locked, checkboxHidden: r => r.hidden } */`;

/* ---------------------------------------------------------------------------------------------------------------
편집 1) 인라인 편집
--------------------------------------------------------------------------------------------------------------- */
const editColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110 },
  { field: "name", header: "이름", type: "text", width: 130, editable: true },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 120, editable: true },
  { field: "salary", header: "급여", type: "amount", width: 150, editable: true },
  { field: "hireDt", header: "입사일", type: "date", width: 130, editable: true },
  { field: "useYn", header: "사용", type: "yn", width: 90, editable: true },
];

const editRows = ref(makeRows(20));
const changeLog = ref([]);

// args.column을 그대로 쓴다. cell 인덱스로 컬럼을 찾으면
// 체크박스 선택 컬럼이 앞에 붙거나 사용자가 컬럼 순서를 바꾼 경우 엉뚱한 컬럼을 가리킨다.
const onCellChange = ({ item, column }) => {
  const field = column?.field ?? "?";
  changeLog.value.unshift(`${item?.empNo} / ${column?.name ?? field} → ${JSON.stringify(item?.[field])}`);
  changeLog.value = changeLog.value.slice(0, 8);
};

/* ---------------------------------------------------------------------------------------------------------------
표시·성능 1) 그룹핑 (헤더를 상단 패널로 드래그)
--------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------------------------------------------
표시·성능) 합계 행 + 2단 헤더 + 로딩
--------------------------------------------------------------------------------------------------------------- */
const summaryGrid = ref(null);
const summaryRows = ref(makeRows(60));
const summaryLoading = ref(false);

const summaryColumns = [
  // group 이 같은 이웃끼리 위쪽에 묶음 제목이 생깁니다 (2단 헤더)
  { field: "empNo", header: "사번", type: "text", width: 110, group: "기본 정보" },
  { field: "name", header: "이름", type: "text", width: 110, group: "기본 정보" },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 110, group: "기본 정보", filter: true },
  // 합계 대상
  { field: "salary", header: "급여", type: "amount", width: 150, group: "급여 정보", summary: "sum", filter: true },
  { field: "rate", header: "평가점수", type: "decimal", width: 120, group: "급여 정보", summary: "avg" },
  { field: "hireDt", header: "입사일", type: "date", width: 120, group: "재직 정보", summary: "count" },
];

const toggleSummaryLoading = () => {
  summaryLoading.value = true;
  setTimeout(() => (summaryLoading.value = false), 1500);
};

const summaryCode = `<SlickGrid
  v-model="rows"
  :columns="columns"
  :loading="loading"     <!-- 조회 중 오버레이 -->
  show-summary           <!-- 하단 합계 행 -->
  summary-label="합계"
  filterable
/>

const columns = [
  // 2단 헤더 : group 이 같은 이웃 컬럼끼리 위에 묶음 제목이 생깁니다
  { field: 'empNo' , header: '사번', group: '기본 정보' },
  { field: 'name'  , header: '이름', group: '기본 정보' },

  // 합계 행 : summary 를 지정한 컬럼만 값이 나옵니다
  { field: 'salary', header: '급여', type: 'amount' , group: '급여 정보', summary: 'sum' },
  { field: 'rate'  , header: '점수', type: 'decimal', group: '급여 정보', summary: 'avg' },
  { field: 'hireDt', header: '입사일', type: 'date' , group: '재직 정보', summary: 'count' },
];

/* summary : sum | avg | count | min | max | (items, column) => 값

   - 합계는 "필터가 적용된 결과" 기준으로 다시 계산됩니다.
     (필터를 걸었는데 합계가 그대로면 사용자가 혼란스러우므로)
   - 본문 셀과 같은 표기를 씁니다. 단위/천원축약(scale)이 합계에도 그대로 적용됩니다.
   - 편집·행추가·삭제 후에도 자동 갱신되고, 수동으로는 refreshSummary() 를 부릅니다.

   [주의] 2단 헤더(group)와 드래그 그룹핑(groupable)은 함께 쓸 수 없습니다.
   둘 다 그리드 위쪽 패널 하나를 사용해서 서로 덮어씁니다. */

// 로딩 오버레이 : 서버 모드(fetch-data)에서는 자동으로 켜지고,
// 직접 API를 호출하는 경우엔 :loading 으로 제어합니다.`;

const validCode = `<SlickGrid v-model="rows" :columns="columns" editable @on-validation-error="onInvalid" />

const columns = [
  // required : 빈 값이면 저장되지 않고 셀이 빨갛게 표시됩니다
  { field: 'name', header: '이름', type: 'text', editable: true, required: true },

  // validator : true | '오류 메시지' | { valid, msg } 셋 다 반환 가능
  { field: 'salary', header: '급여', type: 'amount', editable: true,
    validator: (v) => v > 0 ? true : '급여는 0보다 커야 합니다' },

  { field: 'empNo', header: '사번', type: 'text', editable: true,
    validator: (v) => /^E\\d{5}$/.test(v) ? true : '사번은 E + 숫자 5자리입니다' },
];

const onInvalid = (args) => console.log(args.validationResults.msg);

// required / validator 는 editable: true 인 컬럼에서만 동작합니다.
// (에디터가 있어야 검증이 실행되므로 — 빠뜨리면 개발 모드에서 콘솔 경고가 뜹니다)`;

const validGrid = ref(null);
const validRows = ref(makeRows(10));
const validMsg = ref("이름을 지우거나 급여에 0을 넣어보세요.");

const validColumns = [
  { field: "empNo", header: "사번", type: "text", width: 120, editable: true, validator: (v) => (/^E\d{5}$/.test(v) ? true : "사번은 E + 숫자 5자리입니다") },
  { field: "name", header: "이름", type: "text", width: 130, editable: true, required: true },
  { field: "salary", header: "급여", type: "amount", width: 150, editable: true, validator: (v) => (Number(v) > 0 ? true : "급여는 0보다 커야 합니다") },
];

const onValidationError = (args) => {
  validMsg.value = `검증 실패: ${args?.validationResults?.msg ?? "입력값을 확인해 주세요."}`;
};

const groupGrid = ref(null);
const groupRows = ref(makeRows(120));
const groupMsg = ref("헤더를 위 회색 영역으로 끌어다 놓거나, 아래 버튼을 눌러보세요.");

const doGroupBy = (fields, label) => {
  groupGrid.value?.groupBy(fields);
  groupMsg.value = `${label} 기준으로 그룹핑했습니다.`;
};

const doClearGroup = () => {
  groupGrid.value?.clearGrouping();
  groupMsg.value = "그룹을 해제했습니다.";
};

/* ---------------------------------------------------------------------------------------------------------------
엑셀 1) 엑셀 내보내기 (버튼으로 직접 호출)
--------------------------------------------------------------------------------------------------------------- */
const excelGrid = ref(null);
const excelRows = ref(makeRows(80));
const exportMsg = ref("");

const doExport = () => {
  excelGrid.value?.exportToExcel();
};

const onExportComplete = () => {
  exportMsg.value = "엑셀 파일이 생성되었습니다.";
};

/* ---------------------------------------------------------------------------------------------------------------
조회·필터 2) 그리드 밖 입력창으로 조회 (국내 업무화면에서 가장 흔한 형태)

상단에 조회조건을 두고 [조회] 버튼을 누르는 패턴.
그리드 내부 필터 행(filterable)을 켜지 않아도 외부 입력값으로 필터를 걸 수 있습니다.
--------------------------------------------------------------------------------------------------------------- */
const searchGrid = ref(null);
const searchRows = ref(makeRows(200));

const searchForm = ref({ name: "", deptCd: null, useYn: null });
const searchResultMsg = ref("");

const doSearch = () => {
  searchGrid.value?.applyFilters([
    // 값이 비어 있는 조건은 컴포넌트가 알아서 제외합니다
    { field: "name", value: searchForm.value.name },
    { field: "deptCd", value: searchForm.value.deptCd, operator: "EQ" },
    { field: "useYn", value: searchForm.value.useYn, operator: "EQ" },
  ]);
  searchResultMsg.value = "조회 조건을 적용했습니다.";
};

const resetSearch = () => {
  searchForm.value = { name: "", deptCd: null, useYn: null };
  searchGrid.value?.clearFilters();
  searchResultMsg.value = "조건을 초기화했습니다.";
};

const searchCode = `<!-- 상단 조회조건 (그리드 밖) -->
<VTextField v-model="form.name" label="이름" />
<VSelect v-model="form.deptCd" :items="depts" label="부서" />
<Button @click="doSearch">조회</Button>
<Button @click="resetSearch">초기화</Button>

<!-- 필터 행은 숨기고 외부 입력창으로만 필터를 쓰려면 external-filter -->
<SlickGrid ref="gridRef" v-model="rows" :columns="columns" external-filter />

const doSearch = () => {
  gridRef.value.applyFilters([
    { field: 'name'  , value: form.name },                    // 기본 = 포함(LIKE)
    { field: 'deptCd', value: form.deptCd, operator: 'EQ' },  // 정확히 일치
  ]);
};

const resetSearch = () => gridRef.value.clearFilters();

/* 값이 비어 있는 조건은 자동으로 제외됩니다.
   (빈 문자열로 필터를 걸면 결과가 0건이 되어버리므로)

   서버 모드(fetch-data)에서도 같은 코드가 그대로 동작합니다.
   applyFilters가 서버 재조회까지 트리거하고, 조건은 fetchData의 filters로 전달됩니다.

   사용 가능한 operator: Contains(기본) / EQ / NE / GT / GE / LT / LE / StartsWith / EndsWith */`;

/* ---------------------------------------------------------------------------------------------------------------
편집 2) 변경행 추적 (dirty rows)
--------------------------------------------------------------------------------------------------------------- */
const dirtyGrid = ref(null);
const dirtyRows = ref(makeRows(15));
const dirtyInfo = ref({ count: 0, rows: [] });
const saveMsg = ref("");

const onDirtyChange = ({ count, rows }) => {
  dirtyInfo.value = { count, rows };
};

// 실제 프로젝트에서는 여기서 저장 API를 호출합니다
const saveDirty = () => {
  const items = dirtyGrid.value?.getDirtyItems() ?? [];

  if (items.length === 0) {
    saveMsg.value = "변경된 행이 없습니다.";
    return;
  }

  saveMsg.value = `${items.length}건 저장 요청 → ${items.map((i) => i.empNo).join(", ")}`;
  // 저장 성공 후 변경 이력 초기화
  dirtyGrid.value?.clearDirty();
};

const dirtyCode = `<SlickGrid
  ref="gridRef"
  v-model="rows"
  :columns="columns"
  editable
  @on-dirty-change="onDirtyChange"
/>

// 저장 버튼
const save = async () => {
  const items = gridRef.value.getDirtyItems();   // 바뀐 행의 데이터만
  if (!items.length) return;

  await axios.post('/api/emp/bulk', items);
  gridRef.value.clearDirty();                    // 저장 성공 후 초기화
};

// 어떤 필드가 바뀌었는지도 알 수 있습니다
gridRef.value.getDirtyRows();   // [{ item, fields: ['name','salary'] }, ...]
gridRef.value.getDirtyCount();

// 셀 편집과 체크박스 토글 모두 변경행으로 잡힙니다.
// 서버 재조회(fetchData) 시에는 자동으로 초기화됩니다.`;

/* ---------------------------------------------------------------------------------------------------------------
셀 표현) 셀 안의 컴포넌트 (버튼 / 체크박스 / 이미지 / 첨부파일) + 클릭 이벤트
--------------------------------------------------------------------------------------------------------------- */
const richRows = ref(
  Array.from({ length: 8 }, (_, i) => ({
    id: i,
    empNo: `E${String(i + 1).padStart(5, "0")}`,
    name: `홍길동${i + 1}`,
    // 아주 긴 텍스트 - 말줄임(...) 확인용
    memo: `이 사원에 대한 비고 내용입니다. 컬럼 너비보다 길어서 말줄임으로 표시되고 마우스를 올리면 전체가 보입니다. (${i + 1}번)`,
    budget: (i + 1) * 1234000,
    approveYn: i % 2 === 0 ? "Y" : "N",
    photo: `https://placehold.co/48x24/1867c0/fff?text=${i + 1}`,
    attach: { name: `계약서_${i + 1}.pdf`, url: `/files/contract-${i + 1}.pdf` },
    locked: i === 3,
  })),
);

const richColumns = [
  { field: "empNo", header: "사번", type: "text", width: 100 },
  { field: "name", header: "이름", type: "text", width: 90 },
  // 긴 내용 말줄임
  { field: "memo", header: "비고", type: "text", width: 180, align: "left" },
  // 숫자 단위 축약 : 1,234,000 -> 1,234 천원
  { field: "budget", header: "예산", type: "number", unit: "천원", scale: 1000, width: 110 },
  // 클릭 가능한 체크박스 ('Y'/'N' 문자열로 저장)
  { field: "approveYn", header: "승인", type: "checkbox", checkedValue: "Y", uncheckedValue: "N", width: 70 },
  // 이미지
  { field: "photo", header: "사진", type: "image", imageHeight: 24, width: 80 },
  // 첨부파일
  { field: "attach", header: "첨부", type: "file", width: 150 },
  // 버튼 (행 상태에 따라 비활성화)
  { id: "edit", header: "수정", type: "button", buttonText: "수정", action: "edit", width: 70 },
  { id: "del", header: "삭제", type: "button", buttonText: "삭제", action: "del", buttonDisabled: (row) => row.locked, width: 70 },
];

const eventLog = ref([]);

const pushLog = (text) => {
  eventLog.value.unshift(text);
  eventLog.value = eventLog.value.slice(0, 6);
};

// 버튼 클릭 -> action 이름으로 분기
const onCellAction = ({ action, item }) => {
  pushLog(`[버튼] action="${action}" / ${item?.name}`);
};

// 체크박스 토글 -> 데이터가 이미 갱신된 상태로 넘어온다
const onCellToggle = ({ field, checked, value, item }) => {
  pushLog(`[체크박스] ${item?.name} / ${field} = ${JSON.stringify(value)} (checked=${checked})`);
};

// 버튼/체크박스를 눌렀을 때는 행 클릭이 발생하지 않는다
const onRowClick = ({ item }) => {
  pushLog(`[행 클릭] ${item?.name}`);
};

const richCode = `<!-- 셀에 컴포넌트를 넣고 클릭 이벤트를 돌려받는 방법 -->
<SlickGrid
  v-model="rows"
  :columns="columns"
  @on-cell-action="onCellAction"   <!-- 버튼 클릭 -->
  @on-cell-toggle="onCellToggle"   <!-- 체크박스 토글 -->
  @on-row-click="onRowClick"       <!-- 일반 행 클릭 -->
/>

const columns = [
  // 버튼 : action 이름으로 분기, 행 상태로 비활성화
  { id: 'edit', header: '수정', type: 'button', buttonText: '수정', action: 'edit' },
  { id: 'del' , header: '삭제', type: 'button', buttonText: '삭제', action: 'del',
    buttonDisabled: row => row.locked },

  // 체크박스 : 'Y'/'N' 문자열로 저장 (클릭하면 데이터까지 자동 갱신됨)
  { field: 'approveYn', header: '승인', type: 'checkbox',
    checkedValue: 'Y', uncheckedValue: 'N' },

  // 이미지 / 첨부파일
  { field: 'photo' , header: '사진', type: 'image', imageHeight: 24 },
  { field: 'attach', header: '첨부', type: 'file' },   // 값: { name, url } 또는 URL 문자열
];

const onCellAction = ({ action, item, row, column }) => {
  if (action === 'edit') openEditDialog(item);
  if (action === 'del')  removeRow(row);
};

// 체크박스는 넘어올 때 이미 item[field]가 갱신되어 있어서 그대로 저장 API에 보내면 됩니다.
const onCellToggle = ({ field, value, item }) => saveApi(item);

/* -------------------------------------------------------------------
직접 만든 컴포넌트를 셀에 넣고 싶을 때 (완전 자유)
formatter가 HTMLElement를 반환할 수 있고,
data-sg-action 만 붙이면 on-cell-action 으로 올라옵니다.
------------------------------------------------------------------- */
{
  field: 'status', header: '상태',
  formatter: (row, cell, value, col, item) => {
    const chip = document.createElement('span');
    chip.textContent = value;
    chip.style.cssText = 'padding:2px 8px;border-radius:10px;background:#e3f2fd';
    chip.dataset.sgAction = 'status';   // <- 이것만 붙이면 클릭 이벤트가 올라옴
    return chip;
  },
}`;

/* ---------------------------------------------------------------------------------------------------------------
엑셀 2) 엑셀 업로드 -> 그리드 주입

한글 깨짐 방지는 기존 ExcelUploader가 처리합니다 (codepage: 949로 레거시 .xls 대응).
만약 그래도 한글이 깨지면 ExcelUploader.vue 상단 주석대로 import 'xlsx/dist/cpexcel' 을 추가해야 합니다.
--------------------------------------------------------------------------------------------------------------- */
const uploadRows = ref([]);
const uploadMsg = ref("엑셀 파일을 올리면 그리드에 그대로 들어갑니다.");

const uploadColumns = [
  { field: "empNo", header: "사번", type: "text", width: 120 },
  { field: "name", header: "이름", type: "text", width: 120 },
  { field: "deptCd", header: "부서", type: "text", width: 120 },
  { field: "salary", header: "급여", type: "amount", width: 150 },
];

const onUploadSuccess = (rows) => {
  uploadRows.value = rows;
  uploadMsg.value = `${rows.length}건을 읽었습니다. 한글이 정상인지 확인해 보세요.`;
};

const onUploadError = (error) => {
  uploadMsg.value = `읽기 실패: ${error?.message ?? error}`;
};

/* ---------------------------------------------------------------------------------------------------------------
조회·필터 3) 서버 사이드 페이징 / 정렬 / 필터

실제 서버가 없으므로 가짜 API로 흉내냅니다.
중요한 점은 정렬·필터·페이징이 모두 "서버"에서 처리된다는 것입니다.
클라이언트 모드로 한 페이지만 로드하면 그 페이지 안에서만 정렬되어 결과가 틀립니다.
--------------------------------------------------------------------------------------------------------------- */
const SERVER_DB = makeRows(1234);

const serverGrid = ref(null);
const serverRows = ref([]);
const serverLoading = ref(false);
const serverLog = ref([]);
const serverError = ref("");

/** 서버를 흉내낸 조회 함수 — 실제로는 axios 호출이 들어갑니다 */
const fetchEmployees = async ({ page, pageSize, sorters, filters, signal }) => {
  serverLog.value.unshift(
    `page=${page} size=${pageSize} sort=[${sorters.map((s) => `${s.field} ${s.direction}`).join(", ")}] filter=[${filters
      .map((f) => `${f.field} ${f.operator} ${f.value}`)
      .join(", ")}]`,
  );
  serverLog.value = serverLog.value.slice(0, 5);

  // 네트워크 지연 흉내 (AbortSignal 지원 — 빠르게 페이지를 넘기면 이전 요청이 취소됨)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 250);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("취소됨", "AbortError"));
    });
  });

  // ---- 아래는 서버가 할 일을 브라우저에서 흉내낸 부분 ----
  let rows = [...SERVER_DB];

  for (const f of filters) {
    const needle = String(f.value).toLowerCase();
    rows = rows.filter((r) => {
      const v = r[f.field];
      if (v === null || v === undefined) return false;
      // 빈 연산자 / Contains = 부분일치(LIKE)
      if (!f.operator || f.operator === "Contains") return String(v).toLowerCase().includes(needle);
      if (f.operator === "EQ" || f.operator === "=") return String(v).toLowerCase() === needle;
      if (f.operator === ">") return Number(v) > Number(f.value);
      if (f.operator === "<") return Number(v) < Number(f.value);
      return String(v).toLowerCase().includes(needle);
    });
  }

  for (const s of [...sorters].reverse()) {
    rows.sort((a, b) => {
      const [x, y] = [a[s.field], b[s.field]];
      const cmp = x === y ? 0 : x > y ? 1 : -1;
      return s.direction === "DESC" ? -cmp : cmp;
    });
  }

  const totalCount = rows.length;
  const start = (page - 1) * pageSize;

  return { items: rows.slice(start, start + pageSize), totalCount };
};

const onServerError = (error) => {
  // 요청 취소는 사용자가 빠르게 조작한 정상 상황이므로 에러로 표시하지 않는다
  if (error?.name === "AbortError") return;
  serverError.value = `조회 실패: ${error?.message ?? error}`;
};

const serverCode = `<SlickGrid
  v-model="rows"
  :columns="columns"
  :fetch-data="fetchEmployees"   <!-- 이것만 주면 서버 모드 -->
  filterable
  pageable
  pagination-align="center"
  @on-loading="v => loading = v"
  @on-error="onError"
/>

// 프로젝트 API 규격에 맞춰 매핑만 해주면 됩니다.
const fetchEmployees = async ({ page, pageSize, sorters, filters, signal }) => {
  const res = await axios.get('/api/employees', {
    signal,
    params: {
      page,
      size: pageSize,
      sort: sorters.map(s => \`\${s.field},\${s.direction}\`),
      ...filters.reduce((acc, f) => ({ ...acc, [f.field]: f.value }), {}),
    },
  });

  // 응답 규격이 { content, totalElements } 이든 { list, totalCount } 이든
  // 여기서 { items, totalCount } 로만 맞춰주면 됩니다.
  return { items: res.data.content, totalCount: res.data.totalElements };
};

/* 왜 fetchData 방식인가
   페이징/정렬/필터를 서버에 위임하지 않으면 SlickGrid이 "받아온 한 페이지 안에서만"
   정렬·필터를 수행해서 결과가 틀립니다. fetch-data를 주면 이 세 가지가 전부
   서버 요청으로 바뀌고, AbortSignal로 이전 요청이 자동 취소됩니다. */`;

/* ---------------------------------------------------------------------------------------------------------------
표시·성능 2) 페이지네이션 3종 (왼쪽 / 중앙 / 오른쪽)
--------------------------------------------------------------------------------------------------------------- */
const pagingRows = ref(makeRows(137));
const pagingAlign = ref("center");
const PAGING_ALIGNS = ["left", "center", "right"];

/* ---------------------------------------------------------------------------------------------------------------
표시·성능 3) 대용량 (가상 스크롤) - 버튼으로 로드해야 페이지 진입이 느려지지 않습니다
--------------------------------------------------------------------------------------------------------------- */
const bigRows = ref([]);
const bigLoadMsg = ref("");

const loadBigData = (count) => {
  const t0 = performance.now();
  bigRows.value = makeRows(count);
  const t1 = performance.now();
  bigLoadMsg.value = `${count.toLocaleString()}건 생성 ${Math.round(t1 - t0)}ms`;
};

/* ---------------------------------------------------------------------------------------------------------------
7. 탈출구 - 원본 SlickGrid / DataView 인스턴스 직접 사용
--------------------------------------------------------------------------------------------------------------- */
const escapeGrid = ref(null);
const escapeRows = ref(makeRows(30));
const escapeMsg = ref("");
const gridState = ref("");

const onGridCreated = (instance) => {
  // 4층 탈출구: 래퍼가 감싸지 않은 기능은 원본 인스턴스로 직접 처리
  escapeMsg.value = `원본 인스턴스 확보 → 컬럼 ${instance.slickGrid.getColumns().length}개 / 데이터 ${instance.dataView.getLength()}건`;
};

const scrollToLast = () => {
  const grid = escapeGrid.value?.getGrid();
  grid?.scrollRowIntoView(escapeRows.value.length - 1);
};

const showGridState = () => {
  const state = escapeGrid.value?.getGridState();
  // 컬럼 폭/순서/숨김 + 필터 + 정렬 상태. 사용자별 그리드 레이아웃 저장에 사용합니다.
  gridState.value = JSON.stringify(
    { columns: state?.columns?.map((c) => ({ id: c.columnId, w: c.width })), sorters: state?.sorters, filters: state?.filters },
    null,
    2,
  );
};

const escapeCode = `<!-- 4층 탈출구 : 래퍼가 절대 병목이 되지 않게 하는 장치 -->
<SlickGrid ref="gridRef" v-model="rows" :columns="cols" @on-grid-created="onCreated" />

// (1) 생성 이벤트로 원본 인스턴스 받기
const onCreated = inst => {
  inst.slickGrid            // SlickGrid 원본 객체
  inst.dataView             // DataView 원본 객체
  inst.gridService          // 행 추가/삭제/갱신
  inst.filterService        // 필터 제어
  inst.gridStateService     // 상태 저장/복원
};

// (2) ref로 명령형 API 호출
gridRef.value.getGrid().scrollRowIntoView(999);
gridRef.value.getGridState();       // 레이아웃 저장용
gridRef.value.exportToExcel();
gridRef.value.getSelection();       // { rows, items }
gridRef.value.clearFilters();
gridRef.value.setOptions({ rowHeight: 40 });`;

const layerCode = `커스텀 4계층 - 위에서 막히면 아래로 내려갑니다.

1층 축약    :columns="[{ field:'salary', header:'급여', type:'amount' }]"
            -> 90% 케이스. type 하나로 포맷/정렬/에디터/필터 결정.

2층 통과    :options="{ frozenColumn: 1, rowHeight: 40 }"
            -> SlickGrid GridOption 전체를 deep merge로 덮어씀.
               우리가 예상 못 한 옵션도 그대로 먹힘 (기본값을 항상 이김).

3층 슬롯    <template #header> / <template #footer>

4층 탈출구  @on-grid-created / ref 명령형 API
            -> 원본 Grid / DataView / Service 인스턴스를 그대로 노출.`;

/* ---------------------------------------------------------------------------------------------------------------
2층 예시 - 원본 옵션 통과
--------------------------------------------------------------------------------------------------------------- */
const passthroughOptions = {
  // SlickGrid 원본 옵션. 래퍼에 props로 만들어두지 않은 것도 그대로 동작합니다.
  frozenColumn: 1, // 첫 컬럼 고정
  rowHeight: 44,
  headerRowHeight: 42,
};

// 데모마다 데이터셋을 분리한다. 같은 배열을 두 그리드가 공유하면
// 한쪽에서 정렬/편집한 결과가 다른 쪽에도 반영되어 데모가 헷갈린다.
const passthroughRows = ref(makeRows(40));

const selectedCount = computed(() => filterRows.value.length);

/* ---------------------------------------------------------------------------------------------------------------
케이스별 사용법 코드 (접이식 카드에 표시)
--------------------------------------------------------------------------------------------------------------- */
const filterCode = `<SlickGrid
  v-model="rows"
  :columns="columns"
  row-number          <!-- 맨 앞 No 컬럼 (정렬/필터해도 1부터 다시 매김) -->
  filterable          <!-- 컬럼별 필터 행 -->
  selectable          <!-- 행 선택 -->
  checkbox-selector   <!-- 좌측 체크박스 + 좌측 상단 전체선택 -->
  grid-menu           <!-- 우측 상단 햄버거(컬럼 표시/숨김, 필터 초기화) -->
  @on-selection-change="({ rows, items }) => ..."
/>

// 컬럼에 filter: true 를 주면 그 컬럼에 필터가 붙습니다.
// type에 따라 필터 종류가 자동 결정됩니다.
//   text   -> 조건(포함/같음/시작/끝) + 입력창,  기본 연산자는 "포함"(LIKE)
//   number -> 조건 + 숫자 입력
//   date   -> 조건 + 날짜 선택
//   code/yn -> 셀렉트박스 (codes 목록에서 자동 생성)
const columns = [
  { field: 'name'  , header: '이름', type: 'text', filter: true },
  { field: 'deptCd', header: '부서', type: 'code', codes: DEPT_CODES, filter: true },
];

// 입력창에서 Enter를 누르면 즉시 검색됩니다 (타이핑 중엔 400ms 대기).`;

const editCode = `<SlickGrid v-model="rows" :columns="columns" editable @on-cell-change="onChange" />

// 컬럼에 editable: true 를 주면 그 컬럼만 편집 가능해집니다.
const columns = [
  { field: 'empNo' , header: '사번', type: 'text' },                    // 편집 불가
  { field: 'name'  , header: '이름', type: 'text'  , editable: true },
  { field: 'salary', header: '급여', type: 'amount', editable: true },
  { field: 'deptCd', header: '부서', type: 'code'  , codes: DEPT_CODES, editable: true },
  { field: 'useYn' , header: '사용', type: 'yn'    , editable: true },
];

// 셀을 더블클릭하거나 선택 후 Enter로 편집합니다.
// 클릭 한 번에 바로 편집하려면 auto-edit 를 추가하세요.

const onChange = ({ item, column }) => {
  // column을 쓰세요. cell 인덱스로 컬럼을 찾으면
  // 체크박스 컬럼이 앞에 붙거나 컬럼 순서를 바꿨을 때 엉뚱한 컬럼을 가리킵니다.
  console.log(column.field, item[column.field]);
};

/* yn 타입 주의
   편집 에디터가 체크박스가 아니라 셀렉트박스입니다.
   체크박스 에디터는 boolean(true/false)을 저장해서
   'Y'/'N' 문자열 필드의 타입을 깨뜨리기 때문입니다.
   눌러서 바꾸는 체크박스가 필요하면 type: 'checkbox' 를 쓰세요. */`;

const groupCode = `<SlickGrid v-model="rows" :columns="columns" groupable grid-menu />

// groupable 하나로 상단 드래그 패널이 생깁니다.
// 컬럼 헤더를 그 패널로 끌어다 놓으면 그룹이 만들어집니다.

// 집계(합계/평균)까지 붙이려면 2층(옵션 통과)으로 내려갑니다.
import { Aggregators } from 'slickgrid-vue';

const columns = [
  { field: 'salary', header: '급여', type: 'amount',
    grouping: {
      getter: 'deptCd',
      aggregators: [new Aggregators.Sum('salary')],
      aggregateCollapsed: true,
    },
  },
];`;

const excelCode = `<Button @click="download">엑셀 다운로드</Button>

<SlickGrid
  ref="gridRef"
  v-model="rows"
  :columns="columns"
  excel-export
  export-filename="사원목록"      <!-- 한글 파일명 가능 -->
  export-sheet-name="사원"
  grid-menu                       <!-- 햄버거 메뉴에도 "엑셀로 내보내기"가 생깁니다 -->
/>

const download = () => gridRef.value.exportToExcel();

/* 한글 깨짐 방지
   내부적으로 format을 'xlsx'로 고정합니다.
   xlsx는 ZIP + UTF-8 XML 구조라 한글이 안전하지만,
   'xls'는 레거시 포맷이라 인코딩 정보가 없어 한글이 깨집니다.

   exportWithFormatter가 기본 적용되어 화면에 보이는 값 그대로 나갑니다.
   (부서 컬럼이 'D1'이 아니라 '개발팀'으로 나감)

   type: 'button' / 'image' 컬럼은 데이터가 아니므로 자동으로 제외됩니다.

   CSV로 내보내려면 @slickgrid-universal/text-export 를 추가 설치해야 하고,
   그때는 UTF-8 BOM 옵션을 반드시 켜야 엑셀에서 한글이 안 깨집니다. */`;

const uploadCode = `<!-- 기존 ExcelUploader 컴포넌트를 그대로 재사용 -->
<ExcelUploader :header="0" @on-success="onSuccess" @on-error="onError">
  <Button>엑셀 파일 선택</Button>
</ExcelUploader>

<SlickGrid v-model="rows" :columns="columns" row-number fit-columns />

const onSuccess = (data) => rows.value = data;   // 읽은 JSON을 그대로 v-model에 넣으면 끝

/* 허용 형식 : .xlsx / .xls / .csv
   (내부 xlsx 라이브러리는 xlsb/ods/txt 등도 읽지만 accept 속성으로 위 3종만 받습니다)

   한글 깨짐 : ExcelUploader가 codepage 949로 레거시 .xls를 처리합니다.
   그래도 깨지면 ExcelUploader.vue 주석대로 import 'xlsx/dist/cpexcel' 을 추가하세요.

   :header 옵션
     0            -> 0번째 행을 키로 사용
     ['a',null,'c'] -> 컬럼 인덱스에 맞춰 키 지정 (null은 무시)
     {A:'a', C:'c'} -> 엑셀 열문자로 키 지정

   [대용량 주의]
   파일 전체를 메모리에 올려 파싱하는 방식입니다(스트리밍 리더가 없음).
   원본 + 파싱결과 + JSON배열이 동시에 존재해 파일 크기의 3~5배 메모리를 씁니다.
   수십 MB 이상 CSV는 탭이 멈출 수 있으니 서버 업로드 후 처리하는 편이 안전합니다.
   그리드 자체는 50만행도 문제없습니다 (느린 쪽은 파싱입니다). */`;

const pagingCode = `<SlickGrid
  v-model="rows"
  :columns="columns"
  pageable
  :page-size="20"
  :page-sizes="[20, 50, 100, 500]"
  pagination-align="center"     <!-- left | center | right -->
/>

/* 페이지네이션은 자체 컴포넌트(SlickGridPagination.vue)입니다.
   - 왼쪽 / 중앙 / 오른쪽 3가지 배치
   - 중앙은 좌우 텍스트 길이와 무관하게 정확히 가운데 (space-between + 동일 flex)
   - 컨테이너 폭 기준 반응형(container query)이라 좁은 영역에 넣어도 잘 접힙니다
   - 페이지가 많으면 1 ... 4 5 [6] 7 ... 62 형태로 줄여서 보여줍니다

   서버 사이드(fetch-data)와 함께 쓰면 페이지 이동이 서버 요청으로 이어집니다. */`;

const bigCode = `<SlickGrid v-model="rows" :columns="columns" :height="360" filterable />

/* 가상 스크롤이 기본입니다. 별도 설정이 없습니다.
   화면에 보이는 행 + 약간의 버퍼만 DOM으로 만들기 때문에
   10행이든 50만행이든 스크롤 성능이 같습니다.

   병목은 그리드가 아니라 "데이터를 만들거나 받아오는 쪽"입니다.
   서버에서 전체를 다 받아오는 게 부담이면 fetch-data(서버 사이드)를 쓰세요. */`;

const passthroughCode = `<SlickGrid v-model="rows" :columns="columns" :options="options" />

// 2층 = SlickGrid 원본 GridOption 을 그대로 통과시키는 계층.
// 래퍼에 props로 만들어두지 않은 옵션도 전부 동작하고, 항상 기본값을 이깁니다.
const options = {
  frozenColumn: 1,        // 첫 컬럼 고정 (props에 없지만 그대로 먹습니다)
  rowHeight: 44,
  headerRowHeight: 42,
  enableExcelCopyBuffer: true,   // 엑셀처럼 셀 복사/붙여넣기
  enableContextMenu: true,       // 우클릭 메뉴
};

/* 병합 규칙
   - 객체는 깊게 병합됩니다 (일부 키만 덮어써도 나머지 기본값 유지)
   - 배열은 병합하지 않고 교체합니다
     (externalResources 같은 배열을 병합하면 서비스 인스턴스가 중복 등록되므로) */`;
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>SlickGrid</VCardTitle>
      <VCardSubtitle> slickgrid-vue 10.x (MIT) 기반 데이터 그리드. 가상 스크롤로 10만행 이상을 성능 저하 없이 처리합니다. </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <!--
        케이스가 많아 유형별로 묶었습니다.
        Tab(VTabsWindowItem)은 지연 렌더링이라 선택한 탭의 그리드만 생성됩니다.
        (숨겨진 컨테이너에서 그리드를 만들면 폭을 0으로 계산해 컬럼이 찌그러지므로 이 편이 안전합니다)
      -->
      <!--
        Vuetify 탭을 중첩하면 안쪽 VTabsWindow가 바깥(MainPage) 탭과 선택 컨텍스트를 공유해
        여러 섹션이 동시에 활성화된다. 그래서 자체 버튼바 + v-if 로 전환한다.
        v-if 라서 선택한 섹션의 그리드만 생성되는 지연 렌더링도 그대로 유지된다.
      -->
      <div class="sg-sections">
        <button
          v-for="s in SECTIONS"
          :key="s.key"
          type="button"
          class="sg-sections__btn"
          :class="{ 'is-active': section === s.key }"
          @click="section = s.key"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="sg-section-body">
        <!-- ============================ 가이드 ============================ -->
        <div v-if="section === 'guide'">
          <h3 class="mb-1">설치</h3>
          <p class="text-caption mb-2">
            <strong>slickgrid-vue 10.8.3</strong> (MIT) 기반입니다. 세 패키지의 버전을 반드시 일치시키고, 다른 프로젝트에는
            <code>src/components/SlickGrid</code> 폴더를 통째로 복사하면 됩니다.
          </p>
          <CodeCard class="mb-6" title="설치 방법" :code="installCode" open />

          <h3 class="mb-1">버전 · 컬럼 타입</h3>
          <p class="text-caption mb-2">v10은 breaking 메이저 버전이라 구버전(v5~v9) 예제와 다릅니다. 컬럼 <code>type</code> 하나로 포맷터/정렬/에디터/필터가 함께 결정됩니다.</p>
          <CodeCard class="mb-6" title="버전 정보와 컬럼 type 요약" :code="versionGuide" />

          <h3 class="mb-1">스타일</h3>
          <p class="text-caption mb-2">
            프로젝트 톤은 <code>theme/slickgrid-custom.css</code>의 <code>--sg-*</code> 변수만 바꾸면 됩니다. 서체는 사무 환경 표준인 맑은 고딕이
            기본입니다.
          </p>
          <CodeCard class="mb-6" title="스타일 가이드 (--sg-* 변수 / 크기 / 서체)" :code="styleGuide" />

          <h3 class="mb-1">Props · 이벤트 · 메서드</h3>
          <p class="text-caption mb-2">전체 목록 요약입니다. 각 기능의 실제 동작은 위 탭들에서 확인하세요.</p>
          <CodeCard class="mb-6" title="API 요약 (props / events / ref 메서드)" :code="apiGuide" />

          <h3 class="mb-1">커스텀 4계층</h3>
          <p class="text-caption mb-2">축약으로 짧게 쓰고, 막히면 아래 계층으로 내려갑니다. 래퍼가 병목이 되지 않습니다.</p>
          <CodeCard class="mb-2" title="커스텀 4계층 구조" :code="layerCode" />
        </div>

        <!-- ============================ 기본 ============================ -->
        <div v-if="section === 'basic'">
          <h3 class="mb-1">기본</h3>
          <p class="text-caption mb-2">정렬 / 컬럼 리사이즈 / 컬럼 순서변경은 옵션이 아니라 기본값입니다. 헤더를 클릭하거나 드래그해 보세요.</p>
          <SlickGrid v-model="basicRows" :columns="basicColumns" :height="320" row-number fit-columns />
          <CodeCard class="mt-2 mb-6" :code="basicCode" />
        </div>

        <!-- ============================ 조회 · 필터 ============================ -->
        <div v-if="section === 'search'">
          <h3 class="mb-1">1) 필터 행 + 체크박스 선택 + 그리드 메뉴</h3>
          <p class="text-caption mb-2">
            총 {{ selectedCount }}건. 우측 상단 햄버거 메뉴에서 컬럼 표시/숨김, 필터 초기화가 가능합니다. code/yn 타입은 필터가 자동으로 셀렉트박스가
            됩니다.
          </p>
          <SlickGrid
            v-model="filterRows"
            :columns="filterColumns"
            :height="360"
            row-number
            filterable
            selectable
            checkbox-selector
            grid-menu
            @on-selection-change="onSelectionChange"
          />
          <VAlert density="compact" variant="tonal" class="mt-2 mb-6">{{ selectedInfo }}</VAlert>

          <!-- 조회·필터 2) 그리드 밖 조회조건 -->
          <CodeCard class="mt-2 mb-6" :code="filterCode" />
          <h3 class="mb-1">2) 그리드 밖 입력창으로 조회</h3>
          <p class="text-caption mb-2">
            상단 조회조건 + [조회] 버튼 패턴입니다. 그리드에 <code>filterable</code>을 켜지 않았는데도 외부 입력값으로 필터가 걸립니다. 값이 빈 조건은
            자동으로 제외됩니다. 서버 모드에서도 같은 코드가 그대로 동작합니다.
          </p>
          <VRow dense class="mb-1">
            <VCol cols="12" sm="3">
              <VTextField v-model="searchForm.name" label="이름" density="compact" variant="outlined" hide-details clearable @keyup.enter="doSearch" />
            </VCol>
            <VCol cols="12" sm="3">
              <VSelect
                v-model="searchForm.deptCd"
                :items="DEPT_CODES"
                item-title="label"
                item-value="value"
                label="부서"
                density="compact"
                variant="outlined"
                hide-details
                clearable
              />
            </VCol>
            <VCol cols="12" sm="2">
              <VSelect
                v-model="searchForm.useYn"
                :items="[
                  { label: 'Y', value: 'Y' },
                  { label: 'N', value: 'N' },
                ]"
                item-title="label"
                item-value="value"
                label="사용"
                density="compact"
                variant="outlined"
                hide-details
                clearable
              />
            </VCol>
            <VCol cols="12" sm="4" class="d-flex align-center">
              <Button type="confirm" class="mr-2" @click="doSearch">조회</Button>
              <Button @click="resetSearch">초기화</Button>
              <span v-if="searchResultMsg" class="text-caption ml-3">{{ searchResultMsg }}</span>
            </VCol>
          </VRow>
          <SlickGrid ref="searchGrid" v-model="searchRows" :columns="basicColumns" :height="280" row-number fit-columns external-filter />
          <CodeCard class="mt-2 mb-6" :code="searchCode" />

          <!-- 3. 편집 -->
          <h3 class="mb-1">3) 서버 사이드 페이징 / 정렬 / 필터</h3>
          <p class="text-caption mb-2">
            전체 1,234건이 서버에 있고 한 페이지(20건)만 받아옵니다. <strong>정렬과 필터도 서버로 갑니다</strong> — 헤더를 정렬하거나 필터를 입력하면 아래
            요청 로그에 조건이 찍힙니다. 페이지를 빠르게 넘기면 이전 요청은 <code>AbortSignal</code>로 취소됩니다.
          </p>
          <VAlert v-if="serverError" type="error" density="compact" variant="tonal" class="mb-2">{{ serverError }}</VAlert>
          <SlickGrid
            ref="serverGrid"
            v-model="serverRows"
            :columns="filterColumns"
            :height="340"
            :fetch-data="fetchEmployees"
            row-number
            filterable
            pageable
            :page-size="20"
            pagination-align="center"
            grid-menu
            @on-loading="(v) => (serverLoading = v)"
            @on-error="onServerError"
          />
          <VAlert density="compact" variant="tonal" class="mt-2">
            <div class="text-caption font-weight-bold">서버 요청 로그 {{ serverLoading ? "(조회 중...)" : "" }}</div>
            <div v-if="!serverLog.length" class="text-caption">아직 없음</div>
            <div v-for="(log, i) in serverLog" :key="i" class="text-caption">{{ log }}</div>
          </VAlert>
          <CodeCard class="mt-2 mb-6" :code="serverCode" />

          <!-- 표시·성능 2) 페이지네이션 3종 -->
        </div>

        <div v-if="section === 'crud'">
          <h3 class="mb-1">다중 선택 + 그리드 밖 버튼으로 CRUD / 모달</h3>
          <p class="text-caption mb-2">
            좌측 상단 전체선택 체크박스로 다중 선택하고, 선택한 행을 그리드 밖 버튼으로 처리합니다. <strong>마감(Y) 행</strong>은
            <code>rowMeta</code>로 편집이 잠겨 회색으로 표시되고 삭제도 막힙니다. 사번 셀은 모든 행에서 편집 불가입니다.
          </p>
          <div class="mb-2">
            <Button type="confirm" class="mr-2" @click="crudAdd">추가</Button>
            <Button class="mr-2" @click="crudOpenModal">수정 (모달)</Button>
            <Button type="cancel" class="mr-2" @click="crudDelete">삭제</Button>
            <Button class="mr-2" @click="crudSelectAll">전체 선택</Button>
            <span class="text-caption ml-2">{{ crudMsg }}</span>
          </div>
          <SlickGrid
            ref="crudGrid"
            v-model="crudRows"
            :columns="crudColumns"
            :height="320"
            :row-meta="crudRowMeta"
            row-number
            selectable
            multi-select
            checkbox-selector
            editable
            fit-columns
            @on-selection-change="onCrudSelection"
          />
          <VAlert v-if="crudSelected.length" density="compact" variant="tonal" class="mt-2">
            <div class="text-caption">선택: {{ crudSelected.map((i) => i.empNo).join(", ") }}</div>
          </VAlert>
          <CodeCard class="mt-2 mb-6" :code="crudCode" />

          <!-- 수정 모달 -->
          <VDialog v-model="crudDialog" max-width="420">
            <VCard>
              <VCardTitle class="text-subtitle-1">사원 수정</VCardTitle>
              <VCardText v-if="crudEditItem">
                <VTextField v-model="crudEditItem.name" label="이름" density="compact" variant="outlined" class="mb-2" hide-details />
                <VSelect
                  v-model="crudEditItem.deptCd"
                  :items="DEPT_CODES"
                  item-title="label"
                  item-value="value"
                  label="부서"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                  hide-details
                />
                <VTextField v-model.number="crudEditItem.salary" label="급여" type="number" density="compact" variant="outlined" hide-details />
              </VCardText>
              <VCardActions>
                <VSpacer />
                <Button @click="crudDialog = false">취소</Button>
                <Button type="confirm" @click="crudSaveModal">저장</Button>
              </VCardActions>
            </VCard>
          </VDialog>
        </div>

        <div v-if="section === 'edit'">
          <h3 class="mb-1">1) 인라인 편집</h3>
          <p class="text-caption mb-2">
            셀을 더블클릭하거나 선택 후 Enter로 편집합니다. <code>yn</code> 타입은 체크박스가 아니라 셀렉트박스를 쓰는데, 체크박스 에디터는 boolean을
            저장해서 <code>'Y'/'N'</code> 문자열 필드의 타입을 깨뜨리기 때문입니다.
          </p>
          <SlickGrid v-model="editRows" :columns="editColumns" :height="300" editable @on-cell-change="onCellChange" />
          <VAlert v-if="changeLog.length" density="compact" variant="tonal" class="mt-2 mb-6">
            <div class="text-caption">변경 이력</div>
            <div v-for="(log, i) in changeLog" :key="i" class="text-caption">{{ log }}</div>
          </VAlert>
          <div v-else class="mb-6"></div>

          <!-- 표시·성능 1) 그룹핑 -->
          <CodeCard class="mt-2 mb-6" :code="editCode" />
          <h3 class="mb-1">2) 필수입력 · 유효성 검증</h3>
          <p class="text-caption mb-2">
            이름은 <code>required</code>(빈 값 불가), 사번은 형식 검증, 급여는 0 초과만 허용합니다. 셀을 편집해서 잘못된 값을 넣으면 저장되지 않고
            빨갛게 표시됩니다.
          </p>
          <SlickGrid
            ref="validGrid"
            v-model="validRows"
            :columns="validColumns"
            :height="240"
            row-number
            editable
            fit-columns
            @on-validation-error="onValidationError"
          />
          <VAlert density="compact" variant="tonal" class="mt-2">{{ validMsg }}</VAlert>
          <CodeCard class="mt-2 mb-6" :code="validCode" />

          <h3 class="mb-1">3) 변경행 추적 (저장 API 연동)</h3>
          <p class="text-caption mb-2">
            편집한 행만 모아둡니다. 저장 버튼에서 <code>getDirtyItems()</code>로 꺼내 API에 보내고 성공 후
            <code>clearDirty()</code>로 초기화합니다. 어떤 필드가 바뀌었는지도 함께 추적합니다.
          </p>
          <div class="mb-2">
            <Button type="confirm" @click="saveDirty">변경 저장 ({{ dirtyInfo.count }}건)</Button>
            <span v-if="saveMsg" class="text-caption ml-3">{{ saveMsg }}</span>
          </div>
          <SlickGrid ref="dirtyGrid" v-model="dirtyRows" :columns="editColumns" :height="280" row-number editable @on-dirty-change="onDirtyChange" />
          <VAlert v-if="dirtyInfo.count" density="compact" variant="tonal" class="mt-2">
            <div class="text-caption font-weight-bold">변경행 {{ dirtyInfo.count }}건</div>
            <div v-for="(row, i) in dirtyInfo.rows" :key="i" class="text-caption">{{ row.item.empNo }} — 변경 필드: {{ row.fields.join(", ") }}</div>
          </VAlert>
          <CodeCard class="mt-2 mb-6" :code="dirtyCode" />

          <!-- 셀 표현) 셀 안의 컴포넌트 -->
        </div>

        <div v-if="section === 'cell'">
          <h3 class="mb-1">셀 안의 컴포넌트 + 클릭 이벤트</h3>
          <p class="text-caption mb-2">
            버튼 / 체크박스 / 이미지 / 첨부파일을 셀에 넣고 클릭 이벤트를 돌려받습니다. 비고 컬럼은 내용이 길어 <code>...</code>으로 줄었고 마우스를
            올리면 전체가 보입니다. 예산은 <code>scale: 1000</code>으로 천원 단위입니다. 4번째 행의 삭제 버튼은
            <code>buttonDisabled</code>로 막혀 있습니다.
          </p>
          <SlickGrid
            v-model="richRows"
            :columns="richColumns"
            :height="320"
            row-number
            @on-cell-action="onCellAction"
            @on-cell-toggle="onCellToggle"
            @on-row-click="onRowClick"
          />
          <VAlert density="compact" variant="tonal" class="mt-2">
            <div class="text-caption font-weight-bold">이벤트 로그 (버튼/체크박스를 눌러보세요)</div>
            <div v-if="!eventLog.length" class="text-caption">아직 없음</div>
            <div v-for="(log, i) in eventLog" :key="i" class="text-caption">{{ log }}</div>
          </VAlert>
          <CodeCard class="mt-2 mb-6" :code="richCode" />

          <!-- 엑셀 2) 엑셀 업로드 -->
        </div>

        <div v-if="section === 'excel'">
          <h3 class="mb-1">1) 엑셀 내보내기</h3>
          <p class="text-caption mb-2">
            화면에 보이는 포맷 그대로 내보냅니다 (<code>exportWithFormatter</code>가 기본 적용되어 코드값이 아니라 명칭이 나갑니다).
          </p>
          <div class="mb-2">
            <Button type="confirm" @click="doExport">엑셀 다운로드</Button>
            <span v-if="exportMsg" class="text-caption ml-3">{{ exportMsg }}</span>
          </div>
          <SlickGrid
            ref="excelGrid"
            v-model="excelRows"
            :columns="filterColumns"
            :height="300"
            excel-export
            export-filename="사원목록"
            grid-menu
            @on-export-complete="onExportComplete"
          />
          <div class="mb-6"></div>

          <!-- 편집 2) 변경행 추적 -->
          <CodeCard class="mt-2 mb-6" :code="excelCode" />
          <h3 class="mb-1">2) 엑셀 업로드 → 그리드</h3>
          <p class="text-caption mb-2">
            기존 <code>ExcelUploader</code> 컴포넌트를 그대로 재사용합니다. 한글 깨짐은 그쪽에서 <code>codepage: 949</code>로 처리하고 있습니다. 첫 행을
            헤더로 쓰려면 <code>:header="0"</code>을 줍니다.
          </p>
          <div class="mb-2 d-flex align-center">
            <ExcelUploader :header="0" @on-success="onUploadSuccess" @on-error="onUploadError">
              <Button>엑셀 파일 선택</Button>
            </ExcelUploader>
            <span class="text-caption ml-3">{{ uploadMsg }}</span>
          </div>
          <SlickGrid v-model="uploadRows" :columns="uploadColumns" :height="240" row-number fit-columns />
          <div class="mb-6"></div>

          <!-- 조회·필터 3) 서버 사이드 -->
          <CodeCard class="mt-2 mb-6" :code="uploadCode" />
        </div>

        <div v-if="section === 'view'">
          <h3 class="mb-1">1) 합계 행 + 2단 헤더 + 로딩</h3>
          <p class="text-caption mb-2">
            컬럼에 <code>group</code>을 주면 위에 묶음 제목(2단 헤더)이 생기고, <code>summary</code>를 주면 하단 합계 행에 값이 나옵니다. 급여
            컬럼에 필터를 걸어보면 <strong>걸러진 결과 기준으로 합계가 다시 계산</strong>됩니다.
          </p>
          <div class="mb-2">
            <Button @click="toggleSummaryLoading">조회 중 표시 (1.5초)</Button>
          </div>
          <SlickGrid
            ref="summaryGrid"
            v-model="summaryRows"
            :columns="summaryColumns"
            :height="300"
            :loading="summaryLoading"
            row-number
            filterable
            show-summary
            fit-columns
          />
          <CodeCard class="mt-2 mb-6" :code="summaryCode" />

          <h3 class="mb-1">2) 그룹핑</h3>
          <p class="text-caption mb-2">
            위 회색 패널로 컬럼 헤더를 끌어다 놓거나 아래 버튼을 누르세요. 컬럼에 <code>grouping</code> 정의가 없으면 플러그인이 그 컬럼을 조용히
            무시하므로, <code>groupable</code>을 켜면 컴포넌트가 모든 컬럼에 기본 grouping을 자동으로 넣어줍니다.
          </p>
          <div class="mb-2">
            <Button class="mr-2" @click="doGroupBy('deptCd', '부서')">부서로 그룹</Button>
            <Button class="mr-2" @click="doGroupBy('gradeCd', '직급')">직급으로 그룹</Button>
            <Button class="mr-2" @click="doGroupBy(['deptCd', 'gradeCd'], '부서 → 직급')">부서 → 직급 (2단)</Button>
            <Button @click="doClearGroup">해제</Button>
            <span class="text-caption ml-3">{{ groupMsg }}</span>
          </div>
          <SlickGrid ref="groupGrid" v-model="groupRows" :columns="filterColumns" :height="360" groupable grid-menu />
          <div class="mb-6"></div>

          <!-- 5. 엑셀 -->
          <CodeCard class="mt-2 mb-6" :code="groupCode" />
          <h3 class="mb-1">3) 페이지네이션 3종 (왼쪽 / 중앙 / 오른쪽)</h3>
          <p class="text-caption mb-2">
            총 {{ pagingRows.length }}건. <code>pagination-align</code>으로 위치를 바꿉니다. 브라우저 창을 좁히면 세로로 쌓이고, 더 좁아지면 페이지 번호
            버튼이 접힙니다 (container query 기반이라 그리드가 놓인 컨테이너 폭을 기준으로 반응합니다).
          </p>
          <div class="mb-2">
            <Button v-for="a in PAGING_ALIGNS" :key="a" :type="pagingAlign === a ? 'confirm' : 'normal'" class="mr-2" @click="pagingAlign = a">
              {{ a }}
            </Button>
          </div>
          <SlickGrid
            v-model="pagingRows"
            :columns="filterColumns"
            :height="320"
            :key="pagingAlign"
            row-number
            pageable
            :page-size="20"
            :pagination-align="pagingAlign"
            filterable
            grid-menu
          />
          <div class="mb-6"></div>

          <!-- 표시·성능 3) 대용량 -->
          <CodeCard class="mt-2 mb-6" :code="pagingCode" />
          <h3 class="mb-1">4) 대용량 (가상 스크롤)</h3>
          <p class="text-caption mb-2">
            화면에 보이는 행 + 약간의 버퍼만 DOM으로 만들기 때문에 행 수가 늘어도 스크롤 성능이 유지됩니다. 직접 눌러서 확인해 보세요.
          </p>
          <div class="mb-2">
            <Button @click="loadBigData(10000)" class="mr-2">1만행</Button>
            <Button @click="loadBigData(100000)" class="mr-2">10만행</Button>
            <Button @click="loadBigData(500000)" class="mr-2">50만행</Button>
            <span v-if="bigLoadMsg" class="text-caption ml-3">{{ bigLoadMsg }}</span>
          </div>
          <SlickGrid v-model="bigRows" :columns="filterColumns" :height="360" filterable grid-menu />
          <div class="mb-6"></div>

          <!-- 8. 2층 : 원본 옵션 통과 -->
          <CodeCard class="mt-2 mb-6" :code="bigCode" />
        </div>

        <div v-if="section === 'extend'">
          <h3 class="mb-1">1) 2층 - 원본 옵션 통과</h3>
          <p class="text-caption mb-2">
            <code>frozenColumn</code>은 래퍼에 props로 만들어두지 않았지만 <code>:options</code>로 그대로 동작합니다. 첫 컬럼이 고정되고 행 높이가
            44px입니다.
          </p>
          <SlickGrid v-model="passthroughRows" :columns="filterColumns" :height="300" :options="passthroughOptions" />
          <div class="mb-6"></div>

          <!-- 9. 4층 : 탈출구 -->
          <CodeCard class="mt-2 mb-6" :code="passthroughCode" />
          <h3 class="mb-1">2) 4층 - 탈출구 (원본 인스턴스)</h3>
          <p class="text-caption mb-2">래퍼가 감싸지 않은 기능은 원본 인스턴스로 직접 처리합니다. 래퍼가 병목이 되지 않게 하는 장치입니다.</p>
          <div class="mb-2">
            <Button @click="scrollToLast" class="mr-2">마지막 행으로 스크롤</Button>
            <Button @click="showGridState">현재 그리드 상태 보기</Button>
          </div>
          <SlickGrid
            ref="escapeGrid"
            v-model="escapeRows"
            :columns="basicColumns"
            :height="280"
            filterable
            grid-menu
            @on-grid-created="onGridCreated"
          />
          <VAlert v-if="escapeMsg" density="compact" variant="tonal" class="mt-2">{{ escapeMsg }}</VAlert>
          <CodeCard v-if="gridState" class="mt-2" title="현재 그리드 상태 (컬럼 폭/순서/필터/정렬) — 사용자별 레이아웃 저장에 사용" :code="gridState" open />
          <CodeCard class="mt-2 mb-6" :code="escapeCode" />
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
/* 섹션 전환 버튼바 (Vuetify 탭 중첩 문제를 피하기 위한 자체 구현) */
.sg-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.sg-sections__btn {
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #546e7a;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.sg-sections__btn:hover {
  background: #f0f4f8;
}

.sg-sections__btn.is-active {
  background: #1867c0;
  border-color: #1867c0;
  color: #fff;
  font-weight: 600;
}

code {
  background: rgba(0, 0, 0, 0.07);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.85em;
}
</style>
