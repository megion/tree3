/*!
 * tree3
 * https://github.com/megion/tree3
 * Version: 0.0.1 - 2015-05-15T12:05:33.029Z
 * License: MIT
 */


/**
 * Object namespace
 */
var tree3 = {};

tree3.stopEventPropagation = function(event) {
	if (!event) {
		// IE8
		window.event.cancelBubble = true;
	} else if (event.stopPropagation) {
		event.stopPropagation();
	}
};

// add trim function support
/*if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/gm, '');
	};
}*/

/**
 * Оптимизированная функция, аналог jQuery.addClass. Выполняется быстрее чем
 * jQuery.addClass
 */
tree3.addClass = function(el, value) {
	var oldClass = ' ' + el.className + ' ';
	if (oldClass.indexOf(' ' + value + ' ') == -1) {
		el.className = el.className + ' ' + value;
	}
};
tree3.removeClass = function(el, value) {
	var oldClass = ' ' + el.className + ' ';
	var newClass = (oldClass.replace(' ' + value, '')).trim();
	if (el.className != newClass) {
		el.className = newClass;
	}
};

tree3.addClasses = function(el, values) {
	var oldClass = ' ' + el.className + ' ', append = '';
	for (var i = 0; i < values.length; i++) {
		var clName = values[i];
		if (oldClass.indexOf(' ' + clName + ' ') == -1) {
			append += ' ' + clName;
		}
	}
	if (append.length>0) {
		el.className = el.className + append;
	}
};

tree3.removeClasses = function(el, values) {
	var oldClass = ' ' + el.className + ' ';
	for (var i = 0; i < values.length; i++) {
		var clName = values[i];
		oldClass = oldClass.replace(' ' + clName, '');
	}
	var newClass = oldClass.trim();
	if (el.className != newClass) {
		el.className = newClass;
	}
};

tree3.insertAfter = function(el, refEl) {
	refEl.parentNode.insertBefore(el, refEl.nextSibling);	
};


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
	selectedNode : 'selected',
	treeNode : 'menu',
	closed : 'closed',
	closedHitarea : 'closed-hitarea',
	lastClosed : 'lastClosed',
	lastClosedHitarea : 'lastClosed-hitarea',
	opened : 'opened',
	openedHitarea : 'opened-hitarea',
	lastOpened : 'lastOpened',
	lastOpenedHitarea : 'lastOpened-hitarea',
	hitarea : 'hitarea',
	firstTdInner : 'firstTdInner'
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
};

