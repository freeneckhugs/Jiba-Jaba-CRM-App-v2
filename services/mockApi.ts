import { Contact, FollowUp, Note, AppSettings } from '../types';

let dbContacts: Contact[] = [];
let dbFollowUps: FollowUp[] = [];
let dbSettings: AppSettings | null = null;

const SIMULATED_LATENCY = 300; // ms

const getDefaultSettings = (): AppSettings => ({
  leadTypes: [
    { id: '1', name: 'FSBO', theme: 'red' },
    { id: '2', name: 'Buyer', theme: 'blue' },
    { id: '3', name: 'Tenant', theme: 'green' },
    { id: '4', name: 'Seller', theme: 'purple' },
    { id: '5', name: 'Landlord', theme: 'orange' },
    { id: '6', name: 'Investor', theme: 'yellow' },
    { id: '7', name: 'Developer', theme: 'gray' },
    { id: '8', name: 'Client', theme: 'pink' },
  ],
  dealStages: [
    { id: 's1', name: 'Research', theme: 'gray' },
    { id: 's2', name: 'Showings', theme: 'blue' },
    { id: 's3', name: 'LOI', theme: 'yellow' },
    { id: 's4', name: 'Contract', theme: 'orange' },
    { id: 's5', name: 'CCO', theme: 'green' },
  ],
  callOutcomes: [
    { id: 'co1', name: 'Made Contact Nudged' },
    { id: 'co2', name: 'Made Contact Not Interested' },
    { id: 'co3', name: 'No Answer' },
    { id: 'co4', name: 'Call went to VM' },
    { id: 'co5', name: 'Texted Instead' },
    { id: 'co6', name: 'Bad Number' },
  ],
});

const generateInitialFollowUps = (contacts: Contact[]): FollowUp[] => {
    const followUps: FollowUp[] = [];
    // Use contacts that are not in the initial deal flow for a cleaner demo
    const contactsToUse = contacts.slice(50, 110); // Increased from 30 to 60

    contactsToUse.forEach((contact, index) => {
        const dueDate = new Date();
        dueDate.setHours(0, 0, 0, 0);

        if (index < 20) { // Overdue
            dueDate.setDate(dueDate.getDate() - (index + 2)); 
        } else if (index < 40) { // Upcoming soon
            dueDate.setDate(dueDate.getDate() + (index - 20)); 
        } else { // Further out
            dueDate.setDate(dueDate.getDate() + (index - 20));
        }

        followUps.push({
            contactId: contact.id,
            dueDate: dueDate.getTime(),
            completed: false,
        });
    });
    return followUps;
};


const generateInitialContacts = (settings: AppSettings): Contact[] => {
    return Array.from({ length: 250 }, (_, i) => {
        const firstNames = ['John', 'Jane', 'Sam', 'Alice', 'Bob', 'Chris', 'Patty', 'Mike'];
        const lastNames = ['Doe', 'Smith', 'Wilson', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller'];
        const companies = ['FSBO Corp', 'Property Management Inc.', 'SRE Solutions', 'Closing Funnel LLC', 'Research Partners', 'Global Real Estate', 'Tenant Finders', 'Investor Group'];
        const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]} #${i + 1}`;
        
        const hasDealStage = i < 40; // Put first 40 contacts into deal flow stages
        const dealStageIndex = hasDealStage ? Math.floor(i / 8) % settings.dealStages.length : -1;

        let notes: Note[] = [];
        if (name === 'John Doe #1') {
            notes = Array.from({ length: 50 }, (_, j) => ({
                id: `jd1-note-${j}`,
                text: `This is historical note number ${j + 1} for John Doe. This note is here to test the scrolling functionality of the note history panel. Each note has slightly different text to make them unique.`,
                timestamp: Date.now() - 86400000 * (j + 1), // spread notes out over 50 days
                type: j % 5 === 0 ? 'outcome' : 'note', // mix up note types
            }));
        } else if (i % 3 === 0) {
            notes = [{ id: `n${i}`, text: `Initial contact note for user #${i+1}.`, timestamp: Date.now() - 86400000 * i, type: 'note' }];
        }


        return {
            id: `${i + 1}`,
            name: name,
            company: companies[i % companies.length],
            phone: `${Math.floor(100 + Math.random() * 900)}-555-${String(i + 1).padStart(4, '0')}`,
            email: `${name.replace(/ /g, '.').toLowerCase()}@example.com`,
            leadType: settings.leadTypes[i % settings.leadTypes.length]?.name,
            dealStage: hasDealStage ? settings.dealStages[dealStageIndex]?.name : undefined,
            contactNote: i % 4 === 0 ? `This is the primary, persistent contact note for ${name}. It contains key at-a-glance info.` : undefined,
            subjectProperty: hasDealStage ? `123 Main St, Anytown #${i + 1}` : undefined,
            requirements: hasDealStage ? `Looking for 5,000 sqft warehouse space.` : undefined,
            notes,
            lastActivity: Date.now() - 86400000 * i,
        };
    });
};

