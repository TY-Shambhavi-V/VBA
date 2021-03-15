<template>
  <div>
    <div
      v-on="eventStoppers()"
      class="outer-page"
      :style="pageStyleObj"
      @mouseover="updateMouseCursor"
      @contextmenu="contextMenuVisible($event, -1)"
      @click="tabStripClick"
      @mousedown="controlEditMode"
      @keydown.enter="setContentEditable($event, true)"
      @keydown.esc="setContentEditable($event, false)"
      @keydown.delete="deleteTabControl($event)"
      :tabindex="properties.TabIndex"
      :title="properties.ControlTipText"
    >
      <div
        class="pages"
        :style="styleTabsObj"
        @mouseover="updateMouseCursor"
        :title="properties.ControlTipText"
      >
        <div class="move" ref="scrolling" :style="styleMoveObj">
          <div
            ref="controlTabsRef"
            class="page"
            v-for="(value, key) in extraDatas.Tabs"
            :key="key"
            :style="getTabStyle"
            @mouseover="updateMouseCursor"
          >
            <FDControlTabs
              @setValue="setValue"
              :tempWidth="tempWidth"
              @isChecked="isChecked"
              :getMouseCursorData="getMouseCursorData"
              :setFontStyle="setFontStyle"
              :data="data"
              @tempStretch="tempStretch"
              :pageValue="value"
              :indexValue="key"
              :controlCursor="controlCursor"
              :pageData="value"
              :isRunMode="isRunMode"
              :isEditMode="isEditMode"
              :isItalic="isItalic"
              :tempStretch="tempStretch"
              :tempWeight="tempWeight"
              @deleteMultiPageControl="
                (event) => {
                  deleteTabControl(event);
                }
              "
            />
            <div
              class="content"
              :style="styleContentObj"
              @mouseover="updateMouseCursor"
              :title="properties.ControlTipText"
            ></div>
          </div>
        </div>
        <div></div>
        <div :style="getScrollButtonStyleObj" ref="buttonStyleRef">
          <button
            class="left-button"
            :style="scrollButtonStyle"
            @mouseover="updateMouseCursor"
            @click="leftmove"
          ></button>
          <button
            class="right-button"
            :style="scrollButtonStyle"
            @mouseover="updateMouseCursor"
            @click="rightmove"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Watch } from 'vue-property-decorator'
import FdControlVue from '@/api/abstract/FormDesigner/FdControlVue'
import { State, Action } from 'vuex-class'
import ContextMenu from '../FDContextMenu/index.vue'
import { tabsContextMenu } from '../../../models/tabsContextMenu'
import FDControlTabs from '@/FormDesigner/components/atoms/FDControlTabs/index.vue'
import Vue from 'vue'
import { EventBus } from '@/FormDesigner/event-bus'

@Component({
  name: 'FDTabStrip',
  components: {
    ContextMenu,
    FDControlTabs
  }
})
export default class FDTabStrip extends FdControlVue {
  @State((state) => state.fd.userformData) userformData!: userformData;
  @Prop() isEditMode: boolean;
  @Prop({ required: true, type: String }) public userFormId!: string;
  @Ref('tabstripContextMenu') tabstripContextMenu: HTMLDivElement;
  @Ref('scrolling') scrolling: HTMLDivElement;
  @Ref('controlTabsRef') controlTabsRef: HTMLDivElement[];
  @Ref('buttonStyleRef') buttonStyleRef: HTMLDivElement;
  $el: HTMLDivElement;

  // isScroll = true;
  scrollButtonHeight: number = 0
  scrollButtonWidth: number = 0
  viewMenu: boolean = false;
  top: string = '0px';
  left: string = '0px';
  contextMenuValue: Array<IcontextMenu> = tabsContextMenu;
  tempScrollWidth: number;
  updatedValue: number = 0;
  tempWidth: number = 0;
  tempHeight: number = 0;
  multiRowCount: number = 1;
  isScrollVisible: boolean = false;
  topValue: number = 0;
  widthValue: number = 40;
  rowsCount: string = '';
  setPosition: string = 'initial';
  isMoveGetterCalled: boolean = false;
  rightClickSelect (value: number) {
    this.updateDataModel({ propertyName: 'Value', value: value })
  }