tree3.AbstractTreeControl.prototype.clickNode = function(nodeEl, setClosed) {
	if (setClosed===undefined || setClosed===null) {
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
	console.error('Function loadChildNodes should be overriden');
};

/**
 * Загружает данные модели с сервера в виде JSON
 * 
 * @param nodeElHtml -
 *            обновляемый узел
 */
tree3.AbstractTreeControl.prototype.loadTreeScopeNodes = function(nodeId, setClosed, updateCloseState) {
	console.error('Function loadTreeScopeNodes should be overriden');
};

/**
 * Установить видимость выделения узла
 */
tree3.AbstractTreeControl.prototype.setSelectionTreeNode = function(nodeEl) {
	console.error('Function setSelectionTreeNode should be overriden');
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
		nodeId = nodeId + '&state=closed';
	}
	return 'id-' + nodeId;
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
	var nodeId = path.substring(path.indexOf('-') + 1, path.length);
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


/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tree3.TreeControl = function(id, treeEl) {
	tree3.AbstractTreeControl.apply(this, arguments);
};

tree3.TreeControl.prototype = Object
		.create(tree3.AbstractTreeControl.prototype);

/**
 * Начальная инициализация дерева
 */
tree3.TreeControl.prototype.init = function(rootNodes) {
	this.appendNewNodes(this.treeEl, rootNodes);
};

tree3.TreeControl.prototype.updateRootNodes = function(rootNodes,
		updateCloseState) {
	this.updateExistUlNodesContainer(this.treeEl, rootNodes, updateCloseState);
};

/**
 * Обновляет содержимое существующего контейнера узлов UL
 */
tree3.TreeControl.prototype.updateExistUlNodesContainer = function(
		ulContainer, newNodes, updateCloseState) {
	var oldNodes = null;
	if (ulContainer) {
		oldNodes = ulContainer.nodeModels;
		ulContainer.nodeModels = newNodes;
	}

	// новых узлов нет
	if (newNodes === null || newNodes.length === 0) {
		// данный код сработает только для узлов самого верхнего уровня т.к. для
		// дочерних узлов сработают проверки в updateExistNode.
		// если есть старые узлы то их все необходимо удалить и выйти
		if (oldNodes != null && oldNodes.length > 0) {
			for (var j = 0; j < oldNodes.length; j++) {
				var oldnode = oldNodes[j];
				this.deleteExistSubNode(ulContainer, oldnode);
			}
		}
		return;
	}

	// подготовить new nodes HashMaps (key->nodeId, value->node)
	var newNodesByKey = {};
	var newNode;
	for (var i = 0; i < newNodes.length; i++) {
		newNode = newNodes[i];
		newNodesByKey[newNode.id] = newNode;
	}

	// подготовить old nodes HashMaps (key->nodeId, value->node), который будет
	// содержать только не удаленные узлы. В этом же цикле удалить узлы которых
	// нет в новом наборе узлов
	var oldNodesByKey = {};
	var oldNode;
	for (i = 0; i < oldNodes.length; i++) {
		oldNode = oldNodes[i];
		if (newNodesByKey[oldNode.id] == null) {
			// узел был удален
			this.deleteExistSubNode(ulContainer, oldNode);
		} else {
			oldNodesByKey[oldNode.id] = oldNode;
		}
	}

	// поэлементно обновить узлы
	var prevNewNode = null;
	for (i = 0; i < newNodes.length; i++) {
		newNode = newNodes[i];
		var isLast;
		if (i == (newNodes.length - 1)) {
			isLast = true;
		} else {
			isLast = false;
		}
		oldNode = oldNodesByKey[newNode.id];
		if (oldNode) {
			if (i < oldNodes.length) {
				// старый узел находящийся на том же месте
				var mirrorOldNode = oldNodes[i];
				if (mirrorOldNode.id == newNode.id) {
					// находится на том же месте
				} else {
					// необходимо перемещение после предыдущего
					this.moveToAfterExistSubNode(ulContainer, oldNode,
							prevNewNode);
				}
			} else {
				// необходимо перемещение в конец
				this.moveToEndExistSubNode(ulContainer, oldNode);
			}
			this.updateExistNode(oldNode, newNode, updateCloseState);
		} else {
			// нет узла с таким ключом среди старых - необходимо добавить
			this.appendNewNode(ulContainer, newNode);
		}

		newNode.nodeEl.isLast = isLast;
		prevNewNode = newNode;
	}
};

tree3.TreeControl.prototype.updateLoadedNode = function(oldNode, newNode) {
	this.updateExistNode(oldNode, newNode, false);
	this.updateLinkInParentChildren(newNode);
};

/**
 * Обновляет узел и все дочерние узлы из новой модели узла
 */
tree3.TreeControl.prototype.updateExistNode = function(oldNode, newNode,
		updateCloseState) {
	var nodeEl = oldNode.nodeEl;
	var oldSubnodes = oldNode.children;
	var newSubnodes = newNode.children;

	// 1. обновление модели узла. Перекрестная ссылка.
	newNode.nodeEl = nodeEl;
	nodeEl.nodeModel = newNode;
	this.allNodesMap[newNode.id] = newNode;

	// 2. обновление визуальной информации узла
	this.updateNodeAppearance(nodeEl, newNode);

	var hasChildren = (newSubnodes != null && newSubnodes.length > 0);
	var oldHasChildren = (oldSubnodes != null && oldSubnodes.length > 0);

	if (oldHasChildren) {
		// в предыдущем состоянии узел имел дочерние узлы
		if (hasChildren) {
			// узел имеет дочерние элементы
			nodeEl.hasChildren = true;
		} else {
			// узел не имеет дочерние элементы. Удаляем все
			for (var i = 0; i < oldSubnodes.length; i++) {
				var oldnode = oldSubnodes[i];
				this.deleteExistSubNode(nodeEl.subnodesUl, oldnode);
			}

			this.enableChildren(nodeEl, false);
			return;
		}
	} else {
		if (hasChildren) {
			// узел не имел детей, а теперь имеет
			this.enableChildren(nodeEl, true);

			// если текущий выделенный узел не имел дочерних,
			// а после обновления стал иметь при этом он находился в открытом
			// состоянии,
			// то его необходимо открыть вручную
			if (updateCloseState && this.currentSelectedNodeEl
					&& this.currentSelectedNodeEl.nodeModel.id == newNode.id) {
				if (nodeEl.opened) {
					this.setNodeClose(nodeEl, false);
				}
			}
			this.appendNewNodes(nodeEl.subnodesUl, newSubnodes);
			return;
		}
	}

	if (updateCloseState) {
		// close node if need loading
		if (nodeEl.nodeModel.needLoad) {
			this.setNodeClose(nodeEl, true);
		}
	}
	this.updateExistUlNodesContainer(nodeEl.subnodesUl, newSubnodes,
					updateCloseState);
};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tree3.TreeControl.prototype.enableChildren = function(nodeEl, enable) {
	if (enable) {
		var hitareaDiv = document.createElement('div');
		hitareaDiv.className = tree3.AbstractTreeControl.TREE_CLASSES.hitarea
				+ ' ' + tree3.AbstractTreeControl.TREE_CLASSES.closedHitarea;
		nodeEl.insertBefore(hitareaDiv, nodeEl.firstChild);
		nodeEl.hitareaDiv = hitareaDiv;
		nodeEl.hasChildren = true;

		var ulContainer = document.createElement('ul');
		ulContainer.style.display = 'none';
		nodeEl.appendChild(ulContainer);
		nodeEl.subnodesUl = ulContainer;
	} else {
		nodeEl.removeChild(nodeEl.subnodesUl);
		nodeEl.subnodesUl = null;

		nodeEl.removeChild(nodeEl.hitareaDiv);
		nodeEl.hitareaDiv = null;
		nodeEl.hasChildren = false;
	}
};

/**
 * Создать видимую часть узла
 */
tree3.TreeControl.prototype.createNodeAppearance = function(nodeEl, nodeModel) {
	var nodeSpan = document.createElement('span');
	nodeSpan.className = tree3.AbstractTreeControl.TREE_CLASSES.treeNode;
	nodeSpan.innerHTML = nodeModel.title;
	nodeEl.appendChild(nodeSpan);
	nodeEl.nodeSpan = nodeSpan;
};

/**
 * Обновляет видимую часть узла
 */
tree3.TreeControl.prototype.updateNodeAppearance = function(nodeEl, nodeModel) {
	var nodeSpan = nodeEl.nodeSpan;
	nodeSpan.innerHTML = nodeModel.title;
};

/**
 * Добавить новый узел
 */
tree3.TreeControl.prototype.appendNewNode = function(parentUl, newNode) {
	var newLi = document.createElement('li');

	// задаем onclick обработчик по умолчанию.
	// При желании можно поменять перегрузив appendNewNode
	newLi.onclick = tree3.AbstractTreeControl.onClickTreeNode;

	parentUl.appendChild(newLi);
	var subnodes = newNode.children;
	var hasChildren = (subnodes != null && subnodes.length > 0);

	newLi.treeControl = this;
	// Внимание!!! создание перекрестной ссылки. 1 - необходимо например при
	// получении модели узла в событиях. 2 - вторая ссылка используется при
	// обновлении дерева
	newLi.nodeModel = newNode;
	newNode.nodeEl = newLi;

	this.createNodeAppearance(newLi, newNode);

	this.allNodesMap[newNode.id] = newNode;

	// добавить детей
	if (hasChildren) {
		this.enableChildren(newLi, true);
		var ulContainer = newLi.subnodesUl;
		this.appendNewNodes(ulContainer, subnodes);
	}

	return newLi;

};

/**
 * Вставить массив новых узлов
 */
tree3.TreeControl.prototype.appendNewNodes = function(ulContainer, newNodes) {
	ulContainer.nodeModels = newNodes;
	for (var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		var isLast;
		if (i == (newNodes.length - 1)) {
			isLast = true;
		} else {
			isLast = false;
		}
		this.appendNewNode(ulContainer, newNode);
		newNode.nodeEl.isLast = isLast;
	}
};

/**
 * Удалить существующий узел
 */
tree3.TreeControl.prototype.deleteExistSubNode = function(parentUl,
		deletedNode) {
	var deletedLi = deletedNode.nodeEl;

	// рекурсивно удалить и все дочерние узлы
	var subnodes = deletedNode.children;
	if (subnodes != null && subnodes.length > 0) {
		var subnodesUlContainer = deletedLi.subnodesUl;
		for (var i = 0; i < subnodes.length; i++) {
			var subnode = subnodes[i];
			this.deleteExistSubNode(subnodesUlContainer, subnode);
		}
	}

	if (this.currentSelectedNodeEl
			&& this.currentSelectedNodeEl.nodeModel.id == deletedNode.id) {
		this.clearSelectionTreeNode();
		this.removeState();
	}

	deletedLi.nodeModel = null; // убрать перекрестную зависимость
	deletedNode.nodeEl = null;
	delete this.allNodesMap[deletedNode.id];
	parentUl.removeChild(deletedLi);
};

/**
 * Переместить существующий узел
 */
tree3.TreeControl.prototype.moveToEndExistSubNode = function(parentUl,
		movedNode) {
	var movedNodeEl = movedNode.nodeEl;

	// переместить HTML элемент
	parentUl.appendChild(movedNodeEl);
};

/**
 * Переместить существующий узел после указанного узла
 */
tree3.TreeControl.prototype.moveToAfterExistSubNode = function(parentUl,
		movedNode, afterNode) {
	var movedNodeEl = movedNode.nodeEl;
	if (afterNode) {
		tree3.insertAfter(movedNodeEl, afterNode.nodeEl);
	} else {
		parentUl.insertBefore(movedNodeEl, parentUl.firstChild);
	}
};

/**
 * Установить видимость выделения узла
 */
tree3.TreeControl.prototype.setSelectionTreeNode = function(nodeEl) {
	var CLASSES = tree3.AbstractTreeControl.TREE_CLASSES;

	// снять предыдущий выделенный
	if (this.currentSelectedNodeEl) {
		tree3.removeClass(this.currentSelectedNodeEl.nodeSpan,
				CLASSES.selectedNode);
	}

	this.currentSelectedNodeEl = nodeEl;
	tree3.addClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
};

tree3.TreeControl.prototype.clearSelectionTreeNode = function() {
	var CLASSES = tree3.AbstractTreeControl.TREE_CLASSES;
	if (this.currentSelectedNodeEl) {
		tree3.removeClass(this.currentSelectedNodeEl.nodeSpan,
				CLASSES.selectedNode);
	}
	this.currentSelectedNodeEl = null;
};

/**
 * Выделение узла дерева
 * 
 * @param nodeElHtml
 */
tree3.TreeControl.prototype.selectTreeNode = function(nodeEl, setClosed) {
	this.setSelectionTreeNode(nodeEl);
	this.setNodeClose(nodeEl, setClosed);

	var requireLoading = nodeEl.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeEl);
	}
};

