<template>
<div>
  <div @mouseup="onMouseUp" :style="parentDiv" ref="parentDivRef" @scroll="updateScroll">
    <drag-selector
      ref="dragSelector"
      :style="dragSelectorStyle"
      :isEditMode="checkIsEditMode"
      :isPropChanged="isPropChanged"
      @deActiveControl="deActiveControl"
      @dragSelectorControl="event => dragSelectorControl(event)"
      @addControlObj="event => addControlObj(event)"
      @updateMousedownVar="updateMousedownVar"
    >
    <div :style="childDiv" ref="childDivRef" @scroll="updateScroll">
    <div :style="pictureChildDiv" @scroll="updateScroll" ref="pictureDivRef">
      <GroupControl
        :containerId="containerId"
        :userFormId="userFormId"
        ref="groupRef"
        class="group"
        :controlRef="$refs"
        :currentSelectedGroup="filterSelected"
        @openMenu="(e, parentID, controlID, type) => openContextMenu(e, parentID, controlID, type)"
      />
      <div
        v-for="control in propControlData.controls"
        :key="control"
      >
        <ResizeControl
          ref="resizeControl"
          :name="control"
          :controlId="control"
          :containerId="controlId"
          :userFormId="userFormId"
          :currentSelectedGroup.sync="currentSelectedGroup"
          @createGroup="createGroup"
          @dragControl="dragControl"
          @muldragControl="muldragControl"
        >
        </ResizeControl>
      </div>
    </div>
    </div>
    </drag-selector>
  </div>
  <div>
    <div :style="verticalScrollBarStyle" ref="verticalScrollRef" @scroll="updateVerticalScrollTop">
      <div :style="verticalScrollThumbStyle"></div>
    </div>
    <div :style="horizontalScrollBarStyle" ref="horizontalScrollRef"  @scroll="updateHorizontalScrollLeft">
      <div :style="horizontalScrollThumbStyle"></div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Ref, Watch } from 'vue-property-decorator'
import { State, Action } from 'vuex-class'
import ResizeControl from '@/FormDesigner/components/organisms/FDResizeControl/index.vue'
import ContextMenu from '@/FormDesigner/components/atoms/FDContextMenu/index.vue'
import { controlContextMenu } from '@/FormDesigner/models/controlContextMenuData'
import { userformContextMenu } from '../../../models/userformContextMenuData'
import GroupControl from '@/FormDesigner/components/organisms/FDGroupControl/index.vue'
import {
  IsetChildControls,
  IaddChildControls,
  IselectControl,
  IupdateControl,
  IupdateGroup,
  IupdateControlExtraData
} from '@/storeModules/fd/actions'
import { EventBus } from '../../../event-bus'
import FDCommonMethod from '@/api/abstract/FormDesigner/FDCommonMethod'
import DragSelector from '@/FormDesigner/components/organisms/FDDragSelector/DragSelector.vue'
@Component({
  name: 'Container',
  components: {
    ContextMenu,
    GroupControl,
    ResizeControl,
    DragSelector
  }
})
export default class Container extends FDCommonMethod {
  $el!: HTMLDivElement;
  currentSelectedGroup: string = '';
  @Prop() getScrollBarX!: string
  @Prop() getScrollBarY!: string
  @Prop() isEditMode!: boolean
  @Prop() width!: number
  @Prop() height!: number
  @Prop({ required: true, type: String }) public controlId!: string;
  @Prop({ required: true, type: String }) userFormId!: string;
  @Prop({ required: true, type: String }) containerId!: string;
  @Prop() mouseCursorData!: string;
  @Prop() getSampleDotPattern!: { backgroundImage: string; backgroundSize: string; backgroundPosition: string }
  @Prop() createBackgroundString!: string
  @Prop() getSizeMode!: string
  @Prop() getRepeatData!: string
  @Prop() getPosition!: string
  @Prop() dragSelctorWidthHeight!: Partial<CSSStyleDeclaration>
  @Prop() frameTop!: number
  @State((state: rootState) => state.fd.toolBoxSelect) toolBoxSelect!: fdState['toolBoxSelect'];
  @State((state) => state.fd.selectedControls)
  selectedControls!: fdState['selectedControls'];
  @State((state) => state.fd.userformData) userformData!: userformData;
  @State((state) => state.fd.groupedControls)
  groupedControls!: fdState['groupedControls'];

