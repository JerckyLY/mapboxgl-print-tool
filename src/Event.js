/**
 * @Description: 事件管理类
 * @author liuyang
 * @date 2020/1/7 
*/
class BaseEvents {

    /**
     * 注册事件 类型 和 回调函数
     * @param type
     * @param handle
     */
    on (eventName, callback) {
        if(!this.handles){
            Object.defineProperty(this, "handles", {
                value: {},
                enumerable: false,
                configurable: true,
                writable: true
            })
        }

        if(!this.handles[eventName]){
            this.handles[eventName]=[];
        }
        this.handles[eventName].push(callback);
    }

    /**
     * 触发一个事件
     * @param event
     */
    emit (eventName) {
        if(this.handles[arguments[0]]){
            for(let i=0;i<this.handles[arguments[0]].length;i++){
                this.handles[arguments[0]][i](arguments[1]);
            }
        }
    }

}

export default BaseEvents
