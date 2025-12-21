<script setup>
import { reactive } from 'vue';
import Editor from '@tinymce/tinymce-vue';

/*************************************************************************************************
 * TinyMce기반 웹 에디터. gpl 라이센스로 사용하려면 프로젝트 루트 아래 public에 tinymce를 자체 호스팅하도록 해야한다. 
 *  - 이 프로젝트의 public/tinymce 폴더 복사하면 tinymce를 별도로 install할 필요없음
 *  - 만약 tinymce를 별도로 install 해서 리소스를 복사했다면 내용이 없는 /tinymce/empty.css 파일을 만들어준다.
 *    (작성할때와 작성된 html을 다른곳에서 사용할때 일관성 유지를 위해)
 *  - 만약 tinymce를 별도로 install 했다면 리소스 복사후 tinymce는 uninstall 해도상관없다. (tinymce-vue는 삭제X)
 *  - 만약 tinymce-script-src="/tinymce/tinymce.min.js" 설정과 public/tinymce/tinymce.min.js가 없으면
 *    tinymce의 클라우드 서비스에서 리소스를 가져오려고 시도하고 라이센스및 api키를 요구한다.
 *************************************************************************************************/
const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '100%' },
  readonly: { type: Boolean, default: false }
})

const content = defineModel({type: String, default: null})
const refEditor = ref()

// 업로드처리 함수
// 호출하는 url이나 axios등 api 모듈, request, response 방식, 파라미터 이름 등이 달라지기 때문에
// 프로젝트마다 커스터마이징이 불가피하다.
const uploadImage = (blobInfo, progress) => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    // TODO 백엔드 업로드 API 호출하는 부분 
    // 호출하는 url이나 axios등 api 모듈, request, response 방식, 파라미터 이름 등이 달라지기 때문에
    // 프로젝트마다 커스터마이징이 불가피하다.
    axios.post('/api/upload/image', formData, {
      onUploadProgress: (e) => progress((e.loaded / e.total) * 100)
    })
    .then(res => {
      resolve(res.data.url); 
    }) 
    .catch(err => {
      reject('이미지 업로드 실패: ' + err.message);
    });
})
  
const setReadonly = (editor, state) => {
  editor.mode.set(state ? 'readonly' : 'design') 
  // 컨테이너 가져오기
  const container = editor.getContainer && editor.getContainer();
  if (!container) return;

  // 툴바/메뉴/상태바 보이기/숨기기
  const tempFn = clazz => {
    const el = container.querySelector(`.${clazz}`);
    if (el) el.style.display = state ? 'none' : '';
  };
  tempFn('tox-toolbar');
  tempFn('tox-menubar');  
  tempFn('tox-statusbar');
};
 
watch(() => props.readonly, nv => {
  const editor = refEditor.value?.getEditor();
  if (editor?.initialized) setReadonly(editor, nv);
})


// 에디터 설정
const editorConfig = reactive({
  width: props.width,
  height: props.height, 
  menubar: false, // 상단 메뉴바 숨김 
  branding: false, // 우측 하단 TinyMCE 로고 숨김
  skin_url: '/tinymce/skins/ui/oxide',
  content_css: '/tinymce/empty.css',   
  setup: (editor) => {
    editor.on('init', () => {
      editor.execCommand('FontName', false, '맑은 고딕'); 
      if(props.readonly) setReadonly(editor, props.readonly)
    });
    editor.on('focus', () => {
      if (props.readonly) {
        const c = editor.getContainer();
        if (c) {
          c.classList.remove('tox-edit-focus');
          c.classList.remove('tox-tinymce--focused');
          c.classList.remove('tox-editor-container--focused');
        }
      }     
    });
    editor.on('OpenWindow', (e) => {
      // 열린 다이얼로그가 'Image' 관련일 때 파일의 url 수정불가 처리
      // 조금의 지연시간을 주어 DOM이 생성된 후 속성 부여
      setTimeout(() => {
        const dialogEl = document.querySelector('.tox-dialog');
        if (dialogEl && dialogEl.innerText.includes('이미지') || dialogEl.innerText.includes('Image')) {
          const sourceInput = dialogEl.querySelector('input.tox-textfield');
          if (sourceInput) {
            sourceInput.setAttribute('readonly', 'readonly');
            sourceInput.style.backgroundColor = '#f5f5f5'; // 읽기 전용 느낌의 배경색
            sourceInput.style.cursor = 'not-allowed';
          }
        }
      }, 10);
    });
  },  
   
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'wordcount'
  ],

  toolbar: 'undo redo | fontfamily fontsize | bold italic backcolor | \
            alignleft aligncenter alignright alignjustify | \
            bullist numlist outdent indent | table link image | preview code',
  
  // 폰트 크기 목록 커스텀 (필요한 경우)
  font_size_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
  
  // Windows/Mac 공통으로 사용자 PC에 설치되어 있는 폰트들로만 구성
  // 혹시 서버사이드에서 html을 pdf로 변환하게되면 이 폰트들이 서버에 다 있어야 pdf생성시 텍스트가 누락되지 않는다
  font_family_formats: 
    '맑은 고딕=맑은 고딕, Malgun Gothic, Apple SD Gothic Neo, sans-serif; ' +
    '돋움=Dotum, sans-serif; ' +
    '굴림=Gulim, sans-serif; ' +
    '바탕=Batang, serif; ' +
    'Arial=arial,helvetica,sans-serif; ' +
    'Courier New=courier new,courier,monospace; ' +
    'Tahoma=tahoma,arial,helvetica,sans-serif; ' +
    'Times New Roman=times new roman,times,serif; ' +
    'Verdana=verdana,geneva,sans-serif',
  
  //툴바 줄바꿈
  toolbar_mode: 'wrap', 

  // 이미지 및 스타일 관련 설정
  // Inline Style 강제 사용: class 참조형태가되면 html을 pdf로 변환하거나 메일로 발송하거나 하는경우가 발생하면 이슈가 생길것
  inline_styles: true, 
  convert_fonts_to_spans: true,
  // 테이블 인라인 스타일 최적화
  table_default_attributes: {
    border: '1',
    style: 'border-collapse: collapse; width: 100%;' // 외부 CSS 없이도 표 형태 유지
  },
  table_default_styles: {
    'border-collapse': 'collapse',
    'width': '100%'
  },
  image_title: false,  
  image_advtab: false,
  image_uploadtab: false,
  image_description: false,
  images_file_types: 'jpeg,jpg,jpe,jfi,jif,jfif,png,gif,bmp,webp', 
  link_title: false,
  file_picker_types: 'image',
  automatic_uploads: true,
   
  //보안 관련 설정
  invalid_elements: 'script,applet,iframe', // XSS 위험 요소 원천 차단
  //extended_valid_elements: 'span[style],p[style],img[style|src|width|height|alt]', // 스타일 속성 허용
  
  // 이미지 크기 조절 핸들 활성화
  image_dimensions: true, 
  object_resizing: true,
  
  // 이미지가 에디터에 붙여넣기 되었을 때 data URI로 변환 (테스트용)
  //paste_data_images: true,
 
  // file_picker_callback에서 변환한 blob 혹은 editor에서 ctrl + v로 붙여넣은 blob를 
  // 서버에 업로드하고 그 주소를 editor에 <img src='...'/> 로 추가해주는 함수
  images_upload_handler: (blobInfo, progress) => uploadImage(blobInfo, progress),

  // 사용자 PC에서 파일을 가져와서 blob object로 변환
  file_picker_callback: (cb, value, meta) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.addEventListener('load', () => {
        const id = 'blobid' + (new Date()).getTime();
        const blobCache =  window.tinymce.activeEditor.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        // 에디터에 이미지 태그 삽입
        cb(blobInfo.blobUri(), { title: file.name });
      });
      reader.readAsDataURL(file);
    });

    input.click();
  },
});
</script>

<template>
    <Editor
    ref="refEditor"
        v-model="content"
        licenseKey="gpl"
        :init="editorConfig"    
        tinymce-script-src="/tinymce/tinymce.min.js"
    />
</template>

<style lang="scss">  
.tox-tinymce {
  border-radius: 8px !important;
  border: 1px solid #e0e0e0 !important;
}
//vuetify의 v-window-item (탭컨텐츠) 내부에 tinymce 에디터가 들어가면 
//tinymce 에디터에서 뜨는 작은 팝업들의 위치 계산에 문제가 생긴다. 
//이부분 보정을 위해 tinymce의 팝업에 일부 스타일 강제 적용
.tox-tinymce-aux {
  position: fixed !important; 
  z-index: 9999 !important;  
}
.tox-tinymce-aux .tox-pop.tox-pop--top {
  position: relative !important;
}
//이미지업로드팝업의 탭영역을 숨김
.tox-dialog__body-nav {
  display: none !important;
}   
</style>
