<script setup>
import { ref, computed } from "vue";

// 데모용 접이식 코드 카드 — SlickGrid 데모에서 만든 것을 재사용한다.
// (데모 페이지는 이 저장소 전용이라 다른 프로젝트로 옮길 대상이 아니므로 재사용해도 무해하다)
import CodeCard from "@/components/SlickGrid/use/CodeCard.vue";
import Button from "@/components/Button/Button.vue";
import DevExtremeGrid from "../DevExtremeGrid.vue";

/* ---------------------------------------------------------------------------------------------------------------
섹션 전환

Vuetify 탭을 중첩하면 안쪽 VTabsWindow 가 바깥(MainPage) 탭과 선택 컨텍스트를 공유해
여러 섹션이 동시에 활성화된다. (SlickGrid 데모에서 실제로 겪었고 ADR 로 기록했다)
그래서 자체 버튼바 + v-if 로 전환한다. v-if 라서 선택한 섹션의 그리드만 생성된다.
--------------------------------------------------------------------------------------------------------------- */
const SECTIONS = [
  { key: "guide", label: "가이드" },
  { key: "basic", label: "기본" },
  { key: "search", label: "조회 · 필터" },
  { key: "crud", label: "선택 · CRUD" },
  { key: "edit", label: "편집" },
  { key: "cell", label: "셀 표현" },
  { key: "view", label: "표시 · 성능" },
  { key: "extend", label: "확장" },
];

const section = ref("guide");

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

/** 결정적 더미 데이터 — 새로고침해도 값이 같아 비교가 쉽다 */
const makeRows = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    empNo: `E${String(i + 1).padStart(5, "0")}`,
    name: `홍길동${i + 1}`,
    deptCd: DEPT_CODES[i % DEPT_CODES.length].value,
    gradeCd: GRADE_CODES[i % GRADE_CODES.length].value,
    salary: 3000000 + (i % 40) * 250000,
    rate: ((i % 17) * 1.37) % 100,
    hireDt: new Date(2010 + (i % 15), i % 12, (i % 28) + 1),
    useYn: i % 4 === 0 ? "N" : "Y",
  }));

/* ---------------------------------------------------------------------------------------------------------------
1. 기본
--------------------------------------------------------------------------------------------------------------- */
const basicColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110 },
  { field: "name", header: "이름", type: "text", width: 120 },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 110 },
  { field: "salary", header: "급여", type: "amount", width: 150 },
  { field: "hireDt", header: "입사일", type: "date", width: 120 },
  { field: "useYn", header: "사용", type: "yn", width: 80 },
];

const basicRows = ref(makeRows(50));

/* ---------------------------------------------------------------------------------------------------------------
2. 조회 · 필터
--------------------------------------------------------------------------------------------------------------- */
const filterColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110, filter: true },
  { field: "name", header: "이름", type: "text", width: 120, filter: true },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 110, filter: true },
  { field: "gradeCd", header: "직급", type: "code", codes: GRADE_CODES, width: 100, filter: true },
  { field: "salary", header: "급여", type: "amount", width: 150, filter: true },
  { field: "hireDt", header: "입사일", type: "date", width: 130, filter: true },
  { field: "useYn", header: "사용", type: "yn", width: 80, filter: true },
];

const filterRows = ref(makeRows(200));

// 그리드 밖 입력창으로 조회
const searchGrid = ref(null);
const searchRows = ref(makeRows(200));
const searchForm = ref({ name: "", deptCd: null });
const searchMsg = ref("");

const doSearch = () => {
  searchGrid.value?.applyFilters([
    // 값이 빈 조건은 컴포넌트가 알아서 제외한다
    { field: "name", value: searchForm.value.name },
    { field: "deptCd", value: searchForm.value.deptCd, operator: "=" },
  ]);
  searchMsg.value = "조회 조건을 적용했습니다.";
};

const resetSearch = () => {
  searchForm.value = { name: "", deptCd: null };
  searchGrid.value?.clearFilters();
  searchMsg.value = "조건을 초기화했습니다.";
};

/* ---------------------------------------------------------------------------------------------------------------
3. 선택 · CRUD
--------------------------------------------------------------------------------------------------------------- */
const crudGrid = ref(null);
let crudSeq = 100;
const crudRows = ref(makeRows(12));
const crudSelected = ref([]);
const crudMsg = ref("행을 선택하고 버튼을 눌러보세요.");
const crudDialog = ref(false);
const crudEditItem = ref(null);

const onCrudSelection = ({ items }) => {
  crudSelected.value = items;
  crudMsg.value = items.length === 0 ? "선택된 행이 없습니다." : `${items.length}건 선택`;
};

const crudAdd = () => {
  crudSeq += 1;
  crudGrid.value?.addRows([
    { id: crudSeq, empNo: `E${String(crudSeq).padStart(5, "0")}`, name: "신규사원", deptCd: "D1", salary: 3000000, useYn: "Y", hireDt: new Date() },
  ]);
  crudMsg.value = "행을 추가했습니다 (맨 위).";
};

const crudDelete = () => {
  if (crudSelected.value.length === 0) {
    crudMsg.value = "삭제할 행을 선택해 주세요.";
    return;
  }
  const count = crudSelected.value.length;
  crudGrid.value?.removeSelectedRows();
  crudMsg.value = `${count}건 삭제했습니다.`;
};

const crudOpenModal = () => {
  if (crudSelected.value.length !== 1) {
    crudMsg.value = "수정은 1건만 선택해 주세요.";
    return;
  }
  // 원본을 직접 고치지 않도록 복사해서 편집한다 (취소 대응)
  crudEditItem.value = { ...crudSelected.value[0] };
  crudDialog.value = true;
};

const crudSave = () => {
  crudGrid.value?.updateRows([crudEditItem.value]);
  crudDialog.value = false;
  crudMsg.value = `${crudEditItem.value.empNo} 수정 반영했습니다.`;
};

/* ---------------------------------------------------------------------------------------------------------------
4. 편집 (검증 + 변경행 추적)
--------------------------------------------------------------------------------------------------------------- */
const editGrid = ref(null);
const editRows = ref(makeRows(15));
const dirtyInfo = ref({ count: 0, rows: [] });
const saveMsg = ref("");

