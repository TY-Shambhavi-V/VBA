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
     isMultiple!: boolean
     previous: number[] = []
     prev!: number
     ctrlFlag: boolean = false
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
       if (!this.ctrlFlag) {
         for (let index of currentIndex) {
           const temp = this.tabOrderList[bIndex]
           this.tabOrderList[bIndex] = this.tabOrderList[index]
           this.tabOrderList[index] = temp
           bIndex++
         }
       } else {
         for (let index of currentIndex) {
           bIndex = index - 1
           const temp = this.tabOrderList[bIndex]
           this.tabOrderList[bIndex] = this.tabOrderList[index]
           this.tabOrderList[index] = temp
         }
       }
     }
     protected swapTabOrderListOnDown (currentIndex: number[], bIndex: number) {
       if (!this.ctrlFlag) {
         for (let index of currentIndex) {
           const temp = this.tabOrderList[bIndex]
           this.tabOrderList[bIndex] = this.tabOrderList[index]
           this.tabOrderList[index] = temp
         }
       } else {
         currentIndex.forEach((val, index) => {
           if (currentIndex[index] === currentIndex[index + 1] - 1 || currentIndex[index] === currentIndex[index - 1] + 1) {
             bIndex = currentIndex[currentIndex.length - 1] + 1
             const temp = this.tabOrderList[bIndex]
             this.tabOrderList[bIndex] = this.tabOrderList[val]
             this.tabOrderList[val] = temp
           } else {
             if (currentIndex.includes(val)) {
               bIndex = val + 1
               const temp = this.tabOrderList[bIndex]
               this.tabOrderList[bIndex] = this.tabOrderList[val]
               this.tabOrderList[val] = temp
             }
           }
         })
       }
     }
     protected moveControlUp () {
       let currentIndex = this.currentIndex.sort((a, b) => { return (a - b) })
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
         if (this.ctrlFlag) {
           this.previous = this.currentIndex
         }
         this.isMultiple = false
       }
     }

     protected moveControlDown () {
       debugger
       const lastIndex = this.tabOrderList.length - 1
       const currentIndex = this.currentIndex.sort((a, b) => { return (b - a) })
       let count = 0
       if (currentIndex[0] !== lastIndex) {
         if (!this.ctrlFlag) {
           this.swapTabOrderListOnDown(currentIndex.sort(), currentIndex[currentIndex.length - 1] + 1)
         } else {
           this.swapTabOrderListOnDown(currentIndex, currentIndex[currentIndex.length - 1] + 1)
         }
         for (let index of currentIndex) {
           count = count + 1
           if (count >= 2) {
             this.isMultiple = true
           }
           this.selectedTab(index + 1)
         }
         if (this.ctrlFlag) {
           this.previous = this.currentIndex
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
       this.currentIndex = []
       this.isTabOrderOpen = false
     }
     get tabOrderStyleObj () {
       return {
         visibility: this.isTabOrderOpen === true ? 'visible' : 'hidden',
         opacity: this.isTabOrderOpen === true ? '1' : '0'
       }
     }
     protected selectOnShiftAndCtrl (data: number, e: KeyboardEvent | MouseEvent) {
       if (e.shiftKey && e.which === 1) {
         this.isMultiple = true
         this.currentIndex = [...this.previous, data]
         if (this.prev === undefined) {
           this.selectEle(data)
         } else if (this.prev < data) {
           if (this.ctrlFlag && data > this.currentIndex.sort()[0]) {
             this.prev = this.currentIndex[0]
           }
           if (this.ctrlFlag && data > this.currentIndex.sort()[0] && data < this.currentIndex.sort().reverse()[0]) {
             this.prev = this.currentIndex.sort().reverse()[0]
           }
           this.ctrlFlag = false
           this.currentIndex = []
           if (this.prev < data) {
             for (let i = this.prev; i <= data; i++) {
               this.selectEle(i)
             }
           } else {
             for (let i = this.prev; i >= data; i--) {
               this.selectEle(i)
             }
           }
         } else {
           if (this.ctrlFlag && data < this.currentIndex.sort()[0]) {
             this.prev = this.currentIndex.sort().reverse()[0]
           }
           if (this.ctrlFlag && data > this.currentIndex.sort()[0] && data < this.currentIndex.sort().reverse()[0]) {
             this.prev = this.currentIndex.sort()[0]
           }
           this.ctrlFlag = false
           this.currentIndex = []
           if (this.prev > data) {
             for (let i = this.prev; i >= data; i--) {
               this.selectEle(i)
             }
           } else {
             for (let i = this.prev; i <= data; i++) {
               this.selectEle(i)
             }
           }
         }
         this.isMultiple = false
       }
       if (e.ctrlKey && e.which === 1) {
         this.isMultiple = true
         this.currentIndex = [...this.previous, data]
         if (this.count(this.currentIndex, data) % 2 === 0) {
           this.currentIndex = this.currentIndex.filter(ele => ele !== data)
         }
         for (let i = 0; i < this.currentIndex.length; i++) {
           this.selectEle(this.currentIndex[i])
         }
         this.ctrlFlag = true
         this.isMultiple = false
       }
       this.prev = this.currentIndex[0]
       this.previous = [...this.currentIndex]
     }
     protected selectEle (data: number) {
       if (this.isMultiple) {
         if (!this.currentIndex.includes(data)) {
           this.currentIndex = [...this.currentIndex, data]
         }
       } else {
         this.currentIndex = [data]
       }
     }
     protected count (arr: number[], key: number) {
       let num = 1
       for (let i = 0; i < arr.length - 1; i++) {
         if (key === arr[i]) {
           num++
         }
       }
       return num
     }
}
