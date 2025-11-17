import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Contact, FollowUp, CustomCallOutcome } from '../types';
import { PrintIcon, MicrophoneIcon, StopIcon, ChevronDownIcon, XIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ToastType } from './Toast';

// FIX: Define types for sort states.
type SortKey = 'name' | 'dealStage' | 'dueDate';
type SortDirection = 'ascending' | 'descending';

interface DashboardProps {
  contacts: Contact[];
  followUps: FollowUp[];
  onMarkDone: (contactId: string) => void;
  onSelectContact: (contact: Contact) => void;
  onAddNote: (contactId: string, noteText: string) => void;
  onScheduleFollowUp: (contactId: string, days: number | null, actionKey?: string) => void;
  onLogOutcome: (contactId: string, outcome: string) => void;
  callOutcomes: CustomCallOutcome[];
  setToast: (toast: { message: string; type?: ToastType; onConfirm?: () => void; confirmText?: string; dismissText?: string; } | null) => void;
}

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

const InlineNoteForm: React.FC<{
    contact: Contact;
    onAddNote: (contactId: string, noteText: string) => void;
    onClose: () => void;
    onScheduleFollowUp: (contactId: string, days: number | null, actionKey?: string) => void;
    onLogOutcome: (contactId: string, outcome: string) => void;
    onMarkDone: (contactId: string) => void;
    callOutcomes: CustomCallOutcome[];
    upcomingFollowUpDate: number | null;
}> = ({ contact, onAddNote, onClose, onScheduleFollowUp, onLogOutcome, onMarkDone, callOutcomes, upcomingFollowUpDate }) => {
    const { text, setText, startListening, stopListening, isListening, hasRecognitionSupport } = useSpeechRecognition();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [updateActionTaken, setUpdateActionTaken] = useState(false);
    const [followUpActionTaken, setFollowUpActionTaken] = useState(false);
    const [dateInputType, setDateInputType] = useState<'text' | 'date'>('text');
    const dateInputRef = useRef<HTMLInputElement>(null);

    // State for pending actions to be committed on save
    const [pendingOutcome, setPendingOutcome] = useState<string | null>(null);
    const [pendingFollowUp, setPendingFollowUp] = useState<{ days: number | null; actionKey: string } | null>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Commits all pending actions (notes, outcomes, followups)
    const commitActions = useCallback(() => {
        if (text.trim()) {
            onAddNote(contact.id, text.trim());
        }
        if (pendingOutcome) {
            onLogOutcome(contact.id, pendingOutcome);
        }
        if (pendingFollowUp) {
            onScheduleFollowUp(contact.id, pendingFollowUp.days, pendingFollowUp.actionKey);
        }
        if (isListening) {
            stopListening();
        }
    }, [text, contact.id, isListening, onAddNote, onLogOutcome, onScheduleFollowUp, pendingFollowUp, pendingOutcome, stopListening]);
    
    const handleSaveNote = useCallback(() => {
        commitActions();
        // Reset form for next entry on same contact
        setText('');
        setPendingOutcome(null);
        setPendingFollowUp(null);
        setUpdateActionTaken(false);
        setFollowUpActionTaken(false);
        textareaRef.current?.focus();
    }, [commitActions, setText]);

    const handleSaveAndClose = useCallback(() => {
        commitActions();
        // A one-click update means an action was taken, but the follow-up may still be needed.
        // A rescheduled follow-up updates the existing item.
        // Only a simple note with no other actions should complete the task.
        if (!updateActionTaken && !followUpActionTaken) {
            onMarkDone(contact.id);
        }
        onClose();
    }, [commitActions, onMarkDone, contact.id, onClose, updateActionTaken, followUpActionTaken]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const saveDisabled = !text.trim() && !updateActionTaken && !followUpActionTaken;
            if (e.key === 'Enter' && e.ctrlKey && !saveDisabled) {
                e.preventDefault();
                handleSaveNote();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [text, updateActionTaken, followUpActionTaken, handleSaveNote]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        const inputElement = e.target;
        if (dateValue) {
            const selectedDate = new Date(dateValue + 'T00:00:00'); // Use local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = selectedDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setPendingFollowUp({ days: diffDays >= 0 ? diffDays : 0, actionKey: `followup-custom-date` });
            setFollowUpActionTaken(true);
            inputElement.value = ''; // Reset after selection
            setDateInputType('text'); // Revert to placeholder
        }
    };
    
    const followUpOptions = [
        { label: 'Tomorrow', days: 1 },
        { label: '+3 days', days: 3 },
        { label: '+7', days: 7 },
        { label: '+30', days: 30 },
    ];

    return (
        <div className="p-4 bg-gray-100 animate-fade-in divide-y divide-gray-300">
            <div className="pb-4">
                <h3 className="text-md font-semibold text-brand-dark mb-2">Add a Note</h3>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your call notes here..."
                    className="w-full h-20 p-2 border border-brand-gray-medium rounded-md resize-y bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between">
                    <div>
                        {hasRecognitionSupport && (
                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-brand-red' : 'bg-gray-200 text-brand-dark hover:bg-gray-300'}`}
                                title={isListening ? "Stop Dictation" : "Start Dictation"}
                            >
                                {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-gray-200 text-brand-dark font-semibold rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNote}
                            disabled={!text.trim() && !updateActionTaken && !followUpActionTaken}
                            className="px-4 py-2 text-sm bg-gray-200 text-brand-dark font-semibold rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            Save Note
                        </button>
                         <button
                            onClick={handleSaveAndClose}
                            disabled={!text.trim() && !updateActionTaken && !followUpActionTaken}
                            className="px-4 py-2 text-sm bg-brand-blue text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Save and Close
                        </button>
                    </div>
                </div>
                 {contact.notes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-brand-gray-dark mb-2">Recent History:</h4>
                        <div className="space-y-3 max-h-24 overflow-y-auto pr-2 text-xs">
                            {contact.notes.slice(0, 2).map(note => (
                                <div key={note.id} className="p-2 bg-white rounded border border-gray-200">
                                    <p className="text-brand-dark whitespace-pre-wrap">{note.text}</p>
                                    <p className="text-brand-gray-dark mt-1">{new Date(note.timestamp).toLocaleString()} - {note.type}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="pt-4 hidden md:block">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-semibold text-brand-gray-dark mb-2">One-Click Update</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {callOutcomes.map(outcome => (
                                <button
                                    key={outcome.id}
                                    onClick={() => {
                                        setPendingOutcome(outcome.name);
                                        setUpdateActionTaken(true);
                                    }}
                                    disabled={updateActionTaken}
                                    className={`px-2 py-1.5 text-xs rounded-md transition-colors text-center bg-gray-200 text-brand-dark hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100`}
                                >
                                    {outcome.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-brand-gray-dark mb-2">Follow Up</h4>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                 <label htmlFor={`followup-date-${contact.id}`} className="sr-only">Set a specific date</label>
                                 <input
                                    ref={dateInputRef}
                                    type={dateInputType}
                                    id={`followup-date-${contact.id}`}
                                    placeholder="Custom Date"
                                    onFocus={() => setDateInputType('date')}
                                    onBlur={(e) => { if (!e.target.value) setDateInputType('text'); }}
                                    onChange={handleDateChange}
                                    disabled={followUpActionTaken}
                                    className={`block w-36 px-2 py-1.5 bg-white border border-brand-gray-medium rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100`}
                                    title="Set a specific follow-up date"
                                />
                            </div>
                            {followUpOptions.map(({ label, days }) => (
                                <button
                                    key={label}
                                    onClick={() => {
                                        setPendingFollowUp({ days, actionKey: `followup-${days}-day` });
                                        setFollowUpActionTaken(true);
                                    }}
                                    disabled={followUpActionTaken}
                                    className={`flex-grow px-2 py-1.5 text-xs bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100`}
                                >
                                    {label}
                                </button>
                            ))}
                            {upcomingFollowUpDate && (
                                <div className="ml-auto p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                                    Next follow-up: <strong>{new Date(upcomingFollowUpDate).toLocaleDateString()}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ contacts, followUps, onMarkDone, onSelectContact, onAddNote, onScheduleFollowUp, onLogOutcome, callOutcomes, setToast }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'dueDate', direction: 'ascending' });
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [printData, setPrintData] = useState<{ title: string; followUps: FollowUp[] } | null>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());

  const contactsById = useMemo(() => {
    return contacts.reduce((acc, contact) => {
      acc[contact.id] = contact;
      return acc;
    }, {} as Record<string, Contact>);
  }, [contacts]);
  
  const upcomingFollowUpByContactId = useMemo(() => {
    const map = new Map<string, number>();
    followUps.forEach(fu => {
        if (!fu.completed) {
            map.set(fu.contactId, fu.dueDate);
        }
    });
    return map;
  }, [followUps]);

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
    return categorizedFollowUps.all_open || [];
  }, [categorizedFollowUps]);

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

  const handleRowClick = (contactId: string, isCurrentlyExpanded: boolean) => {
    setExpandedContactId(isCurrentlyExpanded ? null : contactId);
    if (!isCurrentlyExpanded) {
        // Use a short timeout to allow the DOM to update with the expanded row
        // before we try to scroll to it.
        setTimeout(() => {
            const rowElement = rowRefs.current.get(contactId);
            rowElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  };
  
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

  const handleRemoveFromFollowUp = (contactId: string, name: string) => {
    setToast({
        message: `Are you sure you want to remove this client from the follow up list?`,
        type: 'warning',
        confirmText: 'Yes, Remove',
        dismissText: 'Cancel',
        onConfirm: () => {
            onScheduleFollowUp(contactId, null, 'idle-client');
            if (expandedContactId === contactId) {
                setExpandedContactId(null);
            }
            setToast(null);
        }
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand-dark">Follow Up</h1>
        <div className="relative" ref={printMenuRef}>
            <button
                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                className="px-3 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300"
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
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div>
          <table className="min-w-full divide-y divide-brand-gray-light">
            <thead className="bg-gray-50">
              <tr>
                  <th 
                    scope="col" 
                    className="px-4 md:px-6 py-3 text-left text-xs font-medium text-brand-gray-dark uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                        Contact
                        {getSortIndicator('name')}
                    </div>
                  </th>
                   <th 
                    scope="col" 
                    className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-brand-gray-dark uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => requestSort('dealStage')}
                  >
                    <div className="flex items-center">
                        Status
                        {getSortIndicator('dealStage')}
                    </div>
                  </th>
                  <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-brand-gray-dark uppercase tracking-wider">
                    Last Contact / Note
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 md:px-6 py-3 text-left text-xs font-medium text-brand-gray-dark uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => requestSort('dueDate')}
                  >
                    <div className="flex items-center">
                        Next Call
                        {getSortIndicator('dueDate')}
                    </div>
                  </th>
                  <th scope="col" className="relative px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-gray-light">
              {sortedFollowUps.length > 0 ? sortedFollowUps.map(fu => {
                const contact = contactsById[fu.contactId];
                if (!contact) return null;
                const daysUntil = getDaysUntilDue(fu.dueDate);
                const lastNote = contact.notes[0] ?? null;
                const isExpanded = expandedContactId === fu.contactId;
                const upcomingFollowUpDate = upcomingFollowUpByContactId.get(contact.id) || null;

                return (
                  <React.Fragment key={fu.contactId}>
                    <tr 
                      ref={el => rowRefs.current.set(contact.id, el)}
                      className={`hover:bg-blue-50 cursor-pointer transition-colors duration-150 ${isExpanded ? 'bg-blue-100 border-l-4 border-brand-blue' : ''}`} 
                      onClick={() => handleRowClick(contact.id, isExpanded)}>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {isExpanded && <ChevronDownIcon className="w-4 h-4 text-brand-blue flex-shrink-0" />}
                          <span 
                            className="text-sm font-medium text-brand-dark hover:text-brand-blue hover:underline"
                            onClick={(e) => { e.stopPropagation(); onSelectContact(contact); }}
                          >
                            {contact.name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-brand-gray-dark">{contact.dealStage || '-'}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-brand-gray-dark">
                          <div className="max-w-xs truncate" title={lastNote?.text}>
                              {lastNote ? lastNote.text : <span className="italic text-gray-400">No notes</span>}
                          </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-medium">
                        <span className={`${daysUntil < 0 ? 'text-brand-red' : daysUntil === 0 ? 'text-brand-orange' : 'text-brand-blue'}`}>
                          {formatNextCall(daysUntil)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromFollowUp(contact.id, contact.name); }}
                            className="p-1 text-gray-400 hover:text-brand-red rounded-full hover:bg-red-50"
                            title="Remove from Follow Up list"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                        <tr>
                            <td colSpan={5} className="p-0">
                                <InlineNoteForm 
                                    contact={contact} 
                                    onAddNote={onAddNote} 
                                    onClose={() => setExpandedContactId(null)}
                                    onScheduleFollowUp={onScheduleFollowUp}
                                    onLogOutcome={onLogOutcome}
                                    onMarkDone={onMarkDone}
                                    callOutcomes={callOutcomes}
                                    upcomingFollowUpDate={upcomingFollowUpDate}
                                />
                            </td>
                        </tr>
                    )}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-brand-gray-dark">
                    No follow-ups to show.
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