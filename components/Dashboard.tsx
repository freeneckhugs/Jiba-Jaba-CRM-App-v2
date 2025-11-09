import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Contact, FollowUp } from '../types';
import { PrintIcon } from './icons';

interface DashboardProps {
  contacts: Contact[];
  followUps: FollowUp[];
  onMarkDone: (contactId: string) => void;
  onSelectContact: (contact: Contact) => void;
}

type FilterType = 'all_open' | 'overdue' | 'completed';
type SortKey = 'name' | 'dealStage' | 'dueDate';
type SortDirection = 'ascending' | 'descending';

// This component is only rendered for printing
const PrintableCallSheet: React.FC<{
  title: string;
  followUpsToPrint: FollowUp[];
  contactsById: Record<string, Contact>;
}> = ({ title, followUpsToPrint, contactsById }) => (
  <div className="print-container">
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p className="mb-6 text-sm text-gray-600">Date Printed: {new Date().toLocaleDateString()}</p>
    <div className="space-y-6">
      {followUpsToPrint.map(fu => {
        const contact = contactsById[fu.contactId];
        if (!contact) return null;
        return (
          <div key={fu.contactId} className="p-4 border border-black rounded-md print-item">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <h2 className="text-lg font-semibold">{contact.name}</h2>
                    <p className="text-gray-700">{contact.company}</p>
                </div>
                <div className="text-right">
                    <p className="font-mono font-semibold">{contact.phone}</p>
                    <p className="text-sm">Due: <span className="font-medium">{new Date(fu.dueDate).toLocaleDateString()}</span></p>
                </div>
            </div>
            <div className="mt-4 border-t border-dashed border-gray-400 pt-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Call Notes:</h3>
              <div style={{ height: '10rem' }} className="border border-gray-300 rounded-md bg-gray-50 p-2">
                {/* Empty space for writing */}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ contacts, followUps, onMarkDone, onSelectContact }) => {
  const [filter, setFilter] = useState<FilterType>('all_open');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'dueDate', direction: 'ascending' });
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [printData, setPrintData] = useState<{ title: string; followUps: FollowUp[] } | null>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);


  const contactsById = useMemo(() => {
    return contacts.reduce((acc, contact) => {
      acc[contact.id] = contact;
      return acc;
    }, {} as Record<string, Contact>);
  }, [contacts]);

  const categorizedFollowUps = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const overdue: FollowUp[] = [];
    const open: FollowUp[] = [];
    const completed: FollowUp[] = [];

    for (const fu of followUps) {
      if (fu.completed) {
        completed.push(fu);
      } else {
        open.push(fu);
        if (fu.dueDate < todayStart) {
          overdue.push(fu);
        }
      }
    }
    
    const sortByDate = (a: FollowUp, b: FollowUp) => a.dueDate - b.dueDate;
    open.sort(sortByDate);
    overdue.sort(sortByDate);
    completed.sort((a,b) => b.dueDate - a.dueDate);

    return { all_open: open, overdue, completed };
  }, [followUps]);

  const filteredFollowUps = useMemo(() => {
    return categorizedFollowUps[filter] || [];
  }, [filter, categorizedFollowUps]);

  const sortedFollowUps = useMemo(() => {
    const sortableItems = [...filteredFollowUps];
    
    sortableItems.sort((a, b) => {
        const contactA = contactsById[a.contactId];
        const contactB = contactsById[b.contactId];
        if (!contactA || !contactB) return 0;

        let valueA: any, valueB: any;

        switch (sortConfig.key) {
            case 'name':
                valueA = contactA.name;
                valueB = contactB.name;
                break;
            case 'dealStage':
                valueA = contactA.dealStage || '';
                valueB = contactB.dealStage || '';
                break;
            case 'dueDate':
            default:
                valueA = a.dueDate;
                valueB = b.dueDate;
                break;
        }
        
        if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return sortableItems;
  }, [filteredFollowUps, contactsById, sortConfig]);

  useEffect(() => {
    if (printData) {
        const timer = setTimeout(() => {
            window.print();
            setPrintData(null); 
        }, 100); 
        return () => clearTimeout(timer);
    }
  }, [printData]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
            setIsPrintMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const getDaysUntilDue = (dueDate: number) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const due = new Date(dueDate);
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    return Math.ceil((dueStart - todayStart) / (1000 * 60 * 60 * 24));
  };

  const formatNextCall = (daysUntil: number) => {
    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `+${daysUntil} days`;
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return <span className="ml-1">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
  };
  
  const FilterButton: React.FC<{
    label: string;
    type: FilterType;
    count: number;
  }> = ({ label, type, count }) => {
    const isActive = filter === type;
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-md transition-colors';
    let styles = '';
    
    if (type === 'completed') {
      if (isActive) {
        styles = 'bg-green-600 text-white';
      } else {
        styles = 'bg-green-100 text-green-800 hover:bg-green-200';
      }
    } else {
      if (isActive) {
        styles = 'bg-brand-blue text-white';
      } else {
        styles = 'bg-white text-brand-dark hover:bg-gray-100';
      }
    }

    return (
      <button
        onClick={() => setFilter(type)}
        className={`${baseClasses} ${styles}`}
      >
        {label} ({count})
      </button>
    );
  };

  const headers: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Contact' },
    { key: 'dealStage', label: 'Status' },
    { key: 'dueDate', label: 'Next Call' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand-dark">Follow Up</h1>
        <div className="relative" ref={printMenuRef}>
            <button
                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                className="px-3 py-2 bg-white border border-brand-gray-medium text-brand-dark rounded-md hover:bg-gray-100"
                title="Print Call Sheet"
            >
                <PrintIcon className="w-5 h-5" />
            </button>
            {isPrintMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-brand-gray-light">
                    <button 
                        onClick={() => { setPrintData({ title: 'Open Tasks Call Sheet', followUps: categorizedFollowUps.all_open }); setIsPrintMenuOpen(false); }}
                        className="w-full justify-start px-4 py-1 text-sm text-brand-dark hover:bg-gray-100"
                    >
                        Print Open Tasks
                    </button>
                    <button 
                        onClick={() => { setPrintData({ title: 'Overdue Tasks Call Sheet', followUps: categorizedFollowUps.overdue }); setIsPrintMenuOpen(false); }}
                        className="w-full justify-start px-4 py-1 text-sm text-brand-dark hover:bg-gray-100"
                    >
                        Print Overdue Tasks
                    </button>
                </div>
            )}
        </div>
      </div>
      <div className="flex items-center mb-6 p-1 bg-brand-gray-light rounded-lg">
        <div className="flex space-x-2">
          <FilterButton label="All Open" type="all_open" count={categorizedFollowUps.all_open.length} />
          <FilterButton label="Overdue" type="overdue" count={categorizedFollowUps.overdue.length} />
        </div>
        <div className="ml-auto">
          <FilterButton label="Completed" type="completed" count={categorizedFollowUps.completed.length} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-light">
            <thead className="bg-gray-50">
              <tr>
                {headers.map(header => (
                  <th key={header.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-dark uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort(header.key)}>
                    <div className="flex items-center">
                        {header.label}
                        {getSortIndicator(header.key)}
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-dark uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-gray-light">
              {sortedFollowUps.length > 0 ? sortedFollowUps.map(fu => {
                const contact = contactsById[fu.contactId];
                if (!contact) return null;
                const daysUntil = getDaysUntilDue(fu.dueDate);
                return (
                  <tr key={fu.contactId} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectContact(contact)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-dark">{contact.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-dark">{contact.dealStage || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`${daysUntil < 0 ? 'text-brand-red' : daysUntil === 0 ? 'text-brand-orange' : 'text-brand-blue'}`}>
                        {formatNextCall(daysUntil)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!fu.completed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onMarkDone(contact.id); }}
                          className="text-brand-blue hover:text-blue-700"
                        >
                          Mark Done
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-brand-gray-dark">
                    No follow-ups in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {printData && <PrintableCallSheet title={printData.title} followUpsToPrint={printData.followUps} contactsById={contactsById} />}
    </div>
  );
};

export default Dashboard;