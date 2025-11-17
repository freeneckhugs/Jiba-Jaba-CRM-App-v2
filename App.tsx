import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, Note, FollowUp, View, AppSettings, CustomLeadType, CustomDealStage } from './types';
import { DEAL_STAGE_THEMES, LEAD_TYPE_THEMES } from './constants';
import { SearchIcon, MenuIcon, ImportIcon, ExportIcon, PhoneIcon, EmailIcon, ChevronUpIcon, ChevronDownIcon, WarningIcon, UsersIcon, XIcon, SettingsIcon, UserIcon, PencilIcon, ViewBoardsIcon, ClipboardListIcon, TrendingUpIcon, FilterIcon, SortIcon, MergeIcon } from './components/icons';
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

// SUB-COMPONENTS
const TopBar: React.FC<{
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setIsCreating: (isCreating: boolean) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
    menuButtonRef: React.RefObject<HTMLButtonElement>;
    view: View;
    setView: (view: View) => void;
    onCrmClick: () => void;
    isMobileSortFilterOpen: boolean;
    setIsMobileSortFilterOpen: (isOpen: boolean) => void;
    isCreating: boolean;
    isImporting: boolean;
    isSettingsOpen: boolean;
}> = ({ searchTerm, setSearchTerm, setIsCreating, searchInputRef, isMenuOpen, setIsMenuOpen, menuButtonRef, view, setView, onCrmClick, isMobileSortFilterOpen, setIsMobileSortFilterOpen, isCreating, isImporting, isSettingsOpen }) => {
    const taglines = [
        "Less Talk. More Action.", "Less Jiba. More Jaba.", "Less Talk. Massive Action.",
        "Less learning. More Using.", "Import, Call, Record, Next.", "Less Bells. More Whistles.",
        "Oversimplified. About Time.", "Digital CRM. Analog Style.", "For Spreadsheet People. We Got You!"
    ];
    const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
    const [taglineOpacity, setTaglineOpacity] = useState(1);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTaglineOpacity(0);
            setTimeout(() => {
                setCurrentTaglineIndex(prev => (prev + 1) % taglines.length);
                setTaglineOpacity(1);
            }, 1000);
        }, 15000);
        return () => clearInterval(intervalId);
    }, [taglines.length]);

    return (
        <div className="bg-white shadow-sm print:hidden border-b border-brand-gray-light">
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <Logo className="h-10 w-auto flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-xl font-bold text-brand-dark truncate">Jiba Jaba CRM</h1>
                        <p className="text-xs text-gray-700 block truncate" style={{ opacity: taglineOpacity, transition: 'opacity 1s ease-in-out' }}>{taglines[currentTaglineIndex]}</p>
                    </div>
                </div>
                <button
                    ref={menuButtonRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    title={isMenuOpen ? "Close Menu" : "Open Menu"}
                    className={`relative w-10 h-10 items-center justify-center text-gray-500 hover:text-brand-blue hover:bg-gray-100 rounded-md transition-transform duration-300 ease-in-out focus:outline-none z-50 ${(isCreating || isImporting || isSettingsOpen) ? 'hidden md:flex' : 'flex'}`}
                >
                    <MenuIcon className={`w-6 h-6 transition-all duration-300 transform absolute ${isMenuOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                    <XIcon className={`w-6 h-6 transition-all duration-300 transform absolute ${isMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
                </button>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-4 w-full">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input ref={searchInputRef} type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2 bg-white border border-brand-gray-medium rounded-md text-brand-dark focus:ring-2 focus:ring-brand-blue" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label="Clear search"><XIcon className="w-5 h-5" /></button>}
                    </div>
                    <button onClick={() => setIsCreating(true)} className="px-3 py-2 sm:px-4 text-sm font-semibold bg-brand-blue text-white rounded-md hover:bg-blue-600 whitespace-nowrap">New Contact</button>
                </div>
            </div>
            <div className="px-2 sm:px-4 border-t border-brand-gray-light">
                <div className="flex items-center space-x-1">
                    <a href="#" onClick={(e) => { e.preventDefault(); onCrmClick(); }} className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 rounded-t-md transition-colors duration-200 ${view === 'list' ? 'border-brand-blue text-brand-blue bg-blue-50' : 'border-transparent text-blue-600 hover:text-brand-blue hover:bg-gray-100'}`}><UsersIcon className="w-5 h-5" /><span className="hidden sm:inline">CRM</span></a>
                    {view === 'list' && (
                        <div className="flex items-center space-x-1 md:hidden">
                            <button onClick={() => setIsMobileSortFilterOpen(!isMobileSortFilterOpen)} className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border-b-2 rounded-t-md ${isMobileSortFilterOpen ? 'border-brand-dark text-brand-dark bg-gray-200' : 'border-transparent text-brand-gray-dark hover:bg-gray-100'}`}><FilterIcon className="w-5 h-5"/><span>Sort & Filter</span></button>
                        </div>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); setView('dashboard'); }} className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 rounded-t-md transition-colors duration-200 ${view === 'dashboard' ? 'border-brand-orange text-brand-orange bg-orange-50' : 'border-transparent text-orange-600 hover:text-brand-orange hover:bg-gray-100'}`}><ClipboardListIcon className="w-5 h-5" /><span className="hidden sm:inline">Follow Up</span></a>
                    <a href="#" onClick={(e) => { e.preventDefault(); setView('dealflow'); }} className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 rounded-t-md transition-colors duration-200 ${view === 'dealflow' ? 'border-green-500 text-green-600 bg-green-50' : 'border-transparent text-green-600 hover:text-green-700 hover:bg-gray-100'}`}><TrendingUpIcon className="w-5 h-5" /><span className="hidden sm:inline">Deal Flow</span></a>
                </div>
            </div>
        </div>
    );
};

const SideMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    setIsImporting: (isOpen: boolean) => void;
    setIsSettingsOpen: (isOpen: boolean) => void;
    handleExport: () => void;
    handleMerge: () => void;
    handleDeleteAll: () => void;
    menuRef: React.RefObject<HTMLDivElement>;
}> = ({ isOpen, onClose, setIsImporting, setIsSettingsOpen, handleExport, handleMerge, handleDeleteAll, menuRef }) => {
    const [isContactsOpen, setIsContactsOpen] = useState(false);
    const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsContactsOpen(false);
            setIsSettingsDropdownOpen(false);
        }
    }, [isOpen]);

    return (
        <div ref={menuRef} className={`fixed top-0 right-0 h-full bg-white shadow-lg z-40 w-72 transform transition-transform duration-300 ease-in-out print:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4 border-b border-brand-gray-light mt-16">
                <h2 className="text-lg font-semibold text-brand-dark">Menu</h2>
            </div>
            <nav className="p-4 space-y-1">
                <div>
                    <button 
                        onClick={() => setIsContactsOpen(!isContactsOpen)} 
                        className="w-full flex justify-between items-center px-3 py-2 text-brand-dark hover:bg-gray-100 rounded-md"
                    >
                        <div className="flex items-center space-x-3">
                            <UserIcon className="w-5 h-5" />
                            <span className="font-semibold">Contacts</span>
                        </div>
                        {isContactsOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                    </button>
                    {isContactsOpen && (
                        <div className="pl-6 mt-2 space-y-1 animate-fade-in">
                            <button onClick={() => { setIsImporting(true); onClose(); }} className="w-full flex items-center justify-start space-x-3 px-3 py-2 text-sm text-brand-dark hover:bg-gray-100 rounded-md">
                                <ImportIcon className="w-5 h-5 text-gray-500" /><span>Import Contacts</span>
                            </button>
                            <button onClick={() => { handleExport(); onClose(); }} className="w-full flex items-center justify-start space-x-3 px-3 py-2 text-sm text-brand-dark hover:bg-gray-100 rounded-md">
                                <ExportIcon className="w-5 h-5 text-gray-500" /><span>Export All Data</span>
                            </button>
                            <button onClick={() => { handleMerge(); onClose(); }} className="w-full flex items-center justify-start space-x-3 px-3 py-2 text-sm text-brand-dark hover:bg-gray-100 rounded-md">
                                <MergeIcon className="w-5 h-5 text-gray-500" /><span>Merge Duplicates</span>
                            </button>
                            <button onClick={() => { handleDeleteAll(); onClose(); }} className="w-full flex items-center justify-start space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                                <WarningIcon className="w-5 h-5" /><span>Delete All Data</span>
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <button 
                        onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)} 
                        className="w-full flex justify-between items-center px-3 py-2 text-brand-dark hover:bg-gray-100 rounded-md"
                    >
                        <div className="flex items-center space-x-3">
                            <SettingsIcon className="w-5 h-5" />
                            <span className="font-semibold">Settings</span>
                        </div>
                        {isSettingsDropdownOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                    </button>
                    {isSettingsDropdownOpen && (
                        <div className="pl-6 mt-2 space-y-1 animate-fade-in">
                            <button onClick={() => { setIsSettingsOpen(true); onClose(); }} className="w-full flex items-center justify-start space-x-3 px-3 py-2 text-sm text-brand-dark hover:bg-gray-100 rounded-md">
                                <PencilIcon className="w-5 h-5 text-gray-500" /><span>Customize CRM</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

const ContactList: React.FC<{
    contacts: Contact[];
    onSelectContact: (contact: Contact) => void;
    settings: AppSettings;
    sortOrder: SortOrder;
    setSortOrder: (order: SortOrder) => void;
    filter: string | null;
    setFilter: (filter: string | null) => void;
    dealStageFilter: string | null;
    setDealStageFilter: (filter: string | null) => void;
    isMobileSortFilterOpen: boolean;
}> = ({ contacts, onSelectContact, settings, sortOrder, setSortOrder, filter, setFilter, dealStageFilter, setDealStageFilter, isMobileSortFilterOpen }) => {
    const SortFilterControls = () => (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 p-4 bg-gray-50 border-b border-brand-gray-light">
            <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-brand-gray-dark mb-2">Filter by Lead Type</label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter(null)}
                        className={`px-2 py-1.5 text-xs md:px-3 md:text-sm rounded-md border ${!filter ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}
                    >
                        All
                    </button>
                    {settings.leadTypes.map(lt => (
                        <button
                            key={lt.id}
                            onClick={() => setFilter(lt.name)}
                            className={`px-2 py-1.5 text-xs md:px-3 md:text-sm rounded-md border ${filter === lt.name ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}
                        >
                            {lt.name}
                        </button>
                    ))}
                </div>
            </div>
    
            <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-brand-gray-dark mb-2">Filter by Deal Stage</label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setDealStageFilter(null)}
                        className={`px-2 py-1.5 text-xs md:px-3 md:text-sm rounded-md border ${!dealStageFilter ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}
                    >
                        All
                    </button>
                    {settings.dealStages.map(ds => (
                        <button
                            key={ds.id}
                            onClick={() => setDealStageFilter(ds.name)}
                            className={`px-2 py-1.5 text-xs md:px-3 md:text-sm rounded-md border ${dealStageFilter === ds.name ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}
                        >
                            {ds.name}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="w-full md:w-auto md:flex-initial">
                <label className="block text-sm font-medium text-brand-gray-dark mb-2">Sort by</label>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setSortOrder('activity')} className={`sm:flex-none justify-center px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm rounded-md border ${sortOrder === 'activity' ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}>
                        Activity
                    </button>
                    <button onClick={() => setSortOrder('firstName')} className={`sm:flex-none justify-center px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm rounded-md border ${sortOrder === 'firstName' ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}>
                        First Name
                    </button>
                    <button onClick={() => setSortOrder('lastName')} className={`sm:flex-none justify-center px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm rounded-md border ${sortOrder === 'lastName' ? 'bg-brand-blue text-white border-brand-blue font-semibold' : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100'}`}>
                        Last Name
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white">
            <div className="hidden md:block"><SortFilterControls /></div>
            <div className="md:hidden">
                {isMobileSortFilterOpen && <div className="animate-fade-in"><SortFilterControls /></div>}
            </div>

            <div className="overflow-x-auto">
                <ul className="divide-y divide-brand-gray-light">
                    {contacts.map(contact => (
                         <li key={contact.id} onClick={() => onSelectContact(contact)} className="p-4 hover:bg-blue-50 cursor-pointer transition-colors duration-150">
                            <div className="flex items-center justify-between gap-x-6 gap-y-2">
                                {/* Left Side: Name, Company, Tags */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-md font-semibold text-brand-dark truncate">{contact.name}</p>
                                            <p className="text-sm text-brand-gray-dark truncate">{contact.company}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                                            {contact.leadType && (
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${LEAD_TYPE_THEMES[settings.leadTypes.find(lt => lt.name === contact.leadType)?.theme || 'gray']?.base} ${LEAD_TYPE_THEMES[settings.leadTypes.find(lt => lt.name === contact.leadType)?.theme || 'gray']?.text}`}>{contact.leadType}</span>
                                            )}
                                            {contact.dealStage && (
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md border whitespace-nowrap ${DEAL_STAGE_THEMES[settings.dealStages.find(ds => ds.name === contact.dealStage)?.theme || 'gray']?.base} ${DEAL_STAGE_THEMES[settings.dealStages.find(ds => ds.name === contact.dealStage)?.theme || 'gray']?.text} ${DEAL_STAGE_THEMES[settings.dealStages.find(ds => ds.name === contact.dealStage)?.theme || 'gray']?.border}`}>{contact.dealStage}</span>
                                            )}
                                        </div>
                                    </div>
                                     {/* Desktop-only full info */}
                                    <div className="hidden sm:flex items-center space-x-4 mt-1 text-sm text-brand-gray-dark">
                                        <div className="flex items-center space-x-1">
                                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{contact.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <EmailIcon className="w-4 h-4 text-gray-400" />
                                            <span className="truncate">{contact.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Right Side: Mobile-only action icons */}
                                <div className="flex sm:hidden items-center space-x-2 flex-shrink-0">
                                     {contact.email && (
                                        <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="p-2 rounded-full bg-blue-100 text-brand-blue hover:bg-blue-200">
                                            <EmailIcon className="w-5 h-5" />
                                        </a>
                                    )}
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200">
                                            <PhoneIcon className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// MAIN APP COMPONENT
const App: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [view, setView] = useState<View>('list');
    const [viewBeforeContact, setViewBeforeContact] = useState<View>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalContacts, setTotalContacts] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type?: ToastType; onConfirm?: () => void; confirmText?: string; dismissText?: string; } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('activity');
    const [filter, setFilter] = useState<string | null>(null);
    const [dealStageFilter, setDealStageFilter] = useState<string | null>(null);
    const [isMobileSortFilterOpen, setIsMobileSortFilterOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLElement>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [settingsData, { contacts: fetchedContacts, totalCount }] = await Promise.all([
            mockApi.getSettings(),
            mockApi.fetchContacts({ page: currentPage, limit: PAGE_SIZE, searchTerm, sortOrder, filter, dealStageFilter }),
        ]);
        setSettings(settingsData);
        setContacts(currentPage === 1 ? fetchedContacts : prev => [...prev, ...fetchedContacts]);
        setTotalContacts(totalCount);
        setIsLoading(false);
    }, [currentPage, searchTerm, sortOrder, filter, dealStageFilter]);

    useEffect(() => {
        mockApi.initializeData();
        const fetchDashboardData = async () => {
             const [all, follows] = await Promise.all([
                mockApi.fetchAllContacts(),
                mockApi.fetchFollowUps()
            ]);
            setAllContacts(all);
            setFollowUps(follows);
        }
        fetchDashboardData();
        loadData();
    }, [loadData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortOrder, filter, dealStageFilter]);

    useEffect(() => {
        if (view !== 'list') setSelectedContact(null);
    }, [view]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node) && !menuButtonRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    useEffect(() => {
        mainContentRef.current?.scrollTo(0, 0);
    }, [view, selectedContact]);

    const handleUpdateContact = async (updatedData: Partial<Contact>) => {
        if (selectedContact) {
            const updated = await mockApi.updateContact(selectedContact.id, updatedData);
            if (updated) {
                setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
                setAllContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
                setSelectedContact(updated);
            }
        }
    };

    const handleAddNote = async (contactId: string, noteText: string, type: Note['type'] = 'note') => {
        const updated = await mockApi.addNote(contactId, noteText, type);
        if (updated) {
            setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
            setAllContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
            if (selectedContact?.id === contactId) setSelectedContact(updated);
            
            // Only analyze non-system notes to prevent loops and irrelevant analyses
            if (type !== 'system' && settings?.dealStages) {
                const suggestedStage = await analyzeNoteForDealStage(noteText, settings.dealStages);
                if (suggestedStage && suggestedStage !== updated.dealStage) {
                    // Automatically update deal stage without confirmation
                    await handleUpdateDealStage(contactId, suggestedStage);
                    setToast({
                        message: `Deal stage for ${updated.name} automatically updated to "${suggestedStage}".`,
                        type: 'info'
                    });
                }
            }
        }
    };
    
    const handleSaveNewContact = async (contactData: Partial<Contact>) => {
        const newContact = await mockApi.createContact(contactData);
        setContacts(prev => [newContact, ...prev]);
        setAllContacts(prev => [newContact, ...prev]);
        setTotalContacts(prev => prev + 1);
        if (contactData.notes && contactData.notes.length > 0) {
            await handleAddNote(newContact.id, contactData.notes[0].text);
        }
        await scheduleFollowUp(newContact.id, 1, 'new-contact-followup');
        setToast({ message: `${newContact.name} created. Follow-up scheduled for tomorrow.`, type: 'info' });
    };

    const handleImport = async (importedContacts: Partial<Contact>[]) => {
        const count = await mockApi.importContacts(importedContacts);
        setToast({ message: `${count} contacts imported successfully. Consider merging duplicates.`, type: 'info' });
        loadData(); // This should be updated to reload all contacts as well
    };
    
    const handleDeleteContact = async (contactId: string, name: string) => {
        await mockApi.deleteContact(contactId);
        setContacts(prev => prev.filter(c => c.id !== contactId));
        setAllContacts(prev => prev.filter(c => c.id !== contactId));
        setSelectedContact(null);
        setToast({ message: `${name} has been deleted.`, type: 'info' });
    };
    
    const handleUpdateLeadType = async (contactId: string, leadTypeName: string) => {
        const contact = allContacts.find(c => c.id === contactId);
        if (contact && contact.leadType !== leadTypeName) {
            await handleAddNote(contactId, `Lead type changed to: ${leadTypeName}`, 'system');
            const updated = await mockApi.updateContact(contactId, { leadType: leadTypeName });
            if (updated) {
                setContacts(prev => prev.map(c => c.id === contactId ? updated : c));
                setAllContacts(prev => prev.map(c => c.id === contactId ? updated : c));
                if (selectedContact?.id === contactId) setSelectedContact(updated);
            }
        }
    };
    
    const handleUpdateDealStage = async (contactId: string, dealStageName: string) => {
        const contact = allContacts.find(c => c.id === contactId);
        if (contact && contact.dealStage !== dealStageName) {
            await handleAddNote(contactId, `Deal stage changed to: ${dealStageName}`, 'system');
            const updated = await mockApi.updateContact(contactId, { dealStage: dealStageName });
            if (updated) {
                setContacts(prev => prev.map(c => c.id === contactId ? updated : c));
                setAllContacts(prev => prev.map(c => c.id === contactId ? updated : c));
                if (selectedContact?.id === contactId) setSelectedContact(updated);
            }
        }
    };
    
    const scheduleFollowUp = async (contactId: string, days: number | null, actionKey?: string) => {
        if (actionKey) {
            const canPerform = await mockApi.canPerformAction(contactId, actionKey);
            if (!canPerform) {
                setToast({ message: "You've already performed this action today for this contact.", type: 'warning' });
                return;
            }
            await mockApi.recordAction(contactId, actionKey);
        }
        const updatedFollowUps = await mockApi.scheduleFollowUp(contactId, days);
        setFollowUps(updatedFollowUps);
        const contact = allContacts.find(c => c.id === contactId);
        if (contact) {
            const noteText = days === null ? "Marked as 'Don't call again'." : `Follow-up scheduled in ${days} day(s).`;
            await handleAddNote(contactId, noteText, 'system');
        }
    };

    const handleLogOutcome = async (contactId: string, outcome: string) => {
        await handleAddNote(contactId, `Call Outcome: ${outcome}`, 'outcome');
        await mockApi.recordAction(contactId, `outcome-${outcome}`);
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        const updatedSettings = await mockApi.updateSettings(newSettings);
        setSettings(updatedSettings);
        setToast({ message: 'Settings saved successfully.', type: 'info' });
    };

    const handleReorderContact = async (draggedContactId: string, targetContactId: string | null, stageName: string) => {
        const stageContacts = allContacts.filter(c => c.dealStage === stageName);
        const draggedItem = stageContacts.find(c => c.id === draggedContactId);
        if (!draggedItem) return;

        const remainingItems = stageContacts.filter(c => c.id !== draggedContactId);
        const targetIndex = targetContactId ? remainingItems.findIndex(c => c.id === targetContactId) : remainingItems.length;
        
        remainingItems.splice(targetIndex, 0, draggedItem);
        
        const otherContacts = allContacts.filter(c => c.dealStage !== stageName);
        const newContactsOrder = [...otherContacts, ...remainingItems];
        
        setAllContacts(newContactsOrder); 
        await mockApi.updateAllContacts(newContactsOrder);
    };

    const handleCrmTabClick = () => {
        if (view === 'list') {
            mainContentRef.current?.scrollTo(0, 0);
        }
        setView('list');
        setSelectedContact(null);
        setSearchTerm('');
        setFilter(null);
        setDealStageFilter(null);
        setSortOrder('activity');
        setIsMobileSortFilterOpen(false);
    };

    const handleSetView = (newView: View) => {
        setSelectedContact(null);
        if (view === newView) {
            mainContentRef.current?.scrollTo(0, 0);
        } else {
            setView(newView);
        }
    };
    
    const handleSelectContact = (contact: Contact) => {
        setViewBeforeContact(view);
        setSelectedContact(contact);
    };

    const renderContent = () => {
        if (isLoading && currentPage === 1) return <div className="p-8 text-center">Loading...</div>;
        if (selectedContact && settings) {
            return <ContactDetail 
                        contact={selectedContact}
                        onBack={() => setSelectedContact(null)}
                        onUpdateContact={handleUpdateContact}
                        onAddNote={handleAddNote}
                        onDeleteContact={handleDeleteContact}
                        onUpdateLeadType={handleUpdateLeadType}
                        onUpdateDealStage={handleUpdateDealStage}
                        onScheduleFollowUp={scheduleFollowUp}
                        onLogOutcome={handleLogOutcome}
                        upcomingFollowUpDate={followUps.find(f => f.contactId === selectedContact.id && !f.completed)?.dueDate || null}
                        leadTypes={settings.leadTypes}
                        dealStages={settings.dealStages}
                        callOutcomes={settings.callOutcomes}
                        setToast={(t) => setToast(t)}
                        viewBeforeContact={viewBeforeContact}
                    />;
        }

        switch (view) {
            case 'dashboard':
                return settings ? <Dashboard 
                                    contacts={allContacts} 
                                    followUps={followUps} 
                                    onMarkDone={async (contactId) => setFollowUps(await mockApi.markFollowUpDone(contactId))}
                                    onSelectContact={handleSelectContact}
                                    onAddNote={handleAddNote}
                                    onScheduleFollowUp={scheduleFollowUp}
                                    onLogOutcome={handleLogOutcome}
                                    callOutcomes={settings.callOutcomes}
                                    setToast={(t) => setToast(t)}
                                /> : null;
            case 'dealflow':
                 return settings ? <DealFlow 
                                    contacts={allContacts} 
                                    dealStages={settings.dealStages} 
                                    onSelectContact={handleSelectContact}
                                    onUpdateDealStage={handleUpdateDealStage}
                                    onReorderContact={handleReorderContact}
                                /> : null;
            case 'list':
            default:
                return settings ? (
                    <>
                        <ContactList 
                            contacts={contacts} 
                            onSelectContact={handleSelectContact}
                            settings={settings}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            filter={filter}
                            setFilter={setFilter}
                            dealStageFilter={dealStageFilter}
                            setDealStageFilter={setDealStageFilter}
                            isMobileSortFilterOpen={isMobileSortFilterOpen}
                        />
                        {contacts.length < totalContacts && !isLoading && (
                            <div className="p-4 text-center">
                                <button onClick={() => setCurrentPage(p => p + 1)} className="px-6 py-2 bg-gray-200 text-brand-dark font-semibold rounded-md hover:bg-gray-300">Load More</button>
                            </div>
                        )}
                        {isLoading && currentPage > 1 && <div className="p-4 text-center">Loading more...</div>}
                    </>
                ) : null;
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans text-brand-dark">
            {settings && (
                <>
                    <TopBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        setIsCreating={setIsCreating}
                        searchInputRef={searchInputRef}
                        isMenuOpen={isMenuOpen}
                        setIsMenuOpen={setIsMenuOpen}
                        menuButtonRef={menuButtonRef}
                        view={view}
                        setView={handleSetView}
                        onCrmClick={handleCrmTabClick}
                        isMobileSortFilterOpen={isMobileSortFilterOpen}
                        setIsMobileSortFilterOpen={setIsMobileSortFilterOpen}
                        isCreating={isCreating}
                        isImporting={isImporting}
                        isSettingsOpen={isSettingsOpen}
                    />
                     <SideMenu
                        isOpen={isMenuOpen}
                        onClose={() => setIsMenuOpen(false)}
                        setIsImporting={setIsImporting}
                        setIsSettingsOpen={setIsSettingsOpen}
                        handleExport={async () => {
                            const data = await mockApi.exportData();
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `jiba-jaba-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            setToast({ message: 'Data exported successfully.', type: 'info' });
                        }}
                        handleMerge={async () => {
                            const count = await mockApi.findAndMergeDuplicates();
                            setToast({ message: count > 0 ? `${count} duplicate contacts merged.` : 'No duplicates found.', type: 'info' });
                            const all = await mockApi.fetchAllContacts();
                            setAllContacts(all);
                            loadData();
                        }}
                        handleDeleteAll={() => setToast({ message: 'Are you sure you want to delete ALL contacts and data?', type: 'warning', confirmText: 'Yes, Delete All', onConfirm: async () => { await mockApi.deleteAllContacts(); const all = await mockApi.fetchAllContacts(); setAllContacts(all); loadData(); } })}
                        menuRef={menuRef}
                    />
                </>
            )}
            <main ref={mainContentRef} className="flex-grow overflow-y-auto">
                {renderContent()}
            </main>
            {isCreating && settings && <NewContactModal onClose={() => setIsCreating(false)} onSave={handleSaveNewContact} leadTypes={settings.leadTypes} dealStages={settings.dealStages} />}
            {isImporting && <ImportModal onClose={() => setIsImporting(false)} onImport={handleImport} />}
            {isSettingsOpen && settings && <SettingsModal settings={settings} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveSettings} setToast={setToast}/>}
            {toast && <Toast message={toast.message} type={toast.type} onConfirm={toast.onConfirm} confirmText={toast.confirmText} dismissText={toast.dismissText} onDismiss={() => setToast(null)} />}
        </div>
    );
};

export default App;