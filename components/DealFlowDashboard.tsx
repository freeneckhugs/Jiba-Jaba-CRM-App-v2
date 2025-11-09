import React, { useState } from 'react';
import { Contact, Note, CustomDealStage } from '../types';
import { DEAL_STAGE_THEMES } from '../constants';
import { PrintIcon } from './icons';

interface DealFlowProps {
  contacts: Contact[];
  dealStages: CustomDealStage[];
  onSelectContact: (contact: Contact) => void;
  onUpdateDealStage: (contactId: string, newStage: string) => void;
}

const DealFlow: React.FC<DealFlowProps> = ({ contacts, dealStages, onSelectContact, onUpdateDealStage }) => {
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  
  const contactsByStage = (stageName: string) => {
    return contacts.filter(contact => contact.dealStage === stageName);
  };

  const getLatestManualNote = (contact: Contact): Note | undefined => {
    return contact.notes.find(n => n.type === 'note');
  };

  const getStageStyles = (stage: CustomDealStage) => {
    return DEAL_STAGE_THEMES[stage.theme] || DEAL_STAGE_THEMES.gray;
  }
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, contactId: string) => {
    e.dataTransfer.setData("contactId", contactId);
    setDraggedContactId(contactId);
  };

  const handleDragEnd = () => {
    setDraggedContactId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: CustomDealStage) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId");
    
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.dealStage !== newStage.name) {
      onUpdateDealStage(contactId, newStage.name);
    }
    setDragOverStageId(null);
    setDraggedContactId(null);
  };
  
  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = '@media print { @page { size: landscape; } }';
    document.head.appendChild(style);
    
    // Use a timeout to ensure the style is applied before printing
    setTimeout(() => {
        window.print();
        document.head.removeChild(style);
    }, 100);
  };


  return (
    <div id="deal-flow-container" className="bg-gray-50 min-h-full w-full">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Deal Flow</h1>
            <button
                onClick={handlePrint}
                className="p-2 bg-white border border-brand-gray-medium text-brand-dark rounded-md hover:bg-gray-100 print:hidden"
                title="Print Deal Flow"
            >
                <PrintIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 md:overflow-x-auto pb-4">
          {dealStages.map(stage => {
            const stageContacts = contactsByStage(stage.name);
            const stageColors = getStageStyles(stage);
            const isDragOver = dragOverStageId === stage.id;

            return (
              <div 
                key={stage.id} 
                className={`w-full md:flex-1 bg-brand-gray-light rounded-lg shadow-sm transition-colors ${isDragOver ? 'bg-blue-100 ring-2 ring-brand-blue' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className={`p-3 font-semibold text-lg border-b-4 ${stageColors.base} ${stageColors.text} ${stageColors.border}`}>
                  {stage.name}
                  <span className="ml-2 text-sm font-medium">({stageContacts.length.toLocaleString()})</span>
                </div>
                <div className="p-2 space-y-2 max-h-48 md:h-[calc(100vh-220px)] md:max-h-none overflow-y-auto">
                  {stageContacts.length > 0 ? (
                    stageContacts.map(contact => {
                      const latestNote = getLatestManualNote(contact);
                      const isDragging = draggedContactId === contact.id;
                      return (
                          <div
                              key={contact.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, contact.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => onSelectContact(contact)}
                              className={`bg-white p-2 md:p-3 rounded-md shadow-sm cursor-pointer hover:shadow-md hover:ring-2 hover:ring-brand-blue transition-all ${isDragging ? 'opacity-50' : ''}`}
                          >
                              <div className="flex justify-between items-start">
                                  <p className="font-semibold text-brand-dark truncate">{contact.name}</p>
                                  {contact.dealStage && (
                                       <div className="flex items-center flex-shrink-0 ml-2">
                                          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${stageColors.base} ${stageColors.text}`}>{contact.dealStage}</span>
                                      </div>
                                  )}
                              </div>
                              <p className="text-sm text-brand-gray-dark truncate">{contact.company}</p>
                              <div className="hidden md:block mt-2 pt-2 border-t border-brand-gray-light">
                                  <p className="text-xs text-gray-500 truncate" title={latestNote?.text}>
                                  <span className="font-semibold text-gray-600">Note: </span>
                                  {latestNote ? latestNote.text : <span className="text-gray-400">No notes yet.</span>}
                                  </p>
                              </div>
                          </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-sm text-brand-gray-dark h-full flex items-center justify-center">
                        {isDragOver ? 'Drop here' : 'No contacts in this stage.'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default DealFlow;