  @Action('fd/updateGroup') updateGroup!: (payload: IupdateGroup) => void;
  @Action('fd/updateControlExtraData') updateControlExtraData!: (payload: IupdateControlExtraData) => void;
  @Action('fd/updateControl') updateControl!: (payload: IupdateControl) => void;
  @Action('fd/setChildControls') setChildControls!: (
    payload: IsetChildControls
  ) => void;
  @Action('fd/addChildControls') addChildControls!: (
    payload: IaddChildControls
  ) => void;
  @Action('fd/selectControl') selectControl!: (payload: IselectControl) => void;

  @Ref('groupRef') readonly groupRef!: GroupControl;
  @Ref('refContextMenu') readonly refContextMenu!: ContextMenu;
  @Ref('dragSelector') readonly dragSelector!: dragselector;
  @Ref('contextmenu') readonly contextmenu!: HTMLDivElement;
  @Ref('parentDivRef') parentDivRef!: HTMLDivElement
  @Ref('verticalScrollRef') verticalScrollRef!: HTMLDivElement
  @Ref('horizontalScrollRef') horizontalScrollRef!: HTMLDivElement
  @Ref('pictureDivRef') pictureDivRef!: HTMLDivElement
  @Ref('childDivRef') childDivRef!: HTMLDivElement

  isControlPasted: boolean = false
  controlContextMenu: Array<IcontextMenu> = controlContextMenu;
  userformContextMenu: Array<IcontextMenu> = userformContextMenu;
  handler: string = '';
  grouphandler: string = '';
  mainSelectData!: controlData
  containerPosition: IMousePosition = { clientX: 0, clientY: 0, movementX: 0, movementY: 0 }
  selectedGroup: string[] = []
  groupStyleArray: Array<IGroupStyle> = [];
  isControlMove: boolean = false
  mouseUpOnPageTab: boolean = false
  isScrolling: boolean = false

  updateVerticalScrollTop (e: Event) {
    if (e.target instanceof HTMLDivElement) {
      this.parentDivRef.scrollTop = e.target.scrollTop
      this.updateControl({
        userFormId: this.userFormId,
        controlId: this.controlId,
        propertyName: 'ScrollTop',
        value: this.parentDivRef.scrollTop
      })
    }
  }
  updateHorizontalScrollLeft (e: Event) {
    if (e.target instanceof HTMLDivElement) {
      this.parentDivRef.scrollLeft = e.target.scrollLeft
      console.log('e.target.scrollLeft', e.target.scrollLeft, this.parentDivRef.scrollLeft)
      this.updateControl({
        userFormId: this.userFormId,
        controlId: this.controlId,
        propertyName: 'ScrollLeft',
        value: this.parentDivRef.scrollLeft
      })
    }
  }
  /**
   * @description To get the selected container  from controls are dragged
   * @function selectedContainer
   */
  get selectedContainer () {
    return [...this.selectedControls[this.userFormId].container][0]
  }

  /**
   * @description To get the selected controls to be dropped
   * @function selectedSelect
   */
  get selectedSelect () {
    if (this.grouphandler === 'groupdrag') {
      const selectedSelect = []
      for (let k = 0; k < this.selectedGroup.length; k++) {
        if (this.selectedGroup[k].startsWith('group')) {
          for (const i in this.userformData[this.userFormId]) {
            if (!i.startsWith('ID_USERFORM')) {
              const userdata = this.userformData[this.userFormId]
              if (userdata[i].properties.GroupID === this.selectedGroup[k]) {
                selectedSelect.push(i)
              }
            }
          }
        } else {
          selectedSelect.push(this.selectedGroup[k])
        }
      }
      return selectedSelect
    } else {
      return this.selectedControls[this.userFormId].selected
    }
  }