  contextMenuVisible (e: MouseEvent, selected: number) {
    EventBus.$emit('editModeContextMenu', e, this.controlId, this.data, this.isEditMode, this.updatedValue)
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
   * @description takes the ref of the div and determines the scrollLeft and scrollTop
   * @function leftmove
   *
   */
  leftmove () {
    const scrollRef = this.scrolling
    if (
      this.properties.TabOrientation === 0 ||
      this.properties.TabOrientation === 1
    ) {
      scrollRef.scrollLeft! -= 50
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
      scrollRef.scrollTop! -= 50
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

  /**
   * @description takes the ref of the div and determines the scrollLeft and scrollTop
   * @function rightmove
   *
   */
  rightmove () {
    const scrollRef = this.scrolling
    let tempScrollTop = scrollRef.scrollTop!
    if (
      this.properties.TabOrientation === 0 ||
      this.properties.TabOrientation === 1
    ) {
      scrollRef.scrollLeft! += 50
      if (this.scrolling) {
        const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
        const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
        if (this.scrolling.scrollLeft >= (this.scrolling.scrollWidth - this.scrolling.clientWidth - 1)) {
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
      tempScrollTop += 50
      scrollRef.scrollTop = tempScrollTop
      if (this.scrolling) {
        const rightButton = this.buttonStyleRef.children[1] as HTMLButtonElement
        const leftButton = this.buttonStyleRef.children[0] as HTMLButtonElement
        if (this.scrolling.scrollTop >= (this.scrolling.scrollHeight - this.scrolling.clientHeight - 1)) {
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

  /**
   * @description takes the index Value and pageValue and set the Value property
   * @function isChecked
   *
   */
  isChecked (value: selectedTab) {
    if (this.isActivated) {
      this.updatedValue = value.indexValue
      this.updateDataModel({ propertyName: 'Value', value: value.indexValue })
      this.focusPage()
    }
  }

  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on propControlData
   * @function pageStyleObj
   *
   */
  protected get pageStyleObj (): Partial<CSSStyleDeclaration> {
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
      borderLeft: controlProp.Style === 0 ? '2px solid whitesmoke' : ''
    }
  }

  @Watch('isMoveGetterCalled')
  setPositionInMove () {
    Vue.nextTick(() => {
      if (this.setPosition === 'absolute') {
        this.setPosition = 'initial'
        this.isMoveGetterCalled = false
        if (this.properties.MultiRow) {
          this.updateDataModel({ propertyName: 'MultiRow', value: false })
          this.updateDataModel({ propertyName: 'MultiRow', value: true })
        }
      }
    })
  }
  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on propControlData
   * @function styleMoveObj
   *
   */
  protected get styleMoveObj () {
    if (this.isMoveGetterCalled === false && this.properties.MultiRow && this.setPosition === 'absolute') {
      this.isMoveGetterCalled = true
    }
    const controlProp = this.properties
    const a = ['bottom', 'top']
    let bottomTopStyle = {}
    if (controlProp.TabOrientation === 1) {
      bottomTopStyle = { [a[0]]: '0px' }
    } else if (controlProp.TabOrientation === 0) {
      bottomTopStyle = { [a[1]]: '0px' }
    }
    this.setScrollLeft()
    if (this.scrolling) {
      Vue.nextTick(() => {
        if (this.properties.MultiRow) {
          this.scrolling.scrollLeft = 0
        }
      })
    }
    return {
      ...bottomTopStyle,
      position: this.setPosition,
      direction: (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'rtl' : 'ltr',
      display: controlProp.Style === 2 ? 'none' : (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'grid' : 'inline-block',
      gridAutoFlow: (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'column' : '',
      gridTemplateRows: (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? this.rowsCount : '',
      alignSelf: controlProp.TabOrientation === 1 ? 'flex-end' : '',
      marginTop:
        controlProp.TabOrientation === 1
          ? `${controlProp.Height! - 35}px`
          : '0px',
      whiteSpace: controlProp.MultiRow === true ? 'break-spaces' : 'nowrap',
      height:
        controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3
          ? this.isScrollVisible
            ? `${controlProp.Height! - 48}px`
            : `${controlProp.Height}px`
          : '',
      width:
        controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3
          ? 'fit-content'
          : this.isScrollVisible
            ? `${controlProp.Width! - 45}px`
            : `${controlProp.Width!}px`,
      float: controlProp.TabOrientation === 3 ? 'right' : '',
      overflow: 'hidden',
      gridAutoColumns: (controlProp.MultiRow && controlProp.TabOrientation === 2) || (controlProp.MultiRow && controlProp.TabOrientation === 3) ? 'max-content' : ''
    }
  }

  /**
   * @description style object is passed to :style attribute in button tags
   * dynamically changing the styles of the component based on propControlData
   * @function getScrollButtonStyleObj
   *
   */
  protected get getScrollButtonStyleObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    const tabsLength =
      this.properties.TabFixedWidth! > 0
        ? this.extraDatas.Tabs!.length * this.properties.TabFixedWidth! +
          10 * this.extraDatas.Tabs!.length
        : this.properties.Font!.FontSize! < 36
          ? this.properties.Font!.FontSize! * 3.5 * this.extraDatas.Tabs!.length
          : this.properties.Font!.FontSize! * 2.3 * this.extraDatas.Tabs!.length
    const tabsHeight =
      this.properties.TabFixedHeight! > 0
        ? this.extraDatas.Tabs!.length * this.properties.TabFixedHeight! +
          10 * this.extraDatas.Tabs!.length
        : this.properties.Font!.FontSize! * 2.3 * this.extraDatas.Tabs!.length
    this.updateDataModel({ propertyName: 'Width', value: this.properties.Width! + 1 })
    this.updateDataModel({ propertyName: 'Width', value: this.properties.Width! - 1 })
    return {
      position: 'absolute',
      zIndex: '30001',
      marginTop:
        controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3
          ? `${controlProp.Height! - (this.scrollButtonWidth)}px`
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
          ? controlProp.TabFixedWidth! > 0 ? '-6px' : '0px'
          : controlProp.TabOrientation === 2
            ? controlProp.TabFixedWidth! > 0 ? `${controlProp.Width! - this.scrollButtonHeight - 14}px` : `${controlProp.Width! - 32}px`
            : '0px',
      top: controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3 ? '-13px' : '0px',
      backgroundColor: 'rgb(238, 238, 238)'
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

  get scrollButtonStyle () {
    const controlProp = this.properties
    return {
      cursor: this.controlCursor,
      opacity: this.scrolling ? ((this.scrolling.scrollLeft === (this.scrolling.scrollWidth - this.scrolling.clientWidth)) ? '0.4' : '1') : '1',
      width: this.setSpinButtonWidth + 'px',
      height: this.setSpinButtonHeight + 'px'
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
      this.setScrollLeft()
      this.scrollDisabledValidate()
      this.updateMultiRowforLeftAndRight()
    })
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
      })
      if (this.properties.MultiRow) {
        this.setPosition = 'absolute'
        this.updateDataModel({ propertyName: 'MultiRow', value: false })
        this.updateDataModel({ propertyName: 'MultiRow', value: true })
        if (this.scrolling) {
          if (this.properties.MultiRow) {
            this.scrolling.scrollLeft = 0
          }
        }
        Vue.nextTick(() => {
          this.updateTabsWidth()
        })
      }
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
      })
    }
  }

  @Watch('properties.Style')
  handleStyleChange () {
    this.updateTabsWidth()
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
      })
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
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on propControlData
   * @function styleTabsObj
   *
   */
  protected get styleTabsObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    return {
      backgroundColor: controlProp.Style === 2 ? 'rgb(238, 238, 238)' : controlProp.BackColor,
      cursor: this.controlCursor,
      display: controlProp.TabOrientation === 1 ? 'flex' : '',
      position: 'absolute',
      width: `${controlProp.Width!}px`,
      height: `${controlProp.Height!}px`,
      boxShadow: controlProp.Style === 0 ? (controlProp.TabOrientation === 0 ? '0px 1px gray' : '') : ''
    }
  }

  /**
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on propControlData
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
   * @description style object is passed to :style attribute in div tag
   * dynamically changing the styles of the component based on propControlData
   * @function styleContentObj
   *
   */
  protected get styleContentObj (): Partial<CSSStyleDeclaration> {
    const controlProp = this.properties
    let a = ''
    if (controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1) {
      a = `${controlProp.Width! - 3}px`
    } else {
      if (controlProp.TabFixedWidth! > 0) {
        if (controlProp.MultiRow) {
          if ((controlProp.Width! > this.widthValue)) {
            a = (controlProp.Width! - this.widthValue) + 'px'
          } else {
            a = '0px'
          }
        } else {
          if (controlProp.TabOrientation === 3) {
            a = (controlProp.Width! - this.widthValue) + 'px'
          } else {
            a = controlProp.Width! - controlProp.TabFixedWidth! - 15 + 'px'
          }
        }
      } else {
        if (controlProp.TabFixedWidth! === 0) {
          if (controlProp.TabOrientation === 2 || controlProp.TabOrientation === 3) {
            if (controlProp.MultiRow) {
              if ((controlProp.Width! > this.widthValue)) {
                a = (controlProp.Width! - this.widthValue) + 'px'
              } else {
                a = '0px'
              }
            } else {
              a = (controlProp.Width! - this.widthValue) + 'px'
            }
          } else {
            a = controlProp.Width! - controlProp.Font!.FontSize! - 20 + 'px'
          }
        } else {
          a = `${controlProp.Width! - 34}px`
        }
      }
    }
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
      })
    }
    return {
      position: 'absolute',
      display:
        controlProp.Style === 1 || controlProp.Style === 2
          ? 'none'
          : controlProp.TabOrientation === 3 ? controlProp.Width! < (this.widthValue + 12) ? 'none' : 'block' : 'block',
      top:
        controlProp.TabOrientation === 0
          ? controlProp.MultiRow
            ? this.topValue + 'px'
            : controlProp.TabFixedHeight! > 0
              ? controlProp.TabFixedHeight! + 10 + 'px'
              : controlProp.TabFixedHeight! === 0
                ? this.tempHeight + 15 + 'px'
                : '33px'
          : controlProp.TabOrientation === 1
            ? controlProp.MultiRow
              ? '-' + (this.topValue - 30) + 'px'
              : controlProp.TabFixedHeight! > 0
                ? '0px'
                : '-6px'
            : '0px',
      height:
        controlProp.TabOrientation === 0 || controlProp.TabOrientation === 1
          ? controlProp.TabFixedHeight! > 0
            ? controlProp.Height! - controlProp.TabFixedHeight! - 5 + 'px'
            : controlProp.TabFixedHeight! === 0
              ? controlProp.Height! - controlProp.Font!.FontSize! - 13 + 'px'
              : controlProp.TabOrientation === 1
                ? `${controlProp.Height! - this.topValue}px`
                : `${controlProp.Height! - 35}px`
          : `${controlProp.Height! - 3}px`,
      width: a,
      left:
        controlProp.TabOrientation === 2
          ? controlProp.MultiRow ? this.widthValue + 'px' : controlProp.TabFixedWidth! > 0
            ? controlProp.TabFixedWidth! + 12 + 'px'
            : controlProp.TabFixedWidth! === 0
              ? controlProp.TabOrientation === 2 ||
              controlProp.TabOrientation === 3
                ? `${this.tempWidth + 10}px`
                : controlProp.Font!.FontSize! + 20 + 'px'
              : '40px'
          : controlProp.TabOrientation === 3
            ? controlProp.TabFixedWidth! > 0
              ? '0px'
              : '0px'
            : '0px',
      cursor: this.controlCursor,
      padding: '0px',
      boxShadow: controlProp.Style === 0 ? (controlProp.TabOrientation === 0 ? '2px 0px gray' : '') : ''
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
  /**
   * @description watches changes in propControlData to set autoset when true
   * @function isScrollUsed
   * @param oldVal previous propControlData data
   * @param newVal  new/changed propControlData data
   */
  @Watch('properties.Width')
  isScrollUsed (newVal: controlData, oldVal: controlData) {
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    this.tempScrollWidth = this.scrolling.offsetWidth!
    if (this.properties.MultiRow) {
      if (this.scrolling) {
        Vue.nextTick(() => {
          this.topValue = this.scrolling.offsetHeight!
          this.widthValue = this.scrolling.clientWidth
          this.updateTabsWidth()
        })
      }
      const initialLength = this.extraDatas.Tabs!.length!
      const len = (this.tempWidth + 12) * initialLength
      if (len - this.properties.Width! >= 0) {
        const a = Math.floor(len / this.properties.Width!) + 1
        this.multiRowCount = a
        if (this.properties.Width! <= (this.tempWidth + 12) * 2) {
          this.multiRowCount = a + 2
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
                              a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 0.5 + 'px'
                              a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 0.5 + 'px'
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
                          a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 0.5 + 'px'
                          a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 0.5 + 'px'
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
            debugger
            if (move.offsetHeight > (moveChild.offsetHeight + 5)) {
              console.log('move.offseHeight', move.offsetHeight)
              console.log('moveChild.offsetHeight', moveChild.offsetHeight)
              let numberOfRows = this.properties.Value !== 0 ? Math.ceil(move.offsetHeight / (moveChild.offsetHeight + 5)) : Math.ceil(move.offsetHeight / moveChild.offsetHeight)
              console.log('nOfRows', numberOfRows)
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
                    console.log('currentTabsWidth', currentTabsWidth)
                    if (rowWidth !== 0) {
                      for (let k = tabIndexValue; k < j; k++) {
                        if (k === (j - 1)) {
                          const extraWidth = (this.properties.Width! - rowWidth) / (j - tabIndexValue)
                          for (let l = tabIndexValue; l <= k; l++) {
                            const a = this.scrolling.children[l].children[0].children[1] as HTMLDivElement
                            a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 0.5 + 'px'
                            a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 0.5 + 'px'
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
                        a.style.paddingLeft = parseInt(a.style.paddingLeft) + (extraWidth / 2) - 0.5 + 'px'
                        a.style.paddingRight = parseInt(a.style.paddingRight) + (extraWidth / 2) - 0.5 + 'px'
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
  @Watch('properties.TabOrientation')
  orientValidate () {
    this.scrollButtonVerify()
    this.scrollDisabledValidate()
    this.updateMultiRowforLeftAndRight()
    this.widthValue = this.scrolling.clientWidth
    if (this.scrolling) {
      Vue.nextTick(() => {
        this.updateTabsWidth()
        this.topValue = this.scrolling.offsetHeight!
        this.widthValue = this.scrolling.clientWidth
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
  mounted () {
    this.$el.focus({
      preventScroll: true
    })
    this.scrollButtonVerify()
    this.tempScrollWidth = this.scrolling.offsetWidth!
    this.calculateWidthHeight()
  }
  /**
   * @description watches changes in FontSize of Font
   * @function checkFontValue
   * @param oldVal previous properties data
   * @param newVal  new/changed properties data
   */
  @Watch('properties.Font.FontSize', { deep: true })
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

  /**
   * @description watches changes in selectedTabData to set the caption
   * @function captionValue
   * @param oldVal previous selectedTabData data
   * @param newVal  new/changed selectedTabData data
   */
  @Watch('selectedTabData.Caption')
  captionValue (newVal: string, oldVal: string) {
    this.setScrollLeft()
    if (newVal === '') {
      this.tempWidth = 30
    }
    this.calculateWidthHeight()
    this.scrollButtonVerify()
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

  get selectedTabData () {
    return this.extraDatas!.Tabs![this.updatedValue]
  }

  setScrollLeft () {
    if (this.scrolling) {
      let totalSiblingWidth = 0
      for (let i = 0; i < this.properties.Value!; i++) {
        const a = this.scrolling.children[i] as HTMLDivElement
        totalSiblingWidth += a.clientWidth
      }
      this.scrolling.scrollLeft = totalSiblingWidth
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
            tempWidth = ele.offsetWidth
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
  @Emit('updateModel')
  updateDataModel (updateData: IupdateDataModel) {
    return updateData
  }
  focusPage () {
    if (this.extraDatas!.Tabs!.length > 0) {
      const value: number = this.updatedValue;
      (this.controlTabsRef[value].children[0]
        .children[1] as HTMLLabelElement).focus()
    } else {
      (this.$el.children[0] as HTMLDivElement).focus()
    }
  }
  closeMenu () {
    this.viewMenu = false
    this.focusPage()
  }
  eventStoppers () {
    const eventStop = (event: Event) => event.stopPropagation()
    return this.isEditMode === false
      ? null
      : {
        keydown: eventStop
      }
  }
  deleteTabControl (event: KeyboardEvent) {
    if (this.isEditMode) {
      event.stopPropagation()
      const tabControlData = JSON.parse(JSON.stringify(this.extraDatas.Tabs))
      if (tabControlData && tabControlData.length > 0) {
        tabControlData.splice(this.updatedValue, 1)
        this.updateDataModelExtraData({
          propertyName: 'Tabs',
          value: tabControlData
        })
        this.updateTabStripValue(this.updatedValue! - 1)
        Vue.nextTick(() => {
          this.focusPage()
        })
      }
    }
  }
  updateTabStripValue (index: number) {
    const userData = this.userformData[this.userFormId]
    const tabs = userData[this.controlId].extraDatas!.Tabs!
    const tabIndex = tabs.findIndex((val, key) => key === index + 1)
    if (tabIndex !== -1) {
      const value = index + 1
      this.updateDataModel({ propertyName: 'Value', value: value })
    } else if (tabIndex === -1 && index !== -1) {
      const value = index
      this.updateDataModel({ propertyName: 'Value', value: value })
    } else {
      this.updateDataModel({ propertyName: 'Value', value: -1 })
    }
  }
  created () {
    EventBus.$on('focusTabStrip', () => {
      this.focusPage()
    })
  }
  destroyed () {
    EventBus.$off('focusTabStrip')
  }
  tabStripClick (event: MouseEvent) {
    if (this.toolBoxSelectControl === 'Select') {
      event.stopPropagation()
    }
  }

  @Watch('tempWidth')
  tempWidthValidate () {
    if (this.tempWidth < 30) {
      this.tempWidth = 30
    }
  }

  @Watch('properties.Value')
  valueValidate () {
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
      if (this.properties.TabOrientation === 0 || this.properties.TabOrientation === 1) {
        for (let i = 0; i < this.properties.Value!; i++) {
          sum += this.controlTabsRef[i].clientWidth
        }
        if (this.properties.Width! - this.scrolling.offsetWidth > sum) {
          this.scrolling.scrollLeft = sum
        } else {
          const valueAsNumber = this.properties.Value! as number
          if (sum > this.controlTabsRef[valueAsNumber].clientWidth) {
            const sL = sum - this.controlTabsRef[valueAsNumber].clientWidth
            this.scrolling.scrollLeft = sL
          } else {
            this.scrolling.scrollLeft = sum
          }
        }
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
        for (let i = 0; i < this.properties.Value!; i++) {
          sum += this.controlTabsRef[i].clientHeight
        }
        if (this.properties.Height! - this.scrolling.offsetHeight > sum) {
          this.scrolling.scrollTop = sum
        } else {
          const valueAsNumber = this.properties.Value! as number
          if (sum > this.controlTabsRef[valueAsNumber].clientHeight) {
            const sL = sum - this.controlTabsRef[valueAsNumber].clientHeight
            this.scrolling.scrollTop = sL
          } else {
            this.scrolling.scrollTop = sum
          }
        }
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
      this.focusPage()
    })
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
  width: 100%;
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
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 1em;
  background-color: rgb(238, 238, 238);
}
::-webkit-scrollbar.move {
  display: none;
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

.page .content {
  position: absolute;
  white-space: normal;
  top: 23px;
  left: 0px;
  background: rgb(238, 238, 238);
  height: 100px;
  z-index: 0 !important;
  right: 0;
  bottom: 0;
  padding: 20px;
  padding-right: 10px;
  width: calc(100% - 35px);
  height: calc(100% - 65px);
  border: 0.1px solid white;
  box-shadow: 2px 1px gray;
}
.forButton {
  margin: 3px;
  border-radius: 3px;
  z-index: 2;
  border: 2px outset;
}
.page [type="radio"]:checked ~ label.forButton {
  margin: 3px;
  border-right: 2px solid gray;
  border-bottom: none;
  border-radius: 3px;
  z-index: 2;
  background-color: gray;
  border: 2px inset;
}
.forTab {
  border-bottom: none;
  border-radius: 3px;
}
.page [type="radio"]:checked ~ label.forTab {
  border-right: 2px solid gray;
  border-bottom: none;
  border-radius: 3px;
  z-index: 2;
}
.forLeft {
  border-bottom: none;
  border-radius: 3px;
}
.page [type="radio"]:checked ~ label.forLeft {
  border-bottom: 2px solid gray;
  border-radius: 3px;
  z-index: 2;
}

.fmTabStyleButton {
  border: 1px inset !important;
}
.fmTabStyleButton [type="radio"]:checked {
  border: 1px outset !important;
  background-color: gray !important;
}
.page [type="radio"]:checked ~ label ~ .content {
  z-index: 1;
}
.content {
  overflow: auto;
}

.spanClass {
  text-decoration: underline;
  text-underline-position: under;
}
:focus {
  outline: none;
}
</style>
