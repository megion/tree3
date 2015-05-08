/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tree3.AbstractTreeControl = function(id, treeEl) {
	this.id = id;
	this.treeEl = treeEl;
	this.treeEl.treeControl = this;
	this.currentSelectedNodeEl = null;
	this.allNodesMap = {};
};

/**
 * Static tree class name constants
 */
tree3.AbstractTreeControl.TREE_CLASSES = {
	selectedNode : "selected",
	treeNode : "menu",
	closed : "closed",
	closedHitarea : "closed-hitarea",
	lastClosed : "lastClosed",
	lastClosedHitarea : "lastClosed-hitarea",
	opened : "opened",
	openedHitarea : "opened-hitarea",
	lastOpened : "lastOpened",
	lastOpenedHitarea : "lastOpened-hitarea",
	hitarea : "hitarea",
	firstTdInner : "firstTdInner"
};

/**
 * Обработчик события выделения узла дерева. Функция объявлена как константа
 */
tree3.AbstractTreeControl.onClickTreeNode = function(event) {
	tree3.stopEventPropagation(event);

	var nodeEl = this; // т.к. событие на узле Li
	var treeControl = nodeEl.treeControl;
	treeControl.clickNode(nodeEl);
	return false;
};

/**
 * Установка конфигурации дерева
 */
tree3.AbstractTreeControl.prototype.configure = function(config) {
	this.conf = config || {};
	this.disableHistory = this.conf.disableHistory;
}

tree3.AbstractTreeControl.prototype.clickNode = function(nodeEl, setClosed) {
	if (setClosed==undefined || setClosed==null) {
		setClosed = (nodeEl.opened==null?false:nodeEl.opened);
	}
	if (this.disableHistory) {
		this.selectTreeNode(nodeEl, setClosed);
	} else {
		nodeEl.opened = !setClosed;
		var hash = this.getNodeHash(nodeEl);
		
		var curAnchor = decodeURIComponent(location.hash.slice(1));
		var newAnchor = tree3.historyMaster.putValue(this.id, hash, curAnchor);
		jQuery.history.load(newAnchor);
		// выделение узла в данном случае осуществляет callback history 
	}
};

tree3.AbstractTreeControl.prototype.processAllNodes = function(processorFn) {
	for(var nodeId in this.allNodesMap) {
		var nodeModel = this.allNodesMap[nodeId];
		var nodeEl = nodeModel.nodeEl;
		processorFn.call(this, nodeEl);
	}
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeElHtml -
 *            обновляемый узел
 */
tree3.AbstractTreeControl.prototype.loadChildNodes = function(nodeEl) {
	console.error("Function loadChildNodes should be overriden");
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeElHtml -
 *            обновляемый узел
 */
tree3.AbstractTreeControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed, updateCloseState) {
	console.error("Function loadTreeScopeNodes should be overriden");
};

/**
 * Установить видимость выделения узла
 */
tree3.AbstractTreeControl.prototype.setSelectionTreeNode = function(nodeEl) {
	console.error("Function setSelectionTreeNode should be overriden");
};

tree3.AbstractTreeControl.prototype.processAllParentNode = function(nodeModel,
		processNodeFn, canRunCurrent) {
	if (canRunCurrent) {
		processNodeFn.call(this, nodeModel);
	}
	if (nodeModel.parentId) {
		var parentNodeModel = this.allNodesMap[nodeModel.parentId];
		this.processAllParentNode(parentNodeModel, processNodeFn, true);
	}
};

tree3.AbstractTreeControl.prototype.processAllChildrenNode = function(nodeModel,
		processNodeFn, canRunCurrent, level) {
	if (canRunCurrent) {
		var canNext = processNodeFn(nodeModel, level);
		if (!canNext) {
			return;
		}
	}
	if (nodeModel.children) {
		for ( var i = 0; i < nodeModel.children.length; i++) {
			var childNodeModel = nodeModel.children[i];
			this.processAllChildrenNode(childNodeModel, processNodeFn, true, level++);
		}
	}
};

/**
 * Выделение узла дерева
 * 
 * @param nodeElHtml
 */
tree3.AbstractTreeControl.prototype.selectTreeNode = function(nodeEl, setClosed) {
	this.setSelectionTreeNode(nodeEl);
	this.setNodeClose(nodeEl, setClosed);
	
	var requireLoading = nodeEl.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeEl);
	}
};

