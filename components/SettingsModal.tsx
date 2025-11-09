import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, CustomLeadType, CustomDealStage, CustomCallOutcome } from '../types';
import { DEAL_STAGE_THEMES, LEAD_TYPE_THEMES } from '../constants';
import { DragHandleIcon, TrashIcon, XIcon } from './icons';
import { ToastType } from './Toast';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
  setToast: (toast: { message: string; type?: ToastType; onConfirm?: () => void; confirmText?: string; dismissText?: string; }) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onSave, setToast }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));
  const [newLeadTypeName, setNewLeadTypeName] = useState('');
  const [newDealStageName, setNewDealStageName] = useState('');
  const [newCallOutcomeName, setNewCallOutcomeName] = useState('');
  const [editingLeadType, setEditingLeadType] = useState<CustomLeadType | null>(null);
  const [editingDealStage, setEditingDealStage] = useState<CustomDealStage | null>(null);
  const [editingCallOutcome, setEditingCallOutcome] = useState<CustomCallOutcome | null>(null);
  
  const dragDealStageItem = useRef<number | null>(null);
  const dragOverDealStageItem = useRef<number | null>(null);
  const dragLeadTypeItem = useRef<number | null>(null);
  const dragOverLeadTypeItem = useRef<number | null>(null);


  const handleAddLeadType = () => {
    if (newLeadTypeName.trim()) {
      const newType: CustomLeadType = { id: crypto.randomUUID(), name: newLeadTypeName.trim(), theme: 'gray' };
      setLocalSettings(prev => ({ ...prev, leadTypes: [...prev.leadTypes, newType] }));
      setNewLeadTypeName('');
    }
  };

  const handleDeleteLeadType = (id: string, name: string) => {
    setToast({
        message: `Are you sure you want to delete the "${name}" lead type?`,
        type: 'warning',
        confirmText: 'Delete',
        dismissText: 'Cancel',
        onConfirm: () => {
            setLocalSettings(prev => ({ ...prev, leadTypes: prev.leadTypes.filter(lt => lt.id !== id) }));
            setToast(null);
        }
    });
  };

  const handleUpdateLeadType = () => {
    if (editingLeadType && editingLeadType.name.trim()) {
      setLocalSettings(prev => ({
        ...prev,
        leadTypes: prev.leadTypes.map(lt => lt.id === editingLeadType.id ? editingLeadType : lt)
      }));
      setEditingLeadType(null);
    }
  };

  const handleAddDealStage = () => {
    if (newDealStageName.trim()) {
      const newStage: CustomDealStage = { id: crypto.randomUUID(), name: newDealStageName.trim(), theme: 'gray' };
      setLocalSettings(prev => ({ ...prev, dealStages: [...prev.dealStages, newStage] }));
      setNewDealStageName('');
    }
  };
  
  const handleDeleteDealStage = (id: string, name: string) => {
    setToast({
        message: `Are you sure you want to delete the "${name}" deal stage?`,
        type: 'warning',
        confirmText: 'Delete',
        dismissText: 'Cancel',
        onConfirm: () => {
            setLocalSettings(prev => ({ ...prev, dealStages: prev.dealStages.filter(ds => ds.id !== id) }));
            setToast(null);
        }
    });
  };

  const handleUpdateDealStage = () => {
    if (editingDealStage && editingDealStage.name.trim()) {
      setLocalSettings(prev => ({
        ...prev,
        dealStages: prev.dealStages.map(ds => ds.id === editingDealStage.id ? editingDealStage : ds)
      }));
      setEditingDealStage(null);
    }
  };
  
  const handleAddCallOutcome = () => {
    if (newCallOutcomeName.trim()) {
      const newOutcome: CustomCallOutcome = { id: crypto.randomUUID(), name: newCallOutcomeName.trim() };
      setLocalSettings(prev => ({ ...prev, callOutcomes: [...prev.callOutcomes, newOutcome] }));
      setNewCallOutcomeName('');
    }
  };

  const handleDeleteCallOutcome = (id: string, name: string) => {
    setToast({
        message: `Are you sure you want to delete the "${name}" one-click update?`,
        type: 'warning',
        confirmText: 'Delete',
        dismissText: 'Cancel',
        onConfirm: () => {
            setLocalSettings(prev => ({ ...prev, callOutcomes: prev.callOutcomes.filter(co => co.id !== id) }));
            setToast(null);
        }
    });
  };

  const handleUpdateCallOutcome = () => {
    if (editingCallOutcome && editingCallOutcome.name.trim()) {
      setLocalSettings(prev => ({
        ...prev,
        callOutcomes: prev.callOutcomes.map(co => co.id === editingCallOutcome.id ? editingCallOutcome : co)
      }));
      setEditingCallOutcome(null);
    }
  };


  const handleDragSortDealStages = () => {
    if (dragDealStageItem.current === null || dragOverDealStageItem.current === null) return;
    const settingsCopy = { ...localSettings };
    const itemToMove = settingsCopy.dealStages[dragDealStageItem.current];
    settingsCopy.dealStages.splice(dragDealStageItem.current, 1);
    settingsCopy.dealStages.splice(dragOverDealStageItem.current, 0, itemToMove);
    dragDealStageItem.current = null;
    dragOverDealStageItem.current = null;
    setLocalSettings(settingsCopy);
  };
  
  const handleDragSortLeadTypes = () => {
    if (dragLeadTypeItem.current === null || dragOverLeadTypeItem.current === null) return;
    const settingsCopy = { ...localSettings };
    const itemToMove = settingsCopy.leadTypes[dragLeadTypeItem.current];
    settingsCopy.leadTypes.splice(dragLeadTypeItem.current, 1);
    settingsCopy.leadTypes.splice(dragOverLeadTypeItem.current, 0, itemToMove);
    dragLeadTypeItem.current = null;
    dragOverLeadTypeItem.current = null;
    setLocalSettings(settingsCopy);
  };
  
  const handleSaveSettings = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-brand-gray-light flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand-dark">Settings</h2>
          <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-500 hover:text-brand-dark" /></button>
        </div>
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Lead Types Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-dark border-b pb-2">Customize Lead Types</h3>
            <div className="space-y-2">
              {localSettings.leadTypes.map((lt, index) => (
                <div 
                    key={lt.id} 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-brand-gray-light rounded-md"
                    draggable
                    onDragStart={() => dragLeadTypeItem.current = index}
                    onDragEnter={() => dragOverLeadTypeItem.current = index}
                    onDragEnd={handleDragSortLeadTypes}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <div className="flex items-center space-x-2 flex-grow">
                        <DragHandleIcon className="w-5 h-5 text-gray-400 cursor-grab" />
                        {editingLeadType?.id === lt.id ? (
                            <input
                            type="text"
                            value={editingLeadType.name}
                            onChange={e => setEditingLeadType({...editingLeadType, name: e.target.value})}
                            onBlur={handleUpdateLeadType}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateLeadType()}
                            autoFocus
                            className="w-full px-2 py-1 border border-brand-blue rounded-md bg-white text-brand-dark"
                            />
                        ) : (
                            <span onClick={() => setEditingLeadType(lt)} className="text-brand-dark cursor-pointer flex-grow">{lt.name}</span>
                        )}
                    </div>
                  <div className="flex items-center space-x-2 pl-2">
                    <select
                        value={lt.theme}
                        onChange={(e) => setLocalSettings(prev => ({...prev, leadTypes: prev.leadTypes.map(type => type.id === lt.id ? {...type, theme: e.target.value} : type)}))}
                        className={`w-24 text-sm p-1 border border-brand-gray-medium rounded-md focus:ring-brand-blue focus:border-brand-blue capitalize bg-white ${LEAD_TYPE_THEMES[lt.theme]?.text || 'text-brand-dark'}`}
                    >
                        {Object.keys(LEAD_TYPE_THEMES).map(theme => (
                        <option key={theme} value={theme} className="capitalize bg-white text-black">{theme}</option>
                        ))}
                    </select>
                    <button onClick={() => handleDeleteLeadType(lt.id, lt.name)} className="text-gray-400 hover:text-brand-red"><TrashIcon className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 pt-2">
              <input 
                type="text"
                value={newLeadTypeName}
                onChange={e => setNewLeadTypeName(e.target.value)}
                placeholder="New lead type name"
                className="w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue"
              />
              <button onClick={handleAddLeadType} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Add</button>
            </div>
          </div>

          {/* Deal Stages Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-dark border-b pb-2">Customize Deal Stages</h3>
             <div className="space-y-2">
              {localSettings.dealStages.map((ds, index) => (
                <div 
                  key={ds.id} 
                  className="flex items-center justify-between px-3 py-2 bg-white border border-brand-gray-light rounded-md"
                  draggable
                  onDragStart={() => dragDealStageItem.current = index}
                  onDragEnter={() => dragOverDealStageItem.current = index}
                  onDragEnd={handleDragSortDealStages}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex items-center space-x-2 flex-grow">
                    <DragHandleIcon className="w-5 h-5 text-gray-400 cursor-grab" />
                    {editingDealStage?.id === ds.id ? (
                      <input
                        type="text"
                        value={editingDealStage.name}
                        onChange={e => setEditingDealStage({...editingDealStage, name: e.target.value})}
                        onBlur={handleUpdateDealStage}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateDealStage()}
                        autoFocus
                        className="w-full px-2 py-1 border border-brand-blue rounded-md bg-white text-brand-dark"
                      />
                    ) : (
                      <span onClick={() => setEditingDealStage(ds)} className="text-brand-dark cursor-pointer flex-grow">{ds.name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                     <select
                        value={ds.theme}
                        onChange={(e) => setLocalSettings(prev => ({...prev, dealStages: prev.dealStages.map(stage => stage.id === ds.id ? {...stage, theme: e.target.value} : stage)}))}
                        className={`w-24 text-sm p-1 border border-brand-gray-medium rounded-md focus:ring-brand-blue focus:border-brand-blue capitalize bg-white ${DEAL_STAGE_THEMES[ds.theme]?.text || 'text-brand-dark'}`}
                      >
                       {Object.keys(DEAL_STAGE_THEMES).map(theme => (
                         <option key={theme} value={theme} className="capitalize bg-white text-black">{theme}</option>
                       ))}
                      </select>
                    <button onClick={() => handleDeleteDealStage(ds.id, ds.name)} className="text-gray-400 hover:text-brand-red"><TrashIcon className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 pt-2">
              <input 
                type="text"
                value={newDealStageName}
                onChange={e => setNewDealStageName(e.target.value)}
                placeholder="New deal stage name"
                className="w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue"
              />
              <button onClick={handleAddDealStage} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Add</button>
            </div>
          </div>
          
           {/* Call Outcomes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-dark border-b pb-2">Customize One-Click Updates</h3>
            <div className="space-y-2">
              {localSettings.callOutcomes.map(co => (
                <div key={co.id} className="flex items-center justify-between px-3 py-2 bg-white border border-brand-gray-light rounded-md">
                  {editingCallOutcome?.id === co.id ? (
                     <input
                      type="text"
                      value={editingCallOutcome.name}
                      onChange={e => setEditingCallOutcome({...editingCallOutcome, name: e.target.value})}
                      onBlur={handleUpdateCallOutcome}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateCallOutcome()}
                      autoFocus
                      className="w-full px-2 py-1 border border-brand-blue rounded-md bg-white text-brand-dark"
                    />
                  ) : (
                    <span onClick={() => setEditingCallOutcome(co)} className="text-brand-dark cursor-pointer flex-grow">{co.name}</span>
                  )}
                  <div className="flex items-center space-x-2 pl-2">
                    <button onClick={() => handleDeleteCallOutcome(co.id, co.name)} className="text-gray-400 hover:text-brand-red"><TrashIcon className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 pt-2">
              <input 
                type="text"
                value={newCallOutcomeName}
                onChange={e => setNewCallOutcomeName(e.target.value)}
                placeholder="New outcome name"
                className="w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue"
              />
              <button onClick={handleAddCallOutcome} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Add</button>
            </div>
          </div>

        </div>
        <div className="p-4 border-t border-brand-gray-light flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleSaveSettings} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-600">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;