export const initializeData = () => {
    const storedSettings = localStorage.getItem('crm_settings_v1');
    if (storedSettings) {
        dbSettings = JSON.parse(storedSettings);
    } else {
        dbSettings = getDefaultSettings();
        localStorage.setItem('crm_settings_v1', JSON.stringify(dbSettings));
    }
    
    // Add new settings fields if they don't exist
    if (dbSettings && !dbSettings.callOutcomes) {
      const defaultSettings = getDefaultSettings();
      dbSettings.callOutcomes = defaultSettings.callOutcomes;
      localStorage.setItem('crm_settings_v1', JSON.stringify(dbSettings));
    }

    const storedContacts = localStorage.getItem('crm_contacts_v3_paged');
    const storedFollowUps = localStorage.getItem('crm_followups_v3_paged');
    
    if (storedContacts) {
        dbContacts = JSON.parse(storedContacts);
    } else {
        dbContacts = generateInitialContacts(dbSettings);
        localStorage.setItem('crm_contacts_v3_paged', JSON.stringify(dbContacts));
    }

    if (storedFollowUps) {
        dbFollowUps = JSON.parse(storedFollowUps);
    } else {
        dbFollowUps = generateInitialFollowUps(dbContacts);
        localStorage.setItem('crm_followups_v3_paged', JSON.stringify(dbFollowUps));
    }
};

const saveData = () => {
    localStorage.setItem('crm_contacts_v3_paged', JSON.stringify(dbContacts));
    localStorage.setItem('crm_followups_v3_paged', JSON.stringify(dbFollowUps));
    localStorage.setItem('crm_settings_v1', JSON.stringify(dbSettings));
};

// --- Settings API ---
export const getSettings = (): Promise<AppSettings> => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (!dbSettings) {
                dbSettings = getDefaultSettings();
            }
            // Ensure settings are complete
            if (!dbSettings.callOutcomes) {
              const defaultSettings = getDefaultSettings();
              dbSettings.callOutcomes = defaultSettings.callOutcomes;
            }
            resolve(JSON.parse(JSON.stringify(dbSettings)));
        }, SIMULATED_LATENCY / 2);
    });
};

export const updateSettings = (newSettings: AppSettings): Promise<AppSettings> => {
    return new Promise(resolve => {
        setTimeout(() => {
            dbSettings = newSettings;
            saveData();
            resolve(JSON.parse(JSON.stringify(dbSettings)));
        }, SIMULATED_LATENCY);
    });
};

export const fetchAllContacts = (): Promise<Contact[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(dbContacts)));
        }, SIMULATED_LATENCY / 2);
    });
};


// --- API Functions ---

interface FetchParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    filter?: string | null;
    dealStageFilter?: string | null;
    sortOrder?: 'activity' | 'firstName' | 'lastName';
}

export const fetchContacts = (params: FetchParams): Promise<{ contacts: Contact[], totalCount: number }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            let results = [...dbContacts];

            // Filtering by Lead Type
            if (params.filter) {
                results = results.filter(c => c.leadType === params.filter);
            }

            // Filtering by Deal Stage
            if (params.dealStageFilter) {
                results = results.filter(c => c.dealStage === params.dealStageFilter);
            }

            // Searching
            if (params.searchTerm) {
                const term = params.searchTerm.toLowerCase();
                results = results.filter(c => 
                    c.name.toLowerCase().includes(term) ||
                    (c.company && c.company.toLowerCase().includes(term)) ||
                    c.phone.includes(term)
                );
            }
            
            // Sorting
            results.sort((a, b) => {
                switch (params.sortOrder) {
                    case 'firstName':
                        return a.name.localeCompare(b.name);
                    case 'lastName':
                        const aLast = a.name.split(' ').pop() || '';
                        const bLast = b.name.split(' ').pop() || '';
                        return aLast.localeCompare(bLast);
                    case 'activity':
                    default:
                        return b.lastActivity - a.lastActivity;
                }
            });

            const totalCount = results.length;

            // Pagination
            if (params.limit && params.limit > 0 && params.page) {
                const start = (params.page - 1) * params.limit;
                const end = start + params.limit;
                results = results.slice(start, end);
            }
            
            resolve({ contacts: results, totalCount });
        }, SIMULATED_LATENCY);
    });
};

