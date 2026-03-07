/**
 * Shared DataTable custom styles — light theme, premium look.
 */
export const tableStyles = {
    table: {
        style: { backgroundColor: 'transparent' },   // NO overflow:hidden here
    },
    tableWrapper: {
        style: { display: 'block', overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
    },
    headRow: {
        style: {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '44px',
        },
    },
    headCells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748b',
            whiteSpace: 'nowrap',
        },
    },
    rows: {
        style: {
            minHeight: '60px',
            fontSize: '13.5px',
            fontWeight: '500',
            backgroundColor: '#ffffff',
            color: '#334155',
            borderBottom: '1px solid #f1f5f9',
            transition: 'background 0.12s',
        },
        highlightOnHoverStyle: {
            backgroundColor: '#f8fafc',
            transitionDuration: '0.12s',
            transitionProperty: 'background',
            outline: 'none',
            borderBottomColor: '#e2e8f0',
        },
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
        },
    },
    pagination: {
        style: { display: 'none' }, // custom pagination used
    },
    noData: {
        style: { backgroundColor: '#ffffff', color: '#94a3b8', minHeight: '200px', fontSize: '14px' },
    },
    progress: {
        style: { backgroundColor: '#ffffff', minHeight: '200px' },
    },
};

export const useTableStyles = () => tableStyles;
