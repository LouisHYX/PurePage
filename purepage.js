/**
 * 分页插件——PurePage
 */

(function (win, doc) {
    "use strict";

    var defaults = {  //默认配置参数
        holder: "holder",  //初始化盒子的id
        total: 10,  //总页数
        jump: false,  //是否有跳转功能
        callback: null  //跳转页面之后的回调
    };
    var index = 0;  //当前页码索引
    var FIRST = 0;  //首页索引
    var LAST = 0;  //末页索引
    var pages = [];  //所有页码存放处
    var paginationBox = null;  //承载分页内容的盒子

    /**
     * 用类名获取盒子
     * @param cls
     * @returns {NodeList}
     */
    function getEle(cls) {
        return doc.getElementsByClassName(cls);
    }

    /**
     * 将用户定义的参数与默认参数进行合并(深拷贝)
     * @param cus  //用户传入的参数--object
     * @param def  //插件默认的参数--object
     * @returns {{}}
     */
    function comParams(cus, def) {
        var res = {};  //需要返回的结果
        if (cus === undefined) {
            cus = {};
        }

        //判断参数是否为object,返回true或false
        function isObject(o) {
            return Object.prototype.toString.call(o) === '[object Object]';
        }

        for (var key in def) {
            if (def.hasOwnProperty(key)) {  //默认参数是否具有key属性
                if (cus.hasOwnProperty(key)) {  //自定义参数是否具有key属性
                    if (isObject(def[key]) && isObject(cus[key])) {  //默认参数与自定义参数的key属性是否都是object
                        comParams(cus[key], def[key]);  //key属性都为object就进行递归
                    } else {
                        res[key] = {};  //如果其中一个key属性不是object,那就赋值为{}
                    }
                    res[key] = cus[key];  //如果key属性都不为object就赋值为自定义参数的key属性
                } else {
                    res[key] = def[key];  //如果自定义参数没有key属性,就赋值为默认参数的key属性
                }
            }
        }
        return res;
    }

    win.PurePage = (function () {

        /**
         * 插件构造函数
         * @param options
         * @constructor
         */
        function PurePage(options) {
            var me = this;
            me.config = comParams(options, defaults);  //默认参数与用户自定义参数合并
            me.holder = doc.getElementById(me.config.holder);  //用户自定义的分页最外层盒子
            LAST = me.config.total - 1;  //设置末页
            me.init();
        }

        /**
         * 插件初始化
         */
        PurePage.prototype.init = function () {
            var me = this;
            var boxHTML = "<div class='pagination-box'>";
            boxHTML += "<a class='previous'>上一页</a>";
            for (var num = 1; num <= LAST + 1; num++) {
                boxHTML += "<a class='page'>" + num + "</a>";
            }
            boxHTML += "<a class='next'>下一页</a>";
            if (me.config.jump && typeof me.config.jump === "boolean") {
                boxHTML += "<input class='page-num' name='page-num' type='text'><a class='jump'>跳转</a>";
            }

            me.holder.innerHTML = boxHTML;

            pages = getEle("page");  //获取所有页码
            paginationBox = getEle("pagination-box")[0];  //获取整个分页

            me._correctPaging();  //完善分页HTML

            me._initEvent();  //初始化事件
        };

        /**
         * 获取当前页页码
         * @returns {number}
         */
        PurePage.prototype.getCurrent = function () {
            return index + 1;
        };

        /**
         * 根据情况显示分页——隐藏部分页码以及添加必要的省略符号(每次当前页改变都要执行的关键函数)
         * @private
         */
        PurePage.prototype._correctPaging = function () {
            var me = this;
            var RESERVE = 3;  //保留多少页码才显示省略号(不算首页与末页)
            var _count = 0;

            me._refresh();  //重置(分页去省略号以及修改为初始样式)

            if (index === FIRST) {  //当前页为首页,隐藏"上一页"
                getEle("previous")[0].style.display = "none";
            } else {
                getEle("previous")[0].style.display = "inline-block";
            }

            if (index === LAST) {  //当前页为末页,隐藏"下一页"
                getEle("next")[0].style.display = "none";
            } else {
                getEle("next")[0].style.display = "inline-block";
            }

            pages[index].className += " current";  //设置当前页

            if (LAST + 1 >= 10) {  //若总页数大于等于10则采取省略写法
                if (index < 4) {  //当前页小于5时,前五页显示,之后的隐藏,给页码5与页码6之间加点
                    for (; _count < LAST; _count++) {
                        if (_count < 5) {
                            pages[_count].style.display = "inline-block";
                        } else if (_count === 5) {
                            paginationBox.insertBefore(me._createDots(), pages[5]);
                        } else {
                            pages[_count].style.display = "none";
                        }
                    }
                }
                if (index >= 4 && index <= LAST - 4) {  //当前页大于等于5小于等于总页数-5时,中间只显示5页,其他隐藏
                    for (; _count < LAST; _count++) {
                        if (pages[index - _count] !== undefined) {
                            if (_count < RESERVE) {
                                pages[index - _count].style.display = "inline-block";
                            } else if (_count === RESERVE) {
                                paginationBox.insertBefore(me._createDots(), pages[index - RESERVE]);
                            } else {
                                pages[index - _count].style.display = "none";
                            }
                        }
                        if (pages[index + _count] !== undefined) {
                            if (_count < RESERVE) {
                                pages[index + _count].style.display = "inline-block";
                            } else if (_count === RESERVE) {
                                paginationBox.insertBefore(me._createDots(), pages[index + RESERVE]);
                            } else {
                                pages[index + _count].style.display = "none";
                            }
                        }
                    }
                }
                if (index > LAST - 4) {  //当前页小于等于总页数-5时,后5页显示,之前的隐藏,给总页数-5与总页数-6之间加点
                    for (_count = LAST; _count > FIRST; _count--) {
                        if (_count > LAST - 5) {
                            pages[_count].style.display = "inline-block";
                        } else if (_count === LAST - 5) {
                            paginationBox.insertBefore(me._createDots(), pages[LAST - 5]);
                        } else {
                            pages[_count].style.display = "none";
                        }
                    }
                }
            } else {  //若总页数小于10则页码全部显示
                for (; _count <= LAST; _count++) {
                    pages[_count].style.display = "inline-block";
                }
            }

            pages[FIRST].style.display = "inline-block";
            pages[LAST].style.display = "inline-block";

            if (me.config.callback && typeof me.config.callback === "function") {  //执行回调
                me.config.callback(me);
            }
        };

        /**
         * 生成省略号
         * @returns {Element}  //返回省略号节点
         * @private
         */
        PurePage.prototype._createDots = function () {
            var dots = doc.createElement("span");
            dots.textContent = "...";
            dots.className = "dots";
            return dots;
        };

        /**
         * 重置分页
         * @private
         */
        PurePage.prototype._refresh = function () {
            var dotsArr = getEle("dots") || [];
            var _length = dotsArr.length;

            for (var n = LAST; n >= FIRST; n--) {
                if (_length > FIRST && n < _length) {
                    paginationBox.removeChild(dotsArr[n]);
                }
                pages[n].style.display = "none";
                pages[n].className = "page";
            }
        };

        /**
         * 插件绑定事件
         * @private
         */
        PurePage.prototype._initEvent = function () {
            var me = this;
            var _jump = getEle("page-num")[0];
            if (_jump !== undefined) {
                _jump.onkeyup = function () {  //跳转输入框只能输入数字
                    this.value = this.value.replace(/\D/g, '');
                };
            }
            me.holder.onclick = function (e) {
                e.stopPropagation();
                var curPage = e.target;
                if (curPage.tagName.toLowerCase() === "a" && curPage.className === "page") {
                    index = curPage.textContent - 1;
                }
                if (curPage.tagName.toLowerCase() === "a" && curPage.className === "previous") {
                    index -= 1;
                }
                if (curPage.tagName.toLowerCase() === "a" && curPage.className === "next") {
                    index += 1;
                }
                if (curPage.tagName.toLowerCase() === "a" && curPage.className === "jump") {
                    if (_jump.value !== "" && Number(_jump.value) >= 1 && Number(_jump.value) <= LAST + 1) {
                        index = _jump.value - 1;
                        _jump.value = "";
                        _jump.focus();
                    } else {
                        _jump.focus();
                        _jump.select();
                    }
                }
                me._correctPaging();
            };
        };

        return PurePage;
    })();

})(window, document);