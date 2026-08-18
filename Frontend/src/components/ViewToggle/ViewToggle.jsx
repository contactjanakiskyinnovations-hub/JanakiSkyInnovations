import React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import './ViewToggle.css';

/**
 * ViewToggle — toggles between 'grid' (horizontal card layout) and 'list' (vertical row layout).
 * @param {string}   view          - current view: 'grid' | 'list'
 * @param {function} onViewChange  - callback with new view value
 */
const ViewToggle = ({ view = 'grid', onViewChange }) => {
    return (
        <div className="view-toggle-group" role="group" aria-label="Product view toggle">
            <button
                type="button"
                className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
                onClick={() => onViewChange('grid')}
                title="Grid view"
                aria-pressed={view === 'grid'}
            >
                <LayoutGrid size={17} />
            </button>
            <button
                type="button"
                className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
                onClick={() => onViewChange('list')}
                title="List view"
                aria-pressed={view === 'list'}
            >
                <LayoutList size={17} />
            </button>
        </div>
    );
};

export default ViewToggle;
