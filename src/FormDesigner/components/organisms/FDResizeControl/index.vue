<template>
  <div>
    <div
      class="resizeMainControlStyle"
      :style="resizeControlStyle"
      :ref="'draRef'.concat(controlId)"
      @contextmenu.stop="displayContextMenu"
      @click="containerBorderClick"
      @mouseup="handleMouseUp"
    >
    <div  :class="[getBorderClass, 'm-top-b move-border']"
       @mousedown="controlDragResizeMoueDown"
       :style="getTStyle"
    />
    <div :class="[getBorderClass, 'm-right-b move-border']"
          @mousedown="controlDragResizeMoueDown"
          :style="getRStyle"
    />
    <div :class="[getBorderClass, 'm-bottom-b move-border']"
          @mousedown="controlDragResizeMoueDown"
          :style="getBStyle"
    />
    <div :class="[getBorderClass, 'm-left-b move-border']"
    :style="getLStyle"
    @mousedown="controlDragResizeMoueDown"
     />
      <ResizeHandler
        v-if="!isRunMode"
        ref="resize"
        @updateResize="updateResize"
        :controlId="controlId"
        :userFormId="userFormId"
        controlType="control"
        @createGroup="createGroup"
        @muldragControl="muldragControl"
        @updateModel="updateModelHandle"
        @updateIsMove="updateIsMove"
        :size="{
          width: propControlData.properties.Width,
          height: propControlData.properties.Height,
          left: propControlData.properties.Left,
          top: propControlData.properties.Top
        }"
      />
    </div>
    <div :style="componentStyle"
      @mousedown="controlDragResizeMoueDown"
      @contextmenu.stop="displayContextMenu"
      @mouseup="handleMouseUp"
    >
      <component
        :is="propControlData.type"
        :controlId="propControlData.properties.ID"
        :userFormId="getUserFormId"
        :data="propControlData"
        :isActivated="
          this.selectedControls[this.userFormId].selected.includes(this.controlId) &&
           this.selectedControls[this.userFormId].selected.length === 1
        "
        :isRunMode="isRunMode"
        :isEditMode="isEditMode"
        :containerId="containerId"
        :getHighestZIndex="getControlZIndex"
        @setEditMode="setEditMode"
        @selectedItem="selectedItem"
        @deleteItem="deleteItem"
        @updateModel="updateModelHandle"
        @updateModelExtraData="updateModelExtraDataHandle"
        @controlEditMode="controlEditMode"
        @updateEditMode="updateEditMode"
        :toolBoxSelectControl="toolBoxSelect"
      >
        {{ propControlData.properties.Caption }}
      </component>
    </div>
  </div>
</template>

<script lang="ts">
import {
  Component,
  Emit,
  Prop,
  Vue,
  Ref,
  PropSync,
  Watch
} from 'vue-property-decorator'
import { State, Action } from 'vuex-class'

import Label from '@/FormDesigner/components/atoms/FDLabel/index.vue'
import CommandButton from '@/FormDesigner/components/atoms/FDCommandButton/index.vue'
import ToggleButton from '@/FormDesigner/components/atoms/FDToggleButton/index.vue'
import TextBox from '@/FormDesigner/components/atoms/FDTextBox/index.vue'
import SpinButton from '@/FormDesigner/components/atoms/FDSpinButton/index.vue'
import ScrollBar from '@/FormDesigner/components/atoms/FDScrollBar/index.vue'
import OptionButton from '@/FormDesigner/components/atoms/FDOptionButton/index.vue'
import CheckBox from '@/FormDesigner/components/atoms/FDCheckBox/index.vue'
import ComboBox from '@/FormDesigner/components/atoms/FDComboBox/index.vue'
import ListBox from '@/FormDesigner/components/atoms/FDListBox/index.vue'
import FDImage from '@/FormDesigner/components/atoms/FDImage/index.vue'
import Frame from '@/FormDesigner/components/atoms/FDFrame/index.vue'
import TabStrip from '@/FormDesigner/components/atoms/FDTabStrip/index.vue'
import MultiPage from '@/FormDesigner/components/atoms/FDMultiPage/index.vue'
import ResizeHandler from '@/FormDesigner/components/molecules/FDResizeHandler/index.vue'
import FdSelectVue from '@/api/abstract/FormDesigner/FdSelectVue'
import Container from '../FDContainer/index.vue'
import { EventBus } from '@/FormDesigner/event-bus'
@Component({
  name: 'ResizeControl',
  components: {
    ResizeHandler,
    Label,
    CommandButton,
    ToggleButton,
    TextBox,
    SpinButton,
    ScrollBar,
    CheckBox,
    OptionButton,
    FDImage,
    Frame,
    ComboBox,
    ListBox,
    TabStrip,
    MultiPage
  }
})
export default class ResizeControl extends FdSelectVue {
  @State((state: rootState) => state.fd.toolBoxSelect) toolBoxSelect!: fdState['toolBoxSelect'];
  @PropSync('currentSelectedGroup') public syncCurrentSelectedGroup!: string;
  @Prop({ required: true, type: String }) public containerId!: string;
  @Ref('resize') readonly resize!: ResizeHandler;
  selMultipleCtrl: boolean = false
  keyType: string = ''
  previousSel: string[] = []
  isGroupActive: boolean = false
  actvControl: string = ''

