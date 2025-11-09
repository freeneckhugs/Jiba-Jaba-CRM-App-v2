import React, { useState } from 'react';
import { Contact, CustomLeadType, CustomDealStage } from '../types';
import { DEAL_STAGE_THEMES, LEAD_TYPE_THEMES } from '../constants';

interface NewContactModalProps {
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  leadTypes: CustomLeadType[];
  dealStages: CustomDealStage[];
}

const NewContactModal: React.FC<NewContactModalProps> = ({ onClose, onSave, leadTypes, dealStages }) => {
  const [contactData, setContactData] = useState<Partial<Contact>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    contactNote: '',
    notes: [],
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Clear the error message when the user starts filling the required field
    if (name === 'name' && value.trim() && error) {
        setError('');
    }
    setContactData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLeadTypeSelect = (typeName: string) => {
    setContactData(prev => ({ ...prev, leadType: typeName }));
  };
  
  const handleDealStageSelect = (stageName: string) => {
    setContactData(prev => ({ ...prev, dealStage: stageName }));
  };

  const handleSave = () => {
    if (!contactData.name || !contactData.name.trim()) {
      setError('Name is a required field.');
      return;
    }
    onSave(contactData);
    onClose();
  };
  
  const getDealStageStyle = (stage: CustomDealStage): string => {
    const theme = DEAL_STAGE_THEMES[stage.theme] || DEAL_STAGE_THEMES.gray;
    const isSelected = contactData.dealStage === stage.name;
    return isSelected
        ? `${theme.base} ${theme.text} ${theme.border}`
        : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100';
  }

  const getLeadTypeStyle = (type: CustomLeadType): string => {
    const theme = LEAD_TYPE_THEMES[type.theme] || LEAD_TYPE_THEMES.gray;
    const isSelected = contactData.leadType === type.name;
    return isSelected
        ? `${theme.base} ${theme.text} ${theme.border}`
        : 'bg-white text-brand-dark border-brand-gray-medium hover:bg-gray-100';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-brand-gray-light flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand-dark">Create New Contact</h2>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="name">Name <span className="text-red-500">*</span></label>
            <input type="text" id="name" name="name" value={contactData.name} onChange={handleChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="company">Company</label>
            <input type="text" id="company" name="company" value={contactData.company} onChange={handleChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="phone">Phone</label>
            <input type="text" id="phone" name="phone" value={contactData.phone} onChange={handleChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={contactData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark mb-2">Lead Type</label>
            <div className="flex flex-wrap gap-2">
                {leadTypes.map(type => (
                    <button
                        key={type.id}
                        onClick={() => handleLeadTypeSelect(type.name)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${getLeadTypeStyle(type)}`}
                    >
                        {type.name}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark mb-2">Deal Stage</label>
            <div className="flex flex-wrap gap-2">
                {dealStages.map(stage => (
                     <button
                        key={stage.id}
                        onClick={() => handleDealStageSelect(stage.name)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border-2 transition-colors ${getDealStageStyle(stage)}`}
                    >
                        {stage.name}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray-dark" htmlFor="contactNote">Contact Note</label>
            <textarea
              id="contactNote"
              name="contactNote"
              value={contactData.contactNote}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue"
              placeholder="A primary note for this contact..."
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="p-4 border-t border-brand-gray-light flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-600">
            Save Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewContactModal;