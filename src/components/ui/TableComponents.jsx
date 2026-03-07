import React from 'react';
import ReactPaginate from 'react-paginate';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Shared search bar for table pages.
 */
export const TableSearch = ({ value, onChange, placeholder = 'Search...' }) => (
    <div className="relative group min-w-0 w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
        <input
            type="search"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="input-field pl-9 h-10 text-sm"
        />
    </div>
);

/**
 * Unified pagination bar.
 */
export const TablePagination = ({
    total,
    current,       // 0-based page index
    perPage,
    onPageChange,
    onPerPageChange,
    rowData = [],
    options = [5, 10, 25, 50, 100],
}) => {
    const pageCount = Math.ceil(total / perPage);
    const from = total === 0 ? 0 : current * perPage + 1;
    const to = Math.min((current + 1) * perPage, total);

    return (
        <div className="pagination-bar">
            {/* Left: rows per page + count */}
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <span className="shrink-0 text-gray-400">Rows:</span>
                <select
                    value={perPage}
                    onChange={e => onPerPageChange(Number(e.target.value))}
                    className="input-field !w-auto !py-1 !px-2 !rounded-lg text-sm h-8 font-semibold bg-white border-gray-200"
                >
                    {options.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <span className="shrink-0 text-gray-500 ml-2">
                    {from}–{to} <span className="text-gray-400 font-normal mx-1">of</span> {total}
                </span>
            </div>

            {/* Right: page buttons */}
            {pageCount > 1 && (
                <ReactPaginate
                    previousLabel={<ChevronLeft size={16} />}
                    nextLabel={<ChevronRight size={16} />}
                    pageCount={pageCount}
                    forcePage={current}
                    onPageChange={p => onPageChange(p.selected)}
                    containerClassName="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm"
                    pageLinkClassName="
                        flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold
                        text-gray-600
                        hover:bg-gray-100 hover:text-gray-900
                        transition-all duration-150"
                    activeLinkClassName="!bg-primary-50 !text-primary-700"
                    previousLinkClassName="
                        flex items-center justify-center w-8 h-8 rounded-lg
                        text-gray-400
                        hover:bg-gray-100 hover:text-gray-900
                        transition-all duration-150"
                    nextLinkClassName="
                        flex items-center justify-center w-8 h-8 rounded-lg
                        text-gray-400
                        hover:bg-gray-100 hover:text-gray-900
                        transition-all duration-150"
                    disabledLinkClassName="opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    breakLabel={<span className="px-1 text-gray-400">…</span>}
                />
            )}
        </div>
    );
};

/**
 * Empty state for DataTable noDataComponent.
 */
export const TableEmpty = ({ icon: Icon, title, subtitle = 'Try adjusting your search or filters.' }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        {Icon && <Icon size={48} className="text-gray-200 mb-4" strokeWidth={1.5} />}
        <h4 className="text-base font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm font-medium text-gray-500">{subtitle}</p>
    </div>
);

/**
 * Loading spinner centered on the page.
 */
export const PageLoader = () => (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-100" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Loading</p>
    </div>
);