  controlDragResizeMoueDown (event: MouseEvent) {
    if (this.isPropChanged) {
      event.stopPropagation()
      this.mouseDownEvent = event
      this.isControlMouseDown = true
      this.mouseDownContainer = this.controlId
    }
    if (this.isPropChanged !== true) {
      if (!this.isRunMode && this.isGroupSelected) {
        this.handleDrag(event, this.controlId)
      } else if (!this.isRunMode) {
        this.dragGroupControl(event, this.controlId)
      }
    }
  }

  contextSelGroupControl (event: MouseEvent) {
    let selectTarget = ''
    const userData = this.userformData[this.userFormId]
    let groupId = this.isGroupControlelected!
    const containerList = [...this.getContainerList(this.controlId)]
    let findIndex = -1
    let groupDisplay: string = 'none'
    if (!this.isGroupSelected && this.getSelectedControlsDatas![0] === this.controlId) {
      EventBus.$emit('getGroupDisplay', groupId, (getDisplay: string) => {
        groupDisplay = getDisplay
      })
    } else {
      findIndex = containerList.findIndex(val => userData[val].properties.GroupID === groupId)
      if (findIndex !== -1) {
        EventBus.$emit('getGroupDisplay', groupId, (getDisplay: string) => {
          groupDisplay = getDisplay
        })
      }
    }

    if (groupDisplay === 'none') {
      selectTarget = groupId
    } else {
      let getContainer = this.getContainerList(this.controlId)[0]
      getContainer = userData[getContainer].type === 'Page' ? this.getContainerList(getContainer)[0] : getContainer
      let getConatinerEditMode: boolean = false
      if (userData[getContainer].type !== 'Userform') {
        EventBus.$emit('getEditModeOfContainer', getContainer, (editMode: boolean) => {
          getConatinerEditMode = editMode
        })
        if (getConatinerEditMode) {
          this.selectedItem(event)
        }
      }
    }
    if (selectTarget !== '') {
      this.selectControl({
        userFormId: this.userFormId,
        select: { container: this.getContainerList(selectTarget), selected: [selectTarget] }
      })
    }
  }

  selGroupControl (event: MouseEvent) {
    let selectTarget = ''
    const userData = this.userformData[this.userFormId]
    let groupId = this.isGroupControlelected!
    const seletced = this.getSelectedControlsDatas!
    const container = this.selectedControls[this.userFormId].container
    const containerList = [...this.getContainerList(this.controlId)]
    const findIndex = containerList.findIndex(val => userData[val].properties.GroupID === groupId)
    let groupControlId: string = ''
    let groupDisplay: string = 'none'
    if (findIndex !== -1) {
      groupControlId = containerList[findIndex]
      EventBus.$emit('getGroupDisplay', groupId, (getDisplay: string) => {
        groupDisplay = getDisplay
      })
    }
    if (groupDisplay === 'none') {
      selectTarget = groupId
    } else if (!this.previousSel.includes(groupControlId) && !seletced.includes(groupControlId) && !container.includes(groupControlId)) {
      selectTarget = groupControlId
    }
    if (selectTarget !== '') {
      this.selectControl({
        userFormId: this.userFormId,
        select: { container: this.getContainerList(selectTarget), selected: [selectTarget] }
      })
    } else {
      this.selectedItem(event)
    }
  }

