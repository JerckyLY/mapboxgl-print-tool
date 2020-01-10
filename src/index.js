/**
 * @Description: 地图打印类
 * @author liuyang
 * @date 2020/1/7
*/

import BaseEvents from './Event'
const FileSaver = require('file-saver');
const mapboxgl =  require('mapbox-gl')
class mapPrintTool extends BaseEvents {
    constructor (options) {
        super()
        this.options =  Object.assign({},{
            enableImg:true,
            fileName:'map.jpg'
        },options)
        this.printType = -1 // 0 是全局 1是部分 默认是-1
        this.printBox = null
        this.printStart = null
        this.printCurrent = null
        this.bboxCanvas = null
        this._onMouseDown = this._onMouseDown.bind(this)
        this._onMouseMove = this._onMouseMove.bind(this)
        this._onMouseUp = this._onMouseUp.bind(this)
        this.saveAsIMG = this.saveAsIMG.bind(this)
    }

    onAdd (map) {
        this.map = map
        this.printContrainer = map.getContainer()

            //初始化按钮
        this.initPrintToolControl()

        // 全图打印按钮点击事件
        this.fullPrintButton.addEventListener('click', ()=> {
            this.printType = 0
            const canvas = this.map.getCanvas()
            if(this.options.enableImg) {
                this.saveAsIMG(canvas)
            }
            let data = {
                data:canvas.toDataURL()
            }
            this.emit('success',data)
        })

        // 框选打印按钮点击事件
        this.partPrintButton.addEventListener('click', () => {
            this.printType = 1
            this.printCanvas = this.map.getCanvas()
            this.map.boxZoom.disable()
            this.printCanvas.addEventListener('mousedown', this._onMouseDown);

        })


        return this.container
    }


    onRemove () {
        this.container.parentNode.removeChild(this.container)
        this.map = undefined
    }

    /**
     * canvas鼠标按下事件处理
     */
    _onMouseDown (e) {
        // Continue the rest of the function if the shiftkey is pressed.
        if (!(e.shiftKey && e.button === 0)) return;
        // if (!(e.shiftKey && e.button === 0)) return;

        // Disable default drag zooming when the shift key is held down.
        this.map.dragPan.disable();

        // Call functions for the following events
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);