tree3.AbstractTreeControl.prototype.setNodeClose = function(nodeEl, closed) {
	var CLASSES = tree3.AbstractTreeControl.TREE_CLASSES;
	var hasChildren = nodeEl.hasChildren;
	
	// mark node as closed or opened
	nodeEl.opened = !closed;
	
	if (!hasChildren) {
		return;
	}

	var isLast = nodeEl.isLast; 
	if (isLast) {
		if (closed) {
			tree3.addClass(nodeEl, CLASSES.lastClosed);
			tree3.removeClass(nodeEl, CLASSES.lastOpened);
		} else {
			tree3.addClass(nodeEl, CLASSES.lastOpened);
			tree3.removeClass(nodeEl, CLASSES.lastClosed);
		}
	}

	if (closed) {
	    tree3.addClass(nodeEl, CLASSES.closed);
	    tree3.removeClass(nodeEl, CLASSES.opened);
	} else {
		tree3.addClass(nodeEl, CLASSES.opened);
	    tree3.removeClass(nodeEl, CLASSES.closed);
	}
	
	if (isLast) {
		if (closed) {
		    tree3.addClass(nodeEl.hitareaDiv, CLASSES.lastClosedHitarea);
		    tree3.removeClass(nodeEl.hitareaDiv, CLASSES.lastOpenedHitarea);
		} else {
			tree3.addClass(nodeEl.hitareaDiv, CLASSES.lastOpenedHitarea);
		    tree3.removeClass(nodeEl.hitareaDiv, CLASSES.lastClosedHitarea);
		}
	}
	if (closed) {
		tree3.addClass(nodeEl.hitareaDiv, CLASSES.closedHitarea);
		tree3.removeClass(nodeEl.hitareaDiv, CLASSES.openedHitarea);
	} else {
		tree3.addClass(nodeEl.hitareaDiv, CLASSES.openedHitarea);
		tree3.removeClass(nodeEl.hitareaDiv, CLASSES.closedHitarea);
	}
	
	// override ...
};

tree3.AbstractTreeControl.prototype.openNode = function(nodeEl, setClosed) {
	// open parent nodes
	this.processAllParentNode(nodeEl.nodeModel, function(parentNodeModel) {
		if (!parentNodeModel.nodeEl.opened) {
			this.setNodeClose(parentNodeModel.nodeEl, false);
		}
	}, false);
	this.selectTreeNode(nodeEl, setClosed);
};

/**
 * Сформировать хеш для подстановки в URL для последующего восстановления
 * состояния страницы
 * 
 * @param nodeElHtml
 * @returns {String}
 */
tree3.AbstractTreeControl.prototype.getNodeHash = function(nodeEl) {
	var nodeId = nodeEl.nodeModel.id;
	if (nodeEl.opened!=null && !nodeEl.opened) {
		nodeId = nodeId + "&state=closed";
	}
	return "id-" + nodeId;
};

tree3.AbstractTreeControl.prototype.getNodeInfoByAnchor = function(anchor) {
	var parts = anchor.split('&');
	var path = parts.shift();
	var setClosed = false;
	if (parts.length) {
		var param = parts.shift();
		if (param == 'state=closed') {
			setClosed = true;
		}
	}
	var nodeId = path.substring(path.indexOf("-") + 1, path.length);
	var info =  {
		nodeId: nodeId,
		setClosed: setClosed
	};
	return info;
};

tree3.AbstractTreeControl.prototype.detectAnchor = function(anchor) {
	if (anchor) {
		this.updateTreeStateByAnchor(anchor, false);
	}
};

tree3.AbstractTreeControl.prototype.updateTreeStateByAnchor = function(anchor, updateCloseState) {
	var treeHash = tree3.historyMaster.getValue(this.id, decodeURIComponent(anchor));
	if (!treeHash) {
		return;
	}
	var nodeInfo = this.getNodeInfoByAnchor(treeHash);
	var nodeModel = this.allNodesMap[nodeInfo.nodeId];
	if (nodeModel && !nodeModel.fakeNode) {
		this.openNode(nodeModel.nodeEl, nodeInfo.setClosed);
	} else {
		this.loadTreeScopeNodes(nodeInfo.nodeId, nodeInfo.setClosed, updateCloseState);
	}
};

tree3.AbstractTreeControl.prototype.updateState = function() {
	var anchor = location.hash.slice(1);
	this.updateTreeStateByAnchor(anchor, true);
};

tree3.AbstractTreeControl.prototype.removeState = function() {
	if (!this.disableHistory) {
		var curAnchor = decodeURIComponent(location.hash.slice(1));
		var newAnchor = tree3.historyMaster.removeValue(this.id, curAnchor);
		jQuery.history.load(newAnchor);
		// снятие выделение узла в данном случае осуществляет callback history 
	}
};

tree3.AbstractTreeControl.prototype.updateLinkInParentChildren = function(nodeModel) {
	if (nodeModel.parentId) {
		var parentNode = this.allNodesMap[nodeModel.parentId];
		if (parentNode.children) {
			for ( var i = 0; i < parentNode.children.length; i++) {
				var childNode = parentNode.children[i];
				if (childNode.id == nodeModel.id) {
					// update child model
					parentNode.children[i] = nodeModel;
					return;
				}
			}
		}
	}
	
};