  handleDrag (event: MouseEvent, control: string) {
    this.actvControl = control
    if (this.toolBoxSelect === 'Select') {
      event.stopPropagation()
      if (this.selMultipleCtrl === false && event.which !== 3) {
        this.previousSel = [...this.selectedControls[this.userFormId].selected]
        if (this.isGroupControlelected === '') {
          this.selectedItem(event)
        } else {
          this.selGroupControl(event)
        }
      }
      this.isMoveWhenMouseDown = false
      this.resize.handleMouseDown(event, 'drag', 'control', this.controlId)
    }
  }
  @Emit('muldragControl')
  muldragControl (val: IDragResizeGroup) {
    return val
  }

  @Emit('dragControl')
  dragControl (event: MouseEvent) {
    return event
  }
  selectMultipleCtrl (val: boolean) {
    this.selMultipleCtrl = val
  }
  get getControlZIndex () {
    const selected = this.getSelectedControlsDatas!
    const getContainerList = this.getContainerList(selected[0])
    if (selected.includes(this.controlId)) {
      return this.getHighestZIndex(this.controlId)!
    } else if (getContainerList.includes(this.controlId)) {
      return this.getHighestZIndex(this.controlId)!
    }
  }
  get componentStyle () {
    const userData = this.userformData[this.userFormId]
    const currentProperties = this.propControlData.properties
    const extraData = this.propControlData.extraDatas!
    const type = this.propControlData.type
    const selected = this.getSelectedControlsDatas!
    let highestZIndex = -1
    const getContainerList = this.getContainerList(selected[0])
    if (selected.includes(this.controlId)) {
      highestZIndex = this.getHighestZIndex(this.controlId)!
    } else if (getContainerList.includes(this.controlId)) {
      highestZIndex = this.getHighestZIndex(this.controlId)!
    }
    if (type === 'ComboBox' && this.isEditMode) {
      return {
        position: 'absolute',
        left: `${currentProperties.Left!}px`,
        top: `${currentProperties.Top!}px`,
        /* border width(5) * 2 = 10 */
        width: `${currentProperties.Width!}px`,
        height: `${currentProperties.Height!}px`,
        display:
        this.isRunMode && currentProperties.Visible === false
          ? 'none'
          : 'block'
      }
    } else {
      return {
        position: 'absolute',
        left: `${currentProperties.Left!}px`,
        top: `${currentProperties.Top!}px`,
        /* border width(5) * 2 = 10 */
        width: `${currentProperties.Width!}px`,
        height: `${currentProperties.Height!}px`,
        display:
        this.isRunMode && currentProperties.Visible === false
          ? 'none'
          : 'block',
        // cursor: !this.isRunMode ? 'move' : 'default',
        zIndex: (highestZIndex !== -1) ? highestZIndex + 1 : extraData.zIndex! <= 0 ? '' : extraData.zIndex!
      }
    }
  }

  dragGroupControl (event: MouseEvent, control: string) {
    this.actvControl = control
    this.isGroupActive = false
    if (this.toolBoxSelect === 'Select') {
      event.stopPropagation()
      if (this.selMultipleCtrl === false && event.which !== 3) {
        const groupId = this.propControlData.properties.GroupID!
        this.previousSel = [...this.selectedControls[this.userFormId].selected]
        if (!this.previousSel.includes(groupId) && !this.previousSel.includes(this.controlId)) {
          if (!this.isEditMode) {
            this.selectedItem(event)
          }
          this.isGroupActive = true
        }
        this.isMoveWhenMouseDown = false
        this.resize.handleMouseDown(event, 'drag', 'control', this.controlId)
      }
    }
  }
  @Emit('openMenu')
  openMenu (e: MouseEvent, parentID: string, controlID: string) {
    return {
      e,
      parentID,
      controlID
    }
  }

  get canDragMainDiv (): boolean {
    return this.mainSelected && !this.isEditMode && !this.isRunMode
  }

