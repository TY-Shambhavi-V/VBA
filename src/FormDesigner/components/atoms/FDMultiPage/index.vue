<template>
  <div>
    <div
      class="outer-page"
      :style="pageStyleObj"
      :title="properties.ControlTipText"
      @mouseover="updateMouseCursor"
      @mousedown="pageMouseDown"
      @contextmenu="handleContextMenu"
      @keydown.delete.stop.exact="deleteMultiPage"
      @keyup.stop="selectMultipleCtrl($event, false)"
      :tabindex="properties.TabIndex"
    >
      <div
        class="pages"
        :style="styleTabsObj"
        @mouseover="updateMouseCursor"
        :title="properties.ControlTipText"
        v-if="controls.length > 0"
      >
        <div class="move" ref="scrolling" :style="styleMoveObj" @mouseup="mouseUpOnPage" @mouseover="updateMouseCursor">
          <div
            ref="controlTabsRef"
            class="page"
            v-for="(value, key) in controls"
            :key="key"
            :style="getTabStyle"
            @mouseover="updateMouseCursor"
          >
            <FDControlTabs
              @isMouseDown="isMouseDownPageTab"
              @setValue="setValue"
              @isChecked="isChecked"
              :setFontStyle="setFontStyle"
              @tempStretch="tempStretch"
              @deleteMultiPageControl="
                (event) => {
                  deleteMultiPageControl(event);
                }
              "
              :data="data"
              :pageValue="value"
              :indexValue="key"
              :pageData="pageData(value).properties"
              :isRunMode="isRunMode"
              :isEditMode="isEditMode"
              :isItalic="isItalic"
              :tempStretch="tempStretch"
              :tempWeight="tempWeight"
              :controlCursor="controlCursor"
              :tempWidth="tempWidth"
              ref="controlTab"
            />
          </div>
        </div>
        <div
          class="content"
          :style="styleContentObj"
          ref="contentRef"
          @mouseover="updateMouseCursor"
          :title="properties.ControlTipText"
        >
          <div
            v-if="controls.includes(selectedPageID)"
            :style="containerDivStyle"
            :title="properties.ControlTipText"
            :tabindex="properties.TabIndex"
            @keydown.delete.exact="deleteMultiPageControl"
            @keydown.ctrl.exact.stop="selectMultipleCtrl($event, true)"
            @keydown.ctrl.stop="handleKeyDown"
            @keydown.enter.exact="setContentEditable($event, true)"
            @keydown.shift.exact.stop="selectMultipleCtrl($event, true)"
            @contextmenu="
              showContextMenu($event, selectedPageID, selectedPageID, 'container', isEditMode)
            "
          >
            <Container
              v-if="properties.Value !== -1"
              :userFormId="userFormId"
              :controlId="selectedPageID"
              :containerId="selectedPageID"
              :isEditMode="isEditMode"
              :getScrollBarX="getScrollBarPage.overflowX"
              :getScrollBarY="getScrollBarPage.overflowY"
              :title="properties.ControlTipText"
              :width="properties.Width"
              :height="properties.Height"
              :getSampleDotPattern="getSampleDotPattern"
              ref="containerRef"
              :createBackgroundString="getPicture"
              :getSizeMode="getSizeMode"
              :getRepeatData="getRepeatData"
              :getPosition="getPosition"
              :dragSelctorWidthHeight="styleContentObj"
             @deActiveControl="deActControl"
             @dragSelectorControl="dragSelectorControl"
             @addControlObj="addContainerControl"
            />
          </div>
        </div>
        <div></div>
        <div :style="getScrollButtonStyleObj" ref="buttonStyleRef">
          <button class="left-button" :style="scrollButtonStyle" @mousedown="mouseDownstop($event)" @click="isEditMode&&leftmove()" @mouseover="updateMouseCursor"></button>
          <button class="right-button" :style="scrollButtonStyle" @mousedown="mouseDownstop($event)" @click="isEditMode&&rightmove()" @mouseover="updateMouseCursor"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import { State, Action } from 'vuex-class'
import FdContainerVue from '@/api/abstract/FormDesigner/FdContainerVue'
import { controlProperties } from '@/FormDesigner/controls-properties'
import ContextMenu from '../FDContextMenu/index.vue'
import { tabsContextMenu } from '../../../models/tabsContextMenu'
import Vue from 'vue'
import FDControlTabs from '@/FormDesigner/components/atoms/FDControlTabs/index.vue'
import Container from '@/FormDesigner/components/organisms/FDContainer/index.vue'
import { EventBus } from '@/FormDesigner/event-bus'

@Component({
  name: 'FDMultiPage',
  components: {
    ContextMenu,
    FDControlTabs,
    Container: () =>
      import('@/FormDesigner/components/organisms/FDContainer/index.vue')
  }
})
export default class FDMultiPage extends Mixins(FdContainerVue) {
  @State((state) => state.fd.userformData) userformData!: userformData;
  @Prop({ required: true, type: String }) public userFormId!: string;
  @Ref('scrolling') scrolling!: HTMLDivElement;
  @Ref('contentRef') contentRef!: HTMLDivElement;
  @Ref('containerRef') readonly containerRef!: Container;
  @Ref('multipage') multipage!: HTMLDivElement;
  @Ref('controlTabsRef') controlTabsRef!: HTMLDivElement[];
  @Ref('controlTab') controlTab!: FDControlTabs[];
  @Ref('buttonStyleRef') buttonStyleRef!: HTMLDivElement;

  viewMenu: boolean = false;
  top: string = '0px';
  left: string = '0px';
  contextMenuValue: Array<IcontextMenu> = tabsContextMenu;
  updatedValue: number = 0;
  selectedPageID: string = '';
  multiPageContextMenu: boolean = false;
  tempWidth: number = 0;
  tempHeight: number = 0;
  multiRowCount: number = 1;
  isScrollVisible = false;
  topValue: number = 0;
  widthValue: number = 40;
  rowsCount: string = '';
  scrollButtonHeight: number = 0;
  scrollButtonWidth: number = 0;
  pageValueIndex!: selectedTab;
  lastChangedInRightMove: boolean = false;
  tabsIndex: number = 0;