  /**
   * @description To get the controls to be removed from the  selected container
   * @function fromContainerControls
   */
  get fromContainerControls () {
    const fromContainerControls = [...this.userformData[this.userFormId][this.selectedContainer].controls]
    for (let i = 0; i < this.selectedSelect.length; i++) {
      let tragetId: undefined | string = this.selectedSelect[i]
      let targetIndex = fromContainerControls.findIndex((id) => id === tragetId)
      if (targetIndex !== -1) {
        fromContainerControls.splice(targetIndex, 1)
      }
    }
    return fromContainerControls
  }

  /**
   * @description To remove chilControls of selected Container
   * @function removeChildControl
   * @param selectedSelect  - control array to be deleted
   */
  removeChildControl (id: string, controls: string[]) {
    const userData = this.userformData[this.userFormId]
    const beforeControls = userData[id].controls
    const deleteControls = beforeControls.filter(x => !controls.includes(x))
    for (const key of deleteControls) {
      this.deleteZIndex(key)
      this.deleteTabIndex(key)
    }

    this.setChildControls({
      userFormId: this.userFormId,
      containerId: id,
      targetControls: controls
    })
  }

  /**
   * @description To add chilControls of selected Container
   * @function addChildControl
   * @param selectedSelect  - control array to be added
   */
  addChildControl (selectedSelect: string[]) {
    const userData = this.userformData[this.userFormId]
    for (const control of selectedSelect) {
      if (!userData[this.containerId].controls.includes(control)) {
        this.addChildControls({
          userFormId: this.userFormId,
          containerId: this.containerId,
          targetControls: [control]
        })
        this.updateTabIndexValue(control)
        this.updateZIndexValue(control)
      }
    }
  }

  /**
   * @description To update Properties of Control
   * @function updateControlProp
   * @param id  - selcted controlId
   * @param propName  -  selected control property Name
   * @param propName  -  selected control property Value
   */
  updateControlProp (id: string, propName: keyof controlProperties, propValue: number| string) {
    this.updateControl({
      userFormId: this.userFormId,
      controlId: id,
      propertyName: propName,
      value: propValue
    })
  }

  /**
   * @description To update the selectedControls in main data
   * @function updatedSelect
   * @param updatedSelect  - selcted ContainerId
   * @param selArry  - selcted controlList
   */
  updatedSelect (conatiner: string[], selArry: string[]) {
    this.selectControl({
      userFormId: this.userFormId,
      select: {
        container: conatiner,
        selected: selArry
      }
    })
  }