  get propControlData (): controlData {
    return this.userformData[this.userFormId][this.controlId]
  }
  openContextMenu (e: MouseEvent, parentID: string, controlID: string, type: string, mode: boolean) {
    this.$emit('openMenu', e, parentID, controlID, type, mode)
  }
  getHighestZIndex (control: string) {
    const userData = this.userformData[this.userFormId]
    const type = this.propControlData.type
    if (control === this.propControlData.properties.ID && (type === 'Frame' || type === 'MultiPage')) {
      const containerControls = [...userData[this.getContainerList(control)[0]].controls]
      containerControls.sort((a, b) => {
        return userData[b].extraDatas!.zIndex! - userData[a].extraDatas!.zIndex!
      })
      return userData[containerControls[0]].extraDatas!.zIndex!
    } else {
      return -1
    }
  }
  get getLStyle () {
    const currentProperties = this.propControlData.properties
    return {
      height: `${currentProperties.Height! + 6}px !important`,
      left: '-9px',
      top: '-9px',
      borderLeft: this.getBorderClass === 'controlStyle' ? '' : `calc(6px) solid transparent`,
      '--select-rotate-degree': '-28deg'
    }
  }
  get getTStyle () {
    const currentProperties = this.propControlData.properties
    return {
      top: '-9px',
      width: `${currentProperties.Width!}px !important`,
      left: '-3px',
      borderTop: this.getBorderClass === 'controlStyle' ? '' : `calc(6px) solid transparent`,
      '--select-rotate-degree': '-110deg'
    }
  }
  get getRStyle () {
    const currentProperties = this.propControlData.properties
    return {
      top: '-9px',
      left: `${currentProperties.Width! - 3}px`,
      height: `${currentProperties.Height! + 6}px !important`,
      borderLeft: this.getBorderClass === 'controlStyle' ? '' : `calc(6px) solid transparent`,
      '--select-rotate-degree': '-28deg'
    }
  }
  get getBStyle () {
    const currentProperties = this.propControlData.properties
    return {
      left: '-3px',
      top: `${currentProperties.Height! - 3}px`,
      width: `${currentProperties.Width!}px !important`,
      borderTop: this.getBorderClass === 'controlStyle' ? '' : `calc(6px) solid transparent`,
      '--select-rotate-degree': '-110deg'
    }
  }
  get resizeControlStyle () {
    const currentProperties = this.propControlData.properties
    return {
      left: `${currentProperties.Left}px`,
      top: `${currentProperties.Top}px`,
      display:
        this.isRunMode && currentProperties.Visible === false
          ? 'none'
          : 'block',
      cursor: !this.isRunMode ? 'move' : 'default'
      // zIndex: (highestZIndex !== -1) ? highestZIndex + 1 : extraData.zIndex! <= 0 ? '' : extraData.zIndex!
    }
  }
  get mainSelected () {
    return (
      this.selectedControls[this.userFormId].selected.includes(
        this.controlId
      ) ||
      (this.selectedControls[this.userFormId].container.includes(
        this.controlId
      ) &&
        this.selectedControls[this.userFormId].selected.includes(
          this.controlId
        ) !==
          this.selectedControls[this.userFormId].container.includes(
            this.controlId
          ))
    )
  }
  get isGroupControlelected () {
    const userData = this.userformData[this.userFormId]
    let groupId = userData[this.controlId].properties.GroupID
    if (groupId === '') {
      const containerList = [...this.getContainerList(this.controlId)]
      containerList.reverse()
      for (let i = 1; i < containerList.length; i++) {
        const type = userData[containerList[i]].type
        if (type === 'Page') {
          groupId = userData[this.getContainerList(containerList[i])[0]].properties.GroupID!
        } else {
          groupId = userData[containerList[i]].properties.GroupID!
        }
        if (groupId !== '') {
          break
        }
      }
    }
    return groupId
  }
  get isGroupSelected () {
    const userData = this.userformData[this.userFormId]
    let groupId = userData[this.controlId].properties.GroupID
    return groupId === ''
  }
  deleteItem (event: KeyboardEvent) {
    EventBus.$emit('handleKeyDown', event, this.controlId)
  }
  selectedItem (e: MouseEvent) {
    if (this.selMultipleCtrl === false) {
      const userData = this.userformData[this.userFormId]
      const groupId = this.propControlData.properties.GroupID
        ? this.propControlData.properties.GroupID
        : ''
      const currentSelect = this.selectedControls[this.userFormId].selected
      const getContainer = this.getContainerList(this.controlId)
      if (currentSelect.length > 1 && (currentSelect.includes(this.controlId) || currentSelect.some(item => getContainer.includes(item)) || currentSelect.includes(groupId))) {
        if (currentSelect.includes(this.controlId) || currentSelect.some(item => getContainer.includes(item))) {
          this.exchangeSelect()
        } else {
          if (
            this.userformData[this.userFormId][this.controlId].properties.GroupID !== ''
          ) {
            const selGrpName = this.userformData[this.userFormId][this.controlId].properties.GroupID!
            this.groupExchange(selGrpName)
          }
        }
      } else {
        let selectTarget = null
        let currentGroup = ''
        if (groupId !== '') {
          let groupDisplay: string = 'none'
          EventBus.$emit('getGroupDisplay', groupId, (getDisplay: string) => {
            groupDisplay = getDisplay
          })
          if (
            this.syncCurrentSelectedGroup === groupId &&
            currentSelect[0] === groupId
          ) {
            selectTarget = this.controlId
          } else {
            let controlGroupId = ''
            if (!this.previousSel[0].startsWith('group')) {
              const type = userData[this.previousSel[0]].type
              if (type === 'Page') {
                controlGroupId = userData[this.getContainerList(this.previousSel[0])[0]].properties.GroupID!
              } else {
                controlGroupId = userData[this.previousSel[0]].properties.GroupID!
              }
            }
            if (groupId === controlGroupId) {
              selectTarget = this.controlId
            } else {
              if (groupDisplay === 'none') {
                selectTarget = groupId
              } else {
                selectTarget = this.controlId
              }
            }
          }
          currentGroup = groupId
        } else {
          selectTarget = this.controlId
        }
        if (!this.selectedContainer.includes(selectTarget) && !currentSelect.includes(selectTarget)) {
          this.selectControl({
            userFormId: this.userFormId,
            select: { container: this.getContainerList(selectTarget), selected: [selectTarget] }
          })
        }
        this.syncCurrentSelectedGroup = currentGroup
      }
    } else if (this.keyType === 'shiftKey') {
      const userData = this.userformData[this.userFormId]
      let mainSelected = this.selectedControls[this.userFormId].selected[0]
      const controlData: controlData = userData[this.containerId]
      let divstyle: Array<IGroupStyle> = []
      if (mainSelected.startsWith('group') || userData[this.controlId].properties.GroupID !== '') {
        EventBus.$emit('getGroupSize', (divstayleArray: Array<IGroupStyle>) => {
          divstyle = divstayleArray
        })
      }
      let mainCtrl: controlProperties = { ID: '' }
      if (mainSelected.startsWith('group')) {
        const getIndex = divstyle.findIndex(val => val.groupName === mainSelected)
        mainCtrl = {
          Left: parseInt(divstyle[getIndex].left!),
          Top: parseInt(divstyle[getIndex].top!),
          Width: parseInt(divstyle[getIndex].width!),
          Height: parseInt(divstyle[getIndex].height!),
          ID: ''
        }
      } else {
        mainCtrl = userData[mainSelected].properties
        if (mainSelected === this.containerId) {
          mainSelected = ''
          mainCtrl = userData[this.controlId].properties
        }
      }
      let sideCtrl = userData[this.controlId].properties
      if (userData[this.controlId].properties.GroupID !== '') {
        const getIndex = divstyle.findIndex(val => val.groupName === userData[this.controlId].properties.GroupID)
        sideCtrl = {
          Left: parseInt(divstyle[getIndex].left!),
          Top: parseInt(divstyle[getIndex].top!),
          Width: parseInt(divstyle[getIndex].width!),
          Height: parseInt(divstyle[getIndex].height!),
          ID: ''
        }
      }
      const selectedSize = {
        Left: mainCtrl.Left! < sideCtrl.Left! ? mainCtrl.Left! : sideCtrl.Left!,
        Top: mainCtrl.Top! < sideCtrl.Top! ? mainCtrl.Top! : sideCtrl.Top!,
        Width: (mainCtrl.Left! + mainCtrl.Width!) > (sideCtrl.Left! + sideCtrl.Width!) ? mainCtrl.Left! + mainCtrl.Width! : sideCtrl.Left! + sideCtrl.Width!,
        Height: (mainCtrl.Top! + mainCtrl.Height!) > (sideCtrl.Top! + sideCtrl.Height!) ? mainCtrl.Top! + mainCtrl.Height! : sideCtrl.Top! + sideCtrl.Height!
      }
      const left = selectedSize.Left
      const top = selectedSize.Top
      const right = selectedSize.Width
      const bottom = selectedSize.Height
      const multipleCtrl = []
      if (left !== right || top !== bottom) {
        for (let i in controlData.controls) {
          const key: string = controlData.controls[i]
          const controlProp: controlProperties = this.userformData[this.userFormId][key].properties
          if (
            left <= controlProp!.Left! + controlProp!.Width! &&
            right >= controlProp!.Left! &&
            top <= controlProp!.Top! + controlProp!.Height! &&
            bottom >= controlProp!.Top!
          ) {
            multipleCtrl.push(key)
          }
        }
        const selectedGroup: string[] = []
        for (const val of multipleCtrl) {
          const controlGroupId: string = this.userformData[this.userFormId][val]
            .properties.GroupID!
          if (controlGroupId && controlGroupId !== '') {
            !selectedGroup.includes(controlGroupId)! &&
              selectedGroup.push(controlGroupId)
          } else {
            selectedGroup.push(val)
          }
        }
        if (this.selectedControlArray.length !== 0) {
          this.selectControl({
            userFormId: this.userFormId,
            select: {
              container: this.getContainerList(selectedGroup[0]),
              selected: [...selectedGroup]
            }
          })
        }
      }
    } else if (this.keyType === 'ctrlKey') {
      const userData = this.userformData[this.userFormId]
      let selectedGroup = userData[this.controlId].properties.GroupID === '' ? [this.controlId] : [userData[this.controlId].properties.GroupID!]
      const currContainer = this.getContainerList(this.controlId)[0]
      let selected: string[] = this.selectedControls[this.userFormId].selected
      for (let i = 0; i < selected.length; i++) {
        if (!selected[i].startsWith('group') && userData[selected[i]].type === 'Page') {
          selected.splice(i, 1, this.getContainerList(selected[i])[0])
        }
      }
      if (selected[0] === this.containerId) {
        selected = []
      } else {
        selected = [...selected]
      }
      let combineArray = selected.filter(x => !selectedGroup.includes(x)).concat(selectedGroup.filter(x => !selected.includes(x)))
      if (combineArray.length > 0) {
        this.selectControl({
          userFormId: this.userFormId,
          select: {
            container: this.getContainerList(combineArray[0]),
            selected: combineArray
          }
        })
      } else {
        const container = this.selectedControls[this.userFormId].container
        this.selectControl({
          userFormId: this.userFormId,
          select: {
            container: container,
            selected: [container[0]]
          }
        })
      }
    }
    EventBus.$emit('getCtrlEditMode', this.isEditMode)
  }
  handleMouseUp (event: MouseEvent) {
    if (event.which !== 3 && this.controlId === this.actvControl && (this.selMultipleCtrl === false)) {
      const currentSelect = this.selectedControls[this.userFormId].selected
      if (currentSelect.length === 1 && currentSelect[0] === this.controlId && this.previousSel.includes(currentSelect[0])) {
        if (
          this.isMoveWhenMouseDown !== true &&
        this.propControlData.type !== 'FDImage'
        ) {
          if (this.propControlData.type === 'MultiPage') {
            EventBus.$emit('setPage', this.propControlData.properties.ID)
          }
          this.isEditMode = true
          this.isMoveWhenMouseDown = false
        }
      }
      const userData = this.userformData[this.userFormId]
      const selected = this.selectedControls[this.userFormId].selected
      const groupId = (!selected[0].startsWith('group') && userData[selected[0]].properties.GroupID && userData[selected[0]].properties.GroupID !== '') || selected[0].startsWith('group')
      if (groupId && this.isGroupActive !== true && this.isMoveWhenMouseDown !== true) {
        if (!this.isGroupSelected) {
          this.selectedItem(event)
        }
        this.isGroupActive = false
      }
    } else if (this.selMultipleCtrl) {
      this.selectedItem(event)
    }
    this.actvControl = ''
  }