  mouseDownstop (e: MouseEvent) {
    debugger
    if (this.isEditMode) {
      e.stopPropagation()
    }
  }
  updateTabsWidth () {
    if (this.properties.MultiRow) {
      if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
        if (this.properties.Style === 0) {
          if (this.properties.TabFixedWidth === 0) {
            if (this.scrolling && this.scrolling.children && this.scrolling.children[0] && this.scrolling.children[0].children[0] && this.scrolling.children[0].children[0].children[1] && this.scrolling.children[0].children[0].children[1].children[0]) {
              const move = this.scrolling as HTMLDivElement
              const moveChild = this.scrolling.children[0] as HTMLDivElement
              for (let index = 0; index < move.children.length; index++) {
                const a = move.children[index].children[0].children[1] as HTMLDivElement
                a.style.paddingLeft = '5px'
                a.style.paddingRight = '5px'
              }
              if (move.offsetHeight > (moveChild.offsetHeight + 1)) {
                let numberOfRows = Math.ceil(move.offsetHeight / (moveChild.offsetHeight + 1))
                let tabIndexValue = 0
                let currentTabsWidth = 0
                let rowWidth = 0
                for (let i = 0; i < numberOfRows; i++) {
                  currentTabsWidth = 0
                  for (let j = tabIndexValue; j < move.children.length; j++) {
                    const a = move.children[j].children[0].children[1] as HTMLDivElement
                    const childElement = move.children[j].children[0].children[1].children[0] as HTMLSpanElement
                    if (i !== numberOfRows - 1) {
                      currentTabsWidth += (childElement.clientWidth + parseInt(a.style.paddingLeft) + parseInt(a.style.paddingRight) + 2)
                    }
                    if (currentTabsWidth > this.properties.Width!) {
                      rowWidth = currentTabsWidth - (childElement.clientWidth + parseInt(a.style.paddingLeft) + parseInt(a.style.paddingRight) + 2)
                      if (rowWidth !== 0) {
                        for (let k = tabIndexValue; k < j; k++) {
                          if (k === (j - 1)) {
                            const extraWidth = (this.properties.Width! - rowWidth) / (j - tabIndexValue)
                            for (let l = tabIndexValue; l <= k; l++) {
                              const a = this.scrolling.children[l].children[0].children[1] as HTMLDivElement
                              a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 1 + 'px'
                              a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 1 + 'px'
                            }
                          }
                        }
                        tabIndexValue = j
                        currentTabsWidth = 0
                      } else {
                        tabIndexValue = j + 1
                        currentTabsWidth = 0
                      }
                      break
                    } else if (i === numberOfRows - 1) {
                      const a = move.children[j].children[0].children[1] as HTMLDivElement
                      const childElement = move.children[j].children[0].children[1].children[0] as HTMLSpanElement
                      currentTabsWidth += (childElement.clientWidth + parseInt(a.style.paddingLeft) + parseInt(a.style.paddingRight) + 2)
                      if (j === move.children.length - 1) {
                        for (let k = tabIndexValue; k <= j; k++) {
                          const extraWidth = (this.properties.Width! - currentTabsWidth) / (j - tabIndexValue + 1)
                          const a = this.scrolling.children[k].children[0].children[1] as HTMLDivElement
                          a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 1 + 'px'
                          a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 1 + 'px'
                        }
                      }
                    }
                  }
                }
              }
            }
            if (this.scrolling) {
              this.scrolling.scrollLeft = 0
            }
          } else {
            if (this.scrolling && this.scrolling.children && this.scrolling.children[0] && this.scrolling.children[0].children[0] && this.scrolling.children[0].children[0].children[1] && this.scrolling.children[0].children[0].children[1].children[0]) {
              const move = this.scrolling as HTMLDivElement
              const moveChild = this.scrolling.children[0] as HTMLDivElement
              for (let index = 0; index < move.children.length; index++) {
                const a = move.children[index].children[0].children[1] as HTMLDivElement
                a.style.paddingLeft = '5px'
                a.style.paddingRight = '5px'
              }
            }
          }
        } else if (this.properties.Style === 1) {
          if (this.scrolling && this.scrolling.children && this.scrolling.children[0] && this.scrolling.children[0].children[0] && this.scrolling.children[0].children[0].children[1] && this.scrolling.children[0].children[0].children[1].children[0]) {
            const move = this.scrolling as HTMLDivElement
            const moveChild = this.scrolling.children[0] as HTMLDivElement
            for (let index = 0; index < move.children.length; index++) {
              const a = move.children[index].children[0].children[1] as HTMLDivElement
              a.style.paddingLeft = '5px'
              a.style.paddingRight = '5px'
            }
            if (move.offsetHeight > (moveChild.offsetHeight + 5)) {
              let numberOfRows = this.properties.Value !== 0 ? Math.ceil(move.offsetHeight / (moveChild.offsetHeight + 5)) : Math.ceil(move.offsetHeight / moveChild.offsetHeight)
              let tabIndexValue = 0
              let currentTabsWidth = 0
              let rowWidth = 0
              for (let i = 0; i < numberOfRows; i++) {
                currentTabsWidth = 0
                for (let j = tabIndexValue; j < move.children.length; j++) {
                  const a = move.children[j].children[0].children[1] as HTMLDivElement
                  const childElement = move.children[j].children[0].children[1].children[0] as HTMLSpanElement
                  if (i !== numberOfRows - 1) {
                    currentTabsWidth += (childElement.clientWidth + parseInt(a.style.paddingLeft) + parseInt(a.style.paddingRight) + 10)
                  }
                  if (currentTabsWidth > this.properties.Width!) {
                    rowWidth = currentTabsWidth - (childElement.clientWidth + parseInt(a.style.paddingLeft) + parseInt(a.style.paddingRight) + 10)
                    if (rowWidth !== 0) {
                      for (let k = tabIndexValue; k < j; k++) {
                        if (k === (j - 1)) {
                          const extraWidth = (this.properties.Width! - rowWidth) / (j - tabIndexValue)
                          for (let l = tabIndexValue; l <= k; l++) {
                            const a = this.scrolling.children[l].children[0].children[1] as HTMLDivElement
                            a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 1 + 'px'
                            a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 1 + 'px'
                          }
                        }
                      }
                      tabIndexValue = j
                      currentTabsWidth = 0
                    } else {
                      tabIndexValue = j + 1
                      currentTabsWidth = 0
                    }
                    break
                  } else if (i === numberOfRows - 1) {
                    const a = move.children[j].children[0].children[1] as HTMLDivElement
                    const childElement = move.children[j].children[0].children[1].children[0] as HTMLSpanElement
                    currentTabsWidth += (childElement.clientWidth + parseInt(a.style.paddingLeft) + parseInt(a.style.paddingRight) + 10)
                    if (j === move.children.length - 1) {
                      for (let k = tabIndexValue; k <= j; k++) {
                        const extraWidth = (this.properties.Width! - currentTabsWidth) / (j - tabIndexValue + 1)
                        const a = this.scrolling.children[k].children[0].children[1] as HTMLDivElement
                        a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 1 + 'px'
                        a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 1 + 'px'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        if (this.scrolling && this.scrolling.children && this.scrolling.children[0] && this.scrolling.children[0].children[0] && this.scrolling.children[0].children[0].children[1] && this.scrolling.children[0].children[0].children[1].children[0]) {
          const move = this.scrolling as HTMLDivElement
          const moveChild = this.scrolling.children[0] as HTMLDivElement
          for (let index = 0; index < move.children.length; index++) {
            const a = move.children[index].children[0].children[1] as HTMLDivElement
            a.style.paddingLeft = '5px'
            a.style.paddingRight = '5px'
          }
        }
      }
    } else {
      if (this.scrolling && this.scrolling.children && this.scrolling.children[0] && this.scrolling.children[0].children[0] && this.scrolling.children[0].children[0].children[1] && this.scrolling.children[0].children[0].children[1].children[0]) {
        const move = this.scrolling as HTMLDivElement
        const moveChild = this.scrolling.children[0] as HTMLDivElement
        for (let index = 0; index < move.children.length; index++) {
          const a = move.children[index].children[0].children[1] as HTMLDivElement
          a.style.paddingLeft = '5px'
          a.style.paddingRight = '5px'
        }
      }
    }
  }

  get scrollButtonStyle () {
    const controlProp = this.properties
    return {
      cursor: this.controlCursor,
      opacity: this.scrolling ? ((this.scrolling.scrollLeft === (this.scrolling.scrollWidth - this.scrolling.clientWidth)) ? '0.4' : '1') : '1',
      width: this.setSpinButtonWidth + 'px',
      height: this.setSpinButtonHeight + 'px'
    }
  }
  get setSpinButtonWidth () {
    let spinButtonWidth: number = 0
    const tabFixedHeight = this.properties.TabFixedHeight!
    const tabFixedWidth = this.properties.TabFixedWidth!
    if (this.properties.TabOrientation === 0) {
      if (tabFixedHeight! > 13 || tabFixedHeight! === 0) {
        spinButtonWidth = 22
      } else {
        if (tabFixedHeight === 4) { spinButtonWidth = 7 } else if (tabFixedHeight === 5) { spinButtonWidth = 8.5 } else if (tabFixedHeight === 6) { spinButtonWidth = 10 } else if (tabFixedHeight === 7) { spinButtonWidth = 11.5 } else if (tabFixedHeight === 8) { spinButtonWidth = 13 } else if (tabFixedHeight === 9) { spinButtonWidth = 14.5 } else if (tabFixedHeight === 10) { spinButtonWidth = 16 } else if (tabFixedHeight === 11) { spinButtonWidth = 17.5 } else if (tabFixedHeight === 12) { spinButtonWidth = 19 } else if (tabFixedHeight === 13) { spinButtonWidth = 20.5 }
      }
    } else if (this.properties.TabOrientation === 1) {
      if (tabFixedHeight! > 22 || tabFixedHeight! === 0) {
        spinButtonWidth = 22
      } else {
        if (tabFixedHeight! < 7) {
          spinButtonWidth = 7
        } else {
          spinButtonWidth = tabFixedHeight
        }
      }
    } else {
      if (tabFixedWidth! > 13 || tabFixedWidth! === 0) {
        spinButtonWidth = 22
      } else {
        if (tabFixedWidth === 4) { spinButtonWidth = 7 } else if (tabFixedWidth === 5) { spinButtonWidth = 8.5 } else if (tabFixedWidth === 6) { spinButtonWidth = 10 } else if (tabFixedWidth === 7) { spinButtonWidth = 11.5 } else if (tabFixedWidth === 8) { spinButtonWidth = 13 } else if (tabFixedWidth === 9) { spinButtonWidth = 14.5 } else if (tabFixedWidth === 10) { spinButtonWidth = 16 } else if (tabFixedWidth === 11) { spinButtonWidth = 17.5 } else if (tabFixedWidth === 12) { spinButtonWidth = 19 } else if (tabFixedWidth === 13) { spinButtonWidth = 20.5 }
      }
    }
    this.scrollButtonWidth = spinButtonWidth
    return spinButtonWidth
  }

  get setSpinButtonHeight () {
    let spinButtonHeight: number = 0
    const tabFixedHeight = this.properties.TabFixedHeight!
    const tabFixedWidth = this.properties.TabFixedWidth!
    if (this.properties.TabOrientation === 0) {
      if (tabFixedHeight! > 13 || tabFixedHeight! === 0) {
        spinButtonHeight = 18
      } else {
        if (tabFixedHeight === 4) { spinButtonHeight = 8 } else if (tabFixedHeight === 5) { spinButtonHeight = 9 } else if (tabFixedHeight === 6) { spinButtonHeight = 10 } else if (tabFixedHeight === 7) { spinButtonHeight = 11 } else if (tabFixedHeight === 8) { spinButtonHeight = 12 } else if (tabFixedHeight === 9) { spinButtonHeight = 13 } else if (tabFixedHeight === 10) { spinButtonHeight = 14 } else if (tabFixedHeight === 11) { spinButtonHeight = 15 } else if (tabFixedHeight === 12) { spinButtonHeight = 16 } else if (tabFixedHeight === 13) { spinButtonHeight = 17 }
      }
    } else if (this.properties.TabOrientation === 1) {
      if (tabFixedHeight! >= 22 || tabFixedHeight! === 0) {
        spinButtonHeight = 18
      } else {
        if (tabFixedHeight! < 8) {
          spinButtonHeight = 8
        } else if (tabFixedHeight! === 21) {
          spinButtonHeight = 17.5
        } else if (tabFixedHeight! === 20) {
          spinButtonHeight = 17
        } else if (tabFixedHeight! === 19) {
          spinButtonHeight = 16.5
        } else if (tabFixedHeight! === 18) {
          spinButtonHeight = 16
        } else if (tabFixedHeight! === 17) {
          spinButtonHeight = 15.5
        } else if (tabFixedHeight! === 16) {
          spinButtonHeight = 15
        } else if (tabFixedHeight! === 15) {
          spinButtonHeight = 14.5
        } else {
          spinButtonHeight = tabFixedHeight
        }
      }
    } else {
      if (tabFixedWidth! > 13 || tabFixedWidth! === 0) {
        spinButtonHeight = 18
      } else {
        if (tabFixedWidth === 4) { spinButtonHeight = 8 } else if (tabFixedWidth === 5) { spinButtonHeight = 9 } else if (tabFixedWidth === 6) { spinButtonHeight = 10 } else if (tabFixedWidth === 7) { spinButtonHeight = 11 } else if (tabFixedWidth === 8) { spinButtonHeight = 12 } else if (tabFixedWidth === 9) { spinButtonHeight = 13 } else if (tabFixedWidth === 10) { spinButtonHeight = 14 } else if (tabFixedWidth === 11) { spinButtonHeight = 15 } else if (tabFixedWidth === 12) { spinButtonHeight = 16 } else if (tabFixedWidth === 13) { spinButtonHeight = 17 }
      }
    }
    this.scrollButtonHeight = spinButtonHeight
    return spinButtonHeight
  }

  /**
   * @description sets scrollbar left and top position
   * @function scrollLeftTop
   * @param controlData propControlData passed as input
   */
  scrollLeftTop (controlData: controlData) {
    if (this.selectedPageData) {
      const scrollLeft: number = controlData!.properties.ScrollLeft!
      const scrollTop: number = controlData!.properties.ScrollTop!
      if (scrollLeft > 0) {
        (this.contentRef as IScrollRef).scrollLeft = scrollLeft
      }
      if (scrollTop > 0) {
        (this.contentRef as IScrollRef).scrollTop = scrollTop
      }
    }
  }
  focusPage () {
    Vue.nextTick(() => {
      if (this.properties.Value! > 0) {
        if (typeof this.properties.Value === 'number' && this.controls.length > 0) {
          const value: number = this.properties.Value as number
          (this.controlTab[value].$el.children[1] as HTMLSpanElement).focus()
        } else {
          (this.$el.children[0] as HTMLDivElement).focus()
        }
      }
    })
  }
  closeContextMenu () {
    this.multiPageContextMenu = false
    this.focusPage()
  }
  /**
   * @description takes a single page value based on the value of the control
   * @function pageData
   *
   */
  pageData (value: string): controlData {
    return this.userformData[this.userFormId][value]
  }

  get outerDivStyleObj () {
    return {
      width: `${this.properties.Width!}px`,
      height: `${this.properties.Height!}px`
    }
  }
  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on data
   * @function pageStyleObj
   *
   */
  get pageStyleObj () {
    const controlProp = this.properties
    let display = ''
    if (this.isRunMode) {
      display = controlProp.Visible ? controlProp.Width === 0 || controlProp.Height === 0 ? 'none' : 'inline-block' : 'none'
    } else {
      display = controlProp.Width === 0 || controlProp.Height === 0 ? 'none' : 'inline-block'
    }
    return {
      left: `${controlProp.Left}px`,
      width: `${controlProp.Width}px`,
      height: `${controlProp.Height}px`,
      top: `${controlProp.Top}px`,
      cursor: this.controlCursor,
      display: display,
      borderLeft: controlProp.Style === 0 ? '2px solid whitesmoke' : '',
      borderBottom: controlProp.Style === 0 ? (controlProp.TabOrientation === 0 ? '1px solid gray' : '') : ''
    }
  }

  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on data
   * @function styleTabsObj
   *
   */
  protected get styleTabsObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    return {
      overflow: 'hidden',
      display: 'flex',
      cursor: this.controlCursor,
      backgroundColor: controlProp.BackColor,
      justifyContent: controlProp.TabOrientation === 3 ? 'flex-end' : '',
      height: `${controlProp.Height!}px`
    }
  }

  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on data
   * @function styleMoveObj
   *
   */
  protected get styleMoveObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    if (this.scrolling) {
      Vue.nextTick(() => {
        if (this.properties.MultiRow) {
          this.scrolling.scrollLeft = 0
        }
      })
    }
    return {
      alignSelf: controlProp.TabOrientation === 1 ? 'flex-end' : '',
      float: controlProp.TabOrientation === 3 ? 'right' : '',
      whiteSpace: controlProp.MultiRow === true ? 'break-spaces' : 'nowrap',
      zIndex: '0',
      direction: (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'rtl' : 'ltr',
      display: controlProp.Style === 2 ? 'none' : (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'grid' : 'inline-block',
      gridAutoFlow: (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'column' : '',
      gridTemplateRows: (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? this.rowsCount : '',
      height:
        controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3
          ? this.isScrollVisible
            ? `${controlProp.Height! - 48}px`
            : `${controlProp.Height}px`
          : 'fit-content',
      width:
        controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3
          ? ''
          : !this.isScrollVisible
            ? `${controlProp.Width}px`
            : `${controlProp.Width! - 42}px`,
      overflow: 'hidden',
      cursor: this.controlCursor,
      gridAutoColumns: (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'max-content' : ''
    }
  }

  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on data
   * @function containerDivStyle
   *
   */
  get containerDivStyle () {
    if (this.selectedPageData) {
      let zoomVal = this.selectedPageData
        ? this.selectedPageData.properties.Zoom! / 100
        : ''
      return {
        width: '100%',
        height: '100%',
        position: 'relative'
      }
    }
  }
  /**
   * @description style object is passed to :style attribute in button tags
   * dynamically changing the styles of the component based on data
   * @function getScrollButtonStyleObj
   *
   */
  protected get getScrollButtonStyleObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    const tabsLength =
      this.properties.TabFixedWidth! > 0
        ? this.controls.length * this.properties.TabFixedWidth! +
          10 * this.controls!.length
        : this.properties.Font!.FontSize! < 36
          ? this.properties.Font!.FontSize! * 3.5 * this.controls!.length
          : this.properties.Font!.FontSize! * 2.3 * this.controls!.length
    const tabsHeight =
      this.properties.TabFixedHeight! > 0
        ? this.controls.length * this.properties.TabFixedHeight! +
          this.properties.Font!.FontSize! * this.controls!.length
        : this.properties.Font!.FontSize! * 2.3 * this.controls!.length
    this.updateDataModel({ propertyName: 'Width', value: this.properties.Width! + 1 })
    this.updateDataModel({ propertyName: 'Width', value: this.properties.Width! - 1 })
    return {
      position: 'absolute',
      zIndex: '3',
      marginTop:
        controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3
          ? `${controlProp.Height! - (this.scrollButtonWidth) - 10}px`
          : controlProp.TabOrientation === 1
            ? controlProp.TabFixedHeight! > 0 ? `${controlProp.Height! - this.scrollButtonHeight - 3}px` : `${controlProp.Height! - 22}px`
            : '0px',
      transform:
        controlProp.TabOrientation === 2
          ? 'rotate(90deg)'
          : this.transformScrollButtonStyle,
      display: controlProp.Style === 2 ? 'none' : !this.properties.MultiRow
        ? this.isScrollVisible
          ? 'block'
          : 'none'
        : 'none',
      right:
        controlProp.TabOrientation === 3
          ? controlProp.TabFixedWidth! > 9 ? '-10px' : controlProp.TabFixedWidth! > 0 && controlProp.TabFixedWidth! < 10 ? '-6px' : '-14px'
          : controlProp.TabOrientation === 2
            ? controlProp.TabFixedWidth! > 0 ? `${controlProp.Width! - this.scrollButtonHeight - 14}px` : `${controlProp.Width! - 32}px`
            : '0px',
      top: '0px',
      backgroundColor: 'rgb(238, 238, 238)'
    }
  }

  scrollDisabledValidate () {
    if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
      if (this.scrolling) {
        const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
        const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
        if (this.scrolling.scrollLeft >= (this.scrolling.scrollWidth - this.scrolling.clientWidth - 30)) {
          rightButton.style.opacity = '0.4'
          leftButton.style.opacity = '1'
        } else if (this.scrolling.scrollLeft === 0) {
          leftButton.style.opacity = '0.4'
          rightButton.style.opacity = '1'
        } else {
          leftButton.style.opacity = '1'
          rightButton.style.opacity = '1'
        }
      }
    } else {
      if (this.scrolling) {
        const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
        const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
        if (this.scrolling.scrollTop >= (this.scrolling.scrollHeight - this.scrolling.clientHeight)) {
          rightButton.style.opacity = '0.4'
          leftButton.style.opacity = '1'
        } else if (this.scrolling.scrollTop === 0) {
          leftButton.style.opacity = '0.4'
          rightButton.style.opacity = '1'
        } else {
          leftButton.style.opacity = '1'
          rightButton.style.opacity = '1'
        }
      }
    }
  }

  scrollButtonVerify () {
    let sum = 0
    Vue.nextTick(() => {
      this.isScrollVisible = false
      if (
        this.properties.TabOrientation === 0 ||
        this.properties.TabOrientation === 1
      ) {
        if (this.scrolling && !this.properties.MultiRow) {
          for (let i = 0; i < this.scrolling.children.length; i++) {
            const a = this.scrolling.children[i] as HTMLDivElement
            sum += a.offsetWidth
          }
          const tabsLength = sum
          if (tabsLength > this.properties.Width!) {
            this.isScrollVisible = true
          } else {
            this.isScrollVisible = false
          }
        }
      } else {
        if (this.scrolling && !this.properties.MultiRow) {
          for (let i = 0; i < this.scrolling.children.length; i++) {
            const a = this.scrolling.children[i] as HTMLDivElement
            sum += a.offsetHeight
          }
          const tabsHeight = sum
          if (tabsHeight > this.properties.Height!) {
            this.isScrollVisible = true
          } else {
            this.isScrollVisible = false
          }
        }
      }
      this.scrollDisabledValidate()
      this.updateMultiRowforLeftAndRight()
    })
  }

  /**
   * @description takes the index Value and pageValue and set the Value property
   * @function isChecked
   *
   */
  isChecked (value: selectedTab) {
    if (this.containerRef.isPropChanged !== true) {
      if (this.isEditMode) {
        this.updatedValue = value.indexValue
        this.selectedPageID = value.pageValue
        this.updateDataModel({ propertyName: 'Value', value: value.indexValue })
        this.selectControl({
          userFormId: this.userFormId,
          select: {
            container: this.getContainerList(this.selectedPageID),
            selected: [this.selectedPageID]
          }
        })
        this.focusPage()
      }
    }
  }

  /**
   * @description takes the ref of the div and determines the scrollLeft and scrollTop
   * @function leftmove
   *
   */
  leftmove () {
    if (this.scrolling && this.scrolling.children) {
      const scrollRef = this.scrolling
      if (this.tabsIndex > 0 && this.tabsIndex < this.scrolling.children.length && !this.lastChangedInRightMove) {
        this.tabsIndex = this.tabsIndex - 1
      }
      this.lastChangedInRightMove = false

      if (
        this.properties.TabOrientation === 0 ||
      this.properties.TabOrientation === 1
      ) {
        scrollRef.style.width = (this.properties.Width! - 42) + 'px'
        let sum = 0
        for (let i = 0; i < this.tabsIndex; i++) {
          const element = scrollRef.children[i] as HTMLDivElement
          sum += element.offsetWidth
        }
        scrollRef.scrollLeft = sum
        if (this.scrolling) {
          const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
          const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
          if (this.scrolling.scrollLeft >= (this.scrolling.scrollWidth - this.scrolling.clientWidth)) {
            rightButton.style.opacity = '0.4'
            leftButton.style.opacity = '1'
          } else if (this.scrolling.scrollLeft === 0) {
            leftButton.style.opacity = '0.4'
            rightButton.style.opacity = '1'
          } else {
            leftButton.style.opacity = '1'
            rightButton.style.opacity = '1'
          }
        }
      } else {
        scrollRef.style.height = (this.properties.Height! - 48) + 'px'
        let sum = 0
        for (let i = 0; i < this.tabsIndex; i++) {
          const element = scrollRef.children[i] as HTMLDivElement
          sum += element.offsetHeight
        }
        scrollRef.scrollTop = sum
        if (this.scrolling) {
          const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
          const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
          if (this.scrolling.scrollTop >= (this.scrolling.scrollHeight - this.scrolling.clientHeight)) {
            rightButton.style.opacity = '0.4'
            leftButton.style.opacity = '1'
          } else if (this.scrolling.scrollTop === 0) {
            leftButton.style.opacity = '0.4'
            rightButton.style.opacity = '1'
          } else {
            leftButton.style.opacity = '1'
            rightButton.style.opacity = '1'
          }
        }
      }
    }
  }

  /**
   * @description takes the ref of the div and determines the scrollLeft and scrollTop
   * @function rightmove
   *
   */
  rightmove () {
    if (this.scrolling && this.scrolling.children) {
      const scrollRef = this.scrolling
      if (this.tabsIndex >= 0 && this.tabsIndex < this.scrolling.children.length) {
        this.tabsIndex = this.tabsIndex + 1
      }
      let tempScrollTop = scrollRef.scrollTop!
      if (
        this.properties.TabOrientation === 0 ||
      this.properties.TabOrientation === 1
      ) {
        let sum = 0
        for (let i = 0; i < this.tabsIndex; i++) {
          const element = scrollRef.children[i] as HTMLDivElement
          sum += element.offsetWidth
        }
        if ((scrollRef.scrollWidth - scrollRef.clientWidth - 2) <= scrollRef.scrollLeft && scrollRef.scrollLeft < sum) {
          scrollRef.style.width = (scrollRef.clientWidth - (sum - scrollRef.scrollLeft)) + 'px'
        }
        scrollRef.scrollLeft = sum
        if (this.scrolling) {
          const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
          const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
          if (this.scrolling.scrollLeft >= (this.scrolling.scrollWidth - this.scrolling.clientWidth - 3)) {
            rightButton.style.opacity = '0.4'
            leftButton.style.opacity = '1'
            this.tabsIndex = this.tabsIndex - 1
            this.lastChangedInRightMove = true
            if (rightButton.style.opacity === '0.4') {
              if ((scrollRef.scrollWidth - scrollRef.clientWidth - 2) <= scrollRef.scrollLeft && scrollRef.scrollLeft < sum) {
                scrollRef.style.width = (scrollRef.clientWidth - (sum - scrollRef.scrollLeft)) + 'px'
              }
              scrollRef.scrollLeft = sum
            }
          } else if (this.scrolling.scrollLeft === 0) {
            leftButton.style.opacity = '0.4'
            rightButton.style.opacity = '1'
          } else {
            leftButton.style.opacity = '1'
            rightButton.style.opacity = '1'
          }
        }
      } else {
        let sum = 0
        for (let i = 0; i < this.tabsIndex; i++) {
          const element = scrollRef.children[i] as HTMLDivElement
          sum += element.offsetHeight
        }
        if ((scrollRef.scrollHeight - scrollRef.clientHeight - 2) <= scrollRef.scrollTop && scrollRef.scrollTop < sum) {
          scrollRef.style.height = (scrollRef.clientHeight - (sum - scrollRef.scrollTop)) + 'px'
        }
        scrollRef.scrollTop = sum
        if (this.scrolling) {
          const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
          const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
          if (this.scrolling.scrollTop >= (this.scrolling.scrollHeight - this.scrolling.clientHeight - 1)) {
            rightButton.style.opacity = '0.4'
            leftButton.style.opacity = '1'
            this.tabsIndex = this.tabsIndex - 1
            this.lastChangedInRightMove = true
            if (rightButton.style.opacity === '0.4') {
              if ((scrollRef.scrollHeight - scrollRef.clientHeight - 2) <= scrollRef.scrollTop && scrollRef.scrollTop < sum) {
                scrollRef.style.height = (scrollRef.clientHeight - (sum - scrollRef.scrollTop)) + 'px'
              }
              scrollRef.scrollTop = sum
            }
          } else if (this.scrolling.scrollTop === 0) {
            leftButton.style.opacity = '0.4'
            rightButton.style.opacity = '1'
          } else {
            leftButton.style.opacity = '1'
            rightButton.style.opacity = '1'
          }
        }
      }
    }
  }

  /**
   * @description takes the index Value and sets the Value property
   * @function setValue
   *
   */
  setValue (value: number) {
    this.updatedValue = value
    this.updateDataModel({ propertyName: 'Value', value: value })
    return true
  }
  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on data
   * @function getTabStyle
   *
   */
  protected get getTabStyle (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    return {
      display:
        controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1
          ? 'inline-block'
          : 'block',
      cursor: this.controlCursor
    }
  }

  /**
   * @description getRepeat returns string value from
   * controlProperties.extraDataRepeatProp
   * @function getRepeat
   */
  protected get getRepeatData (): string {
    if (this.selectedPageData) {
      const picture = this.selectedPageData.properties.Picture!
      const pictureTiling = this.selectedPageData.properties.PictureTiling!
      const pictureSizeMode = this.selectedPageData.properties.PictureSizeMode!
      return controlProperties.getRepeatDataProp(
        picture,
        pictureTiling,
        pictureSizeMode
      )
    } else {
      return ''
    }
  }

  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on data
   * @function styleContentObj
   *
   */
  protected get styleContentObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    let width = ''
    if (controlProp.Style !== 2) {
      if (controlProp.Style === 1) {
        if (controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1) {
          width = `${controlProp.Width! - 6}px`
        } else {
          if (controlProp.TabFixedWidth! > 0) {
            if (controlProp.MultiRow) {
              width = (controlProp.Width! - this.widthValue) + 'px'
            } else {
              width = controlProp.Width! - controlProp.TabFixedWidth! - 16 + 'px'
            }
          } else {
            if (controlProp.TabFixedWidth! === 0) {
              if (controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3) {
                if (controlProp.MultiRow) {
                  width = (controlProp.Width! - this.widthValue) + 'px'
                } else {
                  width = `${controlProp.Width! - this.tempWidth - 19}px`
                }
              } else {
                width = controlProp.Width! - controlProp.Font!.FontSize! - 26 + 'px'
              }
            } else {
              width = 'calc(100% - 50px)'
            }
          }
        }
      } else {
        if (controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1) {
          width = `${controlProp.Width! - 3}px`
        } else {
          if (controlProp.TabFixedWidth! > 0) {
            if (controlProp.TabOrientation === 3) {
              width = (controlProp.Width! - this.widthValue) + 'px'
            } else {
              width = controlProp.Width! - controlProp.TabFixedWidth! - 16 + 'px'
            }
          } else {
            if (controlProp.TabFixedWidth! === 0) {
              if (controlProp.TabOrientation === 2 ||
              controlProp.TabOrientation === 3) {
                if (controlProp.MultiRow) {
                  width = (controlProp.Width! - this.widthValue - 6) + 'px'
                } else {
                  width = (controlProp.Width! - this.widthValue - 6) + 'px'
                }
              } else {
                width = controlProp.Width! - controlProp.Font!.FontSize! - 26 + 'px'
              }
            } else {
              width = 'calc(100% - 44px)'
            }
          }
        }
      }
    } else {
      width = `${controlProp.Width! - 3}px`
    }
    let height = ''
    if (controlProp.Style !== 2) {
      if (controlProp.Style === 1) {
        if (controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1) {
          if (controlProp.MultiRow) {
            if (this.scrolling) {
              height = (controlProp.Height! - this.scrolling.clientHeight + 1) + 'px'
            } else {
              height = (controlProp.Height! -
                this.topValue + 5) + 'px'
            }
          } else {
            if (controlProp.TabFixedHeight! > 0) {
              if (this.scrolling) {
                if (controlProp.TabOrientation === 0) {
                  height = (controlProp.Height! - this.scrolling.clientHeight + 1) + 'px'
                } else {
                  height = controlProp.Height! - controlProp.TabFixedHeight! - 5 + 'px'
                }
              } else {
                if (controlProp.TabOrientation === 0) {
                  height = controlProp.Height! - controlProp.TabFixedHeight! - 19 + 'px'
                } else {
                  height = controlProp.Height! - controlProp.TabFixedHeight! - 5 + 'px'
                }
              }
            } else {
              if (controlProp.TabFixedHeight! === 0) {
                if (this.scrolling) {
                  height = (controlProp.Height! - this.scrolling.clientHeight + 3) + 'px'
                } else {
                  if (controlProp.Font!.FontSize! === 72) {
                    height = controlProp.Height! - controlProp.Font!.FontSize! - 27 + 'px'
                  } else {
                    height = controlProp.Height! - controlProp.Font!.FontSize! - 25 + 'px'
                  }
                }
              } else {
                if (controlProp.TabOrientation === 1) {
                  height = `${controlProp.Height! - 30}px`
                } else {
                  height = `${controlProp.Height! - 44}px`
                }
              }
            }
          }
        } else {
          height = `${controlProp.Height! - 5}px`
        }
      } else {
        if (controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1) {
          if (controlProp.MultiRow) {
            if (this.scrolling) {
              height = (controlProp.Height! - this.scrolling.clientHeight + 3) + 'px'
            } else {
              height = (controlProp.Height! -
                this.topValue + 5) + 'px'
            }
          } else {
            if (controlProp.TabFixedHeight! > 0) {
              if (this.scrolling) {
                if (controlProp.TabOrientation === 0) {
                  height = (controlProp.Height! - this.scrolling.clientHeight + 1) + 'px'
                } else {
                  height = controlProp.Height! - controlProp.TabFixedHeight! - 5 + 'px'
                }
              } else {
                if (controlProp.TabOrientation === 0) {
                  height = controlProp.Height! - controlProp.TabFixedHeight! - 10 + 'px'
                } else {
                  height = controlProp.Height! - controlProp.TabFixedHeight! - 5 + 'px'
                }
              }
            } else {
              if (controlProp.TabFixedHeight! === 0) {
                if (this.scrolling) {
                  height = (controlProp.Height! - this.scrolling.clientHeight + 3) + 'px'
                } else {
                  if (controlProp.Font!.FontSize! === 72) {
                    height = controlProp.Height! - controlProp.Font!.FontSize! - 23 + 'px'
                  } else if (controlProp.Font!.FontSize! > 24 && controlProp.Font!.FontSize! < 72) {
                    height = controlProp.Height! - controlProp.Font!.FontSize! - 17 + 'px'
                  } else {
                    height = controlProp.Height! - controlProp.Font!.FontSize! - 15 + 'px'
                  }
                }
              } else {
                if (controlProp.TabOrientation === 1) {
                  height = `${controlProp.Height! - 21}px`
                } else {
                  height = `${controlProp.Height! - 35}px`
                }
              }
            }
          }
        } else {
          height = `${controlProp.Height! + 2}px`
        }
      }
    } else {
      height = `${controlProp.Height! + 2}px`
    }
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
      })
    }
    let display = ''
    if (controlProp.MultiRow) {
      display = 'block'
    } else {
      if ((controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1) && (controlProp.Height! < controlProp.TabFixedHeight!)) {
        display = 'none'
      } else {
        if ((controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3) && (controlProp.Width! < controlProp.TabFixedWidth!)) {
          display = 'none'
        } else {
          if (controlProp.TabOrientation === 3) {
            if (controlProp.Width! < (this.widthValue + 12)) {
              display = 'none'
            } else {
              display = 'block'
            }
          } else {
            display = 'block'
          }
        }
      }
    }
    return {
      position: 'absolute',
      backgroundColor: 'rgb(238, 238, 238)',
      display: display,
      top:
        controlProp.Style !== 2
          ? controlProp.Style === 1
            ? controlProp.TabOrientation === 0
              ? controlProp.MultiRow
                ? this.topValue + 'px'
                : controlProp.TabFixedHeight! > 0
                  ? controlProp.TabFixedHeight! + 13 + 'px'
                  : controlProp.TabFixedHeight! === 0
                    ? this.tempHeight + 19 + 'px'
                    : '36px'
              : '3px'
            : controlProp.TabOrientation === 0
              ? controlProp.MultiRow
                ? this.topValue + 'px'
                : controlProp.TabFixedHeight! > 0
                  ? controlProp.TabFixedHeight! + 10 + 'px'
                  : controlProp.TabFixedHeight! === 0
                    ? this.tempHeight + 16 + 'px'
                    : '33px'
              : '0px'
          : '0px',
      height: controlProp.TabOrientation === 1 ? (parseInt(height) + 5) + 'px' : (parseInt(height) - 3) + 'px',
      // width: controlProp.TabOrientation === 3 ? controlProp.Style === 0 ? (parseInt(width) + 4) + 'px' : parseInt(width) + 'px' : width,
      width: controlProp.TabOrientation === 3 ? (parseInt(width) + 4) + 'px' : width,
      left:
        controlProp.Style !== 2
          ? controlProp.Style === 1 ? controlProp.TabOrientation === 2
            ? controlProp.MultiRow ? this.widthValue + 'px' : controlProp.TabFixedWidth! > 0
              ? controlProp.TabFixedWidth! + 13 + 'px'
              : controlProp.TabFixedWidth! === 0
                ? controlProp.TabOrientation === 2 ||
                controlProp.TabOrientation === 3
                  ? `${this.tempWidth + 13}px`
                  : controlProp.Font!.FontSize! + 23 + 'px'
                : '43px'
            : '3px'
            : controlProp.TabOrientation === 2
              ? controlProp.MultiRow ? this.widthValue + 'px' : controlProp.TabFixedWidth! > 0
                ? controlProp.TabFixedWidth! + 12 + 'px'
                : controlProp.TabFixedWidth! === 0
                  ? controlProp.TabOrientation === 2 ||
                controlProp.TabOrientation === 3
                    ? `${this.tempWidth + 12}px`
                    : controlProp.Font!.FontSize! + 20 + 'px'
                  : '40px'
              : '0px'
          : '0px',
      cursor: this.controlCursor,
      padding: controlProp.MultiRow ? '0px' : '0px',
      boxShadow: controlProp.Style === 0 ? (controlProp.TabOrientation === 0 ? '1px 0px gray' : '1px 1px gray') : 'none'
    }
  }
  /**
   * @description Returns string value for CSS background style for dotted patten
   * @function getSampleDotPattern
   */
  protected get getSampleDotPattern () {
    const dotSize = 13
    const dotSpace = 9
    return {
      backgroundPosition: `${dotSize}px ${dotSize}px`,
      backgroundImage: `radial-gradient(black 11%, transparent 10%)`,
      backgroundSize: `${dotSpace}px ${dotSpace}px`
    }
  }

  /**
   * @description getPosition returns string value from
   * controlProperties.picturePositionProp
   * @function getPosition
   * @returns string value
   */
  protected get getPosition () {
    if (this.selectedPageData) {
      const picture = this.selectedPageData.properties.Picture!
      const pictureAlignment = this.selectedPageData.properties
        .PictureAlignment!
      const pictureSizeMode = this.selectedPageData.properties.PictureSizeMode!
      return controlProperties.getPositionProp(
        picture,
        pictureAlignment,
        pictureSizeMode
      )
    } else {
      return ''
    }
  }

  /**
   * @description getSizeMode returns string value from
   * controlProperties.pictureSizeModeProp
   * @function getSizeMode
   * @returns string value
   */
  protected get getSizeMode (): string {
    if (this.selectedPageData) {
      const index: number = this.selectedPageData.properties.PictureSizeMode!
      return controlProperties.getSizeModeProp(index)
    } else {
      return ''
    }
  }

  /**
   * @description getScrollBarPage returns propData based on keepScrollBar and scrollBar values
   * @function getScrollBarPage
   */
  get getScrollBarPage () {
    if (this.selectedPageData) {
      const keepScrollBar: number = this.selectedPageData.properties
        .KeepScrollBarsVisible!
      const scrollBar: number = this.selectedPageData.properties.ScrollBars!
      return controlProperties.setScrollBarProp(keepScrollBar, scrollBar)
    } else {
      return ''
    }
  }

  /**
   * @description returns the selected page
   * dynamically based on the selectedPageID
   * @function selectedPageData
   *
   */
  get selectedPageData () {
    if (this.selectedPageID) {
      return this.userformData[this.userFormId][this.selectedPageID]
    } else {
      return ''
    }
  }

  updateMultiRowforLeftAndRight () {
    let pagecount = this.scrolling.children.length
    const controlProp = this.properties
    if (this.properties.MultiRow) {
      this.rowsCount = ''
      if (this.properties.TabOrientation === 2 || this.properties.TabOrientation === 3) {
        const totalHeight = this.properties.Height!
        this.widthValue = this.scrolling.clientWidth
        const k = this.properties.Value
        let sum = 0
        let count = this.scrolling.children.length
        const a = this.properties.Value === 0 ? this.scrolling.children[1].children[0].clientHeight + 'px' : this.scrolling.children[0].children[0].clientHeight + 'px'
        if (controlProp.TabFixedHeight === 0) {
          for (let index = 0; index < pagecount; index++) {
            const myref = this.scrolling.children[index].children[0].children[1] as HTMLDivElement
            const mydivref = this.scrolling.children[index] as HTMLDivElement
            myref.style.height = ''
            mydivref.style.height = ''
            mydivref.style.marginTop = ''
          }
        }
        for (let i = 0; i < this.scrolling.children.length; i++) {
          if (this.properties.Style === 1) {
            sum += (this.scrolling.children[i].children[0].clientHeight + 3)
          } else if (this.properties.Style === 0) {
            sum += (this.scrolling.children[i].children[0].clientHeight)
          }
        }
        if (totalHeight < sum) {
          if (this.properties.Style === 1) {
            count = totalHeight / ((this.properties.Value === 0 ? this.scrolling.children[1].children[0].clientHeight : this.scrolling.children[0].children[0].clientHeight) + 3)
          } else if (this.properties.Style === 0) {
            count = totalHeight / (this.properties.Value === 0 ? this.scrolling.children[1].children[0].clientHeight : this.scrolling.children[0].children[0].clientHeight)
          }
        }
        if (count < this.scrolling.children.length) {
          for (let j = 0; j < Math.trunc(count); j++) {
            if (j === this.properties.Value) {
              if (this.properties.Style as number === 1) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 5 + 'px') + ' '
              } else if (this.properties.Style as number === 0) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 4 + 'px') + ' '
              }
            } else {
              if (this.properties.Style as number === 1) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 3 + 'px') + ' '
              } else if (this.properties.Style as number === 0) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 'px') + ' '
              }
            }
          }
        } else {
          for (let j = 0; j < Math.trunc(count); j++) {
            if (j === k) {
              if (this.properties.Style as number === 1) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 7 + 'px') + ' '
              } else if (this.properties.Style as number === 0) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 4 + 'px') + ' '
              }
            } else {
              if (this.properties.Style as number === 1) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 3 + 'px') + ' '
              } else if (this.properties.Style as number === 0) {
                this.rowsCount = this.rowsCount + (parseInt(a) + 'px') + ' '
              }
            }
          }
        }
        const moveHeight = controlProp.Height
        if (controlProp.TabFixedHeight === 0) {
          if (((pagecount) % Math.trunc(count)) !== 0) {
            const labelHeight = (Math.ceil(moveHeight! / ((pagecount) % Math.trunc(count))) - 16) - 0.5
            let marginHeight = labelHeight + 15 - parseInt(controlProp.Value !== 0 ? this.rowsCount.substring(0, 2) : this.rowsCount.substring(5, 7))
            let a = this.rowsCount.split('px ').map((ele) => {
              if (!isNaN(parseInt(ele))) {
                return parseInt(ele)
              }
            })
            for (let index = pagecount - ((pagecount) % Math.trunc(count)), j = 0; index < pagecount; index++, j++) {
              const myref = this.scrolling.children[index].children[0].children[1] as HTMLDivElement
              const mydivref = this.scrolling.children[index] as HTMLDivElement
              mydivref.style.marginTop = `${marginHeight * j}px`
              mydivref.style.height = `${labelHeight + 14}px`
              myref.style.height = `${labelHeight}px`
            }
            for (let index = 0; index < Math.trunc(count); index++) {
              const myref = this.scrolling.children[index].children[0].children[1] as HTMLDivElement
              const mydivref = this.scrolling.children[index] as HTMLDivElement
              myref.style.height = ''
              mydivref.style.height = ''
              mydivref.style.marginTop = ''
            }
            const columnsCount = Math.ceil(this.scrolling.children.length / (Math.trunc(count)))
            for (let j = 1; j <= columnsCount; j++) {
              if ((j * Math.trunc(count)) - 1 < pagecount) {
                const myref = this.scrolling.children[(j * Math.trunc(count) - 1)].children[0].children[1] as HTMLDivElement
                if (Object.values(myref.style).includes('height')) {
                  myref.style.height = ''
                }
              }
            }
          } else {
            for (let index = 0; index < pagecount; index++) {
              const myref = this.scrolling.children[index].children[0].children[1] as HTMLDivElement
              const mydivref = this.scrolling.children[index] as HTMLDivElement
              myref.style.height = ''
              mydivref.style.height = ''
              mydivref.style.marginTop = ''
            }
          }
          let gridSum = this.rowsCount.split('px ').map(ele => { return isNaN(parseInt(ele)) ? 0 : parseInt(ele) })
          let totalgridHeight = gridSum.reduce(function (a, b) {
            return a + b
          }, 0)
          if (totalHeight > totalgridHeight && pagecount > count) {
            const diff = totalHeight - totalgridHeight
            const columnsCount = Math.ceil(this.scrolling.children.length / (Math.trunc(count)))
            for (let j = 1; j <= columnsCount; j++) {
              if ((j * Math.trunc(count)) - 1 < pagecount) {
                const myref = this.scrolling.children[(j * Math.trunc(count)) - 1].children[0].children[1] as HTMLDivElement
                const myDivref = this.scrolling.children[(j * Math.trunc(count)) - 1] as HTMLDivElement
                myDivref.style.height = `${myref.clientHeight + diff}px`
                myref.style.height = `${myref.clientHeight + diff - 14}px`
              }
            }
          }
        }
      } else {
        for (let index = 0; index < pagecount; index++) {
          const myref = this.scrolling.children[index].children[0].children[1] as HTMLDivElement
          const mydivref = this.scrolling.children[index] as HTMLDivElement
          myref.style.height = ''
          mydivref.style.height = ''
          mydivref.style.marginTop = ''
        }
      }
    } else if (controlProp.TabFixedHeight === 0) {
      for (let index = 0; index < pagecount; index++) {
        const myref = this.scrolling.children[index].children[0].children[1] as HTMLDivElement
        const mydivref = this.scrolling.children[index] as HTMLDivElement
        myref.style.height = ''
        mydivref.style.height = ''
        mydivref.style.marginTop = ''
      }
    }
  }

  /**
   * @description watches changes in propControlData to set autoset when true
   * @function isScrollUsed
   * @param oldVal previous propControlData data
   * @param newVal  new/changed propControlData data
   */
  @Watch('properties.Width')
  isScrollUsed (newVal: number, oldVal: number) {
    this.scrollDisabledValidate()
    if (this.properties.MultiRow) {
      this.updateMultiRowforLeftAndRight()
      this.widthValue = this.scrolling.clientWidth
      if (this.scrolling) {
        Vue.nextTick(() => {
          this.topValue = this.scrolling.offsetHeight
          this.widthValue = this.scrolling.clientWidth
          this.updateTabsWidth()
        })
      }
      const initialLength = this.controls.length!
      const len = (this.tempWidth + 12) * initialLength
      if (len - this.properties.Width! >= 0) {
        if (this.multiRowCount <= this.controls.length!) {
          const a = Math.ceil(len / this.properties.Width!)
          this.multiRowCount = a
          if (this.properties.Width! <= (this.tempWidth + 12) * 2) {
            this.multiRowCount = a + 2
          }
        } else if (newVal > oldVal) {
          this.multiRowCount = this.controls.length!
          const a = Math.ceil(len / this.properties.Width!)
          this.multiRowCount = a
        }
      } else {
        this.multiRowCount = 1
      }
    } else {
      this.scrollButtonVerify()
    }
  }

  @Watch('tempWidth')
  tempWidthValidate () {
    if (this.tempWidth < 30) {
      this.tempWidth = 30
    }
  }

  @Watch('properties.TabOrientation')
  orientValidate () {
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    this.widthValue = this.scrolling.clientWidth
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
      })
    }
    this.tabsIndex = 0
  }

  @Watch('properties.Style')
  styleValidate () {
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    this.widthValue = this.scrolling.clientWidth
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! + 1 })
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! - 1 })
        this.updateTabsWidth()
      })
    }
    if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
      if (this.scrolling) {
        if (this.scrolling.scrollWidth > this.scrolling.clientWidth) {
          this.scrolling.style.width = (this.properties.Width! - 42) + 'px'
        } else {
          this.scrolling.style.width = (this.properties.Width!) + 'px'
        }
        this.updateTabsWidthForValue()
      }
    }
  }

  @Watch('properties.Height')
  heightValidate () {
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        if (this.properties.MultiRow) {
          this.scrolling.scrollLeft = 0
          this.updateTabsWidth()
        }
      })
    }
  }

  @Watch('properties.TabFixedWidth')
  tabFixedWidthValidate () {
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! + 1 })
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! - 1 })
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
        if (this.isScrollVisible) {
          this.updateTabsWidthForValue()
        }
      })
    }
  }

  @Watch('properties.TabFixedHeight')
  tabFixedHeightValidate () {
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! + 1 })
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! - 1 })
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
        if (this.isScrollVisible) {
          this.updateTabsWidthForValue()
        }
      })
    }
  }

  @Watch('properties.MultiRow')
  multiRowValidate () {
    if (this.properties.MultiRow) {
      this.isScrollVisible = false
    } else {
      this.scrollButtonVerify()
    }
    this.updateMultiRowforLeftAndRight()
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
      })
    }
  }

  /**
   * @description watches changes in FontSize of Font
   * @function checkFontValue
   * @param oldVal previous properties data
   * @param newVal  new/changed properties data
   */
  @Watch('properties.Font.FontSize')
  checkFontValue (newVal: number, oldVal: number) {
    this.calculateWidthHeight()
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! + 1 })
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! - 1 })
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
      })
    }
  }

  @Watch('topValue')
  topValueValidate () {
    this.topValue = this.scrolling.offsetHeight
  }

  /**
   * @description watches changes in selectedPageData to set the caption
   * @function captionValue
   * @param oldVal previous selectedPageData data
   * @param newVal  new/changed selectedPageData data
   */
  @Watch('selectedPageData.properties.Caption')
  captionValue (newVal: string, oldVal: string) {
    if (newVal === '') {
      this.tempWidth = 30
    }
    this.calculateWidthHeight()
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! + 1 })
        this.updateDataModel({ propertyName: 'Height', value: this.properties.Height! - 1 })
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
      })
    }
    if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
      if (this.scrolling) {
        if (this.scrolling.scrollWidth > this.scrolling.clientWidth) {
          this.scrolling.style.width = (this.properties.Width! - 42) + 'px'
        } else {
          this.scrolling.style.width = (this.properties.Width!) + 'px'
        }
        this.updateTabsWidthForValue()
      }
    }
  }

  calculateWidthHeight () {
    const that = this
    if (this.controlTabsRef) {
      const divElement = this.controlTabsRef
      let tempWidth = 0
      let tempHeight = 0
      let maxWidth = 0
      Vue.nextTick(function () {
        for (let i = 0; i < divElement.length; i++) {
          const ele = divElement[i].children[0].children[1]
            .children[0] as HTMLInputElement
          if (ele.offsetWidth > maxWidth) {
            maxWidth = ele.offsetWidth
          }
          if (maxWidth > 30) {
            tempWidth = maxWidth
          } else {
            tempWidth = 30
          }
          if (ele.offsetHeight > tempHeight) {
            tempHeight = ele.offsetHeight
          }
        }
        that.tempWidth = tempWidth
        that.tempHeight = tempHeight
      })
    }
  }
  mounted () {
    this.updateTabsWidth()
    this.scrollButtonVerify()
    this.scrollLeftTop(this.data)
    this.selectedPageID = typeof (this.properties.Value!) === 'number' ? this.controls[this.properties.Value!] : this.controls[0]
    this.calculateWidthHeight()
  }
  dragSelectorControl (event: MouseEvent) {
    this.selectedControlArray = []
    if (
      this.selectedPageData &&
      this.controls.length > 0 &&
      this.controls.includes(this.selectedPageID)
    ) {
      this.selectedAreaStyle = this.containerRef.dragSelector.selectAreaStyle
      this.calSelectedAreaStyle(event, this.selectedPageData)
    }
  }
  deActControl (event: MouseEvent) {
    this.multiPageMouseDown(event)
  }
  multiPageMouseDown (e: MouseEvent) {
    if (e.which !== 3) {
      EventBus.$emit('isEditMode', this.isEditMode)
      const selContainer = this.selectedControls[this.userFormId].container[0]
      if (this.getContainerList(selContainer)[0] === this.controlId) {
        if (this.selMultipleCtrl === false && this.activateCtrl === false) {
          this.selectControl({
            userFormId: this.userFormId,
            select: {
              container: this.getContainerList(this.selectedPageID),
              selected: [this.selectedPageID]
            }
          })
        }
      }
    }
  }
  showContextMenu (
    e: MouseEvent,
    parentID: string,
    controlID: string,
    type: string,
    mode: boolean
  ) {
    e.preventDefault()
    if (this.isEditMode) {
      e.stopPropagation()
      EventBus.$emit('contextMenuDisplay', event, parentID, controlID, type, mode)
    }
  }
  handleKeyDown (event: KeyboardEvent) {
    EventBus.$emit('handleKeyDown', event, this.selectedPageID)
  }
  changeSelect (control: string) {
    this.selectControl({
      userFormId: this.userFormId,
      select: {
        container: this.getContainerList(control),
        selected: [control]
      }
    })
  }
  handleContextMenu (e: MouseEvent) {
    e.preventDefault()
    this.selectedItem(e)
    if (this.isEditMode) {
      e.stopPropagation()
      this.changeSelect(this.selectedPageID)
      EventBus.$emit('editModeContextMenu', e, this.controlId, this.data, true, this.updatedValue)
    }
  }
  deleteMultiPage (event: KeyboardEvent) {
    if (this.controlId === this.selectedControls[this.userFormId].selected[0]) {
      this.deleteItem(event)
    } else {
      this.handleKeyDown(event)
    }
  }
  updateScrollingLeftTop (e: MouseEvent) {
    const refName = this.contentRef
    this.updateControl({
      userFormId: this.userFormId,
      controlId: this.selectedPageID,
      propertyName: 'ScrollLeft',
      value: refName.scrollLeft
    })
    this.updateControl({
      userFormId: this.userFormId,
      controlId: this.selectedPageID,
      propertyName: 'ScrollTop',
      value: refName.scrollTop
    })
  }
  selectMultipleCtrl (event: KeyboardEvent, val: boolean) {
    if (event.key === 'Control' && event.keyCode === 17) {
      this.selMultipleCtrl = val
      EventBus.$emit('selectMultipleCtrl', val)
    } else if (event.key === 'Shift' && event.keyCode === 16) {
      this.activateCtrl = val
      EventBus.$emit('actMultipleCtrl', val)
    }
  }

  created () {
    EventBus.$on('updateMultiPageValue', this.updateValue)
    EventBus.$on('focusTabStrip', () => {
      this.focusPage()
    })
    EventBus.$on('setPage', this.setPageId)
    EventBus.$on('conSelMouseDown', this.selPageDown)
    EventBus.$on('getPageHeightWidth', this.getPageHeightWidth)
  }
  getPageHeightWidth (callback: Function) {
    callback(parseInt(this.styleContentObj.height!), parseInt(this.styleContentObj.width!))
  }
  selPageDown (event: MouseEvent, control: string) {
    if (control === this.controlId) {
      Vue.nextTick(() => {
        this.pageMouseDown(event)
      })
    }
  }
  setPageId (controlId: string) {
    if (controlId === this.controlId) {
      this.selectControl({
        userFormId: this.userFormId,
        select: {
          container: this.getContainerList(this.selectedPageID),
          selected: [this.selectedPageID]
        }
      })
    }
  }
  destroyed () {
    EventBus.$off('updateMultiPageValue')
    EventBus.$off('focusTabStrip')
  }
  updateValue () {
    {
      const container = this.selectedControls[this.userFormId].container
      if (container[0] === this.controlId) {
        const userData = this.userformData[this.userFormId]
        let selectedPage = -1
        if (this.controls.length > 0) {
          selectedPage = this.controls.findIndex(
            (val) => this.properties.Value === userData[val].properties.Index
          )
        }
        if (this.data.controls.length > 0 && selectedPage !== -1) {
          this.selectedPageID = this.controls[selectedPage]
          this.changeSelect(this.controls[selectedPage])
        } else {
          this.changeSelect(this.controlId)
        }
      }
    }
  }
  deleteMultiPageControl (event: KeyboardEvent) {
    const userData = this.userformData[this.userFormId]
    if (
      this.selectedPageID &&
      this.userformData[this.userFormId][this.selectedPageID].controls.length <=
        0
    ) {
      event.stopPropagation()
      this.deleteItem(event)
    }
  }
  @Watch('controls.length')
  tabsLength (newVal: number, oldVal: number) {
    Vue.nextTick(() => {
      if (this.scrolling) {
        const scrollRef = this.scrolling
        let sum = 0
        if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
          if (this.scrolling.scrollWidth > this.scrolling.clientWidth) {
            if (newVal > oldVal) {
              if (!this.isScrollVisible) {
                this.isScrollVisible = true
              }
              Vue.nextTick(() => {
                if (this.scrolling) {
                  if (this.scrolling.scrollWidth > this.scrolling.clientWidth) {
                    this.scrolling.style.width = (this.properties.Width! - 42) + 'px'
                  } else {
                    this.scrolling.style.width = (this.properties.Width!) + 'px'
                  }
                  if (this.isScrollVisible) {
                    this.scrolling.scrollLeft = this.scrolling.scrollWidth
                  } else {
                    this.scrolling.scrollLeft = 0
                  }
                  for (let index = 0; index < scrollRef.children.length; index++) {
                    const singleTab = scrollRef.children[index] as HTMLDivElement
                    sum += singleTab.offsetWidth
                    if (sum > scrollRef.scrollLeft) {
                      this.tabsIndex = index
                      break
                    }
                  }
                  this.rightmove()
                  if (this.isScrollVisible) {
                    this.scrolling.scrollLeft = this.scrolling.scrollWidth
                  } else {
                    this.scrolling.scrollLeft = 0
                    this.scrolling.style.width = (this.properties.Width!) + 'px'
                  }
                }
              })
            } else {
              Vue.nextTick(() => {
                if (this.scrolling) {
                  if (this.scrolling.scrollWidth > this.scrolling.clientWidth) {
                    this.scrolling.style.width = (this.properties.Width! - 42) + 'px'
                  } else {
                    this.scrolling.style.width = (this.properties.Width!) + 'px'
                  }
                  if (this.isScrollVisible) {
                    this.scrolling.scrollLeft = this.scrolling.scrollWidth
                  } else {
                    this.scrolling.scrollLeft = 0
                  }
                  for (let index = 0; index < scrollRef.children.length; index++) {
                    const singleTab = scrollRef.children[index] as HTMLDivElement
                    sum += singleTab.offsetWidth
                    if (sum > scrollRef.scrollLeft) {
                      this.tabsIndex = index
                      break
                    }
                  }
                  this.rightmove()
                  if (this.isScrollVisible) {
                    this.scrolling.scrollLeft = this.scrolling.scrollWidth
                  } else {
                    this.scrolling.scrollLeft = 0
                    this.scrolling.style.width = (this.properties.Width!) + 'px'
                  }
                }
              })
            }
          }
        } else {
          if (this.scrolling.scrollHeight > this.scrolling.clientHeight) {
            if (newVal > oldVal) {
              if (!this.isScrollVisible) {
                this.isScrollVisible = true
              }
              Vue.nextTick(() => {
                if (this.scrolling) {
                  if (this.scrolling.scrollHeight > this.scrolling.clientHeight) {
                    this.scrolling.style.height = (this.properties.Height! - 48) + 'px'
                  } else {
                    this.scrolling.style.height = (this.properties.Height!) + 'px'
                  }
                  if (this.isScrollVisible) {
                    this.scrolling.scrollTop = this.scrolling.scrollHeight
                  } else {
                    this.scrolling.scrollTop = 0
                  }
                  for (let index = 0; index < scrollRef.children.length; index++) {
                    const singleTab = scrollRef.children[index] as HTMLDivElement
                    sum += singleTab.offsetHeight
                    if (sum > scrollRef.scrollTop) {
                      this.tabsIndex = index
                      break
                    }
                  }
                  this.rightmove()
                  if (this.isScrollVisible) {
                    this.scrolling.scrollTop = this.scrolling.scrollHeight
                  } else {
                    this.scrolling.scrollTop = 0
                    this.scrolling.style.height = (this.properties.Height!) + 'px'
                  }
                }
              })
            } else {
              Vue.nextTick(() => {
                if (this.scrolling) {
                  if (this.scrolling.scrollHeight > this.scrolling.clientHeight) {
                    this.scrolling.style.height = (this.properties.Height! - 48) + 'px'
                  } else {
                    this.scrolling.style.height = (this.properties.Height!) + 'px'
                  }
                  if (this.isScrollVisible) {
                    this.scrolling.scrollTop = this.scrolling.scrollHeight
                  } else {
                    this.scrolling.scrollTop = 0
                  }
                  for (let index = 0; index < scrollRef.children.length; index++) {
                    const singleTab = scrollRef.children[index] as HTMLDivElement
                    sum += singleTab.offsetHeight
                    if (sum > scrollRef.scrollTop) {
                      this.tabsIndex = index
                      break
                    }
                  }
                  this.rightmove()
                  if (this.isScrollVisible) {
                    this.scrolling.scrollTop = this.scrolling.scrollHeight
                  } else {
                    this.scrolling.scrollTop = 0
                    this.scrolling.style.height = (this.properties.Height!) + 'px'
                  }
                }
              })
            }
          }
        }
      }
    })
  }
  @Watch('properties.Value')
  valueValidate () {
    this.pageValueIndex = { indexValue: parseInt(this.properties.Value!.toString()), pageValue: this.controls[parseInt(this.properties.Value!.toString())] }
    this.focusPage()
    this.updateMultiRowforLeftAndRight()
    let sum = 0
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
        this.updateTabsWidth()
      })
    }
    Vue.nextTick(() => {
      this.updateTabsWidthForValue()
      this.focusPage()
    })
  }
  updateTabsWidthForValue () {
    Vue.nextTick(() => {
      if (this.isScrollVisible && this.scrolling && this.scrolling.children) {
        if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
          let lastVisibleTab = 0
          let sum = 0
          let newSum = 0
          let verifySum = 0
          for (let i = 0; i < this.scrolling.children.length; i++) {
            const child = this.scrolling.children[i] as HTMLDivElement
            sum = sum + child.offsetWidth
            if (sum > Math.ceil(this.scrolling.scrollLeft)) {
              this.tabsIndex = i
              let tempSum = 0
              const scrollRef = this.scrolling
              for (let i = 0; i < this.tabsIndex; i++) {
                const element = scrollRef.children[i] as HTMLDivElement
                tempSum += element.offsetWidth
              }
              if ((scrollRef.scrollWidth - scrollRef.clientWidth - 2) <= scrollRef.scrollLeft && scrollRef.scrollLeft < tempSum) {
                scrollRef.style.width = (scrollRef.clientWidth - (tempSum - scrollRef.scrollLeft)) + 'px'
              }
              scrollRef.scrollLeft = tempSum
              break
            }
          }
          if (this.scrolling.scrollWidth > this.scrolling.clientWidth) {
            this.scrolling.style.width = (this.properties.Width! - 42) + 'px'
          } else {
            this.scrolling.style.width = (this.properties.Width!) + 'px'
          }
          if ((this.properties.Value! as number) === (this.scrolling.children.length - 1)) {
            const a = this.scrolling.children[this.scrolling.children.length - 1] as HTMLDivElement
            if (a) {
              let finalTabSum = 0
              if (a.offsetWidth > this.properties.Width! - 42) {
                for (let m = 0; m < this.scrolling.children.length - 1; m++) {
                  const child = this.scrolling.children[m] as HTMLDivElement
                  finalTabSum += child.offsetWidth
                }
                this.scrolling.scrollLeft = finalTabSum
              } else {
                this.rightmove()
                this.rightmove()
              }
            }
          } else if ((this.properties.Value! as number) === 0) {
            this.scrolling.scrollLeft = 0
          } else {
            let singleValueSum = 0
            const valueWidth = this.scrolling.children[this.properties.Value! as number] as HTMLDivElement
            if (valueWidth.offsetWidth >= (this.properties.Width! - 42)) {
              for (let m = 0; m < (this.properties.Value as number); m++) {
                const child = this.scrolling.children[m] as HTMLDivElement
                this.tabsIndex = this.properties.Value as number
                singleValueSum += child.offsetWidth
              }
              this.scrolling.scrollLeft = singleValueSum
            } else {
              for (let x = this.tabsIndex; x < this.scrolling.children.length; x++) {
                newSum = 0
                for (let j = this.tabsIndex; j < ((this.properties.Value! as number) + 1); j++) {
                  const child = this.scrolling.children[j] as HTMLDivElement
                  newSum = newSum + child.offsetWidth
                  if (newSum > (this.properties.Width! - 42)) {
                    lastVisibleTab = j - 1
                    this.rightmove()
                  }
                }
              }
            }
          }
        } else {
          let lastVisibleTab = 0
          let sum = 0
          let newSum = 0
          let verifySum = 0
          for (let i = 0; i < this.scrolling.children.length; i++) {
            const child = this.scrolling.children[i] as HTMLDivElement
            sum = sum + child.offsetHeight
            if (sum > Math.ceil(this.scrolling.scrollTop)) {
              this.tabsIndex = i
              let tempSum = 0
              const scrollRef = this.scrolling
              for (let i = 0; i < this.tabsIndex; i++) {
                const element = scrollRef.children[i] as HTMLDivElement
                tempSum += element.offsetHeight
              }
              if ((scrollRef.scrollHeight - scrollRef.clientHeight - 2) <= scrollRef.scrollTop && scrollRef.scrollTop < tempSum) {
                scrollRef.style.height = (scrollRef.clientHeight - (tempSum - scrollRef.scrollTop)) + 'px'
              }
              scrollRef.scrollTop = tempSum
              break
            }
          }
          if (this.scrolling.scrollHeight > this.scrolling.clientHeight) {
            this.scrolling.style.height = (this.properties.Height! - 48) + 'px'
          } else {
            this.scrolling.style.height = (this.properties.Height!) + 'px'
          }
          if ((this.properties.Value! as number) === (this.scrolling.children.length - 1)) {
            const a = this.scrolling.children[this.scrolling.children.length - 1] as HTMLDivElement
            if (a) {
              let finalTabSum = 0
              if (a.offsetHeight > this.properties.Height! - 42) {
                for (let m = 0; m < this.scrolling.children.length - 1; m++) {
                  const child = this.scrolling.children[m] as HTMLDivElement
                  finalTabSum += child.offsetHeight
                }
                this.scrolling.scrollTop = finalTabSum
              } else {
                this.rightmove()
                this.rightmove()
              }
            }
          } else if ((this.properties.Value! as number) === 0) {
            this.scrolling.scrollTop = 0
          } else {
            let singleValueSum = 0
            const valueHeight = this.scrolling.children[this.properties.Value! as number] as HTMLDivElement
            if (valueHeight.offsetHeight >= (this.properties.Height! - 48)) {
              for (let m = 0; m < (this.properties.Value as number); m++) {
                const child = this.scrolling.children[m] as HTMLDivElement
                this.tabsIndex = this.properties.Value as number
                singleValueSum += child.offsetHeight
              }
              this.scrolling.scrollTop = singleValueSum
            } else {
              for (let x = this.tabsIndex; x < this.scrolling.children.length; x++) {
                newSum = 0
                for (let j = this.tabsIndex; j < ((this.properties.Value! as number) + 1); j++) {
                  const child = this.scrolling.children[j] as HTMLDivElement
                  newSum = newSum + child.offsetHeight
                  if (newSum > (this.properties.Height! - 48)) {
                    lastVisibleTab = j - 1
                    this.rightmove()
                  }
                }
              }
            }
          }
        }
      }
      this.focusPage()
    })
  }
  addContainerControl (event: MouseEvent) {
    if (!this.isEditMode) {
      // this.selectedItem(event)
    } else {
      this.addControlObj(event, this.selectedPageID)
    }
  }
  pageMouseDown (event: MouseEvent) {
    if (this.containerRef.isPropChanged) {
      this.containerRef.mouseDownEvent = event
      this.containerRef.isControlMouseDown = true
      this.containerRef.mouseDownContainer = this.controlId
    }
    if (this.containerRef.isPropChanged !== true) {
      let editMode: boolean = this.isEditMode
      if (this.selectedPageID) {
        EventBus.$emit('getDragSelectorEdit', event, this.selectedPageID, (editmode: boolean) => {
          editMode = editmode
        })
      }
      if (editMode) {
        event.stopPropagation()
        this.setEditMode(editMode)
        this.updatedValue = this.pageValueIndex.indexValue
        this.selectedPageID = this.pageValueIndex.pageValue
        this.updateDataModel({ propertyName: 'Value', value: this.pageValueIndex.indexValue })
        this.selectControl({
          userFormId: this.userFormId,
          select: {
            container: this.getContainerList(this.selectedPageID),
            selected: [this.selectedPageID]
          }
        })
        this.focusPage()
      }
    }
  }
  get getPicture () {
    if (this.selectedPageData) {
      return `url(${this.selectedPageData.properties!.Picture!})`
    }
  }
  mouseUpOnPage () {
    EventBus.$emit('mouseUpOnPageTab', true)
  }
  isMouseDownPageTab (value: selectedTab) {
    this.pageValueIndex = value
  }
}
</script>

