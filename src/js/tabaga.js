/**
 * Object namespace
 */
var tabaga = {};

/**
 * Кросс-браузерный способ получения координат курсора из события в обработчике
 * а так же определение нажатой кнопки мыши.
 * 
 * @param e
 * @returns
 */
tabaga.fixEvent = function(e) {
	// получить объект событие для IE
	e = e || window.event;

	// добавить pageX/pageY для IE
	if (e.pageX == null && e.clientX != null) {
		var html = document.documentElement;
		var body = document.body;
		e.pageX = e.clientX
				+ (html && html.scrollLeft || body && body.scrollLeft || 0)
				- (html.clientLeft || 0);
		e.pageY = e.clientY
				+ (html && html.scrollTop || body && body.scrollTop || 0)
				- (html.clientTop || 0);
	}

	// добавить which для IE
	if (!e.which && e.button) {
		e.which = e.button & 1 ? 1
				: (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0));
	}

	return e;
};

tabaga.getOffsetRect = function(elem) {
	var box = elem.getBoundingClientRect();

	var body = document.body;
	var docElem = document.documentElement;

	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft
			|| body.scrollLeft;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var top = box.top + scrollTop - clientTop;
	var left = box.left + scrollLeft - clientLeft;

	return {
		top : Math.round(top),
		left : Math.round(left)
	};
};

tabaga.getOffsetSum = function(elem) {
	var top = 0, left = 0;
	while (elem) {
		top = top + parseInt(elem.offsetTop);
		left = left + parseInt(elem.offsetLeft);
		elem = elem.offsetParent;
	}

	return {
		top : top,
		left : left
	};
};

tabaga.getOffset = function(elem) {
	if (elem.getBoundingClientRect) {
		return tabaga.getOffsetRect(elem);
	} else {
		return tabaga.getOffsetSum(elem);
	}
};

tabaga.emptyFalseFn = function() {
	return false;
};

tabaga.stopEventPropagation = function(event) {
	if (!event) {
		// IE8
		window.event.cancelBubble = true;
	} else if (event.stopPropagation) {
		event.stopPropagation();
	}
};

// add trim function support
if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/gm, '');
	};
}

/**
 * Оптимизированная функция, аналог jQuery.addClass. Выполняется быстрее чем
 * jQuery.addClass
 */
tabaga.addClass = function(el, value) {
	var oldClass = ' ' + el.className + ' ';
	if (oldClass.indexOf(' ' + value + ' ') == -1) {
		el.className = el.className + ' ' + value;
	}
};
tabaga.removeClass = function(el, value) {
	var oldClass = ' ' + el.className + ' ';
	var newClass = (oldClass.replace(' ' + value, '')).trim();
	if (el.className != newClass) {
		el.className = newClass;
	}
};

tabaga.addClasses = function(el, values) {
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

tabaga.removeClasses = function(el, values) {
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

tabaga.insertAfter = function(el, refEl) {
	refEl.parentNode.insertBefore(el, refEl.nextSibling);	
};