const editColumns = [
  {
    field: "empNo",
    header: "사번",
    type: "text",
    width: 120,
    editable: true,
    pattern: /^E\d{5}$/,
    patternMessage: "사번은 E + 숫자 5자리입니다",
  },
  { field: "name", header: "이름", type: "text", width: 120, editable: true, required: true },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 120, editable: true },
  {
    field: "salary",
    header: "급여",
    type: "amount",
    width: 150,
    editable: true,
    validator: (v) => Number(v) > 0,
    validatorMessage: "급여는 0보다 커야 합니다",
  },
  { field: "useYn", header: "사용", type: "yn", width: 90, editable: true },
];

const onDirtyChange = ({ count, rows }) => {
  dirtyInfo.value = { count, rows };
};

const saveDirty = () => {
  const items = editGrid.value?.getDirtyItems() ?? [];
  if (items.length === 0) {
    saveMsg.value = "변경된 행이 없습니다.";
    return;
  }
  saveMsg.value = `${items.length}건 저장 요청 → ${items.map((i) => i.empNo).join(", ")}`;
  editGrid.value?.clearDirty();
};

/* ---------------------------------------------------------------------------------------------------------------
5. 셀 표현
--------------------------------------------------------------------------------------------------------------- */
const cellRows = ref(
  Array.from({ length: 8 }, (_, i) => ({
    id: i,
    empNo: `E${String(i + 1).padStart(5, "0")}`,
    name: `홍길동${i + 1}`,
    memo: `이 사원에 대한 비고입니다. 컬럼 너비보다 길어서 말줄임으로 표시됩니다. (${i + 1}번)`,
    budget: (i + 1) * 1234000,
    approveYn: i % 2 === 0 ? "Y" : "N",
    photo: `https://placehold.co/48x24/1867c0/fff?text=${i + 1}`,
    attach: { name: `계약서_${i + 1}.pdf`, url: `/files/contract-${i + 1}.pdf` },
    locked: i === 3,
  })),
);

const cellColumns = [
  { field: "empNo", header: "사번", type: "text", width: 100 },
  { field: "name", header: "이름", type: "text", width: 90 },
  // 긴 내용 말줄임
  { field: "memo", header: "비고", type: "text", width: 180, align: "left" },
  // 숫자 단위 축약 : 1,234,000 -> 1,234 천원
  { field: "budget", header: "예산", type: "number", unit: "천원", scale: 1000, width: 110 },
  // 클릭 가능한 체크박스 ('Y'/'N' 문자열로 저장)
  { field: "approveYn", header: "승인", type: "checkbox", checkedValue: "Y", uncheckedValue: "N", width: 70 },
  { field: "photo", header: "사진", type: "image", imageHeight: 24, width: 80 },
  { field: "attach", header: "첨부", type: "file", width: 150 },
  { name: "edit", header: "수정", type: "button", buttonText: "수정", action: "edit", width: 70 },
  { name: "del", header: "삭제", type: "button", buttonText: "삭제", action: "del", buttonDisabled: (r) => r.locked, width: 70 },
];

const eventLog = ref([]);

const pushLog = (text) => {
  eventLog.value.unshift(text);
  eventLog.value = eventLog.value.slice(0, 6);
};

const onCellAction = ({ action, item }) => pushLog(`[버튼] action="${action}" / ${item?.name}`);
const onCellToggle = ({ field, value, item }) => pushLog(`[체크박스] ${item?.name} / ${field} = ${JSON.stringify(value)}`);
const onRowClick = ({ item }) => pushLog(`[행 클릭] ${item?.name}`);

/*
 * 컬럼명 정렬 — 셀 정렬(align)과 독립이다.
 * 기본값은 중앙이고, 컬럼별로 headerAlign 을 주면 그 컬럼만 바뀐다.
 * 급여 컬럼처럼 셀은 우측정렬이면서 컬럼명은 가운데인 조합이 업무 화면에서 가장 많이 쓰인다.
 */
const headerAlignColumns = [
  { field: "empNo", header: "사번(컬럼명 왼쪽)", type: "text", width: 150, headerAlign: "left" },
  { field: "name", header: "이름(기본=중앙)", type: "text", width: 150 },
  { field: "deptCd", header: "부서(컬럼명 오른쪽)", type: "code", codes: DEPT_CODES, width: 160, headerAlign: "right" },
  // 셀은 우측정렬, 컬럼명은 중앙 (기본값)
  { field: "salary", header: "급여(셀 우측/명 중앙)", type: "amount", width: 180 },
];

const headerAlignRows = ref(makeRows(5));

/* ---------------------------------------------------------------------------------------------------------------
6. 표시 · 성능
--------------------------------------------------------------------------------------------------------------- */
// 합계 + 2단 헤더
const summaryRows = ref(makeRows(60));
const summaryLoading = ref(false);

const summaryColumns = [
  { field: "empNo", header: "사번", type: "text", width: 110, group: "기본 정보" },
  { field: "name", header: "이름", type: "text", width: 110, group: "기본 정보" },
  { field: "deptCd", header: "부서", type: "code", codes: DEPT_CODES, width: 110, group: "기본 정보", filter: true },
  { field: "salary", header: "급여", type: "amount", width: 150, group: "급여 정보", summary: "sum", filter: true },
  { field: "rate", header: "평가점수", type: "decimal", width: 120, group: "급여 정보", summary: "avg" },
  { field: "hireDt", header: "입사일", type: "date", width: 120, group: "재직 정보", summary: "count" },
];

const toggleLoading = () => {
  summaryLoading.value = true;
  setTimeout(() => (summaryLoading.value = false), 1500);
};

// 그룹핑
const groupGrid = ref(null);
const groupRows = ref(makeRows(120));
const groupMsg = ref("헤더를 위 패널로 끌어다 놓거나 아래 버튼을 눌러보세요.");

const doGroupBy = (fields, label) => {
  groupGrid.value?.groupBy(fields);
  groupMsg.value = `${label} 기준으로 그룹핑했습니다.`;
};

const doClearGroup = () => {
  groupGrid.value?.clearGrouping();
  groupMsg.value = "그룹을 해제했습니다.";
};

// 페이지네이션 3종 + 구성요소 켜고 끄기
const pagingRows = ref(makeRows(137));
const pagingAlign = ref("center");
const PAGING_ALIGNS = ["left", "center", "right"];