  /**
   * @description If control inside the group is selected dropped into other container
   * @function updateGroupControl
   * @param mainSelectGroup  - selected group
   */
  updateGroupControl (mainSelectGroup: string) {
    const presenetControl: string[] = []
    if (mainSelectGroup && mainSelectGroup !== '') {
      for (let control in this.userformData[this.userFormId]) {
        const controlGroupId = this.userformData[this.userFormId][control].properties.GroupID!
        if (controlGroupId && controlGroupId === mainSelectGroup) {
          presenetControl.push(control)
        }
      }
    }
    if (presenetControl.length === 1) {
      const groupArray: string[] = [...this.groupedControls[this.userFormId]!.groupArray!]
      const index = groupArray.findIndex((val) => val === mainSelectGroup)
      groupArray.splice(index, 1)
      this.updateGroup({
        userFormId: this.userFormId,
        groupArray: groupArray
      })
      this.updateControlProp(presenetControl[0], 'GroupID', '')
    }
  }
  /**
   * @description to drag and drop the control and group into respective container
   * @function onMouseUp
   * @param event  - it is of type MouseEvent
   * @event mouseup
   */
  onMouseUp (event: MouseEvent) {
    if (document.onmousemove && document.onmouseup && (this.handler === 'drag' || this.handler === 'frameDrag' || this.grouphandler === 'groupdrag')) {
      const userData = this.userformData[this.userFormId]
      const containerType = userData[this.containerId].type === 'Page' && userData[this.getContainerList(this.containerId)[0]].properties.Value === -1
      if (!containerType) {
        let moveValueX: number = 0
        let moveValueY: number = 0
        let mainSelect: string = ''
        let parentConatiner = ''
        let count = 0
        let tempEvent = {}
        this.selectedGroup = this.selectedControls[this.userFormId].selected
        if (this.grouphandler === 'groupdrag') {
          EventBus.$emit(
            'getGroupMoveValue',
            (offsetX: number, offsetY: number, id: string, tempEventObj: MouseEvent) => {
              moveValueX = offsetX
              moveValueY = offsetY
              tempEvent = Object.keys(tempEventObj).length === 0 ? tempEvent : tempEventObj
            }
          )
          mainSelect = this.getSelectedControlsDatas![0]
        } else if (this.handler === 'drag') {
          EventBus.$emit(
            'getMoveValue',
            (offsetX: number, offsetY: number, id: string) => {
              moveValueX = offsetX
              moveValueY = offsetY
              mainSelect = id
            }
          )
        } else if (this.handler === 'frameDrag') {
          EventBus.$emit(
            'getMoveValue',
            (offsetX: number, offsetY: number, id: string, parentControl: string) => {
              moveValueX = offsetX
              moveValueY = offsetY
              mainSelect = id
              parentConatiner = parentControl
            }
          )
        }
        if (userData[mainSelect].type !== 'Userform' && mainSelect && !this.getSelectedControlsDatas!.includes(this.containerId) && !this.mouseUpOnPageTab) {
          count = count + 1
          let frameCondition: boolean = false
          if (this.handler === 'frameDrag') {
            const isChild = this.getChildControl(mainSelect).includes(this.containerId) || this.containerId === mainSelect
            frameCondition = (isChild === false && parentConatiner === this.containerId) ||
          (isChild === false && this.selectedControls[this.userFormId].selected.includes(mainSelect)) ||
          (isChild === false && count === 1)
          }
          if ((this.handler === 'frameDrag' && frameCondition) || this.handler === 'drag' || this.grouphandler === 'groupdrag') {
            const currentControlsData = this.userformData[this.userFormId]
            const mainSelectData = currentControlsData[mainSelect]
            const mainSelectX = mainSelectData.properties.Left
            const mainSelectY = mainSelectData.properties.Top
            const containerX = event.clientX - this.$el.getClientRects()[0].x
            const containerY = event.clientY - this.$el.getClientRects()[0].y
            const mainSelectGroup: string = mainSelectData.properties.GroupID!
            const selectedSelect = this.handler === 'frameDrag' ? (this.selectedSelect.includes(mainSelect) ? this.selectedSelect : [mainSelect]) : this.selectedSelect
            if (typeof mainSelectX === 'number' && typeof mainSelectY === 'number') {
              if ((this.handler === 'frameDrag' || this.handler === 'drag')) {
                selectedSelect.forEach((id) => {
                  const targetData = currentControlsData[id].properties
                  const targetLeft = targetData.Left
                  const targetTop = targetData.Top
                  const containerProp = userData[this.containerId].properties
                  if (typeof targetTop === 'number' && typeof targetLeft === 'number') {
                    const leftValue = containerProp.ScrollLeft! > 0 ? (containerX + targetLeft - mainSelectX - moveValueX) + containerProp.ScrollLeft! : containerX + targetLeft - mainSelectX - moveValueX
                    const topValue = containerProp.ScrollTop! > 0 ? (containerY + targetTop - mainSelectY - moveValueY) + containerProp.ScrollTop! : containerY + targetTop - mainSelectY - moveValueY
                    this.updateControlProp(id, 'Left', leftValue)
                    this.updateControlProp(id, 'Top', topValue)
                    if (this.handler === 'drag') {
                      if (mainSelectGroup !== '' && this.selectedContainer !== this.containerId) {
                        this.updateControlProp(id, 'GroupID', '')
                        this.updateGroupControl(mainSelectGroup)
                      }
                    }
                  }
                })
              } else if (this.grouphandler === 'groupdrag' && this.selectedContainer === this.containerId) {
                EventBus.$emit('getClientValue', 'same')
              }
            }
            if (this.handler === 'frameDrag' && this.userformData[this.userFormId][this.containerId].controls.includes(mainSelect)) {
              event.stopPropagation()
              document.onmouseup(event)
            } else {
              if (this.selectedContainer !== this.containerId) {
                const mainSelContainer = this.getContainerList(mainSelect)[0]
                if (this.selectedControls[this.userFormId].selected.includes(mainSelect) || this.grouphandler === 'groupdrag') {
                  this.removeChildControl(this.selectedContainer, this.fromContainerControls)
                  this.addChildControl(selectedSelect)
                } else {
                  const controls = this.userformData[this.userFormId][mainSelContainer].controls
                  const removeControl = controls.filter(e => e !== mainSelect)
                  this.removeChildControl(mainSelContainer, removeControl)
                  this.addChildControl([mainSelect])
                }
                if (this.grouphandler === 'groupdrag') {
                  for (let k = 0; k < this.selectedGroup.length; k++) {
                    if (this.selectedGroup[k].startsWith('group')) {
                      this.createGroup({ groupId: this.selectedGroup[k], containerId: this.containerId })
                    }
                  }
                }

                if (this.grouphandler === 'groupdrag') {
                  if (this.grouphandler === 'groupdrag' && this.selectedContainer !== this.containerId) {
                    EventBus.$emit('getClientValue', 'different', containerX, containerY, event, this.containerId, tempEvent)
                  }
                  const selected = this.selectedControls[this.userFormId].selected
                  this.updatedSelect(this.getContainerList(selected[0]), selected)
                } else {
                  this.updatedSelect(this.getContainerList(this.selectedSelect[0]), this.selectedControls[this.userFormId].selected)
                }
              }
              EventBus.$emit('setGroupSize', () => {
                event.stopPropagation()
              })
              document.onmouseup(event)
            }
          }
        } else if (this.mouseUpOnPageTab) {
          event.stopPropagation()
          document.onmouseup(event)
          this.mouseUpOnPageTab = false
        }
      } else {
        event.stopPropagation()
        document.onmouseup(event)
      }
    }
    EventBus.$emit('mouseUpOnPageTab', false)
  }

