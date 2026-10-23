import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css';

const DEFAULT_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'blockquote', 'code-block'],
        ['clean']
    ],
    keyboard: {
        bindings: {
            // Disable Quill 2 automatic markdown list autofill so typing hyphens/dashes
            // in between sentences never converts text to list or breaks lines.
            'list autofill': null
        }
    },
    clipboard: {
        matchVisual: false
    }
};

const COMPACT_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['small', false, 'large'] }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link'],
        ['clean']
    ],
    keyboard: {
        bindings: {
            'list autofill': null
        }
    },
    clipboard: {
        matchVisual: false
    }
};

const FORMATS = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'align', 'direction',
    'link', 'blockquote', 'code-block'
];

const RichTextEditor = ({
    value = '',
    onChange,
    placeholder = 'Write content here...',
    height = '200px',
    compact = false,
    className = ''
}) => {
    const modules = compact ? COMPACT_MODULES : DEFAULT_MODULES;

    return (
        <div className={`rich-text-editor-container ${className}`} style={{ '--editor-min-height': height }}>
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                modules={modules}
                formats={FORMATS}
            />
        </div>
    );
};

export default RichTextEditor;
