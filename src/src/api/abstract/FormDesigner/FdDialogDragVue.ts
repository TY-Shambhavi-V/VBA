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
     isMultiple:boolean
     isClick: boolean = false
     previous: number[] = []
     prevCtrl: number[] = []
     prev: number
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
         let istrue = this.currentIndex.includes(data)
         this.currentIndex = [...this.currentIndex, data]
         if (istrue && this.currentIndex.length > 2) {
           this.currentIndex = this.currentIndex.slice(0, this.currentIndex.length - 2)
         }
       } else {
         this.currentIndex = [data]
       }
       this.previous = [...this.previous, this.currentIndex[0]]
       if (!this.prevCtrl.includes(this.currentIndex[0])) {
         this.prevCtrl.push(this.currentIndex[0])
       }
       this.isClick = true
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
     protected selectedItem (data : number, e:KeyboardEvent) {
       const currentIndex = this.currentIndex
       if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
         const index = currentIndex.length - 1
         if (currentIndex[index] !== 0) {
           this.isMultiple = true
           this.selectedTab(currentIndex[index] - 1)
         }
         this.isMultiple = false
       }
       if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
         const lastIndex = this.tabOrderList.length - 1
         const index = currentIndex.length - 1
         if (currentIndex[currentIndex.length - 1] !== lastIndex) {
           this.isMultiple = true
           this.selectedTab(currentIndex[index] + 1)
         }
         this.isMultiple = false
       }
       if (!e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
         const index = currentIndex.length - 1
         if (currentIndex[index] !== 0) {
           this.selectedTab(currentIndex[index] - 1)
         } else {
           this.selectedTab(currentIndex[index])
         }
       }
       if (!e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
         const lastIndex = this.tabOrderList.length - 1
         const index = this.currentIndex.length - 1
         if (currentIndex[currentIndex.length - 1] !== lastIndex) {
           this.selectedTab(currentIndex[index] + 1)
         } else {
           this.selectedTab(currentIndex[index])
         }
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
     protected test (data: number, e: KeyboardEvent | MouseEvent) {
       if (e.shiftKey && e.which === 1) {
         this.isMultiple = true
         console.log('start', this.currentIndex)
         console.log('prev', this.prevCtrl)
         for (let i = this.prev; i < this.currentIndex[0]; i++) {
           this.selectedTab(i)
         }
         console.log('end', this.currentIndex)
         this.isMultiple = false
       }
       if (e.ctrlKey && e.which === 1) {
         if (!this.currentIndex.includes(data)) {
           this.currentIndex.push(data)
         } else {
           this.currentIndex = this.currentIndex.filter(item => item !== data)
         }
         this.isMultiple = true
         for (let i = 0; i < this.prevCtrl.length - 1; i++) {
           this.selectedTab(this.prevCtrl[i])
         }
         this.isMultiple = false
       }
       this.isClick = false
       this.prev = this.currentIndex[0]
       this.prevCtrl = [...this.currentIndex]
     }
}
