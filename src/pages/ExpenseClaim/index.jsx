import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Receipt, MapPin, Briefcase, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import { useTableStyles } from '../../utils/tableStyles';
import { TableSearch, TablePagination, TableEmpty, PageLoader } from '../../components/ui/TableComponents';

const ExpenseClaim = () => {
    const tableStyles = useTableStyles();
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/v1/admin/dashboard/get-user-details', {
                params: { searchKey: search, pageIndex: page, pageSize: perPage },
            });
            setData(res.data.data.rows || []);
            if (page === 0) setTotal(res.data.data.count || 0);
        } catch { }
        setLoading(false);
    };

    const exportXlsx = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
        XLSX.writeFile(wb, 'expense_claims.xlsx');
    };

    useEffect(() => { fetchData(); }, [search, page, perPage]);

    const columns = [
        {
            name: '#', width: '56px', center: true,
            cell: (_, i) => <span className="text-sm font-semibold text-primary-500">{page * perPage + i + 1}</span>,
        },
        {
            name: 'Employee', minWidth: '220px', selector: r => r.FirstName, sortable: true,
            cell: r => (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(r.FirstName?.[0] || '?')}{(r.LastName?.[0] || '')}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{r.FirstName} {r.LastName}</p>
                        <p className="text-xs text-gray-400 dark:text-dark-textMuted">{r.EMPCode}</p>
                    </div>
                </div>
            ),
        },
        {
            name: 'Designation', selector: r => r.Designatation, sortable: true, minWidth: '150px',
            cell: r => (
                <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Briefcase size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{r.Designatation || 'Manager'}</span>
                </span>
            ),
        },
        {
            name: 'Manager', selector: r => r.ManagerName, sortable: true, minWidth: '150px',
            cell: r => <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{r.ManagerName || 'Admin'}</span>,
        },
        {
            name: 'Service Area', selector: r => r.ServiceArea, sortable: true, minWidth: '140px',
            cell: r => r.ServiceArea
                ? <span className="flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-full px-2.5 py-1 shrink-0"><MapPin size={10} />{r.ServiceArea}</span>
                : <span className="text-gray-400 text-sm">—</span>,
        },
        {
            name: 'Email', selector: r => r.Email, minWidth: '180px',
            cell: r => <span className="text-sm text-primary-600 dark:text-primary-400 truncate">{r.Email || '—'}</span>,
        },
    ];

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expense Claim</h1>
                    <p className="page-subtitle">View employee expense claims and details</p>
                </div>
                <button onClick={exportXlsx} className="btn-success shrink-0">
                    <Download size={16} /> Export
                </button>
            </div>

            <div className="card-glass">
                <div className="table-search-bar">
                    <TableSearch value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search by name, emp code…" />
                    <span className="badge badge-neutral shrink-0"><Receipt size={12} /> {total} records</span>
                </div>
                <DataTable
                    columns={columns} data={data} noHeader responsive highlightOnHover
                    progressPending={loading} customStyles={tableStyles}
                    progressComponent={<PageLoader />}
                    noDataComponent={<TableEmpty icon={Receipt} title="No expense claims found" />}
                />
                <TablePagination
                    total={total} current={page} perPage={perPage}
                    onPageChange={setPage} onPerPageChange={p => { setPerPage(p); setPage(0); }}
                />
            </div>
        </div>
    );
};

export default ExpenseClaim;
