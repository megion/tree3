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
	if (newNodes == null || newNodes.length == 0) {
		// данный код сработает только для узлов самого верхнего уровня т.к. для
		// дочерних узлов сработают проверки в updateExistNode.
		// если есть старые узлы то их все необходимо удалить и выйти
		if (oldNodes != null && oldNodes.length > 0) {
			for (var i = 0; i < oldNodes.length; i++) {
				var oldnode = oldNodes[i];
				this.deleteExistSubNode(ulContainer, oldnode);
			}
		}
		return;
	}

	// подготовить new nodes HashMaps (key->nodeId, value->node)
	var newNodesByKey = new Object();
	for (var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		newNodesByKey[newNode.id] = newNode;
	}

	// подготовить old nodes HashMaps (key->nodeId, value->node), который будет
	// содержать только не удаленные узлы. В этом же цикле удалить узлы которых
	// нет в новом наборе узлов
	var oldNodesByKey = new Object();
	for (var i = 0; i < oldNodes.length; i++) {
		var oldNode = oldNodes[i];
		if (newNodesByKey[oldNode.id] == null) {
			// узел был удален
			this.deleteExistSubNode(ulContainer, oldNode);
		} else {
			oldNodesByKey[oldNode.id] = oldNode;
		}
	}

	// поэлементно обновить узлы
	var prevNewNode = null;
	for (var i = 0; i < newNodes.length; i++) {
		var newNode = newNodes[i];
		var isLast;
		if (i == (newNodes.length - 1)) {
			isLast = true;
		} else {
			isLast = false;
		}
		var oldNode = oldNodesByKey[newNode.id];
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

			var ulContainer = nodeEl.subnodesUl;
			this.appendNewNodes(ulContainer, newSubnodes);
			return;
		}
	}

	if (updateCloseState) {
		// close node if need loading
		if (nodeEl.nodeModel.needLoad) {
			this.setNodeClose(nodeEl, true);
		}
	}

	var ulContainer = nodeEl.subnodesUl;
	this.updateExistUlNodesContainer(ulContainer, newSubnodes,
					updateCloseState);
};

/**
 * Установка для элемента узла span возможности перемещения в под выбранный узел
 */
tree3.TreeControl.prototype.enableChildren = function(nodeEl, enable) {
	if (enable) {
		var hitareaDiv = document.createElement("div");
		hitareaDiv.className = tree3.AbstractTreeControl.TREE_CLASSES.hitarea
				+ " " + tree3.AbstractTreeControl.TREE_CLASSES.closedHitarea;
		nodeEl.insertBefore(hitareaDiv, nodeEl.firstChild);
		nodeEl.hitareaDiv = hitareaDiv;
		nodeEl.hasChildren = true;

		var ulContainer = document.createElement("ul");
		ulContainer.style.display = "none";
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
	var nodeSpan = document.createElement("span");
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
	var newLi = document.createElement("li");

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
	console.log("move '" + movedNode.title + "' to end");
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
		nodeEl.subnodesUl.style.display = "none";
	} else {
		nodeEl.subnodesUl.style.display = "block";
	}
};
