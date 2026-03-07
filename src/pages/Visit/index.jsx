import React, { useState } from 'react';
import Table from './visit_table/Table';
import VisitSummaryModal from './visit_table/VisitSummaryModal';

const Visit = () => {
    const [visitSummaryData, setVisitSummaryData] = useState({
        VisitId: "",
        DesigId: "",
        adminId: "",
        isManager: "",
        isOpenSummary: false
    });

    return (
        <div className="w-full">
            {visitSummaryData.isOpenSummary === false ? (
                <Table visitSummaryData={visitSummaryData} setVisitSummaryData={setVisitSummaryData} />
            ) : (
                <VisitSummaryModal visitSummaryData={visitSummaryData} setVisitSummaryData={setVisitSummaryData} />
            )}
        </div>
    );
};

export default Visit;