<style scoped>
.outer-page {
  background-color: rgb(238, 238, 238);
  overflow-y: hidden;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 0px;
  height: 0px;
  left: 0px;
  top: 0px;
  cursor: default;
  position: sticky;
}
.pages {
  margin: 0;
  white-space: nowrap;
  overflow-x: hidden;
  overflow-y: hidden;
}
.left-button {
  outline: none;
  background-image: url("../../../../assets/left-arrow-img.png");
  background-size: 30%;
  background-position: center;
  background-repeat: no-repeat;
  border-width: 2px;
  border-right-color: lightgray;
  border-bottom-color: lightgray;
  border-top-color: white;
  border-left-color: white;
  top: 3px;
  right: 15px;
  width: 22px;
  height: 18px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: 5;
}
.right-button {
  outline: none;
  background-image: url("../../../../assets/right-arrow-img.png");
  background-size: 30%;
  background-position: center;
  background-repeat: no-repeat;
  border-width: 2px;
  border-right-color: lightgray;
  border-bottom-color: lightgray;
  border-top-color: white;
  border-left-color: white;
  top: 3px;
  right: 15px;
  width: 22px;
  height: 18px;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: 5;
}
.move {
  display: grid;
}
.page {
  vertical-align: top;
  z-index: 1;
  overflow: hidden;
}
.scroll-page {
  z-index: 2;
}
.page label {
  border: 0.1px solid white;
  background-color: rgb(238, 238, 238);
  padding: 5px 5px 5px 5px;
  margin: 0;
  cursor: pointer;
  position: relative;
  top: 0px;
}
.page [type="radio"] {
  display: none;
}
::-webkit-scrollbar.move {
  display: none;
  width: 0;
  height: 1em;
  background-color: rgb(238, 238, 238);
}
::-webkit-scrollbar.content {
  width: 0;
  height: 1em;
  background-color: rgb(238, 238, 238);
}

