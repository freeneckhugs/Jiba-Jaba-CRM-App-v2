import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, Note, FollowUp, View, AppSettings } from './types';
import { DEAL_STAGE_THEMES, LEAD_TYPE_THEMES } from './constants';
import { SearchIcon, MenuIcon, ImportIcon, ExportIcon, PhoneIcon, EmailIcon, ChevronUpIcon, ChevronDownIcon, WarningIcon, UsersIcon, XIcon, SettingsIcon, UserIcon, PencilIcon } from './components/icons';
import ContactDetail from './components/ContactDetail';
import Dashboard from './components/Dashboard';
import ImportModal from './components/ImportModal';
import NewContactModal from './components/NewContactModal';
import SettingsModal from './components/SettingsModal';
import Toast, { ToastType } from './components/Toast';
import { analyzeNoteForDealStage } from './services/geminiService';
import DealFlow from './components/DealFlowDashboard';
import * as mockApi from './services/mockApi';
import Logo from './components/Logo';

const PAGE_SIZE = 30;

type SortOrder = 'activity' | 'firstName' | 'lastName';

const TopBar: React.FC<{
    view: View;
    setView: (view: View) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setIsCreating: (isCreating: boolean) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
    menuButtonRef: React.RefObject<HTMLButtonElement>;
    isCreating: boolean;
}> = ({ view, setView, searchTerm, setSearchTerm, setIsCreating, searchInputRef, isMenuOpen, setIsMenuOpen, menuButtonRef, isCreating }) => {
    const taglines = [
        "Less Talk. More Action.",
        "Less Jiba. More Jaba.",
        "Less Talk. Massive Action.",
        "Less learning. More Using.",
        "Import, Call, Record, Next.",
        "Less Bells. More Whistles.",
        "Oversimplified. About Time.",
        "Digital CRM. Analog Style."
    ];
    const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
    const [taglineOpacity, setTaglineOpacity] = useState(1);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTaglineOpacity(0); // Start fade out
            setTimeout(() => {
                setCurrentTaglineIndex(prevIndex => (prevIndex + 1) % taglines.length);
                setTaglineOpacity(1); // Start fade in
            }, 1000); // One second for the fade-out/text change
        }, 15000); // Change every 15 seconds

        return () => clearInterval(intervalId);
    }, []);

    const currentTagline = taglines[currentTaglineIndex];

    return (
        <div className="bg-white shadow-sm print:hidden">
            {/* Tier 1: Title & Menu */}
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="flex-shrink-0">
                        <Logo className="h-10 w-auto" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-xl font-bold text-brand-dark truncate">
                            Jiba Jaba CRM
                        </h1>
                        <p 
                            className="text-xs text-gray-700 block truncate"
                            style={{ opacity: taglineOpacity, transition: 'opacity 1s ease-in-out' }}
                        >
                            {currentTagline}
                        </p>
                    </div>
                </div>
                <button
                    ref={menuButtonRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    title={isMenuOpen ? "Close Menu" : "Open Menu"}
                    className={`relative w-10 h-10 items-center justify-center text-gray-500 hover:text-brand-blue hover:bg-gray-100 rounded-md transition-transform duration-300 ease-in-out focus:outline-none z-50 ${isCreating ? 'hidden md:flex' : 'flex'}`}
                >
                    <MenuIcon className={`w-6 h-6 transition-all duration-300 transform absolute ${isMenuOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                    <XIcon className={`w-6 h-6 transition-all duration-300 transform absolute ${isMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
                </button>
            </div>

            {/* Tier 2: Actions */}
            <div className="p-4">
                <div className="flex items-center gap-4 w-full">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-white border border-brand-gray-medium rounded-md text-brand-dark focus:ring-2 focus:ring-brand-blue"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="px-3 py-2 sm:px-4 text-sm font-semibold bg-brand-blue text-white rounded-md hover:bg-blue-600 whitespace-nowrap"
                    >
                        New Contact
                    </button>
                </div>
            </div>

            {/* Tier 3: Navigation */}
            <div className="px-4 border-t border-brand-gray-light">
                <div className="flex items-center space-x-4">
                    <button onClick={() => setView('list')} className={`px-1 py-2 text-sm font-medium border-b-2 ${view === 'list' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-gray-dark hover:text-brand-dark'}`}>CRM</button>
                    <button onClick={() => setView('dashboard')} className={`px-1 py-2 text-sm font-medium border-b-2 ${view === 'dashboard' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-gray-dark hover:text-brand-dark'}`}>Follow Up</button>
                    <button onClick={() => setView('dealflow')} className={`px-1 py-2 text-sm font-medium border-b-2 ${view === 'dealflow' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-gray-dark hover:text-brand-dark'}`}>Deal Flow</button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]); // This will hold the paginated contacts
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [activeDealStageFilter, setActiveDealStageFilter] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [view, setView] = useState<View>('list');
    const [toast, setToast] = useState<{ message: string; type?: ToastType; onConfirm?: () => void; confirmText?: string; dismissText?: string; } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isContactsMenuOpen, setIsContactsMenuOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isSortByOpen, setIsSortByOpen] = useState(() => window.innerWidth > 768);
    const [isFilterByOpen, setIsFilterByOpen] = useState(() => window.innerWidth > 768);
    const [sortOrder, setSortOrder] = useState<SortOrder>('activity');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // --- New state for pagination and loading ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalContacts, setTotalContacts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const totalPages = Math.ceil(totalContacts / PAGE_SIZE);

    // --- Data Initialization ---
    useEffect(() => {
        mockApi.initializeData();
        fetchSettings();
        fetchFollowUps();
        const fetchAll = async () => {
            const { contacts } = await mockApi.fetchContacts({ limit: -1 });
            setAllContacts(contacts);
        };
        fetchAll();
    }, []);
    
    const fetchSettings = async () => {
        const appSettings = await mockApi.getSettings();
        setSettings(appSettings);
    };

    // --- Re-architected data fetching ---
    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        const { contacts: fetchedContacts, totalCount } = await mockApi.fetchContacts({
            page: currentPage,
            limit: PAGE_SIZE,
            searchTerm,
            filter: activeFilter,
            dealStageFilter: activeDealStageFilter,
            sortOrder,
        });
        setContacts(fetchedContacts);
        setTotalContacts(totalCount);
        setIsLoading(false);
    }, [currentPage, searchTerm, activeFilter, activeDealStageFilter, sortOrder]);

    const fetchFollowUps = async () => {
        const fetchedFollowUps = await mockApi.fetchFollowUps();
        setFollowUps(fetchedFollowUps);
    };
    
    const fetchAllContactsForExport = async () => {
        const { contacts: allFetchedContacts } = await mockApi.fetchContacts({ limit: -1 }); // -1 for all
        return allFetchedContacts;
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContacts();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchContacts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeFilter, activeDealStageFilter, sortOrder]);

    // --- Core Logic (updated for API calls) ---
    const updateContact = useCallback(async (updatedContactData: Partial<Contact>) => {
        if (!updatedContactData.id) return;
        const updatedContact = await mockApi.updateContact(updatedContactData.id, updatedContactData);
        if (updatedContact) {
            setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
            setAllContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
            setSelectedContact(prev => (prev?.id === updatedContact.id ? updatedContact : prev));
        }
    }, []);
    
    const deleteContact = useCallback(async (contactId: string, name: string) => {
        await mockApi.deleteContact(contactId);
        setToast({ message: `${name} has been deleted.`, type: 'info' });
        // If the deleted contact was the last one on the page, go to the previous page
        if (contacts.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            fetchContacts(); // Refetch current page
        }
        setAllContacts(prev => prev.filter(c => c.id !== contactId));
        setSelectedContact(null);
    }, [contacts, currentPage, fetchContacts]);
    
    const createContact = useCallback(async (newContactData: Partial<Contact>) => {
        const newContact = await mockApi.createContact(newContactData);
        setToast({ message: "Contact added successfully.", type: 'confirm' });
        setAllContacts(prev => [newContact, ...prev]);
        fetchContacts(); // Refetch to show the new contact
    }, [fetchContacts]);

    const deleteAllContacts = useCallback(async () => {
        await mockApi.deleteAllContacts();
        setToast({ message: 'All contacts have been successfully deleted.', type: 'info' });
        setContacts([]);
        setAllContacts([]);
        setFollowUps([]);
        setTotalContacts(0);
        setCurrentPage(1);
        setSelectedContact(null);
    }, []);

    const addNote = useCallback(async (contactId: string, noteText: string, type: Note['type'] = 'note') => {
        const updatedContact = await mockApi.addNote(contactId, noteText, type);
        if (updatedContact) {
            // Optimistically update UI
            setContacts(prev => prev.map(c => c.id === contactId ? updatedContact : c));
            setAllContacts(prev => prev.map(c => c.id === contactId ? updatedContact : c));
            setSelectedContact(prev => (prev?.id === contactId ? updatedContact : prev));
            if (type === 'note' && settings?.dealStages) {
                analyzeNoteForDealStage(noteText, settings.dealStages).then(suggestedStage => {
                    if (suggestedStage && suggestedStage !== updatedContact.dealStage) {
                        setToast({
                            message: `Detected "${suggestedStage}" – update deal stage?`,
                            onConfirm: () => {
                                updateContact({ id: contactId, dealStage: suggestedStage });
                                setToast(null);
                            },
                        });
                    }
                });
            }
        }
    }, [updateContact, settings]);

    const performContactAction = useCallback(async (contactId: string, actionKey: string, action: () => void) => {
        const canPerform = await mockApi.canPerformAction(contactId, actionKey);
        if (canPerform) {
            await mockApi.recordAction(contactId, actionKey);
            action();
        } else {
            setToast({ message: "Already updated today.", type: 'info' });
        }
    }, []);

    const logOutcome = useCallback((contactId: string, outcome: string) => {
        performContactAction(contactId, `outcome-${outcome}`, () => {
             addNote(contactId, outcome, 'outcome');
        });
    }, [performContactAction, addNote]);
    
    const scheduleFollowUp = useCallback((contactId: string, days: number | null, actionKey: string = 'followup-custom') => {
        performContactAction(contactId, actionKey, async () => {
            await mockApi.scheduleFollowUp(contactId, days);
            fetchFollowUps(); // Refresh follow-ups list
            if (days !== null) {
                const dateString = new Date(Date.now() + days * 86400000).toLocaleDateString();
                addNote(contactId, `Follow-up scheduled for ${dateString}.`, 'system');
            } else {
                addNote(contactId, "Marked as 'Don't call again'.", 'system');
            }
        });
    }, [performContactAction, addNote]);

    const markFollowUpDone = useCallback(async (contactId: string) => {
        await mockApi.markFollowUpDone(contactId);
        fetchFollowUps();
        addNote(contactId, 'Follow-up marked as done.', 'system');
    }, [addNote]);

    const updateLeadType = (contactId: string, leadType: string) => {
        updateContact({ id: contactId, leadType, lastActivity: Date.now() });
        setToast({ message: `Lead Type updated to ${leadType}`, type: 'info' });
    };

    const updateDealStage = (contactId: string, dealStage: string) => {
        updateContact({ id: contactId, dealStage, lastActivity: Date.now() });
        addNote(contactId, `Deal stage updated to: ${dealStage}`, 'autotag');
    };
    
    const toggleFilter = (typeName: string) => {
      setActiveFilter(prev => (prev === typeName ? null : typeName));
    };

    const toggleDealStageFilter = (stageName: string) => {
        setActiveDealStageFilter(prev => (prev === stageName ? null : stageName));
    };

    const handleImport = useCallback(async (newContactsData: Partial<Contact>[]) => {
        const count = await mockApi.importContacts(newContactsData);
        setToast({ message: `Successfully imported ${count} new contacts.`, type: 'info' });
        const { contacts } = await mockApi.fetchContacts({ limit: -1 });
        setAllContacts(contacts);
        fetchContacts();
    }, [fetchContacts]);

    const exportToJson = useCallback(async () => {
        const data = await mockApi.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'jiba_jaba_crm_export.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        setToast({ message: "All data exported successfully.", type: 'info' });
    }, []);

    const exportToCsv = useCallback(async () => {
        const contactsToExport = await fetchAllContactsForExport();

        const headers = ["ID", "Name", "Company", "Phone", "Email", "LeadType", "DealStage", "NoteHistory"];
        
        const sanitizeAndQuote = (str: string | undefined | null) => {
            if (str === null || str === undefined) return '""';
            const s = String(str);
            // Replace quotes with double quotes and wrap the whole thing in quotes.
            return `"${s.replace(/"/g, '""')}"`;
        };

        const rows = contactsToExport.map(contact => {
            // FIX: Sanitize note history by removing newlines and joining with a safe separator.
            const noteHistory = contact.notes
                .map(note => `[${new Date(note.timestamp).toLocaleString()} - ${note.type}] ${note.text.replace(/\n/g, ' ')}`) // Replace newlines in notes
                .join(" | "); // Use a pipe as a separator

            return [
                sanitizeAndQuote(contact.id),
                sanitizeAndQuote(contact.name),
                sanitizeAndQuote(contact.company),
                sanitizeAndQuote(contact.phone),
                sanitizeAndQuote(contact.email),
                sanitizeAndQuote(contact.leadType),
                sanitizeAndQuote(contact.dealStage),
                sanitizeAndQuote(noteHistory)
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "jiba_jaba_crm_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setToast({ message: "All contacts exported successfully.", type: 'info' });
    }, []);

    const selectContactAndSwitchToListView = async (contact: Contact) => {
        // Since we now paginate, the full contact might not be in the current list
        // so we fetch the full details from the "backend"
        const fullContact = await mockApi.getContactById(contact.id);
        setSelectedContact(fullContact);
        setView('list');
    };

    const handleDeleteAllRequest = () => {
        setToast({
            message: 'Are you sure you want to permanently delete ALL contacts? This action cannot be undone.',
            type: 'warning',
            onConfirm: () => {
                deleteAllContacts();
                setToast(null);
            },
            confirmText: 'Yes, Delete All',
            dismissText: 'Cancel'
        });
        setIsMenuOpen(false);
    };

    const handleMergeDuplicates = async () => {
        setIsMenuOpen(false);
        setToast({ message: 'Searching for duplicates...', type: 'info' });
        const mergedCount = await mockApi.findAndMergeDuplicates();
        setToast({
            message: mergedCount > 0 ? `Found and merged ${mergedCount} duplicate contacts.` : 'No duplicates found.',
            type: 'info'
        });
        const { contacts } = await mockApi.fetchContacts({ limit: -1 });
        setAllContacts(contacts);
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchContacts();
        }
    };
    
    const handleSaveSettings = async (newSettings: AppSettings) => {
        await mockApi.updateSettings(newSettings);
        setSettings(newSettings);
        setToast({ message: 'Settings saved successfully!', type: 'info' });
        // Refetch contacts in case lead types were deleted/renamed
        fetchContacts();
    };

    const handleGlobalSearch = (term: string) => {
        setSearchTerm(term);
        if (view !== 'list') {
            setView('list');
        }
    };

    // --- Keyboard Shortcuts & Menu Closing ---
    useEffect(() => {
        const handleInteraction = (e: KeyboardEvent | MouseEvent) => {
            // Handle Escape key
            if (e instanceof KeyboardEvent && e.key === 'Escape') {
                setSelectedContact(null);
                setView('list');
                setIsMenuOpen(false);
            }
            // Handle clicking outside menu
            if (
                e instanceof MouseEvent && 
                isMenuOpen && 
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                menuButtonRef.current && !menuButtonRef.current.contains(e.target as Node)
            ) {
                setIsMenuOpen(false);
            }
            // Handle search shortcut
            if (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleInteraction);
        document.addEventListener('mousedown', handleInteraction);
        return () => {
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('mousedown', handleInteraction);
        };
    }, [isMenuOpen]);

    // --- UI Components ---
    
    const SideMenu = ({ contactsCount }: { contactsCount: number }) => (
      <div ref={menuRef} className={`fixed top-0 right-0 h-full transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out bg-white shadow-2xl z-50 w-80 border-l border-brand-gray-light print:hidden`}>
        <div className="p-4 border-b border-brand-gray-light">
            <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <div className="p-4">
            <div className="space-y-2">
                <div>
                    <button 
                        onClick={() => setIsContactsMenuOpen(!isContactsMenuOpen)} 
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold bg-gray-100 text-brand-dark rounded-md hover:bg-gray-200"
                    >
                        <div className="flex items-center space-x-3">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                            <span>Contacts</span>
                            <span className="text-xs bg-brand-gray-medium text-brand-dark font-bold rounded-full px-2 py-0.5">{contactsCount.toLocaleString()}</span>
                        </div>
                        {isContactsMenuOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                    </button>
                    {isContactsMenuOpen && (
                        <div className="pl-4 pt-2 space-y-2">
                            <button onClick={() => { setIsImporting(true); setIsMenuOpen(false); }} className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-sm bg-gray-50 text-brand-dark rounded-md hover:bg-gray-100">
                                <ImportIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div className="flex flex-col items-start">
                                    <span>Import Contacts</span>
                                </div>
                            </button>
                            <button onClick={() => { exportToCsv(); setIsMenuOpen(false); }} className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-sm bg-gray-50 text-brand-dark rounded-md hover:bg-gray-100">
                                <ExportIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                 <div className="flex flex-col items-start">
                                    <span>Export to CSV</span>
                                    <span className="text-xs text-brand-gray-dark">Contacts Only</span>
                                </div>
                            </button>
                            <button onClick={() => { exportToJson(); setIsMenuOpen(false); }} className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-sm bg-gray-50 text-brand-dark rounded-md hover:bg-gray-100">
                                <ExportIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div className="flex flex-col items-start">
                                    <span>Export to JSON</span>
                                    <span className="text-xs text-brand-gray-dark">All Data</span>
                                </div>
                            </button>
                            <button 
                                onClick={handleMergeDuplicates}
                                className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-sm bg-gray-50 text-brand-dark rounded-md hover:bg-gray-100"
                            >
                                <UsersIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div className="flex flex-col items-start">
                                    <span>Merge Duplicates</span>
                                </div>
                            </button>
                            <button 
                                onClick={handleDeleteAllRequest}
                                className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 mt-2 border border-red-200"
                            >
                                <WarningIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <div className="flex flex-col items-start">
                                    <span>Delete All Contacts</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
                 <div className="pt-2 border-t border-brand-gray-light">
                    <button 
                        onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} 
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold bg-gray-100 text-brand-dark rounded-md hover:bg-gray-200"
                    >
                        <div className="flex items-center space-x-3">
                            <SettingsIcon className="w-5 h-5 text-gray-500" />
                            <span>Settings</span>
                        </div>
                        {isSettingsMenuOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                    </button>
                    {isSettingsMenuOpen && (
                        <div className="pl-4 pt-2 space-y-2">
                            <button 
                                onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                                className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-sm bg-gray-50 text-brand-dark rounded-md hover:bg-gray-100"
                            >
                                <PencilIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                <div className="flex flex-col items-start">
                                    <span>Customize Labels</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );

    const ContactList = () => {
        if (isLoading) {
            return <div className="p-4 text-center text-brand-gray-dark">Loading contacts...</div>;
        }

        if (contacts.length === 0 && !isLoading) {
            return <div className="p-4 text-center text-brand-gray-dark">No contacts found.</div>;
        }
        
        const getDealStageTheme = (dealStageName?: string) => {
            if (!dealStageName || !settings) return null;
            const stage = settings.dealStages.find(s => s.name === dealStageName);
            return stage ? DEAL_STAGE_THEMES[stage.theme] : null;
        }

        const getLeadTypeTheme = (leadTypeName?: string) => {
            if (!leadTypeName || !settings) return null;
            const type = settings.leadTypes.find(t => t.name === leadTypeName);
            return type ? LEAD_TYPE_THEMES[type.theme] : null;
        }

        return (
            <>
                {contacts.map(contact => {
                    const dealStageTheme = getDealStageTheme(contact.dealStage);
                    const leadTypeTheme = getLeadTypeTheme(contact.leadType);
                    const hasNote = contact.contactNote && contact.contactNote.trim();
                    
                    return (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 border-b border-brand-gray-light cursor-pointer hover:bg-blue-50 ${selectedContact?.id === contact.id ? 'bg-blue-100' : 'bg-white'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-brand-dark">{contact.name}</p>
                                    <p className="text-sm text-brand-gray-dark">{contact.company}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                     <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors" title={`Email ${contact.name}`}>
                                        <EmailIcon className="w-5 h-5" />
                                    </a>
                                    <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors" title={`Call ${contact.name}`}>
                                        <PhoneIcon className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>

                            <div className={`flex flex-wrap gap-2 items-center ${hasNote ? 'mb-2' : ''}`}>
                                {contact.leadType && leadTypeTheme && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${leadTypeTheme.base} ${leadTypeTheme.text}`}>{contact.leadType}</span>
                                )}
                                {contact.dealStage && dealStageTheme && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${dealStageTheme.base} ${dealStageTheme.text}`}>{contact.dealStage}</span>
                                )}
                            </div>
                            
                            {hasNote && (
                                <p className="text-xs text-gray-500 truncate" title={contact.contactNote}>
                                    <span className="font-semibold">Contact Note: </span>
                                    {contact.contactNote}
                                </p>
                            )}
                        </div>
                    )
                })}
            </>
        );
    }
    
    const sortOptions: { key: SortOrder, label: string }[] = [
        { key: 'activity', label: 'Recent Activity' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
    ];

    if (!settings) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-brand-dark">Loading CRM settings...</div>
    }
    
    return (
        <div className="h-screen w-screen bg-white text-brand-dark flex flex-col font-sans">
            {isImporting && <ImportModal onClose={() => setIsImporting(false)} onImport={handleImport} />}
            {isCreating && <NewContactModal onClose={() => setIsCreating(false)} onSave={createContact} leadTypes={settings.leadTypes} dealStages={settings.dealStages} />}
            {isSettingsOpen && <SettingsModal settings={settings} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} setToast={setToast} />}
            {toast && <Toast message={toast.message} onConfirm={toast.onConfirm} onDismiss={() => setToast(null)} confirmText={toast.confirmText} dismissText={toast.dismissText} type={toast.type} />}
            {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-40" />}
            <SideMenu contactsCount={totalContacts} />
            
            <TopBar 
                view={view}
                setView={setView}
                searchTerm={searchTerm}
                setSearchTerm={handleGlobalSearch}
                setIsCreating={setIsCreating}
                searchInputRef={searchInputRef}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                menuButtonRef={menuButtonRef}
                isCreating={isCreating}
            />
            
            <main className="flex-grow flex overflow-hidden">
                {view === 'list' ? (
                    <div className="flex flex-grow overflow-hidden">
                        <div className={`${selectedContact ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-gray-50 border-r border-brand-gray-light print:hidden`}>
                            <div className="p-4">
                                <div>
                                    <button onClick={() => setIsSortByOpen(!isSortByOpen)} className="w-full flex justify-between items-center text-left font-semibold text-brand-dark">
                                        <span>Sort by</span>
                                        {isSortByOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                                    </button>
                                    {isSortByOpen && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {sortOptions.map(opt => (
                                                <button 
                                                    key={opt.key}
                                                    onClick={() => setSortOrder(opt.key)}
                                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${sortOrder === opt.key ? 'bg-brand-blue text-white' : 'bg-white text-brand-dark border border-brand-gray-medium hover:bg-gray-100'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className={`border-t border-brand-gray-light ${!isSortByOpen && !isFilterByOpen ? 'my-2' : 'my-4'}`} />

                                <div>
                                     <button onClick={() => setIsFilterByOpen(!isFilterByOpen)} className="w-full flex justify-between items-center text-left font-semibold text-brand-dark">
                                        <span>Filter by</span>
                                        {isFilterByOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                                    </button>
                                    {isFilterByOpen && (
                                        <div className="mt-2 space-y-4">
                                            <div>
                                                <h4 className="text-sm text-brand-gray-dark mb-2">Lead Type:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {settings.leadTypes.map(type => {
                                                        const theme = LEAD_TYPE_THEMES[type.theme] || LEAD_TYPE_THEMES.gray;
                                                        const isActive = activeFilter === type.name;
                                                        return (
                                                            <button 
                                                                key={type.id}
                                                                onClick={() => toggleFilter(type.name)}
                                                                className={`px-2 py-1.5 md:px-3 text-xs font-medium rounded-md border transition-colors ${isActive ? `${theme.base} ${theme.text} ${theme.border}` : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}
                                                            >
                                                                {type.name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm text-brand-gray-dark mb-2">Deal Stage:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {settings.dealStages.map(stage => {
                                                        const theme = DEAL_STAGE_THEMES[stage.theme] || DEAL_STAGE_THEMES.gray;
                                                        const isActive = activeDealStageFilter === stage.name;
                                                        return (
                                                            <button
                                                                key={stage.id}
                                                                onClick={() => toggleDealStageFilter(stage.name)}
                                                                className={`px-2 py-1.5 md:px-3 text-xs font-medium rounded-md border transition-colors ${isActive ? `${theme.base} ${theme.text} ${theme.border}` : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}
                                                            >
                                                                {stage.name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="overflow-y-auto flex-grow">
                                <ContactList />
                            </div>

                             <div className="p-2 border-t border-brand-gray-light flex justify-center items-center space-x-2 text-sm">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} className="px-3 py-1 bg-white border border-brand-gray-medium rounded disabled:opacity-50">Prev</button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading} className="px-3 py-1 bg-white border border-brand-gray-medium rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                            {selectedContact ? (
                                <ContactDetail 
                                    contact={selectedContact} 
                                    onBack={() => setSelectedContact(null)} 
                                    onUpdateContact={updateContact}
                                    onUpdateLeadType={updateLeadType}
                                    onUpdateDealStage={updateDealStage}
                                    onAddNote={addNote}
                                    onLogOutcome={logOutcome}
                                    onScheduleFollowUp={scheduleFollowUp}
                                    onDeleteContact={deleteContact}
                                    setToast={setToast}
                                    upcomingFollowUpDate={followUps.find(f => f.contactId === selectedContact.id && !f.completed)?.dueDate || null}
                                    leadTypes={settings.leadTypes}
                                    dealStages={settings.dealStages}
                                    callOutcomes={settings.callOutcomes}
                                />
                            ) : (
                                <div className="hidden md:flex h-full w-full bg-gray-50 items-center justify-center">
                                     <div className="text-center text-brand-gray-dark">
                                        <p>Select a contact to view details.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                   <div className="w-full overflow-y-auto">
                        {view === 'dashboard' ? (
                             <Dashboard 
                                contacts={allContacts} 
                                followUps={followUps} 
                                onMarkDone={markFollowUpDone}
                                onSelectContact={selectContactAndSwitchToListView}
                            />
                        ) : (
                            <DealFlow 
                                contacts={allContacts} 
                                dealStages={settings.dealStages} 
                                onSelectContact={selectContactAndSwitchToListView}
                                onUpdateDealStage={updateDealStage}
                            />
                        )}
                   </div>
                )}
            </main>
        </div>
    );
};

export default App;