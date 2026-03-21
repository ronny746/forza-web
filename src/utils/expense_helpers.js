export const getExpenseDetails = (r) => {
    // If server already provided consolidated details, use it
    if (r.Details || r.details) return r.Details || r.details;

    // Check all possible field names from different APIs
    const type = (r.ExpModeDesc || r.ExpenseType || r['Expense Type'] || r.Type || '').toUpperCase();
    const reason = (r.Reason || r.reason || '').trim();
    const remarks = (r.VisitRemarks || r.Remarks || r.remarks || r.VisitRemarks || '').trim();
    const convMode = r.ConveyanceMode || r['Conveyance Mode'] || r['ConveyanceMode'] || '';
    const modeId = String(r.ConvModeId || '');

    if (type === 'DA') return '';

    if (type === 'CONVEYANCE' || type === 'TRAVEL' || type === 'CONVEYANCE CHARGES') {
        let mode = '';
        if (modeId === '1') mode = 'Car';
        else if (modeId === '2') mode = 'Bike';
        else if (modeId === '3' || modeId === '4') mode = 'Public Transport';
        else mode = convMode;

        return mode || reason || remarks || 'General';
    }

    if (type === 'HOTEL' || type === 'STAY' || type === 'HOTEL STAY') {
        const re = reason.toLowerCase();
        if (re === 'metro') return 'Metro City';
        if (re === 'no_metro' || re === 'non-metro' || re === 'nonmetro') return 'Non-Metro';
        if (re === 'self_stay' || re === 'self stay' || re === 'selfstay') return 'Self Stay';
        return reason || remarks || 'General';
    }

    // Default: prioritize submode if any, then reason/remarks
    return convMode || reason || remarks || '—';
};

export const fmtXlsxDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const p = n => n.toString().padStart(2, '0');
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};