/* 페이저를 구성하는 요소를 하나씩 켜고 끌 수 있습니다 */
const pagingShowPageSize = ref(true);
const pagingShowInfo = ref(true);
const pagingShowPages = ref(true);
const pagingShowNav = ref(true);
const pagingPageSizeMode = ref("input");
const pagingMsg = ref("");

const onPageSizeChange = ({ pageSize }) => (pagingMsg.value = `페이지당 ${pageSize}건으로 변경`);

// 대용량
const bigRows = ref([]);
const bigMsg = ref("");

const loadBig = (count) => {
  const t0 = performance.now();
  bigRows.value = makeRows(count);
  bigMsg.value = `${count.toLocaleString()}건 생성 ${Math.round(performance.now() - t0)}ms`;
};

// 엑셀
const excelGrid = ref(null);
const excelRows = ref(makeRows(80));
const exportMsg = ref("");

const doExport = () => excelGrid.value?.exportToExcel();
const onExportComplete = ({ filename }) => (exportMsg.value = `${filename} 생성 완료`);

/* ---------------------------------------------------------------------------------------------------------------
7. 확장 (옵션 통과 + 탈출구)
--------------------------------------------------------------------------------------------------------------- */
const extendGrid = ref(null);
const extendRows = ref(makeRows(40));
const extendMsg = ref("");
const gridState = ref("");

// DevExtreme 원본 옵션 — 래퍼에 props 로 만들어두지 않은 것도 그대로 동작한다
const passthroughOptions = {
  focusedRowEnabled: true,
  columnFixing: { enabled: true },
  rowAlternationEnabled: false,
  showColumnLines: false,
};

const onGridCreated = ({ instance }) => {
  /*
   * on-grid-created 는 위젯이 만들어진 직후(onInitialized)에 불린다.
   * 이 시점에는 데이터 소스 로딩이 끝나지 않아 instance.totalCount() 가 -1 을 반환한다.
   * (건수가 필요하면 원본 데이터를 쓰거나 onContentReady 이후에 읽어야 한다)
   */
  extendMsg.value = `원본 위젯 확보 → 컬럼 ${instance.columnCount()}개 / 데이터 ${extendRows.value.length}건`;
};

const scrollToLast = () => {
  const grid = extendGrid.value?.getGrid();
  grid?.navigateToRow(extendRows.value[extendRows.value.length - 1]?.id);
};

const showState = () => {
  const state = extendGrid.value?.getState();
  gridState.value = JSON.stringify(
    { columns: state?.columns?.map((c) => ({ f: c.dataField, w: c.width, i: c.visibleIndex })), sort: state?.columns?.filter((c) => c.sortOrder) },
    null,
    2,
  );
};

/* ---------------------------------------------------------------------------------------------------------------
평가판 여부 (라이선스 키 미등록이면 true)
--------------------------------------------------------------------------------------------------------------- */
const isTrial = computed(() => !import.meta.env.VITE_DEVEXTREME_LICENSE_KEY);

/* ---------------------------------------------------------------------------------------------------------------
사용법 코드
--------------------------------------------------------------------------------------------------------------- */
const installCode = `# 코어 + Vue 래퍼 (버전을 정확히 고정 — DevExtreme 은 Semantic Versioning 을 쓰지 않습니다)
pnpm add -E devextreme@26.1.3 devextreme-vue@26.1.3

# 엑셀 내보내기를 쓸 경우 (DevExtreme 이 번들하지 않습니다)
pnpm add -E exceljs@4.4.0

# Vue 3 는 devextreme v23.1 부터 지원되고, v24.1 부터는 Vue 3 전용입니다.

# ---- 테마 CSS ----
# DevExtremeGrid.vue 가 이미 import 하고 있습니다:
#   import 'devextreme/dist/css/dx.fluent.blue.light.css';
# 테마 CSS 는 전부 .dx-* 로 스코프되어 있어 Vuetify 와 충돌하지 않습니다.
# (전역 변수·맨몸 셀렉터·전체 셀렉터가 하나도 없음을 실제로 확인했습니다)

# ---- 한글화 ----
# 별도 작업이 필요 없습니다. DevExtreme 이 ko.json(854개 문구)을 제공하고
# 컴포넌트가 loadMessages + locale('ko') 을 자동으로 적용합니다.`;

const licenseCode = `# DevExtreme 은 상용 제품입니다. 평가판은 30일입니다.
# 키를 등록하지 않으면 화면 메시지 + 콘솔 경고가 표시됩니다 (기능은 동작).

# ---- 라이선스 키 등록 ----
# 1) DevExpress Download Manager 에서 라이선스 키를 받습니다.
# 2) devextreme-license CLI 로 런타임 키를 생성합니다.
# 3) .env 에 넣습니다 (소스에 하드코딩하지 않습니다):

VITE_DEVEXTREME_LICENSE_KEY=여기에_런타임_키

# 컴포넌트가 import.meta.env 에서 읽어 config({ licenseKey }) 로 등록합니다.
# 저장소 루트의 .env.example 을 .env 로 복사해서 쓰면 됩니다.
# (.env / .env.* 는 .gitignore 에 등록되어 있어 커밋되지 않습니다)

# ---- 주의 ----
# - 키는 만료되지 않지만 "메이저 버전"에 묶입니다.
#   v26.1 키는 v26.1 이하에서 유효하고, 상위 버전 키는 하위에도 쓸 수 있습니다.
# - 30일이 지나도 기능이 차단되지는 않지만, 라이선스 없이 운영에 쓰는 것은 위반입니다.`;

