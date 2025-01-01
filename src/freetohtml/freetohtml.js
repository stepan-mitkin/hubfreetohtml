function FreeHtmlBuilder(options) {
    var self = {};
    var defaultFont;
    var lines;
    var diagram;
    var styles;
    defaultFont = '15px Arimo, Arial, Helvetica, sans-serif';
    var bodyStr, bodyTree, sortedItems;
    function _calc_bodyStr() {
        var node, output;
        output = [];
        for (node of bodyTree) {
            printTree(node, 0, output);
        }
        return output.join('\n');
    }
    function _calc_bodyTree() {
        var i, node, result;
        for (i = sortedItems.length - 1; i >= 0; i--) {
            findParent(i);
        }
        sortedItems.forEach(item => item.children.sort(byTopLeft));
        result = sortedItems.filter(item => !item.parent);
        for (node of result) {
            processSubtree(node);
        }
        return result;
    }
    function _calc_sortedItems() {
        var id, item, items, result;
        items = diagram.items || {};
        result = [];
        for (id in items) {
            item = items[id];
            if (canAcceptItem(item)) {
                item.abs = copyPosition(item);
                item.id = id;
                item.children = [];
                result.push(item);
            }
        }
        result.sort(compareByZIndex);
        return result;
    }
    function addFont(props, style) {
        var font;
        if (style.font) {
            font = replaceAll(style.font, 'Arimo', 'Arimo, Arial, Helvetica, sans-serif');
            addProp(props, 'font', font);
        } else {
            addProp(props, 'font', defaultFont);
        }
    }
    function addProp(props, name, value) {
        props.push(name + ': ' + value + ';');
    }
    function addStyle(style) {
        var _collection_6, prop;
        lines.push('  ' + style.name + ' {');
        _collection_6 = style.props;
        for (prop of _collection_6) {
            lines.push('    ' + prop);
        }
        lines.push('  }');
    }
    function addStyles() {
        var style;
        lines.push('  <style>');
        for (style of styles) {
            addStyle(style);
        }
        lines.push('  </style>');
    }
    async function build() {
        var content, diagramStr;
        diagramStr = await options.readFile(options.inputFile);
        diagram = JSON.parse(diagramStr);
        lines = [];
        styles = [];
        await buildHeader();
        _compute_bodyStr();
        addStyles();
        startBody();
        lines.push(bodyStr);
        endDocument();
        content = lines.join('\n');
        await options.writeFile(options.output, content);
    }
    function buildClass(item) {
        var _state_, classBody, classId, props, style;
        _state_ = 'Position';
        while (true) {
            switch (_state_) {
            case 'Position':
                classId = 'class-' + item.id;
                props = [];
                addProp(props, 'width', item.local.width + 'px');
                addProp(props, 'height', item.local.height + 'px');
                if (item.attributes.role === 'centeredContent') {
                    addProp(props, 'display', 'block');
                    addProp(props, 'position', 'relative');
                    addProp(props, 'max-width', '100%');
                    addProp(props, 'margin', 'auto');
                    addProp(props, 'min-height', '100vh');
                    _state_ = 'Style';
                } else {
                    addProp(props, 'display', 'inline-block');
                    addProp(props, 'position', 'absolute');
                    addProp(props, 'top', item.local.top + 'px');
                    addProp(props, 'left', item.local.left + 'px');
                    _state_ = 'Style';
                }
                break;
            case 'Style':
                if (item.style) {
                    style = JSON.parse(item.style);
                } else {
                    style = {};
                }
                item.style = style;
                if (item.type === 'rounded' || item.type === 'rectangle' || item.type === 'text') {
                    if (style.color) {
                        addProp(props, 'color', style.color);
                    } else {
                        addProp(props, 'color', 'black');
                    }
                    if (item.type !== 'text') {
                        if (style.iconBack) {
                            addProp(props, 'background', style.iconBack);
                            _state_ = 'Border radius';
                        } else {
                            addProp(props, 'background', 'white');
                            _state_ = 'Border radius';
                        }
                    }
                }
                _state_ = 'Border radius';
                break;
            case 'Border radius':
                if (item.type === 'rounded') {
                    addProp(props, 'border-radius', item.aux + 'px');
                    _state_ = 'Font';
                } else {
                    _state_ = 'Font';
                }
                break;
            case 'Font':
                addFont(props, style);
                _state_ = 'Create class';
                break;
            case 'Create class':
                _state_ = undefined;
                classBody = {
                    name: '.' + classId,
                    props: props
                };
                styles.push(classBody);
                return classId;
            default:
                return;
            }
        }
    }
    async function buildHeader() {
        var header;
        header = await options.readFile('./resources/header.html');
        lines.push(header);
        lines.push('  <title>' + options.name + '</title>');
        await pushCss('./resources/box.css');
        await pushCss('./resources/reset.css');
        await pushCss('./resources/main.css');
    }
    function byTopLeft(left, right) {
        if (left.top === right.top) {
            return left.left - right.left;
        } else {
            return left.top - right.top;
        }
    }
    function calculateLocal(parentPos, nodePos) {
        return {
            left: nodePos.left - parentPos.left,
            top: nodePos.top - parentPos.top,
            width: nodePos.width,
            height: nodePos.height
        };
    }
    function canAcceptItem(item) {
        var _selectValue_2;
        _selectValue_2 = item.type;
        if (_selectValue_2 === 'rectangle' || (_selectValue_2 === 'rounded' || (_selectValue_2 === 'text' || _selectValue_2 === 'free-image'))) {
            return true;
        } else {
            return false;
        }
    }
    function compareByZIndex(left, right) {
        return left.zIndex - right.zIndex;
    }
    function comparer(leftObj, rightObj, property) {
        var left, right;
        left = leftObj[property];
        right = rightObj[property];
        if (left < right) {
            return -1;
        } else {
            if (left > right) {
                return 1;
            } else {
                return 0;
            }
        }
    }
    function copyPosition(item) {
        return {
            left: item.left,
            top: item.top,
            width: item.width,
            height: item.height
        };
    }
    function covers(parent, child) {
        var cbottom, cright, pbottom, pright;
        if (parent.left <= child.left && parent.top <= child.top) {
            pright = getRight(parent);
            cright = getRight(child);
            if (pright >= cright) {
                pbottom = getBottom(parent);
                cbottom = getBottom(child);
                if (pbottom >= cbottom) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    function endDocument() {
        lines.push('</body>');
        lines.push('</html>');
    }
    function findParent(index) {
        var i, item, other;
        item = sortedItems[index];
        for (i = index - 1; i >= 0; i--) {
            other = sortedItems[i];
            if (covers(other.abs, item.abs)) {
                item.parent = other;
                other.children.push(item);
                break;
            }
        }
    }
    function getBottom(node) {
        return node.top + node.height;
    }
    function getContent(node) {
        var align, cls;
        if (node.content) {
            if (node.style.textAlign) {
                align = node.style.textAlign;
            } else {
                if (node.type === 'text') {
                    align = 'left';
                } else {
                    align = 'center';
                }
            }
            if (align === 'left') {
                cls = 'cleft';
            } else {
                if (align === 'center') {
                    cls = 'ccenter';
                } else {
                    if (align !== 'right') {
                        throw new Error('Unexpected case value: ' + align);
                    }
                    cls = 'cright';
                }
            }
            return makeStartTag('div', { class: cls }) + node.content + makeCloseTag('div');
        } else {
            return '';
        }
    }
    function getRight(node) {
        return node.left + node.width;
    }
    function makeCloseTag(tag) {
        return '</' + tag + '>';
    }
    function makeStartTag(tag, attributes) {
        var key, result, value;
        result = '<' + tag;
        for (key in attributes) {
            value = attributes[key];
            result += ' ' + key + '="' + value + '"';
        }
        return result + '>';
    }
    function printTree(node, depth, output) {
        var _collection_4, _state_, attr, child, childDepth, indent, line, tag;
        _state_ = 'Prepare';
        while (true) {
            switch (_state_) {
            case 'Prepare':
                if (node.attributes.role === 'body') {
                    childDepth = depth;
                    _state_ = 'Children';
                } else {
                    childDepth = depth + 1;
                    indent = ' '.repeat(depth * 2);
                    _state_ = 'Myself';
                }
                break;
            case 'Myself':
                attr = { 'class': node.classId };
                tag = 'div';
                line = indent + makeStartTag(tag, attr);
                line += getContent(node);
                if (node.children.length === 0) {
                    line += makeCloseTag(tag);
                    output.push(line);
                    _state_ = 'Exit';
                } else {
                    output.push(line);
                    _state_ = 'Children';
                }
                break;
            case 'Children':
                _collection_4 = node.children;
                for (child of _collection_4) {
                    printTree(child, childDepth, output);
                }
                if (node.attributes.role === 'body') {
                    _state_ = 'Exit';
                } else {
                    output.push(indent + makeCloseTag(tag));
                    _state_ = 'Exit';
                }
                break;
            case 'Exit':
                _state_ = undefined;
                break;
            default:
                return;
            }
        }
    }
    function processSubtree(node) {
        var _collection_9, child;
        if (node.parent) {
            node.local = calculateLocal(node.parent.abs, node.abs);
        } else {
            node.local = copyPosition(node);
        }
        node.attributes = JSON.parse(node.link || '{}');
        node.classId = buildClass(node);
        _collection_9 = node.children;
        for (child of _collection_9) {
            processSubtree(child);
        }
    }
    async function pushCss(filename) {
        var line, style, styleLines;
        style = await options.readFile(filename);
        styleLines = style.split('\n');
        lines.push('  <style>');
        for (line of styleLines) {
            lines.push('    ' + line);
        }
        lines.push('  </style>');
    }
    function replaceAll(str, before, after) {
        var parts;
        str = str || '';
        parts = str.split(before);
        return parts.join(after);
    }
    function sortBy(array, property) {
        if (array) {
            array.sort((left, right) => comparer(left, right, property));
        }
    }
    function startBody() {
        lines.push('</header>');
        lines.push('<body>');
    }
    function _compute_bodyStr() {
        sortedItems = _calc_sortedItems();
        bodyTree = _calc_bodyTree();
        bodyStr = _calc_bodyStr();
    }
    self.build = build;
    return self;
}
module.exports = { FreeHtmlBuilder };