tree3.TreeControl.prototype.setNodeClose = function(nodeEl, closed) {
	tree3.AbstractTreeControl.prototype.setNodeClose.apply(this, arguments);

	var hasChildren = nodeEl.hasChildren;
	if (!hasChildren) {
		return;
	}

	if (closed) {
		nodeEl.subnodesUl.style.display = 'none';
	} else {
		nodeEl.subnodesUl.style.display = 'block';
	}
};

/**
 * Класс элемента дерева
 * 
 * @param treeId -
 *            ID дерева
 */
tree3.TreetableControl = function(id, treeEl) {
	tree3.AbstractTreeControl.apply(this, arguments);
};

tree3.TreetableControl.prototype = Object
		.create(tree3.AbstractTreeControl.prototype);

/**
 * Начальная инициализация дерева
 */
tree3.TreetableControl.prototype.init = function(rootNodes) {
	var tBodies = this.treeEl.tBodies;
	if (tBodies && (tBodies.length > 0)) {
		// get first el
		this.tableBodyEl = tBodies[0];
	} else {
		// create tbody
		this.tableBodyEl = document.createElement('tbody');
		this.treeEl.appendChild(this.tableBodyEl);
	}
	this.rootNodes = rootNodes;
	this.appendNewNodes(rootNodes, 0, null);

	for (var i = 0; i < rootNodes.length; i++) {
		var node = rootNodes[i];
		node.nodeEl.style.display = null;
	}
};