export const getContactById = (id: string): Promise<Contact | undefined> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(dbContacts.find(c => c.id === id));
        }, SIMULATED_LATENCY / 2);
    });
};

export const updateContact = (id: string, updatedData: Partial<Contact>): Promise<Contact | null> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const index = dbContacts.findIndex(c => c.id === id);
            if (index > -1) {
                dbContacts[index] = { ...dbContacts[index], ...updatedData };
                saveData();
                resolve(dbContacts[index]);
            } else {
                resolve(null);
            }
        }, SIMULATED_LATENCY);
    });
};

export const updateAllContacts = (newContacts: Contact[]): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            dbContacts = newContacts;
            saveData();
            resolve();
        }, SIMULATED_LATENCY);
    });
};

export const createContact = (newContactData: Partial<Contact>): Promise<Contact> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newContact: Contact = {
                id: crypto.randomUUID(),
                name: newContactData.name || 'Unknown',
                company: newContactData.company || '',
                phone: newContactData.phone || '',
                email: newContactData.email || '',
                leadType: newContactData.leadType,
                dealStage: newContactData.dealStage,
                contactNote: newContactData.contactNote,
                subjectProperty: newContactData.subjectProperty,
                requirements: newContactData.requirements,
                notes: newContactData.notes || [],
                lastActivity: Date.now(),
            };
            dbContacts.unshift(newContact); // Add to the top for activity sort
            saveData();
            resolve(newContact);
        }, SIMULATED_LATENCY);
    });
};

export const deleteContact = (id: string): Promise<boolean> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const initialLength = dbContacts.length;
            dbContacts = dbContacts.filter(c => c.id !== id);
            if (dbContacts.length < initialLength) {
                saveData();
                resolve(true);
            } else {
                resolve(false);
            }
        }, SIMULATED_LATENCY);
    });
};

export const addNote = (contactId: string, noteText: string, type: Note['type'] = 'note'): Promise<Contact | null> => {
    return new Promise(resolve => {
        const index = dbContacts.findIndex(c => c.id === contactId);
        if (index > -1) {
            const newNote: Note = { id: crypto.randomUUID(), text: noteText, timestamp: Date.now(), type };
            dbContacts[index].notes.unshift(newNote);
            dbContacts[index].lastActivity = Date.now();
            saveData();
            resolve(dbContacts[index]);
        } else {
            resolve(null);
        }
    });
};

export const importContacts = (newContactsData: Partial<Contact>[]): Promise<number> => {
    return new Promise(resolve => {
        // **FIX:** Allow duplicates to be imported so the merge function can process them.
        const importedContacts: Contact[] = newContactsData.map(nc => ({
            id: crypto.randomUUID(),
            name: nc.name || 'Unknown',
            company: nc.company || '',
            phone: nc.phone || '',
            email: nc.email || '',
            leadType: nc.leadType,
            dealStage: nc.dealStage,
            contactNote: nc.contactNote,
            notes: nc.notes || [],
            lastActivity: Date.now(),
        }));
        
        dbContacts = [...importedContacts, ...dbContacts];
        saveData();
        resolve(importedContacts.length);
    });
};

// Action tracking
export const canPerformAction = (contactId: string, actionKey: string): Promise<boolean> => {
    return new Promise(resolve => {
        const contact = dbContacts.find(c => c.id === contactId);
        if (!contact) return resolve(false);

        const lastActionTimestamp = contact.lastActionTimestamps?.[actionKey];
        if (!lastActionTimestamp) return resolve(true);

        const lastActionDate = new Date(lastActionTimestamp).toDateString();
        const todayDate = new Date().toDateString();
        resolve(lastActionDate !== todayDate);
    });
};