const basicCode = `<DevExtremeGrid v-model="rows" :columns="columns" :height="360" row-number />

const columns = [
  { field: 'empNo' , header: '사번'  , type: 'text' },
  { field: 'deptCd', header: '부서'  , type: 'code'  , codes: DEPT_CODES },
  { field: 'salary', header: '급여'  , type: 'amount' },
  { field: 'hireDt', header: '입사일', type: 'date' },
  { field: 'useYn' , header: '사용'  , type: 'yn' },
];

/* SlickGrid 공통 컴포넌트와 "같은 축약 문법"입니다.
   type 하나로 자료형/포맷/정렬/코드변환이 결정됩니다.
     text | longText | number | decimal | amount | date | datetime | yn | code
     | checkbox | button | image | file | link

   type 별 매핑 (SlickGrid 와 달라지는 부분)
     - 정렬  : cssClass 가 아니라 column.alignment
     - 포맷  : DevExtreme 내장 format (날짜) / customizeText (단위·축약)
     - 코드  : column.lookup { dataSource, valueExpr, displayExpr }
     - 검증  : column.validationRules 배열 */

<!-- ================= 가로 폭 ================= -->
<!-- 기본값(fit-width)으로 표가 컨테이너를 꽉 채웁니다 -->
<DevExtremeGrid v-model="rows" :columns="columns" />

<!-- 남는 공간을 특정 컬럼이 가져가게 하려면 fill -->
const columns = [
  { field: 'empNo', header: '사번', width: 110 },
  { field: 'memo' , header: '비고', width: 200, fill: true },  // 이 컬럼이 늘어남
  { field: 'useYn', header: '사용', width: 80  },
];

<!-- 컬럼을 내용 크기에 맞추고 싶으면 (표가 컨테이너보다 좁게 남을 수 있음) -->
<DevExtremeGrid v-model="rows" :columns="columns" :fit-width="false" />

/* fill 을 지정하지 않으면 리치 셀(버튼/체크박스/이미지/첨부)을 뺀 가장 넓은 컬럼이 늘어납니다.
   지정했던 width 는 minWidth 로 남아 원래보다 좁아지지 않습니다.

   [구현 메모] DevExtreme 은 "모든 컬럼에 width 가 있고 합계가 컨테이너보다 좁으면"
   그리드 루트에 인라인 max-width 를 박아 표를 컬럼 합계로 고정합니다.
   인라인이라 CSS width:100% 로는 못 덮습니다. 그래서 폭을 비워 둘 컬럼을 하나 만듭니다. */`;

const searchCode = `<!-- (1) 그리드 내부 필터 : filterable + searchable -->
<DevExtremeGrid v-model="rows" :columns="columns" filterable searchable />
// 컬럼에 filter: true 를 준 것만 헤더 값목록 필터가 붙습니다.

<!-- (2) 그리드 밖 입력창으로 조회 -->
<VTextField v-model="form.name" label="이름" />
<Button @click="doSearch">조회</Button>

<DevExtremeGrid ref="gridRef" v-model="rows" :columns="columns" />

const doSearch = () => {
  gridRef.value.applyFilters([
    { field: 'name'  , value: form.name },                 // 기본 = contains(LIKE)
    { field: 'deptCd', value: form.deptCd, operator: '=' },
  ]);
};
const resetSearch = () => gridRef.value.clearFilters();

/* 값이 빈 조건은 자동으로 제외됩니다.
   SlickGrid 래퍼는 필터를 쓰려면 컬럼에 filterable 을 켜야 했지만
   DevExtreme 은 grid.filter() 가 컬럼 설정과 무관하게 동작해 별도 옵션이 필요 없습니다.

   operator: contains(기본) / = / <> / > / >= / < / <= / startswith / endswith */`;

const crudCode = `<Button @click="add">추가</Button>
<Button @click="openModal">수정 (모달)</Button>
<Button @click="remove">삭제</Button>

<DevExtremeGrid
  ref="gridRef"
  v-model="rows"
  :columns="columns"
  selectable multi-select checkbox-selector
  @on-selection-change="({ items }) => selected = items"
/>

// ---- 선택 ----
gridRef.value.getSelectedItems();
gridRef.value.selectAll();
gridRef.value.clearSelection();
gridRef.value.setSelectedKeys([1, 2, 5]);

// ---- CRUD ----
gridRef.value.addRows([newItem]);          // 맨 위에 추가
gridRef.value.updateRows([changedItem]);   // idField 로 대상을 찾아 병합
gridRef.value.removeRows(items);
gridRef.value.removeSelectedRows();

/* 전체선택 체크박스는 selectAllMode: 'allPages' 라서
   현재 페이지가 아니라 "전체 데이터"를 대상으로 선택합니다.
   showCheckBoxesMode: 'always' 로 체크박스를 항상 표시합니다
   (기본값 onClick 은 마우스를 올려야 나타나 발견이 어렵습니다). */`;

const editCode = `<DevExtremeGrid
  v-model="rows"
  :columns="columns"
  editable
  edit-mode="cell"          <!-- cell | row | batch | form | popup -->
  @on-cell-change="onChange"
  @on-dirty-change="({ count, rows }) => dirty = { count, rows }"
/>

const columns = [
  { field: 'name', header: '이름', type: 'text', editable: true, required: true },

  { field: 'empNo', header: '사번', type: 'text', editable: true,
    pattern: /^E\\d{5}$/, patternMessage: '사번은 E + 숫자 5자리입니다' },

  { field: 'salary', header: '급여', type: 'amount', editable: true,
    validator: v => Number(v) > 0, validatorMessage: '급여는 0보다 커야 합니다' },
];

// ---- 변경행 추적 ----
const save = async () => {
  const items = gridRef.value.getDirtyItems();
  if (!items.length) return;
  await axios.post('/api/emp/bulk', items);
  gridRef.value.clearDirty();
};

/* [SlickGrid 래퍼와 다른 점]
   DevExtreme 의 custom 검증 규칙은 validationCallback 이 boolean 만 받고
   message 는 규칙 생성 시점에 고정됩니다. 값에 따라 문구를 바꿀 수 없습니다.
   그래서 validator 는 통과/실패 판정만 하고 문구는 validatorMessage 로 지정합니다.
   (SlickGrid 은 validator 가 돌려준 문자열을 그대로 메시지로 썼습니다)

   변경 필드는 onRowUpdating 의 e.newData 로 잡습니다.
   onCellValueChanged 는 DataGrid 에 없는 이벤트입니다 — 붙여도 조용히 무시됩니다. */`;