/**
 * Вставить массив корневых новых узлов
 */
tree3.TreetableControl.prototype.appendNewNodes = function(newNodes, level,
		insertInfo) {
	for (var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		var isLast;
		if (i == (newNodes.length - 1)) {
			isLast = true;
		} else {
			isLast = false;
		}
		this.appendNewNode(newNode, level, insertInfo);
		newNode.nodeEl.isLast = isLast;
	}
};

/**
 * Добавить новый узел
 */
tree3.TreetableControl.prototype.appendNewNode = function(newNode, level,
		insertInfo) {
	var newTr = document.createElement('tr');

	// задаем onclick обработчик по умолчанию.
	// При желании можно поменять перегрузив appendNewNode
	newTr.onclick = tree3.AbstractTreeControl.onClickTreeNode;

	// append new node
	if (insertInfo && insertInfo.prevNode) {
		tree3.insertAfter(newTr, insertInfo.prevNode.nodeEl);
	} else {
		this.tableBodyEl.appendChild(newTr);
	}
	if (!insertInfo) {
		insertInfo = {};
	}
	insertInfo.prevNode = newNode;

	var subnodes = newNode.children;

	var hasChildren = (subnodes != null && subnodes.length > 0);

	var td1 = document.createElement('td');
	newTr.appendChild(td1);

	var firstTdInnerDiv = document.createElement('div');
	firstTdInnerDiv.style.marginLeft = level * 20 + 'px';
	firstTdInnerDiv.className = tree3.AbstractTreeControl.TREE_CLASSES.firstTdInner;
	td1.appendChild(firstTdInnerDiv);

	var nodeSpan = document.createElement('span');
	nodeSpan.className = tree3.AbstractTreeControl.TREE_CLASSES.treeNode;
	nodeSpan.innerHTML = newNode.title;
	firstTdInnerDiv.appendChild(nodeSpan);
	newTr.nodeSpan = nodeSpan;
	newTr.treeControl = this;
	newTr.level = level;
	newTr.firstTdInnerDiv = firstTdInnerDiv;

	// Внимание!!! создание перекрестной ссылки. 1 - необходимо например при
	// получении модели узла в событиях. 2 - вторая ссылка используется при
	// обновлении дерева
	newTr.nodeModel = newNode;
	newNode.nodeEl = newTr;
	newTr.style.display = 'none';

	this.allNodesMap[newNode.id] = newNode;

	// добавить детей
	if (hasChildren) {
		this.enableChildren(newTr, true);
		this.appendNewNodes(subnodes, level + 1, insertInfo);
	}

	return newTr;
};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tree3.TreetableControl.prototype.enableChildren = function(nodeEl, enable) {
	if (enable) {
		var hitareaDiv = document.createElement('div');
		hitareaDiv.className = tree3.AbstractTreeControl.TREE_CLASSES.hitarea
				+ ' ' + tree3.AbstractTreeControl.TREE_CLASSES.closedHitarea;
		nodeEl.firstTdInnerDiv.insertBefore(hitareaDiv, nodeEl.nodeSpan);
		nodeEl.hitareaDiv = hitareaDiv;
		nodeEl.hasChildren = true;
	} else {
		nodeEl.firstTdInnerDiv.removeChild(nodeEl.hitareaDiv);
		nodeEl.hitareaDiv = null;
		nodeEl.hasChildren = false;
	}
};