        // Capture the first xy coordinates
        this.printStart = this.mousePos(e);
    }

    /**
     * canvas鼠标移动事件
     * @param e
     */
    _onMouseMove(e) {
        // Capture the ongoing xy coordinates
        this.printCurrent = this.mousePos(e);

        // Append the box element if it doesnt exist
        if (!this.printBox) {
            this.printBox = document.createElement('div');
            this.printBox.classList.add('mapboxgl-boxzoom');
            this.printContrainer.classList.add('mapboxgl-crosshair')
            this.printContrainer.appendChild(this.printBox);
        }

        let minX = Math.min(this.printStart.x, this.printCurrent.x),
            maxX = Math.max(this.printStart.x, this.printCurrent.x),
            minY = Math.min(this.printStart.y, this.printCurrent.y),
            maxY = Math.max(this.printStart.y, this.printCurrent.y);

        // Adjust width and xy position of the box element ongoing
        let pos = 'translate(' + minX + 'px,' + minY + 'px)';
        this.printBox.style.transform = pos;
        this.printBox.style.WebkitTransform = pos;
        this.printBox.style.width = maxX - minX + 'px';
        this.printBox.style.height = maxY - minY + 'px';
    }


    /**
     * canvas鼠标抬起事件
     * @param e
     *
     */
    _onMouseUp(e) {
        // Capture xy coordinates
        this.finish([this.printStart, this.mousePos(e)]);
    }

    /**
     * 返回鼠标最后位置的坐标
     * @param e
     * @returns {mapboxgl.Point}
     */
    mousePos(e) {
        let rect = this.map.getCanvasContainer().getBoundingClientRect();
        return new mapboxgl.Point(
            e.clientX - rect.left - this.map.getCanvasContainer().clientLeft,
            e.clientY - rect.top - this.map.getCanvasContainer().clientTop
        );
    }

    /**
     * 结束绘制
     * @param bbox
     */
    finish (bbox) {
        // Remove these events now that finish has been called.
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);


        if (this.printBox) {
            this.printContrainer.classList.remove('mapboxgl-crosshair')
            this.printBox.parentNode.removeChild(this.printBox);
            this.printBox = null;
        }

        if (bbox) {
            this.bboxPrint(bbox)
        }
        this.map.dragPan.enable()
        this.map.boxZoom.enable()
        this.printCanvas.removeEventListener('mousedown', this._onMouseDown);
    }

    /**
     * 处理裁剪canvas
     * @param bbox
     */
    bboxPrint (bbox) {
        const width = bbox[1].x - bbox[0].x
        const height = bbox[1].y - bbox[0].y
        let oCanvas = document.createElement("canvas");
        oCanvas.width= width;
        oCanvas.height= height;
        // 获取webgl
        const gl =  this.map.getCanvas().getContext('webgl',{preserveDrawingBuffer:true})
        const pixels  = new Uint8Array( width*height*4);
        // 从缓冲区读取像素数据，然后将其装到事先建立好的像素集合里
        gl.readPixels(bbox[0].x, bbox[0].y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        // 基于像素集合和尺寸建立ImageData 对象
        const imageData= new ImageData(new Uint8ClampedArray(pixels),width,height);
        // 放入新的canvas中
        const oCtx = oCanvas.getContext("2d");
        oCtx.putImageData(imageData, 0, 0);
        // 需要竖向翻转
        let newData = oCtx.createImageData(width,height)
        let soureData = oCtx.getImageData(0,0,width,height)
        const turnNewData =  this.imageDataVRevert(soureData,newData)
        // 翻转之后放入canvas中
        oCtx.putImageData( turnNewData, 0, 0);
        this.bboxCanvas = oCanvas
        if(this.options.enableImg) {
            this.saveAsIMG(this.bboxCanvas)
        }
        let data = {
            data:this.bboxCanvas.toDataURL()
        }
        this.emit('success',data)
    }

    /**
     * canvas转图片下载
     * @param canvas
     */
    saveAsIMG (canvas) {
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(canvas.msToBlob(),  this.options.fileName);
        } else {
            canvas.toBlob((blob) => {
                saveAs(blob, this.options.fileName);
            });
        }
    }


    /**
     * 初始化控件按钮
     */
    initPrintToolControl () {
        const printIcon = '<svg t="1578041898750" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2310" width="25" height="25"><path d="M255.872 703.616h63.936v255.808h-64v-255.808z m447.68 0h64v255.808h-64v-255.808z" fill="#333333" p-id="2311"></path><path d="M255.872 895.488h511.68v64H255.872zM959.36 255.872h-191.808V64H255.872v191.872H63.936a64 64 0 0 0-63.936 64v383.744a64 64 0 0 0 64 64h127.872v-128h639.616v128h127.936a64 64 0 0 0 64-64V319.872a64 64 0 0 0-64-64zM319.872 128h383.744v128H319.808v-128z m639.616 544.32a31.36 31.36 0 0 1-32 31.36h-32V575.68H128v127.936h-32a32 32 0 0 1-32-31.36V352.448a31.36 31.36 0 0 1 32-32.64h831.488a32 32 0 0 1 32 31.36v321.088z" fill="#333333" p-id="2312"></path><path d="M191.872 383.808h191.872v64H191.872z" fill="#333333" p-id="2313"></path></svg>'
        const bboxIcon = '<svg t="1578041998616" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2859" width="25" height="25"><path d="M832 1024H192a192 192 0 0 1-192-192V192a192 192 0 0 1 192-192h640a192 192 0 0 1 192 192v640a192 192 0 0 1-192 192zM192 128a64 64 0 0 0-64 64v640a64 64 0 0 0 64 64h640a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64z" fill="" p-id="2860"></path></svg>'

        this.container = document.createElement('div')
        this.container.classList.add('mapboxgl-ctrl')
        this.container.classList.add('mapboxgl-ctrl-group')

        // 全图打印
        this.fullPrintButton = document.createElement('button')
        this.fullPrintButton.classList.add('mapboxgl-ctrl-print-full-tool')
        this.fullPrintButton.title = '全图打印'
        this.fullPrintButton.innerHTML = printIcon
        this.container.appendChild(this.fullPrintButton)

        // 框选打印
        this.partPrintButton = document.createElement('button')
        this.partPrintButton.classList.add('mapboxgl-ctrl-print-bbox-tool')
        this.partPrintButton.title = '框选打印'
        this.partPrintButton.innerHTML = bboxIcon
        this.container.appendChild(this.partPrintButton)

    }

    /** 由于裁剪的内容是倒立的 因此需要翻转像素
     *  canvas像素竖向翻转
     * @param sourceData
     * @param newData
     * @returns {*}
     */
    imageDataVRevert (sourceData,newData) {
        for(let i=0,h=sourceData.height;i<h;i++){
            for(let j=0,w=sourceData.width;j<w;j++){
                newData.data[i*w*4+j*4+0] = sourceData.data[(h-i)*w*4+j*4+0];
                newData.data[i*w*4+j*4+1] = sourceData.data[(h-i)*w*4+j*4+1];
                newData.data[i*w*4+j*4+2] = sourceData.data[(h-i)*w*4+j*4+2];
                newData.data[i*w*4+j*4+3] = sourceData.data[(h-i)*w*4+j*4+3];
            }
        }
        return newData;
    }


}

export default mapPrintTool