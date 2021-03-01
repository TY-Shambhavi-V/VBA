/* eslint-disable import/no-extraneous-dependencies */
import { configure, addDecorator } from '@storybook/vue'
import { withInfo } from 'storybook-addon-vue-info'
import { withKnobs } from '@storybook/addon-knobs'

const req = require.context('../../src/FormDesigner/components', true, /.stories.js$/)

function loadStories () {
  req.keys().forEach(filename => req(filename))
}

addDecorator(withInfo)
addDecorator(withKnobs)
configure(loadStories, module)