tree3.TreetableControl.prototype.updateRootNodes = function(newRootNodes,
		updateCloseState) {
	this.updateNodes(newRootNodes, this.rootNodes, updateCloseState, 0, null);
	this.newRootNodes = newRootNodes;
};

/**
 * Обновляет элементы начиная с корня
 */
tree3.TreetableControl.prototype.updateNodes = function(newNodes, oldNodes,
		updateCloseState, level, insertInfo) {
	// новых узлов нет
	if (newNodes == null || newNodes.length === 0) {
		if (oldNodes != null && oldNodes.length > 0) {
			for (var j = 0; j < oldNodes.length; j++) {
				this.deleteExistNode(oldNodes[j]);
			}
		}
		return;
	}

	// подготовить new nodes HashMaps (key->nodeId, value->node)
	var newNodesByKey = {};
	var newNode, oldNode;
	for (var i = 0; i < newNodes.length; i++) {
		newNode = newNodes[i];
		newNodesByKey[newNode.id] = newNode;
	}

	// подготовить old nodes HashMaps (key->nodeId, value->node), который будет
	// содержать только не удаленные узлы. В этом же цикле удалить узлы которых
	// нет в новом наборе узлов
	var oldNodesByKey = {};
	for (i = 0; i < oldNodes.length; i++) {
		oldNode = oldNodes[i];
		if (newNodesByKey[oldNode.id] == null) {
			// узел был удален
			this.deleteExistNode(oldNode);
		} else {
			oldNodesByKey[oldNode.id] = oldNode;
		}
	}

	// поэлементно обновить узлы
	var prevNewNode = null;
	for (i = 0; i < newNodes.length; i++) {
		newNode = newNodes[i];
		var isLast;
		if (i == (newNodes.length - 1)) {
			isLast = true;
		} else {
			isLast = false;
		}
		oldNode = oldNodesByKey[newNode.id];
		if (oldNode) {
			if (i < oldNodes.length) {
				// старый узел находящийся на том же месте
				var mirrorOldNode = oldNodes[i];
				if (mirrorOldNode.id == newNode.id) {
					// находится на том же месте
				} else {
					// необходимо перемещение после предыдущего
					this.moveToAfterExistSubNode(oldNode, prevNewNode,
							oldNodes[0]);
				}
			} else {
				// необходимо перемещение в конец
				this.moveToEndExistSubNode(oldNode, prevNewNode);
			}
			this.updateExistNode(oldNode, newNode, updateCloseState);
		} else {
			// нет узла с таким ключом среди старых - необходимо добавить
			this.appendNewNode(newNode, level, insertInfo);
		}

		newNode.nodeEl.isLast = isLast;
		prevNewNode = newNode;
	}
};

