import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css';

const DEFAULT_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'blockquote', 'code-block'],
        ['clean']
    ]
};

const COMPACT_MODULES = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ]
};

const FORMATS = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
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
