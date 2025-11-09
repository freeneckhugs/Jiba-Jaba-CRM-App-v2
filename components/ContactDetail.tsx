import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Contact, Note, CustomLeadType, CustomDealStage, CustomCallOutcome } from '../types';
import { DEAL_STAGE_THEMES, LEAD_TYPE_THEMES } from '../constants';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicrophoneIcon, StopIcon, ArrowLeftIcon, PencilIcon, TrashIcon } from './icons';
import { ToastType } from './Toast';

interface ContactDetailProps {
  contact: Contact;
  leadTypes: CustomLeadType[];
  dealStages: CustomDealStage[];
  callOutcomes: CustomCallOutcome[];
  onUpdateContact: (contact: Partial<Contact>) => void;
  onUpdateLeadType: (contactId: string, leadType: string) => void;
  onUpdateDealStage: (contactId: string, dealStage: string) => void;
  onBack: () => void;
  onAddNote: (contactId: string, noteText: string) => void;
  onLogOutcome: (contactId: string, outcome: string) => void;
  onScheduleFollowUp: (contactId: string, days: number | null, actionKey?: string) => void;
  upcomingFollowUpDate: number | null;
  onDeleteContact: (contactId: string, name: string) => void;
  setToast: (toast: { message: string; type?: ToastType; onConfirm?: () => void; confirmText?: string; dismissText?: string; }) => void;
}