  exchangeSelect () {
    const sel = [...this.selectedControls[this.userFormId].selected]
    const getContainer = this.getContainerList(this.controlId)
    let controlIndex = -1
    let commonElemnt = [this.controlId]

    if (sel.includes(this.controlId)) {
      controlIndex = sel.findIndex((val) => val === this.controlId)
    } else if (sel.some(item => getContainer.includes(item))) {
      commonElemnt = sel.filter(item => getContainer.includes(item))
      controlIndex = sel.findIndex((val) => val === commonElemnt[0])
    }
    sel.splice(controlIndex, 1)
    sel.unshift(commonElemnt[0])
    this.selectControl({
      userFormId: this.userFormId,
      select: { container: this.getContainerList(sel[0]), selected: [...sel] }
    })
  }
  groupExchange (groupName: string) {
    const sel = [...this.selectedControls[this.userFormId].selected]
    const controlIndex = this.selectedControls[this.userFormId].selected.findIndex((val) => val === groupName)
    sel.splice(controlIndex, 1)
    sel.unshift(groupName)
    this.selectControl({
      userFormId: this.userFormId,
      select: { container: this.getContainerList(sel[0]), selected: [...sel] }
    })
  }
  get getModeStyle () {
    return this.mainSelected ? 'controlSelectStyle' : 'controlStyle'
  }
  @Watch('toolBoxSelect', { deep: true })
  updatectrlEditMode () {
    const selected = this.selectedControls[this.userFormId].selected
    let container = this.selectedControls[this.userFormId].container[0]
    if (selected.length === 1 && !selected[0].startsWith('group')) {
      const type = this.userformData[this.userFormId][selected[0]].type
      if (type === 'Frame' || type === 'Page' || type === 'MultiPage') {
        container = selected[0]
      }
    }
    const type = this.userformData[this.userFormId][container].type
    if (type !== 'Frame' && type !== 'Page' && type !== 'MultiPage') {
      this.isEditMode = false
    }
  }

