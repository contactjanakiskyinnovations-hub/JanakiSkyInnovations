const hasHtml = (value) => /<[a-z][\s\S]*>/i.test(String(value || ''));

const normalizeHyphenSpacing = (text) => String(text || '')
    // Keep phrases such as "16 - liter" intact at a line boundary.
    .replace(/(\S)\s+-\s+(?=\S)/g, '$1\u00a0-\u00a0')
    // Prevent browsers from wrapping a compound word at its hyphen.
    .replace(/(\S)-(\S)/g, '$1\u2011$2');

/** Normalize editor content so a line cannot end immediately after a hyphen. */
export const preserveHyphenatedText = (content) => {
    const source = String(content || '');
    if (!hasHtml(source)) return normalizeHyphenSpacing(source);

    const parsed = new DOMParser().parseFromString(source, 'text/html');

    // Treat a manual editor line break after a hyphen as a soft space.
    Array.from(parsed.body.querySelectorAll('br')).forEach((lineBreak) => {
        if (/-\s*$/.test(lineBreak.previousSibling?.textContent || '')) {
            lineBreak.replaceWith(parsed.createTextNode('\u00a0'));
        }
    });

    Array.from(parsed.body.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6')).forEach((block) => {
        if (block.querySelector('p, div, li, h1, h2, h3, h4, h5, h6')) return;

        // Join adjacent editor paragraphs when the first ends with a dash.
        const next = block.nextElementSibling;
        if (
            next?.tagName === block.tagName &&
            !next.querySelector('p, div, li, h1, h2, h3, h4, h5, h6') &&
            /\S\s*-\s*$/.test(block.textContent) &&
            /^\s*\w/.test(next.textContent)
        ) {
            const walker = parsed.createTreeWalker(block, NodeFilter.SHOW_TEXT);
            let last;
            let current;
            while ((current = walker.nextNode())) last = current;
            if (last) last.nodeValue = last.nodeValue.replace(/\s*-\s*$/, '\u00a0-');
            block.appendChild(parsed.createTextNode('\u00a0'));
            while (next.firstChild) block.appendChild(next.firstChild);
            next.remove();
        }

    });

    const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
        textNode.nodeValue = normalizeHyphenSpacing(textNode.nodeValue);
    }

    // If the editor split the dash and its surrounding spaces across inline
    // formatting nodes, normalize that one block as a last resort.
    Array.from(parsed.body.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6')).forEach((block) => {
        if (block.querySelector('p, div, li, h1, h2, h3, h4, h5, h6')) return;
        if (/\S[ \t]+-[ \t]+\S/.test(block.textContent)) {
            block.textContent = normalizeHyphenSpacing(block.textContent);
        }
    });
    return parsed.body.innerHTML;
};

export const isRichTextHtml = hasHtml;