/**
 * Переместить существующий узел после указанного узла
 */
tree3.TreetableControl.prototype.moveToAfterExistSubNode = function(movedNode,
		afterNode, oldFirstNode) {
	// console.log("moveToAfterExistSubNode");
	var movedNodeEl = movedNode.nodeEl;
	if (afterNode) {
		tree3.insertAfter(movedNodeEl, afterNode.nodeEl);
	} else {
		this.tableBodyEl.insertBefore(movedNodeEl, oldFirstNode.nodeEl);
	}
};

/**
 * Переместить существующий узел
 */
tree3.TreetableControl.prototype.moveToEndExistSubNode = function(movedNode,
		afterNode) {
	// console.log("moveToEndExistSubNode");
	var movedNodeEl = movedNode.nodeEl;
	tree3.insertAfter(movedNodeEl, afterNode.nodeEl);
};

/**
 * Удалить существующий узел
 */
tree3.TreetableControl.prototype.deleteExistNode = function(deletedNode) {
	var deletedTr = deletedNode.nodeEl;

	// рекурсивно удалить и все дочерние узлы
	var subnodes = deletedNode.children;
	if (subnodes != null && subnodes.length > 0) {
		for (var i = 0; i < subnodes.length; i++) {
			var subnode = subnodes[i];
			this.deleteExistNode(subnode);
		}
	}

	if (this.currentSelectedNodeEl
			&& this.currentSelectedNodeEl.nodeModel.id == deletedNode.id) {
		this.clearSelectionTreeNode();
		this.removeState();
	}

	deletedTr.nodeModel = null; // убрать перекрестную зависимость
	deletedNode.nodeEl = null;
	deletedTr.hitareaDiv = null;
	deletedTr.nodeSpan = null;
	deletedTr.firstTdInnerDiv = null;
	deletedTr.treeControl = null;
	delete this.allNodesMap[deletedNode.id];
	this.tableBodyEl.removeChild(deletedTr);
};

/**
 * Обновляет узел и все дочерние узлы из новой модели узла
 */
