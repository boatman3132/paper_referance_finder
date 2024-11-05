    function convertBracketsAndFindReferences() {
        // 顯示「按字母順序」和「按原文順序」區域
        document.getElementById("sortedSection").classList.add('visible');
        document.getElementById("originalSection").classList.add('visible');

        let text = document.getElementById("inputText").value;
        // 文本預處理：替換中文括號、全形分號、&符號
        let convertedText = text
            .replace(/（/g, "(")  // 將中文左括號替換為英文左括號
            .replace(/）/g, ")")  // 將中文右括號替換為英文右括號
            .replace(/；/g, ";")  // 將全形分號替換為半形分號
            .replace(/\s?&\s?/g, " and ");  // 將 & 兩邊空白處理為  and 

        // 正則表達式模式來匹配引用
        let pattern = /\([^)]+\d{4}[^)]*\)|(?<!\w)[,A-Za-z\s&]+?\(\d{4}\)|(?<!\w)[\w\s&]+?\(\d{4}\)/g;
        let references = convertedText.match(pattern) || [];

        let allReferences = [];
        let chinesePattern = /[\u4e00-\u9fa5]+/g;

        // 處理每個引用
        references.forEach(ref => {
            let refContent = ref.startsWith('(') ? ref.slice(1, -1) : ref; // 移除括號
            let splitRefs = refContent.split(';'); // 根據分號分割每個引用
            splitRefs.forEach(subRef => {
                let cleanedRef = subRef.replace('e.g.,', '').replace(chinesePattern, '').trim();
                if (cleanedRef) {
                    allReferences.push(cleanedRef);
                }
            });
        });

        // 格式化輸出結果：替換左括號為 ", "，移除右括號
        let formattedReferences = allReferences.map(ref => ref.replace(/\(/g, ", ").replace(/\)/g, ""));

        // 新增邏輯去除重複的引用
        let uniqueReferences = [];
        let etAlReferences = {};

        formattedReferences.forEach(ref => {
            if (ref.includes("et al")) {
                // 對於含有 "et al" 的引用，提取作者名和年份
                let match = ref.match(/^(.+?) et al\., (\d{4})$/);
                if (match) {
                    let author = match[1].trim();
                    let year = match[2].trim();

                    // 存儲這些引用，後續比較時使用
                    if (!etAlReferences[author]) {
                        etAlReferences[author] = {};
                    }
                    etAlReferences[author][year] = ref;
                }
            } else {
                uniqueReferences.push(ref);
            }
        });

        // 比較 "et al." 和具體的引用，去除不必要的重複項
        uniqueReferences = uniqueReferences.filter(ref => {
            let match = ref.match(/^(.+?),.* (\d{4})$/);
            if (match) {
                let author = match[1].split(",")[0].trim();  // 提取第一個作者
                let year = match[2].trim();

                // 如果有對應的 "et al." 引用，則刪除它
                if (etAlReferences[author] && etAlReferences[author][year]) {
                    delete etAlReferences[author][year];  // 刪除該引用，避免重複
                }
            }
            return true;
        });

        // 將剩下的 "et al." 引用加入到 uniqueReferences 中
        Object.keys(etAlReferences).forEach(author => {
            Object.keys(etAlReferences[author]).forEach(year => {
                uniqueReferences.push(etAlReferences[author][year]);
            });
        });

        // 排序引用列表（字母順序）
        let sortedReferences = [...new Set(uniqueReferences)].sort().map(ref => `<span class="reference-item">${ref}</span>`);

        // 計算每個引用在原文中的出現次數，並進行標記
        let referenceCount = {};
        let highlightErrorCount = 0;
        let originalOrderReferencesWithCount = formattedReferences.map(ref => {
            referenceCount[ref] = (referenceCount[ref] || 0) + 1;
            let occurrenceCount = referenceCount[ref];

            // 檢查是否需要標記
            let highlight = false;
            if (occurrenceCount === 1 && ref.includes("et al")) {
                highlight = true;
            } else if (occurrenceCount >= 2 && /.*,.*,/.test(ref)) {
                highlight = true;
            }

            // 格式化顯示文本
            let displayText = `${occurrenceCount.toString().padStart(3, ' ')}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${ref}`;
            if (highlight) {
                highlightErrorCount++;
                return `<span class="reference-item highlight-red">${displayText}</span>`;
            } else {
                return `<span class="reference-item">${displayText}</span>`;
            }
        });

        // 更新總數與錯誤數
        document.getElementById("summaryHeader").innerHTML = `總共找到 ${sortedReferences.length} 個項目<br>共計包含 ${highlightErrorCount} 項錯誤`;

        // 顯示結果
        document.getElementById("sortedOutput").innerHTML = sortedReferences.join('');
        document.getElementById("originalOrderOutput").innerHTML = originalOrderReferencesWithCount.join('');
    }

    document.getElementById("inputText").addEventListener("input", updateCounts);