  @Watch('selectedControls', { deep: true })
  updateSelectedControls () {
    const type = this.userformData[this.userFormId][this.selectedContainer[0]].type
    const controlType = this.userformData[this.userFormId][this.controlId].type
    if ((type === 'Frame' || type === 'Page' || type === 'MultiPage') && this.selectedContainer.includes(this.controlId)) {
      if (controlType === 'Frame' || controlType === 'MultiPage') {
        this.isEditMode = true
      } else {
        if (this.isMoving === false) {
          this.isEditMode = false
        } else {
          this.isMoving = false
        }
      }
    } else {
      if (this.isMoving === false || (this.selMultipleCtrl)) {
        this.isEditMode = false
      } else {
        this.isMoving = false
      }
    }
  }

  get getUserFormId () {
    if (
      this.propControlData.type === 'Frame' ||
      this.propControlData.type === 'MultiPage' ||
      this.propControlData.type === 'TabStrip'
    ) {
      return this.userFormId
    } else {
      return null
    }
  }
  created () {
    EventBus.$on('actMultipleCtrl', (val: boolean) => {
      this.selMultipleCtrl = val
      this.keyType = 'shiftKey'
    })
    EventBus.$on('cycleForm', this.getEditModeValue)
    EventBus.$on('selectMultipleCtrl', (val: boolean) => {
      this.selMultipleCtrl = val
      this.keyType = 'ctrlKey'
    })
    EventBus.$on('getEdiTMode', this.getEditMode)
    EventBus.$on('isMousedownMove', (val: boolean) => {
      this.isMoveWhenMouseDown = val
    })
    EventBus.$on('getDragSelectorEdit', this.getDragSelectorEdit)
    EventBus.$on('getEditModeOfContainer', this.getEditModeOfContainer)
    EventBus.$on('conSelMouseDown', this.conSelMouseDown)
  }
  getEditMode (callBack: Function) {
    const selected = this.selectedControls[this.userFormId].selected
    const userData = this.userformData[this.userFormId]
    const mainSel = userData[selected[0]].type === 'Page' ? this.getContainerList(selected[0])[0] : selected[0]
    if (mainSel === this.controlId) {
      callBack(this.isEditMode)
    }
  }
  conSelMouseDown (event: MouseEvent, control: string) {
    if (control === this.controlId) {
      Vue.nextTick(() => {
        this.controlDragResizeMoueDown(event)
      })
    }
  }
  getEditModeOfContainer (controlId: string, callBack: Function) {
    if (controlId === this.controlId) {
      callBack(this.isEditMode)
    }
  }
  getDragSelectorEdit (event: MouseEvent, containerId: string, callBack: Function) {
    const userData = this.userformData[this.userFormId]
    const selected = this.selectedControls[this.userFormId].selected
    const getContainer = this.getContainerList(this.controlId)
    getContainer.pop()
    if (containerId) {
      const selContainer = userData[containerId].type === 'Page' ? this.getContainerList(containerId)[0] : containerId
      if (this.controlId === selContainer && this.selMultipleCtrl !== true) {
        let isSameContainer: boolean = false
        const groupId = userData[this.controlId].properties.GroupID!
        if (this.isGroupControlelected! === '') {
          const previousContainer = this.selectedControls[this.userFormId].container[0]
          const currentContainer = this.getContainerList(this.controlId)[0]
          isSameContainer = currentContainer === previousContainer
          if (isSameContainer) {
            if (selected.length === 1) {
              this.isMoving = true
              this.isEditMode = true
              this.selectControl({
                userFormId: this.userFormId,
                select: {
                  container: this.getContainerList(containerId),
                  selected: [containerId]
                }
              })
            } else {
              if (!selected.includes(this.controlId)) {
                this.isMoving = true
                this.isEditMode = true
                this.selectControl({
                  userFormId: this.userFormId,
                  select: {
                    container: this.getContainerList(containerId),
                    selected: [containerId]
                  }
                })
              }
            }
          } else {
            if (selected.length === 1 || (selected.length > 1 && !selected.some(item => getContainer.includes(item)))) {
              this.isMoving = true
              this.isEditMode = true
              this.selectControl({
                userFormId: this.userFormId,
                select: {
                  container: this.getContainerList(containerId),
                  selected: [containerId]
                }
              })
            }
          }
        }
        if (this.isEditMode && (userData[this.controlId].type === 'Frame' || userData[this.controlId].type === 'MultiPage')) {
          event.stopPropagation()
        }
        callBack(this.isEditMode)
      }
    }
  }
  getEditModeValue (callBack: Function) {
    const selCtrl = this.getSelectedControlsDatas!
    const container = this.selectedControls[this.userFormId].container[0]
    if ((selCtrl.length === 1 && this.controlId === selCtrl[0]) || container === this.controlId) {
      callBack(this.controlId, this.isEditMode)
    }
  }
  displayContextMenu (event: MouseEvent) {
    event.preventDefault()
    this.previousSel = [...this.selectedControls[this.userFormId].selected]
    if (this.isGroupControlelected === '') {
      this.selectedItem(event)
    } else {
      const currentSelect = this.selectedControls[this.userFormId].selected
      const getContainer = this.getContainerList(this.controlId)
      if (currentSelect.length > 1 && (currentSelect.includes(this.controlId) || currentSelect.some(item => getContainer.includes(item)) || currentSelect.includes(this.isGroupControlelected!))) {
        if (currentSelect.includes(this.controlId) || currentSelect.some(item => getContainer.includes(item))) {
          this.exchangeSelect()
        }
      } else {
        this.contextSelGroupControl(event)
      }
    }
    EventBus.$emit('contextMenuDisplay', event, this.containerId, this.controlId, 'control', this.isEditMode)
  }
  @Emit('createGroup')
  createGroup (groupId: string) {
    return { groupId: groupId, containerId: this.containerId }
  }
  containerBorderClick () {
    if (this.isEditMode) {
      EventBus.$emit('closeMenu')
    }
    if (this.isEditMode && this.isMoveWhenMouseDown !== true) {
      if (this.propControlData.type === 'MultiPage' || this.propControlData.type === 'Frame') {
        this.selectControl({
          userFormId: this.userFormId,
          select: { container: this.getContainerList(this.controlId), selected: [this.controlId] }
        })
        this.isEditMode = false
      }
    }
  }
  get getBorderClass () {
    if (this.mainSelected && this.isEditMode && !this.isRunMode) {
      return 'controlEditStyle'
    } else if (this.canDragMainDiv) {
      return 'controlSelectStyle'
    } else {
      return 'controlStyle'
    }
  }
}
</script>

