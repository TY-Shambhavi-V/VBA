# FormDesigner

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

## Component Composition
- index.vue : vue source code
- index.spec.md : source explain
- index.stories.js : storybook code
- index.test.ts : unit test code

## Run storybook
```
npm run storybook:serve
```
- story book file format : *.stories.js

#### use storybook knob (it will use to check control ui when change property)
![story_knobs](/uploads/486bc3a38ebbdd23a68c2b8c50a04563/story_knobs.png)

#### use stroybook Notes (component usage and spec)
- make index.spec.md

## Run your unit tests
```
npm run test:unit
```
#### check unit test result
![vue_unit_test](/uploads/8f4c2af24a59caebbd281de2a93fee9b/vue_unit_test.png)

- vue unit test code file format : *.test.ts
- test result file location : coverage/lcov-report

#### usage see this
https://vue-test-utils.vuejs.org/

## Vue atomic design sample (it will help that understand this project composition)
- https://github.com/milad-alizadeh/vue-cli-plugin-atomic-design

<em>
- https://github.com/milad-alizadeh/vue-cli-plugin-atomic-design-components
</em>

## Form Designer Sample loaction
- src/FormDesigner/components/atoms/FDSample

## Vue using ts. see this module
- vue-property-decorator
- vuex-class
