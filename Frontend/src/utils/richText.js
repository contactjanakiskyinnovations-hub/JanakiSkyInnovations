const hasHtml = (value) => /<[a-z][\s\S]*>/i.test(String(value || ''));

/** Replace &nbsp; HTML entities and unicode non-breaking spaces with regular spaces so text wraps naturally */
const decodeNbsp = (text) => String(text || '').replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');

export const normalizeHyphenSpacing = (text) => {
    const s = String(text || '');
    return s
        // Keep phrases such as "16 - liter", "16- liter", "16 -liter" intact at a line boundary
        .replace(/(\S)\s+-\s+(?=\S)/g, '$1\u00a0-\u00a0')
        .replace(/(\S)-(\s+)(?=\S)/g, '$1\u00a0-\u00a0')
        .replace(/(\S)(\s+)-(?=\S)/g, '$1\u00a0-\u00a0')
        // Prevent browsers from wrapping a compound word at its hyphen (e.g. "16-liter")
        .replace(/(\S)-(\S)/g, '$1\u2011$2');
};

/** Clean up soft line breaks and paragraph breaks that immediately follow a hyphen */
export const cleanHyphenLineBreaks = (source) => {
    if (!source) return '';
    // Always decode &nbsp; first so downstream regex can work on regular spaces
    let text = decodeNbsp(String(source));

    // 1. Plain text newlines after a hyphen: join them so the phrase stays in one paragraph
    text = text.replace(/(\S\s*-\s*)[\r\n]+(?:\s*[\r\n]+)*\s*(?=\S)/g, '$1 ');

    // 2. HTML br tags immediately following a hyphen: remove break and keep space
    text = text.replace(/(-\s*)<br\s*\/?>\s*/gi, (m, g1) => g1 + ' ');

    // 3. HTML block boundary immediately following a hyphen (e.g. <p>... 16 - </p><p>liter...</p>)
    text = text.replace(
        /(-\s*)(?:<br\s*\/?>\s*)*(?:<\/(?:span|strong|em|b|i)>\s*)*(?:<\/(?:p|div|li)>\s*)+(?:<(?:p|div|li)[^>]*>\s*)*(?:<(?:span|strong|em|b|i)[^>]*>\s*)*(?=[a-zA-Z0-9])/gi,
        (m, g1) => g1.trimEnd() + ' '
    );

    return text;
};

/** Normalize editor and plain content so a line cannot end prematurely immediately after a hyphen. */
export const preserveHyphenatedText = (content) => {
    if (!content) return '';
    // Decode &nbsp; and clean hyphen line breaks first (plain-text pass)
    const cleaned = cleanHyphenLineBreaks(content);
    if (!hasHtml(cleaned)) return normalizeHyphenSpacing(cleaned);

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return normalizeHyphenSpacing(cleaned);
    }

    try {
        const parsed = new DOMParser().parseFromString(cleaned, 'text/html');

        // Clean any remaining br tags preceded by a hyphen in DOM
        Array.from(parsed.body.querySelectorAll('br')).forEach((lineBreak) => {
            const prevText = (lineBreak.previousSibling?.textContent || '').replace(/\u00a0/g, ' ');
            if (/-\s*$/.test(prevText)) {
                lineBreak.replaceWith(parsed.createTextNode(' '));
            }
        });

        // Join adjacent editor paragraphs when the first ends with a dash
        const blocks = Array.from(parsed.body.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6'))
            .filter(b => !b.querySelector('p, div, li, h1, h2, h3, h4, h5, h6'));

        blocks.forEach((block) => {
            const rawText = (block.textContent || '').replace(/\u00a0/g, ' ').trimEnd();
            if (/-\s*$/.test(rawText) || rawText.endsWith('-')) {
                let next = block.nextElementSibling;
                while (next && !next.textContent?.trim() && !next.querySelector('img, video, iframe')) {
                    const toRemove = next;
                    next = next.nextElementSibling;
                    toRemove.remove();
                }
                if (next && next.textContent?.trim()) {
                    block.appendChild(parsed.createTextNode(' '));
                    while (next.firstChild) {
                        block.appendChild(next.firstChild);
                    }
                    next.remove();
                }
            }
        });

        // Normalize text nodes: apply hyphen-spacing only (spaces are already regular)
        const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = walker.nextNode())) {
            textNode.nodeValue = normalizeHyphenSpacing(textNode.nodeValue);
        }

        return parsed.body.innerHTML;
    } catch {
        return normalizeHyphenSpacing(cleaned);
    }
};

export const isRichTextHtml = hasHtml;

/** Convert rich HTML or plain text into a single readable line for the short-summary slot */
export const getPlainShortSummary = (content) => {
    if (!content) return '';
    // Decode &nbsp; and clean hyphen line breaks
    const cleaned = cleanHyphenLineBreaks(content);
    // Strip all HTML tags, collapse whitespace, and return plain text
    const stripped = cleaned
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
    return stripped.replace(/\s+/g, ' ').trim();
};
