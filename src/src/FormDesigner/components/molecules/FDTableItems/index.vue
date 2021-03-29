<template>
  <div>
     <CustomInput
        @updateAppearance="updateAppearance"
        v-if="
          propertyType === 'String' ||
            propertyType === 'float' ||
            propertyType === 'number' ||  propertyType === 'file'
        "
        :propertyData="controlPropertyData"
        :propertyName="propertyName"
        :isPropChanged="isPropChanged"
      />
      <CustomDropDown
        @updateAppearance="updateAppearance"
        v-if="propertyType === 'array' || propertyType === 'Boolean'"
        :propertyData="controlPropertyData"
        :propertyName="propertyName"
      />
      <CustomColorTabs
        v-if="propertyType === 'color'"
        :propertyData="controlPropertyData"
        :propertyName="propertyName"
        @colorPaletteProp = "colorPaletteProp"
      />
      <CustomFontDialog
        v-if="propertyType === 'font'"
        :userFormId="userFormId"
        :propertyData="controlPropertyData"
        :getSelectedControlsDatas="getSelectedControlsDatas"
        :propertyName="propertyName"
        @emitFont="emitFont"

      />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator'
import CustomDropDown from '../../atoms/FDCustomDropDown/index.vue'
import CustomInput from '../../atoms/FDCustomInput/index.vue'
import CustomColorTabs from '../../organisms/FDCustomColorTabs/index.vue'
import CustomFontDialog from '../../organisms/FDCustomFontDialog/index.vue'

@Component({
  name: 'FDTableItems',
  components: {
    CustomDropDown,
    CustomInput,
    CustomColorTabs,
    CustomFontDialog
  }
})
export default class FDTableItems extends Vue {
  @Prop({}) controlPropertyData! : tableData
  @Prop({ default: 'default' }) propertyName!: string
  @Prop({ required: true, type: String }) public readonly userFormId! : string
  @Prop({ required: true }) public readonly getSelectedControlsDatas: any
  @Prop({ required: false }) public readonly isPropChanged: boolean

  get propertyType () {
    return this.controlPropertyData.type
  }
  @Emit('updateAppearance')
  updateAppearance (e: Event) {
    return e
  }
  @Emit('emitFont')
  emitFont (tempVal: font) {
    return tempVal
  }
  @Emit('colorPaletteProp')
  colorPaletteProp (selectedValue: ISelectedColoPaletteValue) {
    return selectedValue
  }
}

</script>

<style>

</style>