const cellCode = `const columns = [
  // 버튼 — action 으로 분기, 행 상태로 비활성
  { name: 'edit', header: '수정', type: 'button', buttonText: '수정', action: 'edit' },
  { name: 'del' , header: '삭제', type: 'button', buttonText: '삭제', action: 'del',
    buttonDisabled: row => row.locked },

  // 체크박스 — 'Y'/'N' 문자열로 저장 (클릭하면 데이터까지 갱신)
  { field: 'approveYn', header: '승인', type: 'checkbox',
    checkedValue: 'Y', uncheckedValue: 'N' },

  // 이미지 / 첨부 / 링크
  { field: 'photo' , header: '사진', type: 'image', imageHeight: 24 },
  { field: 'attach', header: '첨부', type: 'file' },   // { name, url } 또는 URL 문자열

  // 숫자 단위 축약 : 1,234,000 -> "1,234 천원"
  { field: 'budget', header: '예산', type: 'number', unit: '천원', scale: 1000 },
];

<DevExtremeGrid
  v-model="rows" :columns="columns"
  @on-cell-action="({ action, item }) => ..."   <!-- 버튼 클릭 -->
  @on-cell-toggle="({ field, value, item }) => ..."  <!-- 체크박스 -->
  @on-row-click="({ item }) => ..."
/>

/* 버튼/체크박스 클릭은 @click.stop 으로 행 클릭과 분리되어 있습니다.
   (수정 버튼을 눌렀는데 행 상세까지 열리는 것을 막습니다)

   [SlickGrid 래퍼와 다른 점]
   SlickGrid 은 가상 렌더링 때문에 포맷터가 HTMLElement 를 직접 만들고
   data-sg-action 속성으로 이벤트를 올렸지만,
   DevExtreme 은 Vue 템플릿 슬롯(cellTemplate)을 지원해 그냥 Vue 컴포넌트를 씁니다.
   직접 만들려면 컬럼에 cellTemplate 을 주고 <template #이름> 을 정의하면 됩니다. */`;

const headerAlignCode = `const columns = [
  { field: 'empNo' , header: '사번', headerAlign: 'left'  },  // 컬럼명만 왼쪽
  { field: 'name'  , header: '이름'                        },  // 생략 = 중앙(기본)
  { field: 'deptCd', header: '부서', headerAlign: 'right' },  // 컬럼명만 오른쪽

  // 셀은 우측정렬(amount 기본), 컬럼명은 중앙 — 업무 화면에서 가장 흔한 조합
  { field: 'salary', header: '급여', type: 'amount' },
];

<!-- 그리드 전체 기본값을 바꾸려면 -->
<DevExtremeGrid v-model="rows" :columns="columns" header-align="left" />

/* align       : 셀(데이터) 정렬
   headerAlign : 컬럼명 정렬 — 서로 독립이며 기본값은 중앙입니다.

   [구현 메모] DevExtreme 은 headerCssClass 옵션이 없고,
   셀 팩토리가 헤더 td 에 style.textAlign 을 인라인으로 박습니다.
   그래서 래퍼가 컬럼 cssClass 에 dxg-h-* 클래스를 심고
   theme CSS 에서 헤더 안쪽만 !important 로 덮어씁니다. */`;

const viewCode = `<!-- 합계 행 + 2단 헤더 + 로딩 -->
<DevExtremeGrid
  v-model="rows" :columns="columns"
  :loading="loading"
  show-summary
  filterable
/>

const columns = [
  // 2단 헤더 : group 이 같은 "연속된" 컬럼끼리 묶입니다
  { field: 'empNo' , header: '사번', group: '기본 정보' },
  { field: 'name'  , header: '이름', group: '기본 정보' },

  // 합계 : summary 를 지정한 컬럼만 값이 나옵니다
  { field: 'salary', header: '급여'  , type: 'amount' , group: '급여 정보', summary: 'sum' },
  { field: 'rate'  , header: '점수'  , type: 'decimal', group: '급여 정보', summary: 'avg' },
  { field: 'hireDt', header: '입사일', type: 'date'   , group: '재직 정보', summary: 'count' },
];

/* summary : sum | avg | count | min | max | (value) => 표시문자열
   - 필터를 걸면 걸러진 결과 기준으로 DevExtreme 이 자동 재계산합니다.
     (SlickGrid 은 우리가 직접 footer 셀에 값을 써넣어야 했습니다)
   - 본문과 같은 표기를 씁니다. 단위/천원축약이 합계에도 적용됩니다.

   2단 헤더는 중첩 columns 구조로 변환됩니다:
     [{ caption: '기본 정보', columns: [...] }, ...]
   DevExtreme 의 ownerBand 는 문자열이 아니라 "밴드 컬럼의 배열 인덱스"라 쓰지 않습니다. */

<!-- 그룹핑 -->
<DevExtremeGrid ref="g" v-model="rows" :columns="columns" groupable />
g.value.groupBy('deptCd');              // 코드로도 가능
g.value.groupBy(['deptCd', 'gradeCd']); // 2단 그룹
g.value.clearGrouping();

<!-- 페이지네이션 : 기본값만으로 아래 구성이 모두 켜집니다 -->
<DevExtremeGrid v-model="rows" :columns="columns" pageable :page-size="20" />

<!-- 전체 옵션 -->
<DevExtremeGrid
  pageable
  :page-size="20"
  :page-sizes="[20, 50, 100, 500]"   <!-- 건수 입력창의 추천 목록 -->
  pagination-align="center"           <!-- left | center | right (기본 right) -->
  pagination-page-size-mode="input"   <!-- input(기본) | buttons -->
  pagination-page-size-label="페이지당"
  :pagination-page-size-min="1"
  :pagination-page-size-max="1000"
  :pagination-show-page-size="true"   <!-- 페이지당 건수 -->
  :pagination-show-info="true"        <!-- "7페이지 중 1페이지 (137개 항목)" -->
  :pagination-show-pages="true"       <!-- 페이지 번호 1 2 3 … -->
  :pagination-show-navigation="true"  <!-- 이전/다음 이동 버튼 -->
  @on-page-size-change="({ pageSize }) => ..."
/>

/* pagination-page-size-mode
     input   : 목록에서 고르거나 숫자를 직접 입력하는 입력창 (목록에 없는 35 같은 값도 가능)
               범위를 벗어나면 min/max 로 잘라서 되돌려 줍니다. 건수가 바뀌면 1페이지로 갑니다.
     buttons : DevExtreme 기본 방식인 [20][50][100][500] 버튼

   [구현 메모]
   - 정렬과 "페이지 번호 숨기기"는 DevExtreme 에 옵션이 없어 CSS 로 처리합니다.
   - 건수 입력창은 DevExtreme 페이저 밖(래퍼 소유)에 두고 페이저 행에 겹칩니다.
     페이저 안에 넣으면 페이지를 이동할 때 페이저가 다시 그려지면서 지워집니다. */

<!-- 대용량 : pageable 을 끄면 가상 스크롤로 동작합니다 -->
<DevExtremeGrid v-model="rows" :columns="columns" :height="360" />

<!-- 엑셀 내보내기 -->
<DevExtremeGrid ref="g" excel-export export-filename="사원목록" export-sheet-name="사원" />
g.value.exportToExcel();
/* exceljs 를 동적 import 해서 실제 내보낼 때만 로드합니다 (1MB 가 넘어 번들에 넣지 않습니다).
   .xlsx 로 저장하므로 한글 파일명·내용이 안전합니다. */`;

