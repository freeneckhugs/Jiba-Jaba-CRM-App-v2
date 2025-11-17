import React, { useState } from 'react';
import { Contact, Note, CustomDealStage } from '../types';
import { DEAL_STAGE_THEMES } from '../constants';
import { PrintIcon } from './icons';

interface DealFlowProps {
  contacts: Contact[];
  dealStages: CustomDealStage[];
  onSelectContact: (contact: Contact) => void;
  onUpdateDealStage: (contactId: string, newStage: string) => void;
  onReorderContact: (draggedContactId: string, targetContactId: string | null, stageName: string) => void;
}

const DealFlow: React.FC<DealFlowProps> = ({ contacts, dealStages, onSelectContact, onUpdateDealStage, onReorderContact }) => {
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [dragOverContactId, setDragOverContactId] = useState<string | null>(null);
  const [editingDealStageContactId, setEditingDealStageContactId] = useState<string | null>(null);
  
  const contactsByStage = (stageName: string) => {
    return contacts.filter(contact => contact.dealStage === stageName);
  };

  const getStageStyles = (stage: CustomDealStage) => {
    return DEAL_STAGE_THEMES[stage.theme] || DEAL_STAGE_THEMES.gray;
  }
  
  // Mouse drag events
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, contactId: string) => {
    e.dataTransfer.setData("contactId", contactId);
    setDraggedContactId(contactId);
  };

  const handleDragEnd = () => {
    setDraggedContactId(null);
    setDragOverContactId(null);
    setDragOverStageId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };
  
  const handleDragOverCard = (e: React.DragEvent<HTMLDivElement>, contactId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContactId(contactId);
  };

  const handleDragLeaveColumn = () => {
    setDragOverStageId(null);
    setDragOverContactId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: CustomDealStage, targetContactId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData("contactId");
    
    const contact = contacts.find(c => c.id === draggedId);
    if (contact) {
      if (contact.dealStage !== newStage.name) {
        // This is a move to a different column
        onUpdateDealStage(draggedId, newStage.name);
      } else {
        // This is a reorder within the same column
        if (draggedId !== targetContactId) {
          onReorderContact(draggedId, targetContactId, newStage.name);
        }
      }
    }
    handleDragEnd();
  };
  
  // Touch drag events (kept for moving between columns, not reordering)
  const handleTouchStart = (contactId: string) => {
    setDraggedContactId(contactId);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggedContactId) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (targetElement) {
        const stageColumn = targetElement.closest('[data-stage-id]') as HTMLDivElement;
        const stageId = stageColumn?.dataset.stageId || null;
        
        if (stageId !== dragOverStageId) {
            setDragOverStageId(stageId);
        }
    }
  };

  const handleTouchEnd = () => {
    if (!draggedContactId || !dragOverStageId) {
        setDraggedContactId(null);
        setDragOverStageId(null);
        return;
    }

    const contact = contacts.find(c => c.id === draggedContactId);
    const newStage = dealStages.find(s => s.id === dragOverStageId);

    if (contact && newStage && contact.dealStage !== newStage.name) {
      onUpdateDealStage(contact.id, newStage.name);
    }
    
    setDraggedContactId(null);
    setDragOverStageId(null);
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = '@media print { @page { size: landscape; } }';
    document.head.appendChild(style);
    
    setTimeout(() => {
        window.print();
        document.head.removeChild(style);
    }, 100);
  };


  return (
    <div id="deal-flow-container" className="bg-gray-50 min-h-full w-full">
      <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h1 className="text-2xl font-bold text-brand-dark">Deal Flow</h1>
            <button
                onClick={handlePrint}
                className="p-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 print:hidden"
                title="Print Deal Flow"
            >
                <PrintIcon className="w-5 h-5" />
            </button>
        </div>
        <div 
            className="flex-grow flex flex-col md:flex-row md:overflow-x-auto space-y-4 md:space-y-0 md:space-x-4 pb-4"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
          {dealStages.map(stage => {
            const stageContacts = contactsByStage(stage.name);
            const stageColors = getStageStyles(stage);
            const isDragOver = dragOverStageId === stage.id;

            return (
              <div 
                key={stage.id} 
                data-stage-id={stage.id}
                className={`w-full md:w-80 flex-shrink-0 flex flex-col bg-brand-gray-light rounded-lg shadow-sm transition-colors ${isDragOver ? 'bg-blue-100 ring-2 ring-brand-blue' : ''}`}
                onDragOver={(e) => handleDragOverColumn(e, stage.id)}
                onDragLeave={handleDragLeaveColumn}
                onDrop={(e) => handleDrop(e, stage, null)}
              >
                <div className={`p-3 font-semibold text-lg border-b-4 ${stageColors.base} ${stageColors.text} ${stageColors.border}`}>
                  {stage.name}
                  <span className="ml-2 text-sm font-medium">({stageContacts.length.toLocaleString()})</span>
                </div>
                <div className="p-2 space-y-2 flex-grow overflow-y-auto">
                  {stageContacts.length > 0 ? (
                    stageContacts.map(contact => {
                      const isDragging = draggedContactId === contact.id;
                      const isEditingDealStage = editingDealStageContactId === contact.id;
                      return (
                        <React.Fragment key={contact.id}>
                          {dragOverContactId === contact.id && draggedContactId !== contact.id && (
                             <div className="h-1.5 bg-brand-blue rounded-full" />
                          )}
                          <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, contact.id)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleDragOverCard(e, contact.id)}
                              onDrop={(e) => handleDrop(e, stage, contact.id)}
                              onTouchStart={() => handleTouchStart(contact.id)}
                              onClick={() => onSelectContact(contact)}
                              className={`bg-white p-3 rounded-md shadow-sm cursor-pointer hover:shadow-md hover:ring-2 hover:ring-brand-blue transition-all ${isDragging ? 'opacity-50' : ''}`}
                          >
                              <div className="flex justify-between items-start">
                                  <p className="font-semibold text-brand-dark truncate">{contact.name}</p>
                                  {contact.dealStage && (
                                       <div className="flex items-center flex-shrink-0 ml-2">
                                          {isEditingDealStage ? (
                                            <select
                                                value={contact.dealStage}
                                                onChange={(e) => {
                                                    onUpdateDealStage(contact.id, e.target.value);
                                                    setEditingDealStageContactId(null);
                                                }}
                                                onBlur={() => setEditingDealStageContactId(null)}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className={`text-sm font-semibold p-1 rounded-md border-2 border-brand-blue focus:outline-none appearance-none ${stageColors.base} ${stageColors.text}`}
                                            >
                                                {dealStages.map(ds => (
                                                    <option key={ds.id} value={ds.name} style={{ backgroundColor: 'white', color: 'black' }}>{ds.name}</option>
                                                ))}
                                            </select>
                                          ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingDealStageContactId(contact.id);
                                                }}
                                                className={`text-sm font-semibold px-2 py-1 rounded-md ${stageColors.base} ${stageColors.text}`}
                                            >
                                                {contact.dealStage}
                                            </button>
                                          )}
                                      </div>
                                  )}
                              </div>
                              {stage.name === 'Research' && contact.requirements ? (
                                <p className="mt-2 text-xs text-gray-600 truncate pt-2 border-t border-brand-gray-light" title={contact.requirements}>
                                  {contact.requirements}
                                </p>
                              ) : stage.name !== 'Research' && contact.subjectProperty ? (
                                <p className="mt-2 text-xs text-gray-600 truncate pt-2 border-t border-brand-gray-light" title={contact.subjectProperty}>
                                  {contact.subjectProperty}
                                </p>
                              ) : null}
                          </div>
                        </React.Fragment>
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