const ContactInfo: React.FC<{ 
    contact: Contact;
    leadTypes: CustomLeadType[];
    dealStages: CustomDealStage[];
    onUpdateContact: (contact: Partial<Contact>) => void;
    onUpdateLeadType: (contactId: string, leadType: string) => void;
    onUpdateDealStage: (contactId: string, dealStage: string) => void;
    onDeleteContact: (contactId: string, name: string) => void;
    onAddNote: (contactId: string, noteText: string) => void;
    setToast: (toast: { message: string; type?: ToastType; onConfirm?: () => void; confirmText?: string, dismissText?: string; }) => void;
}> = ({ contact, leadTypes, dealStages, onUpdateContact, onUpdateLeadType, onUpdateDealStage, onDeleteContact, onAddNote, setToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);

  useEffect(() => {
    setEditedContact(contact);
  }, [contact]);
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedContact({ ...editedContact, [e.target.name]: e.target.value });
  };
  
  const handleSave = () => {
    onUpdateContact({ ...editedContact, lastActivity: Date.now() });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedContact(contact);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setToast({
      message: `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      type: 'warning',
      confirmText: 'Delete Contact',
      dismissText: 'Cancel',
      onConfirm: () => {
        onDeleteContact(contact.id, contact.name);
      }
    });
  };
  
  const getDealStageStyle = (stage: CustomDealStage): string => {
    const theme = DEAL_STAGE_THEMES[stage.theme] || DEAL_STAGE_THEMES.gray;
    const isSelected = contact.dealStage === stage.name;
    return isSelected
        ? `${theme.base} ${theme.text} ${theme.border}`
        : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100';
  }

  const getLeadTypeStyle = (type: CustomLeadType): string => {
    const theme = LEAD_TYPE_THEMES[type.theme] || LEAD_TYPE_THEMES.gray;
    const isSelected = contact.leadType === type.name;
    return isSelected
        ? `${theme.base} ${theme.text} ${theme.border}`
        : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100';
  }

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-brand-dark break-words">{contact.name}</h2>
        <div className="flex space-x-2 flex-shrink-0 ml-4">
          <button onClick={() => setIsEditing(true)} title="Edit Contact" className="p-1 text-gray-500 hover:text-brand-blue"><PencilIcon className="w-5 h-5" /></button>
          <button onClick={handleDelete} title="Delete Contact" className="p-1 text-gray-500 hover:text-brand-red"><TrashIcon className="w-5 h-5" /></button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="edit-name">Name</label>
                <input type="text" id="edit-name" name="name" value={editedContact.name} onChange={handleEditChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="edit-company">Company</label>
                <input type="text" id="edit-company" name="company" value={editedContact.company} onChange={handleEditChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="edit-phone">Phone</label>
                <input type="text" id="edit-phone" name="phone" value={editedContact.phone} onChange={handleEditChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="edit-email">Email</label>
                <input type="email" id="edit-email" name="email" value={editedContact.email} onChange={handleEditChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="edit-contactNote">Contact Notes</label>
                <textarea 
                    id="edit-contactNote" 
                    name="contactNote"
                    value={editedContact.contactNote || ''}
                    onChange={handleEditChange}
                    rows={3}
                    className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue"
                    placeholder="Add a primary note for this contact..."
                />
            </div>
            <div className="flex space-x-2 pt-2">
                <button onClick={handleSave} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-600">Save</button>
                <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Cancel</button>
            </div>
        </div>
      ) : (
        <>
            <p className="text-brand-gray-dark mb-1">{contact.company}</p>
            <a href={`tel:${contact.phone}`} className="text-brand-blue font-medium mb-1 hover:underline block">{contact.phone}</a>
            <a href={`mailto:${contact.email}`} className="text-brand-blue mb-4 hover:underline block">{contact.email}</a>
            
            {contact.contactNote && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 whitespace-pre-wrap">{contact.contactNote}</p>
                </div>
            )}
            
            <div className="space-y-6">
                 <div>
                    <h3 className="text-sm font-semibold text-brand-gray-dark uppercase tracking-wide mb-2">Lead Type</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        {leadTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => onUpdateLeadType(contact.id, type.name)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${getLeadTypeStyle(type)}`}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-sm font-semibold text-brand-gray-dark uppercase tracking-wide mb-2">Deal Stage</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        {dealStages.map((stage) => (
                            <button
                                key={stage.id}
                                onClick={() => onUpdateDealStage(contact.id, stage.name)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md border-2 transition-colors ${getDealStageStyle(stage)}`}
                            >
                                {stage.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

const NotesSection: React.FC<{ contact: Contact; onAddNote: (contactId: string, noteText: string) => void }> = ({ contact, onAddNote }) => {
    const { text, setText, startListening, stopListening, isListening, hasRecognitionSupport } = useSpeechRecognition();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSaveNote = useCallback(() => {
        if (text.trim()) {
            onAddNote(contact.id, text.trim());
            setText('');
        }
        if (isListening) {
            stopListening();
        }
    }, [text, contact.id, onAddNote, setText, isListening, stopListening]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                handleSaveNote();
            }
        };
        const textarea = textareaRef.current;
        textarea?.addEventListener('keydown', handleKeyDown);
        return () => textarea?.removeEventListener('keydown', handleKeyDown);
    }, [handleSaveNote]);

    return (
        <div className="bg-white p-6 rounded-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold text-brand-dark mb-4">Call Notes / Updates</h3>
            <div className="relative flex-grow flex flex-col">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your notes here... (Shift+Enter to save)"
                    className="w-full h-32 p-3 border border-brand-gray-medium rounded-md resize-none bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue focus:outline-none"
                />
                <div className="mt-3 flex items-center justify-between">
                    {hasRecognitionSupport && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-brand-red' : 'bg-gray-100 text-brand-dark hover:bg-gray-200'}`}
                        >
                            {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                        </button>
                    )}
                    <button
                        onClick={handleSaveNote}
                        className="px-5 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                    >
                        Save Note
                    </button>
                </div>
            </div>
            <div className="mt-6 flex-grow overflow-y-auto">
                <h4 className="text-md font-semibold text-brand-dark mb-3">History</h4>
                <div className="space-y-4">
                    {contact.notes.map((note) => (
                        <div key={note.id} className="text-sm">
                            <p className="text-brand-dark whitespace-pre-wrap">{note.text}</p>
                            <p className="text-xs text-brand-gray-dark mt-1">
                                {new Date(note.timestamp).toLocaleString()} - {note.type}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AgendaSection: React.FC<{ 
    contactId: string;
    onLogOutcome: (contactId: string, outcome: string) => void;
    onScheduleFollowUp: (contactId: string, days: number | null, actionKey?: string) => void;
    upcomingFollowUpDate: number | null;
    callOutcomes: CustomCallOutcome[];
}> = ({ contactId, onLogOutcome, onScheduleFollowUp, upcomingFollowUpDate, callOutcomes }) => {
    const [followUpDisabled, setFollowUpDisabled] = useState(false);
    const [oneClickUpdateDisabled, setOneClickUpdateDisabled] = useState(false);

    useEffect(() => {
        setFollowUpDisabled(false);
        setOneClickUpdateDisabled(false);
    }, [contactId]);

    const handleFollowUpAction = (actionFn: () => void) => {
        if (followUpDisabled) return;
        setFollowUpDisabled(true);
        actionFn();
    };

    const handleOneClickUpdateAction = (actionFn: () => void) => {
        if (oneClickUpdateDisabled) return;
        setOneClickUpdateDisabled(true);
        actionFn();
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        const inputElement = e.target;
        if (dateValue) {
            handleFollowUpAction(() => {
                const selectedDate = new Date(dateValue + 'T00:00:00'); // Use local timezone
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const diffTime = selectedDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                onScheduleFollowUp(contactId, diffDays >= 0 ? diffDays : 0, `followup-custom-date`);
                inputElement.value = ''; // Reset after selection
            });
        }
    };

    const followUpOptions = [
        { label: 'Tomorrow', days: 1, key: 'followup-1-day' },
        { label: '+3 days', days: 3, key: 'followup-3-days' },
        { label: '+7', days: 7, key: 'followup-7-days' },
        { label: '+14', days: 14, key: 'followup-14-days' },
        { label: '+30', days: 30, key: 'followup-30-days' },
    ];

    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="bg-white p-6 rounded-lg space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-brand-dark mb-4">Follow Up</h3>
                {upcomingFollowUpDate && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    Next follow-up: <strong>{new Date(upcomingFollowUpDate).toLocaleDateString()}</strong>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {followUpOptions.map(({ label, days, key }) => (
                        <button
                            key={label}
                            onClick={() => handleFollowUpAction(() => onScheduleFollowUp(contactId, days, key))}
                            disabled={followUpDisabled}
                            className={`flex-grow px-2 py-1.5 md:px-3 md:py-2 text-sm bg-gray-100 text-brand-dark rounded-md hover:bg-gray-200 transition-colors ${disabledClasses}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    <label htmlFor="followup-date" className="block text-sm font-medium text-brand-gray-dark">Set specific date</label>
                    <input
                        type="date"
                        id="followup-date"
                        onChange={handleDateChange}
                        disabled={followUpDisabled}
                        className={`mt-1 block w-full px-3 py-2 bg-white border border-brand-gray-medium rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm ${disabledClasses}`}
                    />
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-brand-dark mb-4">One-Click Update</h3>
                <div className="grid grid-cols-2 gap-2">
                    {callOutcomes.map(outcome => (
                        <button
                            key={outcome.id}
                            onClick={() => handleOneClickUpdateAction(() => onLogOutcome(contactId, outcome.name))}
                            disabled={oneClickUpdateDisabled}
                            className={`px-2 py-2 md:px-3 md:py-3 text-sm rounded-md transition-colors text-center bg-gray-100 text-brand-dark hover:bg-gray-200 ${disabledClasses}`}
                        >
                            {outcome.name}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => handleOneClickUpdateAction(() => onScheduleFollowUp(contactId, null, 'followup-dont-call'))}
                    disabled={oneClickUpdateDisabled}
                    className={`w-full mt-4 px-2 py-1.5 md:px-3 md:py-2 text-sm bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors ${disabledClasses}`}
                >
                    Don't call again
                </button>
            </div>
        </div>
    );
};


const ContactDetail: React.FC<ContactDetailProps> = (props) => {
    const { contact, onBack, onDeleteContact, onUpdateLeadType, onUpdateDealStage, setToast, leadTypes, dealStages, callOutcomes } = props;

    return (
        <div className="bg-gray-50 min-h-full p-4 md:p-6 lg:p-8">
            <button onClick={onBack} className="flex items-center space-x-2 text-brand-blue hover:underline mb-6 md:hidden">
                <ArrowLeftIcon className="w-5 h-5"/>
                <span>Back to List</span>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="md:col-span-1 lg:col-span-1 space-y-6">
                    <ContactInfo 
                        contact={contact} 
                        onUpdateContact={props.onUpdateContact} 
                        onUpdateLeadType={onUpdateLeadType}
                        onUpdateDealStage={onUpdateDealStage}
                        onDeleteContact={onDeleteContact}
                        onAddNote={props.onAddNote}
                        setToast={setToast}
                        leadTypes={leadTypes}
                        dealStages={dealStages}
                    />
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                    <NotesSection contact={contact} onAddNote={props.onAddNote} />
                </div>
                <div className="md:col-span-3 lg:col-span-1">
                    <AgendaSection 
                        contactId={contact.id} 
                        onLogOutcome={props.onLogOutcome} 
                        onScheduleFollowUp={props.onScheduleFollowUp}
                        upcomingFollowUpDate={props.upcomingFollowUpDate}
                        callOutcomes={callOutcomes}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContactDetail;