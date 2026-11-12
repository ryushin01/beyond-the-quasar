// 코드 검사는 oxlint가 맡고, ESLint는 oxlint가 보지 못하는 Vue 템플릿의 접근성만 검사합니다.
import tsParser from '@typescript-eslint/parser'
import pluginVue from 'eslint-plugin-vue'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default [
  { ignores: ['dist/**', '.histoire/**', 'node_modules/**'] },
  // 템플릿 안의 <!-- eslint-disable --> 주석을 읽게 하는 기본 설정만 씁니다(규칙은 켜지 않음).
  ...pluginVue.configs['flat/base'],
  ...vueA11y.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tsParser } },
    rules: {
      // label은 for로 잇거나 입력란을 감싸면 됩니다. 둘 다 요구하지 않습니다.
      'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }],
      // ScrambleText는 글자를 그대로 그리는 부품입니다.
      'vuejs-accessibility/anchor-has-content': ['error', { accessibleChildren: ['ScrambleText'] }],
    },
  },
]