const extendCode = `<!-- 2층 : DevExtreme 원본 옵션 통과 -->
<DevExtremeGrid v-model="rows" :columns="columns" :options="options" />

const options = {
  focusedRowEnabled: true,       // 래퍼 props 에 없지만 그대로 동작
  columnFixing: { enabled: true },
  rowAlternationEnabled: false,
  showColumnLines: false,
};
/* 객체는 깊게 병합되고 배열은 교체됩니다. 사용자 options 가 항상 기본값을 이깁니다. */

<!-- 4층 : 탈출구 -->
<DevExtremeGrid ref="g" @on-grid-created="({ instance }) => ..." />

// DevExtreme 위젯 인스턴스 전체
const grid = g.value.getGrid();
grid.navigateToRow(key);
grid.expandAll();
grid.columnOption('salary', 'sortOrder', 'desc');
grid.beginCustomLoading('조회 중...');

// 상태 저장/복원 (사용자별 레이아웃)
g.value.getState();
g.value.setState(saved);
// 또는 state-key 를 주면 localStorage 에 자동 저장됩니다
<DevExtremeGrid state-key="emp-grid" />

// 평가판 여부
g.value.isTrial();`;
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>DevExtreme Grid</VCardTitle>
      <VCardSubtitle>
        devextreme-vue 26.1.3 기반 데이터 그리드. SlickGrid 공통 컴포넌트와 같은 축약 문법·4계층 구조를 씁니다.
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <!-- 평가판 안내 -->
      <VAlert v-if="isTrial" type="warning" density="compact" variant="tonal" class="mb-4">
        <strong>평가판으로 동작 중입니다.</strong> DevExtreme 은 상용 제품이며 평가 기간은 30일입니다. 라이선스 키를 등록하지 않으면 화면에 안내
        메시지와 콘솔 경고가 표시됩니다 (기능은 정상 동작). 등록 방법은 <strong>가이드</strong> 탭을 참고하세요.
      </VAlert>

      <div class="dxg-sections">
        <button
          v-for="s in SECTIONS"
          :key="s.key"
          type="button"
          class="dxg-sections__btn"
          :class="{ 'is-active': section === s.key }"
          @click="section = s.key"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- ============================ 가이드 ============================ -->
      <div v-if="section === 'guide'">
        <h3 class="mb-1">설치</h3>
        <p class="text-caption mb-2">코어(devextreme) + Vue 래퍼(devextreme-vue) 두 패키지가 필요합니다.</p>
        <CodeCard class="mb-6" title="설치 방법 보기" :code="installCode" open />

        <h3 class="mb-1">라이선스 (중요)</h3>
        <p class="text-caption mb-2">
          상용 제품입니다. 평가판 30일이 지나도 기능이 차단되지는 않지만, 라이선스 없이 운영에 쓰는 것은 위반입니다.
        </p>
        <CodeCard class="mb-6" title="라이선스 키 등록 방법 보기" :code="licenseCode" open />

        <h3 class="mb-1">SlickGrid 컴포넌트와의 관계</h3>
        <p class="text-caption mb-2">
          두 컴포넌트는 <strong>같은 축약 컬럼 문법</strong>과 <strong>같은 4계층 구조</strong>, <strong>같은 이벤트 이름</strong>을 씁니다. 컬럼
          정의와 사용처 코드를 거의 그대로 옮길 수 있게 만든 것입니다. 라이브러리 차이에서 오는 부분은 각 섹션의 사용법 카드 하단에 적어두었습니다.
        </p>
      </div>

      <!-- ============================ 기본 ============================ -->
      <div v-if="section === 'basic'">
        <h3 class="mb-1">기본</h3>
        <p class="text-caption mb-2">
          정렬 / 컬럼 폭 조절 / 컬럼 순서 변경은 옵션이 아니라 기본값입니다. 헤더를 클릭하거나 드래그해 보세요.
        </p>
        <DevExtremeGrid v-model="basicRows" :columns="basicColumns" :height="360" row-number />
        <CodeCard class="mt-2 mb-6" :code="basicCode" />
      </div>

      <!-- ============================ 조회 · 필터 ============================ -->
      <div v-if="section === 'search'">
        <h3 class="mb-1">1) 필터 행 + 전체 검색창</h3>
        <p class="text-caption mb-2">
          총 {{ filterRows.length }}건. 우측 상단 검색창은 모든 컬럼을 대상으로 검색합니다. code/yn 타입은 필터가 자동으로 선택 목록이 됩니다.
        </p>
        <DevExtremeGrid v-model="filterRows" :columns="filterColumns" :height="380" row-number filterable searchable column-chooser />

        <h3 class="mb-1 mt-6">2) 그리드 밖 입력창으로 조회</h3>
        <p class="text-caption mb-2">상단 조회조건 + [조회] 버튼 패턴입니다. 값이 빈 조건은 자동으로 제외됩니다.</p>
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
          <VCol cols="12" sm="6" class="d-flex align-center">
            <Button type="confirm" class="mr-2" @click="doSearch">조회</Button>
            <Button @click="resetSearch">초기화</Button>
            <span v-if="searchMsg" class="text-caption ml-3">{{ searchMsg }}</span>
          </VCol>
        </VRow>
        <DevExtremeGrid ref="searchGrid" v-model="searchRows" :columns="basicColumns" :height="300" row-number />
        <CodeCard class="mt-2 mb-6" :code="searchCode" />
      </div>

      <!-- ============================ 선택 · CRUD ============================ -->
      <div v-if="section === 'crud'">
        <h3 class="mb-1">다중 선택 + 그리드 밖 버튼으로 CRUD / 모달</h3>
        <p class="text-caption mb-2">
          좌측 상단 전체선택 체크박스로 다중 선택하고, 선택한 행을 그리드 밖 버튼으로 처리합니다. 전체선택은 현재 페이지가 아니라 전체 데이터를
          대상으로 합니다.
        </p>
        <div class="mb-2">
          <Button type="confirm" class="mr-2" @click="crudAdd">추가</Button>
          <Button class="mr-2" @click="crudOpenModal">수정 (모달)</Button>
          <Button type="cancel" class="mr-2" @click="crudDelete">삭제</Button>
          <span class="text-caption ml-2">{{ crudMsg }}</span>
        </div>
        <DevExtremeGrid
          ref="crudGrid"
          v-model="crudRows"
          :columns="basicColumns"
          :height="340"
          row-number
          selectable
          multi-select
          checkbox-selector
          @on-selection-change="onCrudSelection"
        />
        <VAlert v-if="crudSelected.length" density="compact" variant="tonal" class="mt-2">
          <div class="text-caption">선택: {{ crudSelected.map((i) => i.empNo).join(", ") }}</div>
        </VAlert>
        <CodeCard class="mt-2 mb-6" :code="crudCode" />

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
              <Button type="confirm" @click="crudSave">저장</Button>
            </VCardActions>
          </VCard>
        </VDialog>
      </div>

      <!-- ============================ 편집 ============================ -->
      <div v-if="section === 'edit'">
        <h3 class="mb-1">인라인 편집 + 검증 + 변경행 추적</h3>
        <p class="text-caption mb-2">
          셀을 클릭해 편집합니다. 이름은 필수, 사번은 <code>E+숫자5자리</code> 형식, 급여는 0 초과만 허용합니다. 편집한 행만 모아 저장 API 로 보낼 수
          있습니다.
        </p>
        <div class="mb-2">
          <Button type="confirm" @click="saveDirty">변경 저장 ({{ dirtyInfo.count }}건)</Button>
          <span v-if="saveMsg" class="text-caption ml-3">{{ saveMsg }}</span>
        </div>
        <DevExtremeGrid
          ref="editGrid"
          v-model="editRows"
          :columns="editColumns"
          :height="320"
          row-number
          editable
          edit-mode="cell"
          @on-dirty-change="onDirtyChange"
        />
        <VAlert v-if="dirtyInfo.count" density="compact" variant="tonal" class="mt-2">
          <div class="text-caption font-weight-bold">변경행 {{ dirtyInfo.count }}건</div>
          <div v-for="(row, i) in dirtyInfo.rows" :key="i" class="text-caption">
            {{ row.item.empNo }} — 변경 필드: {{ row.fields.join(", ") }}
          </div>
        </VAlert>
        <CodeCard class="mt-2 mb-6" :code="editCode" />
      </div>

      <!-- ============================ 셀 표현 ============================ -->
      <div v-if="section === 'cell'">
        <h3 class="mb-1">셀 안의 컴포넌트 + 클릭 이벤트</h3>
        <p class="text-caption mb-2">
          버튼 / 체크박스 / 이미지 / 첨부파일을 셀에 넣고 클릭 이벤트를 돌려받습니다. 비고는 <code>...</code>으로 줄고, 예산은
          <code>scale: 1000</code>으로 천원 단위입니다. 4번째 행의 삭제 버튼은 <code>buttonDisabled</code>로 막혀 있습니다.
        </p>
        <DevExtremeGrid
          v-model="cellRows"
          :columns="cellColumns"
          :height="340"
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
        <CodeCard class="mt-2 mb-6" :code="cellCode" />

        <h3 class="mb-1 mt-6">컬럼명 정렬 (왼쪽 / 중앙 / 오른쪽)</h3>
        <p class="text-caption mb-2">
          컬럼명 정렬은 셀 정렬(<code>align</code>)과 <strong>독립</strong>입니다. 기본값은 중앙이고 컬럼별로
          <code>headerAlign</code>을 주면 그 컬럼만 바뀝니다. 그리드 전체 기본값은 <code>header-align</code> prop 으로 바꿉니다.
        </p>
        <DevExtremeGrid v-model="headerAlignRows" :columns="headerAlignColumns" row-number />
        <CodeCard class="mt-2 mb-6" :code="headerAlignCode" />
      </div>

      <!-- ============================ 표시 · 성능 ============================ -->
      <div v-if="section === 'view'">
        <h3 class="mb-1">1) 합계 행 + 2단 헤더 + 로딩</h3>
        <p class="text-caption mb-2">
          컬럼에 <code>group</code>을 주면 위에 묶음 제목(2단 헤더)이 생기고, <code>summary</code>를 주면 하단 합계가 나옵니다. 급여에 필터를 걸면
          <strong>걸러진 결과 기준으로 자동 재계산</strong>됩니다.
        </p>
        <div class="mb-2">
          <Button @click="toggleLoading">조회 중 표시 (1.5초)</Button>
        </div>
        <DevExtremeGrid
          v-model="summaryRows"
          :columns="summaryColumns"
          :height="340"
          :loading="summaryLoading"
          row-number
          filterable
          show-summary
        />

        <h3 class="mb-1 mt-6">2) 그룹핑</h3>
        <p class="text-caption mb-2">{{ groupMsg }}</p>
        <div class="mb-2">
          <Button class="mr-2" @click="doGroupBy('deptCd', '부서')">부서로 그룹</Button>
          <Button class="mr-2" @click="doGroupBy('gradeCd', '직급')">직급으로 그룹</Button>
          <Button class="mr-2" @click="doGroupBy(['deptCd', 'gradeCd'], '부서 → 직급')">부서 → 직급 (2단)</Button>
          <Button @click="doClearGroup">해제</Button>
        </div>
        <DevExtremeGrid ref="groupGrid" v-model="groupRows" :columns="filterColumns" :height="380" groupable />

        <h3 class="mb-1 mt-6">3) 페이지네이션 — 정렬 3종 + 구성요소 켜고 끄기</h3>
        <p class="text-caption mb-2">
          총 {{ pagingRows.length }}건. <strong>페이지당 건수</strong>는 목록에서 고르거나 숫자를 직접 입력할 수 있습니다(예: 35). 정보 표시·페이지 번호·이동
          버튼도 각각 끌 수 있습니다.
        </p>
        <div class="mb-1">
          <span class="text-caption mr-2">정렬</span>
          <Button v-for="a in PAGING_ALIGNS" :key="a" :type="pagingAlign === a ? 'confirm' : 'normal'" class="mr-2" @click="pagingAlign = a">
            {{ a }}
          </Button>
        </div>
        <div class="mb-1">
          <span class="text-caption mr-2">건수 선택 방식</span>
          <Button :type="pagingPageSizeMode === 'input' ? 'confirm' : 'normal'" class="mr-2" @click="pagingPageSizeMode = 'input'">입력창</Button>
          <Button :type="pagingPageSizeMode === 'buttons' ? 'confirm' : 'normal'" class="mr-2" @click="pagingPageSizeMode = 'buttons'">
            버튼(DevExtreme 기본)
          </Button>
        </div>
        <div class="mb-2">
          <span class="text-caption mr-2">표시</span>
          <Button :type="pagingShowPageSize ? 'confirm' : 'normal'" class="mr-2" @click="pagingShowPageSize = !pagingShowPageSize">페이지당 건수</Button>
          <Button :type="pagingShowInfo ? 'confirm' : 'normal'" class="mr-2" @click="pagingShowInfo = !pagingShowInfo">건수 정보</Button>
          <Button :type="pagingShowPages ? 'confirm' : 'normal'" class="mr-2" @click="pagingShowPages = !pagingShowPages">페이지 번호</Button>
          <Button :type="pagingShowNav ? 'confirm' : 'normal'" class="mr-2" @click="pagingShowNav = !pagingShowNav">이동 버튼</Button>
          <span v-if="pagingMsg" class="text-caption ml-3">{{ pagingMsg }}</span>
        </div>
        <DevExtremeGrid
          :key="`${pagingAlign}-${pagingPageSizeMode}-${pagingShowPageSize}-${pagingShowInfo}-${pagingShowNav}`"
          v-model="pagingRows"
          :columns="filterColumns"
          :height="340"
          row-number
          pageable
          :page-size="20"
          :pagination-align="pagingAlign"
          :pagination-page-size-mode="pagingPageSizeMode"
          :pagination-show-page-size="pagingShowPageSize"
          :pagination-show-info="pagingShowInfo"
          :pagination-show-pages="pagingShowPages"
          :pagination-show-navigation="pagingShowNav"
          filterable
          @on-page-size-change="onPageSizeChange"
        />

        <h3 class="mb-1 mt-6">4) 대용량 (가상 스크롤)</h3>
        <p class="text-caption mb-2">
          <code>pageable</code>을 끄면 가상 스크롤로 동작합니다. 화면에 보이는 행만 DOM 으로 만들기 때문에 행 수가 늘어도 스크롤 성능이 유지됩니다.
        </p>
        <div class="mb-2">
          <Button class="mr-2" @click="loadBig(10000)">1만행</Button>
          <Button class="mr-2" @click="loadBig(100000)">10만행</Button>
          <Button class="mr-2" @click="loadBig(500000)">50만행</Button>
          <span v-if="bigMsg" class="text-caption ml-3">{{ bigMsg }}</span>
        </div>
        <DevExtremeGrid v-model="bigRows" :columns="filterColumns" :height="380" filterable />

        <h3 class="mb-1 mt-6">5) 엑셀 내보내기</h3>
        <p class="text-caption mb-2">
          화면에 보이는 포맷 그대로 <code>.xlsx</code>로 내보냅니다. <code>exceljs</code>는 실제로 내보낼 때만 동적 import 됩니다.
        </p>
        <div class="mb-2">
          <Button type="confirm" @click="doExport">엑셀 다운로드</Button>
          <span v-if="exportMsg" class="text-caption ml-3">{{ exportMsg }}</span>
        </div>
        <DevExtremeGrid
          ref="excelGrid"
          v-model="excelRows"
          :columns="filterColumns"
          :height="300"
          row-number
          excel-export
          export-filename="사원목록"
          export-sheet-name="사원"
          @on-export-complete="onExportComplete"
        />
        <CodeCard class="mt-2 mb-6" :code="viewCode" />
      </div>

      <!-- ============================ 확장 ============================ -->
      <div v-if="section === 'extend'">
        <h3 class="mb-1">2층 원본 옵션 통과 + 4층 탈출구</h3>
        <p class="text-caption mb-2">
          <code>focusedRowEnabled</code>, <code>columnFixing</code> 은 래퍼 props 에 없지만 <code>:options</code>로 그대로 동작합니다. 컬럼 헤더
          메뉴에서 "고정"을 눌러보세요.
        </p>
        <div class="mb-2">
          <Button class="mr-2" @click="scrollToLast">마지막 행으로 이동</Button>
          <Button @click="showState">현재 상태 보기</Button>
        </div>
        <DevExtremeGrid
          ref="extendGrid"
          v-model="extendRows"
          :columns="filterColumns"
          :height="340"
          :options="passthroughOptions"
          row-number
          filterable
          @on-grid-created="onGridCreated"
        />
        <VAlert v-if="extendMsg" density="compact" variant="tonal" class="mt-2">{{ extendMsg }}</VAlert>
        <CodeCard v-if="gridState" class="mt-2" title="현재 그리드 상태 (컬럼 폭/순서/정렬)" :code="gridState" open />
        <CodeCard class="mt-2 mb-6" :code="extendCode" />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
/* 섹션 전환 버튼바 (Vuetify 탭 중첩 문제를 피하기 위한 자체 구현) */
.dxg-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.dxg-sections__btn {
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

.dxg-sections__btn:hover {
  background: #f0f4f8;
}

.dxg-sections__btn.is-active {
  background: #1867c0;
  border-color: #1867c0;
  color: #fff;
  font-weight: 600;
}

code {
  padding: 1px 4px;
  border-radius: 3px;
  background: rgb(0 0 0 / 7%);
  font-size: 0.85em;
}
</style>
