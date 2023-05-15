;(function(global) {
  // 每个操作标识符对应的实际操作符号
  let actionMap = {
    minusSign: ['-', '+'],
    point: ['%'],
    divide: ['÷', '/'],
    multiplication: ['×', '*'],
    subtraction: ['-'],
    addition: ['+'],
    dot: ['.'],
    equal: ['='],
    point: ['%'],
    squareRoot: ['**0.5'],
    square: ['**2'],
    reciprocal: ['**-1']
  }

  let symbol = {"+":"+","-":"-","×":"*","÷":"/","%":"/100","=":"=","**0.5":"√","**2":"^2","**-1":"^-1"};
  let calKeys = ['+','-','*','/','1','2','3','4','5','6','7','8','9','0','.','Backspace','Enter','Delete','%','Escape']; 

  let actionDiv = $('#actionDiv');  // 获取最外层的输入区域容器，用于事件绑定
  let currentNumberLine = $('.current-number');  // 当前输入
  let calcLine = $('.calc-line');  // 表达式显示区域
  let historyWrapper = $('#historyWrapper');  // 历史记录
  let clearLocalBtn = $('.clearLocal');   // 清除历史按钮
  let nonNumericButtons = $$('.non-numeric'); // 获取所有非数字按钮
  let btnDisabled = false;

  let current = []; // 当前展示的数据
  let calcLineText = []; // 当前表达式
  let isReset = false; // 是否需要重置输入区域
  let isEqualed = false; // 当前表达式是否已经是计算过的结果
  let saveKey = '_Calculator_History_'; // localStorage key
  let maxLength = 16; // 假设规定最大输入长度为16个字符
  let lastNum = ''; // 记录上一次基本运算数字，用于连等运算
  let lastOp = ''; // 记录上一次基本运算符，用于连等运算 

  // 历史记录操作
  let historyRecord = {
    save(calcLine, current) {
      let _list = this.list() || [];
      _list.push({
        calcLine,
        current
      });
      window.localStorage.setItem(saveKey, JSON.stringify(_list));
    },
    list() {
      let _list = window.localStorage.getItem(saveKey);
      return _list ? JSON.parse(_list) : [];
    },
    clear() {
      if (confirm('确认清空本地历史记录吗？')) {
        window.localStorage.removeItem(saveKey);
        reset();
        renderHistory();
      }
    }
  }
  // 初始化
  function initEvent() {
    actionDiv.addEventListener('click', itemClickHandler, false); // 冒泡获取
    clearLocalBtn.addEventListener('click', historyRecord.clear);
    historyWrapper.addEventListener('click', itemClick); // 在historyWrapper容器元素上绑定事件处理程序
    current.push('0');
    KeyEvent();
    renderHistory();
  }
  // 绑定键盘事件
  function KeyEvent() {
    document.addEventListener("keydown",keydown);
    function keydown(event){
      const key = event.key;
      if(calKeys.includes(key)) { // 判断是否是计算器键盘
        itemKeydownHandler(event)
      }
  }
}

  let isItemClicking = false; // 添加标志位

  function itemClick(event) {
    if (isItemClicking) return; // 如果正在执行itemClick函数，则跳过后续执行
    isItemClicking = true; // 设置标志位，表示当前正在执行itemClick函数
    
    let target = event.target.closest('li');
    // console.log('itemClick start:', performance.now(),target);
    if (target && target.item) {
      calcLineText = target.item.calcLine;
      current = target.item.current;
      setCurrentNumber(); // 显示当前输入
      setCalcLine(); // 显示当前表达式
      renderHistory(); // 显示历史记录
      // 把当前状态置为输入中并已经得出结果
      isReset = true;
      isEqualed = true;
    }
    isItemClicking = false; // 重置标志位，以便下一次事件触发时重新执行该函数
    // console.log('itemClick end:', performance.now());
  }

  // 渲染历史记录
  function renderHistory() {
    let _list = historyRecord.list().reverse();
    let fragment = document.createDocumentFragment();

    for (let i = 0; i < _list.length; i++) {
      let item = _list[i];
      let li = document.createElement('li');
      li.className = 'history-item';
      let expression = item.calcLine.join('');
      if(expression.includes('**')) {
        expression = handleSpecialChars(expression);
      }
      let text = '<p>' + expression + '=' + '</p>'+ item.current.join('');
      li.innerHTML = text;
      li.item = item; // 将数据存储在元素上
      fragment.appendChild(li);
    }
    historyWrapper.innerHTML = '';
    historyWrapper.appendChild(fragment);
  }

  // 显示当前输入
  function setCurrentNumber() {
    let text = current.join('');
    let numbers = text.match(/[0-9]/g); // 匹配所有数字
    let length = numbers ? numbers.length : 0;
    
    if (numbers) {
      // 若是0开头，不占用
      if(numbers[0] == '0') 
        length--;
    }

    if (length <= maxLength) {
      currentNumberLine.innerHTML = text;
      /* Number(text).toLocaleString(); */
    } else {
      currentNumberLine.innerHTML = formatNumber(Number(text)).toString();
    }
  }
  
  function handleSpecialChars(str) {
    // console.log(str);
    let pattern = /\d+(\.\d+)?\*\*-?\d+(\.\d+)?/g;
    let matches = str.match(pattern) || [];
    for (let i = 0; i < matches.length; i++) {
      let match = matches[i];
      
      if (match.includes("**0.5")) {
        let num = match.replace("**0.5", "");
        str = str.split(match).join("²√" + num);
      } else if (match.includes("**2")) {
        let num = match.replace("**2", "");
        str = str.split(match).join(num + "²");
      } else if (match.includes("**-1")) {
        let num = match.replace("**-1", "");
        str = str.split(match).join("1/" + num);
      }
    }
    let subPattern = /\(([^())]+)\)/; // 匹配最内层的括号中的内容
      let subMatches = str.match(subPattern) || []; // 避免获取空值
      while (subMatches.length > 0) { // 修改判断条件
        let subStr = subMatches[0];
        let subContent = subMatches[1];
        let subResult = handleSpecialChars(subContent); // 递归处理
        str = str.replace(subStr, subResult);
        subMatches = str.match(subPattern) || []; // 避免获取空值
      }
    return str;
  }

  // 显示表达式，对特殊运算**0.5、**2、**-1做替换
  function setCalcLine(type) {
    let text = calcLineText.join('');
    if(type == 'special' || text.includes('**')) {
      text = handleSpecialChars(text);
    }
    calcLine.innerHTML = text;
  }
  // 不涉及特殊运算时的组装表达式,第一个参数是表达式参数，第二个参数是运算类型
  function computedCalc(text,type) {
    // 不能先有计算符号
    if (!calcLineText.length && !current.length) return;
    // 不能使用连续的计算符号
    if (Object.keys(symbol).includes(calcLineText[calcLineText.length - 1]) && !current.length) {
      if (type == 'equal') {
        let selfnumStr = calcLineText[0];
        if(Number(selfnumStr) < 0 && !selfnumStr.includes(')')) {
          selfnumStr = '('+calcLineText[0]+')';
        }
        calcLineText.push(selfnumStr);
      } else if (text) {
        let op = text;
        calcLineText.pop();
        calcLineText.push(op);
      }
      setCalcLine();
    } else { 
      if (current[0] == '除数不能为0') return;
      let _current = current;
      current = [];
      let pushData = [];
      if(_current) {
        let str = _current.join('');
        if (!str.includes('(')) {
          if(Number(str) == 0)
            str = '0';
          else {
            str = removeDecimal(str);
          }
        } else {
          str = processArray(_current).join('');
        }
        _current = [str];
      }
      if (!isEqualed) { // 没有计算过，直接加入
        pushData.push(..._current);
      } else { // 计算过把结果赋予表达式
        calcLineText = _current;
      }
      pushData.push(text);
      calcLineText.push(...pushData);
      setCalcLine(type);
      // 重置状态
      isEqualed = isReset = false;
    }
    return;
  }
  // 百分号、开方、平方、倒数等特殊运算
  function specialCalc(operator,type) {
    if ((!calcLineText.length && !current.length) || current[0] == 0&& current.length==1) return;
    if (current.includes('-') && operator == '**0.5') {
      current = ['负数不能开方'];
      disableBtns();
      return
    }
    // 已计算过的直接以其结果为参数，开始新一轮运算
    if (isEqualed) {
      let _current = current;
      current = [];
      let pushData = [];
      calcLineText = _current;
      pushData.push(operator);
      calcLineText.push(...pushData);
      setCalcLine(type);
      // 重置状态
      isEqualed = isReset = false;
      calcFinal();
      return;
    }
    // 没计算过的分两种情况
    // 情况一 仅有一个数字，拼装表达式后调用calcFinal()
    if ((parseFloat(current.join(''))) && !(calcLineText.includes('+')||calcLineText.includes('-')||calcLineText.includes('*')||calcLineText.includes('/'))) {
      current.push(operator);
      calcLineText = [];
      isEqualed = isReset = false;
      calcFinal(type);
    } else {
    // 情况二 是表达式,且未计算结果，视为对最后一位数字操作,处理最后一位数字之后再拼装
      current.unshift('(');
      current.push(operator);
      current.push(')');
      isEqualed = isReset = false;
      calcFinal(type);
    }
  }
  // 最后参与计算的表达式处理
  function calcTextHandler(text) {
    let res = '';
    for (let i = 0; i < text.length; i++) {
      const t = text.charAt(i);
      // 将传入的字符串text中的特定符号替换成相应的字符，并返回处理后的新字符串
      if (Object.prototype.hasOwnProperty.call(symbol, t)) {
        res += symbol[t];
      } else {
        res += t;
      }
    }
    return res;
  }
  // 引入deciaml库，做数字格式化，处理浮点数小数位及做数字格式化
  function formatNumber(number) {
    let decimal = new Decimal(number);
    // console.log(decimal);
    if (decimal.toString().indexOf('e') !== -1) {
      // 如果结果是科学计数法，则直接返回
      return decimal.toString();
    } else if (decimal.abs().greaterThan('999999999999999')) {
      // 如果绝对值大于1000000，则采用科学计数法表示，保留6/15位小数
      // return decimal.toString();
      // 去掉前导零和不必要的末尾零，以及小数点
      const trimmedStr = decimal.toString().replace(/^0+|0+$/gm,'').replace('.','');
      // 计算非零数字的数量，即有效数字的数量
      const significantDigits = trimmedStr.replace(/^0+/, '').length;
      return decimal.toExponential(significantDigits-1);
    } else {
      const result = decimal.toDecimalPlaces(10); //最多保留10/15位小数
      return result.toFixed(result.decimalPlaces());
    }
  }
  // 计算表达式最后的值
  function calcFinal(type) {  
    // 四则运算的连等运算事件
    
    if(!!lastNum && !!lastOp && type == 'equal') {
      // console.log(current)
      current.push(lastOp);
      current.push(lastNum);
    }
    computedCalc('',type);
    console.log(lastOp,lastNum);
    let text = calcLineText.join('');
    let calcText = calcTextHandler(text);

    // 处理除数为0的情况
    let deno = calcText.split('/')[1]; 
    if (deno !== undefined) {
      if(deno.includes(')')) {
        let nedeno = deno.split('')
        nedeno.shift();
        nedeno.pop();
        deno = Number(nedeno.join(''))
      }
    }
    if (deno == '0' ) {
      // console.log(calcText);
      current = ['除数不能为0'];
      disableBtns();
    } else {
      // 处理'(-0.000)'的情况
      if(calcText.includes('(')) {
        // console.log(calcText);
        let nedeno = calcText.split('(');
        // console.log(nedeno);
        let arr = nedeno[1].split('');
        arr.pop();
        if (Number(arr.join('')) == '0') {
          nedeno[1] ="("+removeDecimal(arr.join(''))+")";
          calcText = nedeno.join('');
          // calcLineText[2] = '0'
          // console.log(calcLineText);
        }
      }
      
      let totalNum = 0
      try {
        totalNum = formatNumber(new Function('return '+calcText)());
      } catch (e) {
        return;
      }
      if(totalNum == Infinity || totalNum == -Infinity) {
        current = ['溢出'];
        disableBtns();
        return;
      }
      current.push(totalNum)
      // 保存历史记录并记录上一次基本运算式以便连等运算
      
      if (calcLineText.length >= 2 || calcLineText.join('').includes('**') || calcLineText.join('') == current.join('')&&type == 'equal') {
        if(type !== 'special') {
          updateLastCal(calcLineText);
          // console.log(lastOp,lastNum);
        }
        
        historyRecord.save(calcLineText, current);
      }
      // console.log(calcLineText);
      isReset = true;
      isEqualed = true;
      renderHistory();
    }
  }
  // 处理带小数点却没有小数位的负数、-0.00
  function removeDecimal(str) {
    let isBracketed = false;
    if (str.includes(')') && str.split('(').length == 2) { // 8+(-0.200)
      /* isBracketed = true;
      let strArr = str.split('');
      strArr.shift();strArr.shift();strArr.pop();
      str = strArr.join(''); */
    } else if (Number(str) <= 0) { // -0.00、-0.020
      let strArr = str.split('');
      strArr.shift();
      str = strArr.join('');
      isBracketed = true;
    }

    const reg = /^(\d+)\.0*$/; // 匹配小数部分全是0的
    const match = str.match(reg);
    if (match) {
      if(isBracketed) {
       match[1] = '(-'+match[1]+')' 
      }
      return match[1];
    }
    if(isBracketed) {
      // 0.0200000
      str = parseFloat(str).toFixed(10).replace(/\.?0+$/, "");
      str = '(-'+str+')';
    }
    return str;
  }
  
  // 处理形如['6','-','(','-','0.23456789',')']的数组，将括号内的负号和数字合并
  function processArray(arr) {
    const result = [];
    let isInBracket = false;
    let bracketElements = [];
    const regex = /([\+\-\*\/\e]|\d+(?:\.\d+)?)/g;
    for (let i = 0; i < arr.length; i++) {
      let current = arr[i];
      if (current === '(') {
        isInBracket = true;
        bracketElements.push(current);
      } else if (current === ')') {
        isInBracket = false;
        const bracketExpression = bracketElements.join('');
        // 匹配括号内部的运算符和数字
        const matches = bracketExpression.match(regex);
        // 拼接匹配到的运算符和数字
        const processedBracket = matches.join('');
        // 去除小数点后面的零
        const processedNumber = removeDecimal(processedBracket)
        result.push(processedNumber);
        bracketElements = [];
      } else {
        if(current == '0.' && '+-*/÷×'.includes(arr[i+1])) current = '0';
        if (isInBracket) {
          // console.log(current);
          bracketElements.push(current);
        } else {
          result.push(current);
        }
      }
    }
    return result;
  }
  // 更新上一轮运算符和数字
  function updateLastCal(calcLineText) {
    if(calcLineText.join('').includes('**')) return
    // 去除数组中的空值
    const validItems = calcLineText.join('').split(/([\+\-\*\/\(\)]|\d+(?:\.\d+)?)/).filter(token => token.trim());
    // 获取非空元素
    const lastItems = processArray(validItems);
    if(lastItems.join('').includes('e')) {
      // console.log(lastItems);
    }
    if(lastItems[lastItems.length-3]!=='e') {
      lastOp = lastItems[lastItems.length-2];
      lastNum = lastItems[lastItems.length-1];
    } else {
      lastOp = lastItems[lastItems.length-5];
      lastNum = lastItems.splice(-4).join('');
      // console.log(lastNum);
    }
    if (Number(lastNum) < 0||lastNum == '-0') {
      lastNum = '('+lastNum+')';
    }
  }
  // 禁用按钮
  function disableBtns() {
    btnDisabled = true;
    nonNumericButtons.forEach(button => button.classList.add('disabled')); // 禁用所有非数字按钮
  }
  // 启动按钮
  function enableBtns() {
    btnDisabled = false;
    nonNumericButtons.forEach(button => button.classList.remove('disabled')); // 启用所有非数字按钮
  }
  // 清除当前输入数字
  function clearError() {
    current = ['0'];
    if(isEqualed) {
      calcLineText = [];
    }
    setCalcLine();
    setCurrentNumber();
    isReset = false;
    //isEqualed = false;
  }
  // 重置
  function reset(type) {
    current = ['0'];
    calcLineText = [];
    setCalcLine();
    setCurrentNumber();
    // 重置清除标识
    isReset = false;
    isEqualed = false;
    if (type !== 'saveLastCal') {
      lastNum = '';
      lastOp = '';
    }
  }
  // 回退
  function backspace() {
    // 说明是带括号的负数
    if (current.includes(')')) {
      // 特殊情况
      if (current.join('') == ('(-0.)')) {
        current = ['0'];
      } else {
        if (current.length > 4) {
          let top = current.pop()
          current.pop();
          current.push(top);
        } else {
          current = ['0'];
        }
      }
      return;
    }
    if (current.length === 1) {
      current = ['0'];
    } else {
      current = current.slice(0,current.length-1);
    }
  }
  // 处理数字输入
  function numberInput(action) {
    if (isReset) {
      reset('saveLastCal');
    }
    /* 当前输入已达最大位数则不能再输入 */
    let str = current.join('')
    let numbers = str.match(/[0-9]/g); // 匹配所有数字
    let length = numbers ? numbers.length : 0;
    if (numbers) {
      if(numbers[0] == '0') 
        length--;
    }
    // console.log(length);
    if (length >= maxLength) {
      return;
    }
    // 说明是带括号的负数
    if (current.includes(')')) {
      let top = current.pop()
      current.push(action);
      current.push(top)
      isEqualed = false;
      return;
    }
    if (action === '0') {
      if (current.length === 1 && current[0] === '0' && !current.includes('.')) { // 判断当前数字序列只有一个字符 0，且没有小数点
        //current.shift();
      } else {
        current.push(action);
        isEqualed = false;
      }
      return;
    } else {
      // 增加前导零判断
      if(current.length === 1 && current[0] === '0') {
        current.shift();
      }
      current.push(action);
      isEqualed = false;
      return;
    }
  }
  // 处理小数点输入
  function dotInput(action) {
    if (isEqualed || !current.length) {
      if(isEqualed) clearError();
      current = ['0.'];
      return;
    } else if (current.includes(actionMap['dot'][0])) {
      return;
    } else {
      if (current.includes(')')) {
        if (current.length-3 == maxLength-1) {
          return;
        }
      } else {
        if (current.length == maxLength-1) {
          return;
        }
      }
      let text = currentNumberLine.innerHTML;
      if(text.includes(actionMap['dot'][0])) 
        return;
      // 说明是带括号的负数
      if (text.includes(')')) {
        let top = current.pop()
        current.push(actionMap['dot'][0]);
        current.push(top)
      } else {
        current.push(actionMap['dot'][0]);
      }
    }
  }
  // 取反
  function negate() {
    let num = [];
    // 当前输入数字为0时
    if (current.length === 0 || (current.length === 1 && current[0] == 0)) {
      // console.log(calcLineText);
      if(calcLineText[0] > 0) {
        num.push('(','-',calcLineText[0],')');
      } else if (calcLineText[0] < 0){
        num.push(Math.abs(calcLineText[0]));
      } else {
        num = ['0']
      }
      current = num;
      return;
    }
    // 负数时
    if (Number(current.join('')) < 0) {
      current[0] = current[0].split('-')[1];
      return;
    }
    let last = current[current.length - 1];
    if (last === ')') {
      // 上一次输入是一个带括号的数字，删除符号及圆括号即可
      num = current.slice(2, -1);
      current = num;
    } else {
      // 上一次输入是一个不带括号的数字，直接取反即可
      // console.log(current);
      num.unshift('-');
      num = num.concat(current);
      num.push(')');
      current = ['('].concat(num);
    }
    console.log(lastOp,lastNum);
  }
  // 点击事件处理
  function itemClickHandler(e) {
    const target = e.target;
    const action = target.getAttribute('data-action');
    if (!action) return;
    if (btnDisabled) {
      enableBtns();
      reset();
    }
    let op = actionMap[action];
    switch (action) {
      // 百分号、开方、平方、倒数等特殊运算
      case 'point':
        specialCalc(op[0],'');
        break;
      case 'squareRoot':
      case 'square':
      case 'reciprocal':
        specialCalc(op[0],'special');
        lastOp = "";
        lastNum = "";
        break;
      // 清除当前输入
      case 'clearError':
        clearError();
        break;
      // 重置计算区域
      case 'clear':
        reset();
        break;
      // 回退
      case 'backspace':
        backspace();
        break;
      // 负号
      case 'minusSign': 
        negate();
        break;
      // 小数点
      case 'dot': 
        dotInput(action);
        break;
      // 四则运算
      case 'divide':
      case 'multiplication':
      case 'subtraction':
      case 'addition':
        calcFinal();
        lastOp = "";
        lastNum = "";
        computedCalc(op[0],'');
        break;
      // 等于
      case 'equal':
        calcFinal('equal');
        break;
      // 数字输入
      default: 
        numberInput(action);
        break;
    }
    setCurrentNumber();
  }
  /* function throttle(func, wait) {
    let lastTime = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastTime > wait) {
        func.apply(this, args);
        lastTime = now;
      }
    };
  } */
/*   const throttleItemClickHandler = throttle(itemClickHandler, 100); // 等待时间为 300 毫秒
  function handleClickEvent(e) {
    throttleItemClickHandler(e);
  } */
  // 键盘事件处理
  function itemKeydownHandler(e) {
    let act = e.key
    let targetKey = document.getElementsByClassName(`key${act}`)[0]
    if(targetKey) {
      // 添加 hover 样式
      targetKey.classList.add('hover');
      // 设置移除定时器
      setTimeout(function() {
        // 移除 .hover 样式
        targetKey.classList.remove('hover');
      }, 200);
    }

    if (btnDisabled) {
      enableBtns();
      reset();
    }
    switch (act) { 
      // 清除
      case 'Escape':
        reset();
        break;
      // 清除错误
      case 'Delete':
        clearError();
        break;
      // 回退
      case 'Backspace':
        backspace();
        break;
      // 小数点
      case '.': 
        dotInput(act);
        break;
      // 四则运算
      case '/':
        lastOp = "";
        lastNum = "";
        calcFinal();
        computedCalc('÷','');
        lastOp = "";
        lastNum = "";
        break;
      case '-':
      case '+':
        lastOp = "";
        lastNum = "";
        calcFinal();
        computedCalc(act,'');
        lastOp = "";
        lastNum = "";
        break;
      case '*':
        lastOp = "";
        lastNum = "";
        calcFinal();
        computedCalc('×','')
        lastOp = "";
        lastNum = "";
        break;
      // 等于
      case 'Enter':
        calcFinal('equal');
        break;
      // 数字输入
      default: 
        numberInput(act);
        break;
    }

    setCurrentNumber();
  }
  initEvent()
})(window)
