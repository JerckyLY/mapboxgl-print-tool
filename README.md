## mapboxgl-print-tool
地图全图打印，框选打印导出图片
## 使用
 -  CDN
     ```js
     // 依赖file-save下载图片
       <script src="https://cdn.bootcss.com/FileSaver.js/2014-11-29/FileSaver.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/mapboxgl-print-tool@1.0.5/dist/index.js"></script>
     ```
     ```js
        <script>
            mapboxgl.accessToken = 'pk.eyJ1IjoiamVyY2t5IiwiYSI6ImNqYjI5dWp3dzI1Y2YzMnM3eG0xNnV3bWsifQ.eQp4goc9Ng8SuEZcdgNJ_g';
            var map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v9',
                preserveDrawingBuffer:true //canvas toDataURL
            });
            const mapPrint  = new MapPrintTool({
                enableImg:true, //是否出图
                fileName:'mapDemo.png' // 文件名
            })
            map.addControl(mapPrint, 'top-right')
            // 监听打印 获取数据 
            mapPrint.on('success',function (res) {
                console.log(res)
            })
        </script>
     ```
 - 模块化
   ```js
     npm install mapboxgl-print-tool
   ```  
   ```js
     import MapPrintTool from 'mapboxgl-print-tool'
       // 打印
     const mapPrintTool = new MapPrintTool({
         enableImg:true,
         fileName:'test.jpg'
     })
     this.map.addControl(mapPrintTool,'top-left')
     //监听获取图片数据
     mapPrintTool.on('success',(res) => {
         console.log(res)
     })
    
    ```  
    
## 配置项 -- 两个绑定出现

  ` | 名称 | 类型 | 描述 | 默认值
  :---: |:---: | :---: | :---: | :---:
  1 | enableImg | Boolean | 是否导出图片 | true| 
  2 | fileName| String | 导出的图片文件名 | 'map.jpg'|
 
## 事件 
  - 监听 **`success`**，获取 **`canvas`**转成的图片数据 **`base64`**
    ```js
      const mapPrint = new MapPrintTool()
      mapPrint.on('success',(res) => {
          console.log(res)
      })
    ```
   
## 效果
  - 界面   
  ![](assets/fullmap.png)
  
  - 全图打印   
  ![](assets/fullprint.jpg)
  
  - 框选打印   
  ![](assets/pariprint.jpg)