<style scoped>
.move-border {
  position: absolute;
  z-index: 99999999999;
}
.m-top-b, .m-bottom-b{
  width: 100%;
}
.m-left-b, .m-right-b{
  height: 100%;
}
.controlSelectStyle {
  box-sizing: border-box;
  position: absolute;
  --border-width: 3;
  --stripe-distance: 2px;
  border-image: repeating-linear-gradient(
      var(--select-rotate-degree),
      black,
      transparent 1px,
      transparent var(--stripe-distance),
      black calc(var(--stripe-distance) + 0.2px)
    )
    var(--border-width);
}
.controlEditStyle {
  box-sizing: border-box;
  position: absolute;
  --border-width: 3;
  --stripe-distance: 2px;
  /* border: calc(var(--border-width) * 1px) solid transparent; */
  border-image: repeating-linear-gradient(
      -45deg,
      black,
      transparent 1.5px,
      transparent var(--stripe-distance),
      black calc(var(--stripe-distance) + 0.2px)
    )
    var(--border-width);
}
.controlStyle {
  box-sizing: border-box;
  position: absolute;
  padding-top: 5px;
  padding-left: 5px;
  cursor: default !important;
  z-index: 0;
}
.resizeMainControlStyle {
  box-sizing: border-box;
  position: absolute;
  margin-top: 3px;
  margin-left: 3px;
}
:focus {
  outline: none;
}
</style>