export const recordAction = (contactId: string, actionKey: string): Promise<void> => {
    return new Promise(resolve => {
        const index = dbContacts.findIndex(c => c.id === contactId);
        if (index > -1) {
            if (!dbContacts[index].lastActionTimestamps) {
                dbContacts[index].lastActionTimestamps = {};
            }
            dbContacts[index].lastActionTimestamps![actionKey] = Date.now();
            saveData();
        }
        resolve();
    });
};


// Follow-ups
export const fetchFollowUps = (): Promise<FollowUp[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...dbFollowUps]), SIMULATED_LATENCY / 2));
};

export const scheduleFollowUp = (contactId: string, days: number | null): Promise<FollowUp[]> => {
    return new Promise(resolve => {
        const existingIndex = dbFollowUps.findIndex(f => f.contactId === contactId);
        if (days === null) { // "Don't call again"
            if (existingIndex > -1) {
                dbFollowUps.splice(existingIndex, 1);
            }
        } else {
            const dueDate = new Date();
            dueDate.setHours(0, 0, 0, 0);
            dueDate.setDate(dueDate.getDate() + days);
            const newFollowUp: FollowUp = { contactId, dueDate: dueDate.getTime(), completed: false };

            if (existingIndex > -1) {
                dbFollowUps[existingIndex] = newFollowUp;
            } else {
                dbFollowUps.push(newFollowUp);
            }
        }
        saveData();
        resolve([...dbFollowUps]);
    });
};

export const markFollowUpDone = (contactId: string): Promise<FollowUp[]> => {
    return new Promise(resolve => {
        const index = dbFollowUps.findIndex(f => f.contactId === contactId && !f.completed);
        if (index > -1) {
            dbFollowUps[index].completed = true;
            saveData();
        }
        resolve([...dbFollowUps]);
    });
};

export const deleteAllContacts = (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            dbContacts = [];
            dbFollowUps = [];
            saveData();
            resolve();
        }, SIMULATED_LATENCY);
    });
};

export const findAndMergeDuplicates = (): Promise<number> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const contactsByPhone = new Map<string, Contact[]>();
            const contactsWithoutPhone: Contact[] = [];
            
            dbContacts.forEach(contact => {
                // **FIX:** Normalize phone numbers by removing all non-digit characters.
                const normalizedPhone = contact.phone ? contact.phone.replace(/\D/g, '') : '';
                
                if (normalizedPhone) {
                    if (!contactsByPhone.has(normalizedPhone)) {
                        contactsByPhone.set(normalizedPhone, []);
                    }
                    contactsByPhone.get(normalizedPhone)!.push(contact);
                } else {
                    contactsWithoutPhone.push(contact);
                }
            });

            const dedupedContacts: Contact[] = [];
            let mergedCount = 0;

            for (const contactGroup of contactsByPhone.values()) {
                if (contactGroup.length <= 1) {
                    dedupedContacts.push(...contactGroup);
                    continue;
                }

                // Sort by most recent activity to find the master record
                contactGroup.sort((a, b) => b.lastActivity - a.lastActivity);
                
                const masterContact = { ...contactGroup[0] }; // Create a copy to modify
                const duplicates = contactGroup.slice(1);

                const allNotes: Note[] = [...masterContact.notes];

                duplicates.forEach(dup => {
                    allNotes.push(...dup.notes);
                    const mergeNote: Note = {
                        id: crypto.randomUUID(),
                        text: `Merged with duplicate contact: ${dup.name} (${dup.phone})`,
                        timestamp: Date.now(),
                        type: 'system',
                    };
                    allNotes.push(mergeNote);
                    mergedCount++;
                });

                // Sort all notes chronologically (newest first)
                allNotes.sort((a, b) => b.timestamp - a.timestamp);
                
                masterContact.notes = allNotes;
                dedupedContacts.push(masterContact);
            }
            
            dbContacts = [...dedupedContacts, ...contactsWithoutPhone];
            saveData();
            
            resolve(mergedCount);

        }, SIMULATED_LATENCY * 2);
    });
};

// Exports
export const exportData = (): Promise<{ contacts: Contact[], followUps: FollowUp[], settings: AppSettings | null }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ contacts: dbContacts, followUps: dbFollowUps, settings: dbSettings });
        }, SIMULATED_LATENCY * 2); // Longer for "big" export
    });
};