  /**
   * @description style object to dynamically changing the styles of  the contextMenu component based on propControlData
   * @function styleObject
   *
   */
  get filterSelected () {
    const result =
      this.currentSelectedGroup === ''
        ? this.selectedControls[this.userFormId].selected.filter((Id) => {
          if (typeof Id === 'string') {
            return Id.startsWith('group')
          }
        })
        : [this.currentSelectedGroup]
    return result
  }
  createGroup (groupObj: IemitGroup) {
    if (groupObj.containerId === this.containerId) {
      this.groupRef.groupStyle(groupObj.groupId)
    }
  }
  muldragControl (val: IDragResizeGroup) {
    this.groupRef.handleMouseDown(val.event, val.handler, '', val.control)
  }
  dragControl (event: MouseEvent) {
    this.groupRef.handleMouseDown(event, 'drag', '', '')
  }
  get getScrollBoarProp () {
    const controlProp = this.propControlData.properties
    if (controlProp.KeepScrollBarsVisible === 0 || controlProp.ScrollBars === 0) {
      return 'hide'
    } else if (controlProp.KeepScrollBarsVisible === 1 && (controlProp.ScrollBars === 1 || controlProp.ScrollBars === 3)) {
      return 'horizontal'
    } else if (controlProp.KeepScrollBarsVisible === 2 && (controlProp.ScrollBars === 2 || controlProp.ScrollBars === 3)) {
      return 'vertical'
    } else if (controlProp.KeepScrollBarsVisible === 3 && controlProp.ScrollBars === 3) {
      return 'show'
    } else if ((controlProp.KeepScrollBarsVisible === 1 || controlProp.KeepScrollBarsVisible === 3) && controlProp.ScrollBars === 1) {
      return 'horizontal'
    } else if ((controlProp.KeepScrollBarsVisible === 2 || controlProp.KeepScrollBarsVisible === 3) && controlProp.ScrollBars === 2) {
      return 'vertical'
    } else if (controlProp.KeepScrollBarsVisible === 0 && controlProp.ScrollBars === 3) {
      return 'hide'
    } else {
      return ''
    }
  }
  /**
   * @description style object to dynamically changing the styles of  the darg-selctor component based on propControlData
   * @function dragSelectorStyle
   *
   */
  get fitPictureSizeHeight () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    if (type === 'Userform') {
      if (this.getScrollBoarProp === 'show') {
        return 47
      }
      return 32
    } else if (type === 'Frame') {
      if (this.getScrollBoarProp === 'show') {
        return this.frameTop ? (-this.frameTop + 22) : 22
      } else if (this.getScrollBoarProp === 'vertical') {
        return this.frameTop ? (-this.frameTop) + 8 : 7
      }
      return this.frameTop ? (-this.frameTop) + 4 : 0
    } else if (type === 'Page') {
      if (this.getScrollBoarProp === 'show') {
        return 15
      }
      return 0
    }
  }
  get fitPictureSizeWidth () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    if (type === 'Userform') {
      if (this.getScrollBoarProp === 'show') {
        return 19
      } else if (this.getScrollBoarProp === 'horizontal') {
        return 3
      } else {
        if (controlProp.BorderStyle === 1 || controlProp.SpecialEffect! > 0) {
          return 2
        }
      }
    } else if (type === 'Frame') {
      if (this.getScrollBoarProp === 'show') {
        return 20
      } else {
        return 4
      }
    } else if (type === 'Page') {
      if (this.getScrollBoarProp === 'show') {
        return 15
      }
    }
    return 0
  }
  get dragSelectorStyle () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    const ph = type && type === 'Page' ? parseInt(this.dragSelctorWidthHeight.height!) - this.fitPictureSizeHeight! : this.propControlData.properties.Height! - this.fitPictureSizeHeight!
    const pw = type && type === 'Page' ? parseInt(this.dragSelctorWidthHeight.width!) - this.fitPictureSizeWidth! : this.propControlData.properties.Width! - this.fitPictureSizeWidth!
    return {
      height: (controlProp.ScrollHeight === 0 || controlProp.ScrollHeight! < ph) ? ph + 'px' : controlProp.ScrollHeight! + 'px',
      width: (controlProp.ScrollWidth === 0 || controlProp.ScrollWidth! < pw) ? pw + 'px' : controlProp.ScrollWidth! + 'px',
      cursor: this.toolBoxSelect !== 'Select' ? 'crosshair !important' : '',
      position: 'absolute',
      overflow: 'hidden'
    }
  }

  get pictureChildDiv () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    let backgroundStyle = {}
    if (controlProp.Picture !== '' && controlProp.ScrollBars! > 0) {
      backgroundStyle = {}
    } else {
      backgroundStyle = {
        backgroundImage: this.getSampleDotPattern.backgroundImage,
        backgroundSize: this.getSampleDotPattern.backgroundSize,
        backgroundRepeat: 'repeat',
        backgroundPosition: this.getSampleDotPattern.backgroundPosition
      }
    }
    return {
      ...backgroundStyle,
      height: '100%',
      width: '100%',
      position: 'absolute',
      overflow: 'hidden'
    }
  }
  get childDiv () {
    const controlProp = this.propControlData.properties
    return {
      height: '100%',
      width: '100%',
      backgroundImage: controlProp.Picture === ''
        ? this.getSampleDotPattern.backgroundImage
        : this.createBackgroundString,
      backgroundSize: controlProp.Picture === ''
        ? this.getSampleDotPattern.backgroundSize
        : this.getSizeMode,
      backgroundColor: controlProp.Picture !== '' ? '' : controlProp.BackColor,
      backgroundRepeat: this.getRepeatData,
      backgroundPosition: controlProp.Picture !== ''
        ? this.getPosition
        : this.getSampleDotPattern.backgroundPosition,
      opactity: controlProp.Picture === '' ? '0' : '1',
      position: 'absolute',
      overflow: 'hidden'
    }
  }
  /**
   * @description propControlData is abstract class providing implementation in FDContainer by passing
   * userFormId and controlId which is taken as props from parent Component
   * @function propControlData
   *
   */
  get propControlData (): controlData {
    return this.userformData[this.userFormId][this.controlId]
  }

  /**
   * @description To display contextmenu of control
   * @function openContextMenu
   * @param e it is type of mouseEvent
   * @param parentID is the UserFormId in which the control resides
   * @param controlId is the selected control of which context has to be displayed
   */
  openContextMenu (e: MouseEvent, parentID: string, controlID: string, type: string, mode: boolean) {
    EventBus.$emit('contextMenuDisplay', event, parentID, controlID, type, mode)
  }
  created () {
    EventBus.$on('handleName', (handler: string) => {
      this.handler = handler
    })
    EventBus.$on('groupDrag', (handler: string) => {
      this.grouphandler = handler
    })
    EventBus.$on('createGroup', (groupId: IemitGroup) => {
      this.createGroup(groupId)
    })
    EventBus.$on('updateIsControlMove', (val: boolean) => {
      this.updateIsControlMove(val)
    })
    EventBus.$on('afterPaste', () => {
      if (this.selectedControls[this.userFormId].container[0] === this.containerId) {
        this.isControlPasted = true
      }
    })
    EventBus.$on('mouseUpOnPageTab', (val: boolean) => {
      this.mouseUpOnPageTab = val
    })
  }
  destroyed () {
    // EventBus.$off('handleName')
    // EventBus.$off('groupDrag')
    EventBus.$off('afterPaste')
    // EventBus.$off('mouseUpOnPageTab')
  }
  @Watch('selectedControls', { deep: true })
  updateGroupStyle () {
    if (this.selectedContainer === this.containerId) {
      EventBus.$emit('groupArray', this.groupRef.divStyleArray)
      this.groupStyleArray = [...this.groupRef.divStyleArray]
    }
  }
  get checkIsEditMode () {
    const selected = this.selectedControls[this.userFormId].selected
    const container = this.selectedControls[this.userFormId].container[0]
    if ((selected.length === 1 && (this.propControlData.type === 'Frame' || this.propControlData.type === 'Page' || this.propControlData.type === 'Userform')) || (selected.length > 1 && container === this.propControlData.properties.ID)) {
      return true
    } else {
      return false
    }
  }
  get parentDiv () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    const ph = type && type === 'Page' ? parseInt(this.dragSelctorWidthHeight.height!) - this.fitPictureSizeHeight! : this.propControlData.properties.Height! - this.fitPictureSizeHeight!
    const pw = type && type === 'Page' ? parseInt(this.dragSelctorWidthHeight.width!) - this.fitPictureSizeWidth! : this.propControlData.properties.Width! - this.fitPictureSizeWidth!
    return {
      width: pw + 'px',
      height: ph + 'px',
      position: 'absolute',
      overflow: 'hidden'
    }
  }
  get calContainerHeight () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    const ph = type && type === 'Page' ? this.height! : controlProp.Height!
    if (type === 'Userform') {
      if (controlProp.BorderStyle === 1 || controlProp.SpecialEffect! > 0) {
        return ph! - 49
      }
      return ph! - 47
    } else if (type === 'Frame') {
      return ph! - 25
    } else if (type === 'Page') {
      return parseInt(this.dragSelctorWidthHeight!.height!) - 17
    }
    return 0
  }
  get calContainerWidth () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    const pw = type && type === 'Page' ? this.width! : controlProp.Width!
    if (type === 'Userform') {
      if (controlProp.BorderStyle === 1 || controlProp.SpecialEffect! > 0) {
        return pw! - 20
      }
      return pw! - 18
    } else if (type === 'Frame') {
      if (controlProp.BorderStyle === 1 || controlProp.SpecialEffect! > 0) {
        return pw! - 21
      }
      return pw! - 20
    } else if (type === 'Page') {
      return parseInt(this.dragSelctorWidthHeight!.width!) - 17
    }
    return 0
  }
  get horizontalScrollBarStyle () {
    let addWidth = ''
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    addWidth = 'calc(100%)'
    return {
      zIndex: 1000,
      width: addWidth,
      height: '17px',
      position: 'absolute',
      background: '#F5F5F5',
      overflowX: this.getScrollBarX,
      visibility: this.getScrollBarX === 'scroll' ? 'visible' : 'hidden',
      bottom: '0px',
      overflowY: this.getScrollBoarProp === 'horizontal' ? 'hidden' : ''
    }
  }
  get verticalScrollBarStyle () {
    let addHeight = ''
    if (this.getScrollBoarProp === 'vertical') {
      addHeight = 'calc(100%)'
    } else {
      addHeight = 'calc(100% - 15px)'
    }
    return {
      zIndex: 1000,
      width: '18px',
      height: addHeight,
      position: 'absolute',
      background: '#F5F5F5',
      overflowY: this.getScrollBarY,
      visibility: this.getScrollBarY === 'scroll' ? 'visible' : 'hidden',
      right: '0px'
      // left: this.calContainerWidth + 'px'
    }
  }
  get verticalScrollThumbStyle () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    const ph = type && type === 'Page' ? parseInt(this.dragSelctorWidthHeight.height!) - this.fitPictureSizeHeight! : this.propControlData.properties.Height! - this.fitPictureSizeHeight!
    return {
      height: (controlProp.ScrollHeight === 0 || controlProp.ScrollHeight! < ph) ? ph + 'px' : controlProp.ScrollHeight! + 'px'
    }
  }
  get horizontalScrollThumbStyle () {
    const controlProp = this.propControlData.properties
    const type = this.propControlData.type
    const pw = type && type === 'Page' ? parseInt(this.dragSelctorWidthHeight.width!) - this.fitPictureSizeWidth! : this.propControlData.properties.Width! - this.fitPictureSizeWidth!
    return {
      height: '17px',
      width: (controlProp.ScrollWidth === 0 || controlProp.ScrollWidth! < pw) ? pw + 'px' : controlProp.ScrollWidth! + 'px'
    }
  }
  updateMousedownVar (e: MouseEvent) {
    this.mouseDownContainer = this.containerId
    this.mouseDownEvent = e
    this.isDargMouseDown = true
  }

  @Emit('deActiveControl')
  deActiveControl (event: MouseEvent) {
    return event
  }
  @Emit('dragSelectorControl')
  dragSelectorControl (event: MouseEvent) {
    return event
  }
  @Emit('addControlObj')
  addControlObj (event: MouseEvent) {
    return event
  }
  updateIsControlMove (val: boolean) {
    this.isControlMove = val
  }
  @Watch('propControlData.properties.ScrollLeft')
  updateChildWidth () {
    this.parentDivRef.scrollLeft = this.propControlData.properties.ScrollLeft!
    this.horizontalScrollRef.scrollLeft = this.propControlData.properties.ScrollLeft!
  }
  @Watch('propControlData.properties.ScrollTop')
  updateChildHeight () {
    this.parentDivRef.scrollTop = this.propControlData.properties.ScrollTop!
    this.verticalScrollRef.scrollTop = this.propControlData.properties.ScrollTop!
  }
  updateScroll (e: MouseEvent) {
    this.pictureDivRef.scrollTop = 0
    this.parentDivRef.scrollTop = this.propControlData.properties.ScrollTop!
    this.childDivRef.scrollTop = 0
    this.pictureDivRef.scrollLeft = 0
    this.parentDivRef.scrollLeft = this.propControlData.properties.ScrollLeft!
    this.childDivRef.scrollLeft = 0
  }
}
</script>

<style scoped>
:focus {
  outline: none;
}
</style>
