import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import api from '../../../utils/api';
import Modal from '../../../components/ui/Modal';

const FilterVisitModal = ({ masterRender, setMasterRender, filterData, setFilterData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // We could fetch users here as well if needed in future (as per original component)
    // const [user, setUsers] = useState([]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFilterData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card"
            >
                <Filter size={16} />
                Filter
            </button>

            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Filter Visit"
                    size="sm"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={filterData.startDate}
                                onChange={handleDateChange}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={filterData.endDate}
                                onChange={handleDateChange}
                                className="input-field"
                            />
                        </div>
                        <div className="pt-4 flex justify-center">
                            <button
                                type="button"
                                className="btn-primary w-full bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30 hover:shadow-red-500/50"
                                onClick={() => {
                                    setMasterRender((prev) => !prev);
                                    setIsOpen(false);
                                }}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default FilterVisitModal;