::-webkit-scrollbar-button {
  background: rgb(238, 238, 238);
  height: 20px;
  border: 1px solid lightgray;
  border-right-color: gray;
  border-bottom-color: gray;
}

/* Up */
::-webkit-scrollbar-button:single-button:horizontal:decrement {
  background-image: url("../../../../assets/triangle-up-img.png");
  transform: rotate(90deg);
  background-size: 10px;
  background-position: center;
  background-repeat: no-repeat;
}

/* Down */
::-webkit-scrollbar-button:single-button:horizontal:increment {
  background-image: url("../../../../assets/triangle-down-img.png");
  background-size: 10px;
  background-position: center;
  background-repeat: no-repeat;
}

::-webkit-scrollbar-track-piece {
  width: 0px;
}

::-webkit-scrollbar-thumb {
  background-color: darkgrey;
  outline: 1px solid slategrey;
  height: 5px;
}

.page .content {
  position: absolute;
  white-space: normal;
  top: 23px;
  left: 0px;
  background-color: white;
  background-size: 9px 10px;
  background-image: radial-gradient(
    circle,
    rgb(0, 0, 0) 0.5px,
    rgba(0, 0, 0, 0) 0.2px
  );
  height: 100px;
  right: 0;
  bottom: 0;
  padding: 20px;
  padding-right: 10px;
  width: calc(100% - 35px);
  height: calc(100% - 89px);
  border: 0.1px solid white;
  box-shadow: 2px 1px gray;
}

.page [type="radio"]:checked ~ label ~ .content {
  z-index: 1;
}
.content {
  overflow: hidden;
}
.spanClass {
  text-decoration: underline;
  text-underline-position: under;
}
:focus {
  outline: none;
}
</style>
