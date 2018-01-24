/**
 * Created by xujw on 2018/1/23.
 */
var CycleScroll;
(function () {
    var MIN_SCROLL_SPEED = 1;
    var MAX_SCROLL_SPEED = 50;
    CycleScroll = cc.LayerColor.extend({
        curIndex: 0,
        _disSize: null,
        _spaceDistance: 0,
        _nodes: null,
        _clipNode: null,

        //减速使用
        _dragging: false,
        _autoScrolling: false,
        _scrollDistance: 0,
        _startPos: null,

        /**
         *
         * @param disSize cc.Size   宽高
         * @param nodes  []         节点
         * @param distance  Number  间隔
         * @param minScale  Number  最小缩放
         */
        ctor: function (disSize, nodes, distance, minScale) {
            if (!minScale) {
                minScale = 1;
            }
            if (!distance) {
                distance = 150;
            }
            this._super(cc.color(0,0,0,0), disSize.width, disSize.height);
            this._nodes = nodes;
            this._disSize = disSize;
            this._spaceDistance = distance;
            this._minScale = minScale;

            this.initView();
            this.scheduleUpdate();
        },

        initView: function () {
            this.setContentSize(this._disSize);
            var clipSize = this._disSize;
            var stencil = new cc.LayerColor(cc.color(255,0,0,255), clipSize.width, clipSize.height);
            this._clipNode = new cc.ClippingNode(stencil);
            this.addChild(this._clipNode);
            var len = this._nodes.length;
            for (var i=0; i<len; i++) {
                if (this._nodes[i] != null){
                    this._nodes[i].setPosition(cc.p(this._nodes[i].getContentSize().width/2 + i*this._spaceDistance,
                                                                                            this._disSize.height/2));
                    this._clipNode.addChild(this._nodes[i]);
                }
            }

            this.initListener();
            this.scrollTo(0, 0);
        },

        initListener: function () {
            var self = this;
            var listener = cc.EventListener.create({
                swallowTouches: true,
                event:cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: self.onTouchBegan.bind(self),
                onTouchMoved: self.onTouchMoved.bind(self),
                onTouchEnded: self.onTouchEnded.bind(self)
            });
            cc.eventManager.addListener(listener,this);
        },

        setDisplaySize: function (disSize) {
            this._disSize = disSize;
            this.setContentSize(this._disSize);
            this._clipNode.getStencil().setContentSize(this._disSize);
        },

        getDisplaySize: function () {
            return this._disSize;
        },

        onTouchBegan: function (touch, event) {
            this._dragging = true;
            this._scrollDistance = 0;
            this._startPos = touch.getLocation();
            return true;
        },

        onTouchMoved: function (touch, event) {
            var disX = touch.getDelta().x;
            this.updateNodePosX(disX);
            this._startPos = touch.getPreviousLocation();
        },

        onTouchEnded: function (touch, event) {
            this._dragging = false;
            var endPos = touch.getLocation();
            this._scrollDistance = Math.sqrt(Math.pow(endPos.x-this._startPos.x, 2) + Math.pow(endPos.y-this._startPos.y,2));
            this._scrollDistance = this._scrollDistance <= MAX_SCROLL_SPEED?this._scrollDistance : MAX_SCROLL_SPEED;
            if (this._scrollDistance > MIN_SCROLL_SPEED) {
                this._autoScrolling = true;
            }
            var direction = endPos.x > this._startPos.x?1:-1;
            this._scrollDistance *= direction;
        },
        
        updateNodePosX: function (delta) {
            var length = this._nodes.length;
            for (var i=0; i<length; i++){
                var node = this._nodes[i];
                node.setPositionX(node.getPositionX() + delta);
            }
        },

        scrollTo: function (index, time) {
            if(index < 0 || index >= this._nodes.length) {
                cc.log("index invalid!");
                return;
            }
            this.curIndex = index;
            var distance = this._disSize.width/2 - this._nodes[index].getPositionX();
            for (var i=0; i< this._nodes.length; i++){
                var node = this._nodes[i];
                node.stopAllActions();
                node.runAction(cc.moveBy(time, cc.p(distance, 0)).easing(cc.easeSineOut()));
            }

        },

        deaccelerateScrolling: function (dt) {
            if (this._dragging)
            {
                this._autoScrolling = false;
                return;
            }
            cc.log("scrollDistance:" + this._scrollDistance);
            this._scrollDistance *= 0.95;
            if (Math.abs(this._scrollDistance) < MIN_SCROLL_SPEED){
                this._autoScrolling = false;
                this._startTime = 0;
            }
            this.updateNodePosX(this._scrollDistance);
        },
        
        update: function (dt) {
            var length = this._nodes.length;
            var newPosX = 0;
            var s = 0.5;
            var mid = this._disSize.width/2;

            for (var i=0; i<length; i++){
                var node = this._nodes[i];
                var curPosX = node.getPositionX();

                if (curPosX < -node.getContentSize().width/2){
                    var beforeIndex = i-1;
                    beforeIndex = beforeIndex>=0?beforeIndex:length-1;
                    newPosX = this._nodes[beforeIndex].getPositionX() + this._spaceDistance;
                    if (curPosX != newPosX){
                        node.setPositionX(newPosX);
                        curPosX = newPosX;
                    }
                }else if (curPosX > this._disSize.width + node.getContentSize().width/2){
                    var afterIndex = i+1;
                    afterIndex = afterIndex<=length-1?afterIndex:0;
                    newPosX = this._nodes[afterIndex].getPositionX() - this._spaceDistance;
                    if (curPosX != newPosX){
                        node.setPositionX(newPosX);
                        curPosX = newPosX;
                    }
                }

                if (curPosX <= mid){
                    s = curPosX / mid;
                } else{
                    s = (this._disSize.width-curPosX) / mid;
                }
                s *= 1.2;
                s = s<=1?s:1;
                s = s>=this._minScale?s:this._minScale;
                node.setScale(s);
            }

            if (this._autoScrolling) {
                this.deaccelerateScrolling(dt);
            }
        }
    });

})();