import { Vue, Component } from 'vue-property-decorator'
export interface localTabOrderItem {
    controlId: string;
    name: string;
  }
@Component({
  name: 'FdDialogDragVue'
})
export default class FdDialogDragVue extends Vue {
    protected positions: IMousePosition = {
      clientX: 0,
      clientY: 0,
      movementX: 0,
      movementY: 0
    };
     protected tabOrderDialogInitialStyle: ITabOrderDialogInitialStyle = {
       left: '0px',
       top: '50px'
     };
     isTabOrderOpen: boolean = false
     currentIndex: number[] = []
     tabOrderList: localTabOrderItem[] | tabsItems[] = []
     isMultiple: boolean
     shiftUp: boolean = false
     shiftDown: boolean = false
     protected dragTabOrderDialog (event: MouseEvent) {
       this.positions.clientX = event.clientX
       this.positions.clientY = event.clientY
       document.onmousemove = this.elementDrag
       document.onmouseup = this.closeDragElement
     }
     protected elementDrag (event: MouseEvent): void {
       event.preventDefault()
       this.positions.movementX = this.positions.clientX - event.clientX
       this.positions.movementY = this.positions.clientY - event.clientY
       this.positions.clientX = event.clientX
       this.positions.clientY = event.clientY
       this.tabOrderDialogInitialStyle.top =
          parseInt(this.tabOrderDialogInitialStyle.top) -
          this.positions.movementY +
          'px'
       this.tabOrderDialogInitialStyle.left =
          parseInt(this.tabOrderDialogInitialStyle.left) -
          this.positions.movementX +
          'px'
     }
     protected closeDragElement (): void {
       document.onmouseup = null
       document.onmousemove = null
     }
     protected selectedTab (data: number) {
       if (this.isMultiple) {
         this.currentIndex = [...this.currentIndex, data]
       } else {
         this.currentIndex = [data]
       }
     }
     protected onDrag (data:number, e:MouseEvent) {
       if (e.which === 1) {
         let istrue = this.currentIndex.includes(data)
         if (this.currentIndex[0] !== data) {
           this.currentIndex = [...this.currentIndex, data]
         } else {
           this.currentIndex = [data]
         }
         if (istrue && this.currentIndex.length > 2) {
           this.currentIndex = this.currentIndex.slice(0, this.currentIndex.length - 2)
         }
       }
     }
     protected selectTabOnKeyDown (value:object, data:number, e:KeyboardEvent) {
       if (e.shiftKey && e.key === 'ArrowUp') {
         let count = 0
         if (!this.shiftDown) {
           this.currentIndex = [...this.currentIndex, this.currentIndex[0] - 1]
         } else {
           if (this.currentIndex.length > 1) {
             this.currentIndex.pop()
           } else {
             this.currentIndex.push(this.currentIndex[0] - 1)
             this.shiftDown = false
           }
         }
         this.selectItem(count)
         this.shiftUp = true
       }
       if (e.shiftKey && e.key === 'ArrowDown') {
         let count = 0
         if (!this.shiftUp) {
           this.currentIndex.reverse()
           this.currentIndex = [...this.currentIndex, this.currentIndex[0] + 1]
         } else {
           this.currentIndex.reverse()
           if (this.currentIndex.length > 1) {
             this.currentIndex.pop()
           } else {
             this.currentIndex.push(this.currentIndex[0] + 1)
             this.shiftUp = false
           }
         }
         this.selectItem(count)
         this.shiftDown = true
       }
       if (!e.shiftKey && e.key === 'ArrowUp') {
         if (this.currentIndex[0] !== 0 && this.currentIndex[0] > 0) {
           this.selectedTab(this.currentIndex[0] - 1)
         } else {
           this.selectedTab(this.currentIndex[0])
         }
       }
       if (!e.shiftKey && e.key === 'ArrowDown') {
         if (this.currentIndex[0] !== this.tabOrderList.length - 1) {
           this.selectedTab(this.currentIndex[0] + 1)
         } else {
           this.selectedTab(this.currentIndex[0])
         }
       }
     }
     protected selectItem (count: number) {
       this.currentIndex.sort()
       for (let index of this.currentIndex) {
         count = count + 1
         if (count >= 2) {
           this.isMultiple = true
         }
         this.selectedTab(index)
       }
       this.isMultiple = false
     }
     protected swapTabOrderList (currentIndex: number[], bIndex: number) {
       for (let index of currentIndex) {
         const temp = this.tabOrderList[bIndex]
         this.tabOrderList[bIndex] = this.tabOrderList[index]
         this.tabOrderList[index] = temp
         bIndex++
       }
     }
     protected swapTabOrderListOnDown (currentIndex: number[], bIndex: number) {
       for (let index of currentIndex) {
         const temp = this.tabOrderList[bIndex]
         this.tabOrderList[bIndex] = this.tabOrderList[index]
         this.tabOrderList[index] = temp
       }
     }
     protected moveControlUp () {
       let currentIndex = this.currentIndex.sort()
       let count = 0
       if (currentIndex[0] !== 0) {
         this.swapTabOrderList(currentIndex, currentIndex[0] - 1)
         for (let index of currentIndex) {
           count = count + 1
           if (count >= 2) {
             this.isMultiple = true
           }
           this.selectedTab(index - 1)
         }
         this.isMultiple = false
       }
     }

     protected moveControlDown () {
       const lastIndex = this.tabOrderList.length - 1
       const currentIndex = this.currentIndex.sort()
       let count = 0
       if (currentIndex[currentIndex.length - 1] !== lastIndex) {
         this.swapTabOrderListOnDown(currentIndex, currentIndex[currentIndex.length - 1] + 1)
         for (let index of currentIndex) {
           count = count + 1
           if (count >= 2) {
             this.isMultiple = true
           }
           this.selectedTab(index + 1)
         }
         this.isMultiple = false
       }
     }
     protected closeDialog () {
       this.isTabOrderOpen = false
     }
     get tabOrderStyleObj () {
       return {
         visibility: this.isTabOrderOpen === true ? 'visible' : 'hidden',
         opacity: this.isTabOrderOpen === true ? '1' : '0'
       }
     }
}
