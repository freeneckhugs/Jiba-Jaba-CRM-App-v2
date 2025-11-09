import React, { useState } from 'react';
import { Contact } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (contacts: Partial<Contact>[]) => void;
}

const expectedHeaders = ['Name', 'Company', 'Phone', 'Email', 'Contact Note', 'Notes', 'Lead Type', 'Deal Stage'];

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'vcf' | 'json' | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [parsedContacts, setParsedContacts] = useState<Partial<Contact>[]>([]);
  const [error, setError] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = (selectedFile: File) => {
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      setFileType('csv');
      parseCsvFile(selectedFile);
    } else if (selectedFile.type === 'text/vcard' || selectedFile.type === 'text/x-vcard' || selectedFile.name.endsWith('.vcf')) {
      setFileType('vcf');
      parseVcfFile(selectedFile);
    } else if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
      setFileType('json');
      parseJsonFile(selectedFile);
    } else {
      setError('Please provide a valid .csv, .vcf, or .json file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      processFile(selectedFile);
    }
  };

  const parseCsvFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length > 0) {
            // Robust CSV header parsing
            const fileHeaders = (lines[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [])
                .map(h => h.trim().replace(/"/g, ''));
            
            setHeaders(fileHeaders);

            const parsedData = lines.slice(1).map(line => {
                // Robust CSV line parsing to handle commas within quoted fields
                const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [])
                    .map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

                return fileHeaders.reduce((obj, header, index) => {
                    obj[header] = values[index] || '';
                    return obj;
                }, {} as Record<string, string>);
            });

            setCsvData(parsedData);
            autoMapHeaders(fileHeaders);
        }
    };
    reader.readAsText(fileToParse);
  };

  const parseVcfFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        const unfoldedText = text.replace(/\r\n\s/g, '').replace(/\n\s/g, '');
        const vcards = unfoldedText.split('BEGIN:VCARD').slice(1);
        
        const contacts: Partial<Contact>[] = vcards.map(vcardText => {
            const contact: Partial<Contact> = {};
            const lines = vcardText.split(/\r\n|\n/).map(line => line.trim());

            let fullName = '', firstName = '', lastName = '', note = '';
            
            lines.forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) return;
                const keyPart = line.substring(0, colonIndex);
                const value = line.substring(colonIndex + 1);
                
                if (keyPart.startsWith('FN')) fullName = value;
                if (keyPart.startsWith('N')) {
                    const parts = value.split(';');
                    lastName = parts[0] || '';
                    firstName = parts[1] || '';
                }
                if (keyPart.startsWith('ORG')) contact.company = value.split(';')[0];
                if (keyPart.startsWith('TEL') && !contact.phone) contact.phone = value;
                if (keyPart.startsWith('EMAIL') && !contact.email) contact.email = value;
                if (keyPart.startsWith('NOTE')) note = value;
            });

            contact.name = (fullName || `${firstName} ${lastName}`).trim();
            // In VCF, the NOTE field is a single field, so we'll map it to the new contactNote.
            if (note) {
                contact.contactNote = note;
            }
            return contact;
        });

        const validContacts = contacts.filter(c => c.name && c.phone);
        setParsedContacts(validContacts);
        if (validContacts.length === 0) {
            setError('No valid contacts with both a name and phone number were found in the VCF file.');
        }
    };
    reader.readAsText(fileToParse);
  };

  const parseJsonFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        // Handle both an array of contacts and the app's own export format { contacts: [...] }
        const contactsArray = Array.isArray(data) ? data : data.contacts;

        if (!Array.isArray(contactsArray)) {
          throw new Error('JSON file is not in a recognized format (expected an array of contacts or an object with a "contacts" property).');
        }

        const validContacts = contactsArray.filter(c => c.name && c.phone);
        setParsedContacts(validContacts);

        if (validContacts.length === 0) {
            setError('No valid contacts with both a name and phone number were found in the JSON file.');
        }
      } catch (e: any) {
        setError(`Error parsing JSON file: ${e.message}`);
      }
    };
    reader.readAsText(fileToParse);
  };

  const autoMapHeaders = (fileHeaders: string[]) => {
    const newMapping: Record<string, string> = {};
    const headerAliases: Record<string, string[]> = {
      'Name': ['name', 'full name', 'contact name', 'given name'],
      'Company': ['company', 'organization 1 - name', 'organization', 'workplace'],
      'Phone': ['phone 1 - value', 'phone', 'mobile', 'cell', 'primary phone'],
      'Email': ['e-mail 1 - value', 'email 1 - value', 'email', 'e-mail', 'email address', 'primary email'],
      'Notes': ['notes', 'note history', 'history', 'comments'],
      'Contact Note': ['contact note', 'note', 'description', 'primary note'],
      'Lead Type': ['lead type', 'type', 'category', 'group membership'],
      'Deal Stage': ['deal stage', 'stage', 'status'],
    };

    expectedHeaders.forEach(expected => {
      const aliases = headerAliases[expected] || [expected.toLowerCase()];
      let foundHeader: string | undefined = undefined;
      for (const alias of aliases) {
        const matchingFileHeader = fileHeaders.find(h => h.toLowerCase().trim() === alias);
        if (matchingFileHeader) {
          foundHeader = matchingFileHeader;
          break;
        }
      }
      if (!foundHeader) {
          const partialMatch = fileHeaders.find(h => h.toLowerCase().includes(expected.toLowerCase()));
          if(partialMatch) foundHeader = partialMatch;
      }
      newMapping[expected] = foundHeader || 'unmapped';
    });
    setMapping(newMapping);
  };

  const handleMappingChange = (expectedHeader: string, fileHeader: string) => {
    setMapping(prev => ({ ...prev, [expectedHeader]: fileHeader }));
  };

  const handleImportClick = () => {
    if (fileType === 'vcf' || fileType === 'json') {
        if (parsedContacts.length === 0) {
            setError('No valid contacts to import.');
            return;
        }
        onImport(parsedContacts);
        onClose();
        return;
    }

    if (fileType === 'csv') {
        if (csvData.length === 0) {
          setError('No data to import.');
          return;
        }
        const newContacts: Partial<Contact>[] = csvData.map(row => {
          const contact: Partial<Contact> = {};
          Object.keys(mapping).forEach(expected => {
            const actual = mapping[expected];
            if (actual && actual !== 'unmapped' && row[actual]) {
              const value = row[actual];
              const key = expected.toLowerCase().replace(/\s/g, ''); // 'lead type' -> 'leadtype'
              
              if (key === 'notes') {
                contact.notes = [{ id: crypto.randomUUID(), text: value, timestamp: Date.now(), type: 'note' }];
              } else if (key in { name:1, company:1, phone:1, email:1, contactnote: 1, leadtype: 1, dealstage:1 }) {
                 (contact as any)[key] = value;
              }
            }
          });
          return contact;
        }).filter(c => c.name && c.phone);

        if (newContacts.length === 0) {
            setError('Validation failed. Ensure "Name" and "Phone" fields are mapped and not empty.');
            return;
        }
        onImport(newContacts);
        onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      setFile(droppedFile);
      setError('');
      processFile(droppedFile);
    }
  };

  const renderContent = () => {
    if (!file) {
      return (
         <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${isDraggingOver ? 'border-brand-blue bg-blue-50' : 'border-brand-gray-medium'}`}
          >
            {isDraggingOver ? (
              <p className="text-brand-blue font-semibold">Drop file here to import.</p>
            ) : (
              <>
                <p className="mb-4 text-brand-dark text-center">Drag & drop a CSV, VCF, or JSON file here, or click to upload.</p>
                <input type="file" accept=".csv,.vcf,.json" onChange={handleFileChange} className="block w-full text-sm text-brand-dark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"/>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </>
            )}
          </div>
      );
    }

    if (fileType === 'vcf' || fileType === 'json') {
        const fileTypeName = fileType === 'vcf' ? 'VCF' : 'JSON';
        return (
            <div>
                <h3 className="text-lg font-medium mb-4 text-brand-dark">Import from {fileTypeName} File</h3>
                {parsedContacts.length > 0 ? (
                    <>
                        <p className="text-sm text-brand-gray-dark mb-4">
                            Successfully parsed your {fileTypeName} file. Found {parsedContacts.length} new contacts ready to be imported.
                        </p>
                        <div className="max-h-60 overflow-y-auto border border-brand-gray-light rounded-md p-2 bg-gray-50">
                            <ul className="list-disc list-inside text-sm text-brand-dark">
                                {parsedContacts.slice(0, 10).map((c, i) => <li key={i}>{c.name}</li>)}
                                {parsedContacts.length > 10 && <li>...and {parsedContacts.length - 10} more.</li>}
                            </ul>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-brand-gray-dark mb-4">
                        Could not find any valid contacts in this file. Please check the file and try again.
                    </p>
                )}
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        );
    }

    if (fileType === 'csv') {
      return (
          <div>
            <h3 className="text-lg font-medium mb-4 text-brand-dark">Map Columns</h3>
            <p className="text-sm text-brand-gray-dark mb-4">
              Your file's columns don't have to match perfectly. Match the columns from your file (right) to the CRM fields (left). We've made our best guess for you.
            </p>
            <div className="space-y-3">
              {expectedHeaders.map(expected => (
                <div key={expected} className="grid grid-cols-2 gap-4 items-center">
                  <label className="font-semibold text-brand-dark">{expected}:</label>
                  <select
                    value={mapping[expected] || 'unmapped'}
                    onChange={(e) => handleMappingChange(expected, e.target.value)}
                    className="w-full p-2 border border-brand-gray-medium rounded-md bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="unmapped">-- Do not import --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
      );
    }
    return null;
  }

  const getImportButtonText = () => {
    if (fileType === 'csv' && csvData.length > 0) return `Import ${csvData.length} Contacts`;
    if ((fileType === 'vcf' || fileType === 'json') && parsedContacts.length > 0) return `Import ${parsedContacts.length} Contacts`;
    return 'Import';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-brand-gray-light flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand-dark">Import Contacts</h2>
        </div>
        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>
        <div className="p-4 border-t border-brand-gray-light flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300">Cancel</button>
          <button 
            onClick={handleImportClick} 
            disabled={!file}
            className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
            {getImportButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;