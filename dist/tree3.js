/*!
 * tree3
 * https://github.com/megion/tree3
 * Version: 0.0.1 - 2015-05-13T15:43:40.335Z
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