tree3.TreetableControl.prototype.updateExistNode = function(oldNode, newNode,
		updateCloseState) {
	var nodeEl = oldNode.nodeEl;
	var oldSubnodes = oldNode.children;
	var newSubnodes = newNode.children;

	// 1. обновление модели узла. Перекрестная ссылка.
	newNode.nodeEl = nodeEl;
	nodeEl.nodeModel = newNode;
	this.allNodesMap[newNode.id] = newNode;

	// 2. обновление визуальной информации узла
	this.updateVisualNodeEl(nodeEl, newNode);

	var hasChildren = (newSubnodes != null && newSubnodes.length > 0);
	var oldHasChildren = (oldSubnodes != null && oldSubnodes.length > 0);

	if (oldHasChildren) {
		// в предыдущем состоянии узел имел дочерние узлы
		if (hasChildren) {
			// узел имеет дочерние элементы
			nodeEl.hasChildren = true;
		} else {
			// узел не имеет дочерние элементы. Удаляем все
			for (var i = 0; i < oldSubnodes.length; i++) {
				var oldnode = oldSubnodes[i];
				this.deleteExistNode(oldnode);
			}

			this.enableChildren(nodeEl, false);
			return;
		}
	} else {
		if (hasChildren) {
			// узел не имел детей, а теперь имеет
			this.enableChildren(nodeEl, true);

			// если текущий выделенный узел не имел дочерних,
			// а после обновления стал иметь при этом он находился в открытом
			// состоянии,
			// то его необходимо открыть вручную
			if (updateCloseState
					&& this.currentSelectedNodeEl
					&& this.currentSelectedNodeEl.nodeModel.id == newNodeModel.id) {
				if (nodeEl.opened) {
					this.setNodeClose(nodeEl, false);
				}
			}

			this.appendNewNodes(newSubnodes, nodeEl.level + 1, {prevNode : newNode});
			return;
		}
	}

	if (updateCloseState) {
		// close node if need loading
		if (nodeEl.nodeModel.needLoad) {
			this.setNodeClose(nodeEl, true);
		}
	}

	this.updateNodes(newSubnodes, oldSubnodes, updateCloseState,
			nodeEl.level + 1, {prevNode : newNode});
};

tree3.TreetableControl.prototype.updateLoadedNode = function(oldNode, newNode) {
	this.updateExistNode(oldNode, newNode, false);
	this.updateLinkInParentChildren(newNode);
};

/**
 * Обновляет видимую часть узла
 */
tree3.TreetableControl.prototype.updateVisualNodeEl = function(nodeEl, newNode) {
	var nodeSpan = nodeEl.nodeSpan;
	nodeSpan.innerHTML = newNode.title;
};

/**
 * Установить видимость выделения узла
 */
tree3.TreetableControl.prototype.setSelectionTreeNode = function(nodeEl) {
	var CLASSES = tree3.AbstractTreeControl.TREE_CLASSES;

	// снять предыдущий выделенный
	if (this.currentSelectedNodeEl) {
		tree3.removeClass(this.currentSelectedNodeEl.nodeSpan,
				CLASSES.selectedNode);
	}

	this.currentSelectedNodeEl = nodeEl;
	tree3.addClass(this.currentSelectedNodeEl.nodeSpan, CLASSES.selectedNode);
};

tree3.TreetableControl.prototype.clearSelectionTreeNode = function() {
	var CLASSES = tree3.AbstractTreeControl.TREE_CLASSES;
	if (this.currentSelectedNodeEl) {
		tree3.removeClass(this.currentSelectedNodeEl.nodeSpan,
				CLASSES.selectedNode);
	}
	this.currentSelectedNodeEl = null;
};

/**
 * Выделение узла дерева
 */
tree3.TreetableControl.prototype.selectTreeNode = function(nodeEl, setClosed) {
	this.setSelectionTreeNode(nodeEl);
	this.setNodeClose(nodeEl, setClosed);

	var requireLoading = nodeEl.nodeModel.needLoad;
	if (requireLoading) {
		this.loadChildNodes(nodeEl);
	}
};

tree3.TreetableControl.prototype.setNodeClose = function(nodeEl, closed) {
	tree3.AbstractTreeControl.prototype.setNodeClose.apply(this, arguments);

	var hasChildren = nodeEl.hasChildren;
	if (!hasChildren) {
		return;
	}
	this.processAllChildrenNode(nodeEl.nodeModel, function(childNodeModel,
			level) {
		if (closed) {
			// close all children
			childNodeModel.nodeEl.style.display = 'none';
			return true;
		} else {
			// open node
			childNodeModel.nodeEl.style.display = null;
			if (childNodeModel.nodeEl.opened) {
				// child node was opened -> open children
				return true;
			} else {
				// child node was not opened
				return false;
			}
		}
	}, false, 